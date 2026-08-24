const db = require("../config/db");

async function createUser(data) {
  const { full_name, email, registration_no, password_hash } = data;

  const [result] = await db.execute(
    `INSERT INTO users (full_name, email, registration_no, password_hash)
     VALUES (?, ?, ?, ?)`,
    [full_name, email, registration_no, password_hash]
  );

  return result.insertId;
}

async function findUserByEmailOrReg(identity) {
  const [rows] = await db.execute(
    `SELECT * FROM users
     WHERE LOWER(email) = LOWER(?) OR LOWER(registration_no) = LOWER(?)
     LIMIT 1`,
    [identity, identity]
  );

  return rows[0];
}

async function findUserByEmail(email) {
  const [rows] = await db.execute(
    `SELECT * FROM users WHERE email = ? LIMIT 1`,
    [email]
  );

  return rows[0];
}

async function findUserByReg(registrationNo) {
  const [rows] = await db.execute(
    `SELECT * FROM users WHERE UPPER(REPLACE(registration_no, ' ', '')) = ? LIMIT 1`,
    [registrationNo]
  );

  return rows[0];
}



async function updateUserPasswordByEmail(email, password_hash) {
  const [result] = await db.execute(
    `UPDATE users SET password_hash = ? WHERE email = ?`,
    [password_hash, email]
  );

  return result.affectedRows;
}



module.exports = {
  createUser,
  findUserByEmailOrReg,
  findUserByEmail,
  findUserByReg,
  updateUserPasswordByEmail
};
