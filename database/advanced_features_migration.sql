USE complaint_analyzer_system;

CREATE TABLE IF NOT EXISTS universities (
  university_id INT AUTO_INCREMENT PRIMARY KEY,
  university_name VARCHAR(180) NOT NULL,
  city VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
  department_id INT AUTO_INCREMENT PRIMARY KEY,
  department_name VARCHAR(120) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS department_admins (
  department_admin_id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  department_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaint_attachments (
  attachment_id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_type VARCHAR(120),
  file_size INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  admin_id INT,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info','success','warning','danger') DEFAULT 'info',
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  audit_id INT AUTO_INCREMENT PRIMARY KEY,
  actor_type ENUM('student','admin','system') DEFAULT 'system',
  actor_id INT,
  action VARCHAR(150) NOT NULL,
  description TEXT,
  ip_address VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chatbot_messages (
  message_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  sender ENUM('student','bot') NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE complaints ADD COLUMN IF NOT EXISTS department_id INT NULL;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS expected_resolution_time VARCHAR(100) NULL;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS ai_recommendation TEXT NULL;
