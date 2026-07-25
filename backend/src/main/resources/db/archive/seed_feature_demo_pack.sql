-- Feature demo pack: 7 events (registration → assignment → submission → scoring → final → feedback).
-- Password for ALL accounts: Demo@123456
-- Regenerate: node _gen_seed_feature_demo_pack.mjs
-- Run: sqlcmd -S localhost -U sa -P <pwd> -C -d SEAL -f 65001 -I -i seed_feature_demo_pack.sql

SET NOCOUNT ON; SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON; SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @pwd NVARCHAR(255) = N'$2a$10$7ZqT629/ciaVAXuzx7B0zO.wFlLuVz6NK3/tNioMOWFLb2gPkXeU2';
DECLARE @now DATETIME2 = SYSUTCDATETIME();
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

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.coord@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Demo Pack Coordinator', user_type=N'EVENT_COORDINATOR', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.coord@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE000000-EEEE-4EEE-8EEE-000000000001',N'demo.coord@fpt.edu.vn',@pwd,N'Demo Pack Coordinator',NULL,NULL,NULL,N'FPT University',
    N'EVENT_COORDINATOR',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.mentor1@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Demo Mentor One', user_type=N'LECTURER', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.mentor1@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE000000-EEEE-4EEE-8EEE-000000000002',N'demo.mentor1@fpt.edu.vn',@pwd,N'Demo Mentor One',NULL,NULL,NULL,N'FPT University',
    N'LECTURER',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.judge1@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Demo Judge One', user_type=N'LECTURER', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.judge1@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE000000-EEEE-4EEE-8EEE-000000000003',N'demo.judge1@fpt.edu.vn',@pwd,N'Demo Judge One',NULL,NULL,NULL,N'FPT University',
    N'LECTURER',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.judge2@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Demo Judge Two', user_type=N'LECTURER', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.judge2@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE000000-EEEE-4EEE-8EEE-000000000004',N'demo.judge2@fpt.edu.vn',@pwd,N'Demo Judge Two',NULL,NULL,NULL,N'FPT University',
    N'LECTURER',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.judge3@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Demo Judge Three (Pending)', user_type=N'LECTURER', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.judge3@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE000000-EEEE-4EEE-8EEE-000000000005',N'demo.judge3@fpt.edu.vn',@pwd,N'Demo Judge Three (Pending)',NULL,NULL,NULL,N'FPT University',
    N'LECTURER',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.final.judge1@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Demo Final Judge One', user_type=N'LECTURER', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.final.judge1@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE000000-EEEE-4EEE-8EEE-000000000006',N'demo.final.judge1@fpt.edu.vn',@pwd,N'Demo Final Judge One',NULL,NULL,NULL,N'FPT University',
    N'LECTURER',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.final.judge2@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Demo Final Judge Two', user_type=N'LECTURER', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.final.judge2@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE000000-EEEE-4EEE-8EEE-000000000007',N'demo.final.judge2@fpt.edu.vn',@pwd,N'Demo Final Judge Two',NULL,NULL,NULL,N'FPT University',
    N'LECTURER',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.open.s01@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Open Demo Student 01', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'OP2001', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.open.s01@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE020900-EEEE-4EEE-8EEE-000000000001',N'demo.open.s01@fpt.edu.vn',@pwd,N'Open Demo Student 01',NULL,NULL,N'OP2001',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.open.s02@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Open Demo Student 02', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'OP2002', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.open.s02@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE020900-EEEE-4EEE-8EEE-000000000002',N'demo.open.s02@fpt.edu.vn',@pwd,N'Open Demo Student 02',NULL,NULL,N'OP2002',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.open.s03@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Open Demo Student 03', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'OP2003', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.open.s03@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE020900-EEEE-4EEE-8EEE-000000000003',N'demo.open.s03@fpt.edu.vn',@pwd,N'Open Demo Student 03',NULL,NULL,N'OP2003',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.open.s04@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Open Demo Student 04', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'OP2004', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.open.s04@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE020900-EEEE-4EEE-8EEE-000000000004',N'demo.open.s04@fpt.edu.vn',@pwd,N'Open Demo Student 04',NULL,NULL,N'OP2004',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.open.s05@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Open Demo Student 05', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'OP2005', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.open.s05@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE020900-EEEE-4EEE-8EEE-000000000005',N'demo.open.s05@fpt.edu.vn',@pwd,N'Open Demo Student 05',NULL,NULL,N'OP2005',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s01@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 01', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2001', university_name=N'FPT University',
    semester=4, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s01@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000001',N'demo.assign.s01@fpt.edu.vn',@pwd,N'Assign Demo Student 01',NULL,NULL,N'AS2001',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,4,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s02@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 02', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2002', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s02@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000002',N'demo.assign.s02@fpt.edu.vn',@pwd,N'Assign Demo Student 02',NULL,NULL,N'AS2002',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s03@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 03', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2003', university_name=N'FPT University',
    semester=6, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s03@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000003',N'demo.assign.s03@fpt.edu.vn',@pwd,N'Assign Demo Student 03',NULL,NULL,N'AS2003',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,6,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s04@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 04', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2004', university_name=N'FPT University',
    semester=7, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s04@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000004',N'demo.assign.s04@fpt.edu.vn',@pwd,N'Assign Demo Student 04',NULL,NULL,N'AS2004',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,7,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s05@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 05', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2005', university_name=N'FPT University',
    semester=8, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s05@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000005',N'demo.assign.s05@fpt.edu.vn',@pwd,N'Assign Demo Student 05',NULL,NULL,N'AS2005',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,8,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s06@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 06', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2006', university_name=N'FPT University',
    semester=4, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s06@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000006',N'demo.assign.s06@fpt.edu.vn',@pwd,N'Assign Demo Student 06',NULL,NULL,N'AS2006',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,4,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s07@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 07', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2007', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s07@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000007',N'demo.assign.s07@fpt.edu.vn',@pwd,N'Assign Demo Student 07',NULL,NULL,N'AS2007',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s08@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 08', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2008', university_name=N'FPT University',
    semester=6, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s08@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000008',N'demo.assign.s08@fpt.edu.vn',@pwd,N'Assign Demo Student 08',NULL,NULL,N'AS2008',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,6,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s09@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 09', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2009', university_name=N'FPT University',
    semester=7, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s09@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000009',N'demo.assign.s09@fpt.edu.vn',@pwd,N'Assign Demo Student 09',NULL,NULL,N'AS2009',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,7,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s10@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 10', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2010', university_name=N'FPT University',
    semester=8, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s10@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-00000000000A',N'demo.assign.s10@fpt.edu.vn',@pwd,N'Assign Demo Student 10',NULL,NULL,N'AS2010',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,8,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s11@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 11', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2011', university_name=N'FPT University',
    semester=4, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s11@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-00000000000B',N'demo.assign.s11@fpt.edu.vn',@pwd,N'Assign Demo Student 11',NULL,NULL,N'AS2011',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,4,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s12@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 12', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2012', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s12@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-00000000000C',N'demo.assign.s12@fpt.edu.vn',@pwd,N'Assign Demo Student 12',NULL,NULL,N'AS2012',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s13@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 13', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2013', university_name=N'FPT University',
    semester=6, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s13@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-00000000000D',N'demo.assign.s13@fpt.edu.vn',@pwd,N'Assign Demo Student 13',NULL,NULL,N'AS2013',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,6,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s14@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 14', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2014', university_name=N'FPT University',
    semester=7, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s14@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-00000000000E',N'demo.assign.s14@fpt.edu.vn',@pwd,N'Assign Demo Student 14',NULL,NULL,N'AS2014',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,7,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s15@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 15', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2015', university_name=N'FPT University',
    semester=8, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s15@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-00000000000F',N'demo.assign.s15@fpt.edu.vn',@pwd,N'Assign Demo Student 15',NULL,NULL,N'AS2015',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,8,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s16@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 16', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2016', university_name=N'FPT University',
    semester=4, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s16@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000010',N'demo.assign.s16@fpt.edu.vn',@pwd,N'Assign Demo Student 16',NULL,NULL,N'AS2016',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,4,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s17@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 17', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2017', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s17@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000011',N'demo.assign.s17@fpt.edu.vn',@pwd,N'Assign Demo Student 17',NULL,NULL,N'AS2017',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s18@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 18', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2018', university_name=N'FPT University',
    semester=6, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s18@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000012',N'demo.assign.s18@fpt.edu.vn',@pwd,N'Assign Demo Student 18',NULL,NULL,N'AS2018',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,6,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s19@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 19', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2019', university_name=N'FPT University',
    semester=7, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s19@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000013',N'demo.assign.s19@fpt.edu.vn',@pwd,N'Assign Demo Student 19',NULL,NULL,N'AS2019',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,7,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s20@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 20', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2020', university_name=N'FPT University',
    semester=8, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s20@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000014',N'demo.assign.s20@fpt.edu.vn',@pwd,N'Assign Demo Student 20',NULL,NULL,N'AS2020',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,8,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s21@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 21', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2021', university_name=N'FPT University',
    semester=4, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s21@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000015',N'demo.assign.s21@fpt.edu.vn',@pwd,N'Assign Demo Student 21',NULL,NULL,N'AS2021',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,4,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s22@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 22', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2022', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s22@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000016',N'demo.assign.s22@fpt.edu.vn',@pwd,N'Assign Demo Student 22',NULL,NULL,N'AS2022',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s23@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 23', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2023', university_name=N'FPT University',
    semester=6, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s23@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000017',N'demo.assign.s23@fpt.edu.vn',@pwd,N'Assign Demo Student 23',NULL,NULL,N'AS2023',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,6,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s24@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 24', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2024', university_name=N'FPT University',
    semester=7, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s24@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000018',N'demo.assign.s24@fpt.edu.vn',@pwd,N'Assign Demo Student 24',NULL,NULL,N'AS2024',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,7,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s25@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 25', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2025', university_name=N'FPT University',
    semester=8, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s25@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-000000000019',N'demo.assign.s25@fpt.edu.vn',@pwd,N'Assign Demo Student 25',NULL,NULL,N'AS2025',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,8,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s26@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 26', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2026', university_name=N'FPT University',
    semester=4, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s26@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-00000000001A',N'demo.assign.s26@fpt.edu.vn',@pwd,N'Assign Demo Student 26',NULL,NULL,N'AS2026',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,4,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s27@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 27', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2027', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s27@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-00000000001B',N'demo.assign.s27@fpt.edu.vn',@pwd,N'Assign Demo Student 27',NULL,NULL,N'AS2027',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s28@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 28', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2028', university_name=N'FPT University',
    semester=6, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s28@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-00000000001C',N'demo.assign.s28@fpt.edu.vn',@pwd,N'Assign Demo Student 28',NULL,NULL,N'AS2028',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,6,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s29@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 29', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2029', university_name=N'FPT University',
    semester=7, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s29@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-00000000001D',N'demo.assign.s29@fpt.edu.vn',@pwd,N'Assign Demo Student 29',NULL,NULL,N'AS2029',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,7,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.assign.s30@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Student 30', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'AS2030', university_name=N'FPT University',
    semester=8, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.assign.s30@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE030900-EEEE-4EEE-8EEE-00000000001E',N'demo.assign.s30@fpt.edu.vn',@pwd,N'Assign Demo Student 30',NULL,NULL,N'AS2030',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,8,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.sub.s01@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Submit Demo Student 01', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2001', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.sub.s01@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000001',N'demo.sub.s01@fpt.edu.vn',@pwd,N'Submit Demo Student 01',NULL,NULL,N'SB2001',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.sub.s02@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Submit Demo Student 02', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2002', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.sub.s02@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000002',N'demo.sub.s02@fpt.edu.vn',@pwd,N'Submit Demo Student 02',NULL,NULL,N'SB2002',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.sub.s03@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Submit Demo Student 03', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2003', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.sub.s03@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000003',N'demo.sub.s03@fpt.edu.vn',@pwd,N'Submit Demo Student 03',NULL,NULL,N'SB2003',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.sub.s04@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Submit Demo Student 04', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2004', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.sub.s04@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000004',N'demo.sub.s04@fpt.edu.vn',@pwd,N'Submit Demo Student 04',NULL,NULL,N'SB2004',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.sub.s05@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Submit Demo Student 05', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2005', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.sub.s05@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000005',N'demo.sub.s05@fpt.edu.vn',@pwd,N'Submit Demo Student 05',NULL,NULL,N'SB2005',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.sub.s06@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Submit Demo Student 06', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SB2006', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.sub.s06@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE040900-EEEE-4EEE-8EEE-000000000006',N'demo.sub.s06@fpt.edu.vn',@pwd,N'Submit Demo Student 06',NULL,NULL,N'SB2006',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.score.s01@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Score Demo Student 01', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2001', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.score.s01@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000001',N'demo.score.s01@fpt.edu.vn',@pwd,N'Score Demo Student 01',NULL,NULL,N'SC2001',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.score.s02@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Score Demo Student 02', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2002', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.score.s02@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000002',N'demo.score.s02@fpt.edu.vn',@pwd,N'Score Demo Student 02',NULL,NULL,N'SC2002',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.score.s03@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Score Demo Student 03', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2003', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.score.s03@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000003',N'demo.score.s03@fpt.edu.vn',@pwd,N'Score Demo Student 03',NULL,NULL,N'SC2003',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.score.s04@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Score Demo Student 04', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2004', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.score.s04@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000004',N'demo.score.s04@fpt.edu.vn',@pwd,N'Score Demo Student 04',NULL,NULL,N'SC2004',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.score.s05@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Score Demo Student 05', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2005', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.score.s05@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000005',N'demo.score.s05@fpt.edu.vn',@pwd,N'Score Demo Student 05',NULL,NULL,N'SC2005',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.score.s06@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Score Demo Student 06', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2006', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.score.s06@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000006',N'demo.score.s06@fpt.edu.vn',@pwd,N'Score Demo Student 06',NULL,NULL,N'SC2006',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.score.s07@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Score Demo Student 07', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2007', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.score.s07@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000007',N'demo.score.s07@fpt.edu.vn',@pwd,N'Score Demo Student 07',NULL,NULL,N'SC2007',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.score.s08@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Score Demo Student 08', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2008', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.score.s08@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000008',N'demo.score.s08@fpt.edu.vn',@pwd,N'Score Demo Student 08',NULL,NULL,N'SC2008',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.score.s09@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Score Demo Student 09', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SC2009', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.score.s09@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE050900-EEEE-4EEE-8EEE-000000000009',N'demo.score.s09@fpt.edu.vn',@pwd,N'Score Demo Student 09',NULL,NULL,N'SC2009',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.final.s01@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Final Demo Student 01', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2001', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.final.s01@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000001',N'demo.final.s01@fpt.edu.vn',@pwd,N'Final Demo Student 01',NULL,NULL,N'FN2001',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.final.s02@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Final Demo Student 02', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2002', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.final.s02@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000002',N'demo.final.s02@fpt.edu.vn',@pwd,N'Final Demo Student 02',NULL,NULL,N'FN2002',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.final.s03@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Final Demo Student 03', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2003', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.final.s03@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000003',N'demo.final.s03@fpt.edu.vn',@pwd,N'Final Demo Student 03',NULL,NULL,N'FN2003',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.final.s04@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Final Demo Student 04', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2004', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.final.s04@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000004',N'demo.final.s04@fpt.edu.vn',@pwd,N'Final Demo Student 04',NULL,NULL,N'FN2004',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.final.s05@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Final Demo Student 05', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2005', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.final.s05@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000005',N'demo.final.s05@fpt.edu.vn',@pwd,N'Final Demo Student 05',NULL,NULL,N'FN2005',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.final.s06@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Final Demo Student 06', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2006', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.final.s06@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000006',N'demo.final.s06@fpt.edu.vn',@pwd,N'Final Demo Student 06',NULL,NULL,N'FN2006',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.final.s07@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Final Demo Student 07', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2007', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.final.s07@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000007',N'demo.final.s07@fpt.edu.vn',@pwd,N'Final Demo Student 07',NULL,NULL,N'FN2007',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.final.s08@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Final Demo Student 08', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2008', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.final.s08@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000008',N'demo.final.s08@fpt.edu.vn',@pwd,N'Final Demo Student 08',NULL,NULL,N'FN2008',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.final.s09@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Final Demo Student 09', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2009', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.final.s09@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-000000000009',N'demo.final.s09@fpt.edu.vn',@pwd,N'Final Demo Student 09',NULL,NULL,N'FN2009',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.final.s10@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Final Demo Student 10', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2010', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.final.s10@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-00000000000A',N'demo.final.s10@fpt.edu.vn',@pwd,N'Final Demo Student 10',NULL,NULL,N'FN2010',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.final.s11@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Final Demo Student 11', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2011', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.final.s11@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-00000000000B',N'demo.final.s11@fpt.edu.vn',@pwd,N'Final Demo Student 11',NULL,NULL,N'FN2011',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.final.s12@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Final Demo Student 12', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FN2012', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.final.s12@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE060900-EEEE-4EEE-8EEE-00000000000C',N'demo.final.s12@fpt.edu.vn',@pwd,N'Final Demo Student 12',NULL,NULL,N'FN2012',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.fb.s01@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Feedback Demo Student 01', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2001', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.fb.s01@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-000000000001',N'demo.fb.s01@fpt.edu.vn',@pwd,N'Feedback Demo Student 01',NULL,NULL,N'FB2001',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.fb.s02@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Feedback Demo Student 02', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2002', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.fb.s02@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-000000000002',N'demo.fb.s02@fpt.edu.vn',@pwd,N'Feedback Demo Student 02',NULL,NULL,N'FB2002',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'demo.fb.s03@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Feedback Demo Student 03', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'FB2003', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'demo.fb.s03@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('FE070900-EEEE-4EEE-8EEE-000000000003',N'demo.fb.s03@fpt.edu.vn',@pwd,N'Feedback Demo Student 03',NULL,NULL,N'FB2003',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

