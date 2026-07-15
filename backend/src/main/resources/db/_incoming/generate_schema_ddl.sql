-- Generate schema-only DDL for SEAL. Uses STRING_AGG (SQL Server 2017+).
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;

PRINT N'/* SEAL schema dump (schema-only) — generated from live catalog */';
PRINT N'SET QUOTED_IDENTIFIER ON;';
PRINT N'SET ANSI_NULLS ON;';
PRINT N'GO';

DECLARE @schema sysname, @table sysname, @objectId int;
DECLARE @cols nvarchar(max), @keys nvarchar(max), @checks nvarchar(max), @sql nvarchar(max);
DECLARE @pos int, @chunk nvarchar(4000);

DECLARE tcur CURSOR LOCAL FAST_FORWARD FOR
SELECT s.name, t.name, t.object_id
FROM sys.tables t
JOIN sys.schemas s ON s.schema_id = t.schema_id
WHERE t.is_ms_shipped = 0
  AND t.name NOT IN (N'flyway_schema_history')
ORDER BY s.name, t.name;

OPEN tcur;
FETCH NEXT FROM tcur INTO @schema, @table, @objectId;
WHILE @@FETCH_STATUS = 0
BEGIN
    ;WITH coldef AS (
        SELECT c.column_id,
            N'    [' + c.name + N'] '
            + CASE
                WHEN c.is_computed = 1 THEN N'AS ' + cc.definition
                WHEN ty.name IN (N'nvarchar', N'nchar')
                    THEN ty.name + N'(' + CASE WHEN c.max_length = -1 THEN N'MAX' ELSE CAST(c.max_length/2 AS nvarchar(20)) END + N')'
                WHEN ty.name IN (N'varchar', N'char')
                    THEN ty.name + N'(' + CASE WHEN c.max_length = -1 THEN N'MAX' ELSE CAST(c.max_length AS nvarchar(20)) END + N')'
                WHEN ty.name IN (N'decimal', N'numeric')
                    THEN ty.name + N'(' + CAST(c.precision AS nvarchar(10)) + N',' + CAST(c.scale AS nvarchar(10)) + N')'
                WHEN ty.name IN (N'datetime2', N'datetimeoffset', N'time')
                    THEN ty.name + N'(' + CAST(c.scale AS nvarchar(10)) + N')'
                WHEN ty.name = N'varbinary'
                    THEN ty.name + N'(' + CASE WHEN c.max_length = -1 THEN N'MAX' ELSE CAST(c.max_length AS nvarchar(20)) END + N')'
                ELSE ty.name
              END
            + CASE WHEN c.is_computed = 1 THEN N''
                   WHEN ic.object_id IS NOT NULL THEN N' IDENTITY(' + CAST(CONVERT(bigint, ic.seed_value) AS nvarchar(30))
                        + N',' + CAST(CONVERT(bigint, ic.increment_value) AS nvarchar(30)) + N')'
                   ELSE N'' END
            + CASE WHEN c.is_computed = 1 THEN N''
                   WHEN c.is_nullable = 1 THEN N' NULL' ELSE N' NOT NULL' END
            + CASE WHEN dc.definition IS NOT NULL AND c.is_computed = 0
                   THEN N' CONSTRAINT [' + dc.name + N'] DEFAULT ' + dc.definition ELSE N'' END
            AS def
        FROM sys.columns c
        JOIN sys.types ty ON ty.user_type_id = c.user_type_id
        LEFT JOIN sys.computed_columns cc ON cc.object_id = c.object_id AND cc.column_id = c.column_id
        LEFT JOIN sys.identity_columns ic ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        LEFT JOIN sys.default_constraints dc ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
        WHERE c.object_id = @objectId
    )
    SELECT @cols = STRING_AGG(def, N',' + CHAR(13) + CHAR(10)) WITHIN GROUP (ORDER BY column_id)
    FROM coldef;

    ;WITH keydef AS (
        SELECT kc.name AS cname, kc.type AS ctype, i.type_desc AS idesc, i.index_id, i.object_id AS iobj,
            STUFF((
                SELECT N', [' + col.name + N']' + CASE WHEN ic.is_descending_key = 1 THEN N' DESC' ELSE N'' END
                FROM sys.index_columns ic
                JOIN sys.columns col ON col.object_id = ic.object_id AND col.column_id = ic.column_id
                WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 0
                ORDER BY ic.key_ordinal
                FOR XML PATH(''), TYPE).value('.', 'nvarchar(max)'), 1, 2, N'') AS cols
        FROM sys.key_constraints kc
        JOIN sys.indexes i ON i.object_id = kc.parent_object_id AND i.index_id = kc.unique_index_id
        WHERE kc.parent_object_id = @objectId
    )
    SELECT @keys = STRING_AGG(
        N'  , CONSTRAINT [' + cname + N'] '
        + CASE WHEN ctype = 'PK' THEN N'PRIMARY KEY' ELSE N'UNIQUE' END
        + CASE WHEN idesc LIKE N'CLUSTERED%' THEN N' CLUSTERED' ELSE N' NONCLUSTERED' END
        + N' (' + cols + N')',
        CHAR(13) + CHAR(10))
    FROM keydef;

    SELECT @checks = STRING_AGG(
        N'  , CONSTRAINT [' + cc.name + N'] CHECK ' + cc.definition,
        CHAR(13) + CHAR(10))
    FROM sys.check_constraints cc
    WHERE cc.parent_object_id = @objectId AND cc.is_disabled = 0;

    SET @sql = N'CREATE TABLE [' + @schema + N'].[' + @table + N'] (' + CHAR(13) + CHAR(10)
        + ISNULL(@cols, N'')
        + ISNULL(CHAR(13) + CHAR(10) + @keys, N'')
        + ISNULL(CHAR(13) + CHAR(10) + @checks, N'')
        + CHAR(13) + CHAR(10) + N');';

    -- PRINT truncates at 4000; chunk safely
    SET @pos = 1;
    WHILE @pos <= LEN(@sql)
    BEGIN
        SET @chunk = SUBSTRING(@sql, @pos, 4000);
        PRINT @chunk;
        SET @pos = @pos + 4000;
    END
    PRINT N'GO';

    SET @cols = NULL; SET @keys = NULL; SET @checks = NULL;
    FETCH NEXT FROM tcur INTO @schema, @table, @objectId;
