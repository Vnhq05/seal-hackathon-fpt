-- Feature demo pack: 8 events (registration → assignment → submission → deadline alert → scoring → final → feedback).
-- Password for ALL accounts: Demo@123456
-- Regenerate: node _gen_seed_feature_demo_pack.mjs
-- Run: sqlcmd -S localhost -U sa -P <pwd> -C -d SEAL -f 65001 -I -i seed_feature_demo_pack.sql

SET NOCOUNT ON; SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON; SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @pwd NVARCHAR(255) = N'$2a$10$7ZqT629/ciaVAXuzx7B0zO.wFlLuVz6NK3/tNioMOWFLb2gPkXeU2';
DECLARE @now DATETIME2 = SYSDATETIME();
DECLARE @today DATE = CAST(@now AS DATE);
DECLARE @templateId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM scoring_templates ORDER BY created_at);
DECLARE @ownerUserId UNIQUEIDENTIFIER = (
  SELECT TOP 1 id FROM users WHERE email IN (N'admin@seal.com', N'coordinator@seal.com')
  ORDER BY CASE email WHEN N'admin@seal.com' THEN 0 ELSE 1 END);
DECLARE @ownerEmail NVARCHAR(255) = (SELECT email FROM users WHERE id = @ownerUserId);
IF @templateId IS NULL BEGIN RAISERROR('No scoring template. Start backend with profile=dev first.', 16, 1); ROLLBACK; RETURN; END
IF @ownerUserId IS NULL BEGIN RAISERROR('Need admin@seal.com or coordinator@seal.com.', 16, 1); ROLLBACK; RETURN; END

-- Allow 0–100 scores (legacy DBs may still enforce <=10)
DECLARE @jsdCk NVARCHAR(256) = (
  SELECT TOP 1 cc.name FROM sys.check_constraints cc
  WHERE cc.parent_object_id = OBJECT_ID(N'dbo.judge_score_details') AND cc.definition LIKE N'%score%'
);
IF @jsdCk IS NOT NULL EXEC(N'ALTER TABLE dbo.judge_score_details DROP CONSTRAINT [' + @jsdCk + N']');
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_judge_score_details_score_0_100')
  ALTER TABLE dbo.judge_score_details ADD CONSTRAINT CK_judge_score_details_score_0_100 CHECK ([score]>=(0) AND [score]<=(100));

