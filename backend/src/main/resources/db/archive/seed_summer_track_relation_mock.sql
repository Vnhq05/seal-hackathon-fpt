-- Mock: Summer season event <-> tracks <-> teams (relationship demo only).
-- Shows: kì (season+year) lives on hackathon_events; tracks link via event_id.
-- Prerequisites: scoring_templates exist; admin@seal.com or coordinator@seal.com.
-- Password for seeded students: Demo@123456
-- Idempotent: wipes only this event graph.
--
-- Relationship query after seed:
--   SELECT e.season, e.year, e.name, tr.name AS track, tm.name AS team
--   FROM hackathon_events e
--   JOIN tracks tr ON tr.event_id = e.id
--   LEFT JOIN teams tm ON tm.track_id = tr.id AND tm.event_id = e.id
--   WHERE e.id = 'D1000000-DDDD-4DDD-8DDD-000000000001';
--
-- Run:
--   sqlcmd -S localhost -U sa -P <password> -d SEAL -C -I -i seed_summer_track_relation_mock.sql

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

DECLARE @eventId UNIQUEIDENTIFIER = 'D1000000-DDDD-4DDD-8DDD-000000000001';
DECLARE @trackA UNIQUEIDENTIFIER = 'D1000000-DDDD-4DDD-8DDD-0000000000A1';
DECLARE @trackB UNIQUEIDENTIFIER = 'D1000000-DDDD-4DDD-8DDD-0000000000A2';
DECLARE @prelimId UNIQUEIDENTIFIER = 'D1000000-DDDD-4DDD-8DDD-0000000000B1';
DECLARE @finalId UNIQUEIDENTIFIER = 'D1000000-DDDD-4DDD-8DDD-0000000000B2';

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

-- ── 6 students (2 teams x 3) ──
DECLARE @i INT = 1;
WHILE @i <= 6
BEGIN
    DECLARE @pad VARCHAR(12) = RIGHT(REPLICATE('0', 12) + CAST(@i AS VARCHAR(12)), 12);
    DECLARE @userId UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, 'D1100000-DDDD-4DDD-8DDD-' + @pad);
    DECLARE @email NVARCHAR(255) = N'summer.student' + RIGHT('00' + CAST(@i AS VARCHAR(2)), 2) + N'@fpt.edu.vn';
    DECLARE @fullName NVARCHAR(255) = N'Summer Student ' + RIGHT('00' + CAST(@i AS VARCHAR(2)), 2);
    DECLARE @studentId NVARCHAR(50) = N'SU' + RIGHT('0000' + CAST(@i AS VARCHAR(4)), 4);

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

-- ── Summer 2026 event (kì = season + year) ──
DECLARE @regOpen DATE = DATEADD(DAY, -20, @today);
DECLARE @regDeadline DATE = DATEADD(DAY, 10, @today);
DECLARE @compDay DATE = DATEADD(DAY, 30, @today);
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
    N'SEAL Summer Track Relation Mock',
    N'Summer', 2026,                          -- kì Summer 2026
    @compDay, @compDay,
    @regOpen, @regDeadline,
    N'Mock: tracks belong to Summer 2026 event via event_id (no season column on tracks).',
    N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
    3, 5, 4, 8,
    @templateId, N'CLOSED_REGISTRATION', 0,
    @ownerUserId, @ownerEmail, @now, @now, NULL
);

-- Tracks: linked only through event_id (inherits Summer 2026 from parent event)
INSERT INTO tracks (
    id, event_id, name, description, max_teams, status, topic,
    auto_generate_groups, created_at, updated_at, created_by
) VALUES
    (@trackA, @eventId, N'Grounded Retrieval', N'Summer track A - belongs to Summer 2026 event', NULL, N'OPEN', NULL, 1, @now, @now, @ownerEmail),
    (@trackB, @eventId, N'Agent Orchestration', N'Summer track B - belongs to Summer 2026 event', NULL, N'OPEN', NULL, 1, @now, @now, @ownerEmail);

