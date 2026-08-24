const express = require("express");
const router = express.Router();
const { submitComplaint, getMyComplaints, getMyDashboard } = require("../controllers/complaintController");
const { protect, studentOnly } = require("../middleware/authMiddleware");
router.post("/", protect, studentOnly, submitComplaint);
router.get("/my", protect, studentOnly, getMyComplaints);
router.get("/my/dashboard", protect, studentOnly, getMyDashboard);
module.exports = router;
