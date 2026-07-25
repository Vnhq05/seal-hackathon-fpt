-- QA seed: CLOSED_REGISTRATION event with 20 unassigned teams + 2 tracks + mentor track pool.
-- Purpose: test Team Assignments (manual/random track) and Mentor Assignments (draw mentors).
-- State after seed:
--   - Teams: CONFIRMED, NO track, NO mentor-team links (ready to assign / draw)
--   - Event staff: judges + mentors pre-added (event_*_assignments)
--   - Track mentor pool: lecturer1+2 -> Alpha, lecturer3+4 -> Beta (not yet drawn to teams)
-- Prerequisites: scoring_templates exist (start backend once with profile `dev`).
-- Password: Demo@123456 for assign.student* ; lecturers use existing passwords.
-- Idempotent: only wipes this event graph (event id below).
--
-- Run:
--   sqlcmd -S localhost -U sa -P <password> -d SEAL -C -I -i seed_track_mentor_assignment_qa.sql

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
    SELECT TOP 1 id FROM users WHERE email IN (N'admin@seal.com', N'coordinator@seal.com') ORDER BY CASE email WHEN N'admin@seal.com' THEN 0 ELSE 1 END
);
DECLARE @ownerEmail NVARCHAR(255) = (SELECT email FROM users WHERE id = @ownerUserId);

DECLARE @eventId UNIQUEIDENTIFIER = 'A1000000-AAAA-4AAA-8AAA-000000000001';
DECLARE @trackA UNIQUEIDENTIFIER = 'A1000000-AAAA-4AAA-8AAA-0000000000A1';
DECLARE @trackB UNIQUEIDENTIFIER = 'A1000000-AAAA-4AAA-8AAA-0000000000A2';
DECLARE @prelimId UNIQUEIDENTIFIER = 'A1000000-AAAA-4AAA-8AAA-0000000000B1';
DECLARE @finalId UNIQUEIDENTIFIER = 'A1000000-AAAA-4AAA-8AAA-0000000000B2';

DECLARE @mentor1 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'lecturer1@fpt.edu.vn');
DECLARE @mentor2 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'lecturer2@fpt.edu.vn');
DECLARE @mentor3 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'lecturer3@fpt.edu.vn');
DECLARE @mentor4 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'lecturer4@fpt.edu.vn');
-- Judges separate from mentors (avoid BR-34 mentor/judge conflict)
DECLARE @judge1 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'lecturer5@fpt.edu.vn');
DECLARE @judge2 UNIQUEIDENTIFIER = (
    SELECT TOP 1 id FROM users
    WHERE email IN (N'score.judge1@fpt.edu.vn', N'score.judge2@fpt.edu.vn', N'nguyen.van.duc@fpt.edu.vn')
    ORDER BY CASE email
        WHEN N'score.judge1@fpt.edu.vn' THEN 0
        WHEN N'score.judge2@fpt.edu.vn' THEN 1
        ELSE 2 END
);

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

IF @mentor1 IS NULL OR @mentor2 IS NULL OR @mentor3 IS NULL OR @mentor4 IS NULL
BEGIN
    RAISERROR('Need lecturer1..4@fpt.edu.vn accounts for mentor pool.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END

IF @judge1 IS NULL
BEGIN
    RAISERROR('Need lecturer5@fpt.edu.vn for event judge staff.', 16, 1);
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
SELECT s.id FROM submissions s WHERE s.round_id IN (SELECT id FROM @roundIds) OR s.team_id IN (SELECT id FROM @teamIds);

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

-- ── Ensure 60 FPT students (3 per team x 20) ──
DECLARE @i INT = 1;
WHILE @i <= 60
BEGIN
    DECLARE @pad VARCHAR(12) = RIGHT(REPLICATE('0', 12) + CAST(@i AS VARCHAR(12)), 12);
    DECLARE @userId UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, 'B1000000-AAAA-4AAA-8AAA-' + @pad);
    DECLARE @email NVARCHAR(255) = N'assign.student' + RIGHT('00' + CAST(@i AS VARCHAR(2)), 2) + N'@fpt.edu.vn';
    DECLARE @fullName NVARCHAR(255) = N'Assign Student ' + RIGHT('00' + CAST(@i AS VARCHAR(2)), 2);
    DECLARE @studentId NVARCHAR(50) = N'AS' + RIGHT('0000' + CAST(@i AS VARCHAR(4)), 4);

    IF EXISTS (SELECT 1 FROM users WHERE id = @userId OR email = @email)
    BEGIN
        UPDATE users SET
            email = @email,
            password_hash = @demoHash,
            full_name = @fullName,
            user_type = 'FPT_STUDENT',
            status = 'ACTIVE',
            failed_login_attempts = 0,
            locked_until = NULL,
            student_id = @studentId,
            university_name = N'FPT University',
            semester = 5,
            student_standing = 'ENROLLED',
            temporary_account = 0,
            updated_at = @now,
            updated_by = @ownerEmail
        WHERE id = @userId OR email = @email;
        -- Keep @userId as the row that matches email if id differed
        SET @userId = (SELECT id FROM users WHERE email = @email);
    END
    ELSE
    BEGIN
        INSERT INTO users (
            id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
            user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            @userId, @email, @demoHash, @fullName, NULL, NULL, @studentId, N'FPT University',
            'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
            @now, @now, @ownerEmail, @ownerEmail
        );
    END

    SET @i = @i + 1;
