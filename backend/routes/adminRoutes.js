const express = require("express");
const router = express.Router();

const {
  getAllComplaints,
  getComplaintDetail,
  updateComplaintStatus,
  updateComplaintFalseFlag,
  getDashboardStats,
  getAnalytics
} = require("../controllers/adminController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/complaints", protect, adminOnly, getAllComplaints);
router.get("/complaints/:complaint_id", protect, adminOnly, getComplaintDetail);
router.put("/complaints/:complaint_id/status", protect, adminOnly, updateComplaintStatus);
router.put("/complaints/:complaint_id/false-flag", protect, adminOnly, updateComplaintFalseFlag);
router.get("/dashboard/stats", protect, adminOnly, getDashboardStats);
router.get("/analytics", protect, adminOnly, getAnalytics);

module.exports = router;
