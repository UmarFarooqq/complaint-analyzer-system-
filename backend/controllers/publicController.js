const db = require("../config/db");
const Complaint = require("../models/complaintModel");

async function getPublicOverview(req, res) {
  try {
    const [[total]] = await db.execute(`SELECT COUNT(*) AS total FROM complaints`);
    const [[resolved]] = await db.execute(`SELECT COUNT(*) AS resolved FROM complaints WHERE status = 'Resolved'`);
    const [[high]] = await db.execute(`SELECT COUNT(*) AS high_count FROM complaints WHERE priority = 'High'`);
    const [[today]] = await db.execute(`SELECT COUNT(*) AS today FROM complaints WHERE DATE(created_at) = CURDATE()`);
    const recentComplaints = await Complaint.getRecentComplaints(3);

    return res.json({
      success: true,
      overview: {
        total_complaints: total.total,
        resolved_complaints: resolved.resolved,
        high_priority: high.high_count,
        today: today.today,
        recentComplaints
      }
    });
  } catch (error) {
    console.error("Failed to load public overview:", error);
    return res.status(500).json({ success: false, message: "Failed to load public overview" });
  }
}

module.exports = { getPublicOverview };
