const express = require("express");
const router = express.Router();

const {
  getMyWorkSummary,
  getAllMemberActivity,
  addComplaintNote,
  getComplaintNotes
} = require("../controllers/memberController");

const { protect, adminOnly, memberOnly } = require("../middleware/authMiddleware");
const { superAdminOnly, departmentWorkOnly } = require("../middleware/roleMiddleware");

router.get("/my-work", protect, memberOnly, departmentWorkOnly, getMyWorkSummary);
router.get("/activity", protect, adminOnly, superAdminOnly, getAllMemberActivity);
router.post("/complaints/:complaint_id/notes", protect, memberOnly, departmentWorkOnly, addComplaintNote);
router.get("/complaints/:complaint_id/notes", protect, memberOnly, departmentWorkOnly, getComplaintNotes);

module.exports = router;
