const { localAnalyzeComplaint } = require("./localAnalyzer");

function includesAny(text, words) {
  return words.some(word => text.includes(word));
}

function buildLocalReply(message, complaints) {
  const text = message.toLowerCase();
  const total = complaints.length;
  const latest = complaints[0];
  const open = complaints.filter(c => c.status !== "Resolved").length;

  if (includesAny(text, ["hello", "hi", "hey", "salam", "assalam"])) {
    return "Hello! I’m here to help with your complaints. You can ask about a status, submitting evidence, department routing, or next steps.";
  }
  if (includesAny(text, ["thank", "thanks", "appreciate"])) {
    return "You’re welcome! I’m happy to help. If you need anything else, ask me about your complaint status or the next step.";
  }
  if (includesAny(text, ["status", "where", "progress", "update", "follow up", "follow-up"])) {
    if (!latest) return "You do not have a complaint yet. Open Submit Complaint to create one, and I can help you track it afterward.";
    return `Your latest complaint #${latest.complaint_id} is ${latest.status} with ${latest.priority} priority. It was categorized as ${latest.detected_category || "Other"}. You have ${open} open complaint${open === 1 ? "" : "s"} out of ${total}.`;
  }
  if (includesAny(text, ["all complaints", "my complaints", "how many", "history"])) {
    return total ? `You have submitted ${total} complaint${total === 1 ? "" : "s"}. ${open} still need action. Open All Complaints to review the full history.` : "You have not submitted a complaint yet. I can guide you through submitting your first one.";
  }
  if (includesAny(text, ["fee", "fees", "challan", "payment", "refund", "scholarship"])) {
    return "For a fee complaint, include your registration number, payment or challan details, the date, and a clear screenshot or PDF. Fee complaints are routed to Finance.";
  }
  if (includesAny(text, ["class", "teacher", "lecture", "exam", "marks", "result", "attendance", "assignment", "course"])) {
    return "For an academic complaint, include the course, teacher or class, relevant date, and any supporting evidence. Academic complaints are routed to the Academic Department.";
  }
  if (includesAny(text, ["office", "staff", "document", "certificate", "transcript", "registration", "admission"])) {
    return "For an administration complaint, explain what happened, name the relevant office or service, include dates, and attach supporting documents if available.";
  }
  if (includesAny(text, ["upload", "evidence", "proof", "attachment", "image", "pdf", "voice", "video"])) {
    return "You can attach PDF, image, voice, or video evidence from Submit Complaint. Please make sure the file is clear and directly supports your complaint.";
  }
  if (includesAny(text, ["password", "forgot", "login", "account"])) {
    return "Use Forgot Password on the Student Login page. You can log in with either your university registration number or your personal email.";
  }
  if (includesAny(text, ["urgent", "emergency", "unsafe", "harass", "threat"])) {
    return "This sounds urgent. Describe the immediate risk, date, location, and people involved, then attach evidence. If someone is in immediate danger, contact your university emergency support first.";
  }

  const analysis = localAnalyzeComplaint(message);
  return `I can help with that. I detected ${analysis.detected_category} as the closest topic. Would you like help with your complaint status, submitting evidence, or the next steps for ${analysis.detected_category.toLowerCase()}?`;
}

async function generateAssistantReply({ message, complaints, history }) {
  const localReply = buildLocalReply(message, complaints);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || String(process.env.USE_OPENAI_AI || "false") !== "true") return localReply;

  try {
    const context = complaints.slice(0, 5).map(c => `#${c.complaint_id}: ${c.status}, ${c.priority}, ${c.detected_category || "Other"}`).join("; ");
    const previous = history.slice(-6).map(item => `${item.sender}: ${item.message}`).join("\n");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.4,
        max_tokens: 220,
        messages: [
          { role: "system", content: "You are a warm, concise university complaint assistant. Use only the supplied complaint context. Never invent a complaint status, promise an outcome, or request a password. Give one clear next step." },
          { role: "user", content: `Student complaints: ${context || "None"}\nRecent conversation:\n${previous || "None"}\nStudent message: ${message}` }
        ]
      })
    });
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    return response.ok && reply ? reply : localReply;
  } catch {
    return localReply;
  }
}

module.exports = { generateAssistantReply };
