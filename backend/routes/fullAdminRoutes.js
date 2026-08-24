const express = require("express");
const router = express.Router();
const { deleteAdminAccount, deleteComplaint } = require("../controllers/fullAdminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { superAdminOnly } = require("../middleware/roleMiddleware");

router.delete("/accounts/:admin_id", protect, adminOnly, superAdminOnly, deleteAdminAccount);
router.delete("/complaints/:complaint_id", protect, adminOnly, superAdminOnly, deleteComplaint);

module.exports = router;
