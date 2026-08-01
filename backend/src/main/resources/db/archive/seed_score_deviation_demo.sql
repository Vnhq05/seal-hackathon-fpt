-- Score deviation demo (full):
-- Event thang 10; 2 teams, mỗi team có 1 leader + 1 member
-- Cùng 5 judges chấm cả hai team:
--   Team Deviation Alpha: 10/9/8/2/3 (deviation 80%, review OPEN)
--   Team Consensus Beta:  8/8/7/8/9 (deviation 20%, không có review)
--   (COMPLETED — không LOCKED/published — để Open scores xem được form điểm; không sửa FE/BE)
-- Rankings: Beta 8.00 (#1), Alpha ~6.67 (#2)
-- Không insert published_results (tránh Scoring unavailable trên Open scores)
-- Không gửi RESULTS_PUBLISHED cho thí sinh khi event còn SCORING
-- Staff-only deviation alert: coordinator + judges (password 123456)
-- Run:
--   sqlcmd -S localhost,1433 -U sa -P 12345 -d SEAL -I -i seed_score_deviation_demo.sql

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @hash NVARCHAR(255) = N'$2a$10$lF4mcUasaF9.x37HX.qwJeimAn2qUSZuTp47QbRL1ba9cRqaPMvgS'; -- 123456
DECLARE @now DATETIME2 = SYSDATETIME();
DECLARE @tpl UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM scoring_templates ORDER BY created_at);
IF @tpl IS NULL
BEGIN
  RAISERROR('No scoring_templates. Start backend profile=dev first.', 16, 1);
  ROLLBACK TRANSACTION;
  RETURN;
END

-- Self-contained staff bootstrap for a freshly migrated database.
IF EXISTS (SELECT 1 FROM users WHERE email = N'admin@seal.demo')
  UPDATE users SET password_hash = @hash, full_name = N'Demo System Admin',
    user_type = N'SYSTEM_ADMIN', status = N'ACTIVE', failed_login_attempts = 0,
    locked_until = NULL, temporary_account = 0, updated_at = @now
  WHERE email = N'admin@seal.demo';
ELSE
  INSERT INTO users (
    id, created_at, created_by, updated_at, updated_by, email, failed_login_attempts,
    full_name, locked_until, password_hash, phone, status, student_id, university_name,
    user_type, semester, temporary_account, student_standing
  ) VALUES (
    NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', N'admin@seal.demo', 0,
    N'Demo System Admin', NULL, @hash, NULL, N'ACTIVE', NULL, NULL,
    N'SYSTEM_ADMIN', NULL, 0, N'ENROLLED'
  );

IF EXISTS (SELECT 1 FROM users WHERE email = N'coordinator@seal.demo')
  UPDATE users SET password_hash = @hash, full_name = N'Demo Event Coordinator',
    user_type = N'EVENT_COORDINATOR', status = N'ACTIVE', failed_login_attempts = 0,
    locked_until = NULL, temporary_account = 0, updated_at = @now
  WHERE email = N'coordinator@seal.demo';
ELSE
  INSERT INTO users (
    id, created_at, created_by, updated_at, updated_by, email, failed_login_attempts,
    full_name, locked_until, password_hash, phone, status, student_id, university_name,
    user_type, semester, temporary_account, student_standing
  ) VALUES (
    NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', N'coordinator@seal.demo', 0,
    N'Demo Event Coordinator', NULL, @hash, NULL, N'ACTIVE', NULL, NULL,
    N'EVENT_COORDINATOR', NULL, 0, N'ENROLLED'
  );

DECLARE @coordId UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'coordinator@seal.demo');

