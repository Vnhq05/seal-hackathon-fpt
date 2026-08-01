-- Orphan columns on prizes (schema drift, not mapped in JPA) block inserts.
-- Defaults must match existing CHECK constraints.
--
-- SQL Server compiles a whole batch before executing any of it, so an
-- IF COL_LENGTH(...) guard does NOT stop "Invalid column name" from being
-- raised at compile time on databases that never drifted -- a fresh CI
-- Testcontainer, for one. Every statement naming these columns therefore has
-- to be deferred through EXEC.

IF COL_LENGTH('dbo.prizes', 'active') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM sys.default_constraints dc
        JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
        WHERE dc.parent_object_id = OBJECT_ID(N'dbo.prizes') AND c.name = N'active'
    )
    BEGIN
        EXEC sp_executesql N'ALTER TABLE dbo.prizes ADD CONSTRAINT DF_prizes_active DEFAULT (1) FOR active;';
    END

    EXEC sp_executesql N'UPDATE dbo.prizes SET active = 1 WHERE active IS NULL;';
END
GO

IF COL_LENGTH('dbo.prizes', 'award_type') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1 FROM sys.default_constraints
        WHERE parent_object_id = OBJECT_ID(N'dbo.prizes') AND name = N'DF_prizes_award_type'
    )
    BEGIN
        ALTER TABLE dbo.prizes DROP CONSTRAINT DF_prizes_award_type;
    END

    EXEC sp_executesql N'ALTER TABLE dbo.prizes ADD CONSTRAINT DF_prizes_award_type DEFAULT (N''RANK_BASED'') FOR award_type;';

    EXEC sp_executesql N'UPDATE dbo.prizes SET award_type = N''RANK_BASED''
        WHERE award_type IS NULL OR LTRIM(RTRIM(award_type)) = N'''' OR award_type = N''STANDARD'';';
END
GO
