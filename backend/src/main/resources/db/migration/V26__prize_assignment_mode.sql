-- Prize assignment mode: RANK_BASED (auto from final ranking) vs MANUAL (staff picks team).
-- Also allow OTHER rank for manual special prizes.

SET NOCOUNT ON;
GO

IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'prizes')
      AND name = N'CK__prizes__rank__32AB8735'
)
BEGIN
    ALTER TABLE prizes DROP CONSTRAINT CK__prizes__rank__32AB8735;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'prizes')
      AND name = N'CK_prizes_rank'
)
BEGIN
    ALTER TABLE prizes
    ADD CONSTRAINT CK_prizes_rank
    CHECK ([rank] IN (N'FIRST', N'SECOND', N'THIRD', N'CONSOLATION', N'OTHER'));
END
GO

IF COL_LENGTH(N'prizes', N'assignment_mode') IS NULL
BEGIN
    ALTER TABLE prizes
    ADD assignment_mode nvarchar(20) NOT NULL
        CONSTRAINT DF_prizes_assignment_mode DEFAULT (N'RANK_BASED');
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'prizes')
      AND name = N'CK_prizes_assignment_mode'
)
BEGIN
    ALTER TABLE prizes
    ADD CONSTRAINT CK_prizes_assignment_mode
    CHECK (assignment_mode IN (N'RANK_BASED', N'MANUAL'));
END
GO

UPDATE prizes
SET assignment_mode = N'RANK_BASED'
WHERE assignment_mode IS NULL
   OR LTRIM(RTRIM(assignment_mode)) = N'';
GO

UPDATE prizes
SET assignment_mode = N'MANUAL'
WHERE UPPER([rank]) = N'OTHER';
GO
