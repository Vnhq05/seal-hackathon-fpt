-- Recreate: ACTIVE preliminary event + 5 teams (2x100% / 1x~33% / 2x0%)
-- Deletes ALL previous @progress.demo accounts + old progress event first.
-- New accounts use @prelim.demo — password: 123456
-- advancement_rule MUST be PER_TRACK_TOP_N (Java enum).
-- Run:
--   sqlcmd -S localhost,1433 -U sa -P 12345 -d SEAL -I -i seed_progress_submission_demo.sql

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @demoHash NVARCHAR(255) = N'$2a$10$lF4mcUasaF9.x37HX.qwJeimAn2qUSZuTp47QbRL1ba9cRqaPMvgS'; -- 123456
DECLARE @now DATETIME2 = SYSUTCDATETIME();
DECLARE @localNow DATETIME2 = SYSDATETIME();
DECLARE @tpl UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM scoring_templates ORDER BY created_at);

IF @tpl IS NULL
BEGIN
    RAISERROR('No scoring_templates. Start backend with profile=dev first.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END

DECLARE @hasOtherUrl BIT = CASE
    WHEN COL_LENGTH('dbo.submission_versions', 'other_url') IS NULL THEN 0 ELSE 1 END;

-- Fixed IDs (prelim demo namespace — distinct from old A1000001 progress IDs)
DECLARE @coordId    UNIQUEIDENTIFIER = 'A2000001-0000-4000-8000-000000000001';
DECLARE @mentorId   UNIQUEIDENTIFIER = 'A2000001-0000-4000-8000-000000000002';
DECLARE @leadFullA  UNIQUEIDENTIFIER = 'A2000001-0000-4000-8000-000000000011';
DECLARE @memFullA   UNIQUEIDENTIFIER = 'A2000001-0000-4000-8000-000000000012';
DECLARE @leadFullB  UNIQUEIDENTIFIER = 'A2000001-0000-4000-8000-000000000013';
DECLARE @memFullB   UNIQUEIDENTIFIER = 'A2000001-0000-4000-8000-000000000014';
DECLARE @leadPart   UNIQUEIDENTIFIER = 'A2000001-0000-4000-8000-000000000015';
DECLARE @memPart    UNIQUEIDENTIFIER = 'A2000001-0000-4000-8000-000000000016';
DECLARE @leadEmptyA UNIQUEIDENTIFIER = 'A2000001-0000-4000-8000-000000000017';
DECLARE @memEmptyA  UNIQUEIDENTIFIER = 'A2000001-0000-4000-8000-000000000018';
DECLARE @leadEmptyB UNIQUEIDENTIFIER = 'A2000001-0000-4000-8000-000000000019';
DECLARE @memEmptyB  UNIQUEIDENTIFIER = 'A2000001-0000-4000-8000-00000000001A';

DECLARE @evtId      UNIQUEIDENTIFIER = 'B2000001-0000-4000-8000-000000000001';
DECLARE @roundId    UNIQUEIDENTIFIER = 'C2000001-0000-4000-8000-000000000001';
DECLARE @teamFullA  UNIQUEIDENTIFIER = 'D2000001-0000-4000-8000-000000000001';
DECLARE @teamFullB  UNIQUEIDENTIFIER = 'D2000001-0000-4000-8000-000000000002';
DECLARE @teamPart   UNIQUEIDENTIFIER = 'D2000001-0000-4000-8000-000000000003';
DECLARE @teamEmptyA UNIQUEIDENTIFIER = 'D2000001-0000-4000-8000-000000000004';
DECLARE @teamEmptyB UNIQUEIDENTIFIER = 'D2000001-0000-4000-8000-000000000005';

DECLARE @subFullA   UNIQUEIDENTIFIER = 'E2000001-0000-4000-8000-000000000001';
DECLARE @subFullB   UNIQUEIDENTIFIER = 'E2000001-0000-4000-8000-000000000002';
DECLARE @subPart    UNIQUEIDENTIFIER = 'E2000001-0000-4000-8000-000000000003';
DECLARE @verFullA   UNIQUEIDENTIFIER = 'E2000001-0000-4000-8000-000000000011';
DECLARE @verFullB   UNIQUEIDENTIFIER = 'E2000001-0000-4000-8000-000000000012';
DECLARE @verPart    UNIQUEIDENTIFIER = 'E2000001-0000-4000-8000-000000000013';

-- =====================================================================
-- 1) Wipe OLD progress demo event(s) + ALL @progress.demo / @prelim.demo
-- =====================================================================
DECLARE @oldEventIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @oldEventIds(id)
SELECT id FROM hackathon_events
WHERE id IN ('B1000001-0000-4000-8000-000000000001', 'B2000001-0000-4000-8000-000000000001')
   OR owner_user_id IN (SELECT id FROM users WHERE email LIKE N'%@progress.demo' OR email LIKE N'%@prelim.demo')
   OR name LIKE N'%Progress Live%'
   OR name LIKE N'%Progress Submission%';

