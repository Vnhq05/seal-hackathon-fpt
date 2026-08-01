-- Seed structured prizes for Demo 6 (feature pack event).
-- Requires assignment_mode column (V24). Sets orphan columns active/award_type explicitly.

SET NOCOUNT ON;

DECLARE @eventId UNIQUEIDENTIFIER = (
    SELECT TOP 1 id FROM dbo.hackathon_events
    WHERE name = N'Demo 6 - Final Advancement (Prelim Done)'
);
DECLARE @now DATETIME2 = SYSUTCDATETIME();

IF @eventId IS NULL
BEGIN
    RAISERROR('Demo 6 event not found.', 16, 1);
    RETURN;
END

IF COL_LENGTH('dbo.prizes', 'assignment_mode') IS NULL
BEGIN
    RAISERROR('Column prizes.assignment_mode missing. Run Flyway V24 first.', 16, 1);
    RETURN;
END

DELETE FROM dbo.prizes WHERE event_id = @eventId;

-- award_type CHECK: RANK_BASED | SPECIAL | PARTICIPATION
INSERT INTO dbo.prizes (
    id, event_id, rank, value, quantity, label, assignment_mode,
    active, award_type, created_at, updated_at
)
VALUES
    (NEWID(), @eventId, N'FIRST',       N'7000000', 1, N'First Prize',                N'RANK_BASED', 1, N'RANK_BASED', @now, @now),
    (NEWID(), @eventId, N'SECOND',      N'5000000', 1, N'Second Prize',               N'RANK_BASED', 1, N'RANK_BASED', @now, @now),
    (NEWID(), @eventId, N'THIRD',       N'3000000', 1, N'Third Prize',                N'RANK_BASED', 1, N'RANK_BASED', @now, @now),
    (NEWID(), @eventId, N'CONSOLATION', N'1500000', 1, N'Encouragement Prize',        N'RANK_BASED', 1, N'RANK_BASED', @now, @now),
    (NEWID(), @eventId, N'CONSOLATION', N'1000000', 1, N'Most Liked on Social Media', N'MANUAL',     1, N'SPECIAL',    @now, @now);

PRINT CONCAT('Demo 6 prizes seeded for event ', CONVERT(nvarchar(36), @eventId));
SELECT rank, value, label, assignment_mode, award_type
FROM dbo.prizes WHERE event_id = @eventId
ORDER BY CASE rank WHEN 'FIRST' THEN 1 WHEN 'SECOND' THEN 2 WHEN 'THIRD' THEN 3 ELSE 4 END, label;
GO