DECLARE @packEvents TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @packEvents VALUES ('FE010100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO @packEvents VALUES ('FE020100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO @packEvents VALUES ('FE030100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO @packEvents VALUES ('FE040100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO @packEvents VALUES ('FE050100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO @packEvents VALUES ('FE060100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO @packEvents VALUES ('FE070100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO @packEvents VALUES ('FE080100-EEEE-4EEE-8EEE-000000000001');
DECLARE @packTeams TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @packTeams SELECT id FROM teams WHERE event_id IN (SELECT id FROM @packEvents);
DECLARE @packRounds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @packRounds SELECT id FROM rounds WHERE event_id IN (SELECT id FROM @packEvents);
DECLARE @packSubs TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @packSubs SELECT s.id FROM submissions s WHERE s.round_id IN (SELECT id FROM @packRounds);

DELETE jc FROM judge_comments jc INNER JOIN judge_scores js ON js.id = jc.judge_score_id WHERE js.submission_id IN (SELECT id FROM @packSubs);
DELETE jsd FROM judge_score_details jsd INNER JOIN judge_scores js ON js.id = jsd.judge_score_id WHERE js.submission_id IN (SELECT id FROM @packSubs);
DELETE FROM judge_scores WHERE submission_id IN (SELECT id FROM @packSubs);
IF OBJECT_ID(N'dbo.score_review_requests', N'U') IS NOT NULL DELETE FROM score_review_requests WHERE submission_id IN (SELECT id FROM @packSubs);
IF OBJECT_ID(N'dbo.submission_attachments', N'U') IS NOT NULL
  DELETE sa FROM submission_attachments sa INNER JOIN submission_versions sv ON sv.id = sa.submission_version_id WHERE sv.submission_id IN (SELECT id FROM @packSubs);
UPDATE submissions SET current_version_id = NULL WHERE id IN (SELECT id FROM @packSubs);
DELETE FROM submission_versions WHERE submission_id IN (SELECT id FROM @packSubs);
DELETE FROM submissions WHERE id IN (SELECT id FROM @packSubs);
IF OBJECT_ID(N'dbo.published_results', N'U') IS NOT NULL DELETE FROM published_results WHERE round_id IN (SELECT id FROM @packRounds);
IF OBJECT_ID(N'dbo.rankings', N'U') IS NOT NULL DELETE FROM rankings WHERE round_id IN (SELECT id FROM @packRounds);
IF OBJECT_ID(N'dbo.finalist_selections', N'U') IS NOT NULL DELETE FROM finalist_selections WHERE event_id IN (SELECT id FROM @packEvents);
IF OBJECT_ID(N'dbo.team_awards', N'U') IS NOT NULL DELETE FROM team_awards WHERE event_id IN (SELECT id FROM @packEvents);
IF OBJECT_ID(N'dbo.participation_certificates', N'U') IS NOT NULL DELETE FROM participation_certificates WHERE event_id IN (SELECT id FROM @packEvents);
IF OBJECT_ID(N'dbo.participant_feedbacks', N'U') IS NOT NULL DELETE FROM participant_feedbacks WHERE event_id IN (SELECT id FROM @packEvents);
IF OBJECT_ID(N'dbo.mentor_chat_messages', N'U') IS NOT NULL DELETE FROM mentor_chat_messages WHERE team_id IN (SELECT id FROM @packTeams);
IF OBJECT_ID(N'dbo.mentor_feedbacks', N'U') IS NOT NULL DELETE FROM mentor_feedbacks WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM mentor_teams WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM mentor_assignments WHERE event_id IN (SELECT id FROM @packEvents);
DELETE FROM event_mentor_assignments WHERE event_id IN (SELECT id FROM @packEvents);
DELETE FROM judge_assignments WHERE round_id IN (SELECT id FROM @packRounds);
DELETE FROM event_judge_assignments WHERE event_id IN (SELECT id FROM @packEvents);
DELETE FROM invitations WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM mentor_invitations WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM team_join_requests WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM team_leave_requests WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM team_needed_roles WHERE team_id IN (SELECT id FROM @packTeams);
-- Progress-alert notifications for pack teams
DELETE FROM notification_recipients WHERE notification_id IN (
  SELECT id FROM notifications WHERE type = N'TEAM_PROGRESS_ALERT' AND reference_id IN (SELECT id FROM @packTeams));
DELETE FROM notifications WHERE type = N'TEAM_PROGRESS_ALERT' AND reference_id IN (SELECT id FROM @packTeams);
IF OBJECT_ID(N'dbo.team_progress_alerts', N'U') IS NOT NULL DELETE FROM team_progress_alerts WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM team_members WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM teams WHERE id IN (SELECT id FROM @packTeams);
DELETE FROM criteria WHERE round_id IN (SELECT id FROM @packRounds);
DELETE FROM rounds WHERE id IN (SELECT id FROM @packRounds);
DELETE FROM competition_groups WHERE track_id IN (SELECT id FROM tracks WHERE event_id IN (SELECT id FROM @packEvents));
DELETE FROM tracks WHERE event_id IN (SELECT id FROM @packEvents);
DELETE FROM prizes WHERE event_id IN (SELECT id FROM @packEvents);
DELETE FROM event_schedules WHERE event_id IN (SELECT id FROM @packEvents);
DELETE FROM allowed_email_domains WHERE event_id IN (SELECT id FROM @packEvents);
DELETE FROM event_enrollments WHERE event_id IN (SELECT id FROM @packEvents);
DELETE FROM hackathon_events WHERE id IN (SELECT id FROM @packEvents);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.coord@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Coord', user_type=N'EVENT_COORDINATOR', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.coord@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE000000-EEEE-4EEE-8EEE-000000000001',N'test.coord@fpt.edu.vn',@pwd,N'Test Coord',NULL,NULL,NULL,N'FPT University',
    N'EVENT_COORDINATOR',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.mentor1@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Mentor One', user_type=N'LECTURER', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.mentor1@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE000000-EEEE-4EEE-8EEE-000000000002',N'test.mentor1@fpt.edu.vn',@pwd,N'Test Mentor One',NULL,NULL,NULL,N'FPT University',
    N'LECTURER',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.judge1@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Judge One', user_type=N'LECTURER', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.judge1@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE000000-EEEE-4EEE-8EEE-000000000003',N'test.judge1@fpt.edu.vn',@pwd,N'Test Judge One',NULL,NULL,NULL,N'FPT University',
    N'LECTURER',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.judge2@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Judge Two', user_type=N'LECTURER', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.judge2@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE000000-EEEE-4EEE-8EEE-000000000004',N'test.judge2@fpt.edu.vn',@pwd,N'Test Judge Two',NULL,NULL,NULL,N'FPT University',
    N'LECTURER',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.judge3@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Judge Three (Pending)', user_type=N'LECTURER', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.judge3@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE000000-EEEE-4EEE-8EEE-000000000005',N'test.judge3@fpt.edu.vn',@pwd,N'Test Judge Three (Pending)',NULL,NULL,NULL,N'FPT University',
    N'LECTURER',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.judge1@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Judge One', user_type=N'LECTURER', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.judge1@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE000000-EEEE-4EEE-8EEE-000000000006',N'test.final.judge1@fpt.edu.vn',@pwd,N'Test Final Judge One',NULL,NULL,NULL,N'FPT University',
    N'LECTURER',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.judge2@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Judge Two', user_type=N'LECTURER', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.judge2@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE000000-EEEE-4EEE-8EEE-000000000007',N'test.final.judge2@fpt.edu.vn',@pwd,N'Test Final Judge Two',NULL,NULL,NULL,N'FPT University',
    N'LECTURER',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

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

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s01@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 01', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2001', university_name=N'FPT University',
    semester=4, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s01@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000001',N'test.assign.s01@fpt.edu.vn',@pwd,N'Test Assign Student 01',NULL,NULL,N'AS2001',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,4,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s02@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 02', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2002', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s02@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000002',N'test.assign.s02@fpt.edu.vn',@pwd,N'Test Assign Student 02',NULL,NULL,N'AS2002',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s03@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 03', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2003', university_name=N'FPT University',
    semester=6, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s03@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000003',N'test.assign.s03@fpt.edu.vn',@pwd,N'Test Assign Student 03',NULL,NULL,N'AS2003',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,6,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s04@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 04', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2004', university_name=N'FPT University',
    semester=7, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s04@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000004',N'test.assign.s04@fpt.edu.vn',@pwd,N'Test Assign Student 04',NULL,NULL,N'AS2004',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,7,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s05@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 05', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2005', university_name=N'FPT University',
    semester=8, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s05@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000005',N'test.assign.s05@fpt.edu.vn',@pwd,N'Test Assign Student 05',NULL,NULL,N'AS2005',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,8,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s06@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 06', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2006', university_name=N'FPT University',
    semester=4, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s06@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000006',N'test.assign.s06@fpt.edu.vn',@pwd,N'Test Assign Student 06',NULL,NULL,N'AS2006',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,4,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s07@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 07', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2007', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s07@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000007',N'test.assign.s07@fpt.edu.vn',@pwd,N'Test Assign Student 07',NULL,NULL,N'AS2007',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s08@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 08', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2008', university_name=N'FPT University',
    semester=6, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s08@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000008',N'test.assign.s08@fpt.edu.vn',@pwd,N'Test Assign Student 08',NULL,NULL,N'AS2008',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,6,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s09@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 09', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2009', university_name=N'FPT University',
    semester=7, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s09@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000009',N'test.assign.s09@fpt.edu.vn',@pwd,N'Test Assign Student 09',NULL,NULL,N'AS2009',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,7,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s10@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 10', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2010', university_name=N'FPT University',
    semester=8, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s10@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-00000000000A',N'test.assign.s10@fpt.edu.vn',@pwd,N'Test Assign Student 10',NULL,NULL,N'AS2010',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,8,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s11@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 11', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2011', university_name=N'FPT University',
    semester=4, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s11@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-00000000000B',N'test.assign.s11@fpt.edu.vn',@pwd,N'Test Assign Student 11',NULL,NULL,N'AS2011',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,4,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s12@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 12', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2012', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s12@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-00000000000C',N'test.assign.s12@fpt.edu.vn',@pwd,N'Test Assign Student 12',NULL,NULL,N'AS2012',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s13@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 13', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2013', university_name=N'FPT University',
    semester=6, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s13@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-00000000000D',N'test.assign.s13@fpt.edu.vn',@pwd,N'Test Assign Student 13',NULL,NULL,N'AS2013',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,6,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s14@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 14', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2014', university_name=N'FPT University',
    semester=7, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s14@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-00000000000E',N'test.assign.s14@fpt.edu.vn',@pwd,N'Test Assign Student 14',NULL,NULL,N'AS2014',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,7,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s15@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 15', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2015', university_name=N'FPT University',
    semester=8, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s15@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-00000000000F',N'test.assign.s15@fpt.edu.vn',@pwd,N'Test Assign Student 15',NULL,NULL,N'AS2015',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,8,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s16@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 16', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2016', university_name=N'FPT University',
    semester=4, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s16@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000010',N'test.assign.s16@fpt.edu.vn',@pwd,N'Test Assign Student 16',NULL,NULL,N'AS2016',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,4,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s17@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 17', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2017', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s17@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000011',N'test.assign.s17@fpt.edu.vn',@pwd,N'Test Assign Student 17',NULL,NULL,N'AS2017',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s18@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 18', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2018', university_name=N'FPT University',
    semester=6, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s18@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000012',N'test.assign.s18@fpt.edu.vn',@pwd,N'Test Assign Student 18',NULL,NULL,N'AS2018',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,6,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s19@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 19', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2019', university_name=N'FPT University',
    semester=7, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s19@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000013',N'test.assign.s19@fpt.edu.vn',@pwd,N'Test Assign Student 19',NULL,NULL,N'AS2019',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,7,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s20@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 20', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2020', university_name=N'FPT University',
    semester=8, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s20@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000014',N'test.assign.s20@fpt.edu.vn',@pwd,N'Test Assign Student 20',NULL,NULL,N'AS2020',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,8,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s21@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 21', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2021', university_name=N'FPT University',
    semester=4, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s21@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000015',N'test.assign.s21@fpt.edu.vn',@pwd,N'Test Assign Student 21',NULL,NULL,N'AS2021',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,4,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s22@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 22', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2022', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s22@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000016',N'test.assign.s22@fpt.edu.vn',@pwd,N'Test Assign Student 22',NULL,NULL,N'AS2022',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s23@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 23', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2023', university_name=N'FPT University',
    semester=6, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s23@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000017',N'test.assign.s23@fpt.edu.vn',@pwd,N'Test Assign Student 23',NULL,NULL,N'AS2023',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,6,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s24@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 24', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2024', university_name=N'FPT University',
    semester=7, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s24@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000018',N'test.assign.s24@fpt.edu.vn',@pwd,N'Test Assign Student 24',NULL,NULL,N'AS2024',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,7,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s25@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 25', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2025', university_name=N'FPT University',
    semester=8, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s25@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000019',N'test.assign.s25@fpt.edu.vn',@pwd,N'Test Assign Student 25',NULL,NULL,N'AS2025',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,8,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s26@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 26', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2026', university_name=N'FPT University',
    semester=4, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s26@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-00000000001A',N'test.assign.s26@fpt.edu.vn',@pwd,N'Test Assign Student 26',NULL,NULL,N'AS2026',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,4,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s27@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 27', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2027', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s27@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-00000000001B',N'test.assign.s27@fpt.edu.vn',@pwd,N'Test Assign Student 27',NULL,NULL,N'AS2027',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s28@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 28', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2028', university_name=N'FPT University',
    semester=6, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s28@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-00000000001C',N'test.assign.s28@fpt.edu.vn',@pwd,N'Test Assign Student 28',NULL,NULL,N'AS2028',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,6,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s29@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 29', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2029', university_name=N'FPT University',
    semester=7, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s29@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-00000000001D',N'test.assign.s29@fpt.edu.vn',@pwd,N'Test Assign Student 29',NULL,NULL,N'AS2029',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,7,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.assign.s30@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Assign Student 30', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2030', university_name=N'FPT University',
    semester=8, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.assign.s30@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-00000000001E',N'test.assign.s30@fpt.edu.vn',@pwd,N'Test Assign Student 30',NULL,NULL,N'AS2030',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,8,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s01@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 01', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2001', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s01@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000001',N'test.sub.s01@fpt.edu.vn',@pwd,N'Test Sub Student 01',NULL,NULL,N'SB2001',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s02@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 02', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2002', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s02@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000002',N'test.sub.s02@fpt.edu.vn',@pwd,N'Test Sub Student 02',NULL,NULL,N'SB2002',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s03@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 03', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2003', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s03@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000003',N'test.sub.s03@fpt.edu.vn',@pwd,N'Test Sub Student 03',NULL,NULL,N'SB2003',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s04@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 04', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2004', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s04@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000004',N'test.sub.s04@fpt.edu.vn',@pwd,N'Test Sub Student 04',NULL,NULL,N'SB2004',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s05@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 05', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2005', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s05@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000005',N'test.sub.s05@fpt.edu.vn',@pwd,N'Test Sub Student 05',NULL,NULL,N'SB2005',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s06@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 06', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2006', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s06@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000006',N'test.sub.s06@fpt.edu.vn',@pwd,N'Test Sub Student 06',NULL,NULL,N'SB2006',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s07@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 07', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2007', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s07@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000007',N'test.sub.s07@fpt.edu.vn',@pwd,N'Test Sub Student 07',NULL,NULL,N'SB2007',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s08@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 08', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2008', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s08@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000008',N'test.sub.s08@fpt.edu.vn',@pwd,N'Test Sub Student 08',NULL,NULL,N'SB2008',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s09@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 09', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2009', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s09@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000009',N'test.sub.s09@fpt.edu.vn',@pwd,N'Test Sub Student 09',NULL,NULL,N'SB2009',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s10@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 10', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2010', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s10@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-00000000000A',N'test.sub.s10@fpt.edu.vn',@pwd,N'Test Sub Student 10',NULL,NULL,N'SB2010',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s11@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 11', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2011', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s11@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-00000000000B',N'test.sub.s11@fpt.edu.vn',@pwd,N'Test Sub Student 11',NULL,NULL,N'SB2011',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s12@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 12', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2012', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s12@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-00000000000C',N'test.sub.s12@fpt.edu.vn',@pwd,N'Test Sub Student 12',NULL,NULL,N'SB2012',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s13@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 13', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2013', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s13@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-00000000000D',N'test.sub.s13@fpt.edu.vn',@pwd,N'Test Sub Student 13',NULL,NULL,N'SB2013',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s14@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 14', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2014', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s14@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-00000000000E',N'test.sub.s14@fpt.edu.vn',@pwd,N'Test Sub Student 14',NULL,NULL,N'SB2014',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s15@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 15', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2015', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s15@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-00000000000F',N'test.sub.s15@fpt.edu.vn',@pwd,N'Test Sub Student 15',NULL,NULL,N'SB2015',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s16@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 16', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2016', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s16@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000010',N'test.sub.s16@fpt.edu.vn',@pwd,N'Test Sub Student 16',NULL,NULL,N'SB2016',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s17@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 17', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2017', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s17@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000011',N'test.sub.s17@fpt.edu.vn',@pwd,N'Test Sub Student 17',NULL,NULL,N'SB2017',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s18@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 18', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2018', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s18@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000012',N'test.sub.s18@fpt.edu.vn',@pwd,N'Test Sub Student 18',NULL,NULL,N'SB2018',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s19@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 19', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2019', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s19@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000013',N'test.sub.s19@fpt.edu.vn',@pwd,N'Test Sub Student 19',NULL,NULL,N'SB2019',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s20@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 20', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2020', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s20@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000014',N'test.sub.s20@fpt.edu.vn',@pwd,N'Test Sub Student 20',NULL,NULL,N'SB2020',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s21@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 21', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2021', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s21@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000015',N'test.sub.s21@fpt.edu.vn',@pwd,N'Test Sub Student 21',NULL,NULL,N'SB2021',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s22@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 22', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2022', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s22@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000016',N'test.sub.s22@fpt.edu.vn',@pwd,N'Test Sub Student 22',NULL,NULL,N'SB2022',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s23@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 23', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2023', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s23@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000017',N'test.sub.s23@fpt.edu.vn',@pwd,N'Test Sub Student 23',NULL,NULL,N'SB2023',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s24@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 24', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2024', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s24@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000018',N'test.sub.s24@fpt.edu.vn',@pwd,N'Test Sub Student 24',NULL,NULL,N'SB2024',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s25@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 25', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2025', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s25@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000019',N'test.sub.s25@fpt.edu.vn',@pwd,N'Test Sub Student 25',NULL,NULL,N'SB2025',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s26@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 26', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2026', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s26@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-00000000001A',N'test.sub.s26@fpt.edu.vn',@pwd,N'Test Sub Student 26',NULL,NULL,N'SB2026',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s27@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 27', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2027', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s27@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-00000000001B',N'test.sub.s27@fpt.edu.vn',@pwd,N'Test Sub Student 27',NULL,NULL,N'SB2027',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s28@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 28', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2028', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s28@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-00000000001C',N'test.sub.s28@fpt.edu.vn',@pwd,N'Test Sub Student 28',NULL,NULL,N'SB2028',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s29@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 29', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2029', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s29@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-00000000001D',N'test.sub.s29@fpt.edu.vn',@pwd,N'Test Sub Student 29',NULL,NULL,N'SB2029',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.sub.s30@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Sub Student 30', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2030', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.sub.s30@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-00000000001E',N'test.sub.s30@fpt.edu.vn',@pwd,N'Test Sub Student 30',NULL,NULL,N'SB2030',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s01@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 01', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2001', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s01@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000001',N'test.alert.s01@fpt.edu.vn',@pwd,N'Test Alert Student 01',NULL,NULL,N'AL2001',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s02@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 02', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2002', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s02@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000002',N'test.alert.s02@fpt.edu.vn',@pwd,N'Test Alert Student 02',NULL,NULL,N'AL2002',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s03@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 03', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2003', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s03@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000003',N'test.alert.s03@fpt.edu.vn',@pwd,N'Test Alert Student 03',NULL,NULL,N'AL2003',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s04@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 04', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2004', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s04@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000004',N'test.alert.s04@fpt.edu.vn',@pwd,N'Test Alert Student 04',NULL,NULL,N'AL2004',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s05@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 05', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2005', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s05@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000005',N'test.alert.s05@fpt.edu.vn',@pwd,N'Test Alert Student 05',NULL,NULL,N'AL2005',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s06@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 06', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2006', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s06@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000006',N'test.alert.s06@fpt.edu.vn',@pwd,N'Test Alert Student 06',NULL,NULL,N'AL2006',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s07@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 07', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2007', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s07@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000007',N'test.alert.s07@fpt.edu.vn',@pwd,N'Test Alert Student 07',NULL,NULL,N'AL2007',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s08@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 08', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2008', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s08@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000008',N'test.alert.s08@fpt.edu.vn',@pwd,N'Test Alert Student 08',NULL,NULL,N'AL2008',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s09@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 09', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2009', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s09@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000009',N'test.alert.s09@fpt.edu.vn',@pwd,N'Test Alert Student 09',NULL,NULL,N'AL2009',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s10@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 10', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2010', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s10@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-00000000000A',N'test.alert.s10@fpt.edu.vn',@pwd,N'Test Alert Student 10',NULL,NULL,N'AL2010',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s11@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 11', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2011', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s11@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-00000000000B',N'test.alert.s11@fpt.edu.vn',@pwd,N'Test Alert Student 11',NULL,NULL,N'AL2011',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s12@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 12', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2012', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s12@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-00000000000C',N'test.alert.s12@fpt.edu.vn',@pwd,N'Test Alert Student 12',NULL,NULL,N'AL2012',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s13@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 13', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2013', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s13@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-00000000000D',N'test.alert.s13@fpt.edu.vn',@pwd,N'Test Alert Student 13',NULL,NULL,N'AL2013',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s14@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 14', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2014', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s14@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-00000000000E',N'test.alert.s14@fpt.edu.vn',@pwd,N'Test Alert Student 14',NULL,NULL,N'AL2014',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s15@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 15', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2015', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s15@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-00000000000F',N'test.alert.s15@fpt.edu.vn',@pwd,N'Test Alert Student 15',NULL,NULL,N'AL2015',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s16@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 16', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2016', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s16@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000010',N'test.alert.s16@fpt.edu.vn',@pwd,N'Test Alert Student 16',NULL,NULL,N'AL2016',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s17@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 17', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2017', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s17@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000011',N'test.alert.s17@fpt.edu.vn',@pwd,N'Test Alert Student 17',NULL,NULL,N'AL2017',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s18@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 18', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2018', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s18@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000012',N'test.alert.s18@fpt.edu.vn',@pwd,N'Test Alert Student 18',NULL,NULL,N'AL2018',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s19@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 19', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2019', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s19@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000013',N'test.alert.s19@fpt.edu.vn',@pwd,N'Test Alert Student 19',NULL,NULL,N'AL2019',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s20@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 20', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2020', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s20@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000014',N'test.alert.s20@fpt.edu.vn',@pwd,N'Test Alert Student 20',NULL,NULL,N'AL2020',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s21@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 21', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2021', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s21@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000015',N'test.alert.s21@fpt.edu.vn',@pwd,N'Test Alert Student 21',NULL,NULL,N'AL2021',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s22@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 22', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2022', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s22@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000016',N'test.alert.s22@fpt.edu.vn',@pwd,N'Test Alert Student 22',NULL,NULL,N'AL2022',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s23@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 23', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2023', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s23@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000017',N'test.alert.s23@fpt.edu.vn',@pwd,N'Test Alert Student 23',NULL,NULL,N'AL2023',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s24@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 24', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2024', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s24@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000018',N'test.alert.s24@fpt.edu.vn',@pwd,N'Test Alert Student 24',NULL,NULL,N'AL2024',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s25@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 25', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2025', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s25@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000019',N'test.alert.s25@fpt.edu.vn',@pwd,N'Test Alert Student 25',NULL,NULL,N'AL2025',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s26@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 26', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2026', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s26@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-00000000001A',N'test.alert.s26@fpt.edu.vn',@pwd,N'Test Alert Student 26',NULL,NULL,N'AL2026',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s27@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 27', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2027', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s27@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-00000000001B',N'test.alert.s27@fpt.edu.vn',@pwd,N'Test Alert Student 27',NULL,NULL,N'AL2027',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s28@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 28', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2028', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s28@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-00000000001C',N'test.alert.s28@fpt.edu.vn',@pwd,N'Test Alert Student 28',NULL,NULL,N'AL2028',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s29@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 29', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2029', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s29@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-00000000001D',N'test.alert.s29@fpt.edu.vn',@pwd,N'Test Alert Student 29',NULL,NULL,N'AL2029',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.alert.s30@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Alert Student 30', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AL2030', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.alert.s30@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-00000000001E',N'test.alert.s30@fpt.edu.vn',@pwd,N'Test Alert Student 30',NULL,NULL,N'AL2030',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s01@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 01', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2001', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s01@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000001',N'test.score.s01@fpt.edu.vn',@pwd,N'Test Score Student 01',NULL,NULL,N'SC2001',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s02@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 02', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2002', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s02@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000002',N'test.score.s02@fpt.edu.vn',@pwd,N'Test Score Student 02',NULL,NULL,N'SC2002',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s03@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 03', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2003', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s03@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000003',N'test.score.s03@fpt.edu.vn',@pwd,N'Test Score Student 03',NULL,NULL,N'SC2003',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s04@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 04', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2004', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s04@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000004',N'test.score.s04@fpt.edu.vn',@pwd,N'Test Score Student 04',NULL,NULL,N'SC2004',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s05@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 05', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2005', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s05@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000005',N'test.score.s05@fpt.edu.vn',@pwd,N'Test Score Student 05',NULL,NULL,N'SC2005',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s06@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 06', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2006', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s06@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000006',N'test.score.s06@fpt.edu.vn',@pwd,N'Test Score Student 06',NULL,NULL,N'SC2006',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s07@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 07', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2007', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s07@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000007',N'test.score.s07@fpt.edu.vn',@pwd,N'Test Score Student 07',NULL,NULL,N'SC2007',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s08@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 08', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2008', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s08@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000008',N'test.score.s08@fpt.edu.vn',@pwd,N'Test Score Student 08',NULL,NULL,N'SC2008',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s09@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 09', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2009', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s09@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000009',N'test.score.s09@fpt.edu.vn',@pwd,N'Test Score Student 09',NULL,NULL,N'SC2009',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s10@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 10', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2010', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s10@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-00000000000A',N'test.score.s10@fpt.edu.vn',@pwd,N'Test Score Student 10',NULL,NULL,N'SC2010',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s11@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 11', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2011', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s11@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-00000000000B',N'test.score.s11@fpt.edu.vn',@pwd,N'Test Score Student 11',NULL,NULL,N'SC2011',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s12@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 12', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2012', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s12@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-00000000000C',N'test.score.s12@fpt.edu.vn',@pwd,N'Test Score Student 12',NULL,NULL,N'SC2012',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s13@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 13', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2013', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s13@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-00000000000D',N'test.score.s13@fpt.edu.vn',@pwd,N'Test Score Student 13',NULL,NULL,N'SC2013',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s14@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 14', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2014', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s14@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-00000000000E',N'test.score.s14@fpt.edu.vn',@pwd,N'Test Score Student 14',NULL,NULL,N'SC2014',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s15@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 15', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2015', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s15@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-00000000000F',N'test.score.s15@fpt.edu.vn',@pwd,N'Test Score Student 15',NULL,NULL,N'SC2015',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s16@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 16', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2016', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s16@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000010',N'test.score.s16@fpt.edu.vn',@pwd,N'Test Score Student 16',NULL,NULL,N'SC2016',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s17@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 17', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2017', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s17@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000011',N'test.score.s17@fpt.edu.vn',@pwd,N'Test Score Student 17',NULL,NULL,N'SC2017',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s18@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 18', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2018', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s18@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000012',N'test.score.s18@fpt.edu.vn',@pwd,N'Test Score Student 18',NULL,NULL,N'SC2018',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s19@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 19', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2019', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s19@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000013',N'test.score.s19@fpt.edu.vn',@pwd,N'Test Score Student 19',NULL,NULL,N'SC2019',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s20@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 20', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2020', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s20@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000014',N'test.score.s20@fpt.edu.vn',@pwd,N'Test Score Student 20',NULL,NULL,N'SC2020',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s21@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 21', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2021', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s21@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000015',N'test.score.s21@fpt.edu.vn',@pwd,N'Test Score Student 21',NULL,NULL,N'SC2021',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s22@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 22', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2022', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s22@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000016',N'test.score.s22@fpt.edu.vn',@pwd,N'Test Score Student 22',NULL,NULL,N'SC2022',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s23@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 23', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2023', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s23@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000017',N'test.score.s23@fpt.edu.vn',@pwd,N'Test Score Student 23',NULL,NULL,N'SC2023',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s24@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 24', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2024', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s24@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000018',N'test.score.s24@fpt.edu.vn',@pwd,N'Test Score Student 24',NULL,NULL,N'SC2024',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s25@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 25', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2025', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s25@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000019',N'test.score.s25@fpt.edu.vn',@pwd,N'Test Score Student 25',NULL,NULL,N'SC2025',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s26@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 26', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2026', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s26@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-00000000001A',N'test.score.s26@fpt.edu.vn',@pwd,N'Test Score Student 26',NULL,NULL,N'SC2026',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s27@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 27', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2027', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s27@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-00000000001B',N'test.score.s27@fpt.edu.vn',@pwd,N'Test Score Student 27',NULL,NULL,N'SC2027',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s28@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 28', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2028', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s28@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-00000000001C',N'test.score.s28@fpt.edu.vn',@pwd,N'Test Score Student 28',NULL,NULL,N'SC2028',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s29@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 29', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2029', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s29@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-00000000001D',N'test.score.s29@fpt.edu.vn',@pwd,N'Test Score Student 29',NULL,NULL,N'SC2029',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.score.s30@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Score Student 30', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2030', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.score.s30@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-00000000001E',N'test.score.s30@fpt.edu.vn',@pwd,N'Test Score Student 30',NULL,NULL,N'SC2030',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s01@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 01', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2001', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s01@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-000000000001',N'test.final.s01@fpt.edu.vn',@pwd,N'Test Final Student 01',NULL,NULL,N'FN2001',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s02@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 02', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2002', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s02@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-000000000002',N'test.final.s02@fpt.edu.vn',@pwd,N'Test Final Student 02',NULL,NULL,N'FN2002',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s03@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 03', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2003', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s03@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-000000000003',N'test.final.s03@fpt.edu.vn',@pwd,N'Test Final Student 03',NULL,NULL,N'FN2003',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s04@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 04', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2004', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s04@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-000000000004',N'test.final.s04@fpt.edu.vn',@pwd,N'Test Final Student 04',NULL,NULL,N'FN2004',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s05@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 05', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2005', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s05@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-000000000005',N'test.final.s05@fpt.edu.vn',@pwd,N'Test Final Student 05',NULL,NULL,N'FN2005',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s06@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 06', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2006', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s06@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-000000000006',N'test.final.s06@fpt.edu.vn',@pwd,N'Test Final Student 06',NULL,NULL,N'FN2006',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s07@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 07', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2007', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s07@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-000000000007',N'test.final.s07@fpt.edu.vn',@pwd,N'Test Final Student 07',NULL,NULL,N'FN2007',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s08@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 08', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2008', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s08@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-000000000008',N'test.final.s08@fpt.edu.vn',@pwd,N'Test Final Student 08',NULL,NULL,N'FN2008',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s09@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 09', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2009', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s09@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-000000000009',N'test.final.s09@fpt.edu.vn',@pwd,N'Test Final Student 09',NULL,NULL,N'FN2009',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s10@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 10', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2010', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s10@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-00000000000A',N'test.final.s10@fpt.edu.vn',@pwd,N'Test Final Student 10',NULL,NULL,N'FN2010',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s11@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 11', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2011', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s11@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-00000000000B',N'test.final.s11@fpt.edu.vn',@pwd,N'Test Final Student 11',NULL,NULL,N'FN2011',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s12@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 12', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2012', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s12@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-00000000000C',N'test.final.s12@fpt.edu.vn',@pwd,N'Test Final Student 12',NULL,NULL,N'FN2012',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s13@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 13', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2013', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s13@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-00000000000D',N'test.final.s13@fpt.edu.vn',@pwd,N'Test Final Student 13',NULL,NULL,N'FN2013',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s14@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 14', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2014', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s14@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-00000000000E',N'test.final.s14@fpt.edu.vn',@pwd,N'Test Final Student 14',NULL,NULL,N'FN2014',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s15@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 15', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2015', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s15@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-00000000000F',N'test.final.s15@fpt.edu.vn',@pwd,N'Test Final Student 15',NULL,NULL,N'FN2015',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s16@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 16', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2016', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s16@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-000000000010',N'test.final.s16@fpt.edu.vn',@pwd,N'Test Final Student 16',NULL,NULL,N'FN2016',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s17@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 17', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2017', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s17@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-000000000011',N'test.final.s17@fpt.edu.vn',@pwd,N'Test Final Student 17',NULL,NULL,N'FN2017',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s18@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 18', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2018', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s18@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-000000000012',N'test.final.s18@fpt.edu.vn',@pwd,N'Test Final Student 18',NULL,NULL,N'FN2018',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s19@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 19', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2019', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s19@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-000000000013',N'test.final.s19@fpt.edu.vn',@pwd,N'Test Final Student 19',NULL,NULL,N'FN2019',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s20@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 20', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2020', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s20@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-000000000014',N'test.final.s20@fpt.edu.vn',@pwd,N'Test Final Student 20',NULL,NULL,N'FN2020',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s21@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 21', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2021', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s21@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-000000000015',N'test.final.s21@fpt.edu.vn',@pwd,N'Test Final Student 21',NULL,NULL,N'FN2021',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s22@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 22', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2022', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s22@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-000000000016',N'test.final.s22@fpt.edu.vn',@pwd,N'Test Final Student 22',NULL,NULL,N'FN2022',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s23@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 23', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2023', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s23@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-000000000017',N'test.final.s23@fpt.edu.vn',@pwd,N'Test Final Student 23',NULL,NULL,N'FN2023',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s24@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 24', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2024', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s24@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-000000000018',N'test.final.s24@fpt.edu.vn',@pwd,N'Test Final Student 24',NULL,NULL,N'FN2024',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s25@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 25', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2025', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s25@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-000000000019',N'test.final.s25@fpt.edu.vn',@pwd,N'Test Final Student 25',NULL,NULL,N'FN2025',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s26@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 26', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2026', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s26@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-00000000001A',N'test.final.s26@fpt.edu.vn',@pwd,N'Test Final Student 26',NULL,NULL,N'FN2026',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s27@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 27', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2027', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s27@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-00000000001B',N'test.final.s27@fpt.edu.vn',@pwd,N'Test Final Student 27',NULL,NULL,N'FN2027',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s28@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 28', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2028', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s28@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-00000000001C',N'test.final.s28@fpt.edu.vn',@pwd,N'Test Final Student 28',NULL,NULL,N'FN2028',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s29@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 29', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2029', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s29@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-00000000001D',N'test.final.s29@fpt.edu.vn',@pwd,N'Test Final Student 29',NULL,NULL,N'FN2029',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.final.s30@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Final Student 30', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2030', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.final.s30@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-00000000001E',N'test.final.s30@fpt.edu.vn',@pwd,N'Test Final Student 30',NULL,NULL,N'FN2030',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s01@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 01', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2001', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s01@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-000000000001',N'test.fb.s01@fpt.edu.vn',@pwd,N'Test Feedback Student 01',NULL,NULL,N'FB2001',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s02@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 02', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2002', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s02@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-000000000002',N'test.fb.s02@fpt.edu.vn',@pwd,N'Test Feedback Student 02',NULL,NULL,N'FB2002',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s03@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 03', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2003', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s03@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-000000000003',N'test.fb.s03@fpt.edu.vn',@pwd,N'Test Feedback Student 03',NULL,NULL,N'FB2003',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s04@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 04', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2004', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s04@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-000000000004',N'test.fb.s04@fpt.edu.vn',@pwd,N'Test Feedback Student 04',NULL,NULL,N'FB2004',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s05@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 05', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2005', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s05@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-000000000005',N'test.fb.s05@fpt.edu.vn',@pwd,N'Test Feedback Student 05',NULL,NULL,N'FB2005',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s06@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 06', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2006', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s06@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-000000000006',N'test.fb.s06@fpt.edu.vn',@pwd,N'Test Feedback Student 06',NULL,NULL,N'FB2006',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s07@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 07', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2007', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s07@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-000000000007',N'test.fb.s07@fpt.edu.vn',@pwd,N'Test Feedback Student 07',NULL,NULL,N'FB2007',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s08@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 08', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2008', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s08@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-000000000008',N'test.fb.s08@fpt.edu.vn',@pwd,N'Test Feedback Student 08',NULL,NULL,N'FB2008',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s09@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 09', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2009', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s09@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-000000000009',N'test.fb.s09@fpt.edu.vn',@pwd,N'Test Feedback Student 09',NULL,NULL,N'FB2009',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s10@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 10', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2010', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s10@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-00000000000A',N'test.fb.s10@fpt.edu.vn',@pwd,N'Test Feedback Student 10',NULL,NULL,N'FB2010',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s11@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 11', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2011', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s11@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-00000000000B',N'test.fb.s11@fpt.edu.vn',@pwd,N'Test Feedback Student 11',NULL,NULL,N'FB2011',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s12@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 12', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2012', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s12@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-00000000000C',N'test.fb.s12@fpt.edu.vn',@pwd,N'Test Feedback Student 12',NULL,NULL,N'FB2012',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s13@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 13', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2013', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s13@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-00000000000D',N'test.fb.s13@fpt.edu.vn',@pwd,N'Test Feedback Student 13',NULL,NULL,N'FB2013',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s14@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 14', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2014', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s14@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-00000000000E',N'test.fb.s14@fpt.edu.vn',@pwd,N'Test Feedback Student 14',NULL,NULL,N'FB2014',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s15@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 15', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2015', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s15@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-00000000000F',N'test.fb.s15@fpt.edu.vn',@pwd,N'Test Feedback Student 15',NULL,NULL,N'FB2015',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s16@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 16', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2016', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s16@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-000000000010',N'test.fb.s16@fpt.edu.vn',@pwd,N'Test Feedback Student 16',NULL,NULL,N'FB2016',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s17@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 17', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2017', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s17@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-000000000011',N'test.fb.s17@fpt.edu.vn',@pwd,N'Test Feedback Student 17',NULL,NULL,N'FB2017',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s18@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 18', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2018', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s18@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-000000000012',N'test.fb.s18@fpt.edu.vn',@pwd,N'Test Feedback Student 18',NULL,NULL,N'FB2018',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s19@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 19', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2019', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s19@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-000000000013',N'test.fb.s19@fpt.edu.vn',@pwd,N'Test Feedback Student 19',NULL,NULL,N'FB2019',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s20@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 20', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2020', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s20@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-000000000014',N'test.fb.s20@fpt.edu.vn',@pwd,N'Test Feedback Student 20',NULL,NULL,N'FB2020',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s21@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 21', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2021', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s21@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-000000000015',N'test.fb.s21@fpt.edu.vn',@pwd,N'Test Feedback Student 21',NULL,NULL,N'FB2021',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s22@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 22', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2022', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s22@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-000000000016',N'test.fb.s22@fpt.edu.vn',@pwd,N'Test Feedback Student 22',NULL,NULL,N'FB2022',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s23@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 23', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2023', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s23@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-000000000017',N'test.fb.s23@fpt.edu.vn',@pwd,N'Test Feedback Student 23',NULL,NULL,N'FB2023',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s24@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 24', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2024', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s24@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-000000000018',N'test.fb.s24@fpt.edu.vn',@pwd,N'Test Feedback Student 24',NULL,NULL,N'FB2024',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s25@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 25', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2025', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s25@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-000000000019',N'test.fb.s25@fpt.edu.vn',@pwd,N'Test Feedback Student 25',NULL,NULL,N'FB2025',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s26@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 26', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2026', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s26@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-00000000001A',N'test.fb.s26@fpt.edu.vn',@pwd,N'Test Feedback Student 26',NULL,NULL,N'FB2026',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s27@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 27', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2027', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s27@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-00000000001B',N'test.fb.s27@fpt.edu.vn',@pwd,N'Test Feedback Student 27',NULL,NULL,N'FB2027',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s28@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 28', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2028', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s28@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-00000000001C',N'test.fb.s28@fpt.edu.vn',@pwd,N'Test Feedback Student 28',NULL,NULL,N'FB2028',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s29@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 29', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2029', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s29@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-00000000001D',N'test.fb.s29@fpt.edu.vn',@pwd,N'Test Feedback Student 29',NULL,NULL,N'FB2029',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'test.fb.s30@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Test Feedback Student 30', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2030', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'test.fb.s30@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE080900-EEEE-4EEE-8EEE-00000000001E',N'test.fb.s30@fpt.edu.vn',@pwd,N'Test Feedback Student 30',NULL,NULL,N'FB2030',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

DECLARE @coordId UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.coord@fpt.edu.vn');
DECLARE @mentor1Id UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.mentor1@fpt.edu.vn');
DECLARE @j1 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.judge1@fpt.edu.vn');
DECLARE @j2 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.judge2@fpt.edu.vn');
DECLARE @j3 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.judge3@fpt.edu.vn');
DECLARE @fj1 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.judge1@fpt.edu.vn');
DECLARE @fj2 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.judge2@fpt.edu.vn');

IF NOT EXISTS (SELECT 1 FROM allowed_email_domains WHERE domain = N'fpt.edu.vn')
  INSERT INTO allowed_email_domains (id, event_id, domain, university_label, created_at, updated_at)
  VALUES (NEWID(), NULL, N'fpt.edu.vn', N'FPT University', @now, @now);

-- ========== 1) OPEN empty ==========
INSERT INTO hackathon_events (id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at,
  avatar_url, score_scale_max) VALUES (
  'FE010100-EEEE-4EEE-8EEE-000000000001', N'Test 1 - Open Registration (Join Me)', N'Summer', 2026,
  DATEADD(DAY, 14, @today), DATEADD(DAY, 21, @today),
  DATEADD(DAY, -2, @today), DATEADD(DAY, 10, @today),
  N'Empty OPEN event — enroll and create teams.', N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
  3, 5, 4, 8, @templateId, N'OPEN', 0, @coordId, N'test.coord@fpt.edu.vn', @now, @now, NULL, 100);
INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, created_at, updated_at, created_by)
VALUES ('FE010400-EEEE-4EEE-8EEE-000000000001', 'FE010100-EEEE-4EEE-8EEE-000000000001', N'Open Track', N'Test track', NULL, N'OPEN', NULL, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, min_judges_per_round, created_at, updated_at, created_by) VALUES
  ('FE010300-EEEE-4EEE-8EEE-000000000001', 'FE010100-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(DAY,14,@now), DATEADD(DAY,15,@now), DATEADD(HOUR,-2,DATEADD(DAY,14,@now)), DATEADD(DAY,14,@now), DATEADD(DAY,15,@now), 2, N'PER_TRACK_TOP_N', 40, 2, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE010300-EEEE-4EEE-8EEE-000000000002', 'FE010100-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', N'FINAL', DATEADD(DAY,16,@now), DATEADD(DAY,17,@now), NULL, DATEADD(DAY,16,@now), DATEADD(DAY,17,@now), 4, N'FINALIST_POOL', 60, 2, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE010600-EEEE-4EEE-8EEE-000000000001', 'FE010300-EEEE-4EEE-8EEE-000000000001', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE010600-EEEE-4EEE-8EEE-000000000002', 'FE010300-EEEE-4EEE-8EEE-000000000001', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE010600-EEEE-4EEE-8EEE-000000000003', 'FE010300-EEEE-4EEE-8EEE-000000000001', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE010600-EEEE-4EEE-8EEE-000000000004', 'FE010300-EEEE-4EEE-8EEE-000000000002', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE010600-EEEE-4EEE-8EEE-000000000005', 'FE010300-EEEE-4EEE-8EEE-000000000002', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE010600-EEEE-4EEE-8EEE-000000000006', 'FE010300-EEEE-4EEE-8EEE-000000000002', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'test.coord@fpt.edu.vn');

-- ========== 2) OPEN + 5 students ==========
INSERT INTO hackathon_events (id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at,
  avatar_url, score_scale_max) VALUES (
  'FE020100-EEEE-4EEE-8EEE-000000000001', N'Test 2 - Open Registration (5 Students)', N'Summer', 2026,
  DATEADD(DAY, 14, @today), DATEADD(DAY, 21, @today),
  DATEADD(DAY, -3, @today), DATEADD(DAY, 7, @today),
  N'OPEN with 5 enrolled students looking for teams.', N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
  3, 5, 4, 8, @templateId, N'OPEN', 0, @coordId, N'test.coord@fpt.edu.vn', @now, @now, NULL, 100);
INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, created_at, updated_at, created_by)
VALUES ('FE020400-EEEE-4EEE-8EEE-000000000001', 'FE020100-EEEE-4EEE-8EEE-000000000001', N'Open Track', N'Test track', NULL, N'OPEN', NULL, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, min_judges_per_round, created_at, updated_at, created_by) VALUES
  ('FE020300-EEEE-4EEE-8EEE-000000000001', 'FE020100-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(DAY,14,@now), DATEADD(DAY,15,@now), DATEADD(HOUR,-2,DATEADD(DAY,14,@now)), DATEADD(DAY,14,@now), DATEADD(DAY,15,@now), 2, N'PER_TRACK_TOP_N', 40, 2, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE020300-EEEE-4EEE-8EEE-000000000002', 'FE020100-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', N'FINAL', DATEADD(DAY,16,@now), DATEADD(DAY,17,@now), NULL, DATEADD(DAY,16,@now), DATEADD(DAY,17,@now), 4, N'FINALIST_POOL', 60, 2, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE020600-EEEE-4EEE-8EEE-000000000001', 'FE020300-EEEE-4EEE-8EEE-000000000001', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE020600-EEEE-4EEE-8EEE-000000000002', 'FE020300-EEEE-4EEE-8EEE-000000000001', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE020600-EEEE-4EEE-8EEE-000000000003', 'FE020300-EEEE-4EEE-8EEE-000000000001', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE020600-EEEE-4EEE-8EEE-000000000004', 'FE020300-EEEE-4EEE-8EEE-000000000002', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE020600-EEEE-4EEE-8EEE-000000000005', 'FE020300-EEEE-4EEE-8EEE-000000000002', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE020600-EEEE-4EEE-8EEE-000000000006', 'FE020300-EEEE-4EEE-8EEE-000000000002', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, N'test.coord@fpt.edu.vn', @now, 'FE020100-EEEE-4EEE-8EEE-000000000001', N'APPROVED', u.id, 1, 1
FROM users u WHERE u.email IN (
  N'test.open.s01@fpt.edu.vn', N'test.open.s02@fpt.edu.vn', N'test.open.s03@fpt.edu.vn',
  N'test.open.s04@fpt.edu.vn', N'test.open.s05@fpt.edu.vn');
DELETE FROM users WHERE email LIKE N'test.open.s%@fpt.edu.vn'
  AND email NOT IN (N'test.open.s01@fpt.edu.vn', N'test.open.s02@fpt.edu.vn', N'test.open.s03@fpt.edu.vn', N'test.open.s04@fpt.edu.vn', N'test.open.s05@fpt.edu.vn');
DELETE FROM users WHERE email LIKE N'test.t1.s%@fpt.edu.vn';

-- ========== 3) Assignment + MentorHub ==========
INSERT INTO hackathon_events (id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at,
  avatar_url, score_scale_max) VALUES (
  'FE030100-EEEE-4EEE-8EEE-000000000001', N'Test 3 - Assignment (10 Teams Closed Reg)', N'Summer', 2026,
  DATEADD(DAY, 7, @today), DATEADD(DAY, 8, @today),
  DATEADD(DAY, -30, @today), DATEADD(DAY, -1, @today),
  N'10 CONFIRMED teams. Most unassigned for Assignment QA; Team 01 pre-linked to mentor for MentorHub.', N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
  3, 5, 4, 8, @templateId, N'CLOSED_REGISTRATION', 0, @coordId, N'test.coord@fpt.edu.vn', @now, @now, NULL, 100);
INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, created_at, updated_at, created_by)
VALUES ('FE030400-EEEE-4EEE-8EEE-000000000001', 'FE030100-EEEE-4EEE-8EEE-000000000001', N'Grounded Retrieval', N'Test track', NULL, N'OPEN', NULL, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, created_at, updated_at, created_by)
VALUES ('FE030400-EEEE-4EEE-8EEE-000000000002', 'FE030100-EEEE-4EEE-8EEE-000000000001', N'Agent Orchestration', N'Test track', NULL, N'OPEN', NULL, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, min_judges_per_round, created_at, updated_at, created_by) VALUES
  ('FE030300-EEEE-4EEE-8EEE-000000000001', 'FE030100-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(DAY,7,@now), DATEADD(DAY,8,@now), DATEADD(HOUR,-2,DATEADD(DAY,7,@now)), DATEADD(DAY,7,@now), DATEADD(DAY,8,@now), 2, N'PER_TRACK_TOP_N', 40, 2, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE030300-EEEE-4EEE-8EEE-000000000002', 'FE030100-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', N'FINAL', DATEADD(DAY,8,@now), DATEADD(DAY,9,@now), NULL, DATEADD(DAY,8,@now), DATEADD(DAY,9,@now), 4, N'FINALIST_POOL', 60, 2, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE030600-EEEE-4EEE-8EEE-000000000001', 'FE030300-EEEE-4EEE-8EEE-000000000001', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE030600-EEEE-4EEE-8EEE-000000000002', 'FE030300-EEEE-4EEE-8EEE-000000000001', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE030600-EEEE-4EEE-8EEE-000000000003', 'FE030300-EEEE-4EEE-8EEE-000000000001', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE030600-EEEE-4EEE-8EEE-000000000004', 'FE030300-EEEE-4EEE-8EEE-000000000002', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE030600-EEEE-4EEE-8EEE-000000000005', 'FE030300-EEEE-4EEE-8EEE-000000000002', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE030600-EEEE-4EEE-8EEE-000000000006', 'FE030300-EEEE-4EEE-8EEE-000000000002', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at, created_by)
VALUES (NEWID(), 'FE030100-EEEE-4EEE-8EEE-000000000001', @mentor1Id, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO mentor_assignments (id, created_at, created_by, assigned_at, mentor_user_id, track_id, event_id)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, @mentor1Id, 'FE030400-EEEE-4EEE-8EEE-000000000001', 'FE030100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, N'test.coord@fpt.edu.vn', @now, 'FE030100-EEEE-4EEE-8EEE-000000000001', N'APPROVED', u.id, 1, 1
FROM users u WHERE u.email LIKE N'test.assign.s%@fpt.edu.vn';
DECLARE @L_FE030200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s01@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s02@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s03@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000001', @now, N'test.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000001, N'Assign Alpha', N'CONFIRMED', 'FE030400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000001, 'FE030200-EEEE-4EEE-8EEE-000000000001', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000001, 'FE030200-EEEE-4EEE-8EEE-000000000001', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000001, 'FE030200-EEEE-4EEE-8EEE-000000000001', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s04@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s05@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s06@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000002', @now, N'test.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000002, N'Assign Beta', N'CONFIRMED', NULL, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000002, 'FE030200-EEEE-4EEE-8EEE-000000000002', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000002, 'FE030200-EEEE-4EEE-8EEE-000000000002', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000002, 'FE030200-EEEE-4EEE-8EEE-000000000002', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s07@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s08@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s09@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000003', @now, N'test.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000003, N'Assign Gamma', N'CONFIRMED', NULL, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000003, 'FE030200-EEEE-4EEE-8EEE-000000000003', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000003, 'FE030200-EEEE-4EEE-8EEE-000000000003', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000003, 'FE030200-EEEE-4EEE-8EEE-000000000003', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s10@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s11@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s12@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000004', @now, N'test.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000004, N'Assign Delta', N'CONFIRMED', NULL, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000004, 'FE030200-EEEE-4EEE-8EEE-000000000004', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000004, 'FE030200-EEEE-4EEE-8EEE-000000000004', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000004, 'FE030200-EEEE-4EEE-8EEE-000000000004', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE000000000005 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s13@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000005 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s14@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000005 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s15@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000005', @now, N'test.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000005, N'Assign Epsilon', N'CONFIRMED', NULL, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000005, 'FE030200-EEEE-4EEE-8EEE-000000000005', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000005, 'FE030200-EEEE-4EEE-8EEE-000000000005', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000005, 'FE030200-EEEE-4EEE-8EEE-000000000005', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE000000000006 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s16@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000006 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s17@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000006 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s18@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000006', @now, N'test.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000006, N'Assign Zeta', N'CONFIRMED', NULL, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000006, 'FE030200-EEEE-4EEE-8EEE-000000000006', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000006, 'FE030200-EEEE-4EEE-8EEE-000000000006', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000006, 'FE030200-EEEE-4EEE-8EEE-000000000006', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE000000000007 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s19@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000007 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s20@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000007 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s21@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000007', @now, N'test.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000007, N'Assign Eta', N'CONFIRMED', NULL, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000007, 'FE030200-EEEE-4EEE-8EEE-000000000007', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000007, 'FE030200-EEEE-4EEE-8EEE-000000000007', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000007, 'FE030200-EEEE-4EEE-8EEE-000000000007', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE000000000008 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s22@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000008 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s23@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000008 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s24@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000008', @now, N'test.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000008, N'Assign Theta', N'CONFIRMED', NULL, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000008, 'FE030200-EEEE-4EEE-8EEE-000000000008', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000008, 'FE030200-EEEE-4EEE-8EEE-000000000008', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000008, 'FE030200-EEEE-4EEE-8EEE-000000000008', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE000000000009 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s25@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000009 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s26@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000009 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s27@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000009', @now, N'test.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000009, N'Assign Iota', N'CONFIRMED', NULL, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000009, 'FE030200-EEEE-4EEE-8EEE-000000000009', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000009, 'FE030200-EEEE-4EEE-8EEE-000000000009', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000009, 'FE030200-EEEE-4EEE-8EEE-000000000009', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE00000000000A UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s28@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE00000000000A UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s29@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE00000000000A UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.assign.s30@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-00000000000A', @now, N'test.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE00000000000A, N'Assign Kappa', N'CONFIRMED', NULL, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE00000000000A, 'FE030200-EEEE-4EEE-8EEE-00000000000A', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE00000000000A, 'FE030200-EEEE-4EEE-8EEE-00000000000A', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE00000000000A, 'FE030200-EEEE-4EEE-8EEE-00000000000A', 'FE030100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO mentor_teams (id, created_at, created_by, assigned_at, mentor_user_id, team_id)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, @mentor1Id, 'FE030200-EEEE-4EEE-8EEE-000000000001');

-- ========== 4) Submission phase ==========
INSERT INTO hackathon_events (id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at,
  avatar_url, score_scale_max) VALUES (
  'FE040100-EEEE-4EEE-8EEE-000000000001', N'Test 4 - Submission Phase (Prelim Open)', N'Summer', 2026,
  DATEADD(DAY, -1, @today), DATEADD(DAY, 14, @today),
  DATEADD(DAY, -40, @today), DATEADD(DAY, -5, @today),
  N'ACTIVE with 10 teams; 6 teams fully submitted (Slide+GitHub+Other link+file); 4 teams not started.', N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
  3, 5, 4, 8, @templateId, N'ACTIVE', 0, @coordId, N'test.coord@fpt.edu.vn', @now, @now, NULL, 100);
INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, created_at, updated_at, created_by)
VALUES ('FE040400-EEEE-4EEE-8EEE-000000000001', 'FE040100-EEEE-4EEE-8EEE-000000000001', N'Submission Track', N'Test track', NULL, N'OPEN', NULL, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, min_judges_per_round, created_at, updated_at, created_by) VALUES
  ('FE040300-EEEE-4EEE-8EEE-000000000001', 'FE040100-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(HOUR,-6,@now), DATEADD(DAY,5,@now), DATEADD(HOUR,-2,DATEADD(DAY,3,@now)), DATEADD(DAY,3,@now), DATEADD(DAY,5,@now), 2, N'PER_TRACK_TOP_N', 40, 2, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE040300-EEEE-4EEE-8EEE-000000000002', 'FE040100-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', N'FINAL', DATEADD(DAY,6,@now), DATEADD(DAY,8,@now), NULL, DATEADD(DAY,6,@now), DATEADD(DAY,8,@now), 4, N'FINALIST_POOL', 60, 2, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE040600-EEEE-4EEE-8EEE-000000000001', 'FE040300-EEEE-4EEE-8EEE-000000000001', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE040600-EEEE-4EEE-8EEE-000000000002', 'FE040300-EEEE-4EEE-8EEE-000000000001', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE040600-EEEE-4EEE-8EEE-000000000003', 'FE040300-EEEE-4EEE-8EEE-000000000001', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE040600-EEEE-4EEE-8EEE-000000000004', 'FE040300-EEEE-4EEE-8EEE-000000000002', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE040600-EEEE-4EEE-8EEE-000000000005', 'FE040300-EEEE-4EEE-8EEE-000000000002', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE040600-EEEE-4EEE-8EEE-000000000006', 'FE040300-EEEE-4EEE-8EEE-000000000002', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, N'test.coord@fpt.edu.vn', @now, 'FE040100-EEEE-4EEE-8EEE-000000000001', N'APPROVED', u.id, 1, 1
FROM users u WHERE u.email LIKE N'test.sub.s%@fpt.edu.vn';
DECLARE @L_FE040200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s01@fpt.edu.vn');
DECLARE @M2_FE040200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s02@fpt.edu.vn');
DECLARE @M3_FE040200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s03@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE040200-EEEE-4EEE-8EEE-000000000001', @now, N'test.coord@fpt.edu.vn', 'FE040100-EEEE-4EEE-8EEE-000000000001', @L_FE040200EEEE4EEE8EEE000000000001, N'Submit Alpha', N'CONFIRMED', 'FE040400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE040200EEEE4EEE8EEE000000000001, 'FE040200-EEEE-4EEE-8EEE-000000000001', 'FE040100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE040200EEEE4EEE8EEE000000000001, 'FE040200-EEEE-4EEE-8EEE-000000000001', 'FE040100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE040200EEEE4EEE8EEE000000000001, 'FE040200-EEEE-4EEE-8EEE-000000000001', 'FE040100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE040200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s04@fpt.edu.vn');
DECLARE @M2_FE040200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s05@fpt.edu.vn');
DECLARE @M3_FE040200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s06@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE040200-EEEE-4EEE-8EEE-000000000002', @now, N'test.coord@fpt.edu.vn', 'FE040100-EEEE-4EEE-8EEE-000000000001', @L_FE040200EEEE4EEE8EEE000000000002, N'Submit Beta', N'CONFIRMED', 'FE040400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE040200EEEE4EEE8EEE000000000002, 'FE040200-EEEE-4EEE-8EEE-000000000002', 'FE040100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE040200EEEE4EEE8EEE000000000002, 'FE040200-EEEE-4EEE-8EEE-000000000002', 'FE040100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE040200EEEE4EEE8EEE000000000002, 'FE040200-EEEE-4EEE-8EEE-000000000002', 'FE040100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE040200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s07@fpt.edu.vn');
DECLARE @M2_FE040200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s08@fpt.edu.vn');
DECLARE @M3_FE040200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s09@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE040200-EEEE-4EEE-8EEE-000000000003', @now, N'test.coord@fpt.edu.vn', 'FE040100-EEEE-4EEE-8EEE-000000000001', @L_FE040200EEEE4EEE8EEE000000000003, N'Submit Gamma', N'CONFIRMED', 'FE040400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE040200EEEE4EEE8EEE000000000003, 'FE040200-EEEE-4EEE-8EEE-000000000003', 'FE040100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE040200EEEE4EEE8EEE000000000003, 'FE040200-EEEE-4EEE-8EEE-000000000003', 'FE040100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE040200EEEE4EEE8EEE000000000003, 'FE040200-EEEE-4EEE-8EEE-000000000003', 'FE040100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE040200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s10@fpt.edu.vn');
DECLARE @M2_FE040200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s11@fpt.edu.vn');
DECLARE @M3_FE040200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s12@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE040200-EEEE-4EEE-8EEE-000000000004', @now, N'test.coord@fpt.edu.vn', 'FE040100-EEEE-4EEE-8EEE-000000000001', @L_FE040200EEEE4EEE8EEE000000000004, N'Submit Delta', N'CONFIRMED', 'FE040400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE040200EEEE4EEE8EEE000000000004, 'FE040200-EEEE-4EEE-8EEE-000000000004', 'FE040100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE040200EEEE4EEE8EEE000000000004, 'FE040200-EEEE-4EEE-8EEE-000000000004', 'FE040100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE040200EEEE4EEE8EEE000000000004, 'FE040200-EEEE-4EEE-8EEE-000000000004', 'FE040100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE040200EEEE4EEE8EEE000000000005 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s13@fpt.edu.vn');
DECLARE @M2_FE040200EEEE4EEE8EEE000000000005 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s14@fpt.edu.vn');
DECLARE @M3_FE040200EEEE4EEE8EEE000000000005 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s15@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE040200-EEEE-4EEE-8EEE-000000000005', @now, N'test.coord@fpt.edu.vn', 'FE040100-EEEE-4EEE-8EEE-000000000001', @L_FE040200EEEE4EEE8EEE000000000005, N'Submit Epsilon', N'CONFIRMED', 'FE040400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE040200EEEE4EEE8EEE000000000005, 'FE040200-EEEE-4EEE-8EEE-000000000005', 'FE040100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE040200EEEE4EEE8EEE000000000005, 'FE040200-EEEE-4EEE-8EEE-000000000005', 'FE040100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE040200EEEE4EEE8EEE000000000005, 'FE040200-EEEE-4EEE-8EEE-000000000005', 'FE040100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE040200EEEE4EEE8EEE000000000006 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s16@fpt.edu.vn');
DECLARE @M2_FE040200EEEE4EEE8EEE000000000006 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s17@fpt.edu.vn');
DECLARE @M3_FE040200EEEE4EEE8EEE000000000006 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s18@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE040200-EEEE-4EEE-8EEE-000000000006', @now, N'test.coord@fpt.edu.vn', 'FE040100-EEEE-4EEE-8EEE-000000000001', @L_FE040200EEEE4EEE8EEE000000000006, N'Submit Zeta', N'CONFIRMED', 'FE040400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE040200EEEE4EEE8EEE000000000006, 'FE040200-EEEE-4EEE-8EEE-000000000006', 'FE040100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE040200EEEE4EEE8EEE000000000006, 'FE040200-EEEE-4EEE-8EEE-000000000006', 'FE040100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE040200EEEE4EEE8EEE000000000006, 'FE040200-EEEE-4EEE-8EEE-000000000006', 'FE040100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE040200EEEE4EEE8EEE000000000007 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s19@fpt.edu.vn');
DECLARE @M2_FE040200EEEE4EEE8EEE000000000007 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s20@fpt.edu.vn');
DECLARE @M3_FE040200EEEE4EEE8EEE000000000007 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s21@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE040200-EEEE-4EEE-8EEE-000000000007', @now, N'test.coord@fpt.edu.vn', 'FE040100-EEEE-4EEE-8EEE-000000000001', @L_FE040200EEEE4EEE8EEE000000000007, N'Submit Eta', N'CONFIRMED', 'FE040400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE040200EEEE4EEE8EEE000000000007, 'FE040200-EEEE-4EEE-8EEE-000000000007', 'FE040100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE040200EEEE4EEE8EEE000000000007, 'FE040200-EEEE-4EEE-8EEE-000000000007', 'FE040100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE040200EEEE4EEE8EEE000000000007, 'FE040200-EEEE-4EEE-8EEE-000000000007', 'FE040100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE040200EEEE4EEE8EEE000000000008 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s22@fpt.edu.vn');
DECLARE @M2_FE040200EEEE4EEE8EEE000000000008 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s23@fpt.edu.vn');
DECLARE @M3_FE040200EEEE4EEE8EEE000000000008 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s24@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE040200-EEEE-4EEE-8EEE-000000000008', @now, N'test.coord@fpt.edu.vn', 'FE040100-EEEE-4EEE-8EEE-000000000001', @L_FE040200EEEE4EEE8EEE000000000008, N'Submit Theta', N'CONFIRMED', 'FE040400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE040200EEEE4EEE8EEE000000000008, 'FE040200-EEEE-4EEE-8EEE-000000000008', 'FE040100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE040200EEEE4EEE8EEE000000000008, 'FE040200-EEEE-4EEE-8EEE-000000000008', 'FE040100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE040200EEEE4EEE8EEE000000000008, 'FE040200-EEEE-4EEE-8EEE-000000000008', 'FE040100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE040200EEEE4EEE8EEE000000000009 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s25@fpt.edu.vn');
DECLARE @M2_FE040200EEEE4EEE8EEE000000000009 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s26@fpt.edu.vn');
DECLARE @M3_FE040200EEEE4EEE8EEE000000000009 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s27@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE040200-EEEE-4EEE-8EEE-000000000009', @now, N'test.coord@fpt.edu.vn', 'FE040100-EEEE-4EEE-8EEE-000000000001', @L_FE040200EEEE4EEE8EEE000000000009, N'Submit Iota', N'CONFIRMED', 'FE040400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE040200EEEE4EEE8EEE000000000009, 'FE040200-EEEE-4EEE-8EEE-000000000009', 'FE040100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE040200EEEE4EEE8EEE000000000009, 'FE040200-EEEE-4EEE-8EEE-000000000009', 'FE040100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE040200EEEE4EEE8EEE000000000009, 'FE040200-EEEE-4EEE-8EEE-000000000009', 'FE040100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE040200EEEE4EEE8EEE00000000000A UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s28@fpt.edu.vn');
DECLARE @M2_FE040200EEEE4EEE8EEE00000000000A UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s29@fpt.edu.vn');
DECLARE @M3_FE040200EEEE4EEE8EEE00000000000A UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.sub.s30@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE040200-EEEE-4EEE-8EEE-00000000000A', @now, N'test.coord@fpt.edu.vn', 'FE040100-EEEE-4EEE-8EEE-000000000001', @L_FE040200EEEE4EEE8EEE00000000000A, N'Submit Kappa', N'CONFIRMED', 'FE040400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE040200EEEE4EEE8EEE00000000000A, 'FE040200-EEEE-4EEE-8EEE-00000000000A', 'FE040100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE040200EEEE4EEE8EEE00000000000A, 'FE040200-EEEE-4EEE-8EEE-00000000000A', 'FE040100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE040200EEEE4EEE8EEE00000000000A, 'FE040200-EEEE-4EEE-8EEE-00000000000A', 'FE040100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at, created_by)
VALUES (NEWID(), 'FE040100-EEEE-4EEE-8EEE-000000000001', @mentor1Id, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE040500-EEEE-4EEE-8EEE-000000000001', @now, N'test.coord@fpt.edu.vn', NULL, 'FE040300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'test.sub.s01@fpt.edu.vn'), 'FE040200-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE040700-EEEE-4EEE-8EEE-000000000001', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://docs.google.com/document/d/1lrOba5QRuUMF5JogHsgUnx7rTOawC9obxPZghtgN08U/edit?pli=1&tab=t.0', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', DATEADD(HOUR,-1,@now), 1, 'FE040500-EEEE-4EEE-8EEE-000000000001');
UPDATE submissions SET current_version_id='FE040700-EEEE-4EEE-8EEE-000000000001' WHERE id='FE040500-EEEE-4EEE-8EEE-000000000001';
INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)
VALUES ('FE040900-EEEE-4EEE-8EEE-000000000001', @now, N'test.coord@fpt.edu.vn', N'Blue Modern Artificial Intelligence Presentation.pdf', 1444161, N'/api/files/submissions/seed/Blue_Modern_Artificial_Intelligence_Presentation.pdf', NULL, N'application/pdf', 'FE040700-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE040500-EEEE-4EEE-8EEE-000000000002', @now, N'test.coord@fpt.edu.vn', NULL, 'FE040300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'test.sub.s04@fpt.edu.vn'), 'FE040200-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE040700-EEEE-4EEE-8EEE-000000000002', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://docs.google.com/document/d/1lrOba5QRuUMF5JogHsgUnx7rTOawC9obxPZghtgN08U/edit?pli=1&tab=t.0', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', DATEADD(HOUR,-2,@now), 1, 'FE040500-EEEE-4EEE-8EEE-000000000002');
UPDATE submissions SET current_version_id='FE040700-EEEE-4EEE-8EEE-000000000002' WHERE id='FE040500-EEEE-4EEE-8EEE-000000000002';
INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)
VALUES ('FE040900-EEEE-4EEE-8EEE-000000000002', @now, N'test.coord@fpt.edu.vn', N'Blue Modern Artificial Intelligence Presentation.pdf', 1444161, N'/api/files/submissions/seed/Blue_Modern_Artificial_Intelligence_Presentation.pdf', NULL, N'application/pdf', 'FE040700-EEEE-4EEE-8EEE-000000000002');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE040500-EEEE-4EEE-8EEE-000000000003', @now, N'test.coord@fpt.edu.vn', NULL, 'FE040300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'test.sub.s07@fpt.edu.vn'), 'FE040200-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE040700-EEEE-4EEE-8EEE-000000000003', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://docs.google.com/document/d/1lrOba5QRuUMF5JogHsgUnx7rTOawC9obxPZghtgN08U/edit?pli=1&tab=t.0', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', DATEADD(HOUR,-3,@now), 1, 'FE040500-EEEE-4EEE-8EEE-000000000003');
UPDATE submissions SET current_version_id='FE040700-EEEE-4EEE-8EEE-000000000003' WHERE id='FE040500-EEEE-4EEE-8EEE-000000000003';
INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)
VALUES ('FE040900-EEEE-4EEE-8EEE-000000000003', @now, N'test.coord@fpt.edu.vn', N'Blue Modern Artificial Intelligence Presentation.pdf', 1444161, N'/api/files/submissions/seed/Blue_Modern_Artificial_Intelligence_Presentation.pdf', NULL, N'application/pdf', 'FE040700-EEEE-4EEE-8EEE-000000000003');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE040500-EEEE-4EEE-8EEE-000000000004', @now, N'test.coord@fpt.edu.vn', NULL, 'FE040300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'test.sub.s10@fpt.edu.vn'), 'FE040200-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE040700-EEEE-4EEE-8EEE-000000000004', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://docs.google.com/document/d/1lrOba5QRuUMF5JogHsgUnx7rTOawC9obxPZghtgN08U/edit?pli=1&tab=t.0', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', DATEADD(HOUR,-4,@now), 1, 'FE040500-EEEE-4EEE-8EEE-000000000004');
UPDATE submissions SET current_version_id='FE040700-EEEE-4EEE-8EEE-000000000004' WHERE id='FE040500-EEEE-4EEE-8EEE-000000000004';
INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)
VALUES ('FE040900-EEEE-4EEE-8EEE-000000000004', @now, N'test.coord@fpt.edu.vn', N'Blue Modern Artificial Intelligence Presentation.pdf', 1444161, N'/api/files/submissions/seed/Blue_Modern_Artificial_Intelligence_Presentation.pdf', NULL, N'application/pdf', 'FE040700-EEEE-4EEE-8EEE-000000000004');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE040500-EEEE-4EEE-8EEE-000000000005', @now, N'test.coord@fpt.edu.vn', NULL, 'FE040300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'test.sub.s13@fpt.edu.vn'), 'FE040200-EEEE-4EEE-8EEE-000000000005', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE040700-EEEE-4EEE-8EEE-000000000005', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://docs.google.com/document/d/1lrOba5QRuUMF5JogHsgUnx7rTOawC9obxPZghtgN08U/edit?pli=1&tab=t.0', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', DATEADD(HOUR,-5,@now), 1, 'FE040500-EEEE-4EEE-8EEE-000000000005');
UPDATE submissions SET current_version_id='FE040700-EEEE-4EEE-8EEE-000000000005' WHERE id='FE040500-EEEE-4EEE-8EEE-000000000005';
INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)
VALUES ('FE040900-EEEE-4EEE-8EEE-000000000005', @now, N'test.coord@fpt.edu.vn', N'Blue Modern Artificial Intelligence Presentation.pdf', 1444161, N'/api/files/submissions/seed/Blue_Modern_Artificial_Intelligence_Presentation.pdf', NULL, N'application/pdf', 'FE040700-EEEE-4EEE-8EEE-000000000005');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE040500-EEEE-4EEE-8EEE-000000000006', @now, N'test.coord@fpt.edu.vn', NULL, 'FE040300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'test.sub.s16@fpt.edu.vn'), 'FE040200-EEEE-4EEE-8EEE-000000000006', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE040700-EEEE-4EEE-8EEE-000000000006', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://docs.google.com/document/d/1lrOba5QRuUMF5JogHsgUnx7rTOawC9obxPZghtgN08U/edit?pli=1&tab=t.0', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', DATEADD(HOUR,-6,@now), 1, 'FE040500-EEEE-4EEE-8EEE-000000000006');
UPDATE submissions SET current_version_id='FE040700-EEEE-4EEE-8EEE-000000000006' WHERE id='FE040500-EEEE-4EEE-8EEE-000000000006';
INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)
VALUES ('FE040900-EEEE-4EEE-8EEE-000000000006', @now, N'test.coord@fpt.edu.vn', N'Blue Modern Artificial Intelligence Presentation.pdf', 1444161, N'/api/files/submissions/seed/Blue_Modern_Artificial_Intelligence_Presentation.pdf', NULL, N'application/pdf', 'FE040700-EEEE-4EEE-8EEE-000000000006');

