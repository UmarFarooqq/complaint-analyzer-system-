const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { getStudentVerificationConfig, sendStudentVerificationCode, registerStudent, loginStudent, loginAdmin, requestPasswordReset, resetPassword } = require("../controllers/authController");
const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipFailedRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many verification requests. Try again later" }
});
router.post("/student/send-verification-code", verificationLimiter, sendStudentVerificationCode);
router.get("/student/verification-config", getStudentVerificationConfig);
router.post("/student/register", registerStudent);
router.post("/student/login", loginStudent);
router.post("/admin/login", loginAdmin);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);
module.exports = router;