END;

-- ── Event: CLOSED_REGISTRATION, 2 tracks, 2 rounds ──
DECLARE @regOpen DATE = DATEADD(DAY, -30, @today);
DECLARE @regDeadline DATE = DATEADD(DAY, -1, @today);
DECLARE @compDay DATE = DATEADD(DAY, 14, @today);
DECLARE @compDayDt DATETIME2 = CAST(@compDay AS DATETIME2);

INSERT INTO hackathon_events (
    id, name, season, year, start_date, end_date,
    registration_open_date, registration_deadline,
    description, location, format, competition_format,
    min_team, max_team, semester_min, semester_max,
    scoring_template_id, status, leaderboard_public,
    owner_user_id, created_by, created_at, updated_at, avatar_url
) VALUES (
    @eventId,
    N'SEAL Assignment QA - Closed Reg',
    N'Summer', 2026,
    @compDay, @compDay,
    @regOpen, @regDeadline,
    N'QA fixture for Team Assignments + Mentor Draw. 20 teams without track; 2 tracks; mentor pool ready.',
    N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
    3, 20, 4, 8,
    @templateId, N'CLOSED_REGISTRATION', 0,
    @ownerUserId, @ownerEmail, @now, @now, NULL
);

INSERT INTO tracks (
    id, event_id, name, description, max_teams, status, topic,
    auto_generate_groups, created_at, updated_at, created_by
) VALUES
    (@trackA, @eventId, N'Track Alpha', N'QA track A', NULL, N'OPEN', NULL, 1, @now, @now, @ownerEmail),
    (@trackB, @eventId, N'Track Beta', N'QA track B', NULL, N'OPEN', NULL, 1, @now, @now, @ownerEmail);

INSERT INTO rounds (
    id, event_id, round_number, name, round_type,
    start_date, end_date, slide_deadline, submission_deadline, scoring_deadline,
    advancement_cutoff, advancement_rule, round_weight, min_judges_per_round,
    created_at, updated_at, created_by
) VALUES
    (@prelimId, @eventId, 1, N'Preliminary Round', N'PRELIMINARY',
     DATEADD(HOUR, 7, @compDayDt),
     DATEADD(MINUTE, 15 * 60 + 30, @compDayDt),
     DATEADD(HOUR, 10, @compDayDt),
     DATEADD(HOUR, 14, @compDayDt),
     DATEADD(MINUTE, 15 * 60 + 30, @compDayDt),
     2, N'PER_TRACK_TOP_N', 40, 2,
     @now, @now, @ownerEmail),
    (@finalId, @eventId, 2, N'Finals', N'FINAL',
     DATEADD(MINUTE, 15 * 60 + 30, @compDayDt),
     DATEADD(HOUR, 17, @compDayDt),
     NULL,
     DATEADD(MINUTE, 15 * 60 + 30, @compDayDt),
     DATEADD(HOUR, 17, @compDayDt),
     6, N'FINALIST_POOL', 60, 2,
     @now, @now, @ownerEmail);

-- Minimal criteria so round screens do not look empty
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by)
VALUES
    (NEWID(), @prelimId, N'Technical', N'Technical quality', 50, 0, 1, 5, @now, @now, @ownerEmail),
    (NEWID(), @prelimId, N'Innovation', N'Innovation', 50, 1, 1, 5, @now, @now, @ownerEmail),
    (NEWID(), @finalId, N'Demo', N'Live demo', 60, 0, 1, 5, @now, @now, @ownerEmail),
    (NEWID(), @finalId, N'Impact', N'Business impact', 40, 1, 1, 5, @now, @now, @ownerEmail);

-- Event staff roster (Add Lecture / Event Staff tab)
INSERT INTO event_judge_assignments (id, created_at, created_by, assigned_at, judge_user_id, event_id)
VALUES
    (NEWID(), @now, @ownerEmail, @now, @judge1, @eventId);
IF @judge2 IS NOT NULL AND @judge2 <> @judge1
    INSERT INTO event_judge_assignments (id, created_at, created_by, assigned_at, judge_user_id, event_id)
    VALUES (NEWID(), @now, @ownerEmail, @now, @judge2, @eventId);

