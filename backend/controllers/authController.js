const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const generateToken = require("../utils/generateToken");
const User = require("../models/userModel");
const Admin = require("../models/adminModel");
const PasswordReset = require("../models/passwordResetModel");
const EmailVerification = require("../models/emailVerificationModel");
const { sendPasswordResetEmail, sendEmailVerificationCode, sendWelcomeEmail } = require("../utils/emailService");

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidGmail(value) {
  return /^[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@gmail\.com$/.test(value);
}

function normalizeRegistrationNumber(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

function isValidRegistrationNumber(value) {
  return /^[A-Z0-9][A-Z0-9/-]{2,49}$/.test(value);
}

function hashVerificationCode(email, code) {
  return crypto.createHmac("sha256", process.env.JWT_SECRET || "complaint_secret").update(`${email}:${code}`).digest("hex");
}

function isStudentEmailVerificationRequired() {
  return String(process.env.REQUIRE_EMAIL_VERIFICATION || "false") === "true";
}

function getStudentVerificationConfig(req, res) {
  return res.json({ success: true, verificationRequired: isStudentEmailVerificationRequired() });
}

async function sendStudentVerificationCode(req, res) {
  try {
    if (!isStudentEmailVerificationRequired()) {
      return res.status(400).json({ success: false, message: "Email verification is currently disabled. You can create your account without a code" });
    }
    const email = normalizeEmail(req.body.email);
    if (!isValidGmail(email)) return res.status(400).json({ success: false, message: "Please enter a valid Gmail address" });
    if (await User.findUserByEmail(email)) return res.status(409).json({ success: false, message: "This Gmail address is already registered" });

    const previous = await EmailVerification.findByEmail(email);
    if (previous && Date.now() - new Date(previous.last_sent_at).getTime() < 60000) {
      return res.status(429).json({ success: false, message: "Please wait one minute before requesting another code" });
    }

    const code = String(crypto.randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await EmailVerification.saveCode(email, hashVerificationCode(email, code), expiresAt);

    const delivery = await sendEmailVerificationCode({ to: email, code });
    if (!delivery.sent) {
      await EmailVerification.remove(email);
      return res.status(503).json({ success: false, message: "Email verification is not configured. Add Gmail SMTP settings to the server .env file" });
    }

    return res.json({ success: true, message: "Verification code sent. Check your Gmail inbox and spam folder" });
  } catch (error) {
    const email = normalizeEmail(req.body.email);
    if (email) await EmailVerification.remove(email).catch(() => {});
    console.error("Email verification delivery failed:", error);
    return res.status(502).json({ success: false, message: "Unable to send the verification email. Check the Gmail address and try again" });
  }
}

async function registerStudent(req, res) {
  try {
    const full_name = String(req.body.full_name || "").trim();
    const registration_no = normalizeRegistrationNumber(req.body.registration_no);
    const password = String(req.body.password || "");
    const verificationCode = String(req.body.verification_code || "").trim();
    const email = normalizeEmail(req.body.email);
    if (!full_name || !email || !registration_no || !password) return res.status(400).json({ success: false, message: "All fields are required" });
    if (!isValidGmail(email)) return res.status(400).json({ success: false, message: "Please enter a valid Gmail address, for example student@gmail.com" });
    if (!isValidRegistrationNumber(registration_no)) return res.status(400).json({ success: false, message: "Enter a valid university registration number using letters, numbers, hyphens, or slashes" });
    if (isStudentEmailVerificationRequired() && !/^\d{6}$/.test(verificationCode)) return res.status(400).json({ success: false, message: "Enter the 6-digit code sent to your Gmail address" });
    if (password.length < 6) return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });

    if (await User.findUserByEmail(email)) return res.status(409).json({ success: false, message: "Email already exists" });
    if (User.findUserByReg && await User.findUserByReg(registration_no)) return res.status(409).json({ success: false, message: "Registration number already exists" });

    if (isStudentEmailVerificationRequired()) {
      const verification = await EmailVerification.findByEmail(email);
      if (!verification || new Date(verification.expires_at).getTime() <= Date.now()) {
        return res.status(400).json({ success: false, message: "Verification code is missing or expired. Request a new code" });
      }
      if (Number(verification.attempts) >= 5) {
        return res.status(429).json({ success: false, message: "Too many incorrect attempts. Request a new verification code" });
      }
      const suppliedHash = hashVerificationCode(email, verificationCode);
      const expected = Buffer.from(verification.code_hash, "hex");
      const supplied = Buffer.from(suppliedHash, "hex");
      if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
        await EmailVerification.incrementAttempts(email);
        return res.status(400).json({ success: false, message: "Incorrect verification code" });
      }
    }

    const password_hash = await bcrypt.hash(password, 10);
    const userId = await User.createUser({ full_name, email, registration_no, password_hash });
    await EmailVerification.remove(email);
    const token = generateToken({ id: userId, role: "student" });

    let welcomeEmailSent = false;
    try {
      const welcomeDelivery = await sendWelcomeEmail({ to: email, fullName: full_name, registrationNo: registration_no });
      welcomeEmailSent = welcomeDelivery.sent;
    } catch (emailError) {
      console.error("Welcome email delivery failed:", emailError.message);
    }

    return res.status(201).json({ success: true, message: "Student registered successfully", welcomeEmailSent, token, user: { user_id: userId, full_name, email, registration_no, role: "student" } });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const field = String(error.message || "").includes("registration_no") ? "registration number" : "email address";
      return res.status(409).json({ success: false, message: `An account already exists with this ${field}` });
    }
    console.error("Student registration failed:", error);
    return res.status(500).json({ success: false, message: "Registration failed" });
  }
}

