const Advanced = require("../models/advancedModel");
const Complaint = require("../models/complaintModel");
const { generateAssistantReply } = require("../ai/chatAssistant");

async function sendMessage(req, res) {
  const message = String(req.body.message || "").trim();
  if (!message) return res.status(400).json({ success: false, message: "Message is required" });
  if (message.length > 1000) return res.status(400).json({ success: false, message: "Please keep your message under 1000 characters" });

  const complaints = await Complaint.getComplaintsByUser(req.user.id);
  const history = await Advanced.getChatHistory(req.user.id);
  await Advanced.saveChatMessage({ user_id: req.user.id, sender: "student", message });
  const reply = await generateAssistantReply({ message, complaints, history });
  await Advanced.saveChatMessage({ user_id: req.user.id, sender: "bot", message: reply });
  return res.json({ success: true, reply, complaintCount: complaints.length });
}

async function getHistory(req,res){res.json({success:true,history:await Advanced.getChatHistory(req.user.id)})}
module.exports={sendMessage,getHistory};