DECLARE @coordId UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.coord@fpt.edu.vn');
DECLARE @mentor1Id UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.mentor1@fpt.edu.vn');
DECLARE @j1 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.judge1@fpt.edu.vn');
DECLARE @j2 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.judge2@fpt.edu.vn');
DECLARE @j3 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.judge3@fpt.edu.vn');
DECLARE @fj1 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.final.judge1@fpt.edu.vn');
DECLARE @fj2 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.final.judge2@fpt.edu.vn');

IF NOT EXISTS (SELECT 1 FROM allowed_email_domains WHERE domain = N'fpt.edu.vn')
  INSERT INTO allowed_email_domains (id, event_id, domain, university_label, organization_name, organization_type, active, created_at, updated_at)
  VALUES (NEWID(), NULL, N'fpt.edu.vn', N'FPT University', N'FPT University', N'UNIVERSITY', 1, @now, @now);

-- ========== 1) OPEN empty ==========
INSERT INTO hackathon_events (id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at,
  avatar_url, require_awards_before_complete, score_scale_max) VALUES (
  'FE010100-EEEE-4EEE-8EEE-000000000001', N'Demo 1 - Open Registration (Join Me)', N'Summer', 2026,
  DATEADD(DAY, 14, @today), DATEADD(DAY, 21, @today),
  DATEADD(DAY, -2, @today), DATEADD(DAY, 10, @today),
  N'Empty OPEN event — enroll and create teams.', N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
  3, 5, 4, 8, @templateId, N'OPEN', 0, @coordId, N'demo.coord@fpt.edu.vn', @now, @now, NULL, 0, 100);
