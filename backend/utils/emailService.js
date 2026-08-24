const nodemailer = require("nodemailer");

function emailConfigured() {
  const user = String(process.env.EMAIL_USER || "").trim();
  const password = String(process.env.EMAIL_PASS || "").replace(/\s/g, "");
  return Boolean(
    process.env.EMAIL_HOST &&
    user &&
    password &&
    user !== "youraddress@gmail.com" &&
    password !== "your_16_character_gmail_app_password"
  );
}

function getFromAddress() {
  const configured = String(process.env.EMAIL_FROM || "").trim();
  if (configured && !configured.includes("youraddress@gmail.com")) return configured;
  return `Complaint Analyzer System <${String(process.env.EMAIL_USER || "").trim()}>`;
}

function escapeEmailHtml(value) {
  return String(value || "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: String(process.env.EMAIL_SECURE || "false") === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: String(process.env.EMAIL_PASS || "").replace(/\s/g, "")
    }
  });
}

async function sendPasswordResetEmail({ to, resetLink, userType }) {
  if (!emailConfigured()) {
    return { sent: false, reason: "SMTP email variables are not configured in .env" };
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject: "Complaint Analyzer System - Password Reset",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1e293b;">
        <h2>Complaint Analyzer System</h2>
        <p>Hello ${userType},</p>
        <p>You requested a password reset.</p>
        <p><a href="${resetLink}" style="background:#2563eb;color:white;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold;">Reset Password</a></p>
        <p>This link expires in 15 minutes.</p>
        <p>If you did not request this, ignore this email.</p>
      </div>
    `
  });

  return { sent: true };
}

async function sendEmailVerificationCode({ to, code }) {
  if (!emailConfigured()) {
    return { sent: false, reason: "Email delivery is not configured" };
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject: "Complaint Analyzer System - Verify Your Email",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1e293b;">
        <h2>Verify your Gmail address</h2>
        <p>Your verification code is:</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:6px;">${code}</p>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not request this code, ignore this email.</p>
      </div>
    `
  });
  return { sent: true };
}

async function sendWelcomeEmail({ to, fullName, registrationNo }) {
  if (!emailConfigured()) {
    return { sent: false, reason: "Email delivery is not configured" };
  }

  const transporter = createTransporter();
  const appBaseUrl = String(process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, "");
  await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject: "Welcome to the Complaint Analyzer System",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1e293b;max-width:620px;margin:auto;">
        <h2>Welcome, ${escapeEmailHtml(fullName)}!</h2>
        <p>Your student account has been created successfully.</p>
        <p><strong>Registration number:</strong> ${escapeEmailHtml(registrationNo)}</p>
        <p>You can now submit complaints, attach evidence, track progress, receive notifications, and use the AI Complaint Assistant.</p>
        <p><a href="${appBaseUrl}/user/login.html" style="background:#2563eb;color:white;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">Open Student Portal</a></p>
        <p>For your security, never share your password or verification code.</p>
      </div>
    `
  });
  return { sent: true };
}

module.exports = { sendPasswordResetEmail, sendEmailVerificationCode, sendWelcomeEmail, emailConfigured };
