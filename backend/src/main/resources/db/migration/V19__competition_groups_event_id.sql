-- V19: competition_groups.event_id required on live SEAL DBs (entity previously omitted it).
IF COL_LENGTH(N'dbo.competition_groups', N'event_id') IS NULL
BEGIN
    ALTER TABLE dbo.competition_groups ADD event_id uniqueidentifier NULL;

    UPDATE cg
    SET cg.event_id = t.event_id
    FROM dbo.competition_groups cg
    INNER JOIN dbo.tracks t ON t.id = cg.track_id;

    ALTER TABLE dbo.competition_groups ALTER COLUMN event_id uniqueidentifier NOT NULL;
END
ELSE
BEGIN
    UPDATE cg
    SET cg.event_id = t.event_id
    FROM dbo.competition_groups cg
    INNER JOIN dbo.tracks t ON t.id = cg.track_id
    WHERE cg.event_id IS NULL;
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys WHERE name = N'fk_competition_group_event'
)
BEGIN
    ALTER TABLE dbo.competition_groups
        ADD CONSTRAINT fk_competition_group_event
        FOREIGN KEY (event_id) REFERENCES dbo.hackathon_events (id);
END;
