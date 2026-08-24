# Security and Privacy

## Current controls

- Passwords are hashed with bcrypt before storage.
- Protected API routes require a signed JSON Web Token.
- Backend middleware enforces student, admin, super-admin, and staff permissions.
- Helmet adds browser security headers.
- CORS accepts all origins in development and uses `APP_BASE_URL` in production.
- Authentication and verification requests are rate limited.
- Student Gmail addresses and normalized registration numbers are unique.
- Registration codes are stored as hashes with an expiry and attempt count.
- Uploads are filtered by MIME type and limited to 20 MB.
- Important complaint and account activity is written to audit or member-activity records.

## Email validation and verification

The registration form accepts Gmail addresses. A format check alone cannot prove that a mailbox exists. Mailbox control is confirmed only when all of the following are true:

1. Gmail SMTP credentials are configured.
2. `REQUIRE_EMAIL_VERIFICATION=true`.
3. The student receives and submits the valid registration code before it expires.

Use a Gmail App Password, not the normal Gmail password. Never commit SMTP credentials to Git.

## Sessions

Student tokens are stored in browser `localStorage` to support returning visits. Admin and staff tokens are stored in `sessionStorage`, which is cleared when the browser session ends. Logout clears both stores.

Because browser storage can be read by malicious JavaScript running on the same origin, preventing cross-site scripting remains important. The current Content Security Policy permits inline event handlers for compatibility with existing pages; production hardening should migrate those handlers to JavaScript event listeners and remove that exception.

## Complaint device records

For newly submitted complaints, the server records:

- Student and complaint identifiers.
- Network IP address observed by the server.
- Browser user-agent string.
- Parsed device type, browser name, and operating system.
- Recording time.

Authorized administrators can see this information in complaint details to support investigation of abuse or repeated false complaints. Existing complaints created before this feature may show no device record.

This metadata is limited and can be shared, changed, proxied, or spoofed. It does not collect a MAC address or a guaranteed hardware identifier, and it must not be treated as conclusive proof of identity or wrongdoing. Administrative action should use corroborating evidence, a documented review process, and an opportunity for the student to respond.

Before production use, publish a privacy notice that explains collection purpose, authorized access, retention period, correction/appeal process, and deletion rules. Limit retention to what the university actually needs and what applicable law permits.

## Evidence uploads

The server accepts JPEG, PNG, PDF, MP3, WAV, and MP4 files up to 20 MB and stores them in `backend/uploads/`. The current server exposes `/uploads` as a static path. Before storing sensitive production evidence, move downloads behind authenticated authorization checks or use private object storage with short-lived signed links. Add malware scanning and content validation for untrusted files.

## Required production settings

- Set a long, random `JWT_SECRET`; never rely on a source-code fallback.
- Set `NODE_ENV=production` and the exact HTTPS origin in `APP_BASE_URL`.
- Use a dedicated database user with only the permissions the application needs.
- Store `.env`, SMTP credentials, database passwords, and AI keys outside source control.
- Use HTTPS at the reverse proxy or hosting platform.
- Change or remove all development/default accounts and passwords.
- Restrict database and phpMyAdmin access to trusted networks or administrators.
- Back up the database and uploads, and test restoration.
- Review audit logs and rate-limit events.
- Add centralized logging without recording passwords, tokens, verification codes, or full sensitive complaint text.

## AI decision safety

Category, sentiment, priority, emotion, toxicity, and fake probability are automated estimates. They may be incorrect or biased. Keep a human reviewer responsible for complaint routing, false-complaint flags, sanctions, and final resolution.
