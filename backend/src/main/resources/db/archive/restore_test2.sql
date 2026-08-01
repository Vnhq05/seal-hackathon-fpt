-- Restore Test 2 - Open Registration (5 Students) to seed baseline.
-- Password for students: Demo@123456
-- Run: sqlcmd -S localhost -U sa -P <pwd> -C -d SEAL -f 65001 -I -i restore_test2.sql

SET NOCOUNT ON; SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON; SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @pwd NVARCHAR(255) = N'$2a$10$7ZqT629/ciaVAXuzx7B0zO.wFlLuVz6NK3/tNioMOWFLb2gPkXeU2';
DECLARE @now DATETIME2 = SYSDATETIME();
DECLARE @today DATE = CAST(@now AS DATE);
DECLARE @eventId UNIQUEIDENTIFIER = 'FE020100-EEEE-4EEE-8EEE-000000000001';
DECLARE @templateId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM scoring_templates ORDER BY created_at);
DECLARE @coordId UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'test.coord@fpt.edu.vn');
DECLARE @ownerEmail NVARCHAR(255) = COALESCE(
  (SELECT email FROM users WHERE id = @coordId),
  (SELECT TOP 1 email FROM users WHERE email IN (N'admin@seal.com', N'coordinator@seal.com'))
);

IF @templateId IS NULL BEGIN RAISERROR('No scoring template.', 16, 1); ROLLBACK; RETURN; END
IF @coordId IS NULL BEGIN RAISERROR('Need test.coord@fpt.edu.vn.', 16, 1); ROLLBACK; RETURN; END

DECLARE @teamIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @teamIds SELECT id FROM teams WHERE event_id = @eventId;
DECLARE @roundIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @roundIds SELECT id FROM rounds WHERE event_id = @eventId;
DECLARE @subIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @subIds SELECT s.id FROM submissions s WHERE s.round_id IN (SELECT id FROM @roundIds);

DELETE jc FROM judge_comments jc INNER JOIN judge_scores js ON js.id = jc.judge_score_id WHERE js.submission_id IN (SELECT id FROM @subIds);
DELETE jsd FROM judge_score_details jsd INNER JOIN judge_scores js ON js.id = jsd.judge_score_id WHERE js.submission_id IN (SELECT id FROM @subIds);
DELETE FROM judge_scores WHERE submission_id IN (SELECT id FROM @subIds);
IF OBJECT_ID(N'dbo.score_review_requests', N'U') IS NOT NULL DELETE FROM score_review_requests WHERE event_id = @eventId OR submission_id IN (SELECT id FROM @subIds);
IF OBJECT_ID(N'dbo.submission_attachments', N'U') IS NOT NULL
  DELETE sa FROM submission_attachments sa INNER JOIN submission_versions sv ON sv.id = sa.submission_version_id WHERE sv.submission_id IN (SELECT id FROM @subIds);
UPDATE submissions SET current_version_id = NULL WHERE id IN (SELECT id FROM @subIds);
DELETE FROM submission_versions WHERE submission_id IN (SELECT id FROM @subIds);
DELETE FROM submissions WHERE id IN (SELECT id FROM @subIds);
IF OBJECT_ID(N'dbo.published_results', N'U') IS NOT NULL DELETE FROM published_results WHERE round_id IN (SELECT id FROM @roundIds);
IF OBJECT_ID(N'dbo.rankings', N'U') IS NOT NULL DELETE FROM rankings WHERE round_id IN (SELECT id FROM @roundIds);
IF OBJECT_ID(N'dbo.disputes', N'U') IS NOT NULL DELETE FROM disputes WHERE round_id IN (SELECT id FROM @roundIds);
IF OBJECT_ID(N'dbo.advancements', N'U') IS NOT NULL DELETE FROM advancements WHERE round_id IN (SELECT id FROM @roundIds);
IF OBJECT_ID(N'dbo.finalist_contested_slot_teams', N'U') IS NOT NULL
  DELETE FROM finalist_contested_slot_teams WHERE contested_slot_id IN (SELECT id FROM finalist_contested_slots WHERE event_id = @eventId);
