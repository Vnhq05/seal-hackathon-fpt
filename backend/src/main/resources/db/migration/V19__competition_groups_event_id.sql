-- V19: competition_groups.event_id required on live SEAL DBs (entity previously omitted it).
-- All references to event_id must be dynamic SQL: SQL Server binds the whole batch at
-- compile time, so a static WHERE event_id / UPDATE / FK fails when the column is being added.

IF OBJECT_ID(N'dbo.competition_groups', N'U') IS NULL
BEGIN
    -- Table not present on this DB; nothing to migrate.
    RETURN;
END;

IF COL_LENGTH(N'dbo.competition_groups', N'event_id') IS NULL
BEGIN
    ALTER TABLE dbo.competition_groups ADD event_id uniqueidentifier NULL;
END;

EXEC(N'
UPDATE cg
SET cg.event_id = t.event_id
FROM dbo.competition_groups cg
INNER JOIN dbo.tracks t ON t.id = cg.track_id
WHERE cg.event_id IS NULL;
');

EXEC(N'
IF COL_LENGTH(N''dbo.competition_groups'', N''event_id'') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.competition_groups WHERE event_id IS NULL)
BEGIN
    ALTER TABLE dbo.competition_groups ALTER COLUMN event_id uniqueidentifier NOT NULL;
END
');

EXEC(N'
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys WHERE name = N''fk_competition_group_event''
)
AND COL_LENGTH(N''dbo.competition_groups'', N''event_id'') IS NOT NULL
BEGIN
    ALTER TABLE dbo.competition_groups
        ADD CONSTRAINT fk_competition_group_event
        FOREIGN KEY (event_id) REFERENCES dbo.hackathon_events (id);
END
');
