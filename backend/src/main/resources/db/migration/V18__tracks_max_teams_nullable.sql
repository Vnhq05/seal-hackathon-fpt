-- V18: track capacity removed — teams are assigned by coordinators, not self-selected.
-- Drop CHECK on max_teams (name differs across SQL Server instances), then allow NULL.

DECLARE @ck NVARCHAR(256);
DECLARE @sql NVARCHAR(500);

SELECT @ck = cc.name
FROM sys.check_constraints cc
JOIN sys.columns c ON cc.parent_object_id = c.object_id AND cc.parent_column_id = c.column_id
WHERE cc.parent_object_id = OBJECT_ID(N'dbo.tracks') AND c.name = N'max_teams';

IF @ck IS NOT NULL
BEGIN
    SET @sql = N'ALTER TABLE dbo.tracks DROP CONSTRAINT ' + QUOTENAME(@ck);
    EXEC sp_executesql @sql;
END;

IF COL_LENGTH(N'dbo.tracks', N'max_teams') IS NOT NULL
BEGIN
    ALTER TABLE dbo.tracks ALTER COLUMN max_teams INT NULL;
    UPDATE dbo.tracks SET max_teams = NULL WHERE max_teams IS NOT NULL;
END;