-- Domains: skipped per-event (DB has global UNIQUE on domain); ensure platform fpt.edu.vn once below.
INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, auto_generate_groups, created_at, updated_at, created_by)
VALUES ('FE010400-EEEE-4EEE-8EEE-000000000001', 'FE010100-EEEE-4EEE-8EEE-000000000001', N'Open Track', N'Demo track', NULL, N'OPEN', NULL, 0, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, min_judges_per_round, created_at, updated_at, created_by) VALUES
  ('FE010300-EEEE-4EEE-8EEE-000000000001', 'FE010100-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(DAY,14,@now), DATEADD(DAY,15,@now), DATEADD(HOUR,-2,DATEADD(DAY,14,@now)), DATEADD(DAY,14,@now), DATEADD(DAY,15,@now), 2, N'PER_TRACK_TOP_N', 40, 2, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE010300-EEEE-4EEE-8EEE-000000000002', 'FE010100-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', N'FINAL', DATEADD(DAY,16,@now), DATEADD(DAY,17,@now), NULL, DATEADD(DAY,16,@now), DATEADD(DAY,17,@now), 4, N'FINALIST_POOL', 60, 2, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE010600-EEEE-4EEE-8EEE-000000000001', 'FE010300-EEEE-4EEE-8EEE-000000000001', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE010600-EEEE-4EEE-8EEE-000000000002', 'FE010300-EEEE-4EEE-8EEE-000000000001', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE010600-EEEE-4EEE-8EEE-000000000003', 'FE010300-EEEE-4EEE-8EEE-000000000001', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE010600-EEEE-4EEE-8EEE-000000000004', 'FE010300-EEEE-4EEE-8EEE-000000000002', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE010600-EEEE-4EEE-8EEE-000000000005', 'FE010300-EEEE-4EEE-8EEE-000000000002', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE010600-EEEE-4EEE-8EEE-000000000006', 'FE010300-EEEE-4EEE-8EEE-000000000002', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn');

-- ========== 2) OPEN + 5 students ==========
INSERT INTO hackathon_events (id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at,
  avatar_url, require_awards_before_complete, score_scale_max) VALUES (
  'FE020100-EEEE-4EEE-8EEE-000000000001', N'Demo 2 - Open Registration (5 Students)', N'Summer', 2026,
  DATEADD(DAY, 14, @today), DATEADD(DAY, 21, @today),
  DATEADD(DAY, -3, @today), DATEADD(DAY, 7, @today),
  N'OPEN with 5 enrolled students looking for teams.', N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
  3, 5, 4, 8, @templateId, N'OPEN', 0, @coordId, N'demo.coord@fpt.edu.vn', @now, @now, NULL, 0, 100);
-- Domains: skipped per-event (DB has global UNIQUE on domain); ensure platform fpt.edu.vn once below.
INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, auto_generate_groups, created_at, updated_at, created_by)
VALUES ('FE020400-EEEE-4EEE-8EEE-000000000001', 'FE020100-EEEE-4EEE-8EEE-000000000001', N'Open Track', N'Demo track', NULL, N'OPEN', NULL, 0, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, min_judges_per_round, created_at, updated_at, created_by) VALUES
  ('FE020300-EEEE-4EEE-8EEE-000000000001', 'FE020100-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(DAY,14,@now), DATEADD(DAY,15,@now), DATEADD(HOUR,-2,DATEADD(DAY,14,@now)), DATEADD(DAY,14,@now), DATEADD(DAY,15,@now), 2, N'PER_TRACK_TOP_N', 40, 2, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE020300-EEEE-4EEE-8EEE-000000000002', 'FE020100-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', N'FINAL', DATEADD(DAY,16,@now), DATEADD(DAY,17,@now), NULL, DATEADD(DAY,16,@now), DATEADD(DAY,17,@now), 4, N'FINALIST_POOL', 60, 2, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE020600-EEEE-4EEE-8EEE-000000000001', 'FE020300-EEEE-4EEE-8EEE-000000000001', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE020600-EEEE-4EEE-8EEE-000000000002', 'FE020300-EEEE-4EEE-8EEE-000000000001', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE020600-EEEE-4EEE-8EEE-000000000003', 'FE020300-EEEE-4EEE-8EEE-000000000001', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE020600-EEEE-4EEE-8EEE-000000000004', 'FE020300-EEEE-4EEE-8EEE-000000000002', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE020600-EEEE-4EEE-8EEE-000000000005', 'FE020300-EEEE-4EEE-8EEE-000000000002', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE020600-EEEE-4EEE-8EEE-000000000006', 'FE020300-EEEE-4EEE-8EEE-000000000002', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, 'FE020100-EEEE-4EEE-8EEE-000000000001', N'APPROVED', u.id, 1, 1
FROM users u WHERE u.email LIKE N'demo.open.s%@fpt.edu.vn';

-- ========== 3) Assignment + MentorHub ==========
INSERT INTO hackathon_events (id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at,
  avatar_url, require_awards_before_complete, score_scale_max) VALUES (
  'FE030100-EEEE-4EEE-8EEE-000000000001', N'Demo 3 - Assignment (10 Teams Closed Reg)', N'Summer', 2026,
  DATEADD(DAY, 7, @today), DATEADD(DAY, 8, @today),
  DATEADD(DAY, -30, @today), DATEADD(DAY, -1, @today),
  N'10 CONFIRMED teams. Most unassigned for Assignment QA; Team 01 pre-linked to mentor for MentorHub.', N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
  3, 5, 4, 8, @templateId, N'CLOSED_REGISTRATION', 0, @coordId, N'demo.coord@fpt.edu.vn', @now, @now, NULL, 0, 100);
