-- Completion fix for judge_assignment_phase2_3_4.sql (SQL Server)
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- scope
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'judge_assignments') AND name = N'scope')
BEGIN
    ALTER TABLE judge_assignments ADD scope NVARCHAR(20) NULL;
END;
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'judge_assignments') AND name = N'scope')
BEGIN
    UPDATE judge_assignments
    SET scope = CASE WHEN track_id IS NULL THEN N'ROUND' ELSE N'TRACK' END
    WHERE scope IS NULL;

    IF EXISTS (
        SELECT 1 FROM sys.columns c
        WHERE c.object_id = OBJECT_ID(N'judge_assignments')
          AND c.name = N'scope'
          AND c.is_nullable = 1
    )
    BEGIN
        ALTER TABLE judge_assignments ALTER COLUMN scope NVARCHAR(20) NOT NULL;
    END;
END;
GO

-- active
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'judge_assignments') AND name = N'active')
BEGIN
    ALTER TABLE judge_assignments ADD active BIT NOT NULL
        CONSTRAINT df_judge_assignments_active DEFAULT (1) WITH VALUES;
END;
GO

-- Drop legacy unique constraints/indexes
IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'UQ_judge_round_judge_track' AND parent_object_id = OBJECT_ID(N'judge_assignments'))
BEGIN
    ALTER TABLE judge_assignments DROP CONSTRAINT UQ_judge_round_judge_track;
END;
GO

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UQ_judge_round_judge_final' AND object_id = OBJECT_ID(N'judge_assignments'))
BEGIN
    DROP INDEX UQ_judge_round_judge_final ON judge_assignments;
END;
GO

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UKm0s7p8uhipmbx7a9h49cyb2s' AND object_id = OBJECT_ID(N'judge_assignments'))
BEGIN
    DROP INDEX UKm0s7p8uhipmbx7a9h49cyb2s ON judge_assignments;
END;
GO

IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'UKjudge_assignmentsround_idjudge_user_idtrack_id' AND parent_object_id = OBJECT_ID(N'judge_assignments'))
BEGIN
    ALTER TABLE judge_assignments DROP CONSTRAINT UKjudge_assignmentsround_idjudge_user_idtrack_id;
END;
GO

-- Computed keys for unique index (SQL Server does not allow COALESCE in index key directly)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'judge_assignments') AND name = N'scope_track_key')
BEGIN
    ALTER TABLE judge_assignments ADD scope_track_key AS
        COALESCE(track_id, CAST('00000000-0000-0000-0000-000000000000' AS UNIQUEIDENTIFIER)) PERSISTED;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'judge_assignments') AND name = N'scope_group_key')
BEGIN
    ALTER TABLE judge_assignments ADD scope_group_key AS
        COALESCE(group_id, CAST('00000000-0000-0000-0000-000000000000' AS UNIQUEIDENTIFIER)) PERSISTED;
END;
GO

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'uq_judge_assignment_scope' AND object_id = OBJECT_ID(N'judge_assignments'))
BEGIN
    DROP INDEX uq_judge_assignment_scope ON judge_assignments;
END;
GO

CREATE UNIQUE INDEX uq_judge_assignment_scope
ON judge_assignments (judge_user_id, round_id, scope_track_key, scope_group_key)
WHERE active = 1;
GO

PRINT 'judge_assignment_phase2_3_4_fix completed.';
GO
