# Complaint Analyzer System Documentation

Last verified against the local application and MariaDB database: 24 August 2026.

This folder contains the maintained documentation for the current system. Historical one-off fix notes and empty template files have been removed because they no longer describe the complete application.

## Documentation

- [System overview](SYSTEM_OVERVIEW.md) — architecture, roles, workflows, pages, and AI behavior.
- [API documentation](API_DOCUMENTATION.md) — current HTTP endpoints and request examples.
- [Database structure](DATABASE_STRUCTURE.md) — current tables, relationships, and migration guidance.
- [Security and privacy](SECURITY_AND_PRIVACY.md) — authentication, email verification, uploads, and complaint device records.
- [Production deployment guide](PRODUCTION_DEPLOYMENT_GUIDE.md) — local setup, environment variables, database setup, and deployment checks.

## Quick access

- Public site: `http://localhost:5000/`
- Student login: `http://localhost:5000/user/login.html`
- Admin and staff login: `http://localhost:5000/admin/admin-login.html`
- API health check: `http://localhost:5000/api/health`
- phpMyAdmin, when XAMPP is running: `http://localhost/phpmyadmin/`

The application serves the frontend and API from the same Node.js server. The default port is `5000` unless `PORT` is changed in `.env`.

## Main source locations

- Server entry point: [`backend/server.js`](../backend/server.js)
- Frontend entry point: [`frontend/index.html`](../frontend/index.html)
- Environment template: [`.env.example`](../.env.example)
- Base database schema: [`database/schema.sql`](../database/schema.sql)
- Package scripts: [`package.json`](../package.json)
