-- Run once on SQL Server if system_config is missing team limit columns.
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'system_config') AND name = N'min_teams'
)
BEGIN
    ALTER TABLE system_config ADD min_teams INT NULL;
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'system_config') AND name = N'max_teams'
)
BEGIN
    ALTER TABLE system_config ADD max_teams INT NULL;
END;
