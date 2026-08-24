USE complaint_analyzer_system;

CREATE TABLE IF NOT EXISTS email_verifications (
  email VARCHAR(254) PRIMARY KEY,
  code_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  last_sent_at DATETIME NOT NULL,
  INDEX idx_email_verification_expiry (expires_at)
);
