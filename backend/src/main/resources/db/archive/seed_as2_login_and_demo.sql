-- Rebuild login accounts + AS2 demo data after a fresh Flyway migrate.
-- Password for ALL accounts below: 12345678
-- Run: sqlcmd -S localhost -U sa -P <password> -d SEAL -I -i seed_as2_login_and_demo.sql

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- Use local clock: app compares LocalDateTime.now() (JVM timezone) to DB datetimes without zone conversion.
DECLARE @now DATETIME2 = SYSDATETIME();
-- BCrypt for plaintext "12345678" (same encoder as SecurityConfig)
DECLARE @pwd NVARCHAR(255) = N'$2a$10$3Ee4YwgqIw0MnDJeYtNDOOccbcr7G/t0mhmapneTSjuZTh9qa6AMq';
DECLARE @templateId UNIQUEIDENTIFIER = (
    SELECT TOP 1 id FROM scoring_templates WHERE name = N'Standard Hackathon' ORDER BY created_at
);

IF @templateId IS NULL
    SET @templateId = (SELECT TOP 1 id FROM scoring_templates ORDER BY created_at);

IF @templateId IS NULL
BEGIN
    RAISERROR('No scoring template. Start backend with profile dev first.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END

-- ============================================================
-- 1) Accounts (upsert by email)
-- ============================================================
DECLARE @Accounts TABLE (
    email NVARCHAR(255) PRIMARY KEY,
    full_name NVARCHAR(255) NOT NULL,
    user_type VARCHAR(32) NOT NULL,
    student_id NVARCHAR(50) NULL,
    semester INT NULL
);

INSERT INTO @Accounts (email, full_name, user_type, student_id, semester) VALUES
    (N'admin@seal.com', N'System Admin', N'SYSTEM_ADMIN', NULL, NULL),
    (N'coordinator@seal.com', N'Demo Coordinator', N'EVENT_COORDINATOR', NULL, NULL),
    (N'lecturer1@fpt.edu.vn', N'Lecturer One', N'LECTURER', NULL, NULL),
    (N'lecturer2@fpt.edu.vn', N'Lecturer Two', N'LECTURER', NULL, NULL),
    (N'lecturer3@fpt.edu.vn', N'Lecturer Three', N'LECTURER', NULL, NULL),
    (N'mentor.lbtest@fpt.edu.vn', N'Mentor LB Test', N'LECTURER', NULL, NULL),
    (N'student1@fpt.edu.vn', N'Student One', N'FPT_STUDENT', N'SE200001', 5),
    (N'student2@fpt.edu.vn', N'Student Two', N'FPT_STUDENT', N'SE200002', 5),
    (N'student3@fpt.edu.vn', N'Student Three', N'FPT_STUDENT', N'SE200003', 6),
    (N'student4@fpt.edu.vn', N'Student Four', N'FPT_STUDENT', N'SE200004', 6),
    (N'student5@fpt.edu.vn', N'Student Five', N'FPT_STUDENT', N'SE200005', 7),
    (N'student6@fpt.edu.vn', N'Student Six', N'FPT_STUDENT', N'SE200006', 7),
    (N'progresstest101@fpt.edu.vn', N'Progress Student 101', N'FPT_STUDENT', N'SE201101', 5),
    (N'progresstest102@fpt.edu.vn', N'Progress Student 102', N'FPT_STUDENT', N'SE201102', 5),
    (N'progresstest103@fpt.edu.vn', N'Progress Student 103', N'FPT_STUDENT', N'SE201103', 6),
    (N'progresstest104@fpt.edu.vn', N'Progress Student 104', N'FPT_STUDENT', N'SE201104', 6),
    (N'progresstest105@fpt.edu.vn', N'Progress Student 105', N'FPT_STUDENT', N'SE201105', 7);

DECLARE @email NVARCHAR(255), @fullName NVARCHAR(255), @userType VARCHAR(32), @sid NVARCHAR(50), @sem INT;
DECLARE acc_cur CURSOR LOCAL FAST_FORWARD FOR
    SELECT email, full_name, user_type, student_id, semester FROM @Accounts;