async function loginStudent(req, res) {
  try {
    const rawIdentity = String(req.body.identity || "").trim();
    const identity = rawIdentity.includes("@") ? rawIdentity.toLowerCase() : normalizeRegistrationNumber(rawIdentity);
    const password = String(req.body.password || "");
    if (!identity || !password) return res.status(400).json({ success: false, message: "Identity and password are required" });
    if (identity.includes("@") && !isValidGmail(identity.toLowerCase())) return res.status(400).json({ success: false, message: "Please use the valid Gmail address registered with your student account" });
    if (!identity.includes("@") && !isValidRegistrationNumber(identity)) return res.status(400).json({ success: false, message: "Please enter a valid university registration number" });
    const user = await User.findUserByEmailOrReg(identity);
    if (!user) return res.status(401).json({ success: false, message: "Invalid login credentials" });
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid login credentials" });
    const token = generateToken({ id: user.user_id, role: "student" });
    return res.json({ success: true, message: "Student login successful", token, user: { user_id: user.user_id, full_name: user.full_name, email: user.email, registration_no: user.registration_no, role: user.role } });
  } catch (error) {
    console.error("Student login failed:", error);
    return res.status(500).json({ success: false, message: "Login failed" });
  }
}

async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password are required" });
    const admin = await Admin.findAdminByEmail(email);
    if (!admin) return res.status(401).json({ success: false, message: "Invalid admin credentials" });
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid admin credentials" });
    const token = generateToken({ id: admin.admin_id, role: admin.role || "admin" });
    return res.json({ success: true, message: "Admin login successful", token, admin: { admin_id: admin.admin_id, full_name: admin.full_name, email: admin.email, role: admin.role } });
  } catch (error) {
    console.error("Admin login failed:", error);
    return res.status(500).json({ success: false, message: "Admin login failed" });
  }
}

async function requestPasswordReset(req, res) {
  try {
    const { email, userType } = req.body;
    const normalizedType = userType === "Admin" || userType === "admin" ? "admin" : "student";
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const account = normalizedType === "student" ? await User.findUserByEmail(email) : await Admin.findAdminByEmail(email);

    // Always return the same response so this endpoint cannot be used to enumerate accounts.
    if (!account) {
      return res.json({
        success: true,
        message: "If the account exists, a password reset link will be sent shortly."
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await PasswordReset.createResetToken({ email, user_type: normalizedType, reset_token: resetToken, expires_at: expiresAt });

    const resetPath = normalizedType === "student" ? `/user/reset-password.html?token=${resetToken}&type=student` : `/admin/reset-password.html?token=${resetToken}&type=admin`;
    const appBaseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const fullResetLink = `${appBaseUrl}${resetPath}`;
    let emailResult = { sent: false };
    try {
      emailResult = await sendPasswordResetEmail({ to: email, resetLink: fullResetLink, userType: normalizedType });
    } catch (emailError) {
      console.error("Password reset email delivery failed:", emailError);
    }

    return res.json({
      success: true,
      message: "If the account exists, a password reset link will be sent shortly.",
      emailSent: emailResult.sent
    });
  } catch (error) {
    console.error("Password reset request failed:", error);
    return res.status(500).json({ success: false, message: "Password reset request failed" });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, userType, newPassword } = req.body;
    const normalizedType = userType === "Admin" || userType === "admin" ? "admin" : "student";
    if (!token || !newPassword) return res.status(400).json({ success: false, message: "Token and new password are required" });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });

    const resetRecord = await PasswordReset.findValidResetToken(token, normalizedType);
    if (!resetRecord) return res.status(400).json({ success: false, message: "Reset token is invalid, expired, or already used" });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    if (normalizedType === "student") await User.updateUserPasswordByEmail(resetRecord.email, passwordHash);
    else await Admin.updateAdminPasswordByEmail(resetRecord.email, passwordHash);
    await PasswordReset.markTokenUsed(token);

    return res.json({ success: true, message: "Password reset successfully. You can now login with your new password." });
  } catch (error) {
    console.error("Password reset failed:", error);
    return res.status(500).json({ success: false, message: "Password reset failed" });
  }
}

module.exports = { getStudentVerificationConfig, sendStudentVerificationCode, registerStudent, loginStudent, loginAdmin, requestPasswordReset, resetPassword };
