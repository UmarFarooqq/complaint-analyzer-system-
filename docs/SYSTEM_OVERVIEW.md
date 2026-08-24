# System Overview

## Purpose

Complaint Analyzer System lets university students submit and track complaints while administrators and department members review, route, annotate, and resolve them. Dashboard counts, complaint lists, analytics, predictions, notifications, and status histories are loaded from the API and MariaDB rather than fixed demonstration values.

## Technology

- Frontend: static HTML, CSS, and browser JavaScript.
- Backend: Node.js and Express.
- Database: MySQL-compatible SQL; the current local installation uses MariaDB 10.4 through phpMyAdmin/XAMPP.
- Authentication: JSON Web Tokens with role checks.
- Email: Nodemailer with Gmail SMTP or another compatible SMTP provider.
- AI: built-in local analysis with optional OpenAI analysis and local fallback.

The Express server serves both `frontend/` and `/api/*`. Uploaded evidence is stored in `backend/uploads/`.

## User roles

| Role | Main capabilities |
| --- | --- |
| Student | Register, log in with Gmail or registration number, submit complaints, upload evidence, track status, view notifications, and use the complaint assistant. |
| Super Admin | View all complaints and live analytics, manage complaint status and false-complaint flags, create or delete role accounts, view member activity and audit logs, export reports, and delete complaints. |
| Admin | Review complaints and update complaint status where allowed by backend permissions. |
| Department Admin | Work with complaints assigned to the linked department and add follow-up notes. |
| Faculty Staff | Work with authorized department complaints and add follow-up notes. |
| Reviewer | Review authorized department complaints and add follow-up notes. |

Admin and staff accounts use the separate admin login page. The backend, not only the page navigation, enforces role permissions.

## Student account rules

- Each Gmail address can have only one student account.
- Each normalized university registration number can have only one student account.
- Registration numbers are converted to uppercase and spaces are removed before comparison.
- Student login accepts either the Gmail address or the university registration number in the identity field.
- When `REQUIRE_EMAIL_VERIFICATION=true`, registration requires the current verification code sent to the Gmail address.
- A welcome email is attempted after successful registration when SMTP is configured. Registration still succeeds if the welcome email cannot be delivered.

Student sessions are stored in `localStorage`, allowing a returning student to go directly to the dashboard until logout, token expiry, or storage removal. Admin and staff sessions use `sessionStorage`, so closing the browser window ends the browser-side session.

## Complaint workflow

1. A student submits a title, description, optional category, and optional evidence file.
2. The analysis engine classifies category, sentiment, priority, emotion, toxicity, fake probability, recommended department, and expected resolution information.
3. The complaint, analysis, initial status, notification, audit event, and available request/device metadata are saved in MariaDB.
4. The complaint appears in the student's live dashboard and in the appropriate administrative views.
5. An authorized administrator or department member updates the status or adds a note.
6. The student receives a notification and sees the updated status in complaint history.
7. Authorized administrators can flag a complaint as potentially false and record a reason. The student receives a notification when the flag changes.

Device metadata and AI fake probability are review signals only. They do not independently prove that a complaint is false or identify a person with certainty. See [Security and privacy](SECURITY_AND_PRIVACY.md).

## AI features

The local analysis engine works without an external API. It provides complaint classification and powers the complaint assistant using the student's complaint context. If `USE_OPENAI_AI=true` and a valid key is configured, the backend can request enhanced analysis; failures fall back to the local engine.

Human review remains required for administrative decisions. AI priority, toxicity, and fake-probability values should not be used as the sole reason for disciplinary action.

## Main pages

| Area | Page |
| --- | --- |
| First-visit introduction | `/welcome.html` |
| Student login | `/user/login.html` |
| Student registration | `/user/register.html` |
| Student dashboard | `/user/dashboard.html` |
| Submit complaint | `/user/submit-complaint.html` |
| Complaint history | `/user/complaint-history.html` |
| Student notifications | `/user/notifications.html` |
| Complaint assistant | `/user/chatbot.html` |
| Admin and staff login | `/admin/admin-login.html` |
| Admin dashboard | `/admin/dashboard.html` |
| Complaint management | `/admin/complaints.html` |
| Reports and analytics | `/admin/analytics.html` and `/admin/advanced-analytics.html` |
| AI predictions | `/admin/predictions.html` |
| Department dashboard | `/department/dashboard.html` |
| Faculty dashboard | `/faculty/dashboard.html` |
| Reviewer dashboard | `/reviewer/dashboard.html` |