-- Domains: skipped per-event (DB has global UNIQUE on domain); ensure platform fpt.edu.vn once below.
INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, auto_generate_groups, created_at, updated_at, created_by)
VALUES ('FE030400-EEEE-4EEE-8EEE-000000000001', 'FE030100-EEEE-4EEE-8EEE-000000000001', N'Grounded Retrieval', N'Demo track', NULL, N'OPEN', NULL, 0, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, auto_generate_groups, created_at, updated_at, created_by)
VALUES ('FE030400-EEEE-4EEE-8EEE-000000000002', 'FE030100-EEEE-4EEE-8EEE-000000000001', N'Agent Orchestration', N'Demo track', NULL, N'OPEN', NULL, 0, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, min_judges_per_round, created_at, updated_at, created_by) VALUES
  ('FE030300-EEEE-4EEE-8EEE-000000000001', 'FE030100-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(DAY,7,@now), DATEADD(DAY,8,@now), DATEADD(HOUR,-2,DATEADD(DAY,7,@now)), DATEADD(DAY,7,@now), DATEADD(DAY,8,@now), 2, N'PER_TRACK_TOP_N', 40, 2, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE030300-EEEE-4EEE-8EEE-000000000002', 'FE030100-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', N'FINAL', DATEADD(DAY,8,@now), DATEADD(DAY,9,@now), NULL, DATEADD(DAY,8,@now), DATEADD(DAY,9,@now), 4, N'FINALIST_POOL', 60, 2, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE030600-EEEE-4EEE-8EEE-000000000001', 'FE030300-EEEE-4EEE-8EEE-000000000001', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE030600-EEEE-4EEE-8EEE-000000000002', 'FE030300-EEEE-4EEE-8EEE-000000000001', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE030600-EEEE-4EEE-8EEE-000000000003', 'FE030300-EEEE-4EEE-8EEE-000000000001', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE030600-EEEE-4EEE-8EEE-000000000004', 'FE030300-EEEE-4EEE-8EEE-000000000002', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE030600-EEEE-4EEE-8EEE-000000000005', 'FE030300-EEEE-4EEE-8EEE-000000000002', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE030600-EEEE-4EEE-8EEE-000000000006', 'FE030300-EEEE-4EEE-8EEE-000000000002', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at, created_by)
VALUES (NEWID(), 'FE030100-EEEE-4EEE-8EEE-000000000001', @mentor1Id, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO mentor_assignments (id, created_at, created_by, assigned_at, mentor_user_id, track_id, event_id, team_id, active)
VALUES (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, @mentor1Id, 'FE030400-EEEE-4EEE-8EEE-000000000001', 'FE030100-EEEE-4EEE-8EEE-000000000001', NULL, 1);
INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, 'FE030100-EEEE-4EEE-8EEE-000000000001', N'APPROVED', u.id, 1, 1
FROM users u WHERE u.email LIKE N'demo.assign.s%@fpt.edu.vn';
DECLARE @L_FE030200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s01@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s02@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s03@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000001', @now, N'demo.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000001, N'Assign Alpha', N'CONFIRMED', 'FE030400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000001, 'FE030200-EEEE-4EEE-8EEE-000000000001', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000001, 'FE030200-EEEE-4EEE-8EEE-000000000001', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000001, 'FE030200-EEEE-4EEE-8EEE-000000000001', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s04@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s05@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s06@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000002', @now, N'demo.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000002, N'Assign Beta', N'CONFIRMED', NULL, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000002, 'FE030200-EEEE-4EEE-8EEE-000000000002', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000002, 'FE030200-EEEE-4EEE-8EEE-000000000002', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000002, 'FE030200-EEEE-4EEE-8EEE-000000000002', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s07@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s08@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s09@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000003', @now, N'demo.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000003, N'Assign Gamma', N'CONFIRMED', NULL, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000003, 'FE030200-EEEE-4EEE-8EEE-000000000003', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000003, 'FE030200-EEEE-4EEE-8EEE-000000000003', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000003, 'FE030200-EEEE-4EEE-8EEE-000000000003', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s10@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s11@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s12@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000004', @now, N'demo.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000004, N'Assign Delta', N'CONFIRMED', NULL, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000004, 'FE030200-EEEE-4EEE-8EEE-000000000004', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000004, 'FE030200-EEEE-4EEE-8EEE-000000000004', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000004, 'FE030200-EEEE-4EEE-8EEE-000000000004', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE000000000005 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s13@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000005 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s14@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000005 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s15@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000005', @now, N'demo.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000005, N'Assign Epsilon', N'CONFIRMED', NULL, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000005, 'FE030200-EEEE-4EEE-8EEE-000000000005', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000005, 'FE030200-EEEE-4EEE-8EEE-000000000005', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000005, 'FE030200-EEEE-4EEE-8EEE-000000000005', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE000000000006 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s16@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000006 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s17@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000006 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s18@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000006', @now, N'demo.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000006, N'Assign Zeta', N'CONFIRMED', NULL, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000006, 'FE030200-EEEE-4EEE-8EEE-000000000006', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000006, 'FE030200-EEEE-4EEE-8EEE-000000000006', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000006, 'FE030200-EEEE-4EEE-8EEE-000000000006', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE000000000007 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s19@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000007 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s20@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000007 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s21@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000007', @now, N'demo.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000007, N'Assign Eta', N'CONFIRMED', NULL, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000007, 'FE030200-EEEE-4EEE-8EEE-000000000007', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000007, 'FE030200-EEEE-4EEE-8EEE-000000000007', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000007, 'FE030200-EEEE-4EEE-8EEE-000000000007', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE000000000008 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s22@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000008 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s23@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000008 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s24@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000008', @now, N'demo.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000008, N'Assign Theta', N'CONFIRMED', NULL, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000008, 'FE030200-EEEE-4EEE-8EEE-000000000008', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000008, 'FE030200-EEEE-4EEE-8EEE-000000000008', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000008, 'FE030200-EEEE-4EEE-8EEE-000000000008', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE000000000009 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s25@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000009 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s26@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000009 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s27@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000009', @now, N'demo.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000009, N'Assign Iota', N'CONFIRMED', NULL, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000009, 'FE030200-EEEE-4EEE-8EEE-000000000009', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000009, 'FE030200-EEEE-4EEE-8EEE-000000000009', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000009, 'FE030200-EEEE-4EEE-8EEE-000000000009', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE00000000000A UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s28@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE00000000000A UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s29@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE00000000000A UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s30@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-00000000000A', @now, N'demo.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE00000000000A, N'Assign Kappa', N'CONFIRMED', NULL, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE00000000000A, 'FE030200-EEEE-4EEE-8EEE-00000000000A', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE00000000000A, 'FE030200-EEEE-4EEE-8EEE-00000000000A', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE00000000000A, 'FE030200-EEEE-4EEE-8EEE-00000000000A', 'FE030100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO mentor_teams (id, created_at, created_by, assigned_at, mentor_user_id, team_id)
VALUES (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, @mentor1Id, 'FE030200-EEEE-4EEE-8EEE-000000000001');

-- ========== 4) Submission phase ==========
INSERT INTO hackathon_events (id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at,
  avatar_url, require_awards_before_complete, score_scale_max) VALUES (
  'FE040100-EEEE-4EEE-8EEE-000000000001', N'Demo 4 - Submission Phase (Prelim Open)', N'Summer', 2026,
  DATEADD(DAY, -1, @today), DATEADD(DAY, 14, @today),
  DATEADD(DAY, -40, @today), DATEADD(DAY, -5, @today),
  N'ACTIVE with 2 rounds; Preliminary open for submission.', N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
  3, 5, 4, 8, @templateId, N'ACTIVE', 0, @coordId, N'demo.coord@fpt.edu.vn', @now, @now, NULL, 0, 100);
