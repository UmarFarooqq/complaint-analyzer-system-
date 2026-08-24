USE complaint_analyzer_system;

INSERT IGNORE INTO departments (department_name, description) VALUES
('Academic Department', 'Handles class, teacher, exam, attendance, course and academic complaints'),
('Finance Office', 'Handles fee, challan, dues, scholarship and payment complaints'),
('Administration Office', 'Handles staff, documents, certificates, transcript and management complaints'),
('Student Affairs', 'Handles general student support and other complaints');

INSERT IGNORE INTO universities (university_name, city) VALUES
('Demo University', 'Demo City');
