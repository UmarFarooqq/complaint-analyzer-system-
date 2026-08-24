const db = require("../config/db");

async function saveComplaintDevice({ complaint_id, user_id, ip_address, user_agent, device_type, browser_name, operating_system }) {
  await db.execute(
    `INSERT INTO complaint_device_records
     (complaint_id, user_id, ip_address, user_agent, device_type, browser_name, operating_system)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [complaint_id, user_id, ip_address, user_agent, device_type, browser_name, operating_system]
  );
}

module.exports = { saveComplaintDevice };