-- Fixed IDs
DECLARE @j10   UNIQUEIDENTIFIER = 'A5000001-0000-4000-8000-000000000003';
DECLARE @j9    UNIQUEIDENTIFIER = 'A5000001-0000-4000-8000-000000000004';
DECLARE @j8    UNIQUEIDENTIFIER = 'A5000001-0000-4000-8000-000000000005';
DECLARE @j2    UNIQUEIDENTIFIER = 'A5000001-0000-4000-8000-000000000008';
DECLARE @j3    UNIQUEIDENTIFIER = 'A5000001-0000-4000-8000-000000000009';
DECLARE @lead  UNIQUEIDENTIFIER = 'A5000001-0000-4000-8000-000000000006';
DECLARE @mem   UNIQUEIDENTIFIER = 'A5000001-0000-4000-8000-000000000007';
DECLARE @leadOk UNIQUEIDENTIFIER = 'A5000001-0000-4000-8000-00000000000B';
DECLARE @memOk  UNIQUEIDENTIFIER = 'A5000001-0000-4000-8000-00000000000C';
DECLARE @evtId UNIQUEIDENTIFIER = 'B5000001-0000-4000-8000-000000000001';
DECLARE @roundId UNIQUEIDENTIFIER = 'C5000001-0000-4000-8000-000000000001';
DECLARE @teamId UNIQUEIDENTIFIER = 'D5000001-0000-4000-8000-000000000001';
DECLARE @teamOk UNIQUEIDENTIFIER = 'D5000001-0000-4000-8000-000000000002';
DECLARE @subId UNIQUEIDENTIFIER = 'E5000001-0000-4000-8000-000000000001';
DECLARE @subOk UNIQUEIDENTIFIER = 'E5000001-0000-4000-8000-000000000002';
DECLARE @verId UNIQUEIDENTIFIER = 'E5000001-0000-4000-8000-000000000011';
DECLARE @verOk UNIQUEIDENTIFIER = 'E5000001-0000-4000-8000-000000000012';
DECLARE @s10 UNIQUEIDENTIFIER = 'F5000001-0000-4000-8000-000000000001';
DECLARE @s9  UNIQUEIDENTIFIER = 'F5000001-0000-4000-8000-000000000002';
DECLARE @s8  UNIQUEIDENTIFIER = 'F5000001-0000-4000-8000-000000000003';
DECLARE @s2  UNIQUEIDENTIFIER = 'F5000001-0000-4000-8000-000000000004';
DECLARE @s3  UNIQUEIDENTIFIER = 'F5000001-0000-4000-8000-000000000005';
DECLARE @okS1 UNIQUEIDENTIFIER = 'F5000001-0000-4000-8000-000000000011';
DECLARE @okS2 UNIQUEIDENTIFIER = 'F5000001-0000-4000-8000-000000000012';
DECLARE @okS3 UNIQUEIDENTIFIER = 'F5000001-0000-4000-8000-000000000013';
DECLARE @okS4 UNIQUEIDENTIFIER = 'F5000001-0000-4000-8000-000000000014';
DECLARE @okS5 UNIQUEIDENTIFIER = 'F5000001-0000-4000-8000-000000000015';
DECLARE @reviewId UNIQUEIDENTIFIER = 'F5000001-0000-4000-8000-0000000000AA';
DECLARE @pubId UNIQUEIDENTIFIER = 'F5000001-0000-4000-8000-0000000000BB';
DECLARE @notifId UNIQUEIDENTIFIER = 'F5000001-0000-4000-8000-0000000000CC'; -- student results
DECLARE @notifStaff UNIQUEIDENTIFIER = 'F5000001-0000-4000-8000-0000000000CD'; -- staff deviation alert
DECLARE @notifOk UNIQUEIDENTIFIER = 'F5000001-0000-4000-8000-0000000000CE';
DECLARE @c1 UNIQUEIDENTIFIER = 'C5000001-0000-4000-8000-000000000101';
DECLARE @c2 UNIQUEIDENTIFIER = 'C5000001-0000-4000-8000-000000000102';
DECLARE @c3 UNIQUEIDENTIFIER = 'C5000001-0000-4000-8000-000000000103';
DECLARE @c4 UNIQUEIDENTIFIER = 'C5000001-0000-4000-8000-000000000104';

-- Wipe this event graph
DECLARE @subs TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @subs SELECT id FROM submissions WHERE team_id IN (SELECT id FROM teams WHERE event_id = @evtId)
UNION SELECT @subId
UNION SELECT @subOk;

-- Notifications tied to this round / review / fixed id
DELETE nr FROM notification_recipients nr
INNER JOIN notifications n ON n.id = nr.notification_id
WHERE n.id IN (@notifId, @notifStaff, @notifOk) OR n.reference_id IN (@roundId, @reviewId, @teamId, @teamOk, @evtId);
DELETE FROM notifications WHERE id IN (@notifId, @notifStaff, @notifOk) OR reference_id IN (@roundId, @reviewId, @teamId, @teamOk, @evtId);

