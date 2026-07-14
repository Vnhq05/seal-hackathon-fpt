-- Reset DEV Scoring Feature Test to unscored, and create a second SCORING event.
-- Run: sqlcmd -S localhost -U sa -P <password> -d SEAL -i reset_scoring_and_add_second_event.sql

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
BEGIN TRANSACTION;

DECLARE @now DATETIME2 = SYSUTCDATETIME();
DECLARE @scoreEventId UNIQUEIDENTIFIER = 'B321FAB6-FE2A-434C-A841-2565059F6FEE';
DECLARE @secondEventName NVARCHAR(255) = N'DEV Scoring Feature Test B';
DECLARE @pwdHash VARCHAR(255) = (
    SELECT TOP 1 password_hash FROM users WHERE email = 'scoretest101@fpt.edu.vn'
);
DECLARE @templateId UNIQUEIDENTIFIER = (
    SELECT TOP 1 scoring_template_id FROM hackathon_events WHERE id = @scoreEventId
);
IF @templateId IS NULL
    SET @templateId = (SELECT TOP 1 id FROM scoring_templates ORDER BY created_at);

DECLARE @j1 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = 'lecturer1@fpt.edu.vn');
DECLARE @j2 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = 'lecturer2@fpt.edu.vn');
DECLARE @j3 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = 'lecturer3@fpt.edu.vn');

IF @pwdHash IS NULL OR @templateId IS NULL OR @j1 IS NULL OR @j2 IS NULL OR @j3 IS NULL
BEGIN
    RAISERROR('Missing password hash, template, or demo judges.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END

---------------------------------------------------------------------------
-- 1) Reset "DEV Scoring Feature Test" scores / reviews / rankings
---------------------------------------------------------------------------
DECLARE @roundIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @roundIds (id)
SELECT id FROM rounds WHERE event_id = @scoreEventId;

DECLARE @submissionIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @submissionIds (id)
SELECT s.id
FROM submissions s
INNER JOIN @roundIds r ON s.round_id = r.id;

DECLARE @teamIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @teamIds (id)
SELECT id FROM teams WHERE event_id = @scoreEventId;

DELETE jc FROM judge_comments jc
INNER JOIN judge_scores js ON js.id = jc.judge_score_id
WHERE js.submission_id IN (SELECT id FROM @submissionIds);

DELETE jsd FROM judge_score_details jsd
INNER JOIN judge_scores js ON js.id = jsd.judge_score_id
WHERE js.submission_id IN (SELECT id FROM @submissionIds);

DELETE FROM judge_scores WHERE submission_id IN (SELECT id FROM @submissionIds);
DELETE FROM score_review_requests WHERE event_id = @scoreEventId;
DELETE FROM rankings WHERE round_id IN (SELECT id FROM @roundIds);

UPDATE submissions
SET status = 'SUBMITTED', updated_at = @now
WHERE id IN (SELECT id FROM @submissionIds);

UPDATE hackathon_events
SET status = 'SCORING', updated_at = @now
WHERE id = @scoreEventId;

PRINT 'Reset DEV Scoring Feature Test to unscored (still SCORING).';

---------------------------------------------------------------------------
-- 2) Create second SCORING event (idempotent by name)
---------------------------------------------------------------------------
IF EXISTS (SELECT 1 FROM hackathon_events WHERE name = @secondEventName)
BEGIN
    PRINT 'Second scoring event already exists — skip create.';
    COMMIT TRANSACTION;
    RETURN;
END

DECLARE @eventId UNIQUEIDENTIFIER = NEWID();
DECLARE @trackId UNIQUEIDENTIFIER = NEWID();
DECLARE @roundId UNIQUEIDENTIFIER = NEWID();
DECLARE @teamA UNIQUEIDENTIFIER = NEWID();
DECLARE @teamB UNIQUEIDENTIFIER = NEWID();
DECLARE @subA UNIQUEIDENTIFIER = NEWID();
DECLARE @subB UNIQUEIDENTIFIER = NEWID();
DECLARE @verA UNIQUEIDENTIFIER = NEWID();
DECLARE @verB UNIQUEIDENTIFIER = NEWID();

DECLARE @u1 UNIQUEIDENTIFIER = NEWID();
DECLARE @u2 UNIQUEIDENTIFIER = NEWID();
DECLARE @u3 UNIQUEIDENTIFIER = NEWID();
DECLARE @u4 UNIQUEIDENTIFIER = NEWID();
DECLARE @u5 UNIQUEIDENTIFIER = NEWID();
DECLARE @u6 UNIQUEIDENTIFIER = NEWID();

