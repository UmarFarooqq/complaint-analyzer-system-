const jwt = require("jsonwebtoken");

function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing"
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "complaint_secret");

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
}

function studentOnly(req, res, next) {
  if (req.user && req.user.role === "student") return next();

  return res.status(403).json({
    success: false,
    message: "Student access only"
  });
}

function adminOnly(req, res, next) {
  if (req.user && ["admin", "super_admin"].includes(req.user.role)) return next();

  return res.status(403).json({
    success: false,
    message: "Admin access only"
  });
}

function memberOnly(req, res, next) {
  if (req.user && ["admin", "super_admin", "department_admin", "faculty_staff", "reviewer"].includes(req.user.role)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Staff access only"
  });
}

module.exports = { protect, studentOnly, adminOnly, memberOnly };
