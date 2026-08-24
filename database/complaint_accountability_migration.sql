USE complaint_analyzer_system;

CREATE TABLE IF NOT EXISTS complaint_device_records (
  complaint_id INT PRIMARY KEY,
  user_id INT NOT NULL,
  ip_address VARCHAR(100) NOT NULL,
  user_agent VARCHAR(500) NOT NULL,
  device_type VARCHAR(30) NOT NULL,
  browser_name VARCHAR(80) NOT NULL,
  operating_system VARCHAR(80) NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_device_user (user_id),
  CONSTRAINT fk_device_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) ON DELETE CASCADE,
  CONSTRAINT fk_device_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

ALTER TABLE complaints ADD COLUMN IF NOT EXISTS is_flagged_false TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS false_flag_reason VARCHAR(500) NULL;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS flagged_by_admin_id INT NULL;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS flagged_at DATETIME NULL;