IF OBJECT_ID(N'published_results', N'U') IS NOT NULL
  DELETE FROM published_results WHERE round_id = @roundId OR id = @pubId;
IF OBJECT_ID(N'score_review_requests', N'U') IS NOT NULL
  DELETE FROM score_review_requests WHERE event_id = @evtId OR id = @reviewId;
IF OBJECT_ID(N'rankings', N'U') IS NOT NULL
  DELETE FROM rankings WHERE round_id IN (SELECT id FROM rounds WHERE event_id = @evtId);
IF OBJECT_ID(N'judge_comments', N'U') IS NOT NULL
  DELETE jc FROM judge_comments jc
  INNER JOIN judge_scores js ON js.id = jc.judge_score_id
  WHERE js.submission_id IN (SELECT id FROM @subs)
     OR js.id IN (@s10, @s9, @s8, @s2, @s3, @okS1, @okS2, @okS3, @okS4, @okS5);
IF OBJECT_ID(N'judge_score_details', N'U') IS NOT NULL
  DELETE jsd FROM judge_score_details jsd
  INNER JOIN judge_scores js ON js.id = jsd.judge_score_id
  WHERE js.submission_id IN (SELECT id FROM @subs)
     OR js.id IN (@s10, @s9, @s8, @s2, @s3, @okS1, @okS2, @okS3, @okS4, @okS5);
DELETE FROM judge_scores WHERE submission_id IN (SELECT id FROM @subs)
  OR id IN (@s10, @s9, @s8, @s2, @s3, @okS1, @okS2, @okS3, @okS4, @okS5);
IF OBJECT_ID(N'submission_attachments', N'U') IS NOT NULL
  DELETE sa FROM submission_attachments sa
  INNER JOIN submission_versions sv ON sv.id = sa.submission_version_id
  WHERE sv.submission_id IN (SELECT id FROM @subs);
DELETE FROM submission_versions WHERE submission_id IN (SELECT id FROM @subs);
DELETE FROM submissions WHERE id IN (SELECT id FROM @subs);
DELETE FROM judge_assignments WHERE round_id IN (SELECT id FROM rounds WHERE event_id = @evtId);
IF OBJECT_ID(N'event_judge_assignments', N'U') IS NOT NULL
  DELETE FROM event_judge_assignments WHERE event_id = @evtId;
DELETE FROM team_members WHERE event_id = @evtId;
DELETE FROM event_enrollments WHERE event_id = @evtId;
DELETE FROM teams WHERE event_id = @evtId;
DELETE FROM criteria WHERE round_id IN (SELECT id FROM rounds WHERE event_id = @evtId);
DELETE FROM rounds WHERE event_id = @evtId;
DELETE FROM tracks WHERE event_id = @evtId;
DELETE FROM hackathon_events WHERE id = @evtId;

-- Reclaim fixed IDs from legacy judge.high / judge.low emails
UPDATE users SET email = N'judge10@deviation.demo' WHERE id = @j10;
UPDATE users SET email = N'judge9@deviation.demo'  WHERE id = @j9;

-- Upsert 5 judges + leader/member for both teams.
;MERGE users AS t
USING (VALUES
 (@j10,   N'judge10@deviation.demo', N'Judge Score 10', N'LECTURER', NULL, NULL),
 (@j9,    N'judge9@deviation.demo',  N'Judge Score 9',  N'LECTURER', NULL, NULL),
 (@j8,    N'judge8@deviation.demo',  N'Judge Score 8',  N'LECTURER', NULL, NULL),
 (@j2,    N'judge2@deviation.demo',  N'Judge Score 2',  N'LECTURER', NULL, NULL),
 (@j3,    N'judge3@deviation.demo',  N'Judge Score 3',  N'LECTURER', NULL, NULL),
 (@lead,  N'leader.dev@deviation.demo', N'Leader Deviation', N'FPT_STUDENT', N'SE980001', 5),
 (@mem,   N'member.dev@deviation.demo', N'Member Deviation', N'FPT_STUDENT', N'SE980002', 5),
 (@leadOk, N'leader.ok@deviation.demo', N'Leader Consensus', N'FPT_STUDENT', N'SE980003', 5),
 (@memOk,  N'member.ok@deviation.demo', N'Member Consensus', N'FPT_STUDENT', N'SE980004', 5)
) AS s(id, email, full_name, user_type, student_id, semester)
ON t.id = s.id
WHEN MATCHED THEN UPDATE SET
  email = s.email, password_hash = @hash, full_name = s.full_name, user_type = s.user_type, status = N'ACTIVE',
  failed_login_attempts = 0, locked_until = NULL, student_id = s.student_id,
  university_name = N'FPT University',
  semester = s.semester, student_standing = N'ENROLLED', temporary_account = 0, updated_at = @now
