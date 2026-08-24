const express = require("express");
const router = express.Router();

const {
  createDepartmentAdmin,
  listAdmins,
  myDepartment
} = require("../controllers/roleController");

const { protect, adminOnly } = require("../middleware/authMiddleware");
const { superAdminOnly } = require("../middleware/roleMiddleware");

router.post("/department-admin", protect, adminOnly, superAdminOnly, createDepartmentAdmin);
router.get("/admins", protect, adminOnly, superAdminOnly, listAdmins);
router.get("/my-department", protect, adminOnly, myDepartment);

module.exports = router;
