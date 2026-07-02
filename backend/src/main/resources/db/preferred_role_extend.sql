-- Widen event_enrollments.preferred_role to 100 chars and drop legacy enum CHECK constraint.
-- Run once on SQL Server when spring.jpa.hibernate.ddl-auto=validate (default).

DECLARE @constraintName NVARCHAR(200);

SELECT @constraintName = cc.name
FROM sys.check_constraints cc
INNER JOIN sys.columns c
    ON cc.parent_object_id = c.object_id
   AND cc.parent_column_id = c.column_id
WHERE OBJECT_NAME(cc.parent_object_id) = 'event_enrollments'
  AND c.name = 'preferred_role';

IF @constraintName IS NOT NULL
BEGIN
    DECLARE @dropSql NVARCHAR(500) =
        N'ALTER TABLE event_enrollments DROP CONSTRAINT ' + QUOTENAME(@constraintName);
    EXEC sp_executesql @dropSql;
END;

IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'event_enrollments') AND name = N'preferred_role'
)
BEGIN
    ALTER TABLE event_enrollments ALTER COLUMN preferred_role NVARCHAR(100) NULL;
END;