-- Students (create if missing)
DECLARE @students TABLE (
    id UNIQUEIDENTIFIER,
    email VARCHAR(255),
    full_name NVARCHAR(255),
    student_id VARCHAR(50),
    semester INT
);
INSERT INTO @students VALUES
    (@u1, 'scoretest107@fpt.edu.vn', N'Score Test 107', 'SE19100107', 5),
    (@u2, 'scoretest108@fpt.edu.vn', N'Score Test 108', 'SE19100108', 5),
    (@u3, 'scoretest109@fpt.edu.vn', N'Score Test 109', 'SE19100109', 6),
    (@u4, 'scoretest110@fpt.edu.vn', N'Score Test 110', 'SE19100110', 6),
    (@u5, 'scoretest111@fpt.edu.vn', N'Score Test 111', 'SE19100111', 5),
    (@u6, 'scoretest112@fpt.edu.vn', N'Score Test 112', 'SE19100112', 6);

UPDATE s
SET s.id = u.id, s.email = u.email
FROM @students s
INNER JOIN users u ON u.email = s.email;

INSERT INTO users (
    id, created_at, created_by, email, failed_login_attempts, full_name,
    password_hash, status, student_id, university_name, user_type,
    semester, temporary_account, student_standing
)
SELECT
    s.id, @now, 'system', s.email, 0, s.full_name,
    @pwdHash, 'ACTIVE', s.student_id, N'FPT University', 'FPT_STUDENT',
    s.semester, 0, N'ENROLLED'
FROM @students s
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email = s.email);

-- Refresh ids from DB
UPDATE s SET s.id = u.id
FROM @students s
INNER JOIN users u ON u.email = s.email;

SET @u1 = (SELECT id FROM @students WHERE email = 'scoretest107@fpt.edu.vn');
SET @u2 = (SELECT id FROM @students WHERE email = 'scoretest108@fpt.edu.vn');
SET @u3 = (SELECT id FROM @students WHERE email = 'scoretest109@fpt.edu.vn');
SET @u4 = (SELECT id FROM @students WHERE email = 'scoretest110@fpt.edu.vn');
SET @u5 = (SELECT id FROM @students WHERE email = 'scoretest111@fpt.edu.vn');
SET @u6 = (SELECT id FROM @students WHERE email = 'scoretest112@fpt.edu.vn');

INSERT INTO hackathon_events (
    id, created_at, created_by, end_date, name, registration_deadline,
    season, start_date, status, year, description, format, location,
    max_team, min_team, registration_open_date, scoring_template_id,
    semester_max, semester_min, tiebreaker_criteria
) VALUES (
    @eventId, @now, 'coordinator@seal.com',
    CAST(DATEADD(DAY, 14, @now) AS DATE),
    @secondEventName,
    CAST(DATEADD(DAY, -5, @now) AS DATE),
    'Summer', CAST(DATEADD(DAY, -3, @now) AS DATE), 'SCORING', 2026,
    N'Second scoring smoke-test event — teams submitted, judging open',
    'OFFLINE', N'FPT University Da Nang',
    5, 3, CAST(DATEADD(MONTH, -1, @now) AS DATE), @templateId,
    8, 4, NULL
);

INSERT INTO tracks (
    id, created_at, created_by, description, max_teams, name, event_id, scoring_template_id
) VALUES (
    @trackId, @now, 'system', N'Scoring smoke-test track B', 20,
    N'Software Development', @eventId, @templateId
);

INSERT INTO rounds (
    id, created_at, created_by, advancement_cutoff, end_date, name,
    round_number, scoring_deadline, start_date, submission_deadline,
    event_id, round_weight, round_type
) VALUES (
    @roundId, @now, 'system', 10,
    DATEADD(DAY, 7, @now), N'Round One', 1,
    DATEADD(DAY, 7, @now), DATEADD(DAY, -2, @now), DATEADD(HOUR, -2, @now),
    @eventId, 100, N'PRELIMINARY'
);

-- Criteria: copy from first scoring event round if present, else simple defaults
IF EXISTS (SELECT 1 FROM criteria WHERE round_id IN (SELECT id FROM rounds WHERE event_id = @scoreEventId))
BEGIN
    INSERT INTO criteria (
        id, created_at, created_by, description, name, sort_order, weight,
        round_id, min_score, max_score
    )
    SELECT NEWID(), @now, 'system', c.description, c.name, c.sort_order, c.weight,
           @roundId, c.min_score, c.max_score
    FROM criteria c
    WHERE c.round_id = (SELECT TOP 1 id FROM rounds WHERE event_id = @scoreEventId ORDER BY round_number);
