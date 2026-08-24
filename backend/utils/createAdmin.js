const bcrypt = require("bcryptjs");
const db = require("../config/db");
require("dotenv").config({ quiet: true });

async function createAdmin() {
  try {
    const fullName = "Admin User";
    const email = "admin@example.com";
    const password = "123456";

    const passwordHash = await bcrypt.hash(password, 10);

    const [existing] = await db.execute("SELECT * FROM admins WHERE email = ? LIMIT 1", [email]);

    if (existing.length > 0) {
      await db.execute(
        "UPDATE admins SET password_hash = ? WHERE email = ?",
        [passwordHash, email]
      );
      console.log("Admin already existed. Password updated.");
    } else {
      await db.execute(
        "INSERT INTO admins (full_name, email, password_hash) VALUES (?, ?, ?)",
        [fullName, email, passwordHash]
      );
      console.log("Admin created.");
    }

    console.log("Admin Email:", email);
    console.log("Admin Password:", password);
    process.exit(0);
  } catch (error) {
    console.error("Admin seed failed:", error.message);
    process.exit(1);
  }
}

createAdmin();
