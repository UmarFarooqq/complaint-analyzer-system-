# Production Deployment Guide

## Requirements

- A current Node.js LTS release and npm.
- MySQL or MariaDB. The local system is verified with MariaDB 10.4 in XAMPP.
- A persistent directory or private object store for uploaded evidence.
- An SMTP account if email verification, welcome messages, and password reset are enabled.
- An OpenAI API key only when external AI analysis is enabled.

## Local setup with XAMPP and phpMyAdmin

1. Start Apache and MySQL in XAMPP.
2. Open `http://localhost/phpmyadmin/`.
3. For a clean installation, import the SQL files in the order documented in [Database structure](DATABASE_STRUCTURE.md). Do not rerun `database/schema.sql` against a database containing real data.
4. Copy `.env.example` to `.env` and replace every sample value.
5. Install packages and create the initial admin if needed:

```powershell
npm install
npm run seed:admin
```

6. Start the development server:

```powershell
npm run dev
```

7. Open `http://localhost:5000/` and verify `http://localhost:5000/api/health`.

Run `rs` only inside the active nodemon terminal. At a normal PowerShell prompt, restart with `npm run dev` instead. If port `5000` is already in use, stop the existing application process or set a different `PORT` in `.env`.

## Environment configuration

Start from [`.env.example`](../.env.example):

```env
PORT=5000
NODE_ENV=production
APP_BASE_URL=https://complaints.example.edu

DB_HOST=database-host
DB_USER=complaint_app
DB_PASSWORD=replace_with_a_strong_password
DB_NAME=complaint_analyzer_system

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=youraddress@gmail.com
EMAIL_PASS=your_16_character_gmail_app_password
EMAIL_FROM=Complaint Analyzer System <youraddress@gmail.com>
REQUIRE_EMAIL_VERIFICATION=true

USE_OPENAI_AI=false
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

For Gmail, enable two-step verification on the sending account and create an App Password. `EMAIL_SECURE=false` is correct for STARTTLS on port `587`; port `465` normally uses `EMAIL_SECURE=true`.

If SMTP is unavailable, set `REQUIRE_EMAIL_VERIFICATION=false` only for local development. Production registration should keep it enabled so the student demonstrates control of the Gmail address.

## Database deployment

Back up the target database before every migration. The repository contains the current incremental migration set. For a clean installation, use the documented order; for an existing database, apply only structures that are missing as described in [Database structure](DATABASE_STRUCTURE.md).

Use a dedicated database account rather than a root account. Allow connections only from the application host when possible.

## Application deployment

1. Install production dependencies with `npm install --omit=dev`.
2. Ensure `backend/uploads/` is writable and persistent, or replace it with private object storage.
3. Start the application with `npm start` under a process manager or hosting service.
4. Put the Node.js service behind an HTTPS reverse proxy.
5. Route the public origin to the configured `PORT` and keep `APP_BASE_URL` equal to the exact HTTPS origin.
6. Configure health monitoring against `/api/health`.

The repository includes `Dockerfile`, `docker-compose.yml`, `Procfile`, and `render.yaml`. Treat them as deployment starting points and validate database networking, persistent uploads, environment secrets, TLS, and health checks on the chosen platform.

## Release verification

- Public landing and first-visit introduction load without JavaScript errors.
- Student registration rejects duplicate Gmail addresses and registration numbers.
- Verification and welcome emails arrive when SMTP is enabled.
- Student login works with Gmail and registration number.
- Admin and staff use `/admin/admin-login.html`, and role redirects are correct.
- Complaint submission writes complaint, status, notification, analysis, and new device metadata records.
- Student dashboards and complaint history show live database data.
- Admin status changes and notes appear in the student's notifications.
- Analytics, predictions, role management, member activity, and CSV export enforce their expected roles.
- Evidence files persist after an application restart and are not exposed publicly in production.
- Logout clears the active session and admin sessions do not persist after the browser closes.

## Production safety checklist

- Never deploy the repository's example JWT secret or a default admin password.
- Never commit `.env` or credentials.
- Restrict phpMyAdmin and database access.
- Use HTTPS and secure backups.
- Define retention and access rules for complaints, attachments, audit logs, and device records.
- Require human review for AI predictions and false-complaint decisions.
