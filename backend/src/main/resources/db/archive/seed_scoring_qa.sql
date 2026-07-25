-- QA seed: SCORING event with teams + submissions, 2 judges (1 done / 1 pending).
-- Purpose: test Lecturer Scoring UI — finish remaining scores as the second judge.
-- Prerequisites: scoring_templates exist (start backend once with profile `dev`).
-- Password for all seeded accounts: Demo@123456
-- Idempotent: only wipes this event graph (event id below).
--
-- Login to finish scoring:
--   score.judge2@fpt.edu.vn / Demo@123456  →  /lecturer/scoring
-- Already scored:
--   score.judge1@fpt.edu.vn / Demo@123456
--
-- Run:
--   sqlcmd -S localhost -U sa -P <password> -d SEAL -C -I -i seed_scoring_qa.sql

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

DECLARE @eventId UNIQUEIDENTIFIER = 'C1000000-CCCC-4CCC-8CCC-000000000001';
DECLARE @trackId UNIQUEIDENTIFIER = 'C1000000-CCCC-4CCC-8CCC-0000000000A1';
DECLARE @prelimId UNIQUEIDENTIFIER = 'C1000000-CCCC-4CCC-8CCC-0000000000B1';
DECLARE @finalId UNIQUEIDENTIFIER = 'C1000000-CCCC-4CCC-8CCC-0000000000B2';

DECLARE @crit1 UNIQUEIDENTIFIER = 'C1000000-CCCC-4CCC-8CCC-0000000000C1';
DECLARE @crit2 UNIQUEIDENTIFIER = 'C1000000-CCCC-4CCC-8CCC-0000000000C2';
DECLARE @crit3 UNIQUEIDENTIFIER = 'C1000000-CCCC-4CCC-8CCC-0000000000C3';

DECLARE @judge1Id UNIQUEIDENTIFIER = 'C1000000-CCCC-4CCC-8CCC-0000000000D1';
DECLARE @judge2Id UNIQUEIDENTIFIER = 'C1000000-CCCC-4CCC-8CCC-0000000000D2';

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

-- ── Wipe previous run of this QA event only ──
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
    DELETE FROM competition_groups WHERE track_id IN (SELECT id FROM tracks WHERE event_id = @eventId);
DELETE FROM tracks WHERE event_id = @eventId;
DELETE FROM hackathon_events WHERE id = @eventId;

-- ── Upsert 2 judges ──
DECLARE @judges TABLE (
    id UNIQUEIDENTIFIER NOT NULL,
    email NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(255) NOT NULL
);
INSERT INTO @judges (id, email, full_name) VALUES
    (@judge1Id, N'score.judge1@fpt.edu.vn', N'Scoring Judge One (done)'),
    (@judge2Id, N'score.judge2@fpt.edu.vn', N'Scoring Judge Two (pending)');

DECLARE @jEmail NVARCHAR(255);
DECLARE @jId UNIQUEIDENTIFIER;
DECLARE @jName NVARCHAR(255);
DECLARE jcur CURSOR LOCAL FAST_FORWARD FOR SELECT id, email, full_name FROM @judges;
OPEN jcur;
FETCH NEXT FROM jcur INTO @jId, @jEmail, @jName;
WHILE @@FETCH_STATUS = 0
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE id = @jId OR email = @jEmail)
    BEGIN
        UPDATE users SET
            email = @jEmail,
            password_hash = @demoHash,
            full_name = @jName,
            user_type = N'LECTURER',
            status = N'ACTIVE',
            failed_login_attempts = 0,
            locked_until = NULL,
            student_standing = N'ENROLLED',
            temporary_account = 0,
            updated_at = @now,
            updated_by = @ownerEmail
        WHERE id = @jId OR email = @jEmail;
        SET @jId = (SELECT id FROM users WHERE email = @jEmail);
        IF @jEmail = N'score.judge1@fpt.edu.vn' SET @judge1Id = @jId;
        IF @jEmail = N'score.judge2@fpt.edu.vn' SET @judge2Id = @jId;
    END
    ELSE
    BEGIN
        INSERT INTO users (
            id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
            user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            @jId, @jEmail, @demoHash, @jName, NULL, NULL, NULL, N'FPT University',
            N'LECTURER', N'ACTIVE', 0, NULL, NULL, N'ENROLLED', 0,
            @now, @now, @ownerEmail, @ownerEmail
        );
    END
    FETCH NEXT FROM jcur INTO @jId, @jEmail, @jName;