-- ========== 5) Near deadline alert ==========
INSERT INTO hackathon_events (id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at,
  avatar_url, score_scale_max) VALUES (
  'FE050100-EEEE-4EEE-8EEE-000000000001', N'Test 5 - Near Deadline Alert (Not Submitted)', N'Summer', 2026,
  DATEADD(DAY, -1, @today), DATEADD(DAY, 3, @today),
  DATEADD(DAY, -20, @today), DATEADD(DAY, -2, @today),
  N'ACTIVE prelim; 10 teams; 6 submitted full; 4 not started; deadline ~3h; alert on Eta (not submitted).', N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
  3, 5, 4, 8, @templateId, N'ACTIVE', 0, @coordId, N'test.coord@fpt.edu.vn', @now, @now, NULL, 100);
INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, created_at, updated_at, created_by)
VALUES ('FE050400-EEEE-4EEE-8EEE-000000000001', 'FE050100-EEEE-4EEE-8EEE-000000000001', N'Alert Track', N'Test track', NULL, N'OPEN', NULL, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, min_judges_per_round, created_at, updated_at, created_by) VALUES
  ('FE050300-EEEE-4EEE-8EEE-000000000001', 'FE050100-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(HOUR,-2,@now), DATEADD(DAY,2,@now), DATEADD(HOUR,-2,DATEADD(HOUR,3,@now)), DATEADD(HOUR,3,@now), DATEADD(DAY,2,@now), 2, N'PER_TRACK_TOP_N', 40, 2, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE050300-EEEE-4EEE-8EEE-000000000002', 'FE050100-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', N'FINAL', DATEADD(DAY,3,@now), DATEADD(DAY,5,@now), NULL, DATEADD(DAY,3,@now), DATEADD(DAY,5,@now), 4, N'FINALIST_POOL', 60, 2, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE050600-EEEE-4EEE-8EEE-000000000001', 'FE050300-EEEE-4EEE-8EEE-000000000001', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE050600-EEEE-4EEE-8EEE-000000000002', 'FE050300-EEEE-4EEE-8EEE-000000000001', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE050600-EEEE-4EEE-8EEE-000000000003', 'FE050300-EEEE-4EEE-8EEE-000000000001', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE050600-EEEE-4EEE-8EEE-000000000004', 'FE050300-EEEE-4EEE-8EEE-000000000002', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE050600-EEEE-4EEE-8EEE-000000000005', 'FE050300-EEEE-4EEE-8EEE-000000000002', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE050600-EEEE-4EEE-8EEE-000000000006', 'FE050300-EEEE-4EEE-8EEE-000000000002', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, N'test.coord@fpt.edu.vn', @now, 'FE050100-EEEE-4EEE-8EEE-000000000001', N'APPROVED', u.id, 1, 1
FROM users u WHERE u.email LIKE N'test.alert.s%@fpt.edu.vn';
DECLARE @L_FE050200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s01@fpt.edu.vn');
DECLARE @M2_FE050200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s02@fpt.edu.vn');
DECLARE @M3_FE050200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s03@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE050200-EEEE-4EEE-8EEE-000000000001', @now, N'test.coord@fpt.edu.vn', 'FE050100-EEEE-4EEE-8EEE-000000000001', @L_FE050200EEEE4EEE8EEE000000000001, N'Alert Alpha', N'CONFIRMED', 'FE050400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE050200EEEE4EEE8EEE000000000001, 'FE050200-EEEE-4EEE-8EEE-000000000001', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE050200EEEE4EEE8EEE000000000001, 'FE050200-EEEE-4EEE-8EEE-000000000001', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE050200EEEE4EEE8EEE000000000001, 'FE050200-EEEE-4EEE-8EEE-000000000001', 'FE050100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE050200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s04@fpt.edu.vn');
DECLARE @M2_FE050200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s05@fpt.edu.vn');
DECLARE @M3_FE050200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s06@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE050200-EEEE-4EEE-8EEE-000000000002', @now, N'test.coord@fpt.edu.vn', 'FE050100-EEEE-4EEE-8EEE-000000000001', @L_FE050200EEEE4EEE8EEE000000000002, N'Alert Beta', N'CONFIRMED', 'FE050400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE050200EEEE4EEE8EEE000000000002, 'FE050200-EEEE-4EEE-8EEE-000000000002', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE050200EEEE4EEE8EEE000000000002, 'FE050200-EEEE-4EEE-8EEE-000000000002', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE050200EEEE4EEE8EEE000000000002, 'FE050200-EEEE-4EEE-8EEE-000000000002', 'FE050100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE050200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s07@fpt.edu.vn');
DECLARE @M2_FE050200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s08@fpt.edu.vn');
DECLARE @M3_FE050200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s09@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE050200-EEEE-4EEE-8EEE-000000000003', @now, N'test.coord@fpt.edu.vn', 'FE050100-EEEE-4EEE-8EEE-000000000001', @L_FE050200EEEE4EEE8EEE000000000003, N'Alert Gamma', N'CONFIRMED', 'FE050400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE050200EEEE4EEE8EEE000000000003, 'FE050200-EEEE-4EEE-8EEE-000000000003', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE050200EEEE4EEE8EEE000000000003, 'FE050200-EEEE-4EEE-8EEE-000000000003', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE050200EEEE4EEE8EEE000000000003, 'FE050200-EEEE-4EEE-8EEE-000000000003', 'FE050100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE050200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s10@fpt.edu.vn');
DECLARE @M2_FE050200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s11@fpt.edu.vn');
DECLARE @M3_FE050200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s12@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE050200-EEEE-4EEE-8EEE-000000000004', @now, N'test.coord@fpt.edu.vn', 'FE050100-EEEE-4EEE-8EEE-000000000001', @L_FE050200EEEE4EEE8EEE000000000004, N'Alert Delta', N'CONFIRMED', 'FE050400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE050200EEEE4EEE8EEE000000000004, 'FE050200-EEEE-4EEE-8EEE-000000000004', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE050200EEEE4EEE8EEE000000000004, 'FE050200-EEEE-4EEE-8EEE-000000000004', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE050200EEEE4EEE8EEE000000000004, 'FE050200-EEEE-4EEE-8EEE-000000000004', 'FE050100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE050200EEEE4EEE8EEE000000000005 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s13@fpt.edu.vn');
DECLARE @M2_FE050200EEEE4EEE8EEE000000000005 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s14@fpt.edu.vn');
DECLARE @M3_FE050200EEEE4EEE8EEE000000000005 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s15@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE050200-EEEE-4EEE-8EEE-000000000005', @now, N'test.coord@fpt.edu.vn', 'FE050100-EEEE-4EEE-8EEE-000000000001', @L_FE050200EEEE4EEE8EEE000000000005, N'Alert Epsilon', N'CONFIRMED', 'FE050400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE050200EEEE4EEE8EEE000000000005, 'FE050200-EEEE-4EEE-8EEE-000000000005', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE050200EEEE4EEE8EEE000000000005, 'FE050200-EEEE-4EEE-8EEE-000000000005', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE050200EEEE4EEE8EEE000000000005, 'FE050200-EEEE-4EEE-8EEE-000000000005', 'FE050100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE050200EEEE4EEE8EEE000000000006 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s16@fpt.edu.vn');
DECLARE @M2_FE050200EEEE4EEE8EEE000000000006 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s17@fpt.edu.vn');
DECLARE @M3_FE050200EEEE4EEE8EEE000000000006 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s18@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE050200-EEEE-4EEE-8EEE-000000000006', @now, N'test.coord@fpt.edu.vn', 'FE050100-EEEE-4EEE-8EEE-000000000001', @L_FE050200EEEE4EEE8EEE000000000006, N'Alert Zeta', N'CONFIRMED', 'FE050400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE050200EEEE4EEE8EEE000000000006, 'FE050200-EEEE-4EEE-8EEE-000000000006', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE050200EEEE4EEE8EEE000000000006, 'FE050200-EEEE-4EEE-8EEE-000000000006', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE050200EEEE4EEE8EEE000000000006, 'FE050200-EEEE-4EEE-8EEE-000000000006', 'FE050100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE050200EEEE4EEE8EEE000000000007 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s19@fpt.edu.vn');
DECLARE @M2_FE050200EEEE4EEE8EEE000000000007 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s20@fpt.edu.vn');
DECLARE @M3_FE050200EEEE4EEE8EEE000000000007 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s21@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE050200-EEEE-4EEE-8EEE-000000000007', @now, N'test.coord@fpt.edu.vn', 'FE050100-EEEE-4EEE-8EEE-000000000001', @L_FE050200EEEE4EEE8EEE000000000007, N'Alert Eta', N'CONFIRMED', 'FE050400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE050200EEEE4EEE8EEE000000000007, 'FE050200-EEEE-4EEE-8EEE-000000000007', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE050200EEEE4EEE8EEE000000000007, 'FE050200-EEEE-4EEE-8EEE-000000000007', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE050200EEEE4EEE8EEE000000000007, 'FE050200-EEEE-4EEE-8EEE-000000000007', 'FE050100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE050200EEEE4EEE8EEE000000000008 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s22@fpt.edu.vn');
DECLARE @M2_FE050200EEEE4EEE8EEE000000000008 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s23@fpt.edu.vn');
DECLARE @M3_FE050200EEEE4EEE8EEE000000000008 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s24@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE050200-EEEE-4EEE-8EEE-000000000008', @now, N'test.coord@fpt.edu.vn', 'FE050100-EEEE-4EEE-8EEE-000000000001', @L_FE050200EEEE4EEE8EEE000000000008, N'Alert Theta', N'CONFIRMED', 'FE050400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE050200EEEE4EEE8EEE000000000008, 'FE050200-EEEE-4EEE-8EEE-000000000008', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE050200EEEE4EEE8EEE000000000008, 'FE050200-EEEE-4EEE-8EEE-000000000008', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE050200EEEE4EEE8EEE000000000008, 'FE050200-EEEE-4EEE-8EEE-000000000008', 'FE050100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE050200EEEE4EEE8EEE000000000009 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s25@fpt.edu.vn');
DECLARE @M2_FE050200EEEE4EEE8EEE000000000009 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s26@fpt.edu.vn');
DECLARE @M3_FE050200EEEE4EEE8EEE000000000009 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s27@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE050200-EEEE-4EEE-8EEE-000000000009', @now, N'test.coord@fpt.edu.vn', 'FE050100-EEEE-4EEE-8EEE-000000000001', @L_FE050200EEEE4EEE8EEE000000000009, N'Alert Iota', N'CONFIRMED', 'FE050400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE050200EEEE4EEE8EEE000000000009, 'FE050200-EEEE-4EEE-8EEE-000000000009', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE050200EEEE4EEE8EEE000000000009, 'FE050200-EEEE-4EEE-8EEE-000000000009', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE050200EEEE4EEE8EEE000000000009, 'FE050200-EEEE-4EEE-8EEE-000000000009', 'FE050100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE050200EEEE4EEE8EEE00000000000A UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s28@fpt.edu.vn');
DECLARE @M2_FE050200EEEE4EEE8EEE00000000000A UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s29@fpt.edu.vn');
DECLARE @M3_FE050200EEEE4EEE8EEE00000000000A UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.alert.s30@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE050200-EEEE-4EEE-8EEE-00000000000A', @now, N'test.coord@fpt.edu.vn', 'FE050100-EEEE-4EEE-8EEE-000000000001', @L_FE050200EEEE4EEE8EEE00000000000A, N'Alert Kappa', N'CONFIRMED', 'FE050400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE050200EEEE4EEE8EEE00000000000A, 'FE050200-EEEE-4EEE-8EEE-00000000000A', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE050200EEEE4EEE8EEE00000000000A, 'FE050200-EEEE-4EEE-8EEE-00000000000A', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE050200EEEE4EEE8EEE00000000000A, 'FE050200-EEEE-4EEE-8EEE-00000000000A', 'FE050100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at, created_by)
VALUES (NEWID(), 'FE050100-EEEE-4EEE-8EEE-000000000001', @mentor1Id, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO mentor_teams (id, created_at, created_by, assigned_at, mentor_user_id, team_id)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, @mentor1Id, 'FE050200-EEEE-4EEE-8EEE-000000000007');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE050500-EEEE-4EEE-8EEE-000000000001', @now, N'test.coord@fpt.edu.vn', NULL, 'FE050300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'test.alert.s01@fpt.edu.vn'), 'FE050200-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE050700-EEEE-4EEE-8EEE-000000000001', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://docs.google.com/document/d/1lrOba5QRuUMF5JogHsgUnx7rTOawC9obxPZghtgN08U/edit?pli=1&tab=t.0', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', DATEADD(HOUR,-1,@now), 1, 'FE050500-EEEE-4EEE-8EEE-000000000001');
UPDATE submissions SET current_version_id='FE050700-EEEE-4EEE-8EEE-000000000001' WHERE id='FE050500-EEEE-4EEE-8EEE-000000000001';
INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)
VALUES ('FE050900-EEEE-4EEE-8EEE-000000000001', @now, N'test.coord@fpt.edu.vn', N'Blue Modern Artificial Intelligence Presentation.pdf', 1444161, N'/api/files/submissions/seed/Blue_Modern_Artificial_Intelligence_Presentation.pdf', NULL, N'application/pdf', 'FE050700-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE050500-EEEE-4EEE-8EEE-000000000002', @now, N'test.coord@fpt.edu.vn', NULL, 'FE050300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'test.alert.s04@fpt.edu.vn'), 'FE050200-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE050700-EEEE-4EEE-8EEE-000000000002', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://docs.google.com/document/d/1lrOba5QRuUMF5JogHsgUnx7rTOawC9obxPZghtgN08U/edit?pli=1&tab=t.0', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', DATEADD(HOUR,-2,@now), 1, 'FE050500-EEEE-4EEE-8EEE-000000000002');
UPDATE submissions SET current_version_id='FE050700-EEEE-4EEE-8EEE-000000000002' WHERE id='FE050500-EEEE-4EEE-8EEE-000000000002';
INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)
VALUES ('FE050900-EEEE-4EEE-8EEE-000000000002', @now, N'test.coord@fpt.edu.vn', N'Blue Modern Artificial Intelligence Presentation.pdf', 1444161, N'/api/files/submissions/seed/Blue_Modern_Artificial_Intelligence_Presentation.pdf', NULL, N'application/pdf', 'FE050700-EEEE-4EEE-8EEE-000000000002');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE050500-EEEE-4EEE-8EEE-000000000003', @now, N'test.coord@fpt.edu.vn', NULL, 'FE050300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'test.alert.s07@fpt.edu.vn'), 'FE050200-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE050700-EEEE-4EEE-8EEE-000000000003', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://docs.google.com/document/d/1lrOba5QRuUMF5JogHsgUnx7rTOawC9obxPZghtgN08U/edit?pli=1&tab=t.0', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', DATEADD(HOUR,-3,@now), 1, 'FE050500-EEEE-4EEE-8EEE-000000000003');
UPDATE submissions SET current_version_id='FE050700-EEEE-4EEE-8EEE-000000000003' WHERE id='FE050500-EEEE-4EEE-8EEE-000000000003';
INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)
VALUES ('FE050900-EEEE-4EEE-8EEE-000000000003', @now, N'test.coord@fpt.edu.vn', N'Blue Modern Artificial Intelligence Presentation.pdf', 1444161, N'/api/files/submissions/seed/Blue_Modern_Artificial_Intelligence_Presentation.pdf', NULL, N'application/pdf', 'FE050700-EEEE-4EEE-8EEE-000000000003');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE050500-EEEE-4EEE-8EEE-000000000004', @now, N'test.coord@fpt.edu.vn', NULL, 'FE050300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'test.alert.s10@fpt.edu.vn'), 'FE050200-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE050700-EEEE-4EEE-8EEE-000000000004', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://docs.google.com/document/d/1lrOba5QRuUMF5JogHsgUnx7rTOawC9obxPZghtgN08U/edit?pli=1&tab=t.0', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', DATEADD(HOUR,-4,@now), 1, 'FE050500-EEEE-4EEE-8EEE-000000000004');
UPDATE submissions SET current_version_id='FE050700-EEEE-4EEE-8EEE-000000000004' WHERE id='FE050500-EEEE-4EEE-8EEE-000000000004';
INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)
VALUES ('FE050900-EEEE-4EEE-8EEE-000000000004', @now, N'test.coord@fpt.edu.vn', N'Blue Modern Artificial Intelligence Presentation.pdf', 1444161, N'/api/files/submissions/seed/Blue_Modern_Artificial_Intelligence_Presentation.pdf', NULL, N'application/pdf', 'FE050700-EEEE-4EEE-8EEE-000000000004');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE050500-EEEE-4EEE-8EEE-000000000005', @now, N'test.coord@fpt.edu.vn', NULL, 'FE050300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'test.alert.s13@fpt.edu.vn'), 'FE050200-EEEE-4EEE-8EEE-000000000005', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE050700-EEEE-4EEE-8EEE-000000000005', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://docs.google.com/document/d/1lrOba5QRuUMF5JogHsgUnx7rTOawC9obxPZghtgN08U/edit?pli=1&tab=t.0', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', DATEADD(HOUR,-5,@now), 1, 'FE050500-EEEE-4EEE-8EEE-000000000005');
UPDATE submissions SET current_version_id='FE050700-EEEE-4EEE-8EEE-000000000005' WHERE id='FE050500-EEEE-4EEE-8EEE-000000000005';
INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)
VALUES ('FE050900-EEEE-4EEE-8EEE-000000000005', @now, N'test.coord@fpt.edu.vn', N'Blue Modern Artificial Intelligence Presentation.pdf', 1444161, N'/api/files/submissions/seed/Blue_Modern_Artificial_Intelligence_Presentation.pdf', NULL, N'application/pdf', 'FE050700-EEEE-4EEE-8EEE-000000000005');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE050500-EEEE-4EEE-8EEE-000000000006', @now, N'test.coord@fpt.edu.vn', NULL, 'FE050300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'test.alert.s16@fpt.edu.vn'), 'FE050200-EEEE-4EEE-8EEE-000000000006', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE050700-EEEE-4EEE-8EEE-000000000006', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://docs.google.com/document/d/1lrOba5QRuUMF5JogHsgUnx7rTOawC9obxPZghtgN08U/edit?pli=1&tab=t.0', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', DATEADD(HOUR,-6,@now), 1, 'FE050500-EEEE-4EEE-8EEE-000000000006');
UPDATE submissions SET current_version_id='FE050700-EEEE-4EEE-8EEE-000000000006' WHERE id='FE050500-EEEE-4EEE-8EEE-000000000006';
INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)
VALUES ('FE050900-EEEE-4EEE-8EEE-000000000006', @now, N'test.coord@fpt.edu.vn', N'Blue Modern Artificial Intelligence Presentation.pdf', 1444161, N'/api/files/submissions/seed/Blue_Modern_Artificial_Intelligence_Presentation.pdf', NULL, N'application/pdf', 'FE050700-EEEE-4EEE-8EEE-000000000006');
IF OBJECT_ID(N'dbo.team_progress_alerts', N'U') IS NOT NULL
INSERT INTO team_progress_alerts (id, team_id, round_id, risk_level, reasons, last_alerted_at, created_at, updated_at)
VALUES ('FE051500-EEEE-4EEE-8EEE-000000000001', 'FE050200-EEEE-4EEE-8EEE-000000000007', 'FE050300-EEEE-4EEE-8EEE-000000000001', N'CRITICAL', N'NOT_STARTED', @now, @now, @now);
INSERT INTO notifications (id, created_at, message, reference_id, reference_type, title, type)
VALUES ('FE051900-EEEE-4EEE-8EEE-000000000001', @now, N'Team Alert Eta has not started submission and the deadline is approaching (NOT_STARTED).', 'FE050200-EEEE-4EEE-8EEE-000000000007', N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT');
INSERT INTO notification_recipients (id, created_at, channel, read_at, sent_at, user_id, notification_id) VALUES
  ('FE051A00-EEEE-4EEE-8EEE-000000000001', @now, N'IN_APP', NULL, @now, (SELECT id FROM users WHERE email=N'test.alert.s19@fpt.edu.vn'), 'FE051900-EEEE-4EEE-8EEE-000000000001'),
  ('FE051A00-EEEE-4EEE-8EEE-000000000002', @now, N'IN_APP', NULL, @now, @mentor1Id, 'FE051900-EEEE-4EEE-8EEE-000000000001'),
  ('FE051A00-EEEE-4EEE-8EEE-000000000003', @now, N'IN_APP', NULL, @now, @coordId, 'FE051900-EEEE-4EEE-8EEE-000000000001');

-- ========== 6) Scoring + deviation ==========
INSERT INTO hackathon_events (id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at,
  avatar_url, score_scale_max) VALUES (
  'FE060100-EEEE-4EEE-8EEE-000000000001', N'Test 6 - Scoring (1 Judge Pending / High Deviation)', N'Summer', 2026,
  DATEADD(DAY, -5, @today), DATEADD(DAY, 21, @today),
  DATEADD(DAY, -40, @today), DATEADD(DAY, -10, @today),
  N'10 teams. Judge1+2 scored HIGH; Judge3 pending — score low to trigger deviation review.', N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
  3, 5, 4, 8, @templateId, N'SCORING', 0, @coordId, N'test.coord@fpt.edu.vn', @now, @now, NULL, 100);
INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, created_at, updated_at, created_by)
VALUES ('FE060400-EEEE-4EEE-8EEE-000000000001', 'FE060100-EEEE-4EEE-8EEE-000000000001', N'Scoring Track', N'Test track', NULL, N'OPEN', NULL, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, min_judges_per_round, created_at, updated_at, created_by) VALUES
  ('FE060300-EEEE-4EEE-8EEE-000000000001', 'FE060100-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(DAY,-3,@now), DATEADD(DAY,10,@now), DATEADD(HOUR,-2,DATEADD(DAY,-1,@now)), DATEADD(DAY,-1,@now), DATEADD(DAY,10,@now), 2, N'PER_TRACK_TOP_N', 40, 2, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE060300-EEEE-4EEE-8EEE-000000000002', 'FE060100-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', N'FINAL', DATEADD(DAY,11,@now), DATEADD(DAY,14,@now), NULL, DATEADD(DAY,11,@now), DATEADD(DAY,14,@now), 4, N'FINALIST_POOL', 60, 2, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE060600-EEEE-4EEE-8EEE-000000000001', 'FE060300-EEEE-4EEE-8EEE-000000000001', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE060600-EEEE-4EEE-8EEE-000000000002', 'FE060300-EEEE-4EEE-8EEE-000000000001', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE060600-EEEE-4EEE-8EEE-000000000003', 'FE060300-EEEE-4EEE-8EEE-000000000001', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE060600-EEEE-4EEE-8EEE-000000000004', 'FE060300-EEEE-4EEE-8EEE-000000000002', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE060600-EEEE-4EEE-8EEE-000000000005', 'FE060300-EEEE-4EEE-8EEE-000000000002', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE060600-EEEE-4EEE-8EEE-000000000006', 'FE060300-EEEE-4EEE-8EEE-000000000002', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id, created_by) VALUES
  (NEWID(), @now, @now, @j1, 'FE060100-EEEE-4EEE-8EEE-000000000001', N'test.coord@fpt.edu.vn'),
  (NEWID(), @now, @now, @j2, 'FE060100-EEEE-4EEE-8EEE-000000000001', N'test.coord@fpt.edu.vn'),
  (NEWID(), @now, @now, @j3, 'FE060100-EEEE-4EEE-8EEE-000000000001', N'test.coord@fpt.edu.vn');
INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active, created_by) VALUES
  (NEWID(), @now, @now, @j1, 'FE060300-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1, N'test.coord@fpt.edu.vn'),
  (NEWID(), @now, @now, @j2, 'FE060300-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1, N'test.coord@fpt.edu.vn'),
  (NEWID(), @now, @now, @j3, 'FE060300-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1, N'test.coord@fpt.edu.vn');
INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, N'test.coord@fpt.edu.vn', @now, 'FE060100-EEEE-4EEE-8EEE-000000000001', N'APPROVED', u.id, 1, 1
FROM users u WHERE u.email LIKE N'test.score.s%@fpt.edu.vn';
DECLARE @L_FE060200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s01@fpt.edu.vn');
DECLARE @M2_FE060200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s02@fpt.edu.vn');
DECLARE @M3_FE060200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s03@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE060200-EEEE-4EEE-8EEE-000000000001', @now, N'test.coord@fpt.edu.vn', 'FE060100-EEEE-4EEE-8EEE-000000000001', @L_FE060200EEEE4EEE8EEE000000000001, N'Score Alpha', N'CONFIRMED', 'FE060400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE060200EEEE4EEE8EEE000000000001, 'FE060200-EEEE-4EEE-8EEE-000000000001', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE060200EEEE4EEE8EEE000000000001, 'FE060200-EEEE-4EEE-8EEE-000000000001', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE060200EEEE4EEE8EEE000000000001, 'FE060200-EEEE-4EEE-8EEE-000000000001', 'FE060100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE060500-EEEE-4EEE-8EEE-000000000001', @now, N'test.coord@fpt.edu.vn', NULL, 'FE060300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'test.score.s01@fpt.edu.vn'), 'FE060200-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE060700-EEEE-4EEE-8EEE-000000000001', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://docs.google.com/document/d/1lrOba5QRuUMF5JogHsgUnx7rTOawC9obxPZghtgN08U/edit?pli=1&tab=t.0', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', DATEADD(HOUR,-12,@now), 1, 'FE060500-EEEE-4EEE-8EEE-000000000001');
UPDATE submissions SET current_version_id='FE060700-EEEE-4EEE-8EEE-000000000001' WHERE id='FE060500-EEEE-4EEE-8EEE-000000000001';
INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)
VALUES ('FE060900-EEEE-4EEE-8EEE-000000000001', @now, N'test.coord@fpt.edu.vn', N'Blue Modern Artificial Intelligence Presentation.pdf', 1444161, N'/api/files/submissions/seed/Blue_Modern_Artificial_Intelligence_Presentation.pdf', NULL, N'application/pdf', 'FE060700-EEEE-4EEE-8EEE-000000000001');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-00000000000B', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j1, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 95, 'FE060800-EEEE-4EEE-8EEE-00000000000B'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 98, 'FE060800-EEEE-4EEE-8EEE-00000000000B'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 100, 'FE060800-EEEE-4EEE-8EEE-00000000000B');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-00000000000C', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j2, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 95, 'FE060800-EEEE-4EEE-8EEE-00000000000C'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 98, 'FE060800-EEEE-4EEE-8EEE-00000000000C'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 100, 'FE060800-EEEE-4EEE-8EEE-00000000000C');
DECLARE @L_FE060200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s04@fpt.edu.vn');
DECLARE @M2_FE060200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s05@fpt.edu.vn');
DECLARE @M3_FE060200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s06@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE060200-EEEE-4EEE-8EEE-000000000002', @now, N'test.coord@fpt.edu.vn', 'FE060100-EEEE-4EEE-8EEE-000000000001', @L_FE060200EEEE4EEE8EEE000000000002, N'Score Beta', N'CONFIRMED', 'FE060400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE060200EEEE4EEE8EEE000000000002, 'FE060200-EEEE-4EEE-8EEE-000000000002', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE060200EEEE4EEE8EEE000000000002, 'FE060200-EEEE-4EEE-8EEE-000000000002', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE060200EEEE4EEE8EEE000000000002, 'FE060200-EEEE-4EEE-8EEE-000000000002', 'FE060100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE060500-EEEE-4EEE-8EEE-000000000002', @now, N'test.coord@fpt.edu.vn', NULL, 'FE060300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'test.score.s04@fpt.edu.vn'), 'FE060200-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE060700-EEEE-4EEE-8EEE-000000000002', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://docs.google.com/document/d/1lrOba5QRuUMF5JogHsgUnx7rTOawC9obxPZghtgN08U/edit?pli=1&tab=t.0', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', DATEADD(HOUR,-12,@now), 1, 'FE060500-EEEE-4EEE-8EEE-000000000002');
UPDATE submissions SET current_version_id='FE060700-EEEE-4EEE-8EEE-000000000002' WHERE id='FE060500-EEEE-4EEE-8EEE-000000000002';
INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)
VALUES ('FE060900-EEEE-4EEE-8EEE-000000000002', @now, N'test.coord@fpt.edu.vn', N'Blue Modern Artificial Intelligence Presentation.pdf', 1444161, N'/api/files/submissions/seed/Blue_Modern_Artificial_Intelligence_Presentation.pdf', NULL, N'application/pdf', 'FE060700-EEEE-4EEE-8EEE-000000000002');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-000000000015', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j1, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 95, 'FE060800-EEEE-4EEE-8EEE-000000000015'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 98, 'FE060800-EEEE-4EEE-8EEE-000000000015'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 100, 'FE060800-EEEE-4EEE-8EEE-000000000015');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-000000000016', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j2, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 95, 'FE060800-EEEE-4EEE-8EEE-000000000016'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 98, 'FE060800-EEEE-4EEE-8EEE-000000000016'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 100, 'FE060800-EEEE-4EEE-8EEE-000000000016');
DECLARE @L_FE060200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s07@fpt.edu.vn');
DECLARE @M2_FE060200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s08@fpt.edu.vn');
DECLARE @M3_FE060200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s09@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE060200-EEEE-4EEE-8EEE-000000000003', @now, N'test.coord@fpt.edu.vn', 'FE060100-EEEE-4EEE-8EEE-000000000001', @L_FE060200EEEE4EEE8EEE000000000003, N'Score Gamma', N'CONFIRMED', 'FE060400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE060200EEEE4EEE8EEE000000000003, 'FE060200-EEEE-4EEE-8EEE-000000000003', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE060200EEEE4EEE8EEE000000000003, 'FE060200-EEEE-4EEE-8EEE-000000000003', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE060200EEEE4EEE8EEE000000000003, 'FE060200-EEEE-4EEE-8EEE-000000000003', 'FE060100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE060500-EEEE-4EEE-8EEE-000000000003', @now, N'test.coord@fpt.edu.vn', NULL, 'FE060300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'test.score.s07@fpt.edu.vn'), 'FE060200-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE060700-EEEE-4EEE-8EEE-000000000003', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://docs.google.com/document/d/1lrOba5QRuUMF5JogHsgUnx7rTOawC9obxPZghtgN08U/edit?pli=1&tab=t.0', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', DATEADD(HOUR,-12,@now), 1, 'FE060500-EEEE-4EEE-8EEE-000000000003');
UPDATE submissions SET current_version_id='FE060700-EEEE-4EEE-8EEE-000000000003' WHERE id='FE060500-EEEE-4EEE-8EEE-000000000003';
INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)
VALUES ('FE060900-EEEE-4EEE-8EEE-000000000003', @now, N'test.coord@fpt.edu.vn', N'Blue Modern Artificial Intelligence Presentation.pdf', 1444161, N'/api/files/submissions/seed/Blue_Modern_Artificial_Intelligence_Presentation.pdf', NULL, N'application/pdf', 'FE060700-EEEE-4EEE-8EEE-000000000003');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-00000000001F', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j1, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 95, 'FE060800-EEEE-4EEE-8EEE-00000000001F'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 98, 'FE060800-EEEE-4EEE-8EEE-00000000001F'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 100, 'FE060800-EEEE-4EEE-8EEE-00000000001F');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-000000000020', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j2, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 95, 'FE060800-EEEE-4EEE-8EEE-000000000020'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 98, 'FE060800-EEEE-4EEE-8EEE-000000000020'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 100, 'FE060800-EEEE-4EEE-8EEE-000000000020');
DECLARE @L_FE060200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s10@fpt.edu.vn');
DECLARE @M2_FE060200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s11@fpt.edu.vn');
DECLARE @M3_FE060200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s12@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE060200-EEEE-4EEE-8EEE-000000000004', @now, N'test.coord@fpt.edu.vn', 'FE060100-EEEE-4EEE-8EEE-000000000001', @L_FE060200EEEE4EEE8EEE000000000004, N'Score Delta', N'CONFIRMED', 'FE060400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE060200EEEE4EEE8EEE000000000004, 'FE060200-EEEE-4EEE-8EEE-000000000004', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE060200EEEE4EEE8EEE000000000004, 'FE060200-EEEE-4EEE-8EEE-000000000004', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE060200EEEE4EEE8EEE000000000004, 'FE060200-EEEE-4EEE-8EEE-000000000004', 'FE060100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE060500-EEEE-4EEE-8EEE-000000000004', @now, N'test.coord@fpt.edu.vn', NULL, 'FE060300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'test.score.s10@fpt.edu.vn'), 'FE060200-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE060700-EEEE-4EEE-8EEE-000000000004', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://docs.google.com/document/d/1lrOba5QRuUMF5JogHsgUnx7rTOawC9obxPZghtgN08U/edit?pli=1&tab=t.0', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', DATEADD(HOUR,-12,@now), 1, 'FE060500-EEEE-4EEE-8EEE-000000000004');
UPDATE submissions SET current_version_id='FE060700-EEEE-4EEE-8EEE-000000000004' WHERE id='FE060500-EEEE-4EEE-8EEE-000000000004';
INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)
VALUES ('FE060900-EEEE-4EEE-8EEE-000000000004', @now, N'test.coord@fpt.edu.vn', N'Blue Modern Artificial Intelligence Presentation.pdf', 1444161, N'/api/files/submissions/seed/Blue_Modern_Artificial_Intelligence_Presentation.pdf', NULL, N'application/pdf', 'FE060700-EEEE-4EEE-8EEE-000000000004');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-000000000029', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j1, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 95, 'FE060800-EEEE-4EEE-8EEE-000000000029'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 98, 'FE060800-EEEE-4EEE-8EEE-000000000029'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 100, 'FE060800-EEEE-4EEE-8EEE-000000000029');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-00000000002A', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j2, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 95, 'FE060800-EEEE-4EEE-8EEE-00000000002A'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 98, 'FE060800-EEEE-4EEE-8EEE-00000000002A'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 100, 'FE060800-EEEE-4EEE-8EEE-00000000002A');
DECLARE @L_FE060200EEEE4EEE8EEE000000000005 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s13@fpt.edu.vn');
DECLARE @M2_FE060200EEEE4EEE8EEE000000000005 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s14@fpt.edu.vn');
DECLARE @M3_FE060200EEEE4EEE8EEE000000000005 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s15@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE060200-EEEE-4EEE-8EEE-000000000005', @now, N'test.coord@fpt.edu.vn', 'FE060100-EEEE-4EEE-8EEE-000000000001', @L_FE060200EEEE4EEE8EEE000000000005, N'Score Epsilon', N'CONFIRMED', 'FE060400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE060200EEEE4EEE8EEE000000000005, 'FE060200-EEEE-4EEE-8EEE-000000000005', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE060200EEEE4EEE8EEE000000000005, 'FE060200-EEEE-4EEE-8EEE-000000000005', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE060200EEEE4EEE8EEE000000000005, 'FE060200-EEEE-4EEE-8EEE-000000000005', 'FE060100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE060500-EEEE-4EEE-8EEE-000000000005', @now, N'test.coord@fpt.edu.vn', NULL, 'FE060300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'test.score.s13@fpt.edu.vn'), 'FE060200-EEEE-4EEE-8EEE-000000000005', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE060700-EEEE-4EEE-8EEE-000000000005', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://docs.google.com/document/d/1lrOba5QRuUMF5JogHsgUnx7rTOawC9obxPZghtgN08U/edit?pli=1&tab=t.0', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', DATEADD(HOUR,-12,@now), 1, 'FE060500-EEEE-4EEE-8EEE-000000000005');
UPDATE submissions SET current_version_id='FE060700-EEEE-4EEE-8EEE-000000000005' WHERE id='FE060500-EEEE-4EEE-8EEE-000000000005';
INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)
VALUES ('FE060900-EEEE-4EEE-8EEE-000000000005', @now, N'test.coord@fpt.edu.vn', N'Blue Modern Artificial Intelligence Presentation.pdf', 1444161, N'/api/files/submissions/seed/Blue_Modern_Artificial_Intelligence_Presentation.pdf', NULL, N'application/pdf', 'FE060700-EEEE-4EEE-8EEE-000000000005');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-000000000033', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j1, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000005', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 95, 'FE060800-EEEE-4EEE-8EEE-000000000033'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 98, 'FE060800-EEEE-4EEE-8EEE-000000000033'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 100, 'FE060800-EEEE-4EEE-8EEE-000000000033');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-000000000034', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j2, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000005', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 95, 'FE060800-EEEE-4EEE-8EEE-000000000034'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 98, 'FE060800-EEEE-4EEE-8EEE-000000000034'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 100, 'FE060800-EEEE-4EEE-8EEE-000000000034');
DECLARE @L_FE060200EEEE4EEE8EEE000000000006 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s16@fpt.edu.vn');
DECLARE @M2_FE060200EEEE4EEE8EEE000000000006 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s17@fpt.edu.vn');
DECLARE @M3_FE060200EEEE4EEE8EEE000000000006 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s18@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE060200-EEEE-4EEE-8EEE-000000000006', @now, N'test.coord@fpt.edu.vn', 'FE060100-EEEE-4EEE-8EEE-000000000001', @L_FE060200EEEE4EEE8EEE000000000006, N'Score Zeta', N'CONFIRMED', 'FE060400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE060200EEEE4EEE8EEE000000000006, 'FE060200-EEEE-4EEE-8EEE-000000000006', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE060200EEEE4EEE8EEE000000000006, 'FE060200-EEEE-4EEE-8EEE-000000000006', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE060200EEEE4EEE8EEE000000000006, 'FE060200-EEEE-4EEE-8EEE-000000000006', 'FE060100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE060500-EEEE-4EEE-8EEE-000000000006', @now, N'test.coord@fpt.edu.vn', NULL, 'FE060300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'test.score.s16@fpt.edu.vn'), 'FE060200-EEEE-4EEE-8EEE-000000000006', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE060700-EEEE-4EEE-8EEE-000000000006', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://docs.google.com/document/d/1lrOba5QRuUMF5JogHsgUnx7rTOawC9obxPZghtgN08U/edit?pli=1&tab=t.0', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', DATEADD(HOUR,-12,@now), 1, 'FE060500-EEEE-4EEE-8EEE-000000000006');
UPDATE submissions SET current_version_id='FE060700-EEEE-4EEE-8EEE-000000000006' WHERE id='FE060500-EEEE-4EEE-8EEE-000000000006';
INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)
VALUES ('FE060900-EEEE-4EEE-8EEE-000000000006', @now, N'test.coord@fpt.edu.vn', N'Blue Modern Artificial Intelligence Presentation.pdf', 1444161, N'/api/files/submissions/seed/Blue_Modern_Artificial_Intelligence_Presentation.pdf', NULL, N'application/pdf', 'FE060700-EEEE-4EEE-8EEE-000000000006');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-00000000003D', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j1, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000006', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 95, 'FE060800-EEEE-4EEE-8EEE-00000000003D'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 98, 'FE060800-EEEE-4EEE-8EEE-00000000003D'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 100, 'FE060800-EEEE-4EEE-8EEE-00000000003D');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-00000000003E', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j2, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000006', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 95, 'FE060800-EEEE-4EEE-8EEE-00000000003E'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 98, 'FE060800-EEEE-4EEE-8EEE-00000000003E'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 100, 'FE060800-EEEE-4EEE-8EEE-00000000003E');
DECLARE @L_FE060200EEEE4EEE8EEE000000000007 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s19@fpt.edu.vn');
DECLARE @M2_FE060200EEEE4EEE8EEE000000000007 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s20@fpt.edu.vn');
DECLARE @M3_FE060200EEEE4EEE8EEE000000000007 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s21@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE060200-EEEE-4EEE-8EEE-000000000007', @now, N'test.coord@fpt.edu.vn', 'FE060100-EEEE-4EEE-8EEE-000000000001', @L_FE060200EEEE4EEE8EEE000000000007, N'Score Eta', N'CONFIRMED', 'FE060400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE060200EEEE4EEE8EEE000000000007, 'FE060200-EEEE-4EEE-8EEE-000000000007', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE060200EEEE4EEE8EEE000000000007, 'FE060200-EEEE-4EEE-8EEE-000000000007', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE060200EEEE4EEE8EEE000000000007, 'FE060200-EEEE-4EEE-8EEE-000000000007', 'FE060100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE060500-EEEE-4EEE-8EEE-000000000007', @now, N'test.coord@fpt.edu.vn', NULL, 'FE060300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'test.score.s19@fpt.edu.vn'), 'FE060200-EEEE-4EEE-8EEE-000000000007', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE060700-EEEE-4EEE-8EEE-000000000007', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://docs.google.com/document/d/1lrOba5QRuUMF5JogHsgUnx7rTOawC9obxPZghtgN08U/edit?pli=1&tab=t.0', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', DATEADD(HOUR,-12,@now), 1, 'FE060500-EEEE-4EEE-8EEE-000000000007');
UPDATE submissions SET current_version_id='FE060700-EEEE-4EEE-8EEE-000000000007' WHERE id='FE060500-EEEE-4EEE-8EEE-000000000007';
INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)
VALUES ('FE060900-EEEE-4EEE-8EEE-000000000007', @now, N'test.coord@fpt.edu.vn', N'Blue Modern Artificial Intelligence Presentation.pdf', 1444161, N'/api/files/submissions/seed/Blue_Modern_Artificial_Intelligence_Presentation.pdf', NULL, N'application/pdf', 'FE060700-EEEE-4EEE-8EEE-000000000007');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-000000000047', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j1, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000007', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 95, 'FE060800-EEEE-4EEE-8EEE-000000000047'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 98, 'FE060800-EEEE-4EEE-8EEE-000000000047'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 100, 'FE060800-EEEE-4EEE-8EEE-000000000047');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-000000000048', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j2, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000007', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 95, 'FE060800-EEEE-4EEE-8EEE-000000000048'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 98, 'FE060800-EEEE-4EEE-8EEE-000000000048'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 100, 'FE060800-EEEE-4EEE-8EEE-000000000048');
DECLARE @L_FE060200EEEE4EEE8EEE000000000008 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s22@fpt.edu.vn');
DECLARE @M2_FE060200EEEE4EEE8EEE000000000008 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s23@fpt.edu.vn');
DECLARE @M3_FE060200EEEE4EEE8EEE000000000008 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s24@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE060200-EEEE-4EEE-8EEE-000000000008', @now, N'test.coord@fpt.edu.vn', 'FE060100-EEEE-4EEE-8EEE-000000000001', @L_FE060200EEEE4EEE8EEE000000000008, N'Score Theta', N'CONFIRMED', 'FE060400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE060200EEEE4EEE8EEE000000000008, 'FE060200-EEEE-4EEE-8EEE-000000000008', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE060200EEEE4EEE8EEE000000000008, 'FE060200-EEEE-4EEE-8EEE-000000000008', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE060200EEEE4EEE8EEE000000000008, 'FE060200-EEEE-4EEE-8EEE-000000000008', 'FE060100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE060500-EEEE-4EEE-8EEE-000000000008', @now, N'test.coord@fpt.edu.vn', NULL, 'FE060300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'test.score.s22@fpt.edu.vn'), 'FE060200-EEEE-4EEE-8EEE-000000000008', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE060700-EEEE-4EEE-8EEE-000000000008', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://docs.google.com/document/d/1lrOba5QRuUMF5JogHsgUnx7rTOawC9obxPZghtgN08U/edit?pli=1&tab=t.0', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', DATEADD(HOUR,-12,@now), 1, 'FE060500-EEEE-4EEE-8EEE-000000000008');
UPDATE submissions SET current_version_id='FE060700-EEEE-4EEE-8EEE-000000000008' WHERE id='FE060500-EEEE-4EEE-8EEE-000000000008';
INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)
VALUES ('FE060900-EEEE-4EEE-8EEE-000000000008', @now, N'test.coord@fpt.edu.vn', N'Blue Modern Artificial Intelligence Presentation.pdf', 1444161, N'/api/files/submissions/seed/Blue_Modern_Artificial_Intelligence_Presentation.pdf', NULL, N'application/pdf', 'FE060700-EEEE-4EEE-8EEE-000000000008');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-000000000051', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j1, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000008', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 95, 'FE060800-EEEE-4EEE-8EEE-000000000051'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 98, 'FE060800-EEEE-4EEE-8EEE-000000000051'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 100, 'FE060800-EEEE-4EEE-8EEE-000000000051');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-000000000052', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j2, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000008', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 95, 'FE060800-EEEE-4EEE-8EEE-000000000052'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 98, 'FE060800-EEEE-4EEE-8EEE-000000000052'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 100, 'FE060800-EEEE-4EEE-8EEE-000000000052');
DECLARE @L_FE060200EEEE4EEE8EEE000000000009 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s25@fpt.edu.vn');
DECLARE @M2_FE060200EEEE4EEE8EEE000000000009 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s26@fpt.edu.vn');
DECLARE @M3_FE060200EEEE4EEE8EEE000000000009 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s27@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE060200-EEEE-4EEE-8EEE-000000000009', @now, N'test.coord@fpt.edu.vn', 'FE060100-EEEE-4EEE-8EEE-000000000001', @L_FE060200EEEE4EEE8EEE000000000009, N'Score Iota', N'CONFIRMED', 'FE060400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE060200EEEE4EEE8EEE000000000009, 'FE060200-EEEE-4EEE-8EEE-000000000009', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE060200EEEE4EEE8EEE000000000009, 'FE060200-EEEE-4EEE-8EEE-000000000009', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE060200EEEE4EEE8EEE000000000009, 'FE060200-EEEE-4EEE-8EEE-000000000009', 'FE060100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE060500-EEEE-4EEE-8EEE-000000000009', @now, N'test.coord@fpt.edu.vn', NULL, 'FE060300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'test.score.s25@fpt.edu.vn'), 'FE060200-EEEE-4EEE-8EEE-000000000009', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE060700-EEEE-4EEE-8EEE-000000000009', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://docs.google.com/document/d/1lrOba5QRuUMF5JogHsgUnx7rTOawC9obxPZghtgN08U/edit?pli=1&tab=t.0', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', DATEADD(HOUR,-12,@now), 1, 'FE060500-EEEE-4EEE-8EEE-000000000009');
UPDATE submissions SET current_version_id='FE060700-EEEE-4EEE-8EEE-000000000009' WHERE id='FE060500-EEEE-4EEE-8EEE-000000000009';
INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)
VALUES ('FE060900-EEEE-4EEE-8EEE-000000000009', @now, N'test.coord@fpt.edu.vn', N'Blue Modern Artificial Intelligence Presentation.pdf', 1444161, N'/api/files/submissions/seed/Blue_Modern_Artificial_Intelligence_Presentation.pdf', NULL, N'application/pdf', 'FE060700-EEEE-4EEE-8EEE-000000000009');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-00000000005B', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j1, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000009', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 95, 'FE060800-EEEE-4EEE-8EEE-00000000005B'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 98, 'FE060800-EEEE-4EEE-8EEE-00000000005B'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 100, 'FE060800-EEEE-4EEE-8EEE-00000000005B');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-00000000005C', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j2, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000009', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 95, 'FE060800-EEEE-4EEE-8EEE-00000000005C'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 98, 'FE060800-EEEE-4EEE-8EEE-00000000005C'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 100, 'FE060800-EEEE-4EEE-8EEE-00000000005C');
DECLARE @L_FE060200EEEE4EEE8EEE00000000000A UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s28@fpt.edu.vn');
DECLARE @M2_FE060200EEEE4EEE8EEE00000000000A UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s29@fpt.edu.vn');
DECLARE @M3_FE060200EEEE4EEE8EEE00000000000A UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.score.s30@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE060200-EEEE-4EEE-8EEE-00000000000A', @now, N'test.coord@fpt.edu.vn', 'FE060100-EEEE-4EEE-8EEE-000000000001', @L_FE060200EEEE4EEE8EEE00000000000A, N'Score Kappa', N'CONFIRMED', 'FE060400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE060200EEEE4EEE8EEE00000000000A, 'FE060200-EEEE-4EEE-8EEE-00000000000A', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE060200EEEE4EEE8EEE00000000000A, 'FE060200-EEEE-4EEE-8EEE-00000000000A', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE060200EEEE4EEE8EEE00000000000A, 'FE060200-EEEE-4EEE-8EEE-00000000000A', 'FE060100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE060500-EEEE-4EEE-8EEE-00000000000A', @now, N'test.coord@fpt.edu.vn', NULL, 'FE060300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'test.score.s28@fpt.edu.vn'), 'FE060200-EEEE-4EEE-8EEE-00000000000A', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE060700-EEEE-4EEE-8EEE-00000000000A', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', N'https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT', N'https://docs.google.com/document/d/1lrOba5QRuUMF5JogHsgUnx7rTOawC9obxPZghtgN08U/edit?pli=1&tab=t.0', N'https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1', DATEADD(HOUR,-12,@now), 1, 'FE060500-EEEE-4EEE-8EEE-00000000000A');
UPDATE submissions SET current_version_id='FE060700-EEEE-4EEE-8EEE-00000000000A' WHERE id='FE060500-EEEE-4EEE-8EEE-00000000000A';
INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)
VALUES ('FE060900-EEEE-4EEE-8EEE-00000000000A', @now, N'test.coord@fpt.edu.vn', N'Blue Modern Artificial Intelligence Presentation.pdf', 1444161, N'/api/files/submissions/seed/Blue_Modern_Artificial_Intelligence_Presentation.pdf', NULL, N'application/pdf', 'FE060700-EEEE-4EEE-8EEE-00000000000A');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-000000000065', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j1, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-00000000000A', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 95, 'FE060800-EEEE-4EEE-8EEE-000000000065'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 98, 'FE060800-EEEE-4EEE-8EEE-000000000065'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 100, 'FE060800-EEEE-4EEE-8EEE-000000000065');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-000000000066', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j2, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-00000000000A', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 95, 'FE060800-EEEE-4EEE-8EEE-000000000066'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 98, 'FE060800-EEEE-4EEE-8EEE-000000000066'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 100, 'FE060800-EEEE-4EEE-8EEE-000000000066');

