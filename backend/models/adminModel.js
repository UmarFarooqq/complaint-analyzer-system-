const db = require("../config/db");

async function findAdminByEmail(email) {
  const [rows] = await db.execute(
    "SELECT * FROM admins WHERE email = ? LIMIT 1",
    [email]
  );
  return rows[0];
}

async function findAdminById(adminId) {
  const [rows] = await db.execute(
    "SELECT admin_id, full_name, email, role, created_at FROM admins WHERE admin_id = ? LIMIT 1",
    [adminId]
  );
  return rows[0];
}

async function createAdmin({ full_name, email, password_hash, role }) {
  const [result] = await db.execute(
    "INSERT INTO admins (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)",
    [full_name, email, password_hash, role || "department_admin"]
  );
  return result.insertId;
}

async function updateAdminPasswordByEmail(email, password_hash) {
  const [result] = await db.execute(
    "UPDATE admins SET password_hash = ? WHERE email = ?",
    [password_hash, email]
  );
  return result.affectedRows;
}

async function getAllAdmins() {
  const [rows] = await db.execute(
    `SELECT
      a.admin_id,
      a.full_name,
      a.email,
      a.role,
      d.department_name,
      d.department_id,
      a.created_at
     FROM admins a
     LEFT JOIN department_admins da ON a.admin_id = da.admin_id
     LEFT JOIN departments d ON da.department_id = d.department_id
     ORDER BY a.created_at DESC`
  );
  return rows;
}

async function assignDepartment(adminId, departmentId) {
  await db.execute("DELETE FROM department_admins WHERE admin_id = ?", [adminId]);

  const [result] = await db.execute(
    "INSERT INTO department_admins (admin_id, department_id) VALUES (?, ?)",
    [adminId, departmentId]
  );

  return result.insertId;
}

async function getAdminDepartment(adminId) {
  const [rows] = await db.execute(
    `SELECT d.*
     FROM departments d
     JOIN department_admins da ON d.department_id = da.department_id
     WHERE da.admin_id = ?
     LIMIT 1`,
    [adminId]
  );
  return rows[0];
}

module.exports = {
  findAdminByEmail,
  findAdminById,
  createAdmin,
  updateAdminPasswordByEmail,
  getAllAdmins,
  assignDepartment,
  getAdminDepartment
};
