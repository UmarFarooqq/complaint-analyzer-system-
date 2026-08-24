const db = require("../config/db");

async function deleteAdminAccount(req, res) {
  try {
    const { admin_id } = req.params;
    if (Number(admin_id) === Number(req.user.id)) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account" });
    }
    await db.execute("DELETE FROM department_admins WHERE admin_id = ?", [admin_id]).catch(() => {});
    const [result] = await db.execute("DELETE FROM admins WHERE admin_id = ?", [admin_id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Account not found" });
    return res.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Failed to delete account:", error);
    return res.status(500).json({ success: false, message: "Failed to delete account" });
  }
}

async function deleteComplaint(req, res) {
  try {
    const { complaint_id } = req.params;
    await db.execute("DELETE FROM status_tracking WHERE complaint_id = ?", [complaint_id]).catch(() => {});
    await db.execute("DELETE FROM complaint_attachments WHERE complaint_id = ?", [complaint_id]).catch(() => {});
    await db.execute("DELETE FROM member_task_notes WHERE complaint_id = ?", [complaint_id]).catch(() => {});
    await db.execute("DELETE FROM member_activity_logs WHERE complaint_id = ?", [complaint_id]).catch(() => {});
    const [result] = await db.execute("DELETE FROM complaints WHERE complaint_id = ?", [complaint_id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: "Complaint not found" });
    return res.json({ success: true, message: "Complaint deleted successfully" });
  } catch (error) {
    console.error("Failed to delete complaint:", error);
    return res.status(500).json({ success: false, message: "Failed to delete complaint" });
  }
}

module.exports = { deleteAdminAccount, deleteComplaint };
