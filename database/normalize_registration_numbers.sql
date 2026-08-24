USE complaint_analyzer_system;

UPDATE users
SET registration_no = UPPER(REPLACE(registration_no, ' ', ''));