WHEN NOT MATCHED BY TARGET AND NOT EXISTS (SELECT 1 FROM users u WHERE u.email = s.email) THEN INSERT (
  id, created_at, created_by, updated_at, updated_by,
  email, failed_login_attempts, full_name, locked_until, password_hash, phone,
  status, student_id, university_name, user_type, semester, temporary_account, student_standing
) VALUES (
  s.id, @now, N'deviation-seed', @now, N'deviation-seed',
  s.email, 0, s.full_name, NULL, @hash, NULL,
  N'ACTIVE', s.student_id, N'FPT University', s.user_type, s.semester, 0, N'ENROLLED'
);

-- If email already exists under another id, reuse that row
UPDATE users SET password_hash = @hash, status = N'ACTIVE', failed_login_attempts = 0, locked_until = NULL, updated_at = @now
WHERE email IN (
  N'judge10@deviation.demo', N'judge9@deviation.demo', N'judge8@deviation.demo',
  N'judge2@deviation.demo', N'judge3@deviation.demo',
  N'leader.dev@deviation.demo', N'member.dev@deviation.demo',
  N'leader.ok@deviation.demo', N'member.ok@deviation.demo'
);

SET @j10   = (SELECT id FROM users WHERE email = N'judge10@deviation.demo');
SET @j9    = (SELECT id FROM users WHERE email = N'judge9@deviation.demo');
SET @j8    = (SELECT id FROM users WHERE email = N'judge8@deviation.demo');
SET @j2    = (SELECT id FROM users WHERE email = N'judge2@deviation.demo');
SET @j3    = (SELECT id FROM users WHERE email = N'judge3@deviation.demo');
SET @lead  = (SELECT id FROM users WHERE email = N'leader.dev@deviation.demo');
SET @mem   = (SELECT id FROM users WHERE email = N'member.dev@deviation.demo');
SET @leadOk = (SELECT id FROM users WHERE email = N'leader.ok@deviation.demo');
SET @memOk  = (SELECT id FROM users WHERE email = N'member.ok@deviation.demo');

IF @j10 IS NULL OR @j9 IS NULL OR @j8 IS NULL OR @j2 IS NULL OR @j3 IS NULL
   OR @lead IS NULL OR @mem IS NULL OR @leadOk IS NULL OR @memOk IS NULL
BEGIN
  RAISERROR('Failed to resolve judge/student users after upsert.', 16, 1);
  ROLLBACK TRANSACTION;
  RETURN;
END

INSERT INTO hackathon_events (
  id, created_at, created_by, updated_at, updated_by,
  name, season, year, start_date, end_date, registration_deadline, status,
  description, competition_format, leaderboard_public, scoring_template_id, owner_user_id,
  min_team, max_team, score_scale_max
) VALUES (
  @evtId, @now, N'deviation-seed', @now, N'deviation-seed',
  N'Demo Score Deviation Event', N'SPRING', 2026,
  CAST(DATEADD(DAY, -5, @now) AS DATE),
  CAST(DATEADD(DAY, 20, @now) AS DATE),
  CAST(DATEADD(DAY, -6, @now) AS DATE),
  N'SCORING',
  N'5 judges score two teams: one deviation case and one normal consensus case',
  N'GENERIC', 0, @tpl, @coordId,
  2, 5, 10
);

INSERT INTO rounds (
  id, created_at, created_by, updated_at, updated_by,
  advancement_cutoff, end_date, name, round_number, scoring_deadline, start_date, submission_deadline,
  event_id, round_weight, round_type, slide_deadline, advancement_rule, min_judges_per_round
) VALUES (
  @roundId, @now, N'deviation-seed', @now, N'deviation-seed',
  3, DATEADD(DAY, 10, @now), N'Scoring Round', 1, DATEADD(DAY, 8, @now), DATEADD(DAY, -3, @now), DATEADD(DAY, -2, @now),
  @evtId, 100, N'PRELIMINARY', NULL, N'GLOBAL_TOP_N', 5
);