DECLARE @oldTeamIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @oldTeamIds SELECT id FROM teams WHERE event_id IN (SELECT id FROM @oldEventIds);

DECLARE @oldRoundIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @oldRoundIds SELECT id FROM rounds WHERE event_id IN (SELECT id FROM @oldEventIds);

DECLARE @oldSubIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @oldSubIds SELECT s.id FROM submissions s WHERE s.team_id IN (SELECT id FROM @oldTeamIds);

DELETE FROM team_progress_alerts
WHERE team_id IN (SELECT id FROM @oldTeamIds) OR round_id IN (SELECT id FROM @oldRoundIds);

IF OBJECT_ID(N'submission_attachments', N'U') IS NOT NULL
    DELETE sa FROM submission_attachments sa
    INNER JOIN submission_versions sv ON sv.id = sa.submission_version_id
    WHERE sv.submission_id IN (SELECT id FROM @oldSubIds);

DELETE FROM submission_versions WHERE submission_id IN (SELECT id FROM @oldSubIds);
DELETE FROM submissions WHERE id IN (SELECT id FROM @oldSubIds);
DELETE FROM mentor_teams WHERE team_id IN (SELECT id FROM @oldTeamIds);
DELETE FROM team_members WHERE team_id IN (SELECT id FROM @oldTeamIds) OR event_id IN (SELECT id FROM @oldEventIds);
DELETE FROM event_enrollments WHERE event_id IN (SELECT id FROM @oldEventIds);
DELETE FROM teams WHERE id IN (SELECT id FROM @oldTeamIds);
DELETE FROM rounds WHERE id IN (SELECT id FROM @oldRoundIds);
DELETE FROM hackathon_events WHERE id IN (SELECT id FROM @oldEventIds);

-- Collect all progress/prelim demo user ids to delete
DECLARE @oldUserIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @oldUserIds
SELECT id FROM users
WHERE email LIKE N'%@progress.demo'
   OR email LIKE N'%@prelim.demo'
   OR email IN (
        N'coord.progress@progress.demo',
        N'mentor.progress@progress.demo',
        N'leader.empty@progress.demo',
        N'member.empty@progress.demo',
        N'leader.partial@progress.demo',
        N'leader.full@progress.demo',
        N'member.partial@progress.demo',
        N'member.full@progress.demo'
   );

-- Clear remaining FK refs for those users (outside wiped event)
DELETE FROM mentor_teams WHERE mentor_user_id IN (SELECT id FROM @oldUserIds);
DELETE FROM team_members WHERE user_id IN (SELECT id FROM @oldUserIds);
DELETE FROM event_enrollments WHERE user_id IN (SELECT id FROM @oldUserIds);
UPDATE teams SET leader_id = NULL WHERE leader_id IN (SELECT id FROM @oldUserIds);
UPDATE hackathon_events SET owner_user_id = NULL WHERE owner_user_id IN (SELECT id FROM @oldUserIds);

