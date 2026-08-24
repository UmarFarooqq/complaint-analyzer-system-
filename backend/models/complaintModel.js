const db = require("../config/db");

async function columnExists(table, column) {
  try {
    await db.execute(`SELECT ${column} FROM ${table} LIMIT 1`);
    return true;
  } catch (error) {
    return false;
  }
}

async function tableExists(table) {
  try {
    await db.execute(`SELECT 1 FROM ${table} LIMIT 1`);
    return true;
  } catch (error) {
    return false;
  }
}

async function createComplaint(data) {
  const cols = [
    "user_id",
    "title",
    "description",
    "category_id",
    "detected_category",
    "sentiment",
    "priority",
    "status",
    "ai_confidence"
  ];

  const vals = [
    data.user_id,
    data.title,
    data.description,
    data.category_id,
    data.detected_category,
    data.sentiment,
    data.priority,
    data.status,
    data.ai_confidence
  ];

  const optionalColumns = [
    ["ai_source", data.ai_source],
    ["department_id", data.department_id],
    ["expected_resolution_time", data.expected_resolution_time],
    ["ai_recommendation", data.ai_recommendation],
    ["ai_emotion", data.ai_emotion],
    ["toxicity_score", data.toxicity_score],
    ["fake_probability", data.fake_probability]
  ];

  for (const [col, val] of optionalColumns) {
    if (await columnExists("complaints", col)) {
      cols.push(col);
      vals.push(val);
    }
  }

  const placeholders = cols.map(() => "?").join(",");
  const [result] = await db.execute(
    `INSERT INTO complaints (${cols.join(",")}) VALUES (${placeholders})`,
    vals
  );

  return result.insertId;
}

async function getComplaintsByUser(userId) {
  const [rows] = await db.execute(
    `SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );

  return rows;
}

async function getComplaintStatsByUser(userId) {
  const [[total]] = await db.execute(
    `SELECT COUNT(*) AS total FROM complaints WHERE user_id = ?`,
    [userId]
  );
  const [[pending]] = await db.execute(
    `SELECT COUNT(*) AS pending FROM complaints WHERE user_id = ? AND status = 'Pending'`,
    [userId]
  );
  const [[resolved]] = await db.execute(
    `SELECT COUNT(*) AS resolved FROM complaints WHERE user_id = ? AND status = 'Resolved'`,
    [userId]
  );
  const [[high]] = await db.execute(
    `SELECT COUNT(*) AS high_count FROM complaints WHERE user_id = ? AND priority = 'High'`,
    [userId]
  );

  return {
    total: total.total,
    pending: pending.pending,
    resolved: resolved.resolved,
    high_priority: high.high_count
  };
}

async function getAllComplaints() {
  const hasDepartments = await tableExists("departments") && await columnExists("complaints", "department_id");
  const hasDeviceRecords = await tableExists("complaint_device_records");
  const select = ["c.*", "u.full_name AS student_name", "u.registration_no", "u.email AS student_email"];
  const joins = ["LEFT JOIN users u ON c.user_id = u.user_id"];
  if (hasDepartments) {
    select.push("d.department_name");
    joins.push("LEFT JOIN departments d ON c.department_id = d.department_id");
  }
  if (hasDeviceRecords) {
    select.push("m.ip_address", "m.user_agent", "m.device_type", "m.browser_name", "m.operating_system", "m.recorded_at AS device_recorded_at");
    joins.push("LEFT JOIN complaint_device_records m ON c.complaint_id = m.complaint_id");
  }
  const [rows] = await db.execute(
    `SELECT ${select.join(", ")}
     FROM complaints c
     ${joins.join(" ")}
     ORDER BY c.created_at DESC`
  );

  return rows;
}

async function getComplaintDetail(id) {
  const all = await getAllComplaints();
  return all.find(row => Number(row.complaint_id) === Number(id));
}

async function findComplaintById(id) {
  const [rows] = await db.execute(
    `SELECT * FROM complaints WHERE complaint_id = ? LIMIT 1`,
    [id]
  );

  return rows[0];
}

async function updateComplaintStatus(id, status) {
  const [result] = await db.execute(
    `UPDATE complaints SET status = ? WHERE complaint_id = ?`,
    [status, id]
  );

  return result.affectedRows;
}

async function updateFalseFlag(id, flagged, reason, adminId) {
  const [result] = await db.execute(
    `UPDATE complaints
     SET is_flagged_false = ?, false_flag_reason = ?, flagged_by_admin_id = ?, flagged_at = ?
     WHERE complaint_id = ?`,
    [flagged ? 1 : 0, flagged ? reason : null, flagged ? adminId : null, flagged ? new Date() : null, id]
  );
  return result.affectedRows;
}

async function createStatusTracking(data) {
  const hasTracking = await tableExists("status_tracking");
  if (!hasTracking) return null;

  const [result] = await db.execute(
    `INSERT INTO status_tracking
     (complaint_id, previous_status, new_status, changed_by_admin_id, note)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.complaint_id,
      data.previous_status,
      data.new_status,
      data.changed_by_admin_id,
      data.note
    ]
  );

  return result.insertId;
}

async function getRecentComplaints(limit = 5) {
  const [rows] = await db.execute(
    `SELECT * FROM complaints ORDER BY created_at DESC LIMIT ?`,
    [Number(limit)]
  );

  return rows;
}

module.exports = {
  createComplaint,
  getComplaintsByUser,
  getComplaintStatsByUser,
  getAllComplaints,
  getComplaintDetail,
  findComplaintById,
  updateComplaintStatus,
  updateFalseFlag,
  createStatusTracking,
  getRecentComplaints
};
