function countKeywords(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.reduce((score, word) => score + (lower.includes(word) ? 1 : 0), 0);
}

function localAnalyzeComplaint(text) {
  const negativeWords = ["bad","poor","worst","angry","issue","problem","delay","not","never","complain","unfair","rude","terrible","loss","late","failed","hate","difficult","serious","urgent","harassment","careless","ignored","incomplete","missing","wrong","slow","unavailable","damaged","unsafe"];
  const positiveWords = ["good","great","excellent","resolved","helpful","thanks","better","improved","quick","satisfied","happy","supportive","cooperative","nice","fast","clear","proper","appreciate"];

  const categoryRules = [
    { name: "Fee Issue", keywords: ["fee","fees","challan","payment","dues","fine","bank","voucher","installment","refund","scholarship"] },
    { name: "Academic Issue", keywords: ["class","teacher","lecture","exam","marks","course","subject","assignment","attendance","semester","result","syllabus","lab"] },
    { name: "Administration Issue", keywords: ["office","admin","staff","department","management","document","certificate","transcript","registration","admission","clerk"] }
  ];

  const neg = countKeywords(text, negativeWords);
  const pos = countKeywords(text, positiveWords);
  let sentiment = "Neutral";
  let confidence = 70;
  if (neg > pos) { sentiment = "Negative"; confidence = Math.min(98, 65 + neg * 7); }
  if (pos > neg) { sentiment = "Positive"; confidence = Math.min(98, 65 + pos * 7); }

  let detected_category = "Other";
  let bestScore = 0;
  for (const rule of categoryRules) {
    const score = countKeywords(text, rule.keywords);
    if (score > bestScore) { bestScore = score; detected_category = rule.name; }
  }

  const urgentWords = ["urgent","immediately","serious","angry","harassment","threat","loss","failed","deadline","emergency","ignored","exam","result","registration","last date","unsafe"];
  const urgentScore = countKeywords(text, urgentWords);
  let priority = "Medium";
  if (sentiment === "Negative") priority = "High";
  else if (sentiment === "Positive") priority = "Low";
  if (sentiment === "Negative" && urgentScore > 0) priority = "High";

  return { sentiment, detected_category, priority, ai_confidence: confidence, ai_source: "Local NLP Rules" };
}

module.exports = { localAnalyzeComplaint };