IF OBJECT_ID(N'notification_recipients', N'U') IS NOT NULL
    DELETE FROM notification_recipients WHERE user_id IN (SELECT id FROM @oldUserIds);
IF OBJECT_ID(N'refresh_tokens', N'U') IS NOT NULL
    DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM @oldUserIds);
IF OBJECT_ID(N'audit_logs', N'U') IS NOT NULL
    DELETE FROM audit_logs WHERE actor_id IN (SELECT id FROM @oldUserIds);

DELETE FROM users WHERE id IN (SELECT id FROM @oldUserIds);

-- =====================================================================
-- 2) Create fresh @prelim.demo users
-- =====================================================================
INSERT INTO users (
    id, created_at, created_by, updated_at, updated_by,
    email, failed_login_attempts, full_name, locked_until, password_hash, phone,
    status, student_id, university_name, user_type, semester, temporary_account, student_standing
) VALUES
 (@coordId,    @now, N'seed', @now, N'seed', N'coord.prelim@prelim.demo',   0, N'Prelim Coordinator', NULL, @demoHash, NULL, N'ACTIVE', NULL, NULL, N'EVENT_COORDINATOR', NULL, 0, N'ENROLLED'),
 (@mentorId,   @now, N'seed', @now, N'seed', N'mentor.prelim@prelim.demo',  0, N'Prelim Mentor',      NULL, @demoHash, NULL, N'ACTIVE', NULL, NULL, N'LECTURER', NULL, 0, N'ENROLLED'),
 (@leadFullA,  @now, N'seed', @now, N'seed', N'leader.alpha@prelim.demo',   0, N'Leader Alpha',       NULL, @demoHash, NULL, N'ACTIVE', N'SE930001', N'FPT University', N'FPT_STUDENT', 5, 0, N'ENROLLED'),
 (@memFullA,   @now, N'seed', @now, N'seed', N'member.alpha@prelim.demo',   0, N'Member Alpha',       NULL, @demoHash, NULL, N'ACTIVE', N'SE930002', N'FPT University', N'FPT_STUDENT', 5, 0, N'ENROLLED'),
 (@leadFullB,  @now, N'seed', @now, N'seed', N'leader.beta@prelim.demo',    0, N'Leader Beta',        NULL, @demoHash, NULL, N'ACTIVE', N'SE930003', N'FPT University', N'FPT_STUDENT', 5, 0, N'ENROLLED'),
 (@memFullB,   @now, N'seed', @now, N'seed', N'member.beta@prelim.demo',    0, N'Member Beta',        NULL, @demoHash, NULL, N'ACTIVE', N'SE930004', N'FPT University', N'FPT_STUDENT', 5, 0, N'ENROLLED'),
 (@leadPart,   @now, N'seed', @now, N'seed', N'leader.gamma@prelim.demo',   0, N'Leader Gamma',       NULL, @demoHash, NULL, N'ACTIVE', N'SE930005', N'FPT University', N'FPT_STUDENT', 6, 0, N'ENROLLED'),
 (@memPart,    @now, N'seed', @now, N'seed', N'member.gamma@prelim.demo',   0, N'Member Gamma',       NULL, @demoHash, NULL, N'ACTIVE', N'SE930006', N'FPT University', N'FPT_STUDENT', 6, 0, N'ENROLLED'),
 (@leadEmptyA, @now, N'seed', @now, N'seed', N'leader.delta@prelim.demo',   0, N'Leader Delta',       NULL, @demoHash, NULL, N'ACTIVE', N'SE930007', N'FPT University', N'FPT_STUDENT', 6, 0, N'ENROLLED'),
 (@memEmptyA,  @now, N'seed', @now, N'seed', N'member.delta@prelim.demo',   0, N'Member Delta',       NULL, @demoHash, NULL, N'ACTIVE', N'SE930008', N'FPT University', N'FPT_STUDENT', 6, 0, N'ENROLLED'),
 (@leadEmptyB, @now, N'seed', @now, N'seed', N'leader.epsilon@prelim.demo', 0, N'Leader Epsilon',     NULL, @demoHash, NULL, N'ACTIVE', N'SE930009', N'FPT University', N'FPT_STUDENT', 7, 0, N'ENROLLED'),
 (@memEmptyB,  @now, N'seed', @now, N'seed', N'member.epsilon@prelim.demo', 0, N'Member Epsilon',     NULL, @demoHash, NULL, N'ACTIVE', N'SE930010', N'FPT University', N'FPT_STUDENT', 7, 0, N'ENROLLED');