OPEN acc_cur;
FETCH NEXT FROM acc_cur INTO @email, @fullName, @userType, @sid, @sem;
WHILE @@FETCH_STATUS = 0
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE email = @email)
    BEGIN
        UPDATE users
        SET password_hash = @pwd,
            full_name = @fullName,
            user_type = @userType,
            status = N'ACTIVE',
            failed_login_attempts = 0,
            locked_until = NULL,
            student_id = @sid,
            university_name = CASE WHEN @userType LIKE N'%STUDENT%' THEN N'FPT University' ELSE university_name END,
            semester = @sem,
            student_standing = N'ENROLLED',
            temporary_account = 0,
            updated_at = @now
        WHERE email = @email;
    END
    ELSE
    BEGIN
        INSERT INTO users (
            id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
            user_type, status, failed_login_attempts, locked_until, semester, student_standing,
            temporary_account, created_at, updated_at
        ) VALUES (
            NEWID(), @email, @pwd, @fullName, NULL, NULL, @sid,
            CASE WHEN @userType LIKE N'%STUDENT%' THEN N'FPT University' ELSE N'FPT University' END,
            @userType, N'ACTIVE', 0, NULL, @sem,
            N'ENROLLED',
            0, @now, @now
        );
    END
    FETCH NEXT FROM acc_cur INTO @email, @fullName, @userType, @sid, @sem;
END
CLOSE acc_cur;
DEALLOCATE acc_cur;

DECLARE @coordId UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'coordinator@seal.com');
DECLARE @mentorId UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'mentor.lbtest@fpt.edu.vn');
DECLARE @j1 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'lecturer1@fpt.edu.vn');
DECLARE @j2 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'lecturer2@fpt.edu.vn');
DECLARE @j3 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'lecturer3@fpt.edu.vn');
DECLARE @s1 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'student1@fpt.edu.vn');
DECLARE @s2 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'student2@fpt.edu.vn');
DECLARE @s3 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'student3@fpt.edu.vn');
DECLARE @s4 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'student4@fpt.edu.vn');
DECLARE @s5 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'student5@fpt.edu.vn');
DECLARE @s6 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'student6@fpt.edu.vn');
DECLARE @p101 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'progresstest101@fpt.edu.vn');
DECLARE @p102 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'progresstest102@fpt.edu.vn');
DECLARE @p103 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'progresstest103@fpt.edu.vn');
DECLARE @p104 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'progresstest104@fpt.edu.vn');
DECLARE @p105 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'progresstest105@fpt.edu.vn');

-- ============================================================
-- 2) Wipe prior AS2 demo events (fixed ids)
-- ============================================================
DECLARE @progressEventId UNIQUEIDENTIFIER = '92FD2C6D-E6DB-4B4B-B034-AB240D5627F9';
DECLARE @lockEventId UNIQUEIDENTIFIER = '5BD90FF7-8FB9-48A9-A7FA-7A9E2C0F36AE';
DECLARE @demoEvents TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @demoEvents VALUES (@progressEventId), (@lockEventId);

DECLARE @teamIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @teamIds SELECT id FROM teams WHERE event_id IN (SELECT id FROM @demoEvents);
DECLARE @roundIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @roundIds SELECT id FROM rounds WHERE event_id IN (SELECT id FROM @demoEvents);
DECLARE @subIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @subIds SELECT s.id FROM submissions s WHERE s.team_id IN (SELECT id FROM @teamIds);

DELETE FROM notification_recipients WHERE notification_id IN (
    SELECT id FROM notifications WHERE type = N'TEAM_PROGRESS_ALERT'
      AND reference_id IN (SELECT id FROM @teamIds));
DELETE FROM notifications WHERE type = N'TEAM_PROGRESS_ALERT'
  AND reference_id IN (SELECT id FROM @teamIds);
IF OBJECT_ID(N'team_progress_alerts', N'U') IS NOT NULL
    DELETE FROM team_progress_alerts WHERE team_id IN (SELECT id FROM @teamIds);
DELETE jc FROM judge_comments jc
INNER JOIN judge_scores js ON js.id = jc.judge_score_id
WHERE js.submission_id IN (SELECT id FROM @subIds);
DELETE jsd FROM judge_score_details jsd
INNER JOIN judge_scores js ON js.id = jsd.judge_score_id
WHERE js.submission_id IN (SELECT id FROM @subIds);
DELETE FROM judge_scores WHERE submission_id IN (SELECT id FROM @subIds);
DELETE sa FROM submission_attachments sa
INNER JOIN submission_versions sv ON sv.id = sa.submission_version_id
WHERE sv.submission_id IN (SELECT id FROM @subIds);
DELETE FROM submission_versions WHERE submission_id IN (SELECT id FROM @subIds);
DELETE FROM submissions WHERE id IN (SELECT id FROM @subIds);
DELETE FROM mentor_teams WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM team_members WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM teams WHERE id IN (SELECT id FROM @teamIds);
DELETE FROM event_enrollments WHERE event_id IN (SELECT id FROM @demoEvents);
DELETE FROM rankings WHERE round_id IN (SELECT id FROM @roundIds);
DELETE FROM published_results WHERE round_id IN (SELECT id FROM @roundIds);
IF OBJECT_ID(N'advancements', N'U') IS NOT NULL
    DELETE FROM advancements WHERE round_id IN (SELECT id FROM @roundIds);
