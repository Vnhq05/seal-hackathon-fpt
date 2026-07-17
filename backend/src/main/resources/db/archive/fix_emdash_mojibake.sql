-- Fix em-dash mojibake in event names / schedules.
-- Stored corruption: UTF-8 em-dash (E2 80 94) misread as Windows-1252 → U+00E2 U+20AC U+201D.
-- Run: sqlcmd -S localhost -d SEAL -U sa -P <pwd> -i fix_emdash_mojibake.sql

DECLARE @mojibake NVARCHAR(10) = NCHAR(0x00E2) + NCHAR(0x20AC) + NCHAR(0x201D); -- â€”
DECLARE @mojibakeAlt NVARCHAR(10) = NCHAR(0x00E2) + NCHAR(0x20AC) + NCHAR(0x2014); -- â€—
DECLARE @emdash NVARCHAR(1) = NCHAR(0x2014); -- —
DECLARE @endash NVARCHAR(1) = NCHAR(0x2013); -- –
-- Original seed had " — " (spaces around em-dash); replace the 3-char token only.
DECLARE @ascii NVARCHAR(1) = N'-';

UPDATE hackathon_events
SET name = REPLACE(REPLACE(REPLACE(REPLACE(name, @mojibake, @ascii), @mojibakeAlt, @ascii), @emdash, @ascii), @endash, @ascii),
    updated_at = SYSUTCDATETIME()
WHERE name LIKE N'%' + @mojibake + N'%'
   OR name LIKE N'%' + @mojibakeAlt + N'%'
   OR name LIKE N'%' + @emdash + N'%'
   OR name LIKE N'%' + @endash + N'%';

UPDATE hackathon_events
SET description = REPLACE(REPLACE(REPLACE(REPLACE(description, @mojibake, @ascii), @mojibakeAlt, @ascii), @emdash, @ascii), @endash, @ascii),
    updated_at = SYSUTCDATETIME()
WHERE description IS NOT NULL
  AND (description LIKE N'%' + @mojibake + N'%'
    OR description LIKE N'%' + @mojibakeAlt + N'%'
    OR description LIKE N'%' + @emdash + N'%'
    OR description LIKE N'%' + @endash + N'%');

IF OBJECT_ID(N'event_schedules', N'U') IS NOT NULL
BEGIN
    UPDATE event_schedules
    SET title = REPLACE(REPLACE(REPLACE(REPLACE(title, @mojibake, @ascii), @mojibakeAlt, @ascii), @emdash, @ascii), @endash, @ascii),
        description = CASE
            WHEN description IS NULL THEN NULL
            ELSE REPLACE(REPLACE(REPLACE(REPLACE(description, @mojibake, @ascii), @mojibakeAlt, @ascii), @emdash, @ascii), @endash, @ascii)
        END,
        updated_at = SYSUTCDATETIME()
    WHERE title LIKE N'%' + @mojibake + N'%'
       OR title LIKE N'%' + @mojibakeAlt + N'%'
       OR title LIKE N'%' + @emdash + N'%'
       OR title LIKE N'%' + @endash + N'%'
       OR description LIKE N'%' + @mojibake + N'%'
       OR description LIKE N'%' + @mojibakeAlt + N'%'
       OR description LIKE N'%' + @emdash + N'%'
       OR description LIKE N'%' + @endash + N'%';
END

SELECT name FROM hackathon_events ORDER BY year, name;
PRINT 'Em-dash / mojibake repair completed.';