DECLARE @roundStart DATETIME2 = DATEADD(DAY, -1, @localNow);
DECLARE @roundEnd   DATETIME2 = DATEADD(DAY, 14, @localNow);
DECLARE @subDead    DATETIME2 = DATEADD(DAY, 7, @localNow);
DECLARE @scoreDead  DATETIME2 = DATEADD(DAY, 10, @localNow);
DECLARE @slideDead  DATETIME2 = DATEADD(DAY, 5, @localNow);

INSERT INTO hackathon_events (
    id, created_at, created_by, updated_at, updated_by,
    name, season, year, start_date, end_date, registration_deadline, status,
    description, competition_format, leaderboard_public, scoring_template_id, owner_user_id
) VALUES (
    @evtId, @now, N'seed', @now, N'seed',
    N'SEAL Preliminary Round — Progress Live', N'SPRING', 2026,
    CAST(DATEADD(DAY, -3, @localNow) AS DATE),
    CAST(DATEADD(DAY, 21, @localNow) AS DATE),
    CAST(DATEADD(DAY, -1, @localNow) AS DATE),
    N'ACTIVE',
    N'Ongoing vòng loại with 5 teams: 2 complete / 1 at 1-of-3 / 2 not started',
    N'SEAL_RAG_2026', 0, @tpl, @coordId
);

INSERT INTO rounds (
    id, created_at, created_by, updated_at, updated_by,
    advancement_cutoff, end_date, name, round_number, scoring_deadline, start_date, submission_deadline,
    event_id, round_weight, round_type, slide_deadline, advancement_rule, min_judges_per_round
) VALUES (
    @roundId, @now, N'seed', @now, N'seed',
    3, @roundEnd, N'Vòng loại (Preliminary)', 1, @scoreDead, @roundStart, @subDead,
    @evtId, 100, N'PRELIMINARY', @slideDead, N'PER_TRACK_TOP_N', 2
);

INSERT INTO teams (id, created_at, created_by, updated_at, updated_by, event_id, name, leader_id, status, is_recruiting, version) VALUES
 (@teamFullA,  @now, N'seed', @now, N'seed', @evtId, N'Team Alpha Complete',     @leadFullA,  N'CONFIRMED', 0, 0),
 (@teamFullB,  @now, N'seed', @now, N'seed', @evtId, N'Team Beta Complete',      @leadFullB,  N'CONFIRMED', 0, 0),
 (@teamPart,   @now, N'seed', @now, N'seed', @evtId, N'Team Gamma One Third',    @leadPart,   N'CONFIRMED', 0, 0),
 (@teamEmptyA, @now, N'seed', @now, N'seed', @evtId, N'Team Delta Not Started',  @leadEmptyA, N'CONFIRMED', 0, 0),
 (@teamEmptyB, @now, N'seed', @now, N'seed', @evtId, N'Team Epsilon Not Started',@leadEmptyB, N'CONFIRMED', 0, 0);