INSERT INTO rounds (
    id, event_id, round_number, name, round_type,
    start_date, end_date, slide_deadline, submission_deadline, scoring_deadline,
    advancement_cutoff, advancement_rule, round_weight, min_judges_per_round,
    created_at, updated_at, created_by
) VALUES
    (@prelimId, @eventId, 1, N'Preliminary Round', N'PRELIMINARY',
     DATEADD(HOUR, 7, @compDayDt), DATEADD(HOUR, 15, @compDayDt),
     DATEADD(HOUR, 10, @compDayDt), DATEADD(HOUR, 14, @compDayDt), DATEADD(HOUR, 15, @compDayDt),
     2, N'PER_TRACK_TOP_N', 40, 2, @now, @now, @ownerEmail),
    (@finalId, @eventId, 2, N'Finals', N'FINAL',
     DATEADD(HOUR, 15, @compDayDt), DATEADD(HOUR, 17, @compDayDt),
     NULL, DATEADD(HOUR, 15, @compDayDt), DATEADD(HOUR, 17, @compDayDt),
     4, N'FINALIST_POOL', 60, 2, @now, @now, @ownerEmail);

INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by)
VALUES
    (NEWID(), @prelimId, N'Technical', N'Technical', 50, 0, 1, 5, @now, @now, @ownerEmail),
    (NEWID(), @prelimId, N'Innovation', N'Innovation', 50, 1, 1, 5, @now, @now, @ownerEmail);

-- Team 01 -> Track A, Team 02 -> Track B
SET @i = 1;
WHILE @i <= 2
BEGIN
    DECLARE @tPad VARCHAR(12) = RIGHT(REPLICATE('0', 12) + CAST(@i AS VARCHAR(12)), 12);
    DECLARE @teamId UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, 'D2000000-DDDD-4DDD-8DDD-' + @tPad);
    DECLARE @leaderIdx INT = (@i - 1) * 3 + 1;
    DECLARE @m2Idx INT = @leaderIdx + 1;
    DECLARE @m3Idx INT = @leaderIdx + 2;
    DECLARE @leaderId UNIQUEIDENTIFIER = (
        SELECT id FROM users WHERE email = N'summer.student' + RIGHT('00' + CAST(@leaderIdx AS VARCHAR(2)), 2) + N'@fpt.edu.vn'
    );
    DECLARE @member2Id UNIQUEIDENTIFIER = (
        SELECT id FROM users WHERE email = N'summer.student' + RIGHT('00' + CAST(@m2Idx AS VARCHAR(2)), 2) + N'@fpt.edu.vn'
    );
    DECLARE @member3Id UNIQUEIDENTIFIER = (
        SELECT id FROM users WHERE email = N'summer.student' + RIGHT('00' + CAST(@m3Idx AS VARCHAR(2)), 2) + N'@fpt.edu.vn'
    );
    DECLARE @teamName NVARCHAR(255) = N'Summer Team ' + RIGHT('00' + CAST(@i AS VARCHAR(2)), 2);
    DECLARE @trackId UNIQUEIDENTIFIER = CASE WHEN @i = 1 THEN @trackA ELSE @trackB END;

    INSERT INTO teams (
        id, created_at, created_by, event_id, leader_id, name, status,
        track_id, track_assigned_at, track_assignment_method, track_assigned_by,
        is_recruiting, recruitment_note, version
    ) VALUES (
        @teamId, @now, @ownerEmail, @eventId, @leaderId, @teamName, N'CONFIRMED',
        @trackId, @now, N'MANUAL', @ownerUserId,
        0, N'Summer relation mock team.', 0
    );

    INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
        (NEWID(), @now, @ownerEmail, @now, N'LEADER', @leaderId, @teamId, @eventId),
        (NEWID(), @now, @ownerEmail, @now, N'MEMBER', @member2Id, @teamId, @eventId),
        (NEWID(), @now, @ownerEmail, @now, N'MEMBER', @member3Id, @teamId, @eventId);

    SET @i = @i + 1;
END;

INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, @ownerEmail, @now, @eventId, N'APPROVED', u.id, 0, 0
FROM users u
WHERE u.email LIKE N'summer.student%@fpt.edu.vn';

COMMIT TRANSACTION;

PRINT '=== Seed OK: Summer track relation mock ===';
PRINT 'Event: SEAL Summer Track Relation Mock | season=Summer year=2026';
PRINT 'Event id: D1000000-DDDD-4DDD-8DDD-000000000001';
PRINT 'Tracks: Grounded Retrieval, Agent Orchestration (via event_id only)';
PRINT 'Teams: Summer Team 01 -> Track A, Summer Team 02 -> Track B';
PRINT 'Query: SELECT e.season, e.year, tr.name, tm.name FROM hackathon_events e JOIN tracks tr ON tr.event_id=e.id LEFT JOIN teams tm ON tm.track_id=tr.id WHERE e.id=''D1000000-DDDD-4DDD-8DDD-000000000001'';';
