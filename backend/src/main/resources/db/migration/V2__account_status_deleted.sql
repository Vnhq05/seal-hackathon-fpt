-- V2: allow AccountStatus.DELETED for soft-delete (audit / UUID refs retained).
-- Drop existing status CHECK by discovery (name differs across SQL Server instances), then recreate.

DECLARE @ck NVARCHAR(256);
DECLARE @sql NVARCHAR(500);

SELECT @ck = cc.name
FROM sys.check_constraints cc
JOIN sys.columns c ON cc.parent_object_id = c.object_id AND cc.parent_column_id = c.column_id
WHERE cc.parent_object_id = OBJECT_ID(N'dbo.users') AND c.name = N'status';

IF @ck IS NOT NULL
BEGIN
    SET @sql = N'ALTER TABLE dbo.users DROP CONSTRAINT ' + QUOTENAME(@ck);
    EXEC sp_executesql @sql;
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'dbo.users') AND name = N'CK__users__status'
)
    ALTER TABLE dbo.users ADD CONSTRAINT CK__users__status
        CHECK ([status] IN ('PENDING', 'ACTIVE', 'REJECTED', 'LOCKED', 'DELETED'));
