USE complaint_analyzer_system;

CREATE TABLE IF NOT EXISTS member_activity_logs (
  activity_id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  role VARCHAR(50),
  action VARCHAR(150) NOT NULL,
  complaint_id INT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS member_task_notes (
  note_id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  complaint_id INT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE admins
MODIFY COLUMN role ENUM('super_admin','department_admin','faculty_staff','reviewer','admin') DEFAULT 'admin';

UPDATE admins SET role='super_admin' WHERE email='admin@example.com';
