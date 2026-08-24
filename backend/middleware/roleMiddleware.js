function superAdminOnly(req, res, next) {
  if (req.user && (req.user.role === "super_admin" || req.user.role === "admin")) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Only Super Admin can create or manage staff/admin accounts"
  });
}

function departmentWorkOnly(req, res, next) {
  if (
    req.user &&
    ["super_admin", "admin", "department_admin", "faculty_staff", "reviewer"].includes(req.user.role)
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "You do not have permission for this work area"
  });
}

module.exports = {
  superAdminOnly,
  departmentWorkOnly
};
