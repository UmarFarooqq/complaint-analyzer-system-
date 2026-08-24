function detectBrowser(userAgent) {
  if (/Edg\//i.test(userAgent)) return "Microsoft Edge";
  if (/OPR\//i.test(userAgent)) return "Opera";
  if (/Chrome\//i.test(userAgent)) return "Google Chrome";
  if (/Firefox\//i.test(userAgent)) return "Mozilla Firefox";
  if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) return "Safari";
  return "Other";
}

function detectOperatingSystem(userAgent) {
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Android/i.test(userAgent)) return "Android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS";
  if (/Mac OS X|Macintosh/i.test(userAgent)) return "macOS";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Other";
}

function detectDeviceType(userAgent) {
  if (/iPad|Tablet/i.test(userAgent)) return "Tablet";
  if (/Mobile|Android|iPhone|iPod/i.test(userAgent)) return "Mobile";
  return "Desktop";
}

function getRequestMetadata(req) {
  const userAgent = String(req.get("user-agent") || "Unknown").slice(0, 500);
  return {
    ip_address: String(req.ip || req.socket?.remoteAddress || "Unknown").slice(0, 100),
    user_agent: userAgent,
    device_type: detectDeviceType(userAgent),
    browser_name: detectBrowser(userAgent),
    operating_system: detectOperatingSystem(userAgent)
  };
}

module.exports = { getRequestMetadata };
