-- Run once on SQL Server if system_config is missing semester eligibility columns.
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'system_config') AND name = N'semester_min'
)
BEGIN
    ALTER TABLE system_config ADD semester_min INT NULL;
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'system_config') AND name = N'semester_max'
)
BEGIN
    ALTER TABLE system_config ADD semester_max INT NULL;
END;