-- Domains: skipped per-event (DB has global UNIQUE on domain); ensure platform fpt.edu.vn once below.
INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, auto_generate_groups, created_at, updated_at, created_by)
VALUES ('FE040400-EEEE-4EEE-8EEE-000000000001', 'FE040100-EEEE-4EEE-8EEE-000000000001', N'Submission Track', N'Demo track', NULL, N'OPEN', NULL, 0, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, min_judges_per_round, created_at, updated_at, created_by) VALUES
  ('FE040300-EEEE-4EEE-8EEE-000000000001', 'FE040100-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(HOUR,-6,@now), DATEADD(DAY,5,@now), DATEADD(HOUR,-2,DATEADD(DAY,3,@now)), DATEADD(DAY,3,@now), DATEADD(DAY,5,@now), 2, N'PER_TRACK_TOP_N', 40, 2, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE040300-EEEE-4EEE-8EEE-000000000002', 'FE040100-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', N'FINAL', DATEADD(DAY,6,@now), DATEADD(DAY,8,@now), NULL, DATEADD(DAY,6,@now), DATEADD(DAY,8,@now), 4, N'FINALIST_POOL', 60, 2, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE040600-EEEE-4EEE-8EEE-000000000001', 'FE040300-EEEE-4EEE-8EEE-000000000001', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE040600-EEEE-4EEE-8EEE-000000000002', 'FE040300-EEEE-4EEE-8EEE-000000000001', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE040600-EEEE-4EEE-8EEE-000000000003', 'FE040300-EEEE-4EEE-8EEE-000000000001', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE040600-EEEE-4EEE-8EEE-000000000004', 'FE040300-EEEE-4EEE-8EEE-000000000002', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE040600-EEEE-4EEE-8EEE-000000000005', 'FE040300-EEEE-4EEE-8EEE-000000000002', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE040600-EEEE-4EEE-8EEE-000000000006', 'FE040300-EEEE-4EEE-8EEE-000000000002', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, 'FE040100-EEEE-4EEE-8EEE-000000000001', N'APPROVED', u.id, 1, 1
FROM users u WHERE u.email LIKE N'demo.sub.s%@fpt.edu.vn';
DECLARE @L_FE040200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.sub.s01@fpt.edu.vn');
DECLARE @M2_FE040200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.sub.s02@fpt.edu.vn');
DECLARE @M3_FE040200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.sub.s03@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE040200-EEEE-4EEE-8EEE-000000000001', @now, N'demo.coord@fpt.edu.vn', 'FE040100-EEEE-4EEE-8EEE-000000000001', @L_FE040200EEEE4EEE8EEE000000000001, N'Submit Team Alpha', N'CONFIRMED', 'FE040400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE040200EEEE4EEE8EEE000000000001, 'FE040200-EEEE-4EEE-8EEE-000000000001', 'FE040100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE040200EEEE4EEE8EEE000000000001, 'FE040200-EEEE-4EEE-8EEE-000000000001', 'FE040100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE040200EEEE4EEE8EEE000000000001, 'FE040200-EEEE-4EEE-8EEE-000000000001', 'FE040100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE040200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.sub.s04@fpt.edu.vn');
DECLARE @M2_FE040200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.sub.s05@fpt.edu.vn');
DECLARE @M3_FE040200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.sub.s06@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE040200-EEEE-4EEE-8EEE-000000000002', @now, N'demo.coord@fpt.edu.vn', 'FE040100-EEEE-4EEE-8EEE-000000000001', @L_FE040200EEEE4EEE8EEE000000000002, N'Submit Team Beta', N'CONFIRMED', 'FE040400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE040200EEEE4EEE8EEE000000000002, 'FE040200-EEEE-4EEE-8EEE-000000000002', 'FE040100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE040200EEEE4EEE8EEE000000000002, 'FE040200-EEEE-4EEE-8EEE-000000000002', 'FE040100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE040200EEEE4EEE8EEE000000000002, 'FE040200-EEEE-4EEE-8EEE-000000000002', 'FE040100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at, created_by)
VALUES (NEWID(), 'FE040100-EEEE-4EEE-8EEE-000000000001', @mentor1Id, @now, @now, N'demo.coord@fpt.edu.vn');

-- ========== 5) Scoring + deviation ==========
INSERT INTO hackathon_events (id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at,
  avatar_url, require_awards_before_complete, score_scale_max) VALUES (
  'FE050100-EEEE-4EEE-8EEE-000000000001', N'Demo 5 - Scoring (1 Judge Pending / High Deviation)', N'Summer', 2026,
  DATEADD(DAY, -5, @today), DATEADD(DAY, 21, @today),
  DATEADD(DAY, -40, @today), DATEADD(DAY, -10, @today),
  N'3 judges on prelim. Judge1+2 scored HIGH; Judge3 pending — score low to trigger deviation review.', N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
  3, 5, 4, 8, @templateId, N'SCORING', 0, @coordId, N'demo.coord@fpt.edu.vn', @now, @now, NULL, 0, 100);
-- Domains: skipped per-event (DB has global UNIQUE on domain); ensure platform fpt.edu.vn once below.
INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, auto_generate_groups, created_at, updated_at, created_by)
VALUES ('FE050400-EEEE-4EEE-8EEE-000000000001', 'FE050100-EEEE-4EEE-8EEE-000000000001', N'Scoring Track', N'Demo track', NULL, N'OPEN', NULL, 0, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, min_judges_per_round, created_at, updated_at, created_by) VALUES
  ('FE050300-EEEE-4EEE-8EEE-000000000001', 'FE050100-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(DAY,-3,@now), DATEADD(DAY,10,@now), DATEADD(HOUR,-2,DATEADD(DAY,-1,@now)), DATEADD(DAY,-1,@now), DATEADD(DAY,10,@now), 2, N'PER_TRACK_TOP_N', 40, 2, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE050300-EEEE-4EEE-8EEE-000000000002', 'FE050100-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', N'FINAL', DATEADD(DAY,11,@now), DATEADD(DAY,14,@now), NULL, DATEADD(DAY,11,@now), DATEADD(DAY,14,@now), 4, N'FINALIST_POOL', 60, 2, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE050600-EEEE-4EEE-8EEE-000000000001', 'FE050300-EEEE-4EEE-8EEE-000000000001', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE050600-EEEE-4EEE-8EEE-000000000002', 'FE050300-EEEE-4EEE-8EEE-000000000001', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE050600-EEEE-4EEE-8EEE-000000000003', 'FE050300-EEEE-4EEE-8EEE-000000000001', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE050600-EEEE-4EEE-8EEE-000000000004', 'FE050300-EEEE-4EEE-8EEE-000000000002', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE050600-EEEE-4EEE-8EEE-000000000005', 'FE050300-EEEE-4EEE-8EEE-000000000002', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE050600-EEEE-4EEE-8EEE-000000000006', 'FE050300-EEEE-4EEE-8EEE-000000000002', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id, created_by) VALUES
  (NEWID(), @now, @now, @j1, 'FE050100-EEEE-4EEE-8EEE-000000000001', N'demo.coord@fpt.edu.vn'),
  (NEWID(), @now, @now, @j2, 'FE050100-EEEE-4EEE-8EEE-000000000001', N'demo.coord@fpt.edu.vn'),
  (NEWID(), @now, @now, @j3, 'FE050100-EEEE-4EEE-8EEE-000000000001', N'demo.coord@fpt.edu.vn');
INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active, created_by) VALUES
  (NEWID(), @now, @now, @j1, 'FE050300-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1, N'demo.coord@fpt.edu.vn'),
  (NEWID(), @now, @now, @j2, 'FE050300-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1, N'demo.coord@fpt.edu.vn'),
  (NEWID(), @now, @now, @j3, 'FE050300-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1, N'demo.coord@fpt.edu.vn');
INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, 'FE050100-EEEE-4EEE-8EEE-000000000001', N'APPROVED', u.id, 1, 1
FROM users u WHERE u.email LIKE N'demo.score.s%@fpt.edu.vn';
DECLARE @L_FE050200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.score.s01@fpt.edu.vn');
DECLARE @M2_FE050200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.score.s02@fpt.edu.vn');
DECLARE @M3_FE050200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.score.s03@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE050200-EEEE-4EEE-8EEE-000000000001', @now, N'demo.coord@fpt.edu.vn', 'FE050100-EEEE-4EEE-8EEE-000000000001', @L_FE050200EEEE4EEE8EEE000000000001, N'Score Team 01', N'CONFIRMED', 'FE050400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE050200EEEE4EEE8EEE000000000001, 'FE050200-EEEE-4EEE-8EEE-000000000001', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE050200EEEE4EEE8EEE000000000001, 'FE050200-EEEE-4EEE-8EEE-000000000001', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE050200EEEE4EEE8EEE000000000001, 'FE050200-EEEE-4EEE-8EEE-000000000001', 'FE050100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE050500-EEEE-4EEE-8EEE-000000000001', @now, N'demo.coord@fpt.edu.vn', NULL, 'FE050300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'demo.score.s01@fpt.edu.vn'), 'FE050200-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE050700-EEEE-4EEE-8EEE-000000000001', @now, N'demo.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/score-1', N'https://docs.google.com/presentation/d/score-1', NULL, DATEADD(HOUR,-12,@now), 1, 'FE050500-EEEE-4EEE-8EEE-000000000001');
UPDATE submissions SET current_version_id='FE050700-EEEE-4EEE-8EEE-000000000001' WHERE id='FE050500-EEEE-4EEE-8EEE-000000000001';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE050800-EEEE-4EEE-8EEE-00000000000B', @now, N'demo.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j1, 'FE050300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE050500-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE050600-EEEE-4EEE-8EEE-000000000001', 95, 'FE050800-EEEE-4EEE-8EEE-00000000000B'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE050600-EEEE-4EEE-8EEE-000000000002', 98, 'FE050800-EEEE-4EEE-8EEE-00000000000B'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE050600-EEEE-4EEE-8EEE-000000000003', 100, 'FE050800-EEEE-4EEE-8EEE-00000000000B');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE050800-EEEE-4EEE-8EEE-00000000000C', @now, N'demo.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j2, 'FE050300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE050500-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE050600-EEEE-4EEE-8EEE-000000000001', 95, 'FE050800-EEEE-4EEE-8EEE-00000000000C'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE050600-EEEE-4EEE-8EEE-000000000002', 98, 'FE050800-EEEE-4EEE-8EEE-00000000000C'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE050600-EEEE-4EEE-8EEE-000000000003', 100, 'FE050800-EEEE-4EEE-8EEE-00000000000C');
DECLARE @L_FE050200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.score.s04@fpt.edu.vn');
DECLARE @M2_FE050200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.score.s05@fpt.edu.vn');
DECLARE @M3_FE050200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.score.s06@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE050200-EEEE-4EEE-8EEE-000000000002', @now, N'demo.coord@fpt.edu.vn', 'FE050100-EEEE-4EEE-8EEE-000000000001', @L_FE050200EEEE4EEE8EEE000000000002, N'Score Team 02', N'CONFIRMED', 'FE050400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE050200EEEE4EEE8EEE000000000002, 'FE050200-EEEE-4EEE-8EEE-000000000002', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE050200EEEE4EEE8EEE000000000002, 'FE050200-EEEE-4EEE-8EEE-000000000002', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE050200EEEE4EEE8EEE000000000002, 'FE050200-EEEE-4EEE-8EEE-000000000002', 'FE050100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE050500-EEEE-4EEE-8EEE-000000000002', @now, N'demo.coord@fpt.edu.vn', NULL, 'FE050300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'demo.score.s04@fpt.edu.vn'), 'FE050200-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE050700-EEEE-4EEE-8EEE-000000000002', @now, N'demo.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/score-2', N'https://docs.google.com/presentation/d/score-2', NULL, DATEADD(HOUR,-12,@now), 1, 'FE050500-EEEE-4EEE-8EEE-000000000002');
UPDATE submissions SET current_version_id='FE050700-EEEE-4EEE-8EEE-000000000002' WHERE id='FE050500-EEEE-4EEE-8EEE-000000000002';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE050800-EEEE-4EEE-8EEE-000000000015', @now, N'demo.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j1, 'FE050300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE050500-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE050600-EEEE-4EEE-8EEE-000000000001', 95, 'FE050800-EEEE-4EEE-8EEE-000000000015'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE050600-EEEE-4EEE-8EEE-000000000002', 98, 'FE050800-EEEE-4EEE-8EEE-000000000015'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE050600-EEEE-4EEE-8EEE-000000000003', 100, 'FE050800-EEEE-4EEE-8EEE-000000000015');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE050800-EEEE-4EEE-8EEE-000000000016', @now, N'demo.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j2, 'FE050300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE050500-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE050600-EEEE-4EEE-8EEE-000000000001', 95, 'FE050800-EEEE-4EEE-8EEE-000000000016'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE050600-EEEE-4EEE-8EEE-000000000002', 98, 'FE050800-EEEE-4EEE-8EEE-000000000016'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE050600-EEEE-4EEE-8EEE-000000000003', 100, 'FE050800-EEEE-4EEE-8EEE-000000000016');
DECLARE @L_FE050200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.score.s07@fpt.edu.vn');
DECLARE @M2_FE050200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.score.s08@fpt.edu.vn');
DECLARE @M3_FE050200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.score.s09@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE050200-EEEE-4EEE-8EEE-000000000003', @now, N'demo.coord@fpt.edu.vn', 'FE050100-EEEE-4EEE-8EEE-000000000001', @L_FE050200EEEE4EEE8EEE000000000003, N'Score Team 03', N'CONFIRMED', 'FE050400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE050200EEEE4EEE8EEE000000000003, 'FE050200-EEEE-4EEE-8EEE-000000000003', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE050200EEEE4EEE8EEE000000000003, 'FE050200-EEEE-4EEE-8EEE-000000000003', 'FE050100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE050200EEEE4EEE8EEE000000000003, 'FE050200-EEEE-4EEE-8EEE-000000000003', 'FE050100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE050500-EEEE-4EEE-8EEE-000000000003', @now, N'demo.coord@fpt.edu.vn', NULL, 'FE050300-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', (SELECT id FROM users WHERE email=N'demo.score.s07@fpt.edu.vn'), 'FE050200-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE050700-EEEE-4EEE-8EEE-000000000003', @now, N'demo.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/score-3', N'https://docs.google.com/presentation/d/score-3', NULL, DATEADD(HOUR,-12,@now), 1, 'FE050500-EEEE-4EEE-8EEE-000000000003');
UPDATE submissions SET current_version_id='FE050700-EEEE-4EEE-8EEE-000000000003' WHERE id='FE050500-EEEE-4EEE-8EEE-000000000003';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE050800-EEEE-4EEE-8EEE-00000000001F', @now, N'demo.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j1, 'FE050300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE050500-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE050600-EEEE-4EEE-8EEE-000000000001', 95, 'FE050800-EEEE-4EEE-8EEE-00000000001F'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE050600-EEEE-4EEE-8EEE-000000000002', 98, 'FE050800-EEEE-4EEE-8EEE-00000000001F'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE050600-EEEE-4EEE-8EEE-000000000003', 100, 'FE050800-EEEE-4EEE-8EEE-00000000001F');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE050800-EEEE-4EEE-8EEE-000000000020', @now, N'demo.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), @j2, 'FE050300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-3,@now), N'COMPLETED', 'FE050500-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE050600-EEEE-4EEE-8EEE-000000000001', 95, 'FE050800-EEEE-4EEE-8EEE-000000000020'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE050600-EEEE-4EEE-8EEE-000000000002', 98, 'FE050800-EEEE-4EEE-8EEE-000000000020'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE050600-EEEE-4EEE-8EEE-000000000003', 100, 'FE050800-EEEE-4EEE-8EEE-000000000020');

-- ========== 6) Final advancement / LiveScore ==========
INSERT INTO hackathon_events (id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at,
  avatar_url, require_awards_before_complete, score_scale_max) VALUES (
  'FE060100-EEEE-4EEE-8EEE-000000000001', N'Demo 6 - Final Advancement (Prelim Done)', N'Summer', 2026,
  DATEADD(DAY, -5, @today), DATEADD(DAY, 30, @today),
  DATEADD(DAY, -40, @today), DATEADD(DAY, -10, @today),
  N'Prelim fully scored+ranked. Select Finalists then score Final with guest judges.', N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
  3, 5, 4, 8, @templateId, N'SCORING', 0, @coordId, N'demo.coord@fpt.edu.vn', @now, @now, NULL, 0, 100);
-- Domains: skipped per-event (DB has global UNIQUE on domain); ensure platform fpt.edu.vn once below.
INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, auto_generate_groups, created_at, updated_at, created_by)
VALUES ('FE060400-EEEE-4EEE-8EEE-000000000001', 'FE060100-EEEE-4EEE-8EEE-000000000001', N'Final Track', N'Demo track', NULL, N'OPEN', NULL, 0, @now, @now, N'demo.coord@fpt.edu.vn');
IF COL_LENGTH('dbo.competition_groups','event_id') IS NOT NULL AND COL_LENGTH('dbo.competition_groups','sort_order') IS NOT NULL
  INSERT INTO competition_groups (id, track_id, event_id, name, max_teams, sort_order, created_at, updated_at, created_by)
  VALUES ('FE060A00-EEEE-4EEE-8EEE-000000000001', 'FE060400-EEEE-4EEE-8EEE-000000000001', 'FE060100-EEEE-4EEE-8EEE-000000000001', N'Group A', 10, 0, @now, @now, N'demo.coord@fpt.edu.vn'),
         ('FE060A00-EEEE-4EEE-8EEE-000000000002', 'FE060400-EEEE-4EEE-8EEE-000000000001', 'FE060100-EEEE-4EEE-8EEE-000000000001', N'Group B', 10, 1, @now, @now, N'demo.coord@fpt.edu.vn');
