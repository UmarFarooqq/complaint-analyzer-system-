const bcrypt = require("bcryptjs");
const Admin = require("../models/adminModel");

async function createDepartmentAdmin(req, res) {
  try {
    const currentRole = req.user && req.user.role;

    if (!["super_admin", "admin"].includes(currentRole)) {
      return res.status(403).json({
        success: false,
        message: "Only Main Admin / Super Admin can create role accounts"
      });
    }

    const { full_name, email, password, department_id, role } = req.body;

    if (!full_name || !email || !password || !department_id || !role) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, password, role and department are required"
      });
    }

    const allowedRoles = ["department_admin", "faculty_staff", "reviewer"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role selected"
      });
    }

    const existing = await Admin.findAdminByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This email already exists"
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const adminId = await Admin.createAdmin({
      full_name,
      email,
      password_hash,
      role
    });

    await Admin.assignDepartment(adminId, department_id);

    return res.status(201).json({
      success: true,
      message: "Role account created successfully",
      admin: {
        admin_id: adminId,
        full_name,
        email,
        role,
        department_id
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create role account",

    });
  }
}

async function listAdmins(req, res) {
  try {
    if (!["super_admin", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only Main Admin / Super Admin can view role accounts"
      });
    }

    const admins = await Admin.getAllAdmins();
    return res.json({ success: true, admins });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load admins",

    });
  }
}

async function myDepartment(req, res) {
  try {
    const department = await Admin.getAdminDepartment(req.user.id);
    return res.json({ success: true, department });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load department",

    });
  }
}

module.exports = {
  createDepartmentAdmin,
  listAdmins,
  myDepartment
};