INSERT INTO criteria (id, created_at, created_by, updated_at, updated_by, description, name, sort_order, weight, round_id, min_score, max_score) VALUES
 (@c1, @now, N'deviation-seed', @now, N'deviation-seed', N'Idea', N'Idea', 0, 25, @roundId, 0, 10),
 (@c2, @now, N'deviation-seed', @now, N'deviation-seed', N'Tech', N'Technical', 1, 25, @roundId, 0, 10),
 (@c3, @now, N'deviation-seed', @now, N'deviation-seed', N'UX', N'UX', 2, 25, @roundId, 0, 10),
 (@c4, @now, N'deviation-seed', @now, N'deviation-seed', N'Pitch', N'Pitch', 3, 25, @roundId, 0, 10);

INSERT INTO event_enrollments (id, created_at, created_by, updated_at, updated_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public) VALUES
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @now, @evtId, N'APPROVED', @lead, 0, 1),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @now, @evtId, N'APPROVED', @mem, 0, 1),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @now, @evtId, N'APPROVED', @leadOk, 0, 1),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @now, @evtId, N'APPROVED', @memOk, 0, 1);

INSERT INTO teams (id, created_at, created_by, updated_at, updated_by, event_id, name, leader_id, status, is_recruiting, version)
VALUES
 (@teamId, @now, N'deviation-seed', @now, N'deviation-seed', @evtId, N'Team Deviation Alpha', @lead, N'CONFIRMED', 0, 0),
 (@teamOk, @now, N'deviation-seed', @now, N'deviation-seed', @evtId, N'Team Consensus Beta', @leadOk, N'CONFIRMED', 0, 0);

INSERT INTO team_members (id, created_at, created_by, updated_at, updated_by, joined_at, role, user_id, team_id, event_id) VALUES
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @now, N'LEADER', @lead, @teamId, @evtId),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @now, N'MEMBER', @mem, @teamId, @evtId),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @now, N'LEADER', @leadOk, @teamOk, @evtId),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @now, N'MEMBER', @memOk, @teamOk, @evtId);

IF OBJECT_ID(N'event_judge_assignments', N'U') IS NOT NULL
INSERT INTO event_judge_assignments (id, created_at, created_by, updated_at, updated_by, assigned_at, judge_user_id, event_id) VALUES
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @now, @j10, @evtId),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @now, @j9, @evtId),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @now, @j8, @evtId),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @now, @j2, @evtId),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @now, @j3, @evtId);

INSERT INTO judge_assignments (id, created_at, created_by, updated_at, updated_by, assigned_at, judge_user_id, round_id, scope, active) VALUES
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @now, @j10, @roundId, N'ROUND', 1),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @now, @j9,  @roundId, N'ROUND', 1),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @now, @j8,  @roundId, N'ROUND', 1),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @now, @j2,  @roundId, N'ROUND', 1),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @now, @j3,  @roundId, N'ROUND', 1);

