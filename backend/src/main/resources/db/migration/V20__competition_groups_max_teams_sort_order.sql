-- V20: document live competition_groups columns used by entity (max_teams, sort_order).
-- Live SEAL DB already has these NOT NULL; this migration is idempotent for other envs.

IF COL_LENGTH(N'dbo.competition_groups', N'max_teams') IS NULL
BEGIN
    ALTER TABLE dbo.competition_groups ADD max_teams INT NULL;
    UPDATE dbo.competition_groups SET max_teams = 10 WHERE max_teams IS NULL;
    ALTER TABLE dbo.competition_groups ALTER COLUMN max_teams INT NOT NULL;
END;

IF COL_LENGTH(N'dbo.competition_groups', N'sort_order') IS NULL
BEGIN
    ALTER TABLE dbo.competition_groups ADD sort_order INT NULL;
    UPDATE dbo.competition_groups SET sort_order = 0 WHERE sort_order IS NULL;
    ALTER TABLE dbo.competition_groups ALTER COLUMN sort_order INT NOT NULL;
END;
