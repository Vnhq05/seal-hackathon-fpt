-- SEAL Hackathon Spring 2026 schema extensions

-- Competition format on events (distinct from location format column "format")
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('hackathon_events') AND name = 'competition_format')
BEGIN
    ALTER TABLE hackathon_events ADD competition_format NVARCHAR(50) NOT NULL DEFAULT 'GENERIC';
END
GO

-- Round type (PRELIMINARY / FINAL)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('rounds') AND name = 'round_type')
BEGIN
    ALTER TABLE rounds ADD round_type NVARCHAR(50) NULL;
END
GO

-- Track topic
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tracks') AND name = 'topic')
BEGIN
    ALTER TABLE tracks ADD topic NVARCHAR(1000) NULL;
END
GO

-- Team track assignment metadata
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('teams') AND name = 'track_assigned_at')
BEGIN
    ALTER TABLE teams ADD track_assigned_at DATETIME2 NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('teams') AND name = 'track_assignment_method')
BEGIN
    ALTER TABLE teams ADD track_assignment_method NVARCHAR(50) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('teams') AND name = 'track_assigned_by')
BEGIN
    ALTER TABLE teams ADD track_assigned_by UNIQUEIDENTIFIER NULL;
END
GO

-- Submission slide URL
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('submission_versions') AND name = 'slide_url')
BEGIN
    ALTER TABLE submission_versions ADD slide_url NVARCHAR(500) NULL;
END
GO

-- Allow nullable source/demo URLs for SEAL Milestone 1 (slide-only)
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('submission_versions') AND name = 'github_url')
BEGIN
    ALTER TABLE submission_versions ALTER COLUMN github_url NVARCHAR(500) NULL;
END
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('submission_versions') AND name = 'demo_url')
BEGIN
    ALTER TABLE submission_versions ALTER COLUMN demo_url NVARCHAR(500) NULL;
END
GO

-- Finalist selections
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'finalist_selections')
BEGIN
    CREATE TABLE finalist_selections (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        event_id UNIQUEIDENTIFIER NOT NULL,
        team_id UNIQUEIDENTIFIER NOT NULL,
        track_id UNIQUEIDENTIFIER NULL,
        preliminary_rank INT NOT NULL,
        selected_reason NVARCHAR(500) NULL,
        selected_at DATETIME2 NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT uq_finalist_event_team UNIQUE (event_id, team_id)
    );
    CREATE INDEX idx_finalist_event ON finalist_selections(event_id);
END
GO

-- Team awards (links team to prize after final ranking)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'team_awards')
BEGIN
    CREATE TABLE team_awards (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        event_id UNIQUEIDENTIFIER NOT NULL,
        team_id UNIQUEIDENTIFIER NOT NULL,
        prize_id UNIQUEIDENTIFIER NOT NULL,
        awarded_at DATETIME2 NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT uq_team_award_event_team UNIQUE (event_id, team_id)
    );
    CREATE INDEX idx_team_award_event ON team_awards(event_id);
END
GO

-- Mentor assignment per track
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('mentor_assignments') AND name = 'track_id')
BEGIN
    ALTER TABLE mentor_assignments ADD track_id UNIQUEIDENTIFIER NULL;
END
GO

-- Track status (OPEN / LOCKED)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tracks') AND name = 'status')
BEGIN
    ALTER TABLE tracks ADD status NVARCHAR(20) NOT NULL DEFAULT 'OPEN';
END
GO

-- Round slide deadline (Milestone 1 — 10:00 Day 2)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('rounds') AND name = 'slide_deadline')
BEGIN
    ALTER TABLE rounds ADD slide_deadline DATETIME2 NULL;
END
GO

-- Track draw sessions (Day 1 self-select flow)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'track_draw_sessions')
BEGIN
    CREATE TABLE track_draw_sessions (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        event_id UNIQUEIDENTIFIER NOT NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'OPEN',
        current_index INT NOT NULL DEFAULT 0,
        scheduled_at DATETIME2 NULL,
        opened_at DATETIME2 NULL,
        opened_by UNIQUEIDENTIFIER NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT uq_track_draw_session_event UNIQUE (event_id)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'track_draw_queue')
BEGIN
    CREATE TABLE track_draw_queue (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        session_id UNIQUEIDENTIFIER NOT NULL,
        team_id UNIQUEIDENTIFIER NOT NULL,
        queue_order INT NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT uq_draw_queue_session_team UNIQUE (session_id, team_id),
        CONSTRAINT uq_draw_queue_session_order UNIQUE (session_id, queue_order)
    );
    CREATE INDEX idx_draw_queue_session ON track_draw_queue(session_id);
END
GO