INSERT INTO submissions (id, created_at, created_by, updated_at, updated_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES
 (@subId, @now, N'deviation-seed', @now, N'deviation-seed', @verId, @roundId, N'SUBMITTED', @lead, @teamId, 0),
 (@subOk, @now, N'deviation-seed', @now, N'deviation-seed', @verOk, @roundId, N'SUBMITTED', @leadOk, @teamOk, 0);

IF COL_LENGTH('dbo.submission_versions', 'other_url') IS NOT NULL
BEGIN
  INSERT INTO submission_versions (id, created_at, created_by, updated_at, updated_by, demo_url, github_url, submitted_at, version_number, submission_id, slide_url, other_url)
  VALUES
   (@verId, @now, N'deviation-seed', @now, N'deviation-seed', NULL, N'https://github.com/seal-deviation/alpha', @now, 1, @subId,
    N'https://docs.google.com/presentation/d/deviation-alpha', N'https://example.com/alpha'),
   (@verOk, @now, N'deviation-seed', @now, N'deviation-seed', NULL, N'https://github.com/seal-deviation/beta', @now, 1, @subOk,
    N'https://docs.google.com/presentation/d/consensus-beta', N'https://example.com/beta');
END
ELSE
BEGIN
  INSERT INTO submission_versions (id, created_at, created_by, updated_at, updated_by, demo_url, github_url, submitted_at, version_number, submission_id, slide_url)
  VALUES
   (@verId, @now, N'deviation-seed', @now, N'deviation-seed', N'https://example.com/alpha', N'https://github.com/seal-deviation/alpha', @now, 1, @subId,
    N'https://docs.google.com/presentation/d/deviation-alpha'),
   (@verOk, @now, N'deviation-seed', @now, N'deviation-seed', N'https://example.com/beta', N'https://github.com/seal-deviation/beta', @now, 1, @subOk,
    N'https://docs.google.com/presentation/d/consensus-beta');
END

-- COMPLETED (not LOCKED): Open scores can load the form; Score Review OPEN vẫn demo lệch điểm
-- Judge 10
INSERT INTO judge_scores (id, created_at, created_by, updated_at, updated_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES (@s10, @now, N'deviation-seed', @now, N'deviation-seed', @now, @j10, @roundId, @now, N'COMPLETED', @subId, 0);
INSERT INTO judge_score_details (id, created_at, created_by, updated_at, updated_by, criteria_id, score, judge_score_id) VALUES
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @c1, 10, @s10),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @c2, 10, @s10),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @c3, 10, @s10),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @c4, 10, @s10);

INSERT INTO judge_scores (id, created_at, created_by, updated_at, updated_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES (@s9, @now, N'deviation-seed', @now, N'deviation-seed', @now, @j9, @roundId, @now, N'COMPLETED', @subId, 0);
INSERT INTO judge_score_details (id, created_at, created_by, updated_at, updated_by, criteria_id, score, judge_score_id) VALUES
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @c1, 9, @s9),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @c2, 9, @s9),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @c3, 9, @s9),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @c4, 9, @s9);

INSERT INTO judge_scores (id, created_at, created_by, updated_at, updated_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES (@s8, @now, N'deviation-seed', @now, N'deviation-seed', @now, @j8, @roundId, @now, N'COMPLETED', @subId, 0);
INSERT INTO judge_score_details (id, created_at, created_by, updated_at, updated_by, criteria_id, score, judge_score_id) VALUES
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @c1, 8, @s8),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @c2, 8, @s8),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @c3, 8, @s8),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @c4, 8, @s8);

INSERT INTO judge_scores (id, created_at, created_by, updated_at, updated_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES (@s2, @now, N'deviation-seed', @now, N'deviation-seed', @now, @j2, @roundId, @now, N'COMPLETED', @subId, 0);
INSERT INTO judge_score_details (id, created_at, created_by, updated_at, updated_by, criteria_id, score, judge_score_id) VALUES
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @c1, 2, @s2),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @c2, 2, @s2),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @c3, 2, @s2),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @c4, 2, @s2);

INSERT INTO judge_scores (id, created_at, created_by, updated_at, updated_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES (@s3, @now, N'deviation-seed', @now, N'deviation-seed', @now, @j3, @roundId, @now, N'COMPLETED', @subId, 0);
INSERT INTO judge_score_details (id, created_at, created_by, updated_at, updated_by, criteria_id, score, judge_score_id) VALUES
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @c1, 3, @s3),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @c2, 3, @s3),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @c3, 3, @s3),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @c4, 3, @s3);

-- Team Consensus Beta: five completed scores with only 20% spread (< 25% threshold).
INSERT INTO judge_scores (id, created_at, created_by, updated_at, updated_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version) VALUES
 (@okS1, @now, N'deviation-seed', @now, N'deviation-seed', @now, @j10, @roundId, @now, N'COMPLETED', @subOk, 0),
 (@okS2, @now, N'deviation-seed', @now, N'deviation-seed', @now, @j9,  @roundId, @now, N'COMPLETED', @subOk, 0),
 (@okS3, @now, N'deviation-seed', @now, N'deviation-seed', @now, @j8,  @roundId, @now, N'COMPLETED', @subOk, 0),
 (@okS4, @now, N'deviation-seed', @now, N'deviation-seed', @now, @j2,  @roundId, @now, N'COMPLETED', @subOk, 0),
 (@okS5, @now, N'deviation-seed', @now, N'deviation-seed', @now, @j3,  @roundId, @now, N'COMPLETED', @subOk, 0);