END
ELSE
BEGIN
    INSERT INTO criteria (id, created_at, created_by, description, name, sort_order, weight, round_id, min_score, max_score)
    VALUES
        (NEWID(), @now, 'system', N'Criterion 1', N'1', 0, 20, @roundId, 1, 5),
        (NEWID(), @now, 'system', N'Criterion 2', N'2', 1, 80, @roundId, 1, 5);
END

-- Event + round judge assignments
INSERT INTO event_judge_assignments (id, created_at, created_by, assigned_at, judge_user_id, event_id)
VALUES
    (NEWID(), @now, 'system', @now, @j1, @eventId),
    (NEWID(), @now, 'system', @now, @j2, @eventId),
    (NEWID(), @now, 'system', @now, @j3, @eventId);

INSERT INTO judge_assignments (
    id, created_at, created_by, assigned_at, judge_user_id, round_id, scope, active
)
VALUES
    (NEWID(), @now, 'system', @now, @j1, @roundId, N'ROUND', 1),
    (NEWID(), @now, 'system', @now, @j2, @roundId, N'ROUND', 1),
    (NEWID(), @now, 'system', @now, @j3, @roundId, N'ROUND', 1);

-- Enrollments
INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, 'system', @now, @eventId, N'APPROVED', s.id, 0, 0
FROM @students s;

-- Teams
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting)
VALUES
    (@teamA, @now, 'system', @eventId, @u1, N'Team Echo', N'CONFIRMED', @trackId, 0),
    (@teamB, @now, 'system', @eventId, @u4, N'Team Foxtrot', N'CONFIRMED', @trackId, 0);

INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id)
VALUES
    (NEWID(), @now, 'system', @now, N'LEADER', @u1, @teamA),
    (NEWID(), @now, 'system', @now, N'MEMBER', @u2, @teamA),
    (NEWID(), @now, 'system', @now, N'MEMBER', @u3, @teamA),
    (NEWID(), @now, 'system', @now, N'LEADER', @u4, @teamB),
    (NEWID(), @now, 'system', @now, N'MEMBER', @u5, @teamB),
    (NEWID(), @now, 'system', @now, N'MEMBER', @u6, @teamB);

-- Submissions
INSERT INTO submissions (id, created_at, created_by, round_id, status, submitted_by, team_id)
VALUES
    (@subA, @now, 'system', @roundId, N'SUBMITTED', @u1, @teamA),
    (@subB, @now, 'system', @roundId, N'SUBMITTED', @u4, @teamB);

INSERT INTO submission_versions (
    id, created_at, created_by, demo_url, github_url, submitted_at, version_number, submission_id, slide_url
) VALUES
    (@verA, @now, 'system',
     N'https://www.youtube.com/watch?v=team-echo',
     N'https://github.com/demo/team-echo',
     DATEADD(HOUR, -4, @now), 1, @subA,
     N'https://docs.google.com/presentation/d/demo-team-echo'),
    (@verB, @now, 'system',
     N'https://www.youtube.com/watch?v=team-foxtrot',
     N'https://github.com/demo/team-foxtrot',
     DATEADD(HOUR, -4, @now), 1, @subB,
     N'https://docs.google.com/presentation/d/demo-team-foxtrot');

UPDATE submissions SET current_version_id = @verA WHERE id = @subA;
UPDATE submissions SET current_version_id = @verB WHERE id = @subB;

-- Team–judge assignments
INSERT INTO team_judge_assignments (id, created_at, created_by, assigned_at, judge_user_id, round_id, team_id)
VALUES
    (NEWID(), @now, 'system', @now, @j1, @roundId, @teamA),
    (NEWID(), @now, 'system', @now, @j2, @roundId, @teamA),
    (NEWID(), @now, 'system', @now, @j3, @roundId, @teamA),
    (NEWID(), @now, 'system', @now, @j1, @roundId, @teamB),
    (NEWID(), @now, 'system', @now, @j2, @roundId, @teamB),
    (NEWID(), @now, 'system', @now, @j3, @roundId, @teamB);

COMMIT TRANSACTION;

PRINT 'Created DEV Scoring Feature Test B (SCORING) with Team Echo / Team Foxtrot.';
GO
