-- V1: DB harden — BR-18/BR-20, token hash columns, unique/indexes (SQL Server)
-- Requires: SET QUOTED_IDENTIFIER ON (Hikari connection-init-sql)
-- Safe on existing SEAL schema; no-ops sections when tables are missing.

-- ═══════════════════════════════════════════════════════════════════════════
-- Auth tokens: widen for SHA-256 hex, invalidate existing plaintext rows
-- ═══════════════════════════════════════════════════════════════════════════
IF OBJECT_ID(N'dbo.refresh_tokens', N'U') IS NOT NULL
BEGIN
    DELETE FROM refresh_tokens;
    -- Drop UNIQUE constraints / nonclustered indexes on token before ALTER.
    DECLARE @sql_rt NVARCHAR(MAX) = N'';
    SELECT @sql_rt = @sql_rt + N'ALTER TABLE refresh_tokens DROP CONSTRAINT ' + QUOTENAME(kc.name) + N';'
    FROM sys.key_constraints kc
    JOIN sys.index_columns ic ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE kc.parent_object_id = OBJECT_ID(N'dbo.refresh_tokens') AND kc.type = N'UQ' AND c.name = N'token';
    SELECT @sql_rt = @sql_rt + N'DROP INDEX ' + QUOTENAME(i.name) + N' ON refresh_tokens;'
    FROM sys.indexes i
    JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE i.object_id = OBJECT_ID(N'dbo.refresh_tokens') AND c.name = N'token'
      AND i.is_primary_key = 0 AND i.is_unique_constraint = 0;
    IF @sql_rt <> N'' EXEC sp_executesql @sql_rt;
    ALTER TABLE refresh_tokens ALTER COLUMN token NVARCHAR(64) NOT NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'uq_refresh_tokens_token' AND object_id = OBJECT_ID(N'dbo.refresh_tokens'))
        CREATE UNIQUE INDEX uq_refresh_tokens_token ON refresh_tokens (token);
END;

IF OBJECT_ID(N'dbo.password_reset_tokens', N'U') IS NOT NULL
BEGIN
    DELETE FROM password_reset_tokens;
    DECLARE @sql_prt NVARCHAR(MAX) = N'';
    SELECT @sql_prt = @sql_prt + N'ALTER TABLE password_reset_tokens DROP CONSTRAINT ' + QUOTENAME(kc.name) + N';'
    FROM sys.key_constraints kc
    JOIN sys.index_columns ic ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE kc.parent_object_id = OBJECT_ID(N'dbo.password_reset_tokens') AND kc.type = N'UQ' AND c.name = N'token';
    SELECT @sql_prt = @sql_prt + N'DROP INDEX ' + QUOTENAME(i.name) + N' ON password_reset_tokens;'
    FROM sys.indexes i
    JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE i.object_id = OBJECT_ID(N'dbo.password_reset_tokens') AND c.name = N'token'
      AND i.is_primary_key = 0 AND i.is_unique_constraint = 0;
    IF @sql_prt <> N'' EXEC sp_executesql @sql_prt;
    ALTER TABLE password_reset_tokens ALTER COLUMN token NVARCHAR(64) NOT NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'uq_password_reset_tokens_token' AND object_id = OBJECT_ID(N'dbo.password_reset_tokens'))
        CREATE UNIQUE INDEX uq_password_reset_tokens_token ON password_reset_tokens (token);
END;