INSERT INTO team_members (id, created_at, created_by, updated_at, updated_by, joined_at, role, user_id, team_id, event_id) VALUES
 (NEWID(), @now, N'seed', @now, N'seed', @now, N'LEADER', @leadFullA,  @teamFullA,  @evtId),
 (NEWID(), @now, N'seed', @now, N'seed', @now, N'MEMBER', @memFullA,   @teamFullA,  @evtId),
 (NEWID(), @now, N'seed', @now, N'seed', @now, N'LEADER', @leadFullB,  @teamFullB,  @evtId),
 (NEWID(), @now, N'seed', @now, N'seed', @now, N'MEMBER', @memFullB,   @teamFullB,  @evtId),
 (NEWID(), @now, N'seed', @now, N'seed', @now, N'LEADER', @leadPart,   @teamPart,   @evtId),
 (NEWID(), @now, N'seed', @now, N'seed', @now, N'MEMBER', @memPart,    @teamPart,   @evtId),
 (NEWID(), @now, N'seed', @now, N'seed', @now, N'LEADER', @leadEmptyA, @teamEmptyA, @evtId),
 (NEWID(), @now, N'seed', @now, N'seed', @now, N'MEMBER', @memEmptyA,  @teamEmptyA, @evtId),
 (NEWID(), @now, N'seed', @now, N'seed', @now, N'LEADER', @leadEmptyB, @teamEmptyB, @evtId),
 (NEWID(), @now, N'seed', @now, N'seed', @now, N'MEMBER', @memEmptyB,  @teamEmptyB, @evtId);

INSERT INTO event_enrollments (id, created_at, created_by, updated_at, updated_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public) VALUES
 (NEWID(), @now, N'seed', @now, N'seed', @now, @evtId, N'APPROVED', @leadFullA,  0, 1),
 (NEWID(), @now, N'seed', @now, N'seed', @now, @evtId, N'APPROVED', @memFullA,   0, 1),
 (NEWID(), @now, N'seed', @now, N'seed', @now, @evtId, N'APPROVED', @leadFullB,  0, 1),
 (NEWID(), @now, N'seed', @now, N'seed', @now, @evtId, N'APPROVED', @memFullB,   0, 1),
 (NEWID(), @now, N'seed', @now, N'seed', @now, @evtId, N'APPROVED', @leadPart,   0, 1),
 (NEWID(), @now, N'seed', @now, N'seed', @now, @evtId, N'APPROVED', @memPart,    0, 1),
 (NEWID(), @now, N'seed', @now, N'seed', @now, @evtId, N'APPROVED', @leadEmptyA, 0, 1),
 (NEWID(), @now, N'seed', @now, N'seed', @now, @evtId, N'APPROVED', @memEmptyA,  0, 1),
 (NEWID(), @now, N'seed', @now, N'seed', @now, @evtId, N'APPROVED', @leadEmptyB, 0, 1),
 (NEWID(), @now, N'seed', @now, N'seed', @now, @evtId, N'APPROVED', @memEmptyB,  0, 1);

INSERT INTO mentor_teams (id, created_at, created_by, updated_at, updated_by, assigned_at, mentor_user_id, team_id) VALUES
 (NEWID(), @now, N'seed', @now, N'seed', @now, @mentorId, @teamFullA),
 (NEWID(), @now, N'seed', @now, N'seed', @now, @mentorId, @teamFullB),
 (NEWID(), @now, N'seed', @now, N'seed', @now, @mentorId, @teamPart),
 (NEWID(), @now, N'seed', @now, N'seed', @now, @mentorId, @teamEmptyA),
 (NEWID(), @now, N'seed', @now, N'seed', @now, @mentorId, @teamEmptyB);