DECLARE @normalScores TABLE (score_id UNIQUEIDENTIFIER, score_value INT);
INSERT INTO @normalScores VALUES
 (@okS1, 8), (@okS2, 8), (@okS3, 7), (@okS4, 8), (@okS5, 9);

INSERT INTO judge_score_details (
  id, created_at, created_by, updated_at, updated_by, criteria_id, score, judge_score_id
)
SELECT NEWID(), @now, N'deviation-seed', @now, N'deviation-seed',
       criteria_id, ns.score_value, ns.score_id
FROM @normalScores ns
CROSS JOIN (VALUES (@c1), (@c2), (@c3), (@c4)) c(criteria_id);

-- Scale 10: percent = score/10*100 → max 100, min 20 → deviation = 80 (>= threshold 25)
DECLARE @dev DECIMAL(6,2) = 80.00;
DECLARE @minPct DECIMAL(6,2) = 20.00;
DECLARE @maxPct DECIMAL(6,2) = 100.00;
INSERT INTO score_review_requests (
  id, created_at, created_by, updated_at, updated_by,
  deviation_value, event_id, max_judge_score, min_judge_score, round_id, status, submission_id, team_id, version, adjustment_type
) VALUES (
  @reviewId, @now, N'deviation-seed', @now, N'deviation-seed',
  @dev, @evtId, @maxPct, @minPct, @roundId, N'OPEN', @subId, @teamId, 0, N'AUTO_DEVIATION'
);

-- Trimmed means (BR-46, threshold 5).
IF OBJECT_ID(N'rankings', N'U') IS NOT NULL
INSERT INTO rankings (id, created_at, created_by, updated_at, updated_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version)
VALUES
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @now, 8.0000, 1, @roundId, @teamOk, 1, 0),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', @now, 6.6667, 2, @roundId, @teamId, 1, 0);

-- Không insert published_results: nếu có thì Open scores bị "Results have been published"
-- Không gửi RESULTS_PUBLISHED cho thí sinh khi event còn SCORING / chưa đóng

-- Staff-only: diem lech / tung judge — coordinator + judges (khong gui thi sinh)
INSERT INTO notifications (id, created_at, created_by, updated_at, updated_by, message, reference_id, reference_type, title, type)
VALUES (
  @notifStaff, @now, N'deviation-seed', @now, N'deviation-seed',
  N'Score deviation flagged for Team Deviation Alpha (80%). Judge scores: 10, 9, 8; flagged: 3, 2. Open Score Review to resolve.',
  @reviewId, N'ScoreReviewRequest', N'Score Deviation Alert', N'RESULTS_PUBLISHED'
);

INSERT INTO notification_recipients (id, created_at, created_by, updated_at, updated_by, channel, read_at, sent_at, user_id, notification_id) VALUES
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', N'IN_APP', NULL, @now, @coordId, @notifStaff),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', N'IN_APP', NULL, @now, @j10, @notifStaff),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', N'IN_APP', NULL, @now, @j9, @notifStaff),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', N'IN_APP', NULL, @now, @j8, @notifStaff),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', N'IN_APP', NULL, @now, @j2, @notifStaff),
 (NEWID(), @now, N'deviation-seed', @now, N'deviation-seed', N'IN_APP', NULL, @now, @j3, @notifStaff);

COMMIT TRANSACTION;

PRINT '=== DIEM LECH DEMO (password: 123456) ===';
PRINT 'Event: Demo Score Deviation Event | scale 10';
PRINT 'Team Deviation Alpha: 10,9,8,2,3 | deviation 80% | review OPEN | rank #2';
PRINT 'Team Consensus Beta: 8,8,7,8,9 | deviation 20% | no review | rank #1';
PRINT '5 judges COMPLETED both teams (Open scores xem form)';
PRINT 'No published_results; leaderboard_public=0; no student RESULTS notifications';
PRINT 'Student Results only when: no OPEN/APPROVED reviews + event COMPLETED + leaderboard_public=1';
PRINT 'Judges may re-open scored work after COMPLETED but cannot request score adjustment';
PRINT 'Staff notif: deviation alert -> coordinator + judges only';
PRINT 'admin@seal.demo -> Admin Score Review';
PRINT 'coordinator@seal.demo -> Score Review';
PRINT 'judge10@deviation.demo -> Open scores (xem diem da cham)';