IF OBJECT_ID(N'dbo.event_magic_tokens', N'U') IS NOT NULL
BEGIN
    DELETE FROM event_magic_tokens;
    DECLARE @sql_emt NVARCHAR(MAX) = N'';
    SELECT @sql_emt = @sql_emt + N'ALTER TABLE event_magic_tokens DROP CONSTRAINT ' + QUOTENAME(kc.name) + N';'
    FROM sys.key_constraints kc
    JOIN sys.index_columns ic ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE kc.parent_object_id = OBJECT_ID(N'dbo.event_magic_tokens') AND kc.type = N'UQ' AND c.name = N'token';
    SELECT @sql_emt = @sql_emt + N'DROP INDEX ' + QUOTENAME(i.name) + N' ON event_magic_tokens;'
    FROM sys.indexes i
    JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE i.object_id = OBJECT_ID(N'dbo.event_magic_tokens') AND c.name = N'token'
      AND i.is_primary_key = 0 AND i.is_unique_constraint = 0;
    IF @sql_emt <> N'' EXEC sp_executesql @sql_emt;
    ALTER TABLE event_magic_tokens ALTER COLUMN token NVARCHAR(64) NOT NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'uq_event_magic_tokens_token' AND object_id = OBJECT_ID(N'dbo.event_magic_tokens'))
        CREATE UNIQUE INDEX uq_event_magic_tokens_token ON event_magic_tokens (token);
END;

IF OBJECT_ID(N'dbo.email_otp_tokens', N'U') IS NOT NULL
BEGIN
    DELETE FROM email_otp_tokens;
    DECLARE @sql_eot NVARCHAR(MAX) = N'';
    SELECT @sql_eot = @sql_eot + N'ALTER TABLE email_otp_tokens DROP CONSTRAINT ' + QUOTENAME(kc.name) + N';'
    FROM sys.key_constraints kc
    JOIN sys.index_columns ic ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE kc.parent_object_id = OBJECT_ID(N'dbo.email_otp_tokens') AND kc.type = N'UQ' AND c.name = N'code';
    SELECT @sql_eot = @sql_eot + N'DROP INDEX ' + QUOTENAME(i.name) + N' ON email_otp_tokens;'
    FROM sys.indexes i
    JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE i.object_id = OBJECT_ID(N'dbo.email_otp_tokens') AND c.name = N'code'
      AND i.is_primary_key = 0 AND i.is_unique_constraint = 0;
    IF @sql_eot <> N'' EXEC sp_executesql @sql_eot;
    ALTER TABLE email_otp_tokens ALTER COLUMN code NVARCHAR(64) NOT NULL;
END;

-- ═══════════════════════════════════════════════════════════════════════════
-- BR-18: denormalize event_id on team_members + unique (event_id, user_id)
-- ═══════════════════════════════════════════════════════════════════════════
IF OBJECT_ID(N'dbo.team_members', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.team_members', 'event_id') IS NULL
    BEGIN
        -- Dynamic SQL so the new column is visible in a nested batch (SQL Server).
        ALTER TABLE team_members ADD event_id UNIQUEIDENTIFIER NULL;
        EXEC(N'
            UPDATE tm
            SET tm.event_id = t.event_id
            FROM team_members tm
            INNER JOIN teams t ON t.id = tm.team_id;
            DELETE FROM team_members WHERE event_id IS NULL;
            ALTER TABLE team_members ALTER COLUMN event_id UNIQUEIDENTIFIER NOT NULL;
        ');
    END;

    ;WITH d AS (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY event_id, user_id ORDER BY joined_at, created_at, id) AS rn
        FROM team_members
        WHERE event_id IS NOT NULL
    )
    DELETE FROM team_members WHERE id IN (SELECT id FROM d WHERE rn > 1);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'uq_team_member_event_user' AND object_id = OBJECT_ID(N'dbo.team_members'))
        CREATE UNIQUE INDEX uq_team_member_event_user ON team_members (event_id, user_id);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_team_member_event_id' AND object_id = OBJECT_ID(N'dbo.team_members'))
        CREATE INDEX idx_team_member_event_id ON team_members (event_id);

    -- BR-20: at most one LEADER per team
    ;WITH leaders AS (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY team_id ORDER BY joined_at, created_at, id) AS rn
        FROM team_members
        WHERE role = 'LEADER'
    )
    UPDATE team_members
    SET role = N'MEMBER'
    WHERE id IN (SELECT id FROM leaders WHERE rn > 1);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'uq_team_members_one_leader' AND object_id = OBJECT_ID(N'dbo.team_members'))
        CREATE UNIQUE INDEX uq_team_members_one_leader ON team_members (team_id) WHERE role = 'LEADER';
