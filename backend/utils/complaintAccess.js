const Admin = require("../models/adminModel");

const unrestrictedRoles = new Set(["admin", "super_admin"]);
const departmentRoles = new Set(["department_admin", "faculty_staff"]);

function isReviewerComplaint(complaint) {
  return complaint.priority === "High" ||
    Number(complaint.toxicity_score || 0) > 0 ||
    Number(complaint.fake_probability || 0) > 0;
}

async function canAccessComplaint(user, complaint) {
  if (!user || !complaint) return false;
  if (unrestrictedRoles.has(user.role)) return true;
  if (user.role === "reviewer") return isReviewerComplaint(complaint);

  if (departmentRoles.has(user.role)) {
    const department = await Admin.getAdminDepartment(user.id);
    return Boolean(department && department.department_name === complaint.department_name);
  }

  return false;
}

async function filterComplaintsForUser(user, complaints, requestedDepartment = "") {
  if (!user) return [];
  if (unrestrictedRoles.has(user.role)) {
    return requestedDepartment
      ? complaints.filter(c => c.department_name === requestedDepartment || c.detected_category === requestedDepartment)
      : complaints;
  }

  const result = [];
  for (const complaint of complaints) {
    if (await canAccessComplaint(user, complaint)) result.push(complaint);
  }
  return result;
}

module.exports = { canAccessComplaint, filterComplaintsForUser };