END
CLOSE jcur;
DEALLOCATE jcur;

-- Re-resolve judge ids after upsert (email is source of truth)
SET @judge1Id = (SELECT id FROM users WHERE email = N'score.judge1@fpt.edu.vn');
SET @judge2Id = (SELECT id FROM users WHERE email = N'score.judge2@fpt.edu.vn');

-- ── Upsert 12 students (4 teams x 3) ──
DECLARE @i INT = 1;
WHILE @i <= 12
BEGIN
    DECLARE @pad VARCHAR(12) = RIGHT(REPLICATE('0', 12) + CAST(@i AS VARCHAR(12)), 12);
    DECLARE @userId UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, 'C1100000-CCCC-4CCC-8CCC-' + @pad);
    DECLARE @email NVARCHAR(255) = N'score.student' + RIGHT('00' + CAST(@i AS VARCHAR(2)), 2) + N'@fpt.edu.vn';
    DECLARE @fullName NVARCHAR(255) = N'Scoring Student ' + RIGHT('00' + CAST(@i AS VARCHAR(2)), 2);
    DECLARE @studentId NVARCHAR(50) = N'SC' + RIGHT('0000' + CAST(@i AS VARCHAR(4)), 4);

    IF EXISTS (SELECT 1 FROM users WHERE id = @userId OR email = @email)
    BEGIN
        UPDATE users SET
            email = @email,
            password_hash = @demoHash,
            full_name = @fullName,
            user_type = N'FPT_STUDENT',
            status = N'ACTIVE',
            failed_login_attempts = 0,
            locked_until = NULL,
            student_id = @studentId,
            university_name = N'FPT University',
            semester = 5,
            student_standing = N'ENROLLED',
            temporary_account = 0,
            updated_at = @now,
            updated_by = @ownerEmail
        WHERE id = @userId OR email = @email;
    END
    ELSE
    BEGIN
        INSERT INTO users (
            id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
            user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            @userId, @email, @demoHash, @fullName, NULL, NULL, @studentId, N'FPT University',
            N'FPT_STUDENT', N'ACTIVE', 0, NULL, 5, N'ENROLLED', 0,
            @now, @now, @ownerEmail, @ownerEmail
        );
    END
    SET @i = @i + 1;
END;

-- ── Event: SCORING, round open for scoring now ──
DECLARE @regOpen DATE = DATEADD(DAY, -40, @today);
DECLARE @regDeadline DATE = DATEADD(DAY, -10, @today);
DECLARE @compDay DATE = DATEADD(DAY, -1, @today);
DECLARE @endDay DATE = DATEADD(DAY, 21, @today);
DECLARE @prelimStart DATETIME2 = DATEADD(DAY, -2, @now);
DECLARE @prelimSub DATETIME2 = DATEADD(HOUR, -6, @now);
-- Keep scoring window open long enough for QA (LocalDateTime.now() vs UTC seed can skew ~7h)
DECLARE @prelimScore DATETIME2 = DATEADD(DAY, 14, @now);
DECLARE @finalStart DATETIME2 = DATEADD(DAY, 15, @now);
DECLARE @finalSub DATETIME2 = DATEADD(DAY, 15, @now);
DECLARE @finalScore DATETIME2 = DATEADD(DAY, 16, @now);