IF OBJECT_ID(N'dbo.finalist_contested_slots', N'U') IS NOT NULL DELETE FROM finalist_contested_slots WHERE event_id = @eventId;
IF OBJECT_ID(N'dbo.finalist_selections', N'U') IS NOT NULL DELETE FROM finalist_selections WHERE event_id = @eventId;
IF OBJECT_ID(N'dbo.team_awards', N'U') IS NOT NULL DELETE FROM team_awards WHERE event_id = @eventId;
IF OBJECT_ID(N'dbo.participation_certificates', N'U') IS NOT NULL DELETE FROM participation_certificates WHERE event_id = @eventId;
IF OBJECT_ID(N'dbo.participant_feedbacks', N'U') IS NOT NULL DELETE FROM participant_feedbacks WHERE event_id = @eventId;
IF OBJECT_ID(N'dbo.mentor_chat_messages', N'U') IS NOT NULL DELETE FROM mentor_chat_messages WHERE team_id IN (SELECT id FROM @teamIds);
IF OBJECT_ID(N'dbo.mentor_feedbacks', N'U') IS NOT NULL DELETE FROM mentor_feedbacks WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM mentor_teams WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM mentor_assignments WHERE event_id = @eventId;
DELETE FROM event_mentor_assignments WHERE event_id = @eventId;
DELETE FROM judge_assignments WHERE round_id IN (SELECT id FROM @roundIds);
DELETE FROM event_judge_assignments WHERE event_id = @eventId;
DELETE FROM invitations WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM mentor_invitations WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM notification_recipients WHERE notification_id IN (
  SELECT id FROM notifications WHERE reference_id = @eventId OR reference_id IN (SELECT id FROM @teamIds));
DELETE FROM notifications WHERE reference_id = @eventId OR reference_id IN (SELECT id FROM @teamIds);
DELETE FROM team_join_requests WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM team_leave_requests WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM team_needed_roles WHERE team_id IN (SELECT id FROM @teamIds);
IF OBJECT_ID(N'dbo.team_progress_alerts', N'U') IS NOT NULL DELETE FROM team_progress_alerts WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM team_members WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM teams WHERE id IN (SELECT id FROM @teamIds);
DELETE FROM criteria WHERE round_id IN (SELECT id FROM @roundIds);
DELETE FROM rounds WHERE id IN (SELECT id FROM @roundIds);
IF OBJECT_ID(N'dbo.competition_groups', N'U') IS NOT NULL
  DELETE cg FROM competition_groups cg INNER JOIN tracks tr ON tr.id = cg.track_id WHERE tr.event_id = @eventId;
DELETE FROM tracks WHERE event_id = @eventId;
DELETE FROM prizes WHERE event_id = @eventId;
DELETE FROM event_schedules WHERE event_id = @eventId;
DELETE FROM allowed_email_domains WHERE event_id = @eventId;
IF OBJECT_ID(N'dbo.track_draw_sessions', N'U') IS NOT NULL DELETE FROM track_draw_sessions WHERE event_id = @eventId;
IF OBJECT_ID(N'dbo.event_tiebreaker_criteria', N'U') IS NOT NULL DELETE FROM event_tiebreaker_criteria WHERE event_id = @eventId;
IF OBJECT_ID(N'dbo.honored_guests', N'U') IS NOT NULL DELETE FROM honored_guests WHERE event_id = @eventId;
IF OBJECT_ID(N'dbo.event_magic_tokens', N'U') IS NOT NULL DELETE FROM event_magic_tokens WHERE event_id = @eventId;
DELETE FROM event_enrollments WHERE event_id = @eventId;
DELETE FROM hackathon_events WHERE id = @eventId;

-- Ensure 5 open students exist
IF EXISTS (SELECT 1 FROM users WHERE email = N'test.open.s01@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Open Student 01', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'OP2001', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.open.s01@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE020900-EEEE-4EEE-8EEE-000000000001',N'test.open.s01@fpt.edu.vn',@pwd,N'Test Open Student 01',NULL,NULL,N'OP2001',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.open.s02@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Open Student 02', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'OP2002', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.open.s02@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE020900-EEEE-4EEE-8EEE-000000000002',N'test.open.s02@fpt.edu.vn',@pwd,N'Test Open Student 02',NULL,NULL,N'OP2002',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.open.s03@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Open Student 03', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'OP2003', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.open.s03@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE020900-EEEE-4EEE-8EEE-000000000003',N'test.open.s03@fpt.edu.vn',@pwd,N'Test Open Student 03',NULL,NULL,N'OP2003',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.open.s04@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Open Student 04', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'OP2004', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.open.s04@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE020900-EEEE-4EEE-8EEE-000000000004',N'test.open.s04@fpt.edu.vn',@pwd,N'Test Open Student 04',NULL,NULL,N'OP2004',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.open.s05@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Open Student 05', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'OP2005', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.open.s05@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE020900-EEEE-4EEE-8EEE-000000000005',N'test.open.s05@fpt.edu.vn',@pwd,N'Test Open Student 05',NULL,NULL,N'OP2005',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

-- Recreate event baseline
INSERT INTO hackathon_events (id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at,
  avatar_url, score_scale_max) VALUES (
  @eventId, N'Test 2 - Open Registration (5 Students)', N'Summer', 2026,
  DATEADD(DAY, 14, @today), DATEADD(DAY, 21, @today),
  DATEADD(DAY, -3, @today), DATEADD(DAY, 7, @today),
  N'OPEN with 5 enrolled students looking for teams.', N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
  3, 5, 4, 8, @templateId, N'OPEN', 0, @coordId, N'test.coord@fpt.edu.vn', @now, @now, NULL, 100);

INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, created_at, updated_at, created_by)
VALUES ('FE020400-EEEE-4EEE-8EEE-000000000001', @eventId, N'Open Track', N'Test track', NULL, N'OPEN', NULL, @now, @now, N'test.coord@fpt.edu.vn');

INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, min_judges_per_round, created_at, updated_at, created_by) VALUES
  ('FE020300-EEEE-4EEE-8EEE-000000000001', @eventId, 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(DAY,14,@now), DATEADD(DAY,15,@now), DATEADD(HOUR,-2,DATEADD(DAY,14,@now)), DATEADD(DAY,14,@now), DATEADD(DAY,15,@now), 2, N'PER_TRACK_TOP_N', 40, 2, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE020300-EEEE-4EEE-8EEE-000000000002', @eventId, 2, N'Finals', N'FINAL', DATEADD(DAY,16,@now), DATEADD(DAY,17,@now), NULL, DATEADD(DAY,16,@now), DATEADD(DAY,17,@now), 4, N'FINALIST_POOL', 60, 2, @now, @now, N'test.coord@fpt.edu.vn');

INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE020600-EEEE-4EEE-8EEE-000000000001', 'FE020300-EEEE-4EEE-8EEE-000000000001', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE020600-EEEE-4EEE-8EEE-000000000002', 'FE020300-EEEE-4EEE-8EEE-000000000001', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE020600-EEEE-4EEE-8EEE-000000000003', 'FE020300-EEEE-4EEE-8EEE-000000000001', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE020600-EEEE-4EEE-8EEE-000000000004', 'FE020300-EEEE-4EEE-8EEE-000000000002', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE020600-EEEE-4EEE-8EEE-000000000005', 'FE020300-EEEE-4EEE-8EEE-000000000002', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE020600-EEEE-4EEE-8EEE-000000000006', 'FE020300-EEEE-4EEE-8EEE-000000000002', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'test.coord@fpt.edu.vn');

INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, N'test.coord@fpt.edu.vn', @now, @eventId, N'APPROVED', u.id, 1, 1
FROM users u WHERE u.email IN (
  N'test.open.s01@fpt.edu.vn', N'test.open.s02@fpt.edu.vn', N'test.open.s03@fpt.edu.vn',
  N'test.open.s04@fpt.edu.vn', N'test.open.s05@fpt.edu.vn');

-- Default Add Lecture pool (7 judges + 7 mentors)
INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id, created_by)
SELECT NEWID(), @now, @now, j.id, @eventId, N'test.coord@fpt.edu.vn'
FROM users j
WHERE j.email LIKE N'test.judge[1-7]@fpt.edu.vn'
  AND NOT EXISTS (SELECT 1 FROM event_judge_assignments x WHERE x.event_id = @eventId AND x.judge_user_id = j.id);

INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at, created_by)
SELECT NEWID(), @eventId, m.id, @now, @now, N'test.coord@fpt.edu.vn'
FROM users m
WHERE m.email LIKE N'test.mentor[1-7]@fpt.edu.vn'
  AND NOT EXISTS (SELECT 1 FROM event_mentor_assignments x WHERE x.event_id = @eventId AND x.mentor_user_id = m.id);

COMMIT TRANSACTION;

PRINT 'Restored Test 2 - Open Registration (5 Students)';
SELECT e.name, e.status, (SELECT COUNT(*) FROM event_enrollments ee WHERE ee.event_id = e.id) AS enrollments,
       (SELECT COUNT(*) FROM teams t WHERE t.event_id = e.id) AS teams
FROM hackathon_events e WHERE e.id = @eventId;