-- Event schedule (Day 1 / Day 2 milestones)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'event_schedules')
BEGIN
    CREATE TABLE event_schedules (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        event_id UNIQUEIDENTIFIER NOT NULL,
        type NVARCHAR(30) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(1000) NULL,
        start_time DATETIME2 NOT NULL,
        end_time DATETIME2 NOT NULL,
        gate NVARCHAR(30) NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    CREATE INDEX idx_event_schedule_event ON event_schedules(event_id);
END
GO

-- Student standing (ENROLLED / GRADUATED)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'student_standing')
BEGIN
    ALTER TABLE users ADD student_standing NVARCHAR(20) NOT NULL DEFAULT 'ENROLLED';
END
GO

-- Allowed email domains per event (external student verification)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'allowed_email_domains')
BEGIN
    CREATE TABLE allowed_email_domains (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        event_id UNIQUEIDENTIFIER NOT NULL,
        domain NVARCHAR(255) NOT NULL,
        university_label NVARCHAR(255) NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT uq_allowed_domain_event_domain UNIQUE (event_id, domain)
    );
    CREATE INDEX idx_allowed_domain_event ON allowed_email_domains(event_id);
END
GO

-- Advancement rule (GLOBAL_TOP_N / PER_TRACK_TOP_N / FINALIST_POOL / NONE)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('rounds') AND name = 'advancement_rule')
BEGIN
    ALTER TABLE rounds ADD advancement_rule NVARCHAR(50) NULL;
END
GO

-- Backfill SEAL events: preliminary = PER_TRACK_TOP_N, final = FINALIST_POOL
UPDATE r SET r.advancement_rule = 'PER_TRACK_TOP_N'
FROM rounds r
INNER JOIN hackathon_events e ON r.event_id = e.id
WHERE e.competition_format = 'SEAL_RAG_2026'
  AND r.round_type = 'PRELIMINARY'
  AND r.advancement_rule IS NULL;
GO

UPDATE r SET r.advancement_rule = 'FINALIST_POOL'
FROM rounds r
INNER JOIN hackathon_events e ON r.event_id = e.id
WHERE e.competition_format = 'SEAL_RAG_2026'
  AND r.round_type = 'FINAL'
  AND r.advancement_rule IS NULL;
GO

-- Finalist selection metadata
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('finalist_selections') AND name = 'selection_method')
BEGIN
    ALTER TABLE finalist_selections ADD selection_method NVARCHAR(30) NULL;
    ALTER TABLE finalist_selections ADD needs_penalty_evaluation BIT NOT NULL DEFAULT 0;
END
GO

-- Contested slots (tie-break requiring OC penalty evaluation)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'finalist_contested_slots')
BEGIN
    CREATE TABLE finalist_contested_slots (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        event_id UNIQUEIDENTIFIER NOT NULL,
        track_id UNIQUEIDENTIFIER NULL,
        slot_type NVARCHAR(30) NOT NULL,
        slot_index INT NOT NULL,
        needs_penalty_evaluation BIT NOT NULL DEFAULT 1,
        resolved BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    CREATE INDEX idx_contested_slot_event ON finalist_contested_slots(event_id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'finalist_contested_slot_teams')
BEGIN
    CREATE TABLE finalist_contested_slot_teams (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        contested_slot_id UNIQUEIDENTIFIER NOT NULL,
        team_id UNIQUEIDENTIFIER NOT NULL,
        final_score DECIMAL(7,4) NULL,
        submitted_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT uq_contested_slot_team UNIQUE (contested_slot_id, team_id)
    );
    CREATE INDEX idx_contested_slot_teams_slot ON finalist_contested_slot_teams(contested_slot_id);
END
GO

-- Per-criterion scoring scale (SEAL Spring 2026: min=1, max=5)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('criteria') AND name = 'min_score')
BEGIN
    ALTER TABLE criteria ADD min_score INT NOT NULL DEFAULT 1;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('criteria') AND name = 'max_score')
BEGIN
    ALTER TABLE criteria ADD max_score INT NOT NULL DEFAULT 5;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('scoring_template_criteria') AND name = 'min_score')
BEGIN
    ALTER TABLE scoring_template_criteria ADD min_score INT NOT NULL DEFAULT 1;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('scoring_template_criteria') AND name = 'max_score')
BEGIN
    ALTER TABLE scoring_template_criteria ADD max_score INT NOT NULL DEFAULT 5;
END
GO

-- Mentor assignment: enforce per-track (breaking — remove legacy rows without track)
DELETE FROM mentor_assignments WHERE track_id IS NULL;
GO

DECLARE @mentorUq NVARCHAR(256);
SELECT @mentorUq = name FROM sys.key_constraints
WHERE parent_object_id = OBJECT_ID('mentor_assignments') AND type = 'UQ';
IF @mentorUq IS NOT NULL
    EXEC('ALTER TABLE mentor_assignments DROP CONSTRAINT ' + @mentorUq);
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('mentor_assignments') AND name = 'track_id')
BEGIN
    ALTER TABLE mentor_assignments ALTER COLUMN track_id UNIQUEIDENTIFIER NOT NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_mentor_event_track_mentor' AND object_id = OBJECT_ID('mentor_assignments'))
