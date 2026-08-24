# Database Structure

## Current database

- Database name: `complaint_analyzer_system`
- Local engine verified on 24 August 2026: MariaDB `10.4.32`
- Connection code: [`backend/config/db.js`](../backend/config/db.js)
- Connection values: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in `.env`

phpMyAdmin is a browser interface for MySQL/MariaDB; it is not a separate database type. With Apache and MySQL running in XAMPP, open `http://localhost/phpmyadmin/` and select `complaint_analyzer_system`.

## Current tables

| Table | Purpose |
| --- | --- |
| `users` | Student identity, Gmail address, unique registration number, password hash, and timestamps. |
| `admins` | Admin and staff identity, password hash, and role. |
| `categories` | Complaint category definitions. |
| `complaints` | Complaint content, classification, department routing, status, AI fields, and potential-false review fields. |
| `status_tracking` | Status history, administrator, note, and change time. |
| `departments` | Department definitions used for routing and access. |
| `department_admins` | Links admin/staff accounts to departments. |
| `complaint_attachments` | Evidence file name, path, type, size, and upload time. |
| `complaint_device_records` | Server-observed IP address and parsed user-agent metadata captured for a newly submitted complaint. |
| `notifications` | Student/admin notification records. |
| `chatbot_messages` | Student and assistant conversation history. |
| `audit_logs` | Important actor, action, description, IP address, and time. |
| `member_activity_logs` | Department-member work activity. |
| `member_task_notes` | Notes added by authorized members to complaints. |
| `email_verifications` | Hashed registration codes, expiry, attempts, and send time. |
| `password_resets` | Password-reset tokens, account type, expiry, and used state. |
| `otp_codes` | Legacy/general OTP records retained by the current schema. |
| `universities` | University reference data. |

## Important relationships

- `complaints.user_id` identifies the student who submitted the complaint.
- `complaints.category_id` links to `categories` when a matching category exists.
- `complaints.department_id` determines the recommended or assigned department.
- `status_tracking.complaint_id`, `complaint_attachments.complaint_id`, `member_task_notes.complaint_id`, and `complaint_device_records.complaint_id` belong to a complaint.
- `department_admins` links an entry in `admins` to an entry in `departments`.
- Notifications may target a student through `user_id` or an admin through `admin_id`.

## Fresh local installation

The following order matches the current MariaDB/XAMPP setup:

1. Import `database/schema.sql`.
2. Import `database/seed.sql`.
3. Import `database/advanced_features_migration.sql`.
4. Import `database/advanced_seed.sql`.
5. Import `database/final_advanced_fix_migration.sql`.
6. Import `database/separate_role_dashboards_migration.sql`.
7. Import `database/email_verification_migration.sql`.
8. Import `database/normalize_registration_numbers.sql`.
9. Import `database/complaint_accountability_migration.sql`.
10. Run `npm run seed:admin` once to create the initial admin account if needed.

The retained migration set targets the MariaDB installation used by this project. The backend can connect to MySQL through `mysql2`, but equivalent schema syntax must be verified before using a different database engine or version.

## Existing database warning

`database/schema.sql` drops and recreates core tables. Do not import it into an existing database that contains real users or complaints. It can erase data and can fail when newer tables still reference core tables.

For an existing installation:

1. Create a database backup.
2. Inspect the current tables and columns in phpMyAdmin.
3. Run only migrations for features that are missing.
4. Do not rerun migration files that contain unguarded `CREATE INDEX` or `ADD COLUMN` statements.
5. Restart the Node.js server and check `/api/health`.

The current local database already contains the email-verification, normalized-registration, role-dashboard, advanced-analysis, and complaint-accountability structures.

## Data backup

Before schema changes, use phpMyAdmin **Export** or `mysqldump` to create a recoverable SQL backup. Back up `backend/uploads/` separately because evidence files are stored on disk, while the database stores their paths and metadata.