DELETE FROM judge_assignments WHERE round_id IN (SELECT id FROM @roundIds);
DELETE FROM criteria WHERE round_id IN (SELECT id FROM @roundIds);
DELETE FROM rounds WHERE id IN (SELECT id FROM @roundIds);
DELETE FROM event_judge_assignments WHERE event_id IN (SELECT id FROM @demoEvents);
DELETE FROM event_mentor_assignments WHERE event_id IN (SELECT id FROM @demoEvents);
DELETE FROM mentor_assignments WHERE event_id IN (SELECT id FROM @demoEvents);
DELETE FROM tracks WHERE event_id IN (SELECT id FROM @demoEvents);
DELETE FROM hackathon_events WHERE id IN (SELECT id FROM @demoEvents);

-- ============================================================
-- 3) Progress event
-- ============================================================
DECLARE @progressRoundId UNIQUEIDENTIFIER = '0F96E4B6-8991-449F-B4F1-39B6FBFC327C';
DECLARE @progressTrackId UNIQUEIDENTIFIER = '580A20EC-FACD-4818-951D-4F8B0C09396D';
DECLARE @teamNoSubmit UNIQUEIDENTIFIER = 'FC952D2C-467F-418E-A76A-428619010AC2';
DECLARE @teamStalled UNIQUEIDENTIFIER = 'A1000001-EEEE-4EEE-8EEE-000000000001';
DECLARE @teamLastMin UNIQUEIDENTIFIER = 'A1000001-EEEE-4EEE-8EEE-000000000002';
DECLARE @teamHealthy UNIQUEIDENTIFIER = 'A1000001-EEEE-4EEE-8EEE-000000000003';

INSERT INTO hackathon_events (
    id, name, season, year, start_date, end_date,
    registration_open_date, registration_deadline,
    description, location, format, competition_format,
    min_team, max_team, semester_min, semester_max,
    scoring_template_id, status, leaderboard_public,
    owner_user_id, created_by, created_at, updated_at
) VALUES (
    @progressEventId,
    N'DEV Competition Progress Test',
    N'Summer', 2026,
    CAST(DATEADD(DAY, -1, @now) AS DATE), CAST(DATEADD(DAY, 3, @now) AS DATE),
    CAST(DATEADD(DAY, -20, @now) AS DATE), CAST(DATEADD(DAY, -1, @now) AS DATE),
    N'AS2 demo: team progress / at-risk alerts',
    N'FPT University HCM', N'ONLINE', N'GENERIC',
    1, 5, 1, 9,
    @templateId, N'ACTIVE', 1,
    @coordId, N'coordinator@seal.com', @now, @now
);

INSERT INTO tracks (id, event_id, name, description, max_teams, status, created_at, updated_at) VALUES
    (@progressTrackId, @progressEventId, N'Software Track', N'Progress demo track', 8, N'OPEN', @now, @now);

INSERT INTO rounds (
    id, event_id, round_number, name, round_type,
    start_date, end_date, slide_deadline, submission_deadline, scoring_deadline,
    advancement_cutoff, advancement_rule, round_weight, created_at, updated_at
) VALUES (
    @progressRoundId, @progressEventId, 1, N'Round One', N'PRELIMINARY',
    DATEADD(DAY, -1, @now), DATEADD(DAY, 2, @now), DATEADD(HOUR, -5, @now),
    -- +3h keeps us inside alert-lead-time (6h) and leaves room for LAST_MINUTE / STALLED rules
    DATEADD(HOUR, 3, @now), DATEADD(DAY, 2, @now),
    10, N'GLOBAL_TOP_N', 100, @now, @now
);

