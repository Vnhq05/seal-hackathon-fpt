-- Fix corrupted Vietnamese / Unicode text for SEAL Spring 2026 (mojibake + VARCHAR data loss).
-- Run once: sqlcmd -S localhost -d SEAL -i seal_spring_2026_encoding_fix.sql

DECLARE @now DATETIME2 = SYSUTCDATETIME();

-- ── Promote text columns to NVARCHAR (VARCHAR cannot store Vietnamese reliably) ──
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'university_name' AND system_type_id = TYPE_ID('varchar'))
    ALTER TABLE users ALTER COLUMN university_name NVARCHAR(255) NULL;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'full_name' AND system_type_id = TYPE_ID('varchar'))
    ALTER TABLE users ALTER COLUMN full_name NVARCHAR(255) NOT NULL;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('hackathon_events') AND name = 'description' AND system_type_id = TYPE_ID('varchar'))
    ALTER TABLE hackathon_events ALTER COLUMN description NVARCHAR(2000) NULL;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tracks') AND name = 'name' AND system_type_id = TYPE_ID('varchar'))
    ALTER TABLE tracks ALTER COLUMN name NVARCHAR(255) NOT NULL;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tracks') AND name = 'description' AND system_type_id = TYPE_ID('varchar'))
    ALTER TABLE tracks ALTER COLUMN description NVARCHAR(1000) NULL;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('rounds') AND name = 'name' AND system_type_id = TYPE_ID('varchar'))
    ALTER TABLE rounds ALTER COLUMN name NVARCHAR(255) NOT NULL;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('criteria') AND name = 'name' AND system_type_id = TYPE_ID('varchar'))
    ALTER TABLE criteria ALTER COLUMN name NVARCHAR(255) NOT NULL;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('criteria') AND name = 'description' AND system_type_id = TYPE_ID('varchar'))
    ALTER TABLE criteria ALTER COLUMN description NVARCHAR(1000) NULL;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('event_schedules') AND name = 'title' AND system_type_id = TYPE_ID('varchar'))
    ALTER TABLE event_schedules ALTER COLUMN title NVARCHAR(255) NOT NULL;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('event_schedules') AND name = 'description' AND system_type_id = TYPE_ID('varchar'))
    ALTER TABLE event_schedules ALTER COLUMN description NVARCHAR(1000) NULL;
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('prizes') AND name = 'label' AND system_type_id = TYPE_ID('varchar'))
    ALTER TABLE prizes ALTER COLUMN label NVARCHAR(100) NULL;
GO

-- ── Repair SEAL_RAG_2026 event content ──
UPDATE hackathon_events
SET description = N'SEAL Hackathon Spring 2026 — Agentic RAG',
    updated_at = SYSUTCDATETIME()
WHERE competition_format = 'SEAL_RAG_2026'
  AND (description IS NULL OR description LIKE N'%â%' OR description LIKE N'%Ã%' OR description NOT LIKE N'%—%Agentic RAG%');
GO

UPDATE t
SET t.name = CASE
        WHEN t.name LIKE N'%A' OR t.name LIKE N'% A' OR t.name LIKE N'Track A' THEN N'Track A'
        WHEN t.name LIKE N'%B' OR t.name LIKE N'% B' OR t.name LIKE N'Track B' THEN N'Track B'
        WHEN t.name LIKE N'%C' OR t.name LIKE N'% C' OR t.name LIKE N'Track C' THEN N'Track C'
        ELSE t.name
    END,
    t.description = CASE
        WHEN t.name LIKE N'%A' OR t.name LIKE N'% A' OR t.name LIKE N'Track A' THEN N'SEAL Spring 2026 — Track A'
        WHEN t.name LIKE N'%B' OR t.name LIKE N'% B' OR t.name LIKE N'Track B' THEN N'SEAL Spring 2026 — Track B'
        WHEN t.name LIKE N'%C' OR t.name LIKE N'% C' OR t.name LIKE N'Track C' THEN N'SEAL Spring 2026 — Track C'
        ELSE t.description
    END,
    t.updated_at = SYSUTCDATETIME()
