-- Phase 2-4: Competition groups, judge assignment scope/lifecycle, team group_id, min judges per round

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- competition_groups
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'competition_groups')
BEGIN
    CREATE TABLE competition_groups (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        track_id UNIQUEIDENTIFIER NOT NULL,
        name NVARCHAR(255) NOT NULL,
        created_at DATETIME2 NOT NULL,
        updated_at DATETIME2 NULL,
        created_by NVARCHAR(255) NULL,
        updated_by NVARCHAR(255) NULL,
        CONSTRAINT uq_competition_group_track_name UNIQUE (track_id, name),
        CONSTRAINT fk_competition_group_track FOREIGN KEY (track_id) REFERENCES tracks(id)
    );
END;
GO

-- teams.group_id
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'teams') AND name = 'group_id')
BEGIN
    ALTER TABLE teams ADD group_id UNIQUEIDENTIFIER NULL;
END;
GO

-- judge_assignments.scope
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'judge_assignments') AND name = 'scope')
BEGIN
    ALTER TABLE judge_assignments ADD scope NVARCHAR(20) NULL;
END;
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'judge_assignments') AND name = 'scope')
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

-- judge_assignments.group_id
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'judge_assignments') AND name = 'group_id')
BEGIN
    ALTER TABLE judge_assignments ADD group_id UNIQUEIDENTIFIER NULL;
END;
GO

-- judge_assignments lifecycle (Phase 3)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'judge_assignments') AND name = 'active')
BEGIN
    ALTER TABLE judge_assignments ADD active BIT NOT NULL
        CONSTRAINT df_judge_assignments_active DEFAULT (1) WITH VALUES;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'judge_assignments') AND name = 'deactivated_at')
BEGIN
    ALTER TABLE judge_assignments ADD deactivated_at DATETIME2 NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'judge_assignments') AND name = 'deactivation_reason')
BEGIN
    ALTER TABLE judge_assignments ADD deactivation_reason NVARCHAR(500) NULL;
END;
GO

-- rounds.min_judges_per_round (Phase 4)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'rounds') AND name = 'min_judges_per_round')
BEGIN
    ALTER TABLE rounds ADD min_judges_per_round INT NOT NULL CONSTRAINT df_rounds_min_judges DEFAULT 2;
END;
GO

-- Drop old unique constraint on judge_assignments if present
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

IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'UKjudge_assignmentsround_idjudge_user_idtrack_id' AND parent_object_id = OBJECT_ID(N'judge_assignments'))
BEGIN
    ALTER TABLE judge_assignments DROP CONSTRAINT UKjudge_assignmentsround_idjudge_user_idtrack_id;
END;
GO

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