INSERT INTO event_enrollments (id, created_at, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, @now, @progressEventId, N'APPROVED', u.id, 0, 0
FROM users u WHERE u.email IN (
    N'progresstest101@fpt.edu.vn', N'progresstest102@fpt.edu.vn', N'progresstest103@fpt.edu.vn',
    N'progresstest104@fpt.edu.vn', N'progresstest105@fpt.edu.vn'
);

INSERT INTO teams (id, created_at, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, is_recruiting, recruitment_note, version)
VALUES
    (@teamNoSubmit, @now, @progressEventId, @p101, N'Team No Submit', N'CONFIRMED', @progressTrackId, @now, N'MANUAL', 0, N'NOT_STARTED', 0),
    (@teamStalled, @now, @progressEventId, @p102, N'Team Stalled Build', N'CONFIRMED', @progressTrackId, @now, N'MANUAL', 0, N'STALLED', 0),
    (@teamLastMin, @now, @progressEventId, @p103, N'Team Last Minute', N'CONFIRMED', @progressTrackId, @now, N'MANUAL', 0, N'LAST_MINUTE', 0),
    (@teamHealthy, @now, @progressEventId, @p104, N'Team Healthy Progress', N'CONFIRMED', @progressTrackId, @now, N'MANUAL', 0, N'OK', 0);

INSERT INTO team_members (id, created_at, joined_at, role, user_id, team_id, event_id) VALUES
    (NEWID(), @now, @now, N'LEADER', @p101, @teamNoSubmit, @progressEventId),
    (NEWID(), @now, @now, N'LEADER', @p102, @teamStalled, @progressEventId),
    (NEWID(), @now, @now, N'LEADER', @p103, @teamLastMin, @progressEventId),
    (NEWID(), @now, @now, N'LEADER', @p104, @teamHealthy, @progressEventId),
    (NEWID(), @now, @now, N'MEMBER', @p105, @teamHealthy, @progressEventId);

INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at)
VALUES (NEWID(), @progressEventId, @mentorId, @now, @now);
INSERT INTO mentor_assignments (id, created_at, assigned_at, mentor_user_id, event_id, track_id)
VALUES (NEWID(), @now, @now, @mentorId, @progressEventId, @progressTrackId);
INSERT INTO mentor_teams (id, created_at, assigned_at, mentor_user_id, team_id) VALUES
    (NEWID(), @now, @now, @mentorId, @teamNoSubmit),
    (NEWID(), @now, @now, @mentorId, @teamStalled),
    (NEWID(), @now, @now, @mentorId, @teamLastMin),
    (NEWID(), @now, @now, @mentorId, @teamHealthy);

DECLARE @subStalled UNIQUEIDENTIFIER = 'A2000001-EEEE-4EEE-8EEE-000000000001';
DECLARE @subLast UNIQUEIDENTIFIER = 'A2000001-EEEE-4EEE-8EEE-000000000002';
DECLARE @subOk UNIQUEIDENTIFIER = 'A2000001-EEEE-4EEE-8EEE-000000000003';
DECLARE @verStalled UNIQUEIDENTIFIER = 'A3000001-EEEE-4EEE-8EEE-000000000001';
DECLARE @verLast UNIQUEIDENTIFIER = 'A3000001-EEEE-4EEE-8EEE-000000000002';
DECLARE @verOk1 UNIQUEIDENTIFIER = 'A3000001-EEEE-4EEE-8EEE-000000000003';
DECLARE @verOk2 UNIQUEIDENTIFIER = 'A3000001-EEEE-4EEE-8EEE-000000000004';

INSERT INTO submissions (id, created_at, current_version_id, round_id, status, submitted_by, team_id, opt_lock) VALUES
    (@subStalled, @now, NULL, @progressRoundId, N'SUBMITTED', @p102, @teamStalled, 0),
    (@subLast, @now, NULL, @progressRoundId, N'SUBMITTED', @p103, @teamLastMin, 0),
    (@subOk, @now, NULL, @progressRoundId, N'SUBMITTED', @p104, @teamHealthy, 0);

