-- Remap legacy Winter academic season to Fall (FPT: Fall = Oct–Jan).

SET NOCOUNT ON;
GO

UPDATE hackathon_events
SET season = N'Fall',
    updated_at = SYSUTCDATETIME()
WHERE UPPER(LTRIM(RTRIM(season))) = N'WINTER';
GO

UPDATE hackathon_events
SET name = REPLACE(name, N'Winter', N'Fall'),
    updated_at = SYSUTCDATETIME()
WHERE name LIKE N'%Winter%';
GO

UPDATE hackathon_events
SET description = REPLACE(description, N'Winter', N'Fall'),
    updated_at = SYSUTCDATETIME()
WHERE description LIKE N'%Winter%';
GO
