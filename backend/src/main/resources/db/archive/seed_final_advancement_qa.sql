-- QA seed: Final advancement — prelim fully scored + rankings; NO final submissions yet.
-- Purpose: Select Finalists → carry-over submissions from prelim → score Final round.
-- Password: Demo@123456
-- Idempotent: only wipes this event graph (event id below).
--
-- Event: SEAL Final Advancement QA
--   - 1 track, 2 groups (G1/G2), 4 teams (2 per group), all submitted on PRELIM only
--   - Prelim scored by score.judge1/2; Final assigned to final.judge1/2 (fresh panel)
--
-- Test flow:
--   1. Admin/coordinator: open event → Select Finalists
--      POST /api/events/F1000000-FFFF-4FFF-8FFF-000000000001/finalists
--   2. Each group advances top ~25% (min 1) → typically 1 team / group
--   3. Carry-over creates Final submissions from prelim
--   4. Login final.judge1@fpt.edu.vn / Demo@123456 → score Final
--
-- Run:
--   sqlcmd -S localhost -U sa -P <password> -d SEAL -C -I -i seed_final_advancement_qa.sql

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @demoHash NVARCHAR(255) = N'$2a$10$7ZqT629/ciaVAXuzx7B0zO.wFlLuVz6NK3/tNioMOWFLb2gPkXeU2'; -- Demo@123456
DECLARE @now DATETIME2 = SYSUTCDATETIME();
DECLARE @today DATE = CAST(@now AS DATE);
DECLARE @templateId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM scoring_templates ORDER BY created_at);

DECLARE @ownerUserId UNIQUEIDENTIFIER = (
    SELECT TOP 1 id FROM users
    WHERE email IN (N'admin@seal.com', N'coordinator@seal.com')
    ORDER BY CASE email WHEN N'admin@seal.com' THEN 0 ELSE 1 END
);
DECLARE @ownerEmail NVARCHAR(255) = (SELECT email FROM users WHERE id = @ownerUserId);

DECLARE @eventId UNIQUEIDENTIFIER = 'F1000000-FFFF-4FFF-8FFF-000000000001';
DECLARE @trackId UNIQUEIDENTIFIER = 'F1000000-FFFF-4FFF-8FFF-0000000000A1';
DECLARE @group1Id UNIQUEIDENTIFIER = 'F1000000-FFFF-4FFF-8FFF-0000000000E1';
DECLARE @group2Id UNIQUEIDENTIFIER = 'F1000000-FFFF-4FFF-8FFF-0000000000E2';
DECLARE @prelimId UNIQUEIDENTIFIER = 'F1000000-FFFF-4FFF-8FFF-0000000000B1';
DECLARE @finalId UNIQUEIDENTIFIER = 'F1000000-FFFF-4FFF-8FFF-0000000000B2';

DECLARE @crit1 UNIQUEIDENTIFIER = 'F1000000-FFFF-4FFF-8FFF-0000000000C1';
DECLARE @crit2 UNIQUEIDENTIFIER = 'F1000000-FFFF-4FFF-8FFF-0000000000C2';
DECLARE @crit3 UNIQUEIDENTIFIER = 'F1000000-FFFF-4FFF-8FFF-0000000000C3';
DECLARE @fcrit1 UNIQUEIDENTIFIER = 'F1000000-FFFF-4FFF-8FFF-0000000000C4';
DECLARE @fcrit2 UNIQUEIDENTIFIER = 'F1000000-FFFF-4FFF-8FFF-0000000000C5';