INSERT INTO submission_versions (id, created_at, demo_url, github_url, slide_url, submitted_at, version_number, submission_id) VALUES
    (@verStalled, @now, N'https://www.youtube.com/watch?v=qL9bVgB0dkE', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://drive.google.com/drive/folders/1GzUYLu759LGE2J4WlB4v6Xb3XtpGLwkJ', DATEADD(HOUR, -30, @now), 1, @subStalled),
    (@verLast, @now, N'https://www.youtube.com/watch?v=qL9bVgB0dkE', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://drive.google.com/drive/folders/1GzUYLu759LGE2J4WlB4v6Xb3XtpGLwkJ', DATEADD(MINUTE, -40, @now), 1, @subLast),
    (@verOk1, @now, N'https://www.youtube.com/watch?v=qL9bVgB0dkE', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://drive.google.com/drive/folders/1GzUYLu759LGE2J4WlB4v6Xb3XtpGLwkJ', DATEADD(HOUR, -40, @now), 1, @subOk),
    (@verOk2, @now, N'https://www.youtube.com/watch?v=qL9bVgB0dkE', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://drive.google.com/drive/folders/1GzUYLu759LGE2J4WlB4v6Xb3XtpGLwkJ', DATEADD(HOUR, -2, @now), 2, @subOk);

INSERT INTO submission_attachments (id, created_at, file_name, file_size, file_url, page_count, submission_version_id) VALUES
    (NEWID(), @now, N'pitch.pdf', 102400, N'/uploads/demo/stalled.pdf', 2, @verStalled),
    (NEWID(), @now, N'pitch.pdf', 102400, N'/uploads/demo/last.pdf', 2, @verLast),
    (NEWID(), @now, N'pitch-v2.pdf', 204800, N'/uploads/demo/ok-v2.pdf', 2, @verOk2);

UPDATE submissions SET current_version_id = @verStalled WHERE id = @subStalled;
UPDATE submissions SET current_version_id = @verLast WHERE id = @subLast;
UPDATE submissions SET current_version_id = @verOk2 WHERE id = @subOk;

INSERT INTO team_progress_alerts (id, team_id, round_id, risk_level, reasons, last_alerted_at, created_at, updated_at) VALUES
    (NEWID(), @teamNoSubmit, @progressRoundId, N'CRITICAL', N'NOT_STARTED', @now, @now, @now),
    (NEWID(), @teamStalled, @progressRoundId, N'AT_RISK', N'STALLED', @now, @now, @now),
    (NEWID(), @teamLastMin, @progressRoundId, N'AT_RISK', N'SINGLE_VERSION_LAST_MINUTE', @now, @now, @now);

DECLARE @n1 UNIQUEIDENTIFIER = NEWID(), @n2 UNIQUEIDENTIFIER = NEWID(), @n3 UNIQUEIDENTIFIER = NEWID();
INSERT INTO notifications (id, created_at, message, reference_id, reference_type, title, type) VALUES
    (@n1, @now, N'Team No Submit has not started submission (NOT_STARTED).', @teamNoSubmit, N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT'),
    (@n2, @now, N'Team Stalled Build stalled (STALLED).', @teamStalled, N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT'),
    (@n3, @now, N'Team Last Minute last-minute single version.', @teamLastMin, N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT');
INSERT INTO notification_recipients (id, created_at, channel, read_at, sent_at, user_id, notification_id) VALUES
    (NEWID(), @now, N'IN_APP', NULL, @now, @p101, @n1),
    (NEWID(), @now, N'IN_APP', NULL, @now, @mentorId, @n1),
    (NEWID(), @now, N'IN_APP', NULL, @now, @coordId, @n1),
    (NEWID(), @now, N'IN_APP', NULL, @now, @p102, @n2),
    (NEWID(), @now, N'IN_APP', NULL, @now, @mentorId, @n2),
    (NEWID(), @now, N'IN_APP', NULL, @now, @coordId, @n2),
    (NEWID(), @now, N'IN_APP', NULL, @now, @p103, @n3),
    (NEWID(), @now, N'IN_APP', NULL, @now, @mentorId, @n3),
    (NEWID(), @now, N'IN_APP', NULL, @now, @coordId, @n3);

-- ============================================================
-- 4) Publish event (2 tracks, 2 rounds, locked scores, rankings, NOT published)
-- ============================================================
DECLARE @lockPrelimId UNIQUEIDENTIFIER = '78776040-3CF7-41D9-A2D4-61A8F807B9CA';
DECLARE @lockFinalId UNIQUEIDENTIFIER = '72ABD3B4-1F90-4481-965B-DECCC16E9321';
DECLARE @trackSoft UNIQUEIDENTIFIER = 'CA018D8C-9E7D-4427-B58A-B3EDCCF25C11';
DECLARE @trackAi UNIQUEIDENTIFIER = '6E80F816-B5B3-4EF3-9FC4-A5531F02DC78';
DECLARE @teamAlpha UNIQUEIDENTIFIER = '76A296ED-586E-47C4-B4DE-CB3F8A92837F';
DECLARE @teamBeta UNIQUEIDENTIFIER = 'FFC778F6-9EB0-4E61-899B-028B482CB627';

INSERT INTO hackathon_events (
    id, name, season, year, start_date, end_date,
    registration_open_date, registration_deadline,
    description, location, format, competition_format,
    min_team, max_team, semester_min, semester_max,
    scoring_template_id, status, leaderboard_public,
    owner_user_id, created_by, created_at, updated_at
) VALUES (
    @lockEventId,
    N'DEV Submission Lock Test',
    N'Summer', 2026,
    CAST(DATEADD(DAY, -10, @now) AS DATE), CAST(DATEADD(DAY, 20, @now) AS DATE),
    CAST(DATEADD(DAY, -40, @now) AS DATE), CAST(DATEADD(DAY, -15, @now) AS DATE),
    N'AS2 demo: publish results by track/round',
    N'FPT University HCM', N'ONLINE', N'GENERIC',
    1, 5, 1, 9,
    @templateId, N'SCORING', 0,
    @coordId, N'coordinator@seal.com', @now, @now
);

INSERT INTO tracks (id, event_id, name, description, max_teams, status, created_at, updated_at) VALUES
    (@trackSoft, @lockEventId, N'Software Development', N'Track A', 8, N'OPEN', @now, @now),
    (@trackAi, @lockEventId, N'AI and Data', N'Track B', 8, N'OPEN', @now, @now);

INSERT INTO rounds (
    id, event_id, round_number, name, round_type,
    start_date, end_date, slide_deadline, submission_deadline, scoring_deadline,
    advancement_cutoff, advancement_rule, round_weight, created_at, updated_at
) VALUES
    (@lockPrelimId, @lockEventId, 1, N'Round One', N'PRELIMINARY',
     DATEADD(DAY, -5, @now), DATEADD(DAY, 5, @now), NULL,
     DATEADD(DAY, 2, @now), DATEADD(DAY, 5, @now),
     1, N'PER_TRACK_TOP_N', 40, @now, @now),
    (@lockFinalId, @lockEventId, 2, N'Final Round', N'FINAL',
     DATEADD(DAY, 5, @now), DATEADD(DAY, 8, @now), NULL,
     DATEADD(DAY, 6, @now), DATEADD(DAY, 8, @now),
     6, N'NONE', 60, @now, @now);

DECLARE @c1 UNIQUEIDENTIFIER = NEWID(), @c2 UNIQUEIDENTIFIER = NEWID(), @c3 UNIQUEIDENTIFIER = NEWID(), @c4 UNIQUEIDENTIFIER = NEWID();
DECLARE @fc1 UNIQUEIDENTIFIER = NEWID(), @fc2 UNIQUEIDENTIFIER = NEWID(), @fc3 UNIQUEIDENTIFIER = NEWID(), @fc4 UNIQUEIDENTIFIER = NEWID();
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at) VALUES
    (@c1, @lockPrelimId, N'Innovation', N'Innovation', 25, 0, 1, 5, @now, @now),
    (@c2, @lockPrelimId, N'Technical', N'Technical', 30, 1, 1, 5, @now, @now),
    (@c3, @lockPrelimId, N'Business Value', N'Business Value', 25, 2, 1, 5, @now, @now),
    (@c4, @lockPrelimId, N'Presentation', N'Presentation', 20, 3, 1, 5, @now, @now),
    (@fc1, @lockFinalId, N'Innovation', N'Innovation', 25, 0, 1, 5, @now, @now),
    (@fc2, @lockFinalId, N'Technical', N'Technical', 30, 1, 1, 5, @now, @now),
    (@fc3, @lockFinalId, N'Business Value', N'Business Value', 25, 2, 1, 5, @now, @now),
    (@fc4, @lockFinalId, N'Presentation', N'Presentation', 20, 3, 1, 5, @now, @now);

INSERT INTO event_enrollments (id, created_at, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, @now, @lockEventId, N'APPROVED', u.id, 0, 0
FROM users u WHERE u.email IN (
    N'student1@fpt.edu.vn', N'student2@fpt.edu.vn', N'student3@fpt.edu.vn',
    N'student4@fpt.edu.vn', N'student5@fpt.edu.vn', N'student6@fpt.edu.vn'
);

INSERT INTO teams (id, created_at, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, is_recruiting, recruitment_note, version)
VALUES
    (@teamAlpha, @now, @lockEventId, @s1, N'Team Alpha', N'CONFIRMED', @trackSoft, @now, N'MANUAL', 0, N'Software track', 0),
    (@teamBeta, @now, @lockEventId, @s4, N'Team Beta', N'CONFIRMED', @trackAi, @now, N'MANUAL', 0, N'AI track', 0);

INSERT INTO team_members (id, created_at, joined_at, role, user_id, team_id, event_id) VALUES
    (NEWID(), @now, @now, N'LEADER', @s1, @teamAlpha, @lockEventId),
    (NEWID(), @now, @now, N'MEMBER', @s2, @teamAlpha, @lockEventId),
    (NEWID(), @now, @now, N'MEMBER', @s3, @teamAlpha, @lockEventId),
    (NEWID(), @now, @now, N'LEADER', @s4, @teamBeta, @lockEventId),
    (NEWID(), @now, @now, N'MEMBER', @s5, @teamBeta, @lockEventId),
    (NEWID(), @now, @now, N'MEMBER', @s6, @teamBeta, @lockEventId);

INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id) VALUES
    (NEWID(), @now, @now, @j1, @lockEventId),
    (NEWID(), @now, @now, @j2, @lockEventId),
    (NEWID(), @now, @now, @j3, @lockEventId);
INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active) VALUES
    (NEWID(), @now, @now, @j1, @lockPrelimId, N'ROUND', 1),
    (NEWID(), @now, @now, @j2, @lockPrelimId, N'ROUND', 1),
    (NEWID(), @now, @now, @j3, @lockPrelimId, N'ROUND', 1),
    (NEWID(), @now, @now, @j1, @lockFinalId, N'ROUND', 1),
    (NEWID(), @now, @now, @j2, @lockFinalId, N'ROUND', 1),
    (NEWID(), @now, @now, @j3, @lockFinalId, N'ROUND', 1);

DECLARE @subA1 UNIQUEIDENTIFIER = NEWID(), @subB1 UNIQUEIDENTIFIER = NEWID();
DECLARE @subA2 UNIQUEIDENTIFIER = NEWID(), @subB2 UNIQUEIDENTIFIER = NEWID();
DECLARE @verA1 UNIQUEIDENTIFIER = NEWID(), @verB1 UNIQUEIDENTIFIER = NEWID();
DECLARE @verA2 UNIQUEIDENTIFIER = NEWID(), @verB2 UNIQUEIDENTIFIER = NEWID();

INSERT INTO submissions (id, created_at, current_version_id, round_id, status, submitted_by, team_id, opt_lock) VALUES
    (@subA1, @now, NULL, @lockPrelimId, N'SCORED', @s1, @teamAlpha, 0),
    (@subB1, @now, NULL, @lockPrelimId, N'SCORED', @s4, @teamBeta, 0),
    (@subA2, @now, NULL, @lockFinalId, N'SCORED', @s1, @teamAlpha, 0),
    (@subB2, @now, NULL, @lockFinalId, N'SCORED', @s4, @teamBeta, 0);

INSERT INTO submission_versions (id, created_at, demo_url, github_url, slide_url, submitted_at, version_number, submission_id) VALUES
    (@verA1, @now, N'https://www.youtube.com/watch?v=qL9bVgB0dkE', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://drive.google.com/drive/folders/1GzUYLu759LGE2J4WlB4v6Xb3XtpGLwkJ', DATEADD(DAY, -2, @now), 1, @subA1),
    (@verB1, @now, N'https://www.youtube.com/watch?v=qL9bVgB0dkE', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://drive.google.com/drive/folders/1GzUYLu759LGE2J4WlB4v6Xb3XtpGLwkJ', DATEADD(DAY, -2, @now), 1, @subB1),
    (@verA2, @now, N'https://www.youtube.com/watch?v=qL9bVgB0dkE', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://drive.google.com/drive/folders/1GzUYLu759LGE2J4WlB4v6Xb3XtpGLwkJ', DATEADD(DAY, -1, @now), 1, @subA2),
    (@verB2, @now, N'https://www.youtube.com/watch?v=qL9bVgB0dkE', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://drive.google.com/drive/folders/1GzUYLu759LGE2J4WlB4v6Xb3XtpGLwkJ', DATEADD(DAY, -1, @now), 1, @subB2);

UPDATE submissions SET current_version_id = @verA1 WHERE id = @subA1;
UPDATE submissions SET current_version_id = @verB1 WHERE id = @subB1;
UPDATE submissions SET current_version_id = @verA2 WHERE id = @subA2;
UPDATE submissions SET current_version_id = @verB2 WHERE id = @subB2;

-- Helper: insert locked scores for one submission/round
DECLARE @jsId UNIQUEIDENTIFIER;
DECLARE @scores TABLE (judge_id UNIQUEIDENTIFIER, s1 INT, s2 INT, s3 INT, s4 INT);
-- Alpha prelim (higher)
DELETE FROM @scores;
INSERT INTO @scores VALUES (@j1, 5, 5, 4, 5), (@j2, 5, 4, 5, 4), (@j3, 4, 5, 4, 5);
DECLARE @jid UNIQUEIDENTIFIER, @sc1 INT, @sc2 INT, @sc3 INT, @sc4 INT;
DECLARE sc_cur CURSOR LOCAL FAST_FORWARD FOR SELECT judge_id, s1, s2, s3, s4 FROM @scores;
OPEN sc_cur;
FETCH NEXT FROM sc_cur INTO @jid, @sc1, @sc2, @sc3, @sc4;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @jsId = NEWID();
    INSERT INTO judge_scores (id, created_at, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
    VALUES (@jsId, @now, @now, @jid, @lockPrelimId, DATEADD(HOUR, -3, @now), N'LOCKED', @subA1, 0);
    INSERT INTO judge_score_details (id, created_at, criteria_id, score, judge_score_id) VALUES
        (NEWID(), @now, @c1, @sc1, @jsId),
        (NEWID(), @now, @c2, @sc2, @jsId),
        (NEWID(), @now, @c3, @sc3, @jsId),
        (NEWID(), @now, @c4, @sc4, @jsId);
    FETCH NEXT FROM sc_cur INTO @jid, @sc1, @sc2, @sc3, @sc4;
END
CLOSE sc_cur; DEALLOCATE sc_cur;

-- Beta prelim (lower)
DELETE FROM @scores;
INSERT INTO @scores VALUES (@j1, 4, 4, 3, 4), (@j2, 3, 4, 4, 3), (@j3, 4, 3, 4, 4);
DECLARE sc_cur2 CURSOR LOCAL FAST_FORWARD FOR SELECT judge_id, s1, s2, s3, s4 FROM @scores;
OPEN sc_cur2;
FETCH NEXT FROM sc_cur2 INTO @jid, @sc1, @sc2, @sc3, @sc4;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @jsId = NEWID();
    INSERT INTO judge_scores (id, created_at, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
    VALUES (@jsId, @now, @now, @jid, @lockPrelimId, DATEADD(HOUR, -3, @now), N'LOCKED', @subB1, 0);
    INSERT INTO judge_score_details (id, created_at, criteria_id, score, judge_score_id) VALUES
        (NEWID(), @now, @c1, @sc1, @jsId),
        (NEWID(), @now, @c2, @sc2, @jsId),
        (NEWID(), @now, @c3, @sc3, @jsId),
        (NEWID(), @now, @c4, @sc4, @jsId);
    FETCH NEXT FROM sc_cur2 INTO @jid, @sc1, @sc2, @sc3, @sc4;
END
CLOSE sc_cur2; DEALLOCATE sc_cur2;

-- Alpha final
DELETE FROM @scores;
INSERT INTO @scores VALUES (@j1, 5, 5, 5, 4), (@j2, 5, 4, 5, 5), (@j3, 4, 5, 5, 4);
DECLARE sc_cur3 CURSOR LOCAL FAST_FORWARD FOR SELECT judge_id, s1, s2, s3, s4 FROM @scores;
OPEN sc_cur3;
FETCH NEXT FROM sc_cur3 INTO @jid, @sc1, @sc2, @sc3, @sc4;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @jsId = NEWID();
    INSERT INTO judge_scores (id, created_at, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
    VALUES (@jsId, @now, @now, @jid, @lockFinalId, DATEADD(HOUR, -2, @now), N'LOCKED', @subA2, 0);
    INSERT INTO judge_score_details (id, created_at, criteria_id, score, judge_score_id) VALUES
        (NEWID(), @now, @fc1, @sc1, @jsId),
        (NEWID(), @now, @fc2, @sc2, @jsId),
        (NEWID(), @now, @fc3, @sc3, @jsId),
        (NEWID(), @now, @fc4, @sc4, @jsId);
    FETCH NEXT FROM sc_cur3 INTO @jid, @sc1, @sc2, @sc3, @sc4;
END
CLOSE sc_cur3; DEALLOCATE sc_cur3;

-- Beta final
DELETE FROM @scores;
INSERT INTO @scores VALUES (@j1, 4, 4, 4, 3), (@j2, 3, 4, 4, 4), (@j3, 4, 3, 4, 3);
DECLARE sc_cur4 CURSOR LOCAL FAST_FORWARD FOR SELECT judge_id, s1, s2, s3, s4 FROM @scores;
OPEN sc_cur4;
FETCH NEXT FROM sc_cur4 INTO @jid, @sc1, @sc2, @sc3, @sc4;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @jsId = NEWID();
    INSERT INTO judge_scores (id, created_at, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
    VALUES (@jsId, @now, @now, @jid, @lockFinalId, DATEADD(HOUR, -2, @now), N'LOCKED', @subB2, 0);
    INSERT INTO judge_score_details (id, created_at, criteria_id, score, judge_score_id) VALUES
        (NEWID(), @now, @fc1, @sc1, @jsId),
        (NEWID(), @now, @fc2, @sc2, @jsId),
        (NEWID(), @now, @fc3, @sc3, @jsId),
        (NEWID(), @now, @fc4, @sc4, @jsId);
    FETCH NEXT FROM sc_cur4 INTO @jid, @sc1, @sc2, @sc3, @sc4;
END
CLOSE sc_cur4; DEALLOCATE sc_cur4;

INSERT INTO rankings (id, created_at, calculated_at, final_score, rank, round_id, team_id, version, lock_version) VALUES
    (NEWID(), @now, @now, 4.4833, 1, @lockPrelimId, @teamAlpha, 1, 0),
    (NEWID(), @now, @now, 3.8333, 2, @lockPrelimId, @teamBeta, 1, 0),
    (NEWID(), @now, @now, 4.6667, 1, @lockFinalId, @teamAlpha, 1, 0),
    (NEWID(), @now, @now, 3.8333, 2, @lockFinalId, @teamBeta, 1, 0);

COMMIT TRANSACTION;

PRINT 'seed_as2_login_and_demo.sql complete.';
PRINT 'Password for ALL seeded accounts: 12345678';
PRINT 'Accounts: coordinator@seal.com | mentor.lbtest@fpt.edu.vn | progresstest101@fpt.edu.vn | student1@fpt.edu.vn | admin@seal.com';
PRINT 'Progress event: 92FD2C6D-E6DB-4B4B-B034-AB240D5627F9';
PRINT 'Publish event:  5BD90FF7-8FB9-48A9-A7FA-7A9E2C0F36AE';