END;

-- ═══════════════════════════════════════════════════════════════════════════
-- Submission versions: unique (submission_id, version_number)
-- ═══════════════════════════════════════════════════════════════════════════
IF OBJECT_ID(N'dbo.submission_versions', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'dbo.submissions', N'U') IS NOT NULL
    BEGIN
        ;WITH versions AS (
            SELECT id,
                   ROW_NUMBER() OVER (PARTITION BY submission_id, version_number ORDER BY submitted_at, created_at, id) AS rn
            FROM submission_versions
        )
        UPDATE submissions
        SET current_version_id = NULL
        WHERE current_version_id IN (SELECT id FROM versions WHERE rn > 1);
    END;

    IF OBJECT_ID(N'dbo.submission_attachments', N'U') IS NOT NULL
    BEGIN
        ;WITH versions AS (
            SELECT id,
                   ROW_NUMBER() OVER (PARTITION BY submission_id, version_number ORDER BY submitted_at, created_at, id) AS rn
            FROM submission_versions
        )
        DELETE FROM submission_attachments
        WHERE submission_version_id IN (SELECT id FROM versions WHERE rn > 1);
    END;

    ;WITH versions AS (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY submission_id, version_number ORDER BY submitted_at, created_at, id) AS rn
        FROM submission_versions
    )
    DELETE FROM submission_versions WHERE id IN (SELECT id FROM versions WHERE rn > 1);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'uq_submission_version_number' AND object_id = OBJECT_ID(N'dbo.submission_versions'))
        CREATE UNIQUE INDEX uq_submission_version_number ON submission_versions (submission_id, version_number);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_submission_versions_submission_id' AND object_id = OBJECT_ID(N'dbo.submission_versions'))
        CREATE INDEX idx_submission_versions_submission_id ON submission_versions (submission_id);
END;

-- ═══════════════════════════════════════════════════════════════════════════
-- Pending join / leave / invitation — filtered unique (race-safe)
-- ═══════════════════════════════════════════════════════════════════════════
IF OBJECT_ID(N'dbo.team_join_requests', N'U') IS NOT NULL
BEGIN
    ;WITH d AS (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY team_id, requester_id ORDER BY created_at, id) AS rn
        FROM team_join_requests
        WHERE status = 'PENDING'
    )
    UPDATE team_join_requests
    SET status = N'CANCELLED', resolved_at = SYSUTCDATETIME()
    WHERE id IN (SELECT id FROM d WHERE rn > 1);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'uq_team_join_pending' AND object_id = OBJECT_ID(N'dbo.team_join_requests'))
        CREATE UNIQUE INDEX uq_team_join_pending ON team_join_requests (team_id, requester_id) WHERE status = 'PENDING';
END;

IF OBJECT_ID(N'dbo.team_leave_requests', N'U') IS NOT NULL
BEGIN
    ;WITH d AS (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY team_id, user_id ORDER BY created_at, id) AS rn
        FROM team_leave_requests
        WHERE status = 'PENDING'
    )
    UPDATE team_leave_requests
    SET status = N'REJECTED', resolved_at = SYSUTCDATETIME()
    WHERE id IN (SELECT id FROM d WHERE rn > 1);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'uq_team_leave_pending' AND object_id = OBJECT_ID(N'dbo.team_leave_requests'))
        CREATE UNIQUE INDEX uq_team_leave_pending ON team_leave_requests (team_id, user_id) WHERE status = 'PENDING';
END;