INSERT INTO hackathon_events (
    id, name, season, year, start_date, end_date,
    registration_open_date, registration_deadline,
    description, location, format, competition_format,
    min_team, max_team, semester_min, semester_max,
    scoring_template_id, status, leaderboard_public,
    owner_user_id, created_by, created_at, updated_at, avatar_url
) VALUES (
    @eventId,
    N'SEAL Scoring QA - Finish Judging',
    N'Summer', 2026,
    @compDay, @endDay,
    @regOpen, @regDeadline,
    N'QA fixture for Lecturer Scoring. 4 teams submitted; judge1 completed; judge2 pending.',
    N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
    3, 4, 4, 8,
    @templateId, N'SCORING', 0,
    @ownerUserId, @ownerEmail, @now, @now, NULL
);

INSERT INTO tracks (
    id, event_id, name, description, max_teams, status, topic,
    auto_generate_groups, created_at, updated_at, created_by
) VALUES (
    @trackId, @eventId, N'Agentic RAG', N'Scoring QA track', NULL, N'OPEN', NULL,
    1, @now, @now, @ownerEmail
);

INSERT INTO rounds (
    id, event_id, round_number, name, round_type,
    start_date, end_date, slide_deadline, submission_deadline, scoring_deadline,
    advancement_cutoff, advancement_rule, round_weight, min_judges_per_round,
    created_at, updated_at, created_by
) VALUES
    (@prelimId, @eventId, 1, N'Preliminary Round', N'PRELIMINARY',
     @prelimStart, @prelimScore,
     DATEADD(HOUR, -2, @prelimSub), @prelimSub, @prelimScore,
     2, N'PER_TRACK_TOP_N', 40, 2,
     @now, @now, @ownerEmail),
    (@finalId, @eventId, 2, N'Finals', N'FINAL',
     @finalStart, @finalScore,
     NULL, @finalSub, @finalScore,
     4, N'FINALIST_POOL', 60, 2,
     @now, @now, @ownerEmail);

INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by)
VALUES
    (@crit1, @prelimId, N'Technical', N'Technical quality', 40, 0, 1, 5, @now, @now, @ownerEmail),
    (@crit2, @prelimId, N'Innovation', N'Innovation', 30, 1, 1, 5, @now, @now, @ownerEmail),
    (@crit3, @prelimId, N'Presentation', N'Presentation', 30, 2, 1, 5, @now, @now, @ownerEmail),
    (NEWID(), @finalId, N'Demo', N'Live demo', 60, 0, 1, 5, @now, @now, @ownerEmail),
    (NEWID(), @finalId, N'Impact', N'Business impact', 40, 1, 1, 5, @now, @now, @ownerEmail);

-- Domains optional for scoring QA (schema varies across local DBs); skip insert.

INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id, created_by)
VALUES
    (NEWID(), @now, @now, @judge1Id, @eventId, @ownerEmail),
    (NEWID(), @now, @now, @judge2Id, @eventId, @ownerEmail);

INSERT INTO judge_assignments (
    id, created_at, assigned_at, judge_user_id, round_id, scope, active, created_by
) VALUES
    (NEWID(), @now, @now, @judge1Id, @prelimId, N'ROUND', 1, @ownerEmail),
    (NEWID(), @now, @now, @judge2Id, @prelimId, N'ROUND', 1, @ownerEmail);