ELSE
  INSERT INTO competition_groups (id, track_id, name, created_at, updated_at, created_by)
  VALUES ('FE060A00-EEEE-4EEE-8EEE-000000000001', 'FE060400-EEEE-4EEE-8EEE-000000000001', N'Group A', @now, @now, N'demo.coord@fpt.edu.vn'),
         ('FE060A00-EEEE-4EEE-8EEE-000000000002', 'FE060400-EEEE-4EEE-8EEE-000000000001', N'Group B', @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, min_judges_per_round, created_at, updated_at, created_by) VALUES
  ('FE060300-EEEE-4EEE-8EEE-000000000001', 'FE060100-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(DAY,-5,@now), DATEADD(HOUR,-6,@now), DATEADD(HOUR,-2,DATEADD(DAY,-3,@now)), DATEADD(DAY,-3,@now), DATEADD(HOUR,-6,@now), 1, N'PER_TRACK_TOP_N', 40, 2, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE060300-EEEE-4EEE-8EEE-000000000002', 'FE060100-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', N'FINAL', DATEADD(HOUR,-1,@now), DATEADD(DAY,14,@now), NULL, DATEADD(HOUR,-1,@now), DATEADD(DAY,14,@now), 4, N'FINALIST_POOL', 60, 2, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE060600-EEEE-4EEE-8EEE-000000000001', 'FE060300-EEEE-4EEE-8EEE-000000000001', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE060600-EEEE-4EEE-8EEE-000000000002', 'FE060300-EEEE-4EEE-8EEE-000000000001', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE060600-EEEE-4EEE-8EEE-000000000003', 'FE060300-EEEE-4EEE-8EEE-000000000001', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE060600-EEEE-4EEE-8EEE-000000000004', 'FE060300-EEEE-4EEE-8EEE-000000000002', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE060600-EEEE-4EEE-8EEE-000000000005', 'FE060300-EEEE-4EEE-8EEE-000000000002', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE060600-EEEE-4EEE-8EEE-000000000006', 'FE060300-EEEE-4EEE-8EEE-000000000002', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id, created_by) VALUES
  (NEWID(), @now, @now, @j1, 'FE060100-EEEE-4EEE-8EEE-000000000001', N'demo.coord@fpt.edu.vn'),
  (NEWID(), @now, @now, @j2, 'FE060100-EEEE-4EEE-8EEE-000000000001', N'demo.coord@fpt.edu.vn'),
  (NEWID(), @now, @now, @fj1, 'FE060100-EEEE-4EEE-8EEE-000000000001', N'demo.coord@fpt.edu.vn'),
  (NEWID(), @now, @now, @fj2, 'FE060100-EEEE-4EEE-8EEE-000000000001', N'demo.coord@fpt.edu.vn');
INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active, created_by) VALUES
  (NEWID(), @now, @now, @j1, 'FE060300-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1, N'demo.coord@fpt.edu.vn'),
  (NEWID(), @now, @now, @j2, 'FE060300-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1, N'demo.coord@fpt.edu.vn'),
  (NEWID(), @now, @now, @fj1, 'FE060300-EEEE-4EEE-8EEE-000000000002', N'ROUND', 1, N'demo.coord@fpt.edu.vn'),
  (NEWID(), @now, @now, @fj2, 'FE060300-EEEE-4EEE-8EEE-000000000002', N'ROUND', 1, N'demo.coord@fpt.edu.vn');
INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, 'FE060100-EEEE-4EEE-8EEE-000000000001', N'APPROVED', u.id, 1, 1
FROM users u WHERE u.email LIKE N'demo.final.s%@fpt.edu.vn';
DECLARE @L_FE060200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.final.s01@fpt.edu.vn');
DECLARE @M2_FE060200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.final.s02@fpt.edu.vn');
DECLARE @M3_FE060200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.final.s03@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE060200-EEEE-4EEE-8EEE-000000000001', @now, N'demo.coord@fpt.edu.vn', 'FE060100-EEEE-4EEE-8EEE-000000000001', @L_FE060200EEEE4EEE8EEE000000000001, N'Final Team 01', N'CONFIRMED', 'FE060400-EEEE-4EEE-8EEE-000000000001', 'FE060A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Demo.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE060200EEEE4EEE8EEE000000000001, 'FE060200-EEEE-4EEE-8EEE-000000000001', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE060200EEEE4EEE8EEE000000000001, 'FE060200-EEEE-4EEE-8EEE-000000000001', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE060200EEEE4EEE8EEE000000000001, 'FE060200-EEEE-4EEE-8EEE-000000000001', 'FE060100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE060500-EEEE-4EEE-8EEE-000000000001', @now, N'demo.coord@fpt.edu.vn', NULL, 'FE060300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @L_FE060200EEEE4EEE8EEE000000000001, 'FE060200-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE060700-EEEE-4EEE-8EEE-000000000001', @now, N'demo.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/final-1', N'https://docs.google.com/presentation/d/final-1', NULL, DATEADD(DAY,-3,@now), 1, 'FE060500-EEEE-4EEE-8EEE-000000000001');
UPDATE submissions SET current_version_id='FE060700-EEEE-4EEE-8EEE-000000000001' WHERE id='FE060500-EEEE-4EEE-8EEE-000000000001';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-00000000000B', @now, N'demo.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j1, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 95, 'FE060800-EEEE-4EEE-8EEE-00000000000B'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 95, 'FE060800-EEEE-4EEE-8EEE-00000000000B'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 90, 'FE060800-EEEE-4EEE-8EEE-00000000000B');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-00000000000C', @now, N'demo.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j2, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 95, 'FE060800-EEEE-4EEE-8EEE-00000000000C'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 95, 'FE060800-EEEE-4EEE-8EEE-00000000000C'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 90, 'FE060800-EEEE-4EEE-8EEE-00000000000C');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, 80.00, 1, 'FE060300-EEEE-4EEE-8EEE-000000000001', 'FE060200-EEEE-4EEE-8EEE-000000000001', 1, 0, @now);
DECLARE @L_FE060200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.final.s04@fpt.edu.vn');
DECLARE @M2_FE060200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.final.s05@fpt.edu.vn');
DECLARE @M3_FE060200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.final.s06@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE060200-EEEE-4EEE-8EEE-000000000002', @now, N'demo.coord@fpt.edu.vn', 'FE060100-EEEE-4EEE-8EEE-000000000001', @L_FE060200EEEE4EEE8EEE000000000002, N'Final Team 02', N'CONFIRMED', 'FE060400-EEEE-4EEE-8EEE-000000000001', 'FE060A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Demo.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE060200EEEE4EEE8EEE000000000002, 'FE060200-EEEE-4EEE-8EEE-000000000002', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE060200EEEE4EEE8EEE000000000002, 'FE060200-EEEE-4EEE-8EEE-000000000002', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE060200EEEE4EEE8EEE000000000002, 'FE060200-EEEE-4EEE-8EEE-000000000002', 'FE060100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE060500-EEEE-4EEE-8EEE-000000000002', @now, N'demo.coord@fpt.edu.vn', NULL, 'FE060300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @L_FE060200EEEE4EEE8EEE000000000002, 'FE060200-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE060700-EEEE-4EEE-8EEE-000000000002', @now, N'demo.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/final-2', N'https://docs.google.com/presentation/d/final-2', NULL, DATEADD(DAY,-3,@now), 1, 'FE060500-EEEE-4EEE-8EEE-000000000002');
UPDATE submissions SET current_version_id='FE060700-EEEE-4EEE-8EEE-000000000002' WHERE id='FE060500-EEEE-4EEE-8EEE-000000000002';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-000000000015', @now, N'demo.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j1, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 80, 'FE060800-EEEE-4EEE-8EEE-000000000015'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 80, 'FE060800-EEEE-4EEE-8EEE-000000000015'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 75, 'FE060800-EEEE-4EEE-8EEE-000000000015');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-000000000016', @now, N'demo.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j2, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 80, 'FE060800-EEEE-4EEE-8EEE-000000000016'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 80, 'FE060800-EEEE-4EEE-8EEE-000000000016'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 75, 'FE060800-EEEE-4EEE-8EEE-000000000016');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, 70.00, 2, 'FE060300-EEEE-4EEE-8EEE-000000000001', 'FE060200-EEEE-4EEE-8EEE-000000000002', 1, 0, @now);
DECLARE @L_FE060200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.final.s07@fpt.edu.vn');
DECLARE @M2_FE060200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.final.s08@fpt.edu.vn');
DECLARE @M3_FE060200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.final.s09@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE060200-EEEE-4EEE-8EEE-000000000003', @now, N'demo.coord@fpt.edu.vn', 'FE060100-EEEE-4EEE-8EEE-000000000001', @L_FE060200EEEE4EEE8EEE000000000003, N'Final Team 03', N'CONFIRMED', 'FE060400-EEEE-4EEE-8EEE-000000000001', 'FE060A00-EEEE-4EEE-8EEE-000000000002', @now, N'MANUAL', @coordId, 0, N'Demo.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE060200EEEE4EEE8EEE000000000003, 'FE060200-EEEE-4EEE-8EEE-000000000003', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE060200EEEE4EEE8EEE000000000003, 'FE060200-EEEE-4EEE-8EEE-000000000003', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE060200EEEE4EEE8EEE000000000003, 'FE060200-EEEE-4EEE-8EEE-000000000003', 'FE060100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE060500-EEEE-4EEE-8EEE-000000000003', @now, N'demo.coord@fpt.edu.vn', NULL, 'FE060300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @L_FE060200EEEE4EEE8EEE000000000003, 'FE060200-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE060700-EEEE-4EEE-8EEE-000000000003', @now, N'demo.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/final-3', N'https://docs.google.com/presentation/d/final-3', NULL, DATEADD(DAY,-3,@now), 1, 'FE060500-EEEE-4EEE-8EEE-000000000003');
UPDATE submissions SET current_version_id='FE060700-EEEE-4EEE-8EEE-000000000003' WHERE id='FE060500-EEEE-4EEE-8EEE-000000000003';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-00000000001F', @now, N'demo.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j1, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 65, 'FE060800-EEEE-4EEE-8EEE-00000000001F'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 65, 'FE060800-EEEE-4EEE-8EEE-00000000001F'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 60, 'FE060800-EEEE-4EEE-8EEE-00000000001F');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-000000000020', @now, N'demo.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j2, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 65, 'FE060800-EEEE-4EEE-8EEE-000000000020'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 65, 'FE060800-EEEE-4EEE-8EEE-000000000020'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 60, 'FE060800-EEEE-4EEE-8EEE-000000000020');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, 60.00, 3, 'FE060300-EEEE-4EEE-8EEE-000000000001', 'FE060200-EEEE-4EEE-8EEE-000000000003', 1, 0, @now);
DECLARE @L_FE060200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.final.s10@fpt.edu.vn');
DECLARE @M2_FE060200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.final.s11@fpt.edu.vn');
DECLARE @M3_FE060200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.final.s12@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE060200-EEEE-4EEE-8EEE-000000000004', @now, N'demo.coord@fpt.edu.vn', 'FE060100-EEEE-4EEE-8EEE-000000000001', @L_FE060200EEEE4EEE8EEE000000000004, N'Final Team 04', N'CONFIRMED', 'FE060400-EEEE-4EEE-8EEE-000000000001', 'FE060A00-EEEE-4EEE-8EEE-000000000002', @now, N'MANUAL', @coordId, 0, N'Demo.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE060200EEEE4EEE8EEE000000000004, 'FE060200-EEEE-4EEE-8EEE-000000000004', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE060200EEEE4EEE8EEE000000000004, 'FE060200-EEEE-4EEE-8EEE-000000000004', 'FE060100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE060200EEEE4EEE8EEE000000000004, 'FE060200-EEEE-4EEE-8EEE-000000000004', 'FE060100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('FE060500-EEEE-4EEE-8EEE-000000000004', @now, N'demo.coord@fpt.edu.vn', NULL, 'FE060300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @L_FE060200EEEE4EEE8EEE000000000004, 'FE060200-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('FE060700-EEEE-4EEE-8EEE-000000000004', @now, N'demo.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/final-4', N'https://docs.google.com/presentation/d/final-4', NULL, DATEADD(DAY,-3,@now), 1, 'FE060500-EEEE-4EEE-8EEE-000000000004');
UPDATE submissions SET current_version_id='FE060700-EEEE-4EEE-8EEE-000000000004' WHERE id='FE060500-EEEE-4EEE-8EEE-000000000004';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-000000000029', @now, N'demo.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j1, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 50, 'FE060800-EEEE-4EEE-8EEE-000000000029'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 50, 'FE060800-EEEE-4EEE-8EEE-000000000029'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 45, 'FE060800-EEEE-4EEE-8EEE-000000000029');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('FE060800-EEEE-4EEE-8EEE-00000000002A', @now, N'demo.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), @j2, 'FE060300-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-10,@now), N'COMPLETED', 'FE060500-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000001', 50, 'FE060800-EEEE-4EEE-8EEE-00000000002A'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000002', 50, 'FE060800-EEEE-4EEE-8EEE-00000000002A'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE060600-EEEE-4EEE-8EEE-000000000003', 45, 'FE060800-EEEE-4EEE-8EEE-00000000002A');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, 50.00, 4, 'FE060300-EEEE-4EEE-8EEE-000000000001', 'FE060200-EEEE-4EEE-8EEE-000000000004', 1, 0, @now);

