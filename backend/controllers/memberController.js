const Member = require("../models/memberModel");
const Complaint = require("../models/complaintModel");
const { canAccessComplaint, filterComplaintsForUser } = require("../utils/complaintAccess");

async function getMyWorkSummary(req, res) {
  try {
    const all = await Complaint.getAllComplaints();
    const assigned = await filterComplaintsForUser(req.user, all);

    const stats = {
      assigned: assigned.length,
      pending: assigned.filter(c => c.status === "Pending").length,
      in_progress: assigned.filter(c => c.status === "In Progress").length,
      resolved: assigned.filter(c => c.status === "Resolved").length,
      high_priority: assigned.filter(c => c.priority === "High").length
    };

    const activities = await Member.getMemberActivitiesByAdmin(req.user.id);

    return res.json({ success: true, stats, complaints: assigned.slice(0, 50), activities });
  } catch (error) {
    console.error("Failed to load work summary:", error);
    return res.status(500).json({ success: false, message: "Failed to load work summary" });
  }
}

async function getAllMemberActivity(req, res) {
  try {
    const activities = await Member.getMemberActivities();
    const performance = await Member.getMemberPerformance();
    return res.json({ success: true, activities, performance });
  } catch (error) {
    console.error("Failed to load member activity:", error);
    return res.status(500).json({ success: false, message: "Failed to load member activity" });
  }
}

async function addComplaintNote(req, res) {
  try {
    const { complaint_id } = req.params;
    const { note } = req.body;

    if (!note) return res.status(400).json({ success: false, message: "Note is required" });

    const complaint = (await Complaint.getAllComplaints()).find(
      item => Number(item.complaint_id) === Number(complaint_id)
    );
    if (!(await canAccessComplaint(req.user, complaint))) {
      return res.status(403).json({ success: false, message: "You can only add notes to assigned complaints" });
    }

    await Member.addTaskNote({ admin_id: req.user.id, complaint_id, note });
    await Member.logMemberActivity({
      admin_id: req.user.id,
      role: req.user.role,
      action: "NOTE_ADDED",
      complaint_id,
      description: note
    });

    return res.json({ success: true, message: "Note added successfully" });
  } catch (error) {
    console.error("Failed to add note:", error);
    return res.status(500).json({ success: false, message: "Failed to add note" });
  }
}

async function getComplaintNotes(req, res) {
  try {
    const { complaint_id } = req.params;
    const complaint = (await Complaint.getAllComplaints()).find(
      item => Number(item.complaint_id) === Number(complaint_id)
    );
    if (!(await canAccessComplaint(req.user, complaint))) {
      return res.status(403).json({ success: false, message: "You can only view notes for assigned complaints" });
    }
    const notes = await Member.getComplaintNotes(complaint_id);
    return res.json({ success: true, notes });
  } catch (error) {
    console.error("Failed to load notes:", error);
    return res.status(500).json({ success: false, message: "Failed to load notes" });
  }
}

module.exports = { getMyWorkSummary, getAllMemberActivity, addComplaintNote, getComplaintNotes };