-- Full A 100%
INSERT INTO submissions (id, created_at, created_by, updated_at, updated_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES (@subFullA, @now, N'seed', @now, N'seed', @verFullA, @roundId, N'SUBMITTED', @leadFullA, @teamFullA, 0);
IF @hasOtherUrl = 1
    INSERT INTO submission_versions (id, created_at, created_by, updated_at, updated_by, demo_url, github_url, submitted_at, version_number, submission_id, slide_url, other_url)
    VALUES (@verFullA, @now, N'seed', @now, N'seed', NULL, N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', @now, 1, @subFullA,
            N'https://drive.google.com/drive/folders/1GzUYLu759LGE2J4WlB4v6Xb3XtpGLwkJ', N'https://www.youtube.com/watch?v=qL9bVgB0dkE');
ELSE
    INSERT INTO submission_versions (id, created_at, created_by, updated_at, updated_by, demo_url, github_url, submitted_at, version_number, submission_id, slide_url)
    VALUES (@verFullA, @now, N'seed', @now, N'seed', N'https://www.youtube.com/watch?v=qL9bVgB0dkE', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', @now, 1, @subFullA,
            N'https://drive.google.com/drive/folders/1GzUYLu759LGE2J4WlB4v6Xb3XtpGLwkJ');

-- Full B 100%
INSERT INTO submissions (id, created_at, created_by, updated_at, updated_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES (@subFullB, @now, N'seed', @now, N'seed', @verFullB, @roundId, N'SUBMITTED', @leadFullB, @teamFullB, 0);
IF @hasOtherUrl = 1
    INSERT INTO submission_versions (id, created_at, created_by, updated_at, updated_by, demo_url, github_url, submitted_at, version_number, submission_id, slide_url, other_url)
    VALUES (@verFullB, @now, N'seed', @now, N'seed', NULL, N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', @now, 1, @subFullB,
            N'https://drive.google.com/drive/folders/1GzUYLu759LGE2J4WlB4v6Xb3XtpGLwkJ', N'https://www.youtube.com/watch?v=qL9bVgB0dkE');
ELSE
    INSERT INTO submission_versions (id, created_at, created_by, updated_at, updated_by, demo_url, github_url, submitted_at, version_number, submission_id, slide_url)
    VALUES (@verFullB, @now, N'seed', @now, N'seed', N'https://www.youtube.com/watch?v=qL9bVgB0dkE', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', @now, 1, @subFullB,
            N'https://drive.google.com/drive/folders/1GzUYLu759LGE2J4WlB4v6Xb3XtpGLwkJ');

-- Partial ~33%
INSERT INTO submissions (id, created_at, created_by, updated_at, updated_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES (@subPart, @now, N'seed', @now, N'seed', @verPart, @roundId, N'SUBMITTED', @leadPart, @teamPart, 0);
IF @hasOtherUrl = 1
    INSERT INTO submission_versions (id, created_at, created_by, updated_at, updated_by, demo_url, github_url, submitted_at, version_number, submission_id, slide_url, other_url)
    VALUES (@verPart, @now, N'seed', @now, N'seed', NULL, NULL, @now, 1, @subPart,
            N'https://drive.google.com/drive/folders/1GzUYLu759LGE2J4WlB4v6Xb3XtpGLwkJ', NULL);
ELSE
    INSERT INTO submission_versions (id, created_at, created_by, updated_at, updated_by, demo_url, github_url, submitted_at, version_number, submission_id, slide_url)
    VALUES (@verPart, @now, N'seed', @now, N'seed', NULL, NULL, @now, 1, @subPart,
            N'https://drive.google.com/drive/folders/1GzUYLu759LGE2J4WlB4v6Xb3XtpGLwkJ');

COMMIT TRANSACTION;

PRINT '=== PRELIM DEMO RECREATED (password: 123456) ===';
PRINT 'DELETED all @progress.demo accounts';
PRINT 'coord.prelim@prelim.demo     EVENT_COORDINATOR';
PRINT 'mentor.prelim@prelim.demo    LECTURER mentor';
PRINT 'leader.alpha@prelim.demo     Team Alpha Complete (100%)';
PRINT 'leader.beta@prelim.demo      Team Beta Complete (100%)';
PRINT 'leader.gamma@prelim.demo     Team Gamma One Third (~33%)';
PRINT 'leader.delta@prelim.demo     Team Delta Not Started (0%)';
PRINT 'leader.epsilon@prelim.demo   Team Epsilon Not Started (0%)';
PRINT 'Event: SEAL Preliminary Round — Progress Live (ACTIVE)';