-- ========== 7) Completed + feedback ==========
INSERT INTO hackathon_events (id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at,
  avatar_url, require_awards_before_complete, score_scale_max) VALUES (
  'FE070100-EEEE-4EEE-8EEE-000000000001', N'Demo 7 - Completed (Feedback Ready)', N'Summer', 2026,
  DATEADD(DAY, -60, @today), DATEADD(DAY, -30, @today),
  DATEADD(DAY, -90, @today), DATEADD(DAY, -70, @today),
  N'COMPLETED event — participants can submit post-event feedback.', N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
  3, 5, 4, 8, @templateId, N'COMPLETED', 1, @coordId, N'demo.coord@fpt.edu.vn', @now, @now, NULL, 0, 100);
-- Domains: skipped per-event (DB has global UNIQUE on domain); ensure platform fpt.edu.vn once below.
INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, auto_generate_groups, created_at, updated_at, created_by)
VALUES ('FE070400-EEEE-4EEE-8EEE-000000000001', 'FE070100-EEEE-4EEE-8EEE-000000000001', N'Feedback Track', N'Demo track', NULL, N'OPEN', NULL, 0, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, min_judges_per_round, created_at, updated_at, created_by) VALUES
  ('FE070300-EEEE-4EEE-8EEE-000000000001', 'FE070100-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(DAY,-55,@now), DATEADD(DAY,-45,@now), DATEADD(HOUR,-2,DATEADD(DAY,-50,@now)), DATEADD(DAY,-50,@now), DATEADD(DAY,-45,@now), 2, N'PER_TRACK_TOP_N', 40, 2, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE070300-EEEE-4EEE-8EEE-000000000002', 'FE070100-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', N'FINAL', DATEADD(DAY,-40,@now), DATEADD(DAY,-35,@now), NULL, DATEADD(DAY,-38,@now), DATEADD(DAY,-35,@now), 4, N'FINALIST_POOL', 60, 2, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE070600-EEEE-4EEE-8EEE-000000000001', 'FE070300-EEEE-4EEE-8EEE-000000000001', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE070600-EEEE-4EEE-8EEE-000000000002', 'FE070300-EEEE-4EEE-8EEE-000000000001', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE070600-EEEE-4EEE-8EEE-000000000003', 'FE070300-EEEE-4EEE-8EEE-000000000001', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE070600-EEEE-4EEE-8EEE-000000000004', 'FE070300-EEEE-4EEE-8EEE-000000000002', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE070600-EEEE-4EEE-8EEE-000000000005', 'FE070300-EEEE-4EEE-8EEE-000000000002', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE070600-EEEE-4EEE-8EEE-000000000006', 'FE070300-EEEE-4EEE-8EEE-000000000002', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, 'FE070100-EEEE-4EEE-8EEE-000000000001', N'APPROVED', u.id, 1, 1
FROM users u WHERE u.email LIKE N'demo.fb.s%@fpt.edu.vn';
DECLARE @L_FE070200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.fb.s01@fpt.edu.vn');
DECLARE @M2_FE070200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.fb.s02@fpt.edu.vn');
DECLARE @M3_FE070200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.fb.s03@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE070200-EEEE-4EEE-8EEE-000000000001', @now, N'demo.coord@fpt.edu.vn', 'FE070100-EEEE-4EEE-8EEE-000000000001', @L_FE070200EEEE4EEE8EEE000000000001, N'Feedback Team', N'CONFIRMED', 'FE070400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE070200EEEE4EEE8EEE000000000001, 'FE070200-EEEE-4EEE-8EEE-000000000001', 'FE070100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE070200EEEE4EEE8EEE000000000001, 'FE070200-EEEE-4EEE-8EEE-000000000001', 'FE070100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE070200EEEE4EEE8EEE000000000001, 'FE070200-EEEE-4EEE-8EEE-000000000001', 'FE070100-EEEE-4EEE-8EEE-000000000001');
IF OBJECT_ID(N'dbo.participation_certificates', N'U') IS NOT NULL
BEGIN
  INSERT INTO participation_certificates (id, created_at, created_by, event_id, user_id, team_id, issued_at)
  SELECT NEWID(), @now, N'demo.coord@fpt.edu.vn', 'FE070100-EEEE-4EEE-8EEE-000000000001', u.id, 'FE070200-EEEE-4EEE-8EEE-000000000001', @now
  FROM users u WHERE u.email LIKE N'demo.fb.s%@fpt.edu.vn';
END

COMMIT TRANSACTION;

PRINT '=== Feature demo pack ready (password Demo@123456) ===';
PRINT '1 OPEN empty:     Demo 1 - Open Registration (Join Me)';
PRINT '2 OPEN 5 students: demo.open.s01..s05@fpt.edu.vn';
PRINT '3 Assignment:     demo.assign.s01 (leader Alpha) | mentor demo.mentor1@fpt.edu.vn';
PRINT '4 Submission:     demo.sub.s01@fpt.edu.vn (leader Submit Team Alpha)';
PRINT '5 Scoring:        demo.judge3 PENDING | demo.judge1/2 HIGH done';
PRINT '6 Final:          demo.final.judge1/2@fpt.edu.vn | Select Finalists first';
PRINT '7 Feedback:       demo.fb.s01@fpt.edu.vn';
