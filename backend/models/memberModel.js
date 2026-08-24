const db = require("../config/db");

async function logMemberActivity({ admin_id, role, action, complaint_id = null, description = "" }) {
  const [result] = await db.execute(
    `INSERT INTO member_activity_logs (admin_id, role, action, complaint_id, description)
     VALUES (?, ?, ?, ?, ?)`,
    [admin_id, role, action, complaint_id, description]
  );
  return result.insertId;
}

async function addTaskNote({ admin_id, complaint_id, note }) {
  const [result] = await db.execute(
    `INSERT INTO member_task_notes (admin_id, complaint_id, note)
     VALUES (?, ?, ?)`,
    [admin_id, complaint_id, note]
  );
  return result.insertId;
}

async function getMemberActivities() {
  const [rows] = await db.execute(
    `SELECT mal.*, a.full_name, a.email
     FROM member_activity_logs mal
     JOIN admins a ON mal.admin_id = a.admin_id
     ORDER BY mal.created_at DESC
     LIMIT 300`
  );
  return rows;
}

async function getMemberActivitiesByAdmin(adminId) {
  const [rows] = await db.execute(
    `SELECT * FROM member_activity_logs
     WHERE admin_id = ?
     ORDER BY created_at DESC
     LIMIT 100`,
    [adminId]
  );
  return rows;
}

async function getMemberPerformance() {
  const [rows] = await db.execute(
    `SELECT
      a.admin_id,
      a.full_name,
      a.email,
      a.role,
      COUNT(mal.activity_id) AS total_actions,
      SUM(CASE WHEN mal.action = 'STATUS_UPDATED' THEN 1 ELSE 0 END) AS status_updates,
      SUM(CASE WHEN mal.action = 'NOTE_ADDED' THEN 1 ELSE 0 END) AS notes_added,
      MAX(mal.created_at) AS last_activity
     FROM admins a
     LEFT JOIN member_activity_logs mal ON a.admin_id = mal.admin_id
     WHERE a.role IN ('department_admin','faculty_staff','reviewer')
     GROUP BY a.admin_id, a.full_name, a.email, a.role
     ORDER BY total_actions DESC`
  );
  return rows;
}

async function getComplaintNotes(complaintId) {
  const [rows] = await db.execute(
    `SELECT mtn.*, a.full_name, a.role
     FROM member_task_notes mtn
     JOIN admins a ON mtn.admin_id = a.admin_id
     WHERE complaint_id = ?
     ORDER BY created_at DESC`,
    [complaintId]
  );
  return rows;
}

module.exports = {
  logMemberActivity,
  addTaskNote,
  getMemberActivities,
  getMemberActivitiesByAdmin,
  getMemberPerformance,
  getComplaintNotes
};
