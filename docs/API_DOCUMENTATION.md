# API Documentation

Base URL for local development: `http://localhost:5000/api`

Most endpoints return JSON in this form:

```json
{
  "success": true
}
```

Protected routes require the token returned by login:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

The attachment route uses `multipart/form-data`; the complaint report route returns CSV.

## Health and public data

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | Confirm that the API server is running. |
| GET | `/public/overview` | Public | Return public site overview data. |

## Authentication

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/auth/student/verification-config` | Public | Return whether email verification is required. |
| POST | `/auth/student/send-verification-code` | Public, rate limited | Send a student registration code to a valid Gmail address. |
| POST | `/auth/student/register` | Public | Create one student account per Gmail and registration number. |
| POST | `/auth/student/login` | Public | Log in with Gmail or university registration number. |
| POST | `/auth/admin/login` | Public | Log in an admin or staff account. |
| POST | `/auth/forgot-password` | Public | Send a password-reset link when SMTP is configured. |
| POST | `/auth/reset-password` | Public | Set a new password using a valid reset token. |

Student registration request:

```json
{
  "full_name": "Student Name",
  "email": "student@gmail.com",
  "registration_no": "UNI-2026-001",
  "password": "strong-password",
  "verification_code": "123456"
}
```

`verification_code` is required only when `REQUIRE_EMAIL_VERIFICATION=true`.

Student login request:

```json
{
  "identity": "student@gmail.com or UNI-2026-001",
  "password": "student-password"
}
```

Admin login uses `email` and `password`. Password-reset requests use `email` and `userType`; reset submissions use `token`, `userType`, and `newPassword`.

## Student complaints

All routes in this section require a student token.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/complaints` | Submit a JSON complaint without an attachment. |
| POST | `/complaints/with-attachment` | Submit a complaint and optional evidence file. |
| GET | `/complaints/my` | Return all complaints owned by the logged-in student. |
| GET | `/complaints/my/dashboard` | Return live counts, recent complaints, and summary data. |

JSON complaint body:

```json
{
  "title": "Incorrect fee balance",
  "description": "The paid amount is still shown as outstanding.",
  "manual_category": "Fee Issue"
}
```

For `/complaints/with-attachment`, send the same fields as form data and use `attachment` as the file field. Allowed server-side MIME types are JPEG, PNG, PDF, MP3, WAV, and MP4, with a maximum size of 20 MB.

## Student complaint assistant

These routes require a student token.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/chatbot/message` | Send a message to the contextual complaint assistant. |
| GET | `/chatbot/history` | Return the student's assistant conversation history. |

Message body:

```json
{
  "message": "What is happening with my latest complaint?"
}
```

## Shared and department features

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/advanced/departments` | Authenticated | List departments. |
| GET | `/advanced/notifications` | Authenticated | Return notifications for the logged-in account. |
| GET | `/advanced/department-complaints` | Authorized staff | Return complaints within the member's allowed department scope. |
| PUT | `/advanced/department-complaints/:complaint_id/status` | Authorized staff | Update a department complaint with `status` and optional `note`. |
| GET | `/members/my-work` | Authorized staff | Return the member's work summary. |
| POST | `/members/complaints/:complaint_id/notes` | Authorized staff | Add a complaint note. |
| GET | `/members/complaints/:complaint_id/notes` | Authorized staff | Return complaint notes. |

## Admin complaint management

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/complaints` | Admin | Return all complaints. |
| GET | `/admin/complaints/:complaint_id` | Admin | Return complaint details, status history, attachments, and available device metadata. |
| PUT | `/admin/complaints/:complaint_id/status` | Admin | Update `status` and optional `note`; notify the student. |
| PUT | `/admin/complaints/:complaint_id/false-flag` | Admin | Set a potential-false flag and reason; notify the student. |
| GET | `/admin/dashboard/stats` | Admin | Return live admin dashboard totals and overview data. |
| GET | `/admin/analytics` | Admin | Return live category, sentiment, priority, and monthly analytics. |

Status update body:

```json
{
  "status": "In Progress",
  "note": "The Finance Office is checking the payment record."
}
```

Supported statuses are `Pending`, `In Progress`, and `Resolved`.

Potential-false flag body:

```json
{
  "flagged": true,
  "reason": "Conflicting evidence requires manual review."
}
```

## Analytics, roles, and super-admin operations

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/advanced/analytics` | Super Admin | Return extended live analytics. |
| GET | `/advanced/predictions` | Super Admin | Return live prediction summaries. |
| GET | `/advanced/audit-logs` | Super Admin | Return the latest audit records. |
| GET | `/advanced/reports/complaints.csv` | Super Admin | Export complaints as CSV. |
| GET | `/members/activity` | Super Admin | Return department-member activity. |
| POST | `/roles/department-admin` | Super Admin | Create a department admin, faculty staff, or reviewer account. |
| GET | `/roles/admins` | Super Admin | List admin and staff accounts. |
| GET | `/roles/my-department` | Admin or Super Admin | Return the linked department. |
| DELETE | `/full-admin/accounts/:admin_id` | Super Admin | Delete an admin or staff account. |
| DELETE | `/full-admin/complaints/:complaint_id` | Super Admin | Delete a complaint. |

Role-account creation accepts `full_name`, `email`, `password`, `department_id`, and `role`.

## Common errors

| Status | Meaning |
| --- | --- |
| 400 | Missing, malformed, unsupported, or expired request data. |
| 401 | Authorization token is missing, invalid, or expired. |
| 403 | The logged-in role is not allowed to perform the action. |
| 404 | The route or requested record was not found. |
| 409 | A Gmail address or registration number is already registered. |
| 429 | Too many requests were made within the configured rate-limit window. |
| 500 | The server, database, SMTP provider, or optional AI provider failed. |
