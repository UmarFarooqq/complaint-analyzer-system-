const { localAnalyzeComplaint } = require("./localAnalyzer");

async function analyzeWithOpenAI(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey || String(process.env.USE_OPENAI_AI || "false") !== "true") {
    return localAnalyzeComplaint(text);
  }

  try {
    const prompt = `Analyze this university complaint and return ONLY JSON:
{"sentiment":"Positive|Neutral|Negative","detected_category":"Fee Issue|Academic Issue|Administration Issue|Other","priority":"High|Medium|Low","ai_confidence":0-100}
Complaint: ${text}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You classify university complaints." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "OpenAI API error");

    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    return {
      sentiment: parsed.sentiment || "Neutral",
      detected_category: parsed.detected_category || "Other",
      priority: parsed.priority || "Medium",
      ai_confidence: Number(parsed.ai_confidence) || 85,
      ai_source: "OpenAI API"
    };
  } catch (error) {
    return { ...localAnalyzeComplaint(text), ai_source: "Local NLP Rules Fallback" };
  }
}

module.exports = { analyzeWithOpenAI };