IF @templateId IS NULL
BEGIN
    RAISERROR('No scoring template. Start backend with profile dev first.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END

IF @ownerUserId IS NULL
BEGIN
    RAISERROR('Need admin@seal.com or coordinator@seal.com in users.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END

-- ── Wipe previous run ──
DECLARE @teamIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @teamIds (id) SELECT id FROM teams WHERE event_id = @eventId;
DECLARE @roundIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @roundIds (id) SELECT id FROM rounds WHERE event_id = @eventId;
DECLARE @submissionIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @submissionIds (id)
SELECT s.id FROM submissions s WHERE s.round_id IN (SELECT id FROM @roundIds);

DELETE jc FROM judge_comments jc
INNER JOIN judge_scores js ON js.id = jc.judge_score_id
WHERE js.submission_id IN (SELECT id FROM @submissionIds);
DELETE jsd FROM judge_score_details jsd
INNER JOIN judge_scores js ON js.id = jsd.judge_score_id
WHERE js.submission_id IN (SELECT id FROM @submissionIds);
DELETE FROM judge_scores WHERE submission_id IN (SELECT id FROM @submissionIds);

UPDATE submissions SET current_version_id = NULL WHERE id IN (SELECT id FROM @submissionIds);
DELETE sa FROM submission_attachments sa
INNER JOIN submission_versions sv ON sv.id = sa.submission_version_id
WHERE sv.submission_id IN (SELECT id FROM @submissionIds);
DELETE FROM submission_versions WHERE submission_id IN (SELECT id FROM @submissionIds);
DELETE FROM submissions WHERE id IN (SELECT id FROM @submissionIds);

IF OBJECT_ID(N'mentor_chat_messages', N'U') IS NOT NULL
    DELETE FROM mentor_chat_messages WHERE team_id IN (SELECT id FROM @teamIds);
IF OBJECT_ID(N'mentor_feedbacks', N'U') IS NOT NULL
    DELETE FROM mentor_feedbacks WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM mentor_teams WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM invitations WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM mentor_invitations WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM team_join_requests WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM team_leave_requests WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM team_needed_roles WHERE team_id IN (SELECT id FROM @teamIds);
IF OBJECT_ID(N'team_progress_alerts', N'U') IS NOT NULL
    DELETE FROM team_progress_alerts WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM team_members WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM teams WHERE id IN (SELECT id FROM @teamIds);

DELETE FROM event_enrollments WHERE event_id = @eventId;
DELETE FROM event_magic_tokens WHERE event_id = @eventId;
DELETE FROM participant_feedbacks WHERE event_id = @eventId;
DELETE FROM participation_certificates WHERE event_id = @eventId;
DELETE FROM score_review_requests WHERE event_id = @eventId;
DELETE FROM team_awards WHERE event_id = @eventId;
DELETE FROM finalist_contested_slot_teams WHERE contested_slot_id IN (
    SELECT id FROM finalist_contested_slots WHERE event_id = @eventId);
DELETE FROM finalist_contested_slots WHERE event_id = @eventId;
DELETE FROM finalist_selections WHERE event_id = @eventId;
DELETE FROM track_draw_sessions WHERE event_id = @eventId;
IF OBJECT_ID(N'disputes', N'U') IS NOT NULL
    DELETE FROM disputes WHERE round_id IN (SELECT id FROM @roundIds);
IF OBJECT_ID(N'advancements', N'U') IS NOT NULL
    DELETE FROM advancements WHERE round_id IN (SELECT id FROM @roundIds);
DELETE FROM rankings WHERE round_id IN (SELECT id FROM @roundIds);
DELETE FROM published_results WHERE round_id IN (SELECT id FROM @roundIds);
DELETE FROM judge_assignments WHERE round_id IN (SELECT id FROM @roundIds);
DELETE FROM criteria WHERE round_id IN (SELECT id FROM @roundIds);
DELETE FROM rounds WHERE id IN (SELECT id FROM @roundIds);
DELETE FROM event_judge_assignments WHERE event_id = @eventId;
DELETE FROM event_mentor_assignments WHERE event_id = @eventId;
DELETE FROM mentor_assignments WHERE event_id = @eventId;
DELETE FROM event_tiebreaker_criteria WHERE event_id = @eventId;
DELETE FROM honored_guests WHERE event_id = @eventId;
DELETE FROM prizes WHERE event_id = @eventId;
DELETE FROM event_schedules WHERE event_id = @eventId;
DELETE FROM allowed_email_domains WHERE event_id = @eventId;
IF OBJECT_ID(N'competition_groups', N'U') IS NOT NULL
    DELETE FROM competition_groups WHERE track_id = @trackId OR event_id = @eventId;
DELETE FROM tracks WHERE event_id = @eventId;
DELETE FROM hackathon_events WHERE id = @eventId;

-- ── Judges: prelim = score.judge*; Final = final.judge* (fresh panel) ──
DECLARE @judge1Id UNIQUEIDENTIFIER;
DECLARE @judge2Id UNIQUEIDENTIFIER;
DECLARE @finalJudge1Id UNIQUEIDENTIFIER;
DECLARE @finalJudge2Id UNIQUEIDENTIFIER;

IF NOT EXISTS (SELECT 1 FROM users WHERE email = N'score.judge1@fpt.edu.vn')
BEGIN
    SET @judge1Id = 'F1000000-FFFF-4FFF-8FFF-0000000000D1';
    INSERT INTO users (
        id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        @judge1Id, N'score.judge1@fpt.edu.vn', @demoHash, N'Scoring Judge One', NULL, NULL, NULL, N'FPT University',
        N'LECTURER', N'ACTIVE', 0, NULL, NULL, N'ENROLLED', 0,
        @now, @now, @ownerEmail, @ownerEmail
    );
END
ELSE
BEGIN
    UPDATE users SET password_hash = @demoHash, status = N'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        updated_at = @now WHERE email = N'score.judge1@fpt.edu.vn';
END

IF NOT EXISTS (SELECT 1 FROM users WHERE email = N'score.judge2@fpt.edu.vn')
BEGIN
    SET @judge2Id = 'F1000000-FFFF-4FFF-8FFF-0000000000D2';
    INSERT INTO users (
        id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        @judge2Id, N'score.judge2@fpt.edu.vn', @demoHash, N'Scoring Judge Two', NULL, NULL, NULL, N'FPT University',
        N'LECTURER', N'ACTIVE', 0, NULL, NULL, N'ENROLLED', 0,
        @now, @now, @ownerEmail, @ownerEmail
    );
END
ELSE
BEGIN
    UPDATE users SET password_hash = @demoHash, status = N'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        updated_at = @now WHERE email = N'score.judge2@fpt.edu.vn';
END

IF NOT EXISTS (SELECT 1 FROM users WHERE email = N'final.judge1@fpt.edu.vn')
BEGIN
    SET @finalJudge1Id = 'F1000000-FFFF-4FFF-8FFF-0000000000D3';
    INSERT INTO users (
        id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        @finalJudge1Id, N'final.judge1@fpt.edu.vn', @demoHash, N'Final Guest Judge One', NULL, NULL, NULL, N'FPT University',
        N'LECTURER', N'ACTIVE', 0, NULL, NULL, N'ENROLLED', 0,
        @now, @now, @ownerEmail, @ownerEmail
    );
END
ELSE
BEGIN
    UPDATE users SET password_hash = @demoHash, status = N'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        full_name = N'Final Guest Judge One', updated_at = @now WHERE email = N'final.judge1@fpt.edu.vn';
END

IF NOT EXISTS (SELECT 1 FROM users WHERE email = N'final.judge2@fpt.edu.vn')
BEGIN
    SET @finalJudge2Id = 'F1000000-FFFF-4FFF-8FFF-0000000000D4';
    INSERT INTO users (
        id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        @finalJudge2Id, N'final.judge2@fpt.edu.vn', @demoHash, N'Final Guest Judge Two', NULL, NULL, NULL, N'FPT University',
        N'LECTURER', N'ACTIVE', 0, NULL, NULL, N'ENROLLED', 0,
        @now, @now, @ownerEmail, @ownerEmail
    );
END
ELSE
BEGIN
    UPDATE users SET password_hash = @demoHash, status = N'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        full_name = N'Final Guest Judge Two', updated_at = @now WHERE email = N'final.judge2@fpt.edu.vn';
END

SET @judge1Id = (SELECT id FROM users WHERE email = N'score.judge1@fpt.edu.vn');
SET @judge2Id = (SELECT id FROM users WHERE email = N'score.judge2@fpt.edu.vn');
SET @finalJudge1Id = (SELECT id FROM users WHERE email = N'final.judge1@fpt.edu.vn');
SET @finalJudge2Id = (SELECT id FROM users WHERE email = N'final.judge2@fpt.edu.vn');

-- ── 12 students ──
DECLARE @i INT = 1;
WHILE @i <= 12
BEGIN
    DECLARE @pad VARCHAR(12) = RIGHT(REPLICATE('0', 12) + CAST(@i AS VARCHAR(12)), 12);
    DECLARE @userId UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, 'F1100000-FFFF-4FFF-8FFF-' + @pad);
    DECLARE @email NVARCHAR(255) = N'final.student' + RIGHT('00' + CAST(@i AS VARCHAR(2)), 2) + N'@fpt.edu.vn';
    DECLARE @fullName NVARCHAR(255) = N'Final QA Student ' + RIGHT('00' + CAST(@i AS VARCHAR(2)), 2);
    DECLARE @studentId NVARCHAR(50) = N'FQ' + RIGHT('0000' + CAST(@i AS VARCHAR(4)), 4);

    IF EXISTS (SELECT 1 FROM users WHERE id = @userId OR email = @email)
        UPDATE users SET
            email = @email, password_hash = @demoHash, full_name = @fullName,
            user_type = N'FPT_STUDENT', status = N'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
            student_id = @studentId, university_name = N'FPT University', semester = 5,
            student_standing = N'ENROLLED', temporary_account = 0, updated_at = @now, updated_by = @ownerEmail
        WHERE id = @userId OR email = @email;
    ELSE
        INSERT INTO users (
            id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
            user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            @userId, @email, @demoHash, @fullName, NULL, NULL, @studentId, N'FPT University',
            N'FPT_STUDENT', N'ACTIVE', 0, NULL, 5, N'ENROLLED', 0,
            @now, @now, @ownerEmail, @ownerEmail
        );
    SET @i = @i + 1;
END;

DECLARE @regOpen DATE = DATEADD(DAY, -40, @today);
DECLARE @regDeadline DATE = DATEADD(DAY, -10, @today);
DECLARE @compDay DATE = DATEADD(DAY, -3, @today);
DECLARE @endDay DATE = DATEADD(DAY, 30, @today);
DECLARE @prelimStart DATETIME2 = DATEADD(DAY, -3, @now);
DECLARE @prelimEnd DATETIME2 = DATEADD(DAY, -1, @now);
DECLARE @prelimSub DATETIME2 = DATEADD(DAY, -2, @now);
DECLARE @prelimScore DATETIME2 = DATEADD(HOUR, -12, @now);
DECLARE @finalStart DATETIME2 = DATEADD(HOUR, -1, @now);
DECLARE @finalEnd DATETIME2 = DATEADD(DAY, 14, @now);
DECLARE @finalSub DATETIME2 = DATEADD(HOUR, -1, @now);
DECLARE @finalScore DATETIME2 = DATEADD(DAY, 14, @now);

INSERT INTO hackathon_events (
    id, name, season, year, start_date, end_date,
    registration_open_date, registration_deadline,
    description, location, format, competition_format,
    min_team, max_team, semester_min, semester_max,
    scoring_template_id, status, leaderboard_public,
    owner_user_id, created_by, created_at, updated_at, avatar_url
) VALUES (
    @eventId,
    N'SEAL Final Advancement QA',
    N'Summer', 2026,
    @compDay, @endDay,
    @regOpen, @regDeadline,
    N'QA: prelim scored+ranked; Select Finalists to carry submissions into Final for judging.',
    N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
    3, 4, 4, 8,
    @templateId, N'SCORING', 0,
    @ownerUserId, @ownerEmail, @now, @now, NULL
);

INSERT INTO tracks (
    id, event_id, name, description, max_teams, status, topic,
    auto_generate_groups, created_at, updated_at, created_by
) VALUES (
    @trackId, @eventId, N'Track Alpha', N'Final advancement QA track', NULL, N'OPEN', NULL,
    0, @now, @now, @ownerEmail
);

-- competition_groups: support both schemas (with/without event_id, max_teams, sort_order)
IF COL_LENGTH('dbo.competition_groups', 'event_id') IS NOT NULL
    AND COL_LENGTH('dbo.competition_groups', 'sort_order') IS NOT NULL
BEGIN
    INSERT INTO competition_groups (id, track_id, event_id, name, max_teams, sort_order, created_at, updated_at, created_by)
    VALUES
        (@group1Id, @trackId, @eventId, N'Track Alpha G1', 10, 0, @now, @now, @ownerEmail),
        (@group2Id, @trackId, @eventId, N'Track Alpha G2', 10, 1, @now, @now, @ownerEmail);
END
ELSE IF COL_LENGTH('dbo.competition_groups', 'event_id') IS NOT NULL
BEGIN
    INSERT INTO competition_groups (id, track_id, event_id, name, max_teams, created_at, updated_at, created_by)
    VALUES
        (@group1Id, @trackId, @eventId, N'Track Alpha G1', 10, @now, @now, @ownerEmail),
        (@group2Id, @trackId, @eventId, N'Track Alpha G2', 10, @now, @now, @ownerEmail);
END
ELSE IF COL_LENGTH('dbo.competition_groups', 'max_teams') IS NOT NULL
BEGIN
    INSERT INTO competition_groups (id, track_id, name, max_teams, created_at, updated_at, created_by)
    VALUES
        (@group1Id, @trackId, N'Track Alpha G1', 10, @now, @now, @ownerEmail),
        (@group2Id, @trackId, N'Track Alpha G2', 10, @now, @now, @ownerEmail);
END
ELSE
BEGIN
    INSERT INTO competition_groups (id, track_id, name, created_at, updated_at, created_by)
    VALUES
        (@group1Id, @trackId, N'Track Alpha G1', @now, @now, @ownerEmail),
        (@group2Id, @trackId, N'Track Alpha G2', @now, @now, @ownerEmail);
END

INSERT INTO rounds (
    id, event_id, round_number, name, round_type,
    start_date, end_date, slide_deadline, submission_deadline, scoring_deadline,
    advancement_cutoff, advancement_rule, round_weight, min_judges_per_round,
    created_at, updated_at, created_by
) VALUES
    (@prelimId, @eventId, 1, N'Preliminary Round', N'PRELIMINARY',
     @prelimStart, @prelimEnd,
     DATEADD(HOUR, -2, @prelimSub), @prelimSub, @prelimScore,
     1, N'PER_GROUP_TOP_N', 40, 2,
     @now, @now, @ownerEmail),
    (@finalId, @eventId, 2, N'Finals', N'FINAL',
     @finalStart, @finalEnd,
     NULL, @finalSub, @finalScore,
     1, N'FINALIST_POOL', 60, 2,
     @now, @now, @ownerEmail);

INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by)
VALUES
    (@crit1, @prelimId, N'Technical', N'Technical quality', 40, 0, 1, 5, @now, @now, @ownerEmail),
    (@crit2, @prelimId, N'Innovation', N'Innovation', 30, 1, 1, 5, @now, @now, @ownerEmail),
    (@crit3, @prelimId, N'Presentation', N'Presentation', 30, 2, 1, 5, @now, @now, @ownerEmail),
    (@fcrit1, @finalId, N'Demo', N'Live demo / pitch', 60, 0, 1, 5, @now, @now, @ownerEmail),
    (@fcrit2, @finalId, N'Impact', N'Business impact', 40, 1, 1, 5, @now, @now, @ownerEmail);

INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id, created_by)
VALUES
    (NEWID(), @now, @now, @judge1Id, @eventId, @ownerEmail),
    (NEWID(), @now, @now, @judge2Id, @eventId, @ownerEmail),
    (NEWID(), @now, @now, @finalJudge1Id, @eventId, @ownerEmail),
    (NEWID(), @now, @now, @finalJudge2Id, @eventId, @ownerEmail);

-- Judges on prelim (score.judge*) + Final (final.judge*) — Final panel must be fresh
INSERT INTO judge_assignments (
    id, created_at, assigned_at, judge_user_id, round_id, scope, active, created_by
) VALUES
    (NEWID(), @now, @now, @judge1Id, @prelimId, N'ROUND', 1, @ownerEmail),
    (NEWID(), @now, @now, @judge2Id, @prelimId, N'ROUND', 1, @ownerEmail),
    (NEWID(), @now, @now, @finalJudge1Id, @finalId, N'ROUND', 1, @ownerEmail),
    (NEWID(), @now, @now, @finalJudge2Id, @finalId, N'ROUND', 1, @ownerEmail);

-- ── 4 teams: G1 = Team 01 (winner), Team 02; G2 = Team 03 (winner), Team 04 ──
-- Scores designed so ranks: T01 > T03 > T02 > T04 (but per-group still advances T01 + T03)
SET @i = 1;
WHILE @i <= 4
BEGIN
    DECLARE @tPad VARCHAR(12) = RIGHT(REPLICATE('0', 12) + CAST(@i AS VARCHAR(12)), 12);
    DECLARE @teamId UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, 'F2000000-FFFF-4FFF-8FFF-' + @tPad);
    DECLARE @subId UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, 'F3000000-FFFF-4FFF-8FFF-' + @tPad);
    DECLARE @verId UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, 'F4000000-FFFF-4FFF-8FFF-' + @tPad);
    DECLARE @score1Id UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, 'F5100000-FFFF-4FFF-8FFF-' + @tPad);
    DECLARE @score2Id UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, 'F5200000-FFFF-4FFF-8FFF-' + @tPad);
    DECLARE @groupId UNIQUEIDENTIFIER = CASE WHEN @i <= 2 THEN @group1Id ELSE @group2Id END;

    DECLARE @leaderIdx INT = (@i - 1) * 3 + 1;
    DECLARE @m2Idx INT = @leaderIdx + 1;
    DECLARE @m3Idx INT = @leaderIdx + 2;
    DECLARE @leaderId UNIQUEIDENTIFIER = (
        SELECT id FROM users WHERE email = N'final.student' + RIGHT('00' + CAST(@leaderIdx AS VARCHAR(2)), 2) + N'@fpt.edu.vn'
    );
    DECLARE @member2Id UNIQUEIDENTIFIER = (
        SELECT id FROM users WHERE email = N'final.student' + RIGHT('00' + CAST(@m2Idx AS VARCHAR(2)), 2) + N'@fpt.edu.vn'
    );
    DECLARE @member3Id UNIQUEIDENTIFIER = (
        SELECT id FROM users WHERE email = N'final.student' + RIGHT('00' + CAST(@m3Idx AS VARCHAR(2)), 2) + N'@fpt.edu.vn'
    );
    DECLARE @teamName NVARCHAR(255) = N'Final QA Team ' + RIGHT('00' + CAST(@i AS VARCHAR(2)), 2);

    -- Base scores: team1=5, team3=4, team2=3, team4=2 across criteria (avg)
    DECLARE @base INT = CASE @i WHEN 1 THEN 5 WHEN 3 THEN 4 WHEN 2 THEN 3 ELSE 2 END;

    INSERT INTO teams (
        id, created_at, created_by, event_id, leader_id, name, status,
        track_id, track_assigned_at, track_assignment_method, track_assigned_by,
        group_id, is_recruiting, recruitment_note, version
    ) VALUES (
        @teamId, @now, @ownerEmail, @eventId, @leaderId, @teamName, N'CONFIRMED',
        @trackId, @now, N'MANUAL', @ownerUserId,
        @groupId, 0, N'Final advancement QA team.', 0
    );

    INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
        (NEWID(), @now, @ownerEmail, @now, N'LEADER', @leaderId, @teamId, @eventId),
        (NEWID(), @now, @ownerEmail, @now, N'MEMBER', @member2Id, @teamId, @eventId),
        (NEWID(), @now, @ownerEmail, @now, N'MEMBER', @member3Id, @teamId, @eventId);

    -- Submission ONLY on prelim (Final will be carry-over)
    INSERT INTO submissions (
        id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock
    ) VALUES (
        @subId, @now, @ownerEmail, NULL, @prelimId, N'SUBMITTED', @leaderId, @teamId, 0
    );

    INSERT INTO submission_versions (
        id, created_at, created_by, demo_url, github_url, slide_url, submitted_at, version_number, submission_id
    ) VALUES (
        @verId, @now, @ownerEmail,
        N'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        N'https://github.com/seal-fpt/final-qa-' + CAST(@i AS NVARCHAR(2)),
        N'https://docs.google.com/presentation/d/final-qa-' + CAST(@i AS NVARCHAR(2)),
        DATEADD(MINUTE, -30 - @i, @prelimSub),
        1, @subId
    );
    UPDATE submissions SET current_version_id = @verId WHERE id = @subId;

    -- Both judges completed prelim
    INSERT INTO judge_scores (
        id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version
    ) VALUES
        (@score1Id, @now, @ownerEmail, DATEADD(HOUR, -20, @now), @judge1Id, @prelimId,
         DATEADD(HOUR, -22, @now), N'COMPLETED', @subId, 0),
        (@score2Id, @now, @ownerEmail, DATEADD(HOUR, -18, @now), @judge2Id, @prelimId,
         DATEADD(HOUR, -21, @now), N'COMPLETED', @subId, 0);

    INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
        (NEWID(), @now, @ownerEmail, @crit1, @base, @score1Id),
        (NEWID(), @now, @ownerEmail, @crit2, @base, @score1Id),
        (NEWID(), @now, @ownerEmail, @crit3, @base, @score1Id),
        (NEWID(), @now, @ownerEmail, @crit1, @base, @score2Id),
        (NEWID(), @now, @ownerEmail, @crit2, @base, @score2Id),
        (NEWID(), @now, @ownerEmail, @crit3, @base, @score2Id);

    -- Rankings: rank by team order quality (1,3,2,4)
    DECLARE @rank INT = CASE @i WHEN 1 THEN 1 WHEN 3 THEN 2 WHEN 2 THEN 3 ELSE 4 END;
    DECLARE @finalScoreNum DECIMAL(7,4) = CAST(@base AS DECIMAL(7,4));
    INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, [rank], round_id, team_id, [version])
    VALUES (NEWID(), @now, @ownerEmail, @now, @finalScoreNum, @rank, @prelimId, @teamId, 1);

    SET @i = @i + 1;
END;

INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, @ownerEmail, @now, @eventId, N'APPROVED', u.id, 0, 0
FROM users u
WHERE u.email LIKE N'final.student%@fpt.edu.vn';

COMMIT TRANSACTION;

PRINT '=== Seed OK: SEAL Final Advancement QA ===';
PRINT 'Event id: F1000000-FFFF-4FFF-8FFF-000000000001';
PRINT 'Prelim: scored by score.judge1/2 + rankings v1. Final: final.judge1/2 assigned, no submissions yet.';
PRINT 'Groups: G1 (Team 01 winner, Team 02), G2 (Team 03 winner, Team 04)';
PRINT 'Next: POST /api/events/F1000000-FFFF-4FFF-8FFF-000000000001/finalists';
PRINT 'Then score Final as final.judge1@fpt.edu.vn / Demo@123456';
