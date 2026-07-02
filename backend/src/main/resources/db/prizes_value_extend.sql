-- Run once on SQL Server if prizes.value is shorter than 2000 characters.
IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'prizes') AND name = N'value'
)
BEGIN
    ALTER TABLE prizes ALTER COLUMN value NVARCHAR(2000) NOT NULL;
END;