-- ── 4 teams + submissions + judge1 completed scores ──
SET @i = 1;
WHILE @i <= 4
BEGIN
    DECLARE @tPad VARCHAR(12) = RIGHT(REPLICATE('0', 12) + CAST(@i AS VARCHAR(12)), 12);
    DECLARE @teamId UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, 'C2000000-CCCC-4CCC-8CCC-' + @tPad);
    DECLARE @subId UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, 'C3000000-CCCC-4CCC-8CCC-' + @tPad);
    DECLARE @verId UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, 'C4000000-CCCC-4CCC-8CCC-' + @tPad);
    DECLARE @scoreId UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, 'C5000000-CCCC-4CCC-8CCC-' + @tPad);

    DECLARE @leaderIdx INT = (@i - 1) * 3 + 1;
    DECLARE @m2Idx INT = @leaderIdx + 1;
    DECLARE @m3Idx INT = @leaderIdx + 2;
    DECLARE @leaderId UNIQUEIDENTIFIER = (
        SELECT id FROM users WHERE email = N'score.student' + RIGHT('00' + CAST(@leaderIdx AS VARCHAR(2)), 2) + N'@fpt.edu.vn'
    );
    DECLARE @member2Id UNIQUEIDENTIFIER = (
        SELECT id FROM users WHERE email = N'score.student' + RIGHT('00' + CAST(@m2Idx AS VARCHAR(2)), 2) + N'@fpt.edu.vn'
    );
    DECLARE @member3Id UNIQUEIDENTIFIER = (
        SELECT id FROM users WHERE email = N'score.student' + RIGHT('00' + CAST(@m3Idx AS VARCHAR(2)), 2) + N'@fpt.edu.vn'
    );
    DECLARE @teamName NVARCHAR(255) = N'Scoring Team ' + RIGHT('00' + CAST(@i AS VARCHAR(2)), 2);

    INSERT INTO teams (
        id, created_at, created_by, event_id, leader_id, name, status,
        track_id, track_assigned_at, track_assignment_method, track_assigned_by,
        is_recruiting, recruitment_note, version
    ) VALUES (
        @teamId, @now, @ownerEmail, @eventId, @leaderId, @teamName, N'CONFIRMED',
        @trackId, @now, N'MANUAL', @ownerUserId,
        0, N'Scoring QA team.', 0
    );

    INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
        (NEWID(), @now, @ownerEmail, @now, N'LEADER', @leaderId, @teamId, @eventId),
        (NEWID(), @now, @ownerEmail, @now, N'MEMBER', @member2Id, @teamId, @eventId),
        (NEWID(), @now, @ownerEmail, @now, N'MEMBER', @member3Id, @teamId, @eventId);

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
        N'https://github.com/seal-fpt/scoring-qa-' + CAST(@i AS NVARCHAR(2)),
        N'https://docs.google.com/presentation/d/scoring-qa-' + CAST(@i AS NVARCHAR(2)),
        DATEADD(MINUTE, -30 - @i, @prelimSub),
        1, @subId
    );

    UPDATE submissions SET current_version_id = @verId WHERE id = @subId;

    -- Judge 1 completed all 4 teams
    INSERT INTO judge_scores (
        id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version
    ) VALUES (
        @scoreId, @now, @ownerEmail, DATEADD(HOUR, -1, @now), @judge1Id, @prelimId,
        DATEADD(HOUR, -2, @now), N'COMPLETED', @subId, 0
    );

    INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
        (NEWID(), @now, @ownerEmail, @crit1, 3 + (@i % 3), @scoreId),
        (NEWID(), @now, @ownerEmail, @crit2, 4, @scoreId),
        (NEWID(), @now, @ownerEmail, @crit3, 5 - (@i % 2), @scoreId);

    SET @i = @i + 1;
END;

-- Enroll all scoring students
INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, @ownerEmail, @now, @eventId, N'APPROVED', u.id, 0, 0
FROM users u
WHERE u.email LIKE N'score.student%@fpt.edu.vn';

COMMIT TRANSACTION;

PRINT '=== Seed OK: SEAL Scoring QA - Finish Judging ===';
PRINT 'Event id: C1000000-CCCC-4CCC-8CCC-000000000001';
PRINT 'Status: SCORING | Track: 1 | Teams: 4 (submitted) | Judges: 2';
PRINT 'Judge DONE:    score.judge1@fpt.edu.vn / Demo@123456';
PRINT 'Judge PENDING: score.judge2@fpt.edu.vn / Demo@123456  -> /lecturer/scoring';
PRINT 'Open Preliminary Round and score Scoring Team 01..04';
