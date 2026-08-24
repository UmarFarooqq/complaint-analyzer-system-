const express = require("express");
const router = express.Router();

const {
  getDepartments,
  getNotifications,
  getDepartmentComplaints,
  updateDepartmentComplaintStatus,
  getAdvancedAnalytics,
  getPredictions,
  getAuditLogs,
  exportComplaintsCsv
} = require("../controllers/advancedController");

const { protect, adminOnly, memberOnly } = require("../middleware/authMiddleware");
const { superAdminOnly, departmentWorkOnly } = require("../middleware/roleMiddleware");

router.get("/departments", protect, getDepartments);
router.get("/notifications", protect, getNotifications);

router.get("/department-complaints", protect, memberOnly, departmentWorkOnly, getDepartmentComplaints);
router.put("/department-complaints/:complaint_id/status", protect, memberOnly, departmentWorkOnly, updateDepartmentComplaintStatus);

router.get("/analytics", protect, adminOnly, superAdminOnly, getAdvancedAnalytics);
router.get("/predictions", protect, adminOnly, superAdminOnly, getPredictions);
router.get("/audit-logs", protect, adminOnly, superAdminOnly, getAuditLogs);
router.get("/reports/complaints.csv", protect, adminOnly, superAdminOnly, exportComplaintsCsv);

module.exports = router;