IF OBJECT_ID(N'dbo.invitations', N'U') IS NOT NULL
BEGIN
    ;WITH d AS (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY team_id, invitee_email ORDER BY created_at, id) AS rn
        FROM invitations
        WHERE status = 'PENDING'
    )
    UPDATE invitations
    SET status = N'CANCELLED'
    WHERE id IN (SELECT id FROM d WHERE rn > 1);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'uq_invitation_pending' AND object_id = OBJECT_ID(N'dbo.invitations'))
        CREATE UNIQUE INDEX uq_invitation_pending ON invitations (team_id, invitee_email) WHERE status = 'PENDING';

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_invitations_team_id' AND object_id = OBJECT_ID(N'dbo.invitations'))
        CREATE INDEX idx_invitations_team_id ON invitations (team_id);
END;

-- ═══════════════════════════════════════════════════════════════════════════
-- Platform-wide allowed email domains (event_id IS NULL)
-- ═══════════════════════════════════════════════════════════════════════════
IF OBJECT_ID(N'dbo.allowed_email_domains', N'U') IS NOT NULL
BEGIN
    ;WITH d AS (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY domain ORDER BY created_at, id) AS rn
        FROM allowed_email_domains
        WHERE event_id IS NULL
    )
    DELETE FROM allowed_email_domains WHERE id IN (SELECT id FROM d WHERE rn > 1);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'uq_allowed_domain_platform' AND object_id = OBJECT_ID(N'dbo.allowed_email_domains'))
        CREATE UNIQUE INDEX uq_allowed_domain_platform ON allowed_email_domains (domain) WHERE event_id IS NULL;
END;

-- ═══════════════════════════════════════════════════════════════════════════
-- Missing FK / join indexes
-- ═══════════════════════════════════════════════════════════════════════════
IF OBJECT_ID(N'dbo.rounds', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_rounds_event_id' AND object_id = OBJECT_ID(N'dbo.rounds'))
    CREATE INDEX idx_rounds_event_id ON rounds (event_id);

IF OBJECT_ID(N'dbo.criteria', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_criteria_round_id' AND object_id = OBJECT_ID(N'dbo.criteria'))
    CREATE INDEX idx_criteria_round_id ON criteria (round_id);

IF OBJECT_ID(N'dbo.tracks', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_tracks_event_id' AND object_id = OBJECT_ID(N'dbo.tracks'))
    CREATE INDEX idx_tracks_event_id ON tracks (event_id);

IF OBJECT_ID(N'dbo.prizes', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_prizes_event_id' AND object_id = OBJECT_ID(N'dbo.prizes'))
    CREATE INDEX idx_prizes_event_id ON prizes (event_id);

IF OBJECT_ID(N'dbo.judge_assignments', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_judge_assignments_round_id' AND object_id = OBJECT_ID(N'dbo.judge_assignments'))
    CREATE INDEX idx_judge_assignments_round_id ON judge_assignments (round_id);

IF OBJECT_ID(N'dbo.disputes', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_disputes_round_id' AND object_id = OBJECT_ID(N'dbo.disputes'))
    CREATE INDEX idx_disputes_round_id ON disputes (round_id);

IF OBJECT_ID(N'dbo.disputes', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_disputes_team_id' AND object_id = OBJECT_ID(N'dbo.disputes'))
    CREATE INDEX idx_disputes_team_id ON disputes (team_id);

IF OBJECT_ID(N'dbo.advancements', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_advancements_round_id' AND object_id = OBJECT_ID(N'dbo.advancements'))
    CREATE INDEX idx_advancements_round_id ON advancements (round_id);

IF OBJECT_ID(N'dbo.teams', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_teams_track_id' AND object_id = OBJECT_ID(N'dbo.teams'))
    CREATE INDEX idx_teams_track_id ON teams (track_id);

IF OBJECT_ID(N'dbo.teams', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_teams_leader_id' AND object_id = OBJECT_ID(N'dbo.teams'))
    CREATE INDEX idx_teams_leader_id ON teams (leader_id);

IF OBJECT_ID(N'dbo.audit_logs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_audit_target' AND object_id = OBJECT_ID(N'dbo.audit_logs'))
    CREATE INDEX idx_audit_target ON audit_logs (target_type, target_id);