BEGIN
    ALTER TABLE mentor_assignments ADD CONSTRAINT UQ_mentor_event_track_mentor UNIQUE (event_id, track_id, mentor_user_id);
END
GO

-- Judge assignment per round + track (track_id NULL for FINAL round)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('judge_assignments') AND name = 'track_id')
BEGIN
    ALTER TABLE judge_assignments ADD track_id UNIQUEIDENTIFIER NULL;
END
GO

DECLARE @judgeUq NVARCHAR(256);
SELECT @judgeUq = name FROM sys.key_constraints
WHERE parent_object_id = OBJECT_ID('judge_assignments') AND type = 'UQ';
IF @judgeUq IS NOT NULL
    EXEC('ALTER TABLE judge_assignments DROP CONSTRAINT ' + @judgeUq);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_judge_round_judge_track' AND object_id = OBJECT_ID('judge_assignments'))
BEGIN
    ALTER TABLE judge_assignments ADD CONSTRAINT UQ_judge_round_judge_track UNIQUE (round_id, judge_user_id, track_id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_judge_round_judge_final' AND object_id = OBJECT_ID('judge_assignments'))
BEGIN
    CREATE UNIQUE INDEX UQ_judge_round_judge_final ON judge_assignments (round_id, judge_user_id)
    WHERE track_id IS NULL;
END
GO

-- Score deviation review requests (inter-judge spread >= threshold)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'score_review_requests')
BEGIN
    CREATE TABLE score_review_requests (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        event_id UNIQUEIDENTIFIER NOT NULL,
        round_id UNIQUEIDENTIFIER NOT NULL,
        team_id UNIQUEIDENTIFIER NOT NULL,
        submission_id UNIQUEIDENTIFIER NOT NULL,
        deviation_value DECIMAL(6,2) NOT NULL,
        min_judge_score DECIMAL(6,2) NOT NULL,
        max_judge_score DECIMAL(6,2) NOT NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'OPEN',
        resolved_at DATETIME2 NULL,
        resolved_by UNIQUEIDENTIFIER NULL,
        resolution_note NVARCHAR(2000) NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        created_by NVARCHAR(255) NULL,
        updated_by NVARCHAR(255) NULL,
        CONSTRAINT uq_score_review_submission UNIQUE (submission_id)
    );
    CREATE INDEX idx_score_review_event ON score_review_requests(event_id);
    CREATE INDEX idx_score_review_status ON score_review_requests(status);
END
GO

-- Orphan judging data cleanup (placeholder UUIDs / stale FKs)
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'judge_comments')
BEGIN
    DELETE jc FROM judge_comments jc
    WHERE NOT EXISTS (SELECT 1 FROM judge_scores js WHERE js.id = jc.judge_score_id);
END
GO

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'judge_score_details')
BEGIN
    DELETE jsd FROM judge_score_details jsd
    WHERE NOT EXISTS (SELECT 1 FROM judge_scores js WHERE js.id = jsd.judge_score_id)
       OR NOT EXISTS (SELECT 1 FROM criteria c WHERE c.id = jsd.criteria_id);
END
GO

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'judge_scores')
BEGIN
    DELETE js FROM judge_scores js
    WHERE NOT EXISTS (SELECT 1 FROM rounds r WHERE r.id = js.round_id)
       OR NOT EXISTS (SELECT 1 FROM submissions s WHERE s.id = js.submission_id);
END
GO

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'team_judge_assignments')
BEGIN
    DELETE tja FROM team_judge_assignments tja
    WHERE NOT EXISTS (SELECT 1 FROM rounds r WHERE r.id = tja.round_id)
       OR NOT EXISTS (SELECT 1 FROM teams t WHERE t.id = tja.team_id);
END
GO

-- Rescale legacy judge_score_details stored on 0-10 or 0-100 scale to criteria min/max (SEAL: 1-5)
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'judge_score_details')
   AND EXISTS (SELECT 1 FROM sys.tables WHERE name = 'criteria')
BEGIN
    UPDATE jsd
    SET score = CASE
        WHEN jsd.score <= 10 THEN
            CAST(ROUND(1.0 + (jsd.score * 4.0 / 10.0), 0) AS INT)
        ELSE
            CAST(ROUND(1.0 + (jsd.score * 4.0 / 100.0), 0) AS INT)
    END
    FROM judge_score_details jsd
    INNER JOIN criteria c ON c.id = jsd.criteria_id
    WHERE jsd.score > c.max_score;

    UPDATE jsd
    SET score = CASE
        WHEN jsd.score < c.min_score THEN c.min_score
        WHEN jsd.score > c.max_score THEN c.max_score
        ELSE jsd.score
    END
    FROM judge_score_details jsd
    INNER JOIN criteria c ON c.id = jsd.criteria_id
    WHERE jsd.score < c.min_score OR jsd.score > c.max_score;
END
GO
