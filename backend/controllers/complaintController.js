const Complaint = require("../models/complaintModel");
const Category = require("../models/categoryModel");
const { analyzeWithOpenAI } = require("../ai/openaiAnalyzer");
const { cleanText } = require("../utils/textProcessing");
const ComplaintDevice = require("../models/complaintDeviceModel");
const { getRequestMetadata } = require("../utils/requestMetadata");

async function submitComplaint(req, res) {
  try {
    const { title, description, manual_category } = req.body;
    if (!title || !description) return res.status(400).json({ success: false, message: "Complaint title and description are required" });

    const cleaned = cleanText(`${title} ${description}`);
    const aiResult = await analyzeWithOpenAI(cleaned);
    if (manual_category && manual_category !== "Auto Detect Category") aiResult.detected_category = manual_category;
    const category = await Category.findCategoryByName(aiResult.detected_category);

    const complaintId = await Complaint.createComplaint({
      user_id: req.user.id,
      title,
      description,
      category_id: category ? category.category_id : null,
      detected_category: aiResult.detected_category,
      sentiment: aiResult.sentiment,
      priority: aiResult.priority,
      status: "Pending",
      ai_confidence: aiResult.ai_confidence,
      ai_source: aiResult.ai_source
    });

    await Complaint.createStatusTracking({ complaint_id: complaintId, previous_status: null, new_status: "Pending", changed_by_admin_id: null, note: "Complaint submitted by student" });
    try {
      await ComplaintDevice.saveComplaintDevice({ complaint_id: complaintId, user_id: req.user.id, ...getRequestMetadata(req) });
    } catch (metadataError) {
      console.error("Complaint device record failed:", metadataError.message);
    }

    return res.status(201).json({ success: true, message: "Complaint submitted successfully", complaint: { complaint_id: complaintId, title, description, detected_category: aiResult.detected_category, sentiment: aiResult.sentiment, priority: aiResult.priority, status: "Pending", ai_confidence: aiResult.ai_confidence, ai_source: aiResult.ai_source } });
  } catch (error) {
    console.error("Complaint submission failed:", error);
    return res.status(500).json({ success: false, message: "Complaint submission failed" });
  }
}

async function getMyComplaints(req, res) {
  try { return res.json({ success: true, complaints: await Complaint.getComplaintsByUser(req.user.id) }); }
  catch (error) { console.error("Failed to get complaints:", error); return res.status(500).json({ success: false, message: "Failed to get complaints" }); }
}

async function getMyDashboard(req, res) {
  try {
    const complaints = await Complaint.getComplaintsByUser(req.user.id);
    const stats = Complaint.getComplaintStatsByUser ? await Complaint.getComplaintStatsByUser(req.user.id) : {
      total: complaints.length,
      pending: complaints.filter(c => c.status === "Pending").length,
      resolved: complaints.filter(c => c.status === "Resolved").length,
      high_priority: complaints.filter(c => c.priority === "High").length
    };
    return res.json({ success: true, stats, recentComplaints: complaints.slice(0, 5) });
  } catch (error) { console.error("Failed to get student dashboard data:", error); return res.status(500).json({ success: false, message: "Failed to get student dashboard data" }); }
}

module.exports = { submitComplaint, getMyComplaints, getMyDashboard };