END
CLOSE tcur;
DEALLOCATE tcur;

-- Foreign keys
DECLARE @fkSql nvarchar(max);
DECLARE fkcur CURSOR LOCAL FAST_FORWARD FOR
SELECT
    N'ALTER TABLE [' + OBJECT_SCHEMA_NAME(fk.parent_object_id) + N'].[' + OBJECT_NAME(fk.parent_object_id) + N']'
    + N' ADD CONSTRAINT [' + fk.name + N'] FOREIGN KEY ('
    + STUFF((
        SELECT N', [' + c.name + N']'
        FROM sys.foreign_key_columns fkc
        JOIN sys.columns c ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
        WHERE fkc.constraint_object_id = fk.object_id
        ORDER BY fkc.constraint_column_id
        FOR XML PATH(''), TYPE).value('.', 'nvarchar(max)'), 1, 2, N'')
    + N') REFERENCES [' + OBJECT_SCHEMA_NAME(fk.referenced_object_id) + N'].[' + OBJECT_NAME(fk.referenced_object_id) + N'] ('
    + STUFF((
        SELECT N', [' + c.name + N']'
        FROM sys.foreign_key_columns fkc
        JOIN sys.columns c ON c.object_id = fkc.referenced_object_id AND c.column_id = fkc.referenced_column_id
        WHERE fkc.constraint_object_id = fk.object_id
        ORDER BY fkc.constraint_column_id
        FOR XML PATH(''), TYPE).value('.', 'nvarchar(max)'), 1, 2, N'')
    + N')'
    + CASE fk.delete_referential_action
        WHEN 1 THEN N' ON DELETE CASCADE'
        WHEN 2 THEN N' ON DELETE SET NULL'
        WHEN 3 THEN N' ON DELETE SET DEFAULT'
        ELSE N'' END
    + N';'
FROM sys.foreign_keys fk
WHERE fk.is_disabled = 0
ORDER BY OBJECT_SCHEMA_NAME(fk.parent_object_id), OBJECT_NAME(fk.parent_object_id), fk.name;

OPEN fkcur;
FETCH NEXT FROM fkcur INTO @fkSql;
WHILE @@FETCH_STATUS = 0
BEGIN
    PRINT @fkSql;
    PRINT N'GO';
    FETCH NEXT FROM fkcur INTO @fkSql;
END
CLOSE fkcur;
DEALLOCATE fkcur;

-- Indexes (non-PK, non-unique-constraint), including filtered
DECLARE @ixSql nvarchar(max);
DECLARE ixcur CURSOR LOCAL FAST_FORWARD FOR
SELECT
    CASE WHEN i.is_unique = 1 THEN N'CREATE UNIQUE ' ELSE N'CREATE ' END
    + CASE WHEN i.type_desc LIKE N'CLUSTERED%' THEN N'CLUSTERED' ELSE N'NONCLUSTERED' END
    + N' INDEX [' + i.name + N'] ON [' + OBJECT_SCHEMA_NAME(i.object_id) + N'].[' + OBJECT_NAME(i.object_id) + N'] ('
    + STUFF((
        SELECT N', [' + c.name + N']' + CASE WHEN ic.is_descending_key = 1 THEN N' DESC' ELSE N'' END
        FROM sys.index_columns ic
        JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
        WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 0
        ORDER BY ic.key_ordinal
        FOR XML PATH(''), TYPE).value('.', 'nvarchar(max)'), 1, 2, N'')
    + N')'
    + CASE WHEN EXISTS (
        SELECT 1 FROM sys.index_columns ic2
        WHERE ic2.object_id = i.object_id AND ic2.index_id = i.index_id AND ic2.is_included_column = 1)
      THEN N' INCLUDE (' + STUFF((
        SELECT N', [' + c.name + N']'
        FROM sys.index_columns ic
        JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
        WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 1
        ORDER BY ic.index_column_id
        FOR XML PATH(''), TYPE).value('.', 'nvarchar(max)'), 1, 2, N'') + N')'
      ELSE N'' END
    + CASE WHEN i.has_filter = 1 THEN N' WHERE ' + i.filter_definition ELSE N'' END
    + N';'
FROM sys.indexes i
WHERE i.object_id IN (SELECT object_id FROM sys.tables WHERE is_ms_shipped = 0)
  AND i.is_primary_key = 0
  AND i.is_unique_constraint = 0
  AND i.type > 0
  AND i.is_hypothetical = 0
  AND i.name IS NOT NULL
ORDER BY OBJECT_SCHEMA_NAME(i.object_id), OBJECT_NAME(i.object_id), i.name;

OPEN ixcur;
FETCH NEXT FROM ixcur INTO @ixSql;
WHILE @@FETCH_STATUS = 0
BEGIN
    PRINT @ixSql;
    PRINT N'GO';
    FETCH NEXT FROM ixcur INTO @ixSql;
END
CLOSE ixcur;
DEALLOCATE ixcur;