INSERT INTO event_mentor_assignments (id, created_at, created_by, assigned_at, mentor_user_id, event_id)
VALUES
    (NEWID(), @now, @ownerEmail, @now, @mentor1, @eventId),
    (NEWID(), @now, @ownerEmail, @now, @mentor2, @eventId),
    (NEWID(), @now, @ownerEmail, @now, @mentor3, @eventId),
    (NEWID(), @now, @ownerEmail, @now, @mentor4, @eventId);

-- Mentor pool per track (2 mentors / track) — NOT yet drawn to teams
INSERT INTO mentor_assignments (id, created_at, created_by, assigned_at, mentor_user_id, event_id, track_id, team_id, active)
VALUES
    (NEWID(), @now, @ownerEmail, @now, @mentor1, @eventId, @trackA, NULL, 1),
    (NEWID(), @now, @ownerEmail, @now, @mentor2, @eventId, @trackA, NULL, 1),
    (NEWID(), @now, @ownerEmail, @now, @mentor3, @eventId, @trackB, NULL, 1),
    (NEWID(), @now, @ownerEmail, @now, @mentor4, @eventId, @trackB, NULL, 1);

-- ── 20 teams, no track_id ──
SET @i = 1;
WHILE @i <= 20
BEGIN
    DECLARE @tPad VARCHAR(12) = RIGHT(REPLICATE('0', 12) + CAST(@i AS VARCHAR(12)), 12);
    DECLARE @teamId UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, 'B2000000-AAAA-4AAA-8AAA-' + @tPad);
    DECLARE @leaderIdx INT = (@i - 1) * 3 + 1;
    DECLARE @m2Idx INT = @leaderIdx + 1;
    DECLARE @m3Idx INT = @leaderIdx + 2;
    DECLARE @leaderId UNIQUEIDENTIFIER = (
        SELECT id FROM users WHERE email = N'assign.student' + RIGHT('00' + CAST(@leaderIdx AS VARCHAR(2)), 2) + N'@fpt.edu.vn'
    );
    DECLARE @member2Id UNIQUEIDENTIFIER = (
        SELECT id FROM users WHERE email = N'assign.student' + RIGHT('00' + CAST(@m2Idx AS VARCHAR(2)), 2) + N'@fpt.edu.vn'
    );
    DECLARE @member3Id UNIQUEIDENTIFIER = (
        SELECT id FROM users WHERE email = N'assign.student' + RIGHT('00' + CAST(@m3Idx AS VARCHAR(2)), 2) + N'@fpt.edu.vn'
    );
    DECLARE @teamName NVARCHAR(255) = N'QA Team ' + RIGHT('00' + CAST(@i AS VARCHAR(2)), 2);

    INSERT INTO teams (
        id, created_at, created_by, event_id, leader_id, name, status,
        track_id, track_assigned_at, track_assignment_method, track_assigned_by,
        group_id, is_recruiting, recruitment_note, disqualified, version
    ) VALUES (
        @teamId, @now, @ownerEmail, @eventId, @leaderId, @teamName, N'CONFIRMED',
        NULL, NULL, NULL, NULL,
        NULL, 0, N'Ready for track assignment QA.', 0, 0
    );

    INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
        (NEWID(), @now, @ownerEmail, @now, N'LEADER', @leaderId, @teamId, @eventId),
        (NEWID(), @now, @ownerEmail, @now, N'MEMBER', @member2Id, @teamId, @eventId),
        (NEWID(), @now, @ownerEmail, @now, N'MEMBER', @member3Id, @teamId, @eventId);

    SET @i = @i + 1;
END;

-- Enroll all 60 students (APPROVED)
INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, @ownerEmail, @now, @eventId, N'APPROVED', u.id, 0, 0
FROM users u
WHERE u.email LIKE N'assign.student%@fpt.edu.vn';

COMMIT TRANSACTION;

PRINT '=== Seed OK: SEAL Assignment QA - Closed Reg ===';
PRINT 'Event id: A1000000-AAAA-4AAA-8AAA-000000000001';
PRINT 'Status: CLOSED_REGISTRATION | Tracks: 2 (Alpha/Beta) | Teams: 20 (NO track, NO mentor)';
PRINT 'Event staff judges: lecturer5 (+ score.judge1 if present)';
PRINT 'Event staff mentors: lecturer1..4';
PRINT 'Track mentor pool: lecturer1+2 -> Alpha, lecturer3+4 -> Beta (not drawn to teams yet)';
PRINT 'Student login: assign.student01@fpt.edu.vn ... / Demo@123456';
PRINT 'Test: Team assignments (random/confirm) -> then Mentor draw';
