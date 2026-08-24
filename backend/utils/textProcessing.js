function cleanText(text) {
  return (text || "")
    .toString()
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

module.exports = { cleanText };
