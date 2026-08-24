# Complaint Analyzer System

A university complaint platform with student registration, live complaint tracking, AI-assisted analysis, department routing, role-based administration, evidence uploads, notifications, analytics, and audit records.

## Main capabilities

- Student registration with a unique Gmail address and university registration number.
- Optional Gmail verification, welcome email, and password-reset email through SMTP.
- Student login using Gmail or registration number.
- Complaint submission with JPEG, PNG, PDF, MP3, WAV, or MP4 evidence up to 20 MB.
- Local category, sentiment, priority, emotion, toxicity, and fake-probability analysis.
- Optional OpenAI analysis with automatic local fallback.
- Live student dashboards, complaint history, status tracking, notifications, and assistant chat.
- Separate Super Admin, Department Admin, Faculty Staff, and Reviewer workflows.
- Live complaint management, analytics, predictions, CSV export, member activity, and audit logs.
- Server-observed device metadata for new complaints to support accountable manual review.

AI classifications and device metadata are review signals, not proof. Human review is required for false-complaint decisions or disciplinary action.

## Technology

- Node.js 20 or newer and Express 5.
- MariaDB/MySQL through `mysql2`.
- Static HTML, CSS, and browser JavaScript served by Express.
- JWT authentication, bcrypt password hashing, Helmet, CORS, and request rate limits.
- Nodemailer for Gmail SMTP and Multer for evidence uploads.

## Local setup with XAMPP

### 1. Install dependencies

Open PowerShell in the project directory:

```powershell
cd complaint-analyzer-system
npm install
```

### 2. Configure the environment

If `.env` does not already exist, create it from the template:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set the database, JWT, SMTP, and optional AI values. Never commit `.env`.

For local XAMPP, the common database values are:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=complaint_analyzer_system
```

Replace `JWT_SECRET` with a long random value. For Gmail delivery, use a Gmail App Password instead of the normal account password.

### 3. Create the database

Start Apache and MySQL in XAMPP, then open `http://localhost/phpmyadmin/`.

For a clean installation, import these files in order:

1. `database/schema.sql`
2. `database/seed.sql`
3. `database/advanced_features_migration.sql`
4. `database/advanced_seed.sql`
5. `database/final_advanced_fix_migration.sql`
6. `database/separate_role_dashboards_migration.sql`
7. `database/email_verification_migration.sql`
8. `database/normalize_registration_numbers.sql`
9. `database/complaint_accountability_migration.sql`

Important: `database/schema.sql` drops and recreates core tables. Never import it into an existing database containing real data. See [Database structure](docs/DATABASE_STRUCTURE.md) before upgrading an existing installation.

### 4. Create the development admin

```powershell
npm run seed:admin
```

This development helper creates or resets `admin@example.com` with password `123456`. Run it only in a local development database, log in once, and replace the account credentials before any real deployment.

### 5. Start the application

```powershell
npm run dev
```

Open:

- Public site: `http://localhost:5000/`
- Student login: `http://localhost:5000/user/login.html`
- Admin and staff login: `http://localhost:5000/admin/admin-login.html`
- API health check: `http://localhost:5000/api/health`

If port `5000` is already in use, stop the existing Node process or change `PORT` in `.env`. The `rs` command works only inside the terminal where nodemon is currently running.

## Email verification

Production registration should use:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=youraddress@gmail.com
EMAIL_PASS=your_16_character_gmail_app_password
EMAIL_FROM=Complaint Analyzer System <youraddress@gmail.com>
REQUIRE_EMAIL_VERIFICATION=true
```

When SMTP is not configured, set `REQUIRE_EMAIL_VERIFICATION=false` only for local development. Welcome and password-reset emails also require working SMTP settings.

## Optional OpenAI analysis

The application works with its local analysis engine by default:

```env
USE_OPENAI_AI=false
```

To enable external analysis:

```env
USE_OPENAI_AI=true
OPENAI_API_KEY=replace_with_your_key
OPENAI_MODEL=gpt-4o-mini
```

If the external request fails, complaint analysis falls back to the local engine.

## Docker Compose

Copy `.env.example` to `.env`, replace `JWT_SECRET`, `DOCKER_DB_PASSWORD`, and `DOCKER_DB_ROOT_PASSWORD`, then run:

```powershell
docker compose up --build
```

The stack starts the application on `APP_PORT` (default `5000`) and MariaDB on host port `DOCKER_DB_PORT` (default `3307`). The application waits for MariaDB to become healthy, and the complete current schema is initialized in a new database volume.

Create the development admin inside the running app container when needed:

```powershell
docker compose exec app npm run seed:admin
```

Database and uploaded evidence use named volumes. SQL initialization runs only when the database volume is empty. Removing volumes deletes that Docker-managed data.

## Render deployment

`render.yaml` defines the Node web service, production start command, health check, generated JWT secret, and required environment-variable names. Supply an external MariaDB/MySQL database because the blueprint does not create one.

Set `APP_BASE_URL` to the final HTTPS site URL and enter the database and email secrets in the Render dashboard. Uploaded files require a persistent disk or private object storage; an ephemeral filesystem is not suitable for production evidence.

See [Production deployment](docs/PRODUCTION_DEPLOYMENT_GUIDE.md) and [Security and privacy](docs/SECURITY_AND_PRIVACY.md) before deployment.

## npm commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the server with nodemon for local development. |
| `npm start` | Start the production Node process. |
| `npm run seed:admin` | Create or reset the local development admin. |
| `npm run check:syntax` | Check the main backend and frontend JavaScript entry files. |

## Documentation

- [Documentation index](docs/README.md)
- [System overview](docs/SYSTEM_OVERVIEW.md)
- [API documentation](docs/API_DOCUMENTATION.md)
- [Database structure](docs/DATABASE_STRUCTURE.md)
- [Security and privacy](docs/SECURITY_AND_PRIVACY.md)
- [Production deployment](docs/PRODUCTION_DEPLOYMENT_GUIDE.md)
