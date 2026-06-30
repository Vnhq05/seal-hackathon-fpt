-- Rename IUH domain from iuh.edu.vn to student.iuh.edu.vn for existing events.

UPDATE allowed_email_domains
SET domain = 'student.iuh.edu.vn',
    university_label = N'Industrial University of Ho Chi Minh City',
    updated_at = SYSUTCDATETIME()
WHERE domain = 'iuh.edu.vn';

PRINT 'IUH domain updated to student.iuh.edu.vn.';