FROM tracks t
INNER JOIN hackathon_events e ON t.event_id = e.id
WHERE e.competition_format = 'SEAL_RAG_2026'
  AND (t.name LIKE N'%â%' OR t.name LIKE N'%º%' OR t.name LIKE N'%Ã%');
GO

UPDATE r
SET r.name = N'Preliminary Round', r.updated_at = SYSUTCDATETIME()
FROM rounds r
INNER JOIN hackathon_events e ON r.event_id = e.id
WHERE e.competition_format = 'SEAL_RAG_2026'
  AND r.round_type = 'PRELIMINARY'
  AND (r.name LIKE N'%â%' OR r.name LIKE N'%º%' OR r.name LIKE N'%Ã%' OR r.name NOT IN (N'Preliminary Round', N'Vòng bảng'));
GO

UPDATE r
SET r.name = N'Finals', r.updated_at = SYSUTCDATETIME()
FROM rounds r
INNER JOIN hackathon_events e ON r.event_id = e.id
WHERE e.competition_format = 'SEAL_RAG_2026'
  AND r.round_type = 'FINAL'
  AND (r.name LIKE N'%â%' OR r.name LIKE N'%º%' OR r.name LIKE N'%Ã%' OR r.name NOT IN (N'Finals', N'Chung kết'));
GO

UPDATE p
SET p.label = CASE p.rank
        WHEN 'FIRST' THEN N'First Prize'
        WHEN 'SECOND' THEN N'Second Prize'
        WHEN 'THIRD' THEN N'Third Prize'
        WHEN 'CONSOLATION' THEN N'Consolation Prize'
        ELSE p.label
    END,
    p.updated_at = SYSUTCDATETIME()
FROM prizes p
INNER JOIN hackathon_events e ON p.event_id = e.id
WHERE e.competition_format = 'SEAL_RAG_2026'
  AND (p.label LIKE N'%â%' OR p.label LIKE N'%º%' OR p.label LIKE N'%Ã%');
GO

-- Allowed email domain labels
UPDATE allowed_email_domains SET university_label = N'Ho Chi Minh City University of Technology' WHERE domain = 'hcmut.edu.vn';
UPDATE allowed_email_domains SET university_label = N'Vietnam National University Ho Chi Minh City - University of Science' WHERE domain IN ('hcmus.edu.vn', 'student.hcmus.edu.vn');
UPDATE allowed_email_domains SET university_label = N'University of Information Technology' WHERE domain = 'uit.edu.vn';
UPDATE allowed_email_domains SET university_label = N'Ho Chi Minh City University of Education and Technology' WHERE domain = 'hcmute.edu.vn';
UPDATE allowed_email_domains SET university_label = N'University of Economics Ho Chi Minh City' WHERE domain IN ('ueh.edu.vn', 'student.ueh.edu.vn');
UPDATE allowed_email_domains SET university_label = N'Industrial University of Ho Chi Minh City' WHERE domain = 'student.iuh.edu.vn';
GO

-- Repair external students whose school name was truncated (VARCHAR) or corrupted
UPDATE u
SET u.university_name = d.university_label,
    u.updated_at = SYSUTCDATETIME()
FROM users u
INNER JOIN allowed_email_domains d
    ON LOWER(SUBSTRING(u.email, CHARINDEX('@', u.email) + 1, LEN(u.email))) = d.domain
INNER JOIN hackathon_events e ON d.event_id = e.id AND e.competition_format = 'SEAL_RAG_2026'
WHERE u.user_type = 'EXTERNAL_STUDENT'
  AND d.university_label IS NOT NULL
  AND (u.university_name IS NULL
       OR u.university_name LIKE N'%?%'
       OR u.university_name LIKE N'%â%'
       OR u.university_name <> d.university_label);
GO

PRINT 'SEAL Spring 2026 Unicode repair completed.';

