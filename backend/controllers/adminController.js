const db = require("../config/db");
const Complaint = require("../models/complaintModel");
const Advanced = require("../models/advancedModel");

async function getAllComplaints(req, res) {
  try {
    const complaints = await Complaint.getAllComplaints();

    return res.json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get complaints",
    });
  }
}

async function getComplaintDetail(req, res) {
  try {
    const { complaint_id } = req.params;
    const complaint = await Complaint.getComplaintDetail(complaint_id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found"
      });
    }

    return res.json({
      success: true,
      complaint
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get complaint detail",
    });
  }
}

async function updateComplaintStatus(req, res) {
  try {
    const { complaint_id } = req.params;
    const { status, note } = req.body;

    const allowed = ["Pending", "In Progress", "Resolved"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    const complaint = await Complaint.findComplaintById(complaint_id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found"
      });
    }

    await Complaint.updateComplaintStatus(complaint_id, status);

    await Complaint.createStatusTracking({
      complaint_id,
      previous_status: complaint.status,
      new_status: status,
      changed_by_admin_id: req.user.id,
      note: note || "Status updated by admin"
    });

    await Advanced.createNotification({
      user_id: complaint.user_id,
      title: `Complaint #${complaint_id} updated`,
      message: `Your complaint status is now ${status}.${note ? ` Admin note: ${note}` : ""}`,
      type: status === "Resolved" ? "success" : "info"
    });

    return res.json({
      success: true,
      message: "Complaint status updated successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update complaint status",
    });
  }
}

async function updateComplaintFalseFlag(req, res) {
  try {
    const complaintId = Number(req.params.complaint_id);
    const flagged = req.body.flagged;
    const reason = String(req.body.reason || "").trim();
    if (!Number.isInteger(complaintId) || complaintId < 1) return res.status(400).json({ success: false, message: "Invalid complaint ID" });
    if (typeof flagged !== "boolean") return res.status(400).json({ success: false, message: "Flag value must be true or false" });
    if (flagged && (reason.length < 5 || reason.length > 500)) return res.status(400).json({ success: false, message: "Enter a review reason between 5 and 500 characters" });

    const complaint = await Complaint.findComplaintById(complaintId);
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });

    await Complaint.updateFalseFlag(complaintId, flagged, reason, req.user.id);
    await Advanced.createNotification({
      user_id: complaint.user_id,
      title: flagged ? `Complaint #${complaintId} placed under review` : `Complaint #${complaintId} review flag removed`,
      message: flagged ? `Your complaint was flagged for administrative review. Reason: ${reason}` : "The administrative review flag was removed from your complaint.",
      type: flagged ? "warning" : "info"
    });
    await Advanced.logAudit({
      actor_type: "admin",
      actor_id: req.user.id,
      action: flagged ? "COMPLAINT_FLAGGED_FALSE" : "COMPLAINT_FALSE_FLAG_REMOVED",
      description: `Complaint #${complaintId}${flagged ? ` flagged: ${reason}` : " flag removed"}`,
      ip_address: req.ip
    });
    return res.json({ success: true, message: flagged ? "Complaint flagged for review" : "Review flag removed" });
  } catch (error) {
    console.error("Complaint false-report flag update failed:", error);
    return res.status(500).json({ success: false, message: "Unable to update the complaint review flag" });
  }
}

async function getDashboardStats(req, res) {
  try {
    const [[total]] = await db.execute(`SELECT COUNT(*) AS total_complaints FROM complaints`);
    const [[today]] = await db.execute(`SELECT COUNT(*) AS todays_complaints FROM complaints WHERE DATE(created_at) = CURDATE()`);
    const [[high]] = await db.execute(`SELECT COUNT(*) AS high_priority_complaints FROM complaints WHERE priority = 'High'`);
    const [[resolved]] = await db.execute(`SELECT COUNT(*) AS resolved_complaints FROM complaints WHERE status = 'Resolved'`);
    const [[pending]] = await db.execute(`SELECT COUNT(*) AS pending_complaints FROM complaints WHERE status = 'Pending'`);

    return res.json({
      success: true,
      stats: {
        total_complaints: total.total_complaints,
        todays_complaints: today.todays_complaints,
        high_priority_complaints: high.high_priority_complaints,
        resolved_complaints: resolved.resolved_complaints,
        pending_complaints: pending.pending_complaints
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get dashboard stats",
    });
  }
}

async function getAnalytics(req, res) {
  try {
    const [categoryDistribution] = await db.execute(
      `SELECT COALESCE(detected_category, 'Other') AS label, COUNT(*) AS total
       FROM complaints
       GROUP BY COALESCE(detected_category, 'Other')
       ORDER BY total DESC`
    );

    const [sentimentOverview] = await db.execute(
      `SELECT COALESCE(sentiment, 'Neutral') AS label, COUNT(*) AS total
       FROM complaints
       GROUP BY COALESCE(sentiment, 'Neutral')
       ORDER BY total DESC`
    );

    const [priorityDistribution] = await db.execute(
      `SELECT COALESCE(priority, 'Medium') AS label, COUNT(*) AS total
       FROM complaints
       GROUP BY COALESCE(priority, 'Medium')`
    );

    const [monthlyTrends] = await db.execute(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS total
       FROM complaints
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month`
    );

    const [[totalRow]] = await db.execute(`SELECT COUNT(*) AS total FROM complaints`);
    const [[trendRow]] = await db.execute(
      `SELECT
         SUM(DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')) AS current_total,
         SUM(DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m')) AS previous_total
       FROM complaints`
    );
    const total = totalRow.total || 0;
    const currentTotal = Number(trendRow.current_total || 0);
    const previousTotal = Number(trendRow.previous_total || 0);
    const monthlyTrend = previousTotal
      ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100)
      : (currentTotal ? 100 : 0);

    const topCategory = categoryDistribution[0] || { label: "No Data", total: 0 };
    const topSentiment = sentimentOverview[0] || { label: "No Data", total: 0 };
    const highPriority = priorityDistribution.find(p => p.label === "High") || { label: "High", total: 0 };

    return res.json({
      success: true,
      analytics: {
        total,
        summary: {
          topCategory: {
            label: topCategory.label,
            count: topCategory.total,
            percent: total ? Math.round((topCategory.total / total) * 100) : 0
          },
          topSentiment: {
            label: topSentiment.label,
            count: topSentiment.total,
            percent: total ? Math.round((topSentiment.total / total) * 100) : 0
          },
          highPriority: {
            count: highPriority.total,
            percent: total ? Math.round((highPriority.total / total) * 100) : 0
          },
          monthlyTrend
        },
        categoryDistribution,
        sentimentOverview,
        priorityDistribution,
        monthlyTrends
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get analytics",
    });
  }
}

module.exports = {
  getAllComplaints,
  getComplaintDetail,
  updateComplaintStatus,
  updateComplaintFalseFlag,
  getDashboardStats,
  getAnalytics
};
