const db = require("../config/db");

async function createResetToken({ email, user_type, reset_token, expires_at }) {
  await db.execute(
    `UPDATE password_resets SET used = 1 WHERE email = ? AND user_type = ? AND used = 0`,
    [email, user_type]
  );

  const [result] = await db.execute(
    `INSERT INTO password_resets (email, user_type, reset_token, expires_at, used)
     VALUES (?, ?, ?, ?, 0)`,
    [email, user_type, reset_token, expires_at]
  );

  return result.insertId;
}

async function findValidResetToken(reset_token, user_type) {
  const [rows] = await db.execute(
    `SELECT * FROM password_resets
     WHERE reset_token = ?
       AND user_type = ?
       AND used = 0
       AND expires_at > NOW()
     LIMIT 1`,
    [reset_token, user_type]
  );

  return rows[0];
}

async function markTokenUsed(reset_token) {
  const [result] = await db.execute(
    `UPDATE password_resets SET used = 1 WHERE reset_token = ?`,
    [reset_token]
  );

  return result.affectedRows;
}

module.exports = {
  createResetToken,
  findValidResetToken,
  markTokenUsed
};
