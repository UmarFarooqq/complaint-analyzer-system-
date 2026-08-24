const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config({ quiet: true });

const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const adminRoutes = require("./routes/adminRoutes");
const fullAdminRoutes = require("./routes/fullAdminRoutes");
const roleRoutes = require("./routes/roleRoutes");
const memberRoutes = require("./routes/memberRoutes");
const advancedRoutes = require("./routes/advancedRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const attachmentRoutes = require("./routes/attachmentRoutes");
const publicRoutes = require("./routes/publicRoutes");

const app = express();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts. Try again later." }
});

// The existing HTML uses inline form/button handlers. Keep them working while
// the frontend is migrated to addEventListener-based handlers.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      scriptSrcAttr: ["'unsafe-inline'"]
    }
  }
}));
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? (process.env.APP_BASE_URL || false)
    : true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("backend/uploads"));

// Serve frontend files from /frontend
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Complaint Analyzer System API is running"
  });
});

app.use("/api/public", publicRoutes);
app.use("/api/auth", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/full-admin", fullAdminRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/advanced", advancedRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api", attachmentRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Complaint Analyzer System running at http://localhost:${PORT}`);
});
