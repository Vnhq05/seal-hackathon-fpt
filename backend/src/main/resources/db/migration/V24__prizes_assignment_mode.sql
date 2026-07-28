-- Prize assignment mode: RANK_BASED (by final ranking) vs MANUAL (staff picks team).
-- FIRST/SECOND/THIRD are always rank-based; CONSOLATION may be either.

IF COL_LENGTH('dbo.prizes', 'assignment_mode') IS NULL
BEGIN
    ALTER TABLE dbo.prizes ADD assignment_mode NVARCHAR(20) NOT NULL
        CONSTRAINT DF_prizes_assignment_mode DEFAULT (N'RANK_BASED');
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints WHERE name = N'CK_prizes_assignment_mode'
)
BEGIN
    ALTER TABLE dbo.prizes WITH CHECK ADD CONSTRAINT CK_prizes_assignment_mode
        CHECK (assignment_mode IN (N'RANK_BASED', N'MANUAL'));
END
GO
