const db = require("../config/db");

async function findByEmail(email) {
  const [rows] = await db.execute(
    `SELECT email, code_hash, expires_at, attempts, last_sent_at
     FROM email_verifications WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0];
}

async function saveCode(email, codeHash, expiresAt) {
  await db.execute(
    `INSERT INTO email_verifications (email, code_hash, expires_at, attempts, last_sent_at)
     VALUES (?, ?, ?, 0, NOW())
     ON DUPLICATE KEY UPDATE code_hash = VALUES(code_hash), expires_at = VALUES(expires_at), attempts = 0, last_sent_at = NOW()`,
    [email, codeHash, expiresAt]
  );
}

async function incrementAttempts(email) {
  await db.execute(
    `UPDATE email_verifications SET attempts = attempts + 1 WHERE email = ?`,
    [email]
  );
}

async function remove(email) {
  await db.execute(`DELETE FROM email_verifications WHERE email = ?`, [email]);
}

module.exports = { findByEmail, saveCode, incrementAttempts, remove };