-- ========== 7) Final advancement / LiveScore ==========
INSERT INTO hackathon_events (id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at,
  avatar_url, score_scale_max) VALUES (
  'FE070100-EEEE-4EEE-8EEE-000000000001', N'Test 7 - Final Advancement (Prelim Done)', N'Summer', 2026,
  DATEADD(DAY, -5, @today), DATEADD(DAY, 30, @today),
  DATEADD(DAY, -40, @today), DATEADD(DAY, -10, @today),
  N'10 teams prelim fully scored+ranked. Select Finalists then score Final with guest judges.', N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
  3, 5, 4, 8, @templateId, N'SCORING', 0, @coordId, N'test.coord@fpt.edu.vn', @now, @now, NULL, 100);
INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, created_at, updated_at, created_by)
VALUES ('FE070400-EEEE-4EEE-8EEE-000000000001', 'FE070100-EEEE-4EEE-8EEE-000000000001', N'Final Track', N'Test track', NULL, N'OPEN', NULL, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO competition_groups (id, track_id, event_id, name, max_teams, sort_order, created_at, updated_at, created_by)
VALUES ('FE070A00-EEEE-4EEE-8EEE-000000000001', 'FE070400-EEEE-4EEE-8EEE-000000000001', 'FE070100-EEEE-4EEE-8EEE-000000000001', N'Group A', 10, 0, @now, @now, N'test.coord@fpt.edu.vn'),
       ('FE070A00-EEEE-4EEE-8EEE-000000000002', 'FE070400-EEEE-4EEE-8EEE-000000000001', 'FE070100-EEEE-4EEE-8EEE-000000000001', N'Group B', 10, 1, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, min_judges_per_round, created_at, updated_at, created_by) VALUES
  ('FE070300-EEEE-4EEE-8EEE-000000000001', 'FE070100-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(DAY,-5,@now), DATEADD(HOUR,-6,@now), DATEADD(HOUR,-2,DATEADD(DAY,-3,@now)), DATEADD(DAY,-3,@now), DATEADD(HOUR,-6,@now), 4, N'PER_TRACK_TOP_N', 40, 2, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE070300-EEEE-4EEE-8EEE-000000000002', 'FE070100-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', N'FINAL', DATEADD(HOUR,-1,@now), DATEADD(DAY,14,@now), NULL, DATEADD(HOUR,-1,@now), DATEADD(DAY,14,@now), 4, N'FINALIST_POOL', 60, 2, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE070600-EEEE-4EEE-8EEE-000000000001', 'FE070300-EEEE-4EEE-8EEE-000000000001', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE070600-EEEE-4EEE-8EEE-000000000002', 'FE070300-EEEE-4EEE-8EEE-000000000001', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE070600-EEEE-4EEE-8EEE-000000000003', 'FE070300-EEEE-4EEE-8EEE-000000000001', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE070600-EEEE-4EEE-8EEE-000000000004', 'FE070300-EEEE-4EEE-8EEE-000000000002', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE070600-EEEE-4EEE-8EEE-000000000005', 'FE070300-EEEE-4EEE-8EEE-000000000002', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE070600-EEEE-4EEE-8EEE-000000000006', 'FE070300-EEEE-4EEE-8EEE-000000000002', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id, created_by) VALUES
  (NEWID(), @now, @now, @j1, 'FE070100-EEEE-4EEE-8EEE-000000000001', N'test.coord@fpt.edu.vn'),
  (NEWID(), @now, @now, @j2, 'FE070100-EEEE-4EEE-8EEE-000000000001', N'test.coord@fpt.edu.vn'),
  (NEWID(), @now, @now, @fj1, 'FE070100-EEEE-4EEE-8EEE-000000000001', N'test.coord@fpt.edu.vn'),
  (NEWID(), @now, @now, @fj2, 'FE070100-EEEE-4EEE-8EEE-000000000001', N'test.coord@fpt.edu.vn');
INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active, created_by) VALUES
  (NEWID(), @now, @now, @j1, 'FE070300-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1, N'test.coord@fpt.edu.vn'),
  (NEWID(), @now, @now, @j2, 'FE070300-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1, N'test.coord@fpt.edu.vn'),
  (NEWID(), @now, @now, @fj1, 'FE070300-EEEE-4EEE-8EEE-000000000002', N'ROUND', 1, N'test.coord@fpt.edu.vn'),
  (NEWID(), @now, @now, @fj2, 'FE070300-EEEE-4EEE-8EEE-000000000002', N'ROUND', 1, N'test.coord@fpt.edu.vn');
INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, N'test.coord@fpt.edu.vn', @now, 'FE070100-EEEE-4EEE-8EEE-000000000001', N'APPROVED', u.id, 1, 1
FROM users u WHERE u.email LIKE N'test.final.s%@fpt.edu.vn';
DECLARE @L_FE070200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s01@fpt.edu.vn');
DECLARE @M2_FE070200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s02@fpt.edu.vn');
DECLARE @M3_FE070200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s03@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE070200-EEEE-4EEE-8EEE-000000000001', @now, N'test.coord@fpt.edu.vn', 'FE070100-EEEE-4EEE-8EEE-000000000001', @L_FE070200EEEE4EEE8EEE000000000001, N'Final Alpha', N'CONFIRMED', 'FE070400-EEEE-4EEE-8EEE-000000000001', 'FE070A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE070200EEEE4EEE8EEE000000000001, 'FE070200-EEEE-4EEE-8EEE-000000000001', 'FE070100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE070200EEEE4EEE8EEE000000000001, 'FE070200-EEEE-4EEE-8EEE-000000000001', 'FE070100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE070200EEEE4EEE8EEE000000000001, 'FE070200-EEEE-4EEE-8EEE-000000000001', 'FE070100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE070500-EEEE-4EEE-8EEE-000000000001', @now, N'test.coord@fpt.edu.vn', NULL, 'FE070300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @L_FE070200EEEE4EEE8EEE000000000001, 'FE070200-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE070700-EEEE-4EEE-8EEE-000000000001', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/final-1', N'https://docs.google.com/presentation/d/final-1', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-3,@now), 1, 'FE070500-EEEE-4EEE-8EEE-000000000001');
UPDATE submissions SET current_version_id='FE070700-EEEE-4EEE-8EEE-000000000001' WHERE id='FE070500-EEEE-4EEE-8EEE-000000000001';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE070800-EEEE-4EEE-8EEE-00000000000B', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j1, 'FE070300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE070500-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000001', 95, 'FE070800-EEEE-4EEE-8EEE-00000000000B'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000002', 95, 'FE070800-EEEE-4EEE-8EEE-00000000000B'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000003', 90, 'FE070800-EEEE-4EEE-8EEE-00000000000B');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE070800-EEEE-4EEE-8EEE-00000000000C', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j2, 'FE070300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE070500-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000001', 95, 'FE070800-EEEE-4EEE-8EEE-00000000000C'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000002', 95, 'FE070800-EEEE-4EEE-8EEE-00000000000C'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000003', 90, 'FE070800-EEEE-4EEE-8EEE-00000000000C');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, 95.00, 1, 'FE070300-EEEE-4EEE-8EEE-000000000001', 'FE070200-EEEE-4EEE-8EEE-000000000001', 1, 0, @now);
DECLARE @L_FE070200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s04@fpt.edu.vn');
DECLARE @M2_FE070200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s05@fpt.edu.vn');
DECLARE @M3_FE070200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s06@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE070200-EEEE-4EEE-8EEE-000000000002', @now, N'test.coord@fpt.edu.vn', 'FE070100-EEEE-4EEE-8EEE-000000000001', @L_FE070200EEEE4EEE8EEE000000000002, N'Final Beta', N'CONFIRMED', 'FE070400-EEEE-4EEE-8EEE-000000000001', 'FE070A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE070200EEEE4EEE8EEE000000000002, 'FE070200-EEEE-4EEE-8EEE-000000000002', 'FE070100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE070200EEEE4EEE8EEE000000000002, 'FE070200-EEEE-4EEE-8EEE-000000000002', 'FE070100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE070200EEEE4EEE8EEE000000000002, 'FE070200-EEEE-4EEE-8EEE-000000000002', 'FE070100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE070500-EEEE-4EEE-8EEE-000000000002', @now, N'test.coord@fpt.edu.vn', NULL, 'FE070300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @L_FE070200EEEE4EEE8EEE000000000002, 'FE070200-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE070700-EEEE-4EEE-8EEE-000000000002', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/final-2', N'https://docs.google.com/presentation/d/final-2', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-3,@now), 1, 'FE070500-EEEE-4EEE-8EEE-000000000002');
UPDATE submissions SET current_version_id='FE070700-EEEE-4EEE-8EEE-000000000002' WHERE id='FE070500-EEEE-4EEE-8EEE-000000000002';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE070800-EEEE-4EEE-8EEE-000000000015', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j1, 'FE070300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE070500-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000001', 92, 'FE070800-EEEE-4EEE-8EEE-000000000015'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000002', 92, 'FE070800-EEEE-4EEE-8EEE-000000000015'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000003', 87, 'FE070800-EEEE-4EEE-8EEE-000000000015');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE070800-EEEE-4EEE-8EEE-000000000016', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j2, 'FE070300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE070500-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000001', 92, 'FE070800-EEEE-4EEE-8EEE-000000000016'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000002', 92, 'FE070800-EEEE-4EEE-8EEE-000000000016'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000003', 87, 'FE070800-EEEE-4EEE-8EEE-000000000016');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, 92.00, 2, 'FE070300-EEEE-4EEE-8EEE-000000000001', 'FE070200-EEEE-4EEE-8EEE-000000000002', 1, 0, @now);
DECLARE @L_FE070200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s07@fpt.edu.vn');
DECLARE @M2_FE070200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s08@fpt.edu.vn');
DECLARE @M3_FE070200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s09@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE070200-EEEE-4EEE-8EEE-000000000003', @now, N'test.coord@fpt.edu.vn', 'FE070100-EEEE-4EEE-8EEE-000000000001', @L_FE070200EEEE4EEE8EEE000000000003, N'Final Gamma', N'CONFIRMED', 'FE070400-EEEE-4EEE-8EEE-000000000001', 'FE070A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE070200EEEE4EEE8EEE000000000003, 'FE070200-EEEE-4EEE-8EEE-000000000003', 'FE070100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE070200EEEE4EEE8EEE000000000003, 'FE070200-EEEE-4EEE-8EEE-000000000003', 'FE070100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE070200EEEE4EEE8EEE000000000003, 'FE070200-EEEE-4EEE-8EEE-000000000003', 'FE070100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE070500-EEEE-4EEE-8EEE-000000000003', @now, N'test.coord@fpt.edu.vn', NULL, 'FE070300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @L_FE070200EEEE4EEE8EEE000000000003, 'FE070200-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE070700-EEEE-4EEE-8EEE-000000000003', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/final-3', N'https://docs.google.com/presentation/d/final-3', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-3,@now), 1, 'FE070500-EEEE-4EEE-8EEE-000000000003');
UPDATE submissions SET current_version_id='FE070700-EEEE-4EEE-8EEE-000000000003' WHERE id='FE070500-EEEE-4EEE-8EEE-000000000003';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE070800-EEEE-4EEE-8EEE-00000000001F', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j1, 'FE070300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE070500-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000001', 89, 'FE070800-EEEE-4EEE-8EEE-00000000001F'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000002', 89, 'FE070800-EEEE-4EEE-8EEE-00000000001F'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000003', 84, 'FE070800-EEEE-4EEE-8EEE-00000000001F');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE070800-EEEE-4EEE-8EEE-000000000020', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j2, 'FE070300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE070500-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000001', 89, 'FE070800-EEEE-4EEE-8EEE-000000000020'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000002', 89, 'FE070800-EEEE-4EEE-8EEE-000000000020'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000003', 84, 'FE070800-EEEE-4EEE-8EEE-000000000020');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, 89.00, 3, 'FE070300-EEEE-4EEE-8EEE-000000000001', 'FE070200-EEEE-4EEE-8EEE-000000000003', 1, 0, @now);
DECLARE @L_FE070200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s10@fpt.edu.vn');
DECLARE @M2_FE070200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s11@fpt.edu.vn');
DECLARE @M3_FE070200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s12@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE070200-EEEE-4EEE-8EEE-000000000004', @now, N'test.coord@fpt.edu.vn', 'FE070100-EEEE-4EEE-8EEE-000000000001', @L_FE070200EEEE4EEE8EEE000000000004, N'Final Delta', N'CONFIRMED', 'FE070400-EEEE-4EEE-8EEE-000000000001', 'FE070A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE070200EEEE4EEE8EEE000000000004, 'FE070200-EEEE-4EEE-8EEE-000000000004', 'FE070100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE070200EEEE4EEE8EEE000000000004, 'FE070200-EEEE-4EEE-8EEE-000000000004', 'FE070100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE070200EEEE4EEE8EEE000000000004, 'FE070200-EEEE-4EEE-8EEE-000000000004', 'FE070100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE070500-EEEE-4EEE-8EEE-000000000004', @now, N'test.coord@fpt.edu.vn', NULL, 'FE070300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @L_FE070200EEEE4EEE8EEE000000000004, 'FE070200-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE070700-EEEE-4EEE-8EEE-000000000004', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/final-4', N'https://docs.google.com/presentation/d/final-4', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-3,@now), 1, 'FE070500-EEEE-4EEE-8EEE-000000000004');
UPDATE submissions SET current_version_id='FE070700-EEEE-4EEE-8EEE-000000000004' WHERE id='FE070500-EEEE-4EEE-8EEE-000000000004';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE070800-EEEE-4EEE-8EEE-000000000029', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j1, 'FE070300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE070500-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000001', 86, 'FE070800-EEEE-4EEE-8EEE-000000000029'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000002', 86, 'FE070800-EEEE-4EEE-8EEE-000000000029'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000003', 81, 'FE070800-EEEE-4EEE-8EEE-000000000029');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE070800-EEEE-4EEE-8EEE-00000000002A', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j2, 'FE070300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE070500-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000001', 86, 'FE070800-EEEE-4EEE-8EEE-00000000002A'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000002', 86, 'FE070800-EEEE-4EEE-8EEE-00000000002A'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000003', 81, 'FE070800-EEEE-4EEE-8EEE-00000000002A');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, 86.00, 4, 'FE070300-EEEE-4EEE-8EEE-000000000001', 'FE070200-EEEE-4EEE-8EEE-000000000004', 1, 0, @now);
DECLARE @L_FE070200EEEE4EEE8EEE000000000005 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s13@fpt.edu.vn');
DECLARE @M2_FE070200EEEE4EEE8EEE000000000005 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s14@fpt.edu.vn');
DECLARE @M3_FE070200EEEE4EEE8EEE000000000005 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s15@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE070200-EEEE-4EEE-8EEE-000000000005', @now, N'test.coord@fpt.edu.vn', 'FE070100-EEEE-4EEE-8EEE-000000000001', @L_FE070200EEEE4EEE8EEE000000000005, N'Final Epsilon', N'CONFIRMED', 'FE070400-EEEE-4EEE-8EEE-000000000001', 'FE070A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE070200EEEE4EEE8EEE000000000005, 'FE070200-EEEE-4EEE-8EEE-000000000005', 'FE070100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE070200EEEE4EEE8EEE000000000005, 'FE070200-EEEE-4EEE-8EEE-000000000005', 'FE070100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE070200EEEE4EEE8EEE000000000005, 'FE070200-EEEE-4EEE-8EEE-000000000005', 'FE070100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE070500-EEEE-4EEE-8EEE-000000000005', @now, N'test.coord@fpt.edu.vn', NULL, 'FE070300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @L_FE070200EEEE4EEE8EEE000000000005, 'FE070200-EEEE-4EEE-8EEE-000000000005', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE070700-EEEE-4EEE-8EEE-000000000005', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/final-5', N'https://docs.google.com/presentation/d/final-5', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-3,@now), 1, 'FE070500-EEEE-4EEE-8EEE-000000000005');
UPDATE submissions SET current_version_id='FE070700-EEEE-4EEE-8EEE-000000000005' WHERE id='FE070500-EEEE-4EEE-8EEE-000000000005';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE070800-EEEE-4EEE-8EEE-000000000033', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j1, 'FE070300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE070500-EEEE-4EEE-8EEE-000000000005', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000001', 83, 'FE070800-EEEE-4EEE-8EEE-000000000033'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000002', 83, 'FE070800-EEEE-4EEE-8EEE-000000000033'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000003', 78, 'FE070800-EEEE-4EEE-8EEE-000000000033');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE070800-EEEE-4EEE-8EEE-000000000034', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j2, 'FE070300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE070500-EEEE-4EEE-8EEE-000000000005', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000001', 83, 'FE070800-EEEE-4EEE-8EEE-000000000034'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000002', 83, 'FE070800-EEEE-4EEE-8EEE-000000000034'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000003', 78, 'FE070800-EEEE-4EEE-8EEE-000000000034');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, 83.00, 5, 'FE070300-EEEE-4EEE-8EEE-000000000001', 'FE070200-EEEE-4EEE-8EEE-000000000005', 1, 0, @now);
DECLARE @L_FE070200EEEE4EEE8EEE000000000006 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s16@fpt.edu.vn');
DECLARE @M2_FE070200EEEE4EEE8EEE000000000006 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s17@fpt.edu.vn');
DECLARE @M3_FE070200EEEE4EEE8EEE000000000006 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s18@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE070200-EEEE-4EEE-8EEE-000000000006', @now, N'test.coord@fpt.edu.vn', 'FE070100-EEEE-4EEE-8EEE-000000000001', @L_FE070200EEEE4EEE8EEE000000000006, N'Final Zeta', N'CONFIRMED', 'FE070400-EEEE-4EEE-8EEE-000000000001', 'FE070A00-EEEE-4EEE-8EEE-000000000002', @now, N'MANUAL', @coordId, 0, N'Test.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE070200EEEE4EEE8EEE000000000006, 'FE070200-EEEE-4EEE-8EEE-000000000006', 'FE070100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE070200EEEE4EEE8EEE000000000006, 'FE070200-EEEE-4EEE-8EEE-000000000006', 'FE070100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE070200EEEE4EEE8EEE000000000006, 'FE070200-EEEE-4EEE-8EEE-000000000006', 'FE070100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE070500-EEEE-4EEE-8EEE-000000000006', @now, N'test.coord@fpt.edu.vn', NULL, 'FE070300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @L_FE070200EEEE4EEE8EEE000000000006, 'FE070200-EEEE-4EEE-8EEE-000000000006', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE070700-EEEE-4EEE-8EEE-000000000006', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/final-6', N'https://docs.google.com/presentation/d/final-6', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-3,@now), 1, 'FE070500-EEEE-4EEE-8EEE-000000000006');
UPDATE submissions SET current_version_id='FE070700-EEEE-4EEE-8EEE-000000000006' WHERE id='FE070500-EEEE-4EEE-8EEE-000000000006';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE070800-EEEE-4EEE-8EEE-00000000003D', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j1, 'FE070300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE070500-EEEE-4EEE-8EEE-000000000006', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000001', 80, 'FE070800-EEEE-4EEE-8EEE-00000000003D'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000002', 80, 'FE070800-EEEE-4EEE-8EEE-00000000003D'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000003', 75, 'FE070800-EEEE-4EEE-8EEE-00000000003D');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE070800-EEEE-4EEE-8EEE-00000000003E', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j2, 'FE070300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE070500-EEEE-4EEE-8EEE-000000000006', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000001', 80, 'FE070800-EEEE-4EEE-8EEE-00000000003E'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000002', 80, 'FE070800-EEEE-4EEE-8EEE-00000000003E'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000003', 75, 'FE070800-EEEE-4EEE-8EEE-00000000003E');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, 80.00, 6, 'FE070300-EEEE-4EEE-8EEE-000000000001', 'FE070200-EEEE-4EEE-8EEE-000000000006', 1, 0, @now);
DECLARE @L_FE070200EEEE4EEE8EEE000000000007 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s19@fpt.edu.vn');
DECLARE @M2_FE070200EEEE4EEE8EEE000000000007 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s20@fpt.edu.vn');
DECLARE @M3_FE070200EEEE4EEE8EEE000000000007 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s21@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE070200-EEEE-4EEE-8EEE-000000000007', @now, N'test.coord@fpt.edu.vn', 'FE070100-EEEE-4EEE-8EEE-000000000001', @L_FE070200EEEE4EEE8EEE000000000007, N'Final Eta', N'CONFIRMED', 'FE070400-EEEE-4EEE-8EEE-000000000001', 'FE070A00-EEEE-4EEE-8EEE-000000000002', @now, N'MANUAL', @coordId, 0, N'Test.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE070200EEEE4EEE8EEE000000000007, 'FE070200-EEEE-4EEE-8EEE-000000000007', 'FE070100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE070200EEEE4EEE8EEE000000000007, 'FE070200-EEEE-4EEE-8EEE-000000000007', 'FE070100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE070200EEEE4EEE8EEE000000000007, 'FE070200-EEEE-4EEE-8EEE-000000000007', 'FE070100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE070500-EEEE-4EEE-8EEE-000000000007', @now, N'test.coord@fpt.edu.vn', NULL, 'FE070300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @L_FE070200EEEE4EEE8EEE000000000007, 'FE070200-EEEE-4EEE-8EEE-000000000007', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE070700-EEEE-4EEE-8EEE-000000000007', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/final-7', N'https://docs.google.com/presentation/d/final-7', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-3,@now), 1, 'FE070500-EEEE-4EEE-8EEE-000000000007');
UPDATE submissions SET current_version_id='FE070700-EEEE-4EEE-8EEE-000000000007' WHERE id='FE070500-EEEE-4EEE-8EEE-000000000007';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE070800-EEEE-4EEE-8EEE-000000000047', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j1, 'FE070300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE070500-EEEE-4EEE-8EEE-000000000007', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000001', 77, 'FE070800-EEEE-4EEE-8EEE-000000000047'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000002', 77, 'FE070800-EEEE-4EEE-8EEE-000000000047'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000003', 72, 'FE070800-EEEE-4EEE-8EEE-000000000047');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE070800-EEEE-4EEE-8EEE-000000000048', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j2, 'FE070300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE070500-EEEE-4EEE-8EEE-000000000007', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000001', 77, 'FE070800-EEEE-4EEE-8EEE-000000000048'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000002', 77, 'FE070800-EEEE-4EEE-8EEE-000000000048'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000003', 72, 'FE070800-EEEE-4EEE-8EEE-000000000048');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, 77.00, 7, 'FE070300-EEEE-4EEE-8EEE-000000000001', 'FE070200-EEEE-4EEE-8EEE-000000000007', 1, 0, @now);
DECLARE @L_FE070200EEEE4EEE8EEE000000000008 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s22@fpt.edu.vn');
DECLARE @M2_FE070200EEEE4EEE8EEE000000000008 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s23@fpt.edu.vn');
DECLARE @M3_FE070200EEEE4EEE8EEE000000000008 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s24@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE070200-EEEE-4EEE-8EEE-000000000008', @now, N'test.coord@fpt.edu.vn', 'FE070100-EEEE-4EEE-8EEE-000000000001', @L_FE070200EEEE4EEE8EEE000000000008, N'Final Theta', N'CONFIRMED', 'FE070400-EEEE-4EEE-8EEE-000000000001', 'FE070A00-EEEE-4EEE-8EEE-000000000002', @now, N'MANUAL', @coordId, 0, N'Test.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE070200EEEE4EEE8EEE000000000008, 'FE070200-EEEE-4EEE-8EEE-000000000008', 'FE070100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE070200EEEE4EEE8EEE000000000008, 'FE070200-EEEE-4EEE-8EEE-000000000008', 'FE070100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE070200EEEE4EEE8EEE000000000008, 'FE070200-EEEE-4EEE-8EEE-000000000008', 'FE070100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE070500-EEEE-4EEE-8EEE-000000000008', @now, N'test.coord@fpt.edu.vn', NULL, 'FE070300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @L_FE070200EEEE4EEE8EEE000000000008, 'FE070200-EEEE-4EEE-8EEE-000000000008', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE070700-EEEE-4EEE-8EEE-000000000008', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/final-8', N'https://docs.google.com/presentation/d/final-8', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-3,@now), 1, 'FE070500-EEEE-4EEE-8EEE-000000000008');
UPDATE submissions SET current_version_id='FE070700-EEEE-4EEE-8EEE-000000000008' WHERE id='FE070500-EEEE-4EEE-8EEE-000000000008';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE070800-EEEE-4EEE-8EEE-000000000051', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j1, 'FE070300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE070500-EEEE-4EEE-8EEE-000000000008', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000001', 74, 'FE070800-EEEE-4EEE-8EEE-000000000051'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000002', 74, 'FE070800-EEEE-4EEE-8EEE-000000000051'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000003', 69, 'FE070800-EEEE-4EEE-8EEE-000000000051');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE070800-EEEE-4EEE-8EEE-000000000052', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j2, 'FE070300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE070500-EEEE-4EEE-8EEE-000000000008', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000001', 74, 'FE070800-EEEE-4EEE-8EEE-000000000052'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000002', 74, 'FE070800-EEEE-4EEE-8EEE-000000000052'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000003', 69, 'FE070800-EEEE-4EEE-8EEE-000000000052');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, 74.00, 8, 'FE070300-EEEE-4EEE-8EEE-000000000001', 'FE070200-EEEE-4EEE-8EEE-000000000008', 1, 0, @now);
DECLARE @L_FE070200EEEE4EEE8EEE000000000009 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s25@fpt.edu.vn');
DECLARE @M2_FE070200EEEE4EEE8EEE000000000009 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s26@fpt.edu.vn');
DECLARE @M3_FE070200EEEE4EEE8EEE000000000009 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s27@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE070200-EEEE-4EEE-8EEE-000000000009', @now, N'test.coord@fpt.edu.vn', 'FE070100-EEEE-4EEE-8EEE-000000000001', @L_FE070200EEEE4EEE8EEE000000000009, N'Final Iota', N'CONFIRMED', 'FE070400-EEEE-4EEE-8EEE-000000000001', 'FE070A00-EEEE-4EEE-8EEE-000000000002', @now, N'MANUAL', @coordId, 0, N'Test.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE070200EEEE4EEE8EEE000000000009, 'FE070200-EEEE-4EEE-8EEE-000000000009', 'FE070100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE070200EEEE4EEE8EEE000000000009, 'FE070200-EEEE-4EEE-8EEE-000000000009', 'FE070100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE070200EEEE4EEE8EEE000000000009, 'FE070200-EEEE-4EEE-8EEE-000000000009', 'FE070100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE070500-EEEE-4EEE-8EEE-000000000009', @now, N'test.coord@fpt.edu.vn', NULL, 'FE070300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @L_FE070200EEEE4EEE8EEE000000000009, 'FE070200-EEEE-4EEE-8EEE-000000000009', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE070700-EEEE-4EEE-8EEE-000000000009', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/final-9', N'https://docs.google.com/presentation/d/final-9', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-3,@now), 1, 'FE070500-EEEE-4EEE-8EEE-000000000009');
UPDATE submissions SET current_version_id='FE070700-EEEE-4EEE-8EEE-000000000009' WHERE id='FE070500-EEEE-4EEE-8EEE-000000000009';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE070800-EEEE-4EEE-8EEE-00000000005B', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j1, 'FE070300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE070500-EEEE-4EEE-8EEE-000000000009', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000001', 71, 'FE070800-EEEE-4EEE-8EEE-00000000005B'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000002', 71, 'FE070800-EEEE-4EEE-8EEE-00000000005B'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000003', 66, 'FE070800-EEEE-4EEE-8EEE-00000000005B');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE070800-EEEE-4EEE-8EEE-00000000005C', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j2, 'FE070300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE070500-EEEE-4EEE-8EEE-000000000009', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000001', 71, 'FE070800-EEEE-4EEE-8EEE-00000000005C'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000002', 71, 'FE070800-EEEE-4EEE-8EEE-00000000005C'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000003', 66, 'FE070800-EEEE-4EEE-8EEE-00000000005C');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, 71.00, 9, 'FE070300-EEEE-4EEE-8EEE-000000000001', 'FE070200-EEEE-4EEE-8EEE-000000000009', 1, 0, @now);
DECLARE @L_FE070200EEEE4EEE8EEE00000000000A UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s28@fpt.edu.vn');
DECLARE @M2_FE070200EEEE4EEE8EEE00000000000A UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s29@fpt.edu.vn');
DECLARE @M3_FE070200EEEE4EEE8EEE00000000000A UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.s30@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE070200-EEEE-4EEE-8EEE-00000000000A', @now, N'test.coord@fpt.edu.vn', 'FE070100-EEEE-4EEE-8EEE-000000000001', @L_FE070200EEEE4EEE8EEE00000000000A, N'Final Kappa', N'CONFIRMED', 'FE070400-EEEE-4EEE-8EEE-000000000001', 'FE070A00-EEEE-4EEE-8EEE-000000000002', @now, N'MANUAL', @coordId, 0, N'Test.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE070200EEEE4EEE8EEE00000000000A, 'FE070200-EEEE-4EEE-8EEE-00000000000A', 'FE070100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE070200EEEE4EEE8EEE00000000000A, 'FE070200-EEEE-4EEE-8EEE-00000000000A', 'FE070100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE070200EEEE4EEE8EEE00000000000A, 'FE070200-EEEE-4EEE-8EEE-00000000000A', 'FE070100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE070500-EEEE-4EEE-8EEE-00000000000A', @now, N'test.coord@fpt.edu.vn', NULL, 'FE070300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @L_FE070200EEEE4EEE8EEE00000000000A, 'FE070200-EEEE-4EEE-8EEE-00000000000A', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE070700-EEEE-4EEE-8EEE-00000000000A', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/final-10', N'https://docs.google.com/presentation/d/final-10', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-3,@now), 1, 'FE070500-EEEE-4EEE-8EEE-00000000000A');
UPDATE submissions SET current_version_id='FE070700-EEEE-4EEE-8EEE-00000000000A' WHERE id='FE070500-EEEE-4EEE-8EEE-00000000000A';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE070800-EEEE-4EEE-8EEE-000000000065', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j1, 'FE070300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE070500-EEEE-4EEE-8EEE-00000000000A', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000001', 68, 'FE070800-EEEE-4EEE-8EEE-000000000065'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000002', 68, 'FE070800-EEEE-4EEE-8EEE-000000000065'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000003', 63, 'FE070800-EEEE-4EEE-8EEE-000000000065');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE070800-EEEE-4EEE-8EEE-000000000066', @now, N'test.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j2, 'FE070300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE070500-EEEE-4EEE-8EEE-00000000000A', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000001', 68, 'FE070800-EEEE-4EEE-8EEE-000000000066'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000002', 68, 'FE070800-EEEE-4EEE-8EEE-000000000066'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE070600-EEEE-4EEE-8EEE-000000000003', 63, 'FE070800-EEEE-4EEE-8EEE-000000000066');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, 68.00, 10, 'FE070300-EEEE-4EEE-8EEE-000000000001', 'FE070200-EEEE-4EEE-8EEE-00000000000A', 1, 0, @now);

-- ========== 8) Completed full graph (feedback / livescore / results) ==========
INSERT INTO hackathon_events (id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at,
  avatar_url, score_scale_max) VALUES (
  'FE080100-EEEE-4EEE-8EEE-000000000001', N'Test 8 - Completed (Feedback Ready)', N'Summer', 2026,
  DATEADD(DAY, -60, @today), DATEADD(DAY, -30, @today),
  DATEADD(DAY, -90, @today), DATEADD(DAY, -70, @today),
  N'COMPLETED full graph — submissions, scores, rankings, publish, awards, feedback.', N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
  3, 5, 4, 8, @templateId, N'COMPLETED', 1, @coordId, N'test.coord@fpt.edu.vn', @now, @now, NULL, 100);
INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, created_at, updated_at, created_by)
VALUES ('FE080400-EEEE-4EEE-8EEE-000000000001', 'FE080100-EEEE-4EEE-8EEE-000000000001', N'Feedback Track', N'Test track', NULL, N'OPEN', NULL, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO competition_groups (id, track_id, event_id, name, max_teams, sort_order, created_at, updated_at, created_by)
VALUES ('FE080A00-EEEE-4EEE-8EEE-000000000001', 'FE080400-EEEE-4EEE-8EEE-000000000001', 'FE080100-EEEE-4EEE-8EEE-000000000001', N'Group A', 15, 0, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, min_judges_per_round, created_at, updated_at, created_by) VALUES
  ('FE080300-EEEE-4EEE-8EEE-000000000001', 'FE080100-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(DAY,-55,@now), DATEADD(DAY,-45,@now), DATEADD(HOUR,-2,DATEADD(DAY,-50,@now)), DATEADD(DAY,-50,@now), DATEADD(DAY,-45,@now), 4, N'PER_TRACK_TOP_N', 40, 2, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE080300-EEEE-4EEE-8EEE-000000000002', 'FE080100-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', N'FINAL', DATEADD(DAY,-40,@now), DATEADD(DAY,-35,@now), NULL, DATEADD(DAY,-38,@now), DATEADD(DAY,-35,@now), 4, N'FINALIST_POOL', 60, 2, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE080600-EEEE-4EEE-8EEE-000000000001', 'FE080300-EEEE-4EEE-8EEE-000000000001', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE080600-EEEE-4EEE-8EEE-000000000002', 'FE080300-EEEE-4EEE-8EEE-000000000001', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE080600-EEEE-4EEE-8EEE-000000000003', 'FE080300-EEEE-4EEE-8EEE-000000000001', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE080600-EEEE-4EEE-8EEE-000000000004', 'FE080300-EEEE-4EEE-8EEE-000000000002', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE080600-EEEE-4EEE-8EEE-000000000005', 'FE080300-EEEE-4EEE-8EEE-000000000002', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE080600-EEEE-4EEE-8EEE-000000000006', 'FE080300-EEEE-4EEE-8EEE-000000000002', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'test.coord@fpt.edu.vn');
INSERT INTO event_schedules (id, event_id, type, title, description, start_time, end_time, gate, sort_order, created_at, updated_at) VALUES
  ('FE081400-EEEE-4EEE-8EEE-000000000001', 'FE080100-EEEE-4EEE-8EEE-000000000001', N'WORKSHOP', N'Kickoff workshop', NULL, DATEADD(DAY,-58,@now), DATEADD(HOUR,3,DATEADD(DAY,-58,@now)), NULL, 0, @now, @now),
  ('FE081400-EEEE-4EEE-8EEE-000000000002', 'FE080100-EEEE-4EEE-8EEE-000000000001', N'OPENING', N'Opening ceremony', N'Event open', DATEADD(DAY,-56,@now), DATEADD(HOUR,2,DATEADD(DAY,-56,@now)), NULL, 1, @now, @now),
  ('FE081400-EEEE-4EEE-8EEE-000000000003', 'FE080100-EEEE-4EEE-8EEE-000000000001', N'SCORING', N'Final scoring window', NULL, DATEADD(DAY,-38,@now), DATEADD(DAY,-35,@now), NULL, 2, @now, @now);
INSERT INTO prizes (id, created_at, created_by, quantity, [rank], value, event_id, label, track_id) VALUES
  ('FE080700-EEEE-4EEE-8EEE-000000000001', @now, N'test.coord@fpt.edu.vn', 1, N'FIRST', N'10,000,000 VND + Trophy', 'FE080100-EEEE-4EEE-8EEE-000000000001', N'First Prize', NULL),
  ('FE080700-EEEE-4EEE-8EEE-000000000002', @now, N'test.coord@fpt.edu.vn', 1, N'SECOND', N'5,000,000 VND', 'FE080100-EEEE-4EEE-8EEE-000000000001', N'Second Prize', NULL),
  ('FE080700-EEEE-4EEE-8EEE-000000000003', @now, N'test.coord@fpt.edu.vn', 1, N'THIRD', N'2,000,000 VND', 'FE080100-EEEE-4EEE-8EEE-000000000001', N'Third Prize', NULL);
INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id, created_by) VALUES
  (NEWID(), @now, @now, @j1, 'FE080100-EEEE-4EEE-8EEE-000000000001', N'test.coord@fpt.edu.vn'),
  (NEWID(), @now, @now, @j2, 'FE080100-EEEE-4EEE-8EEE-000000000001', N'test.coord@fpt.edu.vn');
INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active, created_by) VALUES
  (NEWID(), @now, @now, @j1, 'FE080300-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1, N'test.coord@fpt.edu.vn'),
  (NEWID(), @now, @now, @j2, 'FE080300-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1, N'test.coord@fpt.edu.vn'),
  (NEWID(), @now, @now, @j1, 'FE080300-EEEE-4EEE-8EEE-000000000002', N'ROUND', 1, N'test.coord@fpt.edu.vn'),
  (NEWID(), @now, @now, @j2, 'FE080300-EEEE-4EEE-8EEE-000000000002', N'ROUND', 1, N'test.coord@fpt.edu.vn');
INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, N'test.coord@fpt.edu.vn', @now, 'FE080100-EEEE-4EEE-8EEE-000000000001', N'APPROVED', u.id, 1, 1
FROM users u WHERE u.email LIKE N'test.fb.s%@fpt.edu.vn';
DECLARE @L_FE080200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s01@fpt.edu.vn');
DECLARE @M2_FE080200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s02@fpt.edu.vn');
DECLARE @M3_FE080200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s03@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE080200-EEEE-4EEE-8EEE-000000000001', @now, N'test.coord@fpt.edu.vn', 'FE080100-EEEE-4EEE-8EEE-000000000001', @L_FE080200EEEE4EEE8EEE000000000001, N'Feedback Team Alpha', N'CONFIRMED', 'FE080400-EEEE-4EEE-8EEE-000000000001', 'FE080A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE080200EEEE4EEE8EEE000000000001, 'FE080200-EEEE-4EEE-8EEE-000000000001', 'FE080100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE080200EEEE4EEE8EEE000000000001, 'FE080200-EEEE-4EEE-8EEE-000000000001', 'FE080100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE080200EEEE4EEE8EEE000000000001, 'FE080200-EEEE-4EEE-8EEE-000000000001', 'FE080100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE080500-EEEE-4EEE-8EEE-000000000001', @now, N'test.coord@fpt.edu.vn', NULL, 'FE080300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @L_FE080200EEEE4EEE8EEE000000000001, 'FE080200-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE080B00-EEEE-4EEE-8EEE-000000000001', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/fb-prelim-1', N'https://docs.google.com/presentation/d/fb-prelim-1', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-51,@now), 1, 'FE080500-EEEE-4EEE-8EEE-000000000001');
UPDATE submissions SET current_version_id='FE080B00-EEEE-4EEE-8EEE-000000000001' WHERE id='FE080500-EEEE-4EEE-8EEE-000000000001';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-00000000000B', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-46,@now), @j1, 'FE080300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-47,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000001', 95, 'FE080C00-EEEE-4EEE-8EEE-00000000000B'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000002', 95, 'FE080C00-EEEE-4EEE-8EEE-00000000000B'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000003', 90, 'FE080C00-EEEE-4EEE-8EEE-00000000000B');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-00000000000C', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-46,@now), @j2, 'FE080300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-47,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000001', 95, 'FE080C00-EEEE-4EEE-8EEE-00000000000C'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000002', 95, 'FE080C00-EEEE-4EEE-8EEE-00000000000C'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000003', 90, 'FE080C00-EEEE-4EEE-8EEE-00000000000C');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-45,@now), 95.00, 1, 'FE080300-EEEE-4EEE-8EEE-000000000001', 'FE080200-EEEE-4EEE-8EEE-000000000001', 1, 0, @now);
DECLARE @L_FE080200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s04@fpt.edu.vn');
DECLARE @M2_FE080200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s05@fpt.edu.vn');
DECLARE @M3_FE080200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s06@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE080200-EEEE-4EEE-8EEE-000000000002', @now, N'test.coord@fpt.edu.vn', 'FE080100-EEEE-4EEE-8EEE-000000000001', @L_FE080200EEEE4EEE8EEE000000000002, N'Feedback Team Beta', N'CONFIRMED', 'FE080400-EEEE-4EEE-8EEE-000000000001', 'FE080A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE080200EEEE4EEE8EEE000000000002, 'FE080200-EEEE-4EEE-8EEE-000000000002', 'FE080100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE080200EEEE4EEE8EEE000000000002, 'FE080200-EEEE-4EEE-8EEE-000000000002', 'FE080100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE080200EEEE4EEE8EEE000000000002, 'FE080200-EEEE-4EEE-8EEE-000000000002', 'FE080100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE080500-EEEE-4EEE-8EEE-000000000002', @now, N'test.coord@fpt.edu.vn', NULL, 'FE080300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @L_FE080200EEEE4EEE8EEE000000000002, 'FE080200-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE080B00-EEEE-4EEE-8EEE-000000000002', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/fb-prelim-2', N'https://docs.google.com/presentation/d/fb-prelim-2', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-51,@now), 1, 'FE080500-EEEE-4EEE-8EEE-000000000002');
UPDATE submissions SET current_version_id='FE080B00-EEEE-4EEE-8EEE-000000000002' WHERE id='FE080500-EEEE-4EEE-8EEE-000000000002';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-000000000015', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-46,@now), @j1, 'FE080300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-47,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000001', 92, 'FE080C00-EEEE-4EEE-8EEE-000000000015'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000002', 92, 'FE080C00-EEEE-4EEE-8EEE-000000000015'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000003', 87, 'FE080C00-EEEE-4EEE-8EEE-000000000015');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-000000000016', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-46,@now), @j2, 'FE080300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-47,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000001', 92, 'FE080C00-EEEE-4EEE-8EEE-000000000016'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000002', 92, 'FE080C00-EEEE-4EEE-8EEE-000000000016'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000003', 87, 'FE080C00-EEEE-4EEE-8EEE-000000000016');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-45,@now), 92.00, 2, 'FE080300-EEEE-4EEE-8EEE-000000000001', 'FE080200-EEEE-4EEE-8EEE-000000000002', 1, 0, @now);
DECLARE @L_FE080200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s07@fpt.edu.vn');
DECLARE @M2_FE080200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s08@fpt.edu.vn');
DECLARE @M3_FE080200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s09@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE080200-EEEE-4EEE-8EEE-000000000003', @now, N'test.coord@fpt.edu.vn', 'FE080100-EEEE-4EEE-8EEE-000000000001', @L_FE080200EEEE4EEE8EEE000000000003, N'Feedback Team Gamma', N'CONFIRMED', 'FE080400-EEEE-4EEE-8EEE-000000000001', 'FE080A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE080200EEEE4EEE8EEE000000000003, 'FE080200-EEEE-4EEE-8EEE-000000000003', 'FE080100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE080200EEEE4EEE8EEE000000000003, 'FE080200-EEEE-4EEE-8EEE-000000000003', 'FE080100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE080200EEEE4EEE8EEE000000000003, 'FE080200-EEEE-4EEE-8EEE-000000000003', 'FE080100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE080500-EEEE-4EEE-8EEE-000000000003', @now, N'test.coord@fpt.edu.vn', NULL, 'FE080300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @L_FE080200EEEE4EEE8EEE000000000003, 'FE080200-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE080B00-EEEE-4EEE-8EEE-000000000003', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/fb-prelim-3', N'https://docs.google.com/presentation/d/fb-prelim-3', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-51,@now), 1, 'FE080500-EEEE-4EEE-8EEE-000000000003');
UPDATE submissions SET current_version_id='FE080B00-EEEE-4EEE-8EEE-000000000003' WHERE id='FE080500-EEEE-4EEE-8EEE-000000000003';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-00000000001F', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-46,@now), @j1, 'FE080300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-47,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000001', 89, 'FE080C00-EEEE-4EEE-8EEE-00000000001F'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000002', 89, 'FE080C00-EEEE-4EEE-8EEE-00000000001F'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000003', 84, 'FE080C00-EEEE-4EEE-8EEE-00000000001F');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-000000000020', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-46,@now), @j2, 'FE080300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-47,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000001', 89, 'FE080C00-EEEE-4EEE-8EEE-000000000020'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000002', 89, 'FE080C00-EEEE-4EEE-8EEE-000000000020'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000003', 84, 'FE080C00-EEEE-4EEE-8EEE-000000000020');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-45,@now), 89.00, 3, 'FE080300-EEEE-4EEE-8EEE-000000000001', 'FE080200-EEEE-4EEE-8EEE-000000000003', 1, 0, @now);
DECLARE @L_FE080200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s10@fpt.edu.vn');
DECLARE @M2_FE080200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s11@fpt.edu.vn');
DECLARE @M3_FE080200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s12@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE080200-EEEE-4EEE-8EEE-000000000004', @now, N'test.coord@fpt.edu.vn', 'FE080100-EEEE-4EEE-8EEE-000000000001', @L_FE080200EEEE4EEE8EEE000000000004, N'Feedback Team Delta', N'CONFIRMED', 'FE080400-EEEE-4EEE-8EEE-000000000001', 'FE080A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE080200EEEE4EEE8EEE000000000004, 'FE080200-EEEE-4EEE-8EEE-000000000004', 'FE080100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE080200EEEE4EEE8EEE000000000004, 'FE080200-EEEE-4EEE-8EEE-000000000004', 'FE080100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE080200EEEE4EEE8EEE000000000004, 'FE080200-EEEE-4EEE-8EEE-000000000004', 'FE080100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE080500-EEEE-4EEE-8EEE-000000000004', @now, N'test.coord@fpt.edu.vn', NULL, 'FE080300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @L_FE080200EEEE4EEE8EEE000000000004, 'FE080200-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE080B00-EEEE-4EEE-8EEE-000000000004', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/fb-prelim-4', N'https://docs.google.com/presentation/d/fb-prelim-4', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-51,@now), 1, 'FE080500-EEEE-4EEE-8EEE-000000000004');
UPDATE submissions SET current_version_id='FE080B00-EEEE-4EEE-8EEE-000000000004' WHERE id='FE080500-EEEE-4EEE-8EEE-000000000004';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-000000000029', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-46,@now), @j1, 'FE080300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-47,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000001', 86, 'FE080C00-EEEE-4EEE-8EEE-000000000029'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000002', 86, 'FE080C00-EEEE-4EEE-8EEE-000000000029'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000003', 81, 'FE080C00-EEEE-4EEE-8EEE-000000000029');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-00000000002A', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-46,@now), @j2, 'FE080300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-47,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000001', 86, 'FE080C00-EEEE-4EEE-8EEE-00000000002A'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000002', 86, 'FE080C00-EEEE-4EEE-8EEE-00000000002A'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000003', 81, 'FE080C00-EEEE-4EEE-8EEE-00000000002A');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-45,@now), 86.00, 4, 'FE080300-EEEE-4EEE-8EEE-000000000001', 'FE080200-EEEE-4EEE-8EEE-000000000004', 1, 0, @now);
DECLARE @L_FE080200EEEE4EEE8EEE000000000005 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s13@fpt.edu.vn');
DECLARE @M2_FE080200EEEE4EEE8EEE000000000005 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s14@fpt.edu.vn');
DECLARE @M3_FE080200EEEE4EEE8EEE000000000005 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s15@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE080200-EEEE-4EEE-8EEE-000000000005', @now, N'test.coord@fpt.edu.vn', 'FE080100-EEEE-4EEE-8EEE-000000000001', @L_FE080200EEEE4EEE8EEE000000000005, N'Feedback Team Epsilon', N'CONFIRMED', 'FE080400-EEEE-4EEE-8EEE-000000000001', 'FE080A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE080200EEEE4EEE8EEE000000000005, 'FE080200-EEEE-4EEE-8EEE-000000000005', 'FE080100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE080200EEEE4EEE8EEE000000000005, 'FE080200-EEEE-4EEE-8EEE-000000000005', 'FE080100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE080200EEEE4EEE8EEE000000000005, 'FE080200-EEEE-4EEE-8EEE-000000000005', 'FE080100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE080500-EEEE-4EEE-8EEE-000000000005', @now, N'test.coord@fpt.edu.vn', NULL, 'FE080300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @L_FE080200EEEE4EEE8EEE000000000005, 'FE080200-EEEE-4EEE-8EEE-000000000005', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE080B00-EEEE-4EEE-8EEE-000000000005', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/fb-prelim-5', N'https://docs.google.com/presentation/d/fb-prelim-5', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-51,@now), 1, 'FE080500-EEEE-4EEE-8EEE-000000000005');
UPDATE submissions SET current_version_id='FE080B00-EEEE-4EEE-8EEE-000000000005' WHERE id='FE080500-EEEE-4EEE-8EEE-000000000005';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-000000000033', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-46,@now), @j1, 'FE080300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-47,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000005', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000001', 83, 'FE080C00-EEEE-4EEE-8EEE-000000000033'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000002', 83, 'FE080C00-EEEE-4EEE-8EEE-000000000033'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000003', 78, 'FE080C00-EEEE-4EEE-8EEE-000000000033');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-000000000034', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-46,@now), @j2, 'FE080300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-47,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000005', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000001', 83, 'FE080C00-EEEE-4EEE-8EEE-000000000034'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000002', 83, 'FE080C00-EEEE-4EEE-8EEE-000000000034'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000003', 78, 'FE080C00-EEEE-4EEE-8EEE-000000000034');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-45,@now), 83.00, 5, 'FE080300-EEEE-4EEE-8EEE-000000000001', 'FE080200-EEEE-4EEE-8EEE-000000000005', 1, 0, @now);
DECLARE @L_FE080200EEEE4EEE8EEE000000000006 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s16@fpt.edu.vn');
DECLARE @M2_FE080200EEEE4EEE8EEE000000000006 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s17@fpt.edu.vn');
DECLARE @M3_FE080200EEEE4EEE8EEE000000000006 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s18@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE080200-EEEE-4EEE-8EEE-000000000006', @now, N'test.coord@fpt.edu.vn', 'FE080100-EEEE-4EEE-8EEE-000000000001', @L_FE080200EEEE4EEE8EEE000000000006, N'Feedback Team Zeta', N'CONFIRMED', 'FE080400-EEEE-4EEE-8EEE-000000000001', 'FE080A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE080200EEEE4EEE8EEE000000000006, 'FE080200-EEEE-4EEE-8EEE-000000000006', 'FE080100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE080200EEEE4EEE8EEE000000000006, 'FE080200-EEEE-4EEE-8EEE-000000000006', 'FE080100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE080200EEEE4EEE8EEE000000000006, 'FE080200-EEEE-4EEE-8EEE-000000000006', 'FE080100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE080500-EEEE-4EEE-8EEE-000000000006', @now, N'test.coord@fpt.edu.vn', NULL, 'FE080300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @L_FE080200EEEE4EEE8EEE000000000006, 'FE080200-EEEE-4EEE-8EEE-000000000006', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE080B00-EEEE-4EEE-8EEE-000000000006', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/fb-prelim-6', N'https://docs.google.com/presentation/d/fb-prelim-6', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-51,@now), 1, 'FE080500-EEEE-4EEE-8EEE-000000000006');
UPDATE submissions SET current_version_id='FE080B00-EEEE-4EEE-8EEE-000000000006' WHERE id='FE080500-EEEE-4EEE-8EEE-000000000006';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-00000000003D', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-46,@now), @j1, 'FE080300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-47,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000006', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000001', 80, 'FE080C00-EEEE-4EEE-8EEE-00000000003D'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000002', 80, 'FE080C00-EEEE-4EEE-8EEE-00000000003D'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000003', 75, 'FE080C00-EEEE-4EEE-8EEE-00000000003D');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-00000000003E', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-46,@now), @j2, 'FE080300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-47,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000006', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000001', 80, 'FE080C00-EEEE-4EEE-8EEE-00000000003E'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000002', 80, 'FE080C00-EEEE-4EEE-8EEE-00000000003E'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000003', 75, 'FE080C00-EEEE-4EEE-8EEE-00000000003E');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-45,@now), 80.00, 6, 'FE080300-EEEE-4EEE-8EEE-000000000001', 'FE080200-EEEE-4EEE-8EEE-000000000006', 1, 0, @now);
DECLARE @L_FE080200EEEE4EEE8EEE000000000007 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s19@fpt.edu.vn');
DECLARE @M2_FE080200EEEE4EEE8EEE000000000007 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s20@fpt.edu.vn');
DECLARE @M3_FE080200EEEE4EEE8EEE000000000007 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s21@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE080200-EEEE-4EEE-8EEE-000000000007', @now, N'test.coord@fpt.edu.vn', 'FE080100-EEEE-4EEE-8EEE-000000000001', @L_FE080200EEEE4EEE8EEE000000000007, N'Feedback Team Eta', N'CONFIRMED', 'FE080400-EEEE-4EEE-8EEE-000000000001', 'FE080A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE080200EEEE4EEE8EEE000000000007, 'FE080200-EEEE-4EEE-8EEE-000000000007', 'FE080100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE080200EEEE4EEE8EEE000000000007, 'FE080200-EEEE-4EEE-8EEE-000000000007', 'FE080100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE080200EEEE4EEE8EEE000000000007, 'FE080200-EEEE-4EEE-8EEE-000000000007', 'FE080100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE080500-EEEE-4EEE-8EEE-000000000007', @now, N'test.coord@fpt.edu.vn', NULL, 'FE080300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @L_FE080200EEEE4EEE8EEE000000000007, 'FE080200-EEEE-4EEE-8EEE-000000000007', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE080B00-EEEE-4EEE-8EEE-000000000007', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/fb-prelim-7', N'https://docs.google.com/presentation/d/fb-prelim-7', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-51,@now), 1, 'FE080500-EEEE-4EEE-8EEE-000000000007');
UPDATE submissions SET current_version_id='FE080B00-EEEE-4EEE-8EEE-000000000007' WHERE id='FE080500-EEEE-4EEE-8EEE-000000000007';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-000000000047', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-46,@now), @j1, 'FE080300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-47,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000007', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000001', 77, 'FE080C00-EEEE-4EEE-8EEE-000000000047'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000002', 77, 'FE080C00-EEEE-4EEE-8EEE-000000000047'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000003', 72, 'FE080C00-EEEE-4EEE-8EEE-000000000047');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-000000000048', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-46,@now), @j2, 'FE080300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-47,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000007', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000001', 77, 'FE080C00-EEEE-4EEE-8EEE-000000000048'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000002', 77, 'FE080C00-EEEE-4EEE-8EEE-000000000048'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000003', 72, 'FE080C00-EEEE-4EEE-8EEE-000000000048');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-45,@now), 77.00, 7, 'FE080300-EEEE-4EEE-8EEE-000000000001', 'FE080200-EEEE-4EEE-8EEE-000000000007', 1, 0, @now);
DECLARE @L_FE080200EEEE4EEE8EEE000000000008 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s22@fpt.edu.vn');
DECLARE @M2_FE080200EEEE4EEE8EEE000000000008 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s23@fpt.edu.vn');
DECLARE @M3_FE080200EEEE4EEE8EEE000000000008 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s24@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE080200-EEEE-4EEE-8EEE-000000000008', @now, N'test.coord@fpt.edu.vn', 'FE080100-EEEE-4EEE-8EEE-000000000001', @L_FE080200EEEE4EEE8EEE000000000008, N'Feedback Team Theta', N'CONFIRMED', 'FE080400-EEEE-4EEE-8EEE-000000000001', 'FE080A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE080200EEEE4EEE8EEE000000000008, 'FE080200-EEEE-4EEE-8EEE-000000000008', 'FE080100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE080200EEEE4EEE8EEE000000000008, 'FE080200-EEEE-4EEE-8EEE-000000000008', 'FE080100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE080200EEEE4EEE8EEE000000000008, 'FE080200-EEEE-4EEE-8EEE-000000000008', 'FE080100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE080500-EEEE-4EEE-8EEE-000000000008', @now, N'test.coord@fpt.edu.vn', NULL, 'FE080300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @L_FE080200EEEE4EEE8EEE000000000008, 'FE080200-EEEE-4EEE-8EEE-000000000008', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE080B00-EEEE-4EEE-8EEE-000000000008', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/fb-prelim-8', N'https://docs.google.com/presentation/d/fb-prelim-8', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-51,@now), 1, 'FE080500-EEEE-4EEE-8EEE-000000000008');
UPDATE submissions SET current_version_id='FE080B00-EEEE-4EEE-8EEE-000000000008' WHERE id='FE080500-EEEE-4EEE-8EEE-000000000008';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-000000000051', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-46,@now), @j1, 'FE080300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-47,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000008', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000001', 74, 'FE080C00-EEEE-4EEE-8EEE-000000000051'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000002', 74, 'FE080C00-EEEE-4EEE-8EEE-000000000051'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000003', 69, 'FE080C00-EEEE-4EEE-8EEE-000000000051');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-000000000052', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-46,@now), @j2, 'FE080300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-47,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000008', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000001', 74, 'FE080C00-EEEE-4EEE-8EEE-000000000052'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000002', 74, 'FE080C00-EEEE-4EEE-8EEE-000000000052'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000003', 69, 'FE080C00-EEEE-4EEE-8EEE-000000000052');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-45,@now), 74.00, 8, 'FE080300-EEEE-4EEE-8EEE-000000000001', 'FE080200-EEEE-4EEE-8EEE-000000000008', 1, 0, @now);
DECLARE @L_FE080200EEEE4EEE8EEE000000000009 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s25@fpt.edu.vn');
DECLARE @M2_FE080200EEEE4EEE8EEE000000000009 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s26@fpt.edu.vn');
DECLARE @M3_FE080200EEEE4EEE8EEE000000000009 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s27@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE080200-EEEE-4EEE-8EEE-000000000009', @now, N'test.coord@fpt.edu.vn', 'FE080100-EEEE-4EEE-8EEE-000000000001', @L_FE080200EEEE4EEE8EEE000000000009, N'Feedback Team Iota', N'CONFIRMED', 'FE080400-EEEE-4EEE-8EEE-000000000001', 'FE080A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE080200EEEE4EEE8EEE000000000009, 'FE080200-EEEE-4EEE-8EEE-000000000009', 'FE080100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE080200EEEE4EEE8EEE000000000009, 'FE080200-EEEE-4EEE-8EEE-000000000009', 'FE080100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE080200EEEE4EEE8EEE000000000009, 'FE080200-EEEE-4EEE-8EEE-000000000009', 'FE080100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE080500-EEEE-4EEE-8EEE-000000000009', @now, N'test.coord@fpt.edu.vn', NULL, 'FE080300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @L_FE080200EEEE4EEE8EEE000000000009, 'FE080200-EEEE-4EEE-8EEE-000000000009', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE080B00-EEEE-4EEE-8EEE-000000000009', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/fb-prelim-9', N'https://docs.google.com/presentation/d/fb-prelim-9', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-51,@now), 1, 'FE080500-EEEE-4EEE-8EEE-000000000009');
UPDATE submissions SET current_version_id='FE080B00-EEEE-4EEE-8EEE-000000000009' WHERE id='FE080500-EEEE-4EEE-8EEE-000000000009';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-00000000005B', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-46,@now), @j1, 'FE080300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-47,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000009', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000001', 71, 'FE080C00-EEEE-4EEE-8EEE-00000000005B'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000002', 71, 'FE080C00-EEEE-4EEE-8EEE-00000000005B'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000003', 66, 'FE080C00-EEEE-4EEE-8EEE-00000000005B');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-00000000005C', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-46,@now), @j2, 'FE080300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-47,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000009', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000001', 71, 'FE080C00-EEEE-4EEE-8EEE-00000000005C'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000002', 71, 'FE080C00-EEEE-4EEE-8EEE-00000000005C'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000003', 66, 'FE080C00-EEEE-4EEE-8EEE-00000000005C');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-45,@now), 71.00, 9, 'FE080300-EEEE-4EEE-8EEE-000000000001', 'FE080200-EEEE-4EEE-8EEE-000000000009', 1, 0, @now);
DECLARE @L_FE080200EEEE4EEE8EEE00000000000A UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s28@fpt.edu.vn');
DECLARE @M2_FE080200EEEE4EEE8EEE00000000000A UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s29@fpt.edu.vn');
DECLARE @M3_FE080200EEEE4EEE8EEE00000000000A UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.fb.s30@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE080200-EEEE-4EEE-8EEE-00000000000A', @now, N'test.coord@fpt.edu.vn', 'FE080100-EEEE-4EEE-8EEE-000000000001', @L_FE080200EEEE4EEE8EEE00000000000A, N'Feedback Team Kappa', N'CONFIRMED', 'FE080400-EEEE-4EEE-8EEE-000000000001', 'FE080A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Test.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'LEADER', @L_FE080200EEEE4EEE8EEE00000000000A, 'FE080200-EEEE-4EEE-8EEE-00000000000A', 'FE080100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE080200EEEE4EEE8EEE00000000000A, 'FE080200-EEEE-4EEE-8EEE-00000000000A', 'FE080100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE080200EEEE4EEE8EEE00000000000A, 'FE080200-EEEE-4EEE-8EEE-00000000000A', 'FE080100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE080500-EEEE-4EEE-8EEE-00000000000A', @now, N'test.coord@fpt.edu.vn', NULL, 'FE080300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @L_FE080200EEEE4EEE8EEE00000000000A, 'FE080200-EEEE-4EEE-8EEE-00000000000A', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE080B00-EEEE-4EEE-8EEE-00000000000A', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/fb-prelim-10', N'https://docs.google.com/presentation/d/fb-prelim-10', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-51,@now), 1, 'FE080500-EEEE-4EEE-8EEE-00000000000A');
UPDATE submissions SET current_version_id='FE080B00-EEEE-4EEE-8EEE-00000000000A' WHERE id='FE080500-EEEE-4EEE-8EEE-00000000000A';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-000000000065', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-46,@now), @j1, 'FE080300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-47,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-00000000000A', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000001', 68, 'FE080C00-EEEE-4EEE-8EEE-000000000065'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000002', 68, 'FE080C00-EEEE-4EEE-8EEE-000000000065'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000003', 63, 'FE080C00-EEEE-4EEE-8EEE-000000000065');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-000000000066', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-46,@now), @j2, 'FE080300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-47,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-00000000000A', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000001', 68, 'FE080C00-EEEE-4EEE-8EEE-000000000066'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000002', 68, 'FE080C00-EEEE-4EEE-8EEE-000000000066'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000003', 63, 'FE080C00-EEEE-4EEE-8EEE-000000000066');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-45,@now), 68.00, 10, 'FE080300-EEEE-4EEE-8EEE-000000000001', 'FE080200-EEEE-4EEE-8EEE-00000000000A', 1, 0, @now);
INSERT INTO finalist_selections (id, event_id, team_id, track_id, preliminary_rank, selected_reason, selected_at, created_at, updated_at, selection_method, eligible) VALUES
  ('FE080D00-EEEE-4EEE-8EEE-000000000001', 'FE080100-EEEE-4EEE-8EEE-000000000001', 'FE080200-EEEE-4EEE-8EEE-000000000001', 'FE080400-EEEE-4EEE-8EEE-000000000001', 1, N'Top 1', DATEADD(DAY,-44,@now), @now, @now, N'AUTO', 1),
  ('FE080D00-EEEE-4EEE-8EEE-000000000002', 'FE080100-EEEE-4EEE-8EEE-000000000001', 'FE080200-EEEE-4EEE-8EEE-000000000002', 'FE080400-EEEE-4EEE-8EEE-000000000001', 2, N'Top 2', DATEADD(DAY,-44,@now), @now, @now, N'AUTO', 1),
  ('FE080D00-EEEE-4EEE-8EEE-000000000003', 'FE080100-EEEE-4EEE-8EEE-000000000001', 'FE080200-EEEE-4EEE-8EEE-000000000003', 'FE080400-EEEE-4EEE-8EEE-000000000001', 3, N'Top 3', DATEADD(DAY,-44,@now), @now, @now, N'AUTO', 1),
  ('FE080D00-EEEE-4EEE-8EEE-000000000004', 'FE080100-EEEE-4EEE-8EEE-000000000001', 'FE080200-EEEE-4EEE-8EEE-000000000004', 'FE080400-EEEE-4EEE-8EEE-000000000001', 4, N'Top 4', DATEADD(DAY,-44,@now), @now, @now, N'AUTO', 1);
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE080500-EEEE-4EEE-8EEE-000000000015', @now, N'test.coord@fpt.edu.vn', NULL, 'FE080300-EEEE-4EEE-8EEE-000000000002', N'SCORED', @L_FE080200EEEE4EEE8EEE000000000001, 'FE080200-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE080B00-EEEE-4EEE-8EEE-000000000015', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/fb-final-1', N'https://docs.google.com/presentation/d/fb-final-1', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-39,@now), 1, 'FE080500-EEEE-4EEE-8EEE-000000000015');
UPDATE submissions SET current_version_id='FE080B00-EEEE-4EEE-8EEE-000000000015' WHERE id='FE080500-EEEE-4EEE-8EEE-000000000015';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-00000000006F', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-36,@now), @j1, 'FE080300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-37,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000015', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000004', 92, 'FE080C00-EEEE-4EEE-8EEE-00000000006F'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000005', 92, 'FE080C00-EEEE-4EEE-8EEE-00000000006F'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000006', 88, 'FE080C00-EEEE-4EEE-8EEE-00000000006F');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-000000000070', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-36,@now), @j2, 'FE080300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-37,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000015', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000004', 92, 'FE080C00-EEEE-4EEE-8EEE-000000000070'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000005', 92, 'FE080C00-EEEE-4EEE-8EEE-000000000070'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000006', 88, 'FE080C00-EEEE-4EEE-8EEE-000000000070');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-35,@now), 92.00, 1, 'FE080300-EEEE-4EEE-8EEE-000000000002', 'FE080200-EEEE-4EEE-8EEE-000000000001', 1, 0, @now);
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE080500-EEEE-4EEE-8EEE-000000000016', @now, N'test.coord@fpt.edu.vn', NULL, 'FE080300-EEEE-4EEE-8EEE-000000000002', N'SCORED', @L_FE080200EEEE4EEE8EEE000000000002, 'FE080200-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE080B00-EEEE-4EEE-8EEE-000000000016', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/fb-final-2', N'https://docs.google.com/presentation/d/fb-final-2', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-39,@now), 1, 'FE080500-EEEE-4EEE-8EEE-000000000016');
UPDATE submissions SET current_version_id='FE080B00-EEEE-4EEE-8EEE-000000000016' WHERE id='FE080500-EEEE-4EEE-8EEE-000000000016';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-000000000079', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-36,@now), @j1, 'FE080300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-37,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000016', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000004', 86, 'FE080C00-EEEE-4EEE-8EEE-000000000079'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000005', 86, 'FE080C00-EEEE-4EEE-8EEE-000000000079'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000006', 82, 'FE080C00-EEEE-4EEE-8EEE-000000000079');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-00000000007A', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-36,@now), @j2, 'FE080300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-37,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000016', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000004', 86, 'FE080C00-EEEE-4EEE-8EEE-00000000007A'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000005', 86, 'FE080C00-EEEE-4EEE-8EEE-00000000007A'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000006', 82, 'FE080C00-EEEE-4EEE-8EEE-00000000007A');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-35,@now), 86.00, 2, 'FE080300-EEEE-4EEE-8EEE-000000000002', 'FE080200-EEEE-4EEE-8EEE-000000000002', 1, 0, @now);
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE080500-EEEE-4EEE-8EEE-000000000017', @now, N'test.coord@fpt.edu.vn', NULL, 'FE080300-EEEE-4EEE-8EEE-000000000002', N'SCORED', @L_FE080200EEEE4EEE8EEE000000000003, 'FE080200-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE080B00-EEEE-4EEE-8EEE-000000000017', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/fb-final-3', N'https://docs.google.com/presentation/d/fb-final-3', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-39,@now), 1, 'FE080500-EEEE-4EEE-8EEE-000000000017');
UPDATE submissions SET current_version_id='FE080B00-EEEE-4EEE-8EEE-000000000017' WHERE id='FE080500-EEEE-4EEE-8EEE-000000000017';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-000000000083', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-36,@now), @j1, 'FE080300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-37,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000017', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000004', 80, 'FE080C00-EEEE-4EEE-8EEE-000000000083'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000005', 80, 'FE080C00-EEEE-4EEE-8EEE-000000000083'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000006', 76, 'FE080C00-EEEE-4EEE-8EEE-000000000083');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-000000000084', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-36,@now), @j2, 'FE080300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-37,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000017', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000004', 80, 'FE080C00-EEEE-4EEE-8EEE-000000000084'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000005', 80, 'FE080C00-EEEE-4EEE-8EEE-000000000084'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000006', 76, 'FE080C00-EEEE-4EEE-8EEE-000000000084');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-35,@now), 80.00, 3, 'FE080300-EEEE-4EEE-8EEE-000000000002', 'FE080200-EEEE-4EEE-8EEE-000000000003', 1, 0, @now);
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE080500-EEEE-4EEE-8EEE-000000000018', @now, N'test.coord@fpt.edu.vn', NULL, 'FE080300-EEEE-4EEE-8EEE-000000000002', N'SCORED', @L_FE080200EEEE4EEE8EEE000000000004, 'FE080200-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE080B00-EEEE-4EEE-8EEE-000000000018', @now, N'test.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/fb-final-4', N'https://docs.google.com/presentation/d/fb-final-4', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-39,@now), 1, 'FE080500-EEEE-4EEE-8EEE-000000000018');
UPDATE submissions SET current_version_id='FE080B00-EEEE-4EEE-8EEE-000000000018' WHERE id='FE080500-EEEE-4EEE-8EEE-000000000018';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-00000000008D', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-36,@now), @j1, 'FE080300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-37,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000018', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000004', 74, 'FE080C00-EEEE-4EEE-8EEE-00000000008D'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000005', 74, 'FE080C00-EEEE-4EEE-8EEE-00000000008D'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000006', 70, 'FE080C00-EEEE-4EEE-8EEE-00000000008D');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE080C00-EEEE-4EEE-8EEE-00000000008E', @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-36,@now), @j2, 'FE080300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-37,@now), N'COMPLETED', 'FE080500-EEEE-4EEE-8EEE-000000000018', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000004', 74, 'FE080C00-EEEE-4EEE-8EEE-00000000008E'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000005', 74, 'FE080C00-EEEE-4EEE-8EEE-00000000008E'),
  (NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080600-EEEE-4EEE-8EEE-000000000006', 70, 'FE080C00-EEEE-4EEE-8EEE-00000000008E');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'test.coord@fpt.edu.vn', DATEADD(DAY,-35,@now), 74.00, 4, 'FE080300-EEEE-4EEE-8EEE-000000000002', 'FE080200-EEEE-4EEE-8EEE-000000000004', 1, 0, @now);
INSERT INTO published_results (id, created_at, dispute_deadline, published_at, published_by, round_id) VALUES
  ('FE080E00-EEEE-4EEE-8EEE-000000000001', @now, DATEADD(DAY,-43,@now), DATEADD(DAY,-45,@now), @coordId, 'FE080300-EEEE-4EEE-8EEE-000000000001'),
  ('FE080E00-EEEE-4EEE-8EEE-000000000002', @now, DATEADD(DAY,-33,@now), DATEADD(DAY,-35,@now), @coordId, 'FE080300-EEEE-4EEE-8EEE-000000000002');
INSERT INTO team_awards (id, event_id, team_id, prize_id, awarded_at, created_at, updated_at, created_by) VALUES
  ('FE080F00-EEEE-4EEE-8EEE-000000000001', 'FE080100-EEEE-4EEE-8EEE-000000000001', 'FE080200-EEEE-4EEE-8EEE-000000000001', 'FE080700-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-34,@now), @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE080F00-EEEE-4EEE-8EEE-000000000002', 'FE080100-EEEE-4EEE-8EEE-000000000001', 'FE080200-EEEE-4EEE-8EEE-000000000002', 'FE080700-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-34,@now), @now, @now, N'test.coord@fpt.edu.vn'),
  ('FE080F00-EEEE-4EEE-8EEE-000000000003', 'FE080100-EEEE-4EEE-8EEE-000000000001', 'FE080200-EEEE-4EEE-8EEE-000000000003', 'FE080700-EEEE-4EEE-8EEE-000000000003', DATEADD(DAY,-34,@now), @now, @now, N'test.coord@fpt.edu.vn');
IF OBJECT_ID(N'dbo.participation_certificates', N'U') IS NOT NULL
BEGIN
  INSERT INTO participation_certificates (id, created_at, created_by, event_id, user_id, team_id, issued_at)
  SELECT NEWID(), @now, N'test.coord@fpt.edu.vn', 'FE080100-EEEE-4EEE-8EEE-000000000001', tm.user_id, tm.team_id, DATEADD(DAY,-34,@now)
  FROM team_members tm WHERE tm.event_id = 'FE080100-EEEE-4EEE-8EEE-000000000001';
END
INSERT INTO participant_feedbacks (id, created_at, created_by, comment, event_id, overall_rating, submitted_at, team_id, user_id)
VALUES ('FE081000-EEEE-4EEE-8EEE-000000000001', @now, N'test.coord@fpt.edu.vn', N'Clear rounds and fair judging — great for feedback QA.', 'FE080100-EEEE-4EEE-8EEE-000000000001', 5, DATEADD(DAY,-32,@now), 'FE080200-EEEE-4EEE-8EEE-000000000001', (SELECT id FROM users WHERE email=N'test.fb.s01@fpt.edu.vn'));

COMMIT TRANSACTION;

PRINT '=== Feature demo pack ready (password Demo@123456) ===';
PRINT 'Admin:           admin@seal.com';
PRINT 'Coordinator:     test.coord@fpt.edu.vn';
PRINT '1 OPEN empty:    Test 1 - Open Registration (Join Me)';
PRINT '2 OPEN 5 students: test.open.s01..s05@fpt.edu.vn';
PRINT '3 Assignment:    test.assign.s01 (leader Alpha) | mentor test.mentor1@fpt.edu.vn';
PRINT '4 Submission:    test.sub.s01@fpt.edu.vn (leader Submit Alpha) | 6/10 teams submitted';
PRINT '5 Near deadline: test.alert.s01@fpt.edu.vn | 6/10 submitted; alert on Eta';
PRINT '6 Scoring:       test.judge3 PENDING | test.judge1/2 HIGH done | 10 teams';
PRINT '7 Final:         test.final.judge1/2@fpt.edu.vn | 10 teams prelim ranked';
PRINT '8 Feedback:      test.fb.s01@fpt.edu.vn (Alpha FIRST) | 10 teams full COMPLETED graph';
