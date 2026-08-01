-- Full COMPLETED Vinh Showcase pack (3 events) + achievements for nguyentruongvinh05@gmail.com
-- Password: Demo@123456
-- Regenerate: node _gen_seed_vinh_achievements.mjs
-- Run: sqlcmd -S localhost,1433 -U sa -P <pwd> -C -d SEAL -f 65001 -I -i seed_vinh_achievements.sql

SET NOCOUNT ON; SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON; SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @pwd NVARCHAR(255) = N'$2a$10$7ZqT629/ciaVAXuzx7B0zO.wFlLuVz6NK3/tNioMOWFLb2gPkXeU2';
DECLARE @now DATETIME2 = SYSDATETIME();
DECLARE @today DATE = CAST(@now AS DATE);
DECLARE @templateId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM scoring_templates ORDER BY created_at);
DECLARE @ownerUserId UNIQUEIDENTIFIER = (
  SELECT TOP 1 id FROM users WHERE email IN (N'admin@seal.com', N'test.coord@fpt.edu.vn')
  ORDER BY CASE email WHEN N'admin@seal.com' THEN 0 ELSE 1 END);
DECLARE @ownerEmail NVARCHAR(255) = (SELECT email FROM users WHERE id = @ownerUserId);
IF @templateId IS NULL BEGIN RAISERROR('No scoring template.', 16, 1); ROLLBACK; RETURN; END
IF @ownerUserId IS NULL BEGIN RAISERROR('Need admin@seal.com.', 16, 1); ROLLBACK; RETURN; END

DECLARE @packEvents TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @packEvents VALUES ('B1010100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO @packEvents VALUES ('B1020100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO @packEvents VALUES ('B1030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @packTeams TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @packTeams SELECT id FROM teams WHERE event_id IN (SELECT id FROM @packEvents);
DECLARE @packRounds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @packRounds SELECT id FROM rounds WHERE event_id IN (SELECT id FROM @packEvents);
DECLARE @packSubs TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @packSubs SELECT s.id FROM submissions s WHERE s.round_id IN (SELECT id FROM @packRounds);

DELETE jc FROM judge_comments jc INNER JOIN judge_scores js ON js.id = jc.judge_score_id WHERE js.submission_id IN (SELECT id FROM @packSubs);
DELETE jsd FROM judge_score_details jsd INNER JOIN judge_scores js ON js.id = jsd.judge_score_id WHERE js.submission_id IN (SELECT id FROM @packSubs);
DELETE FROM judge_scores WHERE submission_id IN (SELECT id FROM @packSubs);
IF OBJECT_ID(N'dbo.submission_attachments', N'U') IS NOT NULL
  DELETE sa FROM submission_attachments sa INNER JOIN submission_versions sv ON sv.id = sa.submission_version_id WHERE sv.submission_id IN (SELECT id FROM @packSubs);
UPDATE submissions SET current_version_id = NULL WHERE id IN (SELECT id FROM @packSubs);
DELETE FROM submission_versions WHERE submission_id IN (SELECT id FROM @packSubs);
DELETE FROM submissions WHERE id IN (SELECT id FROM @packSubs);
IF OBJECT_ID(N'dbo.published_results', N'U') IS NOT NULL DELETE FROM published_results WHERE round_id IN (SELECT id FROM @packRounds);
IF OBJECT_ID(N'dbo.rankings', N'U') IS NOT NULL DELETE FROM rankings WHERE round_id IN (SELECT id FROM @packRounds);
IF OBJECT_ID(N'dbo.finalist_selections', N'U') IS NOT NULL DELETE FROM finalist_selections WHERE event_id IN (SELECT id FROM @packEvents);
DELETE FROM team_awards WHERE event_id IN (SELECT id FROM @packEvents);
DELETE FROM participation_certificates WHERE event_id IN (SELECT id FROM @packEvents);
IF OBJECT_ID(N'dbo.participant_feedbacks', N'U') IS NOT NULL DELETE FROM participant_feedbacks WHERE event_id IN (SELECT id FROM @packEvents);
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

IF EXISTS (SELECT 1 FROM users WHERE email = N'nguyentruongvinh05@gmail.com')
  UPDATE users SET password_hash=@pwd, full_name=N'Nguyen Truong Vinh', user_type=N'EXTERNAL_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'External',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'nguyentruongvinh05@gmail.com';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000000-EEEE-4EEE-8EEE-000000000001',N'nguyentruongvinh05@gmail.com',@pwd,N'Nguyen Truong Vinh',NULL,NULL,NULL,N'External',
    N'EXTERNAL_STUDENT',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.mate1@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Mate One', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VM2001', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.mate1@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000000-EEEE-4EEE-8EEE-000000000002',N'vinh.mate1@fpt.edu.vn',@pwd,N'Vinh Mate One',NULL,NULL,N'VM2001',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.mate2@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Mate Two', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VM2002', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.mate2@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000000-EEEE-4EEE-8EEE-000000000003',N'vinh.mate2@fpt.edu.vn',@pwd,N'Vinh Mate Two',NULL,NULL,N'VM2002',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r01@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 01', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2001', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r01@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-000000000001',N'vinh.r01@fpt.edu.vn',@pwd,N'Vinh Rival 01',NULL,NULL,N'VR2001',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r02@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 02', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2002', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r02@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-000000000002',N'vinh.r02@fpt.edu.vn',@pwd,N'Vinh Rival 02',NULL,NULL,N'VR2002',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r03@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 03', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2003', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r03@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-000000000003',N'vinh.r03@fpt.edu.vn',@pwd,N'Vinh Rival 03',NULL,NULL,N'VR2003',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r04@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 04', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2004', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r04@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-000000000004',N'vinh.r04@fpt.edu.vn',@pwd,N'Vinh Rival 04',NULL,NULL,N'VR2004',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r05@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 05', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2005', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r05@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-000000000005',N'vinh.r05@fpt.edu.vn',@pwd,N'Vinh Rival 05',NULL,NULL,N'VR2005',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r06@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 06', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2006', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r06@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-000000000006',N'vinh.r06@fpt.edu.vn',@pwd,N'Vinh Rival 06',NULL,NULL,N'VR2006',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r07@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 07', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2007', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r07@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-000000000007',N'vinh.r07@fpt.edu.vn',@pwd,N'Vinh Rival 07',NULL,NULL,N'VR2007',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r08@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 08', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2008', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r08@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-000000000008',N'vinh.r08@fpt.edu.vn',@pwd,N'Vinh Rival 08',NULL,NULL,N'VR2008',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r09@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 09', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2009', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r09@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-000000000009',N'vinh.r09@fpt.edu.vn',@pwd,N'Vinh Rival 09',NULL,NULL,N'VR2009',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r10@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 10', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2010', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r10@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-00000000000A',N'vinh.r10@fpt.edu.vn',@pwd,N'Vinh Rival 10',NULL,NULL,N'VR2010',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r11@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 11', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2011', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r11@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-00000000000B',N'vinh.r11@fpt.edu.vn',@pwd,N'Vinh Rival 11',NULL,NULL,N'VR2011',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r12@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 12', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2012', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r12@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-00000000000C',N'vinh.r12@fpt.edu.vn',@pwd,N'Vinh Rival 12',NULL,NULL,N'VR2012',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r13@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 13', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2013', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r13@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-00000000000D',N'vinh.r13@fpt.edu.vn',@pwd,N'Vinh Rival 13',NULL,NULL,N'VR2013',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r14@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 14', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2014', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r14@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-00000000000E',N'vinh.r14@fpt.edu.vn',@pwd,N'Vinh Rival 14',NULL,NULL,N'VR2014',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r15@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 15', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2015', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r15@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-00000000000F',N'vinh.r15@fpt.edu.vn',@pwd,N'Vinh Rival 15',NULL,NULL,N'VR2015',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r16@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 16', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2016', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r16@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-000000000010',N'vinh.r16@fpt.edu.vn',@pwd,N'Vinh Rival 16',NULL,NULL,N'VR2016',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r17@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 17', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2017', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r17@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-000000000011',N'vinh.r17@fpt.edu.vn',@pwd,N'Vinh Rival 17',NULL,NULL,N'VR2017',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r18@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 18', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2018', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r18@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-000000000012',N'vinh.r18@fpt.edu.vn',@pwd,N'Vinh Rival 18',NULL,NULL,N'VR2018',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r19@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 19', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2019', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r19@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-000000000013',N'vinh.r19@fpt.edu.vn',@pwd,N'Vinh Rival 19',NULL,NULL,N'VR2019',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r20@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 20', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2020', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r20@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-000000000014',N'vinh.r20@fpt.edu.vn',@pwd,N'Vinh Rival 20',NULL,NULL,N'VR2020',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r21@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 21', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2021', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r21@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-000000000015',N'vinh.r21@fpt.edu.vn',@pwd,N'Vinh Rival 21',NULL,NULL,N'VR2021',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r22@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 22', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2022', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r22@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-000000000016',N'vinh.r22@fpt.edu.vn',@pwd,N'Vinh Rival 22',NULL,NULL,N'VR2022',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r23@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 23', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2023', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r23@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-000000000017',N'vinh.r23@fpt.edu.vn',@pwd,N'Vinh Rival 23',NULL,NULL,N'VR2023',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r24@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 24', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2024', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r24@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-000000000018',N'vinh.r24@fpt.edu.vn',@pwd,N'Vinh Rival 24',NULL,NULL,N'VR2024',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r25@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 25', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2025', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r25@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-000000000019',N'vinh.r25@fpt.edu.vn',@pwd,N'Vinh Rival 25',NULL,NULL,N'VR2025',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r26@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 26', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2026', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r26@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-00000000001A',N'vinh.r26@fpt.edu.vn',@pwd,N'Vinh Rival 26',NULL,NULL,N'VR2026',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

IF EXISTS (SELECT 1 FROM users WHERE email = N'vinh.r27@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Vinh Rival 27', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'VR2027', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
  WHERE email=N'vinh.r27@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
    created_at,updated_at,created_by,updated_by)
  VALUES ('B1000900-EEEE-4EEE-8EEE-00000000001B',N'vinh.r27@fpt.edu.vn',@pwd,N'Vinh Rival 27',NULL,NULL,N'VR2027',N'FPT University',
    N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);

DECLARE @vinhId UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'nguyentruongvinh05@gmail.com');
DECLARE @mate1Id UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.mate1@fpt.edu.vn');
DECLARE @mate2Id UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.mate2@fpt.edu.vn');
DECLARE @r1 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r01@fpt.edu.vn');
DECLARE @r2 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r02@fpt.edu.vn');
DECLARE @r3 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r03@fpt.edu.vn');
DECLARE @r4 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r04@fpt.edu.vn');
DECLARE @r5 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r05@fpt.edu.vn');
DECLARE @r6 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r06@fpt.edu.vn');
DECLARE @r7 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r07@fpt.edu.vn');
DECLARE @r8 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r08@fpt.edu.vn');
DECLARE @r9 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r09@fpt.edu.vn');
DECLARE @r10 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r10@fpt.edu.vn');
DECLARE @r11 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r11@fpt.edu.vn');
DECLARE @r12 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r12@fpt.edu.vn');
DECLARE @r13 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r13@fpt.edu.vn');
DECLARE @r14 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r14@fpt.edu.vn');
DECLARE @r15 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r15@fpt.edu.vn');
DECLARE @r16 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r16@fpt.edu.vn');
DECLARE @r17 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r17@fpt.edu.vn');
DECLARE @r18 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r18@fpt.edu.vn');
DECLARE @r19 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r19@fpt.edu.vn');
DECLARE @r20 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r20@fpt.edu.vn');
DECLARE @r21 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r21@fpt.edu.vn');
DECLARE @r22 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r22@fpt.edu.vn');
DECLARE @r23 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r23@fpt.edu.vn');
DECLARE @r24 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r24@fpt.edu.vn');
DECLARE @r25 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r25@fpt.edu.vn');
DECLARE @r26 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r26@fpt.edu.vn');
DECLARE @r27 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r27@fpt.edu.vn');
DECLARE @coordId UNIQUEIDENTIFIER = COALESCE((SELECT id FROM users WHERE email=N'test.coord@fpt.edu.vn'), @ownerUserId);
DECLARE @j1 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.judge1@fpt.edu.vn');
DECLARE @j2 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.judge2@fpt.edu.vn');
IF @j1 IS NULL OR @j2 IS NULL BEGIN RAISERROR('Need test.judge1/2 — run seed_feature_demo_pack.sql first.', 16, 1); ROLLBACK; RETURN; END

-- ========== Vinh Showcase 1 - RAG Champions ==========
INSERT INTO hackathon_events (
  id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at,
  avatar_url, score_scale_max
) VALUES (
  'B1010100-EEEE-4EEE-8EEE-000000000001', N'Vinh Showcase 1 - RAG Champions', N'Summer', 2025,
  DATEADD(DAY,-120,@today), DATEADD(DAY,-90,@today),
  DATEADD(DAY,-150,@today), DATEADD(DAY,-130,@today),
  N'Full COMPLETED showcase for achievements QA.', N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
  3, 5, 4, 8, @templateId, N'COMPLETED', 1, @coordId, @ownerEmail, @now, @now, NULL, 100);
INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, created_at, updated_at, created_by)
VALUES ('B1010400-EEEE-4EEE-8EEE-000000000001', 'B1010100-EEEE-4EEE-8EEE-000000000001', N'Champion Track', N'Showcase track', 15, N'OPEN', NULL, @now, @now, @ownerEmail);
INSERT INTO competition_groups (id, track_id, event_id, name, max_teams, sort_order, created_at, updated_at, created_by)
VALUES ('B1010A00-EEEE-4EEE-8EEE-000000000001', 'B1010400-EEEE-4EEE-8EEE-000000000001', 'B1010100-EEEE-4EEE-8EEE-000000000001', N'Group A', 15, 0, @now, @now, @ownerEmail);
INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, min_judges_per_round, created_at, updated_at, created_by) VALUES
  ('B1010300-EEEE-4EEE-8EEE-000000000001', 'B1010100-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(DAY,-115,@now), DATEADD(DAY,-100,@now), DATEADD(DAY,-105,@now), DATEADD(DAY,-105,@now), DATEADD(DAY,-100,@now), 4, N'PER_TRACK_TOP_N', 40, 2, @now, @now, @ownerEmail),
  ('B1010300-EEEE-4EEE-8EEE-000000000002', 'B1010100-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', N'FINAL', DATEADD(DAY,-100,@now), DATEADD(DAY,-90,@now), NULL, DATEADD(DAY,-95,@now), DATEADD(DAY,-90,@now), 4, N'FINALIST_POOL', 60, 2, @now, @now, @ownerEmail);
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('B1010600-EEEE-4EEE-8EEE-000000000001', 'B1010300-EEEE-4EEE-8EEE-000000000001', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, @ownerEmail),
  ('B1010600-EEEE-4EEE-8EEE-000000000002', 'B1010300-EEEE-4EEE-8EEE-000000000001', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, @ownerEmail),
  ('B1010600-EEEE-4EEE-8EEE-000000000003', 'B1010300-EEEE-4EEE-8EEE-000000000001', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, @ownerEmail);
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('B1010600-EEEE-4EEE-8EEE-000000000004', 'B1010300-EEEE-4EEE-8EEE-000000000002', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, @ownerEmail),
  ('B1010600-EEEE-4EEE-8EEE-000000000005', 'B1010300-EEEE-4EEE-8EEE-000000000002', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, @ownerEmail),
  ('B1010600-EEEE-4EEE-8EEE-000000000006', 'B1010300-EEEE-4EEE-8EEE-000000000002', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, @ownerEmail);
INSERT INTO event_schedules (id, event_id, type, title, description, start_time, end_time, gate, sort_order, created_at, updated_at) VALUES
  ('B1010800-EEEE-4EEE-8EEE-000000000001', 'B1010100-EEEE-4EEE-8EEE-000000000001', N'WORKSHOP', N'Workshop', NULL, DATEADD(DAY,-118,@now), DATEADD(HOUR,3,DATEADD(DAY,-118,@now)), NULL, 0, @now, @now),
  ('B1010800-EEEE-4EEE-8EEE-000000000002', 'B1010100-EEEE-4EEE-8EEE-000000000001', N'OPENING', N'Opening', N'Kickoff', DATEADD(DAY,-116,@now), DATEADD(HOUR,2,DATEADD(DAY,-116,@now)), NULL, 1, @now, @now),
  ('B1010800-EEEE-4EEE-8EEE-000000000003', 'B1010100-EEEE-4EEE-8EEE-000000000001', N'SCORING', N'Final scoring', NULL, DATEADD(DAY,-93,@now), DATEADD(DAY,-90,@now), NULL, 2, @now, @now);
INSERT INTO prizes (id, created_at, created_by, quantity, [rank], value, event_id, label, track_id) VALUES
  ('B1010700-EEEE-4EEE-8EEE-000000000001', @now, @ownerEmail, 1, N'FIRST', N'10,000,000 VND + Trophy', 'B1010100-EEEE-4EEE-8EEE-000000000001', N'First Prize', NULL),
  ('B1010700-EEEE-4EEE-8EEE-000000000002', @now, @ownerEmail, 1, N'SECOND', N'5,000,000 VND', 'B1010100-EEEE-4EEE-8EEE-000000000001', N'Second Prize', NULL),
  ('B1010700-EEEE-4EEE-8EEE-000000000003', @now, @ownerEmail, 1, N'THIRD', N'2,000,000 VND', 'B1010100-EEEE-4EEE-8EEE-000000000001', N'Third Prize', NULL);
INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), 'B1010100-EEEE-4EEE-8EEE-000000000001', N'APPROVED', u.id, 0, 1
FROM users u WHERE u.email IN (
  N'nguyentruongvinh05@gmail.com', N'vinh.mate1@fpt.edu.vn', N'vinh.mate2@fpt.edu.vn',
  N'vinh.r01@fpt.edu.vn', N'vinh.r02@fpt.edu.vn', N'vinh.r03@fpt.edu.vn', N'vinh.r04@fpt.edu.vn', N'vinh.r05@fpt.edu.vn', N'vinh.r06@fpt.edu.vn',
  N'vinh.r07@fpt.edu.vn', N'vinh.r08@fpt.edu.vn', N'vinh.r09@fpt.edu.vn', N'vinh.r10@fpt.edu.vn', N'vinh.r11@fpt.edu.vn', N'vinh.r12@fpt.edu.vn',
  N'vinh.r13@fpt.edu.vn', N'vinh.r14@fpt.edu.vn', N'vinh.r15@fpt.edu.vn', N'vinh.r16@fpt.edu.vn', N'vinh.r17@fpt.edu.vn', N'vinh.r18@fpt.edu.vn',
  N'vinh.r19@fpt.edu.vn', N'vinh.r20@fpt.edu.vn', N'vinh.r21@fpt.edu.vn', N'vinh.r22@fpt.edu.vn', N'vinh.r23@fpt.edu.vn', N'vinh.r24@fpt.edu.vn',
  N'vinh.r25@fpt.edu.vn', N'vinh.r26@fpt.edu.vn', N'vinh.r27@fpt.edu.vn');
INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id, created_by) VALUES
  (NEWID(), @now, @now, @j1, 'B1010100-EEEE-4EEE-8EEE-000000000001', @ownerEmail),
  (NEWID(), @now, @now, @j2, 'B1010100-EEEE-4EEE-8EEE-000000000001', @ownerEmail);
INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active, created_by) VALUES
  (NEWID(), @now, @now, @j1, 'B1010300-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1, @ownerEmail),
  (NEWID(), @now, @now, @j2, 'B1010300-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1, @ownerEmail),
  (NEWID(), @now, @now, @j1, 'B1010300-EEEE-4EEE-8EEE-000000000002', N'ROUND', 1, @ownerEmail),
  (NEWID(), @now, @now, @j2, 'B1010300-EEEE-4EEE-8EEE-000000000002', N'ROUND', 1, @ownerEmail);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1010200-EEEE-4EEE-8EEE-000000000001', @now, @ownerEmail, 'B1010100-EEEE-4EEE-8EEE-000000000001', @vinhId, N'Team Vinh Champions', N'CONFIRMED', 'B1010400-EEEE-4EEE-8EEE-000000000001', 'B1010A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'LEADER', @vinhId, 'B1010200-EEEE-4EEE-8EEE-000000000001', 'B1010100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'MEMBER', @mate1Id, 'B1010200-EEEE-4EEE-8EEE-000000000001', 'B1010100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'MEMBER', @mate2Id, 'B1010200-EEEE-4EEE-8EEE-000000000001', 'B1010100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1010500-EEEE-4EEE-8EEE-000000000001', @now, @ownerEmail, NULL, 'B1010300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @vinhId, 'B1010200-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1010B00-EEEE-4EEE-8EEE-000000000001', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e1-t1', N'https://docs.google.com/presentation/d/vinh-e1-t1', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-106,@now), 1, 'B1010500-EEEE-4EEE-8EEE-000000000001');
UPDATE submissions SET current_version_id='B1010B00-EEEE-4EEE-8EEE-000000000001' WHERE id='B1010500-EEEE-4EEE-8EEE-000000000001';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-000000000001', @now, @ownerEmail, DATEADD(DAY,-102,@now), @j1, 'B1010300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-103,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000001', 95, 'B1010C00-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000002', 95, 'B1010C00-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000003', 90, 'B1010C00-EEEE-4EEE-8EEE-000000000001');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-000000000002', @now, @ownerEmail, DATEADD(DAY,-102,@now), @j2, 'B1010300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-103,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000001', 95, 'B1010C00-EEEE-4EEE-8EEE-000000000002'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000002', 95, 'B1010C00-EEEE-4EEE-8EEE-000000000002'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000003', 90, 'B1010C00-EEEE-4EEE-8EEE-000000000002');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-100,@now), 95.00, 1, 'B1010300-EEEE-4EEE-8EEE-000000000001', 'B1010200-EEEE-4EEE-8EEE-000000000001', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1010200-EEEE-4EEE-8EEE-000000000002', @now, @ownerEmail, 'B1010100-EEEE-4EEE-8EEE-000000000001', @r1, N'Team Rival Beta', N'CONFIRMED', 'B1010400-EEEE-4EEE-8EEE-000000000001', 'B1010A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'LEADER', @r1, 'B1010200-EEEE-4EEE-8EEE-000000000002', 'B1010100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'MEMBER', @r2, 'B1010200-EEEE-4EEE-8EEE-000000000002', 'B1010100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'MEMBER', @r3, 'B1010200-EEEE-4EEE-8EEE-000000000002', 'B1010100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1010500-EEEE-4EEE-8EEE-000000000002', @now, @ownerEmail, NULL, 'B1010300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r1, 'B1010200-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1010B00-EEEE-4EEE-8EEE-000000000002', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e1-t2', N'https://docs.google.com/presentation/d/vinh-e1-t2', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-106,@now), 1, 'B1010500-EEEE-4EEE-8EEE-000000000002');
UPDATE submissions SET current_version_id='B1010B00-EEEE-4EEE-8EEE-000000000002' WHERE id='B1010500-EEEE-4EEE-8EEE-000000000002';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-00000000000B', @now, @ownerEmail, DATEADD(DAY,-102,@now), @j1, 'B1010300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-103,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000001', 92, 'B1010C00-EEEE-4EEE-8EEE-00000000000B'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000002', 92, 'B1010C00-EEEE-4EEE-8EEE-00000000000B'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000003', 87, 'B1010C00-EEEE-4EEE-8EEE-00000000000B');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-00000000000C', @now, @ownerEmail, DATEADD(DAY,-102,@now), @j2, 'B1010300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-103,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000001', 92, 'B1010C00-EEEE-4EEE-8EEE-00000000000C'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000002', 92, 'B1010C00-EEEE-4EEE-8EEE-00000000000C'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000003', 87, 'B1010C00-EEEE-4EEE-8EEE-00000000000C');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-100,@now), 92.00, 2, 'B1010300-EEEE-4EEE-8EEE-000000000001', 'B1010200-EEEE-4EEE-8EEE-000000000002', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1010200-EEEE-4EEE-8EEE-000000000003', @now, @ownerEmail, 'B1010100-EEEE-4EEE-8EEE-000000000001', @r4, N'Team Rival Gamma', N'CONFIRMED', 'B1010400-EEEE-4EEE-8EEE-000000000001', 'B1010A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'LEADER', @r4, 'B1010200-EEEE-4EEE-8EEE-000000000003', 'B1010100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'MEMBER', @r5, 'B1010200-EEEE-4EEE-8EEE-000000000003', 'B1010100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'MEMBER', @r6, 'B1010200-EEEE-4EEE-8EEE-000000000003', 'B1010100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1010500-EEEE-4EEE-8EEE-000000000003', @now, @ownerEmail, NULL, 'B1010300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r4, 'B1010200-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1010B00-EEEE-4EEE-8EEE-000000000003', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e1-t3', N'https://docs.google.com/presentation/d/vinh-e1-t3', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-106,@now), 1, 'B1010500-EEEE-4EEE-8EEE-000000000003');
UPDATE submissions SET current_version_id='B1010B00-EEEE-4EEE-8EEE-000000000003' WHERE id='B1010500-EEEE-4EEE-8EEE-000000000003';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-000000000015', @now, @ownerEmail, DATEADD(DAY,-102,@now), @j1, 'B1010300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-103,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000001', 89, 'B1010C00-EEEE-4EEE-8EEE-000000000015'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000002', 89, 'B1010C00-EEEE-4EEE-8EEE-000000000015'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000003', 84, 'B1010C00-EEEE-4EEE-8EEE-000000000015');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-000000000016', @now, @ownerEmail, DATEADD(DAY,-102,@now), @j2, 'B1010300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-103,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000001', 89, 'B1010C00-EEEE-4EEE-8EEE-000000000016'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000002', 89, 'B1010C00-EEEE-4EEE-8EEE-000000000016'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000003', 84, 'B1010C00-EEEE-4EEE-8EEE-000000000016');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-100,@now), 89.00, 3, 'B1010300-EEEE-4EEE-8EEE-000000000001', 'B1010200-EEEE-4EEE-8EEE-000000000003', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1010200-EEEE-4EEE-8EEE-000000000004', @now, @ownerEmail, 'B1010100-EEEE-4EEE-8EEE-000000000001', @r7, N'Team Rival Delta', N'CONFIRMED', 'B1010400-EEEE-4EEE-8EEE-000000000001', 'B1010A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'LEADER', @r7, 'B1010200-EEEE-4EEE-8EEE-000000000004', 'B1010100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'MEMBER', @r8, 'B1010200-EEEE-4EEE-8EEE-000000000004', 'B1010100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'MEMBER', @r9, 'B1010200-EEEE-4EEE-8EEE-000000000004', 'B1010100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1010500-EEEE-4EEE-8EEE-000000000004', @now, @ownerEmail, NULL, 'B1010300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r7, 'B1010200-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1010B00-EEEE-4EEE-8EEE-000000000004', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e1-t4', N'https://docs.google.com/presentation/d/vinh-e1-t4', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-106,@now), 1, 'B1010500-EEEE-4EEE-8EEE-000000000004');
UPDATE submissions SET current_version_id='B1010B00-EEEE-4EEE-8EEE-000000000004' WHERE id='B1010500-EEEE-4EEE-8EEE-000000000004';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-00000000001F', @now, @ownerEmail, DATEADD(DAY,-102,@now), @j1, 'B1010300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-103,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000001', 86, 'B1010C00-EEEE-4EEE-8EEE-00000000001F'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000002', 86, 'B1010C00-EEEE-4EEE-8EEE-00000000001F'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000003', 81, 'B1010C00-EEEE-4EEE-8EEE-00000000001F');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-000000000020', @now, @ownerEmail, DATEADD(DAY,-102,@now), @j2, 'B1010300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-103,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000001', 86, 'B1010C00-EEEE-4EEE-8EEE-000000000020'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000002', 86, 'B1010C00-EEEE-4EEE-8EEE-000000000020'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000003', 81, 'B1010C00-EEEE-4EEE-8EEE-000000000020');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-100,@now), 86.00, 4, 'B1010300-EEEE-4EEE-8EEE-000000000001', 'B1010200-EEEE-4EEE-8EEE-000000000004', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1010200-EEEE-4EEE-8EEE-000000000005', @now, @ownerEmail, 'B1010100-EEEE-4EEE-8EEE-000000000001', @r10, N'Team Rival Epsilon', N'CONFIRMED', 'B1010400-EEEE-4EEE-8EEE-000000000001', 'B1010A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'LEADER', @r10, 'B1010200-EEEE-4EEE-8EEE-000000000005', 'B1010100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'MEMBER', @r11, 'B1010200-EEEE-4EEE-8EEE-000000000005', 'B1010100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'MEMBER', @r12, 'B1010200-EEEE-4EEE-8EEE-000000000005', 'B1010100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1010500-EEEE-4EEE-8EEE-000000000005', @now, @ownerEmail, NULL, 'B1010300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r10, 'B1010200-EEEE-4EEE-8EEE-000000000005', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1010B00-EEEE-4EEE-8EEE-000000000005', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e1-t5', N'https://docs.google.com/presentation/d/vinh-e1-t5', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-106,@now), 1, 'B1010500-EEEE-4EEE-8EEE-000000000005');
UPDATE submissions SET current_version_id='B1010B00-EEEE-4EEE-8EEE-000000000005' WHERE id='B1010500-EEEE-4EEE-8EEE-000000000005';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-000000000029', @now, @ownerEmail, DATEADD(DAY,-102,@now), @j1, 'B1010300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-103,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000005', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000001', 83, 'B1010C00-EEEE-4EEE-8EEE-000000000029'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000002', 83, 'B1010C00-EEEE-4EEE-8EEE-000000000029'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000003', 78, 'B1010C00-EEEE-4EEE-8EEE-000000000029');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-00000000002A', @now, @ownerEmail, DATEADD(DAY,-102,@now), @j2, 'B1010300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-103,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000005', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000001', 83, 'B1010C00-EEEE-4EEE-8EEE-00000000002A'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000002', 83, 'B1010C00-EEEE-4EEE-8EEE-00000000002A'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000003', 78, 'B1010C00-EEEE-4EEE-8EEE-00000000002A');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-100,@now), 83.00, 5, 'B1010300-EEEE-4EEE-8EEE-000000000001', 'B1010200-EEEE-4EEE-8EEE-000000000005', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1010200-EEEE-4EEE-8EEE-000000000006', @now, @ownerEmail, 'B1010100-EEEE-4EEE-8EEE-000000000001', @r13, N'Team Rival Zeta', N'CONFIRMED', 'B1010400-EEEE-4EEE-8EEE-000000000001', 'B1010A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'LEADER', @r13, 'B1010200-EEEE-4EEE-8EEE-000000000006', 'B1010100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'MEMBER', @r14, 'B1010200-EEEE-4EEE-8EEE-000000000006', 'B1010100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'MEMBER', @r15, 'B1010200-EEEE-4EEE-8EEE-000000000006', 'B1010100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1010500-EEEE-4EEE-8EEE-000000000006', @now, @ownerEmail, NULL, 'B1010300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r13, 'B1010200-EEEE-4EEE-8EEE-000000000006', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1010B00-EEEE-4EEE-8EEE-000000000006', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e1-t6', N'https://docs.google.com/presentation/d/vinh-e1-t6', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-106,@now), 1, 'B1010500-EEEE-4EEE-8EEE-000000000006');
UPDATE submissions SET current_version_id='B1010B00-EEEE-4EEE-8EEE-000000000006' WHERE id='B1010500-EEEE-4EEE-8EEE-000000000006';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-000000000033', @now, @ownerEmail, DATEADD(DAY,-102,@now), @j1, 'B1010300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-103,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000006', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000001', 80, 'B1010C00-EEEE-4EEE-8EEE-000000000033'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000002', 80, 'B1010C00-EEEE-4EEE-8EEE-000000000033'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000003', 75, 'B1010C00-EEEE-4EEE-8EEE-000000000033');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-000000000034', @now, @ownerEmail, DATEADD(DAY,-102,@now), @j2, 'B1010300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-103,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000006', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000001', 80, 'B1010C00-EEEE-4EEE-8EEE-000000000034'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000002', 80, 'B1010C00-EEEE-4EEE-8EEE-000000000034'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000003', 75, 'B1010C00-EEEE-4EEE-8EEE-000000000034');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-100,@now), 80.00, 6, 'B1010300-EEEE-4EEE-8EEE-000000000001', 'B1010200-EEEE-4EEE-8EEE-000000000006', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1010200-EEEE-4EEE-8EEE-000000000007', @now, @ownerEmail, 'B1010100-EEEE-4EEE-8EEE-000000000001', @r16, N'Team Rival Eta', N'CONFIRMED', 'B1010400-EEEE-4EEE-8EEE-000000000001', 'B1010A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'LEADER', @r16, 'B1010200-EEEE-4EEE-8EEE-000000000007', 'B1010100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'MEMBER', @r17, 'B1010200-EEEE-4EEE-8EEE-000000000007', 'B1010100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'MEMBER', @r18, 'B1010200-EEEE-4EEE-8EEE-000000000007', 'B1010100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1010500-EEEE-4EEE-8EEE-000000000007', @now, @ownerEmail, NULL, 'B1010300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r16, 'B1010200-EEEE-4EEE-8EEE-000000000007', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1010B00-EEEE-4EEE-8EEE-000000000007', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e1-t7', N'https://docs.google.com/presentation/d/vinh-e1-t7', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-106,@now), 1, 'B1010500-EEEE-4EEE-8EEE-000000000007');
UPDATE submissions SET current_version_id='B1010B00-EEEE-4EEE-8EEE-000000000007' WHERE id='B1010500-EEEE-4EEE-8EEE-000000000007';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-00000000003D', @now, @ownerEmail, DATEADD(DAY,-102,@now), @j1, 'B1010300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-103,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000007', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000001', 77, 'B1010C00-EEEE-4EEE-8EEE-00000000003D'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000002', 77, 'B1010C00-EEEE-4EEE-8EEE-00000000003D'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000003', 72, 'B1010C00-EEEE-4EEE-8EEE-00000000003D');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-00000000003E', @now, @ownerEmail, DATEADD(DAY,-102,@now), @j2, 'B1010300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-103,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000007', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000001', 77, 'B1010C00-EEEE-4EEE-8EEE-00000000003E'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000002', 77, 'B1010C00-EEEE-4EEE-8EEE-00000000003E'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000003', 72, 'B1010C00-EEEE-4EEE-8EEE-00000000003E');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-100,@now), 77.00, 7, 'B1010300-EEEE-4EEE-8EEE-000000000001', 'B1010200-EEEE-4EEE-8EEE-000000000007', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1010200-EEEE-4EEE-8EEE-000000000008', @now, @ownerEmail, 'B1010100-EEEE-4EEE-8EEE-000000000001', @r19, N'Team Rival Theta', N'CONFIRMED', 'B1010400-EEEE-4EEE-8EEE-000000000001', 'B1010A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'LEADER', @r19, 'B1010200-EEEE-4EEE-8EEE-000000000008', 'B1010100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'MEMBER', @r20, 'B1010200-EEEE-4EEE-8EEE-000000000008', 'B1010100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'MEMBER', @r21, 'B1010200-EEEE-4EEE-8EEE-000000000008', 'B1010100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1010500-EEEE-4EEE-8EEE-000000000008', @now, @ownerEmail, NULL, 'B1010300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r19, 'B1010200-EEEE-4EEE-8EEE-000000000008', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1010B00-EEEE-4EEE-8EEE-000000000008', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e1-t8', N'https://docs.google.com/presentation/d/vinh-e1-t8', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-106,@now), 1, 'B1010500-EEEE-4EEE-8EEE-000000000008');
UPDATE submissions SET current_version_id='B1010B00-EEEE-4EEE-8EEE-000000000008' WHERE id='B1010500-EEEE-4EEE-8EEE-000000000008';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-000000000047', @now, @ownerEmail, DATEADD(DAY,-102,@now), @j1, 'B1010300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-103,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000008', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000001', 74, 'B1010C00-EEEE-4EEE-8EEE-000000000047'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000002', 74, 'B1010C00-EEEE-4EEE-8EEE-000000000047'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000003', 69, 'B1010C00-EEEE-4EEE-8EEE-000000000047');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-000000000048', @now, @ownerEmail, DATEADD(DAY,-102,@now), @j2, 'B1010300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-103,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000008', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000001', 74, 'B1010C00-EEEE-4EEE-8EEE-000000000048'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000002', 74, 'B1010C00-EEEE-4EEE-8EEE-000000000048'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000003', 69, 'B1010C00-EEEE-4EEE-8EEE-000000000048');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-100,@now), 74.00, 8, 'B1010300-EEEE-4EEE-8EEE-000000000001', 'B1010200-EEEE-4EEE-8EEE-000000000008', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1010200-EEEE-4EEE-8EEE-000000000009', @now, @ownerEmail, 'B1010100-EEEE-4EEE-8EEE-000000000001', @r22, N'Team Rival Iota', N'CONFIRMED', 'B1010400-EEEE-4EEE-8EEE-000000000001', 'B1010A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'LEADER', @r22, 'B1010200-EEEE-4EEE-8EEE-000000000009', 'B1010100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'MEMBER', @r23, 'B1010200-EEEE-4EEE-8EEE-000000000009', 'B1010100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'MEMBER', @r24, 'B1010200-EEEE-4EEE-8EEE-000000000009', 'B1010100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1010500-EEEE-4EEE-8EEE-000000000009', @now, @ownerEmail, NULL, 'B1010300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r22, 'B1010200-EEEE-4EEE-8EEE-000000000009', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1010B00-EEEE-4EEE-8EEE-000000000009', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e1-t9', N'https://docs.google.com/presentation/d/vinh-e1-t9', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-106,@now), 1, 'B1010500-EEEE-4EEE-8EEE-000000000009');
UPDATE submissions SET current_version_id='B1010B00-EEEE-4EEE-8EEE-000000000009' WHERE id='B1010500-EEEE-4EEE-8EEE-000000000009';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-000000000051', @now, @ownerEmail, DATEADD(DAY,-102,@now), @j1, 'B1010300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-103,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000009', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000001', 71, 'B1010C00-EEEE-4EEE-8EEE-000000000051'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000002', 71, 'B1010C00-EEEE-4EEE-8EEE-000000000051'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000003', 66, 'B1010C00-EEEE-4EEE-8EEE-000000000051');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-000000000052', @now, @ownerEmail, DATEADD(DAY,-102,@now), @j2, 'B1010300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-103,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000009', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000001', 71, 'B1010C00-EEEE-4EEE-8EEE-000000000052'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000002', 71, 'B1010C00-EEEE-4EEE-8EEE-000000000052'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000003', 66, 'B1010C00-EEEE-4EEE-8EEE-000000000052');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-100,@now), 71.00, 9, 'B1010300-EEEE-4EEE-8EEE-000000000001', 'B1010200-EEEE-4EEE-8EEE-000000000009', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1010200-EEEE-4EEE-8EEE-00000000000A', @now, @ownerEmail, 'B1010100-EEEE-4EEE-8EEE-000000000001', @r25, N'Team Rival Kappa', N'CONFIRMED', 'B1010400-EEEE-4EEE-8EEE-000000000001', 'B1010A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'LEADER', @r25, 'B1010200-EEEE-4EEE-8EEE-00000000000A', 'B1010100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'MEMBER', @r26, 'B1010200-EEEE-4EEE-8EEE-00000000000A', 'B1010100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-125,@now), N'MEMBER', @r27, 'B1010200-EEEE-4EEE-8EEE-00000000000A', 'B1010100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1010500-EEEE-4EEE-8EEE-00000000000A', @now, @ownerEmail, NULL, 'B1010300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r25, 'B1010200-EEEE-4EEE-8EEE-00000000000A', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1010B00-EEEE-4EEE-8EEE-00000000000A', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e1-t10', N'https://docs.google.com/presentation/d/vinh-e1-t10', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-106,@now), 1, 'B1010500-EEEE-4EEE-8EEE-00000000000A');
UPDATE submissions SET current_version_id='B1010B00-EEEE-4EEE-8EEE-00000000000A' WHERE id='B1010500-EEEE-4EEE-8EEE-00000000000A';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-00000000005B', @now, @ownerEmail, DATEADD(DAY,-102,@now), @j1, 'B1010300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-103,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-00000000000A', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000001', 68, 'B1010C00-EEEE-4EEE-8EEE-00000000005B'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000002', 68, 'B1010C00-EEEE-4EEE-8EEE-00000000005B'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000003', 63, 'B1010C00-EEEE-4EEE-8EEE-00000000005B');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-00000000005C', @now, @ownerEmail, DATEADD(DAY,-102,@now), @j2, 'B1010300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-103,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-00000000000A', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000001', 68, 'B1010C00-EEEE-4EEE-8EEE-00000000005C'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000002', 68, 'B1010C00-EEEE-4EEE-8EEE-00000000005C'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000003', 63, 'B1010C00-EEEE-4EEE-8EEE-00000000005C');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-100,@now), 68.00, 10, 'B1010300-EEEE-4EEE-8EEE-000000000001', 'B1010200-EEEE-4EEE-8EEE-00000000000A', 1, 0, @now);
INSERT INTO finalist_selections (id, event_id, team_id, track_id, preliminary_rank, selected_reason, selected_at, created_at, updated_at, selection_method, eligible) VALUES
  ('B1010D00-EEEE-4EEE-8EEE-000000000001', 'B1010100-EEEE-4EEE-8EEE-000000000001', 'B1010200-EEEE-4EEE-8EEE-000000000001', 'B1010400-EEEE-4EEE-8EEE-000000000001', 1, N'Top 1', DATEADD(DAY,-99,@now), @now, @now, N'AUTO', 1),
  ('B1010D00-EEEE-4EEE-8EEE-000000000002', 'B1010100-EEEE-4EEE-8EEE-000000000001', 'B1010200-EEEE-4EEE-8EEE-000000000002', 'B1010400-EEEE-4EEE-8EEE-000000000001', 2, N'Top 2', DATEADD(DAY,-99,@now), @now, @now, N'AUTO', 1),
  ('B1010D00-EEEE-4EEE-8EEE-000000000003', 'B1010100-EEEE-4EEE-8EEE-000000000001', 'B1010200-EEEE-4EEE-8EEE-000000000003', 'B1010400-EEEE-4EEE-8EEE-000000000001', 3, N'Top 3', DATEADD(DAY,-99,@now), @now, @now, N'AUTO', 1),
  ('B1010D00-EEEE-4EEE-8EEE-000000000004', 'B1010100-EEEE-4EEE-8EEE-000000000001', 'B1010200-EEEE-4EEE-8EEE-000000000004', 'B1010400-EEEE-4EEE-8EEE-000000000001', 4, N'Top 4', DATEADD(DAY,-99,@now), @now, @now, N'AUTO', 1);
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1010500-EEEE-4EEE-8EEE-000000000014', @now, @ownerEmail, NULL, 'B1010300-EEEE-4EEE-8EEE-000000000002', N'SCORED', @vinhId, 'B1010200-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1010B00-EEEE-4EEE-8EEE-000000000014', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e1-final-t1', N'https://docs.google.com/presentation/d/vinh-e1-final-t1', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-96,@now), 1, 'B1010500-EEEE-4EEE-8EEE-000000000014');
UPDATE submissions SET current_version_id='B1010B00-EEEE-4EEE-8EEE-000000000014' WHERE id='B1010500-EEEE-4EEE-8EEE-000000000014';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-000000000065', @now, @ownerEmail, DATEADD(DAY,-92,@now), @j1, 'B1010300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-93,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000014', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000004', 92, 'B1010C00-EEEE-4EEE-8EEE-000000000065'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000005', 92, 'B1010C00-EEEE-4EEE-8EEE-000000000065'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000006', 88, 'B1010C00-EEEE-4EEE-8EEE-000000000065');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-000000000066', @now, @ownerEmail, DATEADD(DAY,-92,@now), @j2, 'B1010300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-93,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000014', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000004', 92, 'B1010C00-EEEE-4EEE-8EEE-000000000066'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000005', 92, 'B1010C00-EEEE-4EEE-8EEE-000000000066'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000006', 88, 'B1010C00-EEEE-4EEE-8EEE-000000000066');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-90,@now), 92.00, 1, 'B1010300-EEEE-4EEE-8EEE-000000000002', 'B1010200-EEEE-4EEE-8EEE-000000000001', 1, 0, @now);
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1010500-EEEE-4EEE-8EEE-000000000015', @now, @ownerEmail, NULL, 'B1010300-EEEE-4EEE-8EEE-000000000002', N'SCORED', @r1, 'B1010200-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1010B00-EEEE-4EEE-8EEE-000000000015', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e1-final-t2', N'https://docs.google.com/presentation/d/vinh-e1-final-t2', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-96,@now), 1, 'B1010500-EEEE-4EEE-8EEE-000000000015');
UPDATE submissions SET current_version_id='B1010B00-EEEE-4EEE-8EEE-000000000015' WHERE id='B1010500-EEEE-4EEE-8EEE-000000000015';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-00000000006F', @now, @ownerEmail, DATEADD(DAY,-92,@now), @j1, 'B1010300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-93,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000015', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000004', 86, 'B1010C00-EEEE-4EEE-8EEE-00000000006F'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000005', 86, 'B1010C00-EEEE-4EEE-8EEE-00000000006F'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000006', 82, 'B1010C00-EEEE-4EEE-8EEE-00000000006F');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-000000000070', @now, @ownerEmail, DATEADD(DAY,-92,@now), @j2, 'B1010300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-93,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000015', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000004', 86, 'B1010C00-EEEE-4EEE-8EEE-000000000070'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000005', 86, 'B1010C00-EEEE-4EEE-8EEE-000000000070'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000006', 82, 'B1010C00-EEEE-4EEE-8EEE-000000000070');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-90,@now), 86.00, 2, 'B1010300-EEEE-4EEE-8EEE-000000000002', 'B1010200-EEEE-4EEE-8EEE-000000000002', 1, 0, @now);
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1010500-EEEE-4EEE-8EEE-000000000016', @now, @ownerEmail, NULL, 'B1010300-EEEE-4EEE-8EEE-000000000002', N'SCORED', @r4, 'B1010200-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1010B00-EEEE-4EEE-8EEE-000000000016', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e1-final-t3', N'https://docs.google.com/presentation/d/vinh-e1-final-t3', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-96,@now), 1, 'B1010500-EEEE-4EEE-8EEE-000000000016');
UPDATE submissions SET current_version_id='B1010B00-EEEE-4EEE-8EEE-000000000016' WHERE id='B1010500-EEEE-4EEE-8EEE-000000000016';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-000000000079', @now, @ownerEmail, DATEADD(DAY,-92,@now), @j1, 'B1010300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-93,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000016', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000004', 80, 'B1010C00-EEEE-4EEE-8EEE-000000000079'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000005', 80, 'B1010C00-EEEE-4EEE-8EEE-000000000079'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000006', 76, 'B1010C00-EEEE-4EEE-8EEE-000000000079');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-00000000007A', @now, @ownerEmail, DATEADD(DAY,-92,@now), @j2, 'B1010300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-93,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000016', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000004', 80, 'B1010C00-EEEE-4EEE-8EEE-00000000007A'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000005', 80, 'B1010C00-EEEE-4EEE-8EEE-00000000007A'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000006', 76, 'B1010C00-EEEE-4EEE-8EEE-00000000007A');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-90,@now), 80.00, 3, 'B1010300-EEEE-4EEE-8EEE-000000000002', 'B1010200-EEEE-4EEE-8EEE-000000000003', 1, 0, @now);
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1010500-EEEE-4EEE-8EEE-000000000017', @now, @ownerEmail, NULL, 'B1010300-EEEE-4EEE-8EEE-000000000002', N'SCORED', @r7, 'B1010200-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1010B00-EEEE-4EEE-8EEE-000000000017', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e1-final-t4', N'https://docs.google.com/presentation/d/vinh-e1-final-t4', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-96,@now), 1, 'B1010500-EEEE-4EEE-8EEE-000000000017');
UPDATE submissions SET current_version_id='B1010B00-EEEE-4EEE-8EEE-000000000017' WHERE id='B1010500-EEEE-4EEE-8EEE-000000000017';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-000000000083', @now, @ownerEmail, DATEADD(DAY,-92,@now), @j1, 'B1010300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-93,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000017', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000004', 74, 'B1010C00-EEEE-4EEE-8EEE-000000000083'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000005', 74, 'B1010C00-EEEE-4EEE-8EEE-000000000083'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000006', 70, 'B1010C00-EEEE-4EEE-8EEE-000000000083');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1010C00-EEEE-4EEE-8EEE-000000000084', @now, @ownerEmail, DATEADD(DAY,-92,@now), @j2, 'B1010300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-93,@now), N'COMPLETED', 'B1010500-EEEE-4EEE-8EEE-000000000017', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000004', 74, 'B1010C00-EEEE-4EEE-8EEE-000000000084'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000005', 74, 'B1010C00-EEEE-4EEE-8EEE-000000000084'),
  (NEWID(), @now, @ownerEmail, 'B1010600-EEEE-4EEE-8EEE-000000000006', 70, 'B1010C00-EEEE-4EEE-8EEE-000000000084');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-90,@now), 74.00, 4, 'B1010300-EEEE-4EEE-8EEE-000000000002', 'B1010200-EEEE-4EEE-8EEE-000000000004', 1, 0, @now);
INSERT INTO published_results (id, created_at, dispute_deadline, published_at, published_by, round_id) VALUES
  ('B1010E00-EEEE-4EEE-8EEE-000000000001', @now, DATEADD(DAY,2,DATEADD(DAY,-100,@now)), DATEADD(DAY,-100,@now), @coordId, 'B1010300-EEEE-4EEE-8EEE-000000000001'),
  ('B1010E00-EEEE-4EEE-8EEE-000000000002', @now, DATEADD(DAY,2,DATEADD(DAY,-90,@now)), DATEADD(DAY,-90,@now), @coordId, 'B1010300-EEEE-4EEE-8EEE-000000000002');
INSERT INTO team_awards (id, event_id, team_id, prize_id, awarded_at, created_at, updated_at, created_by) VALUES
  ('B1010F00-EEEE-4EEE-8EEE-000000000001', 'B1010100-EEEE-4EEE-8EEE-000000000001', 'B1010200-EEEE-4EEE-8EEE-000000000001', 'B1010700-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-90,@now), @now, @now, @ownerEmail),
  ('B1010F00-EEEE-4EEE-8EEE-000000000002', 'B1010100-EEEE-4EEE-8EEE-000000000001', 'B1010200-EEEE-4EEE-8EEE-000000000002', 'B1010700-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-90,@now), @now, @now, @ownerEmail),
  ('B1010F00-EEEE-4EEE-8EEE-000000000003', 'B1010100-EEEE-4EEE-8EEE-000000000001', 'B1010200-EEEE-4EEE-8EEE-000000000003', 'B1010700-EEEE-4EEE-8EEE-000000000003', DATEADD(DAY,-90,@now), @now, @now, @ownerEmail);
INSERT INTO participation_certificates (id, created_at, created_by, event_id, user_id, team_id, issued_at)
SELECT NEWID(), @now, @ownerEmail, 'B1010100-EEEE-4EEE-8EEE-000000000001', tm.user_id, tm.team_id, DATEADD(DAY,-90,@now)
FROM team_members tm WHERE tm.event_id = 'B1010100-EEEE-4EEE-8EEE-000000000001';
INSERT INTO participant_feedbacks (id, created_at, created_by, comment, event_id, overall_rating, submitted_at, team_id, user_id)
VALUES ('B1011000-EEEE-4EEE-8EEE-000000000001', @now, @ownerEmail, N'Great event — clear rounds and fair judging.', 'B1010100-EEEE-4EEE-8EEE-000000000001', 5, DATEADD(DAY,-89,@now), 'B1010200-EEEE-4EEE-8EEE-000000000001', @vinhId);

-- ========== Vinh Showcase 2 - Multi-hop Arena ==========
INSERT INTO hackathon_events (
  id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at,
  avatar_url, score_scale_max
) VALUES (
  'B1020100-EEEE-4EEE-8EEE-000000000001', N'Vinh Showcase 2 - Multi-hop Arena', N'Fall', 2025,
  DATEADD(DAY,-80,@today), DATEADD(DAY,-50,@today),
  DATEADD(DAY,-110,@today), DATEADD(DAY,-90,@today),
  N'Full COMPLETED showcase for achievements QA.', N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
  3, 5, 4, 8, @templateId, N'COMPLETED', 1, @coordId, @ownerEmail, @now, @now, NULL, 100);
INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, created_at, updated_at, created_by)
VALUES ('B1020400-EEEE-4EEE-8EEE-000000000001', 'B1020100-EEEE-4EEE-8EEE-000000000001', N'Arena Track', N'Showcase track', 15, N'OPEN', NULL, @now, @now, @ownerEmail);
INSERT INTO competition_groups (id, track_id, event_id, name, max_teams, sort_order, created_at, updated_at, created_by)
VALUES ('B1020A00-EEEE-4EEE-8EEE-000000000001', 'B1020400-EEEE-4EEE-8EEE-000000000001', 'B1020100-EEEE-4EEE-8EEE-000000000001', N'Group A', 15, 0, @now, @now, @ownerEmail);
INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, min_judges_per_round, created_at, updated_at, created_by) VALUES
  ('B1020300-EEEE-4EEE-8EEE-000000000001', 'B1020100-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(DAY,-75,@now), DATEADD(DAY,-60,@now), DATEADD(DAY,-65,@now), DATEADD(DAY,-65,@now), DATEADD(DAY,-60,@now), 4, N'PER_TRACK_TOP_N', 40, 2, @now, @now, @ownerEmail),
  ('B1020300-EEEE-4EEE-8EEE-000000000002', 'B1020100-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', N'FINAL', DATEADD(DAY,-60,@now), DATEADD(DAY,-50,@now), NULL, DATEADD(DAY,-55,@now), DATEADD(DAY,-50,@now), 4, N'FINALIST_POOL', 60, 2, @now, @now, @ownerEmail);
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('B1020600-EEEE-4EEE-8EEE-000000000001', 'B1020300-EEEE-4EEE-8EEE-000000000001', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, @ownerEmail),
  ('B1020600-EEEE-4EEE-8EEE-000000000002', 'B1020300-EEEE-4EEE-8EEE-000000000001', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, @ownerEmail),
  ('B1020600-EEEE-4EEE-8EEE-000000000003', 'B1020300-EEEE-4EEE-8EEE-000000000001', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, @ownerEmail);
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('B1020600-EEEE-4EEE-8EEE-000000000004', 'B1020300-EEEE-4EEE-8EEE-000000000002', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, @ownerEmail),
  ('B1020600-EEEE-4EEE-8EEE-000000000005', 'B1020300-EEEE-4EEE-8EEE-000000000002', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, @ownerEmail),
  ('B1020600-EEEE-4EEE-8EEE-000000000006', 'B1020300-EEEE-4EEE-8EEE-000000000002', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, @ownerEmail);
INSERT INTO event_schedules (id, event_id, type, title, description, start_time, end_time, gate, sort_order, created_at, updated_at) VALUES
  ('B1020800-EEEE-4EEE-8EEE-000000000001', 'B1020100-EEEE-4EEE-8EEE-000000000001', N'WORKSHOP', N'Workshop', NULL, DATEADD(DAY,-78,@now), DATEADD(HOUR,3,DATEADD(DAY,-78,@now)), NULL, 0, @now, @now),
  ('B1020800-EEEE-4EEE-8EEE-000000000002', 'B1020100-EEEE-4EEE-8EEE-000000000001', N'OPENING', N'Opening', N'Kickoff', DATEADD(DAY,-76,@now), DATEADD(HOUR,2,DATEADD(DAY,-76,@now)), NULL, 1, @now, @now),
  ('B1020800-EEEE-4EEE-8EEE-000000000003', 'B1020100-EEEE-4EEE-8EEE-000000000001', N'SCORING', N'Final scoring', NULL, DATEADD(DAY,-53,@now), DATEADD(DAY,-50,@now), NULL, 2, @now, @now);
INSERT INTO prizes (id, created_at, created_by, quantity, [rank], value, event_id, label, track_id) VALUES
  ('B1020700-EEEE-4EEE-8EEE-000000000001', @now, @ownerEmail, 1, N'FIRST', N'10,000,000 VND + Trophy', 'B1020100-EEEE-4EEE-8EEE-000000000001', N'First Prize', NULL),
  ('B1020700-EEEE-4EEE-8EEE-000000000002', @now, @ownerEmail, 1, N'SECOND', N'5,000,000 VND', 'B1020100-EEEE-4EEE-8EEE-000000000001', N'Second Prize', NULL),
  ('B1020700-EEEE-4EEE-8EEE-000000000003', @now, @ownerEmail, 1, N'THIRD', N'2,000,000 VND', 'B1020100-EEEE-4EEE-8EEE-000000000001', N'Third Prize', NULL);
INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), 'B1020100-EEEE-4EEE-8EEE-000000000001', N'APPROVED', u.id, 0, 1
FROM users u WHERE u.email IN (
  N'nguyentruongvinh05@gmail.com', N'vinh.mate1@fpt.edu.vn', N'vinh.mate2@fpt.edu.vn',
  N'vinh.r01@fpt.edu.vn', N'vinh.r02@fpt.edu.vn', N'vinh.r03@fpt.edu.vn', N'vinh.r04@fpt.edu.vn', N'vinh.r05@fpt.edu.vn', N'vinh.r06@fpt.edu.vn',
  N'vinh.r07@fpt.edu.vn', N'vinh.r08@fpt.edu.vn', N'vinh.r09@fpt.edu.vn', N'vinh.r10@fpt.edu.vn', N'vinh.r11@fpt.edu.vn', N'vinh.r12@fpt.edu.vn',
  N'vinh.r13@fpt.edu.vn', N'vinh.r14@fpt.edu.vn', N'vinh.r15@fpt.edu.vn', N'vinh.r16@fpt.edu.vn', N'vinh.r17@fpt.edu.vn', N'vinh.r18@fpt.edu.vn',
  N'vinh.r19@fpt.edu.vn', N'vinh.r20@fpt.edu.vn', N'vinh.r21@fpt.edu.vn', N'vinh.r22@fpt.edu.vn', N'vinh.r23@fpt.edu.vn', N'vinh.r24@fpt.edu.vn',
  N'vinh.r25@fpt.edu.vn', N'vinh.r26@fpt.edu.vn', N'vinh.r27@fpt.edu.vn');
INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id, created_by) VALUES
  (NEWID(), @now, @now, @j1, 'B1020100-EEEE-4EEE-8EEE-000000000001', @ownerEmail),
  (NEWID(), @now, @now, @j2, 'B1020100-EEEE-4EEE-8EEE-000000000001', @ownerEmail);
INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active, created_by) VALUES
  (NEWID(), @now, @now, @j1, 'B1020300-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1, @ownerEmail),
  (NEWID(), @now, @now, @j2, 'B1020300-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1, @ownerEmail),
  (NEWID(), @now, @now, @j1, 'B1020300-EEEE-4EEE-8EEE-000000000002', N'ROUND', 1, @ownerEmail),
  (NEWID(), @now, @now, @j2, 'B1020300-EEEE-4EEE-8EEE-000000000002', N'ROUND', 1, @ownerEmail);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1020200-EEEE-4EEE-8EEE-000000000001', @now, @ownerEmail, 'B1020100-EEEE-4EEE-8EEE-000000000001', @vinhId, N'Team Vinh Silver', N'CONFIRMED', 'B1020400-EEEE-4EEE-8EEE-000000000001', 'B1020A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'LEADER', @vinhId, 'B1020200-EEEE-4EEE-8EEE-000000000001', 'B1020100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'MEMBER', @mate1Id, 'B1020200-EEEE-4EEE-8EEE-000000000001', 'B1020100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'MEMBER', @mate2Id, 'B1020200-EEEE-4EEE-8EEE-000000000001', 'B1020100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1020500-EEEE-4EEE-8EEE-000000000001', @now, @ownerEmail, NULL, 'B1020300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @vinhId, 'B1020200-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1020B00-EEEE-4EEE-8EEE-000000000001', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e2-t1', N'https://docs.google.com/presentation/d/vinh-e2-t1', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-66,@now), 1, 'B1020500-EEEE-4EEE-8EEE-000000000001');
UPDATE submissions SET current_version_id='B1020B00-EEEE-4EEE-8EEE-000000000001' WHERE id='B1020500-EEEE-4EEE-8EEE-000000000001';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-000000000001', @now, @ownerEmail, DATEADD(DAY,-62,@now), @j1, 'B1020300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-63,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000001', 95, 'B1020C00-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000002', 95, 'B1020C00-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000003', 90, 'B1020C00-EEEE-4EEE-8EEE-000000000001');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-000000000002', @now, @ownerEmail, DATEADD(DAY,-62,@now), @j2, 'B1020300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-63,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000001', 95, 'B1020C00-EEEE-4EEE-8EEE-000000000002'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000002', 95, 'B1020C00-EEEE-4EEE-8EEE-000000000002'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000003', 90, 'B1020C00-EEEE-4EEE-8EEE-000000000002');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-60,@now), 95.00, 1, 'B1020300-EEEE-4EEE-8EEE-000000000001', 'B1020200-EEEE-4EEE-8EEE-000000000001', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1020200-EEEE-4EEE-8EEE-000000000002', @now, @ownerEmail, 'B1020100-EEEE-4EEE-8EEE-000000000001', @r1, N'Team Rival Beta', N'CONFIRMED', 'B1020400-EEEE-4EEE-8EEE-000000000001', 'B1020A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'LEADER', @r1, 'B1020200-EEEE-4EEE-8EEE-000000000002', 'B1020100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'MEMBER', @r2, 'B1020200-EEEE-4EEE-8EEE-000000000002', 'B1020100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'MEMBER', @r3, 'B1020200-EEEE-4EEE-8EEE-000000000002', 'B1020100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1020500-EEEE-4EEE-8EEE-000000000002', @now, @ownerEmail, NULL, 'B1020300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r1, 'B1020200-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1020B00-EEEE-4EEE-8EEE-000000000002', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e2-t2', N'https://docs.google.com/presentation/d/vinh-e2-t2', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-66,@now), 1, 'B1020500-EEEE-4EEE-8EEE-000000000002');
UPDATE submissions SET current_version_id='B1020B00-EEEE-4EEE-8EEE-000000000002' WHERE id='B1020500-EEEE-4EEE-8EEE-000000000002';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-00000000000B', @now, @ownerEmail, DATEADD(DAY,-62,@now), @j1, 'B1020300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-63,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000001', 92, 'B1020C00-EEEE-4EEE-8EEE-00000000000B'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000002', 92, 'B1020C00-EEEE-4EEE-8EEE-00000000000B'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000003', 87, 'B1020C00-EEEE-4EEE-8EEE-00000000000B');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-00000000000C', @now, @ownerEmail, DATEADD(DAY,-62,@now), @j2, 'B1020300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-63,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000001', 92, 'B1020C00-EEEE-4EEE-8EEE-00000000000C'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000002', 92, 'B1020C00-EEEE-4EEE-8EEE-00000000000C'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000003', 87, 'B1020C00-EEEE-4EEE-8EEE-00000000000C');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-60,@now), 92.00, 2, 'B1020300-EEEE-4EEE-8EEE-000000000001', 'B1020200-EEEE-4EEE-8EEE-000000000002', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1020200-EEEE-4EEE-8EEE-000000000003', @now, @ownerEmail, 'B1020100-EEEE-4EEE-8EEE-000000000001', @r4, N'Team Rival Gamma', N'CONFIRMED', 'B1020400-EEEE-4EEE-8EEE-000000000001', 'B1020A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'LEADER', @r4, 'B1020200-EEEE-4EEE-8EEE-000000000003', 'B1020100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'MEMBER', @r5, 'B1020200-EEEE-4EEE-8EEE-000000000003', 'B1020100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'MEMBER', @r6, 'B1020200-EEEE-4EEE-8EEE-000000000003', 'B1020100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1020500-EEEE-4EEE-8EEE-000000000003', @now, @ownerEmail, NULL, 'B1020300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r4, 'B1020200-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1020B00-EEEE-4EEE-8EEE-000000000003', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e2-t3', N'https://docs.google.com/presentation/d/vinh-e2-t3', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-66,@now), 1, 'B1020500-EEEE-4EEE-8EEE-000000000003');
UPDATE submissions SET current_version_id='B1020B00-EEEE-4EEE-8EEE-000000000003' WHERE id='B1020500-EEEE-4EEE-8EEE-000000000003';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-000000000015', @now, @ownerEmail, DATEADD(DAY,-62,@now), @j1, 'B1020300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-63,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000001', 89, 'B1020C00-EEEE-4EEE-8EEE-000000000015'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000002', 89, 'B1020C00-EEEE-4EEE-8EEE-000000000015'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000003', 84, 'B1020C00-EEEE-4EEE-8EEE-000000000015');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-000000000016', @now, @ownerEmail, DATEADD(DAY,-62,@now), @j2, 'B1020300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-63,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000001', 89, 'B1020C00-EEEE-4EEE-8EEE-000000000016'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000002', 89, 'B1020C00-EEEE-4EEE-8EEE-000000000016'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000003', 84, 'B1020C00-EEEE-4EEE-8EEE-000000000016');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-60,@now), 89.00, 3, 'B1020300-EEEE-4EEE-8EEE-000000000001', 'B1020200-EEEE-4EEE-8EEE-000000000003', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1020200-EEEE-4EEE-8EEE-000000000004', @now, @ownerEmail, 'B1020100-EEEE-4EEE-8EEE-000000000001', @r7, N'Team Rival Delta', N'CONFIRMED', 'B1020400-EEEE-4EEE-8EEE-000000000001', 'B1020A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'LEADER', @r7, 'B1020200-EEEE-4EEE-8EEE-000000000004', 'B1020100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'MEMBER', @r8, 'B1020200-EEEE-4EEE-8EEE-000000000004', 'B1020100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'MEMBER', @r9, 'B1020200-EEEE-4EEE-8EEE-000000000004', 'B1020100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1020500-EEEE-4EEE-8EEE-000000000004', @now, @ownerEmail, NULL, 'B1020300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r7, 'B1020200-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1020B00-EEEE-4EEE-8EEE-000000000004', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e2-t4', N'https://docs.google.com/presentation/d/vinh-e2-t4', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-66,@now), 1, 'B1020500-EEEE-4EEE-8EEE-000000000004');
UPDATE submissions SET current_version_id='B1020B00-EEEE-4EEE-8EEE-000000000004' WHERE id='B1020500-EEEE-4EEE-8EEE-000000000004';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-00000000001F', @now, @ownerEmail, DATEADD(DAY,-62,@now), @j1, 'B1020300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-63,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000001', 86, 'B1020C00-EEEE-4EEE-8EEE-00000000001F'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000002', 86, 'B1020C00-EEEE-4EEE-8EEE-00000000001F'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000003', 81, 'B1020C00-EEEE-4EEE-8EEE-00000000001F');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-000000000020', @now, @ownerEmail, DATEADD(DAY,-62,@now), @j2, 'B1020300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-63,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000001', 86, 'B1020C00-EEEE-4EEE-8EEE-000000000020'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000002', 86, 'B1020C00-EEEE-4EEE-8EEE-000000000020'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000003', 81, 'B1020C00-EEEE-4EEE-8EEE-000000000020');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-60,@now), 86.00, 4, 'B1020300-EEEE-4EEE-8EEE-000000000001', 'B1020200-EEEE-4EEE-8EEE-000000000004', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1020200-EEEE-4EEE-8EEE-000000000005', @now, @ownerEmail, 'B1020100-EEEE-4EEE-8EEE-000000000001', @r10, N'Team Rival Epsilon', N'CONFIRMED', 'B1020400-EEEE-4EEE-8EEE-000000000001', 'B1020A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'LEADER', @r10, 'B1020200-EEEE-4EEE-8EEE-000000000005', 'B1020100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'MEMBER', @r11, 'B1020200-EEEE-4EEE-8EEE-000000000005', 'B1020100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'MEMBER', @r12, 'B1020200-EEEE-4EEE-8EEE-000000000005', 'B1020100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1020500-EEEE-4EEE-8EEE-000000000005', @now, @ownerEmail, NULL, 'B1020300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r10, 'B1020200-EEEE-4EEE-8EEE-000000000005', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1020B00-EEEE-4EEE-8EEE-000000000005', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e2-t5', N'https://docs.google.com/presentation/d/vinh-e2-t5', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-66,@now), 1, 'B1020500-EEEE-4EEE-8EEE-000000000005');
UPDATE submissions SET current_version_id='B1020B00-EEEE-4EEE-8EEE-000000000005' WHERE id='B1020500-EEEE-4EEE-8EEE-000000000005';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-000000000029', @now, @ownerEmail, DATEADD(DAY,-62,@now), @j1, 'B1020300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-63,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000005', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000001', 83, 'B1020C00-EEEE-4EEE-8EEE-000000000029'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000002', 83, 'B1020C00-EEEE-4EEE-8EEE-000000000029'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000003', 78, 'B1020C00-EEEE-4EEE-8EEE-000000000029');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-00000000002A', @now, @ownerEmail, DATEADD(DAY,-62,@now), @j2, 'B1020300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-63,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000005', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000001', 83, 'B1020C00-EEEE-4EEE-8EEE-00000000002A'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000002', 83, 'B1020C00-EEEE-4EEE-8EEE-00000000002A'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000003', 78, 'B1020C00-EEEE-4EEE-8EEE-00000000002A');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-60,@now), 83.00, 5, 'B1020300-EEEE-4EEE-8EEE-000000000001', 'B1020200-EEEE-4EEE-8EEE-000000000005', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1020200-EEEE-4EEE-8EEE-000000000006', @now, @ownerEmail, 'B1020100-EEEE-4EEE-8EEE-000000000001', @r13, N'Team Rival Zeta', N'CONFIRMED', 'B1020400-EEEE-4EEE-8EEE-000000000001', 'B1020A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'LEADER', @r13, 'B1020200-EEEE-4EEE-8EEE-000000000006', 'B1020100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'MEMBER', @r14, 'B1020200-EEEE-4EEE-8EEE-000000000006', 'B1020100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'MEMBER', @r15, 'B1020200-EEEE-4EEE-8EEE-000000000006', 'B1020100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1020500-EEEE-4EEE-8EEE-000000000006', @now, @ownerEmail, NULL, 'B1020300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r13, 'B1020200-EEEE-4EEE-8EEE-000000000006', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1020B00-EEEE-4EEE-8EEE-000000000006', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e2-t6', N'https://docs.google.com/presentation/d/vinh-e2-t6', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-66,@now), 1, 'B1020500-EEEE-4EEE-8EEE-000000000006');
UPDATE submissions SET current_version_id='B1020B00-EEEE-4EEE-8EEE-000000000006' WHERE id='B1020500-EEEE-4EEE-8EEE-000000000006';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-000000000033', @now, @ownerEmail, DATEADD(DAY,-62,@now), @j1, 'B1020300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-63,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000006', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000001', 80, 'B1020C00-EEEE-4EEE-8EEE-000000000033'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000002', 80, 'B1020C00-EEEE-4EEE-8EEE-000000000033'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000003', 75, 'B1020C00-EEEE-4EEE-8EEE-000000000033');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-000000000034', @now, @ownerEmail, DATEADD(DAY,-62,@now), @j2, 'B1020300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-63,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000006', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000001', 80, 'B1020C00-EEEE-4EEE-8EEE-000000000034'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000002', 80, 'B1020C00-EEEE-4EEE-8EEE-000000000034'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000003', 75, 'B1020C00-EEEE-4EEE-8EEE-000000000034');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-60,@now), 80.00, 6, 'B1020300-EEEE-4EEE-8EEE-000000000001', 'B1020200-EEEE-4EEE-8EEE-000000000006', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1020200-EEEE-4EEE-8EEE-000000000007', @now, @ownerEmail, 'B1020100-EEEE-4EEE-8EEE-000000000001', @r16, N'Team Rival Eta', N'CONFIRMED', 'B1020400-EEEE-4EEE-8EEE-000000000001', 'B1020A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'LEADER', @r16, 'B1020200-EEEE-4EEE-8EEE-000000000007', 'B1020100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'MEMBER', @r17, 'B1020200-EEEE-4EEE-8EEE-000000000007', 'B1020100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'MEMBER', @r18, 'B1020200-EEEE-4EEE-8EEE-000000000007', 'B1020100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1020500-EEEE-4EEE-8EEE-000000000007', @now, @ownerEmail, NULL, 'B1020300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r16, 'B1020200-EEEE-4EEE-8EEE-000000000007', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1020B00-EEEE-4EEE-8EEE-000000000007', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e2-t7', N'https://docs.google.com/presentation/d/vinh-e2-t7', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-66,@now), 1, 'B1020500-EEEE-4EEE-8EEE-000000000007');
UPDATE submissions SET current_version_id='B1020B00-EEEE-4EEE-8EEE-000000000007' WHERE id='B1020500-EEEE-4EEE-8EEE-000000000007';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-00000000003D', @now, @ownerEmail, DATEADD(DAY,-62,@now), @j1, 'B1020300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-63,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000007', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000001', 77, 'B1020C00-EEEE-4EEE-8EEE-00000000003D'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000002', 77, 'B1020C00-EEEE-4EEE-8EEE-00000000003D'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000003', 72, 'B1020C00-EEEE-4EEE-8EEE-00000000003D');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-00000000003E', @now, @ownerEmail, DATEADD(DAY,-62,@now), @j2, 'B1020300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-63,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000007', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000001', 77, 'B1020C00-EEEE-4EEE-8EEE-00000000003E'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000002', 77, 'B1020C00-EEEE-4EEE-8EEE-00000000003E'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000003', 72, 'B1020C00-EEEE-4EEE-8EEE-00000000003E');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-60,@now), 77.00, 7, 'B1020300-EEEE-4EEE-8EEE-000000000001', 'B1020200-EEEE-4EEE-8EEE-000000000007', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1020200-EEEE-4EEE-8EEE-000000000008', @now, @ownerEmail, 'B1020100-EEEE-4EEE-8EEE-000000000001', @r19, N'Team Rival Theta', N'CONFIRMED', 'B1020400-EEEE-4EEE-8EEE-000000000001', 'B1020A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'LEADER', @r19, 'B1020200-EEEE-4EEE-8EEE-000000000008', 'B1020100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'MEMBER', @r20, 'B1020200-EEEE-4EEE-8EEE-000000000008', 'B1020100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'MEMBER', @r21, 'B1020200-EEEE-4EEE-8EEE-000000000008', 'B1020100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1020500-EEEE-4EEE-8EEE-000000000008', @now, @ownerEmail, NULL, 'B1020300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r19, 'B1020200-EEEE-4EEE-8EEE-000000000008', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1020B00-EEEE-4EEE-8EEE-000000000008', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e2-t8', N'https://docs.google.com/presentation/d/vinh-e2-t8', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-66,@now), 1, 'B1020500-EEEE-4EEE-8EEE-000000000008');
UPDATE submissions SET current_version_id='B1020B00-EEEE-4EEE-8EEE-000000000008' WHERE id='B1020500-EEEE-4EEE-8EEE-000000000008';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-000000000047', @now, @ownerEmail, DATEADD(DAY,-62,@now), @j1, 'B1020300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-63,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000008', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000001', 74, 'B1020C00-EEEE-4EEE-8EEE-000000000047'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000002', 74, 'B1020C00-EEEE-4EEE-8EEE-000000000047'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000003', 69, 'B1020C00-EEEE-4EEE-8EEE-000000000047');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-000000000048', @now, @ownerEmail, DATEADD(DAY,-62,@now), @j2, 'B1020300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-63,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000008', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000001', 74, 'B1020C00-EEEE-4EEE-8EEE-000000000048'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000002', 74, 'B1020C00-EEEE-4EEE-8EEE-000000000048'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000003', 69, 'B1020C00-EEEE-4EEE-8EEE-000000000048');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-60,@now), 74.00, 8, 'B1020300-EEEE-4EEE-8EEE-000000000001', 'B1020200-EEEE-4EEE-8EEE-000000000008', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1020200-EEEE-4EEE-8EEE-000000000009', @now, @ownerEmail, 'B1020100-EEEE-4EEE-8EEE-000000000001', @r22, N'Team Rival Iota', N'CONFIRMED', 'B1020400-EEEE-4EEE-8EEE-000000000001', 'B1020A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'LEADER', @r22, 'B1020200-EEEE-4EEE-8EEE-000000000009', 'B1020100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'MEMBER', @r23, 'B1020200-EEEE-4EEE-8EEE-000000000009', 'B1020100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'MEMBER', @r24, 'B1020200-EEEE-4EEE-8EEE-000000000009', 'B1020100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1020500-EEEE-4EEE-8EEE-000000000009', @now, @ownerEmail, NULL, 'B1020300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r22, 'B1020200-EEEE-4EEE-8EEE-000000000009', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1020B00-EEEE-4EEE-8EEE-000000000009', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e2-t9', N'https://docs.google.com/presentation/d/vinh-e2-t9', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-66,@now), 1, 'B1020500-EEEE-4EEE-8EEE-000000000009');
UPDATE submissions SET current_version_id='B1020B00-EEEE-4EEE-8EEE-000000000009' WHERE id='B1020500-EEEE-4EEE-8EEE-000000000009';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-000000000051', @now, @ownerEmail, DATEADD(DAY,-62,@now), @j1, 'B1020300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-63,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000009', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000001', 71, 'B1020C00-EEEE-4EEE-8EEE-000000000051'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000002', 71, 'B1020C00-EEEE-4EEE-8EEE-000000000051'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000003', 66, 'B1020C00-EEEE-4EEE-8EEE-000000000051');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-000000000052', @now, @ownerEmail, DATEADD(DAY,-62,@now), @j2, 'B1020300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-63,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000009', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000001', 71, 'B1020C00-EEEE-4EEE-8EEE-000000000052'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000002', 71, 'B1020C00-EEEE-4EEE-8EEE-000000000052'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000003', 66, 'B1020C00-EEEE-4EEE-8EEE-000000000052');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-60,@now), 71.00, 9, 'B1020300-EEEE-4EEE-8EEE-000000000001', 'B1020200-EEEE-4EEE-8EEE-000000000009', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1020200-EEEE-4EEE-8EEE-00000000000A', @now, @ownerEmail, 'B1020100-EEEE-4EEE-8EEE-000000000001', @r25, N'Team Rival Kappa', N'CONFIRMED', 'B1020400-EEEE-4EEE-8EEE-000000000001', 'B1020A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'LEADER', @r25, 'B1020200-EEEE-4EEE-8EEE-00000000000A', 'B1020100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'MEMBER', @r26, 'B1020200-EEEE-4EEE-8EEE-00000000000A', 'B1020100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-85,@now), N'MEMBER', @r27, 'B1020200-EEEE-4EEE-8EEE-00000000000A', 'B1020100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1020500-EEEE-4EEE-8EEE-00000000000A', @now, @ownerEmail, NULL, 'B1020300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r25, 'B1020200-EEEE-4EEE-8EEE-00000000000A', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1020B00-EEEE-4EEE-8EEE-00000000000A', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e2-t10', N'https://docs.google.com/presentation/d/vinh-e2-t10', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-66,@now), 1, 'B1020500-EEEE-4EEE-8EEE-00000000000A');
UPDATE submissions SET current_version_id='B1020B00-EEEE-4EEE-8EEE-00000000000A' WHERE id='B1020500-EEEE-4EEE-8EEE-00000000000A';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-00000000005B', @now, @ownerEmail, DATEADD(DAY,-62,@now), @j1, 'B1020300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-63,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-00000000000A', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000001', 68, 'B1020C00-EEEE-4EEE-8EEE-00000000005B'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000002', 68, 'B1020C00-EEEE-4EEE-8EEE-00000000005B'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000003', 63, 'B1020C00-EEEE-4EEE-8EEE-00000000005B');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-00000000005C', @now, @ownerEmail, DATEADD(DAY,-62,@now), @j2, 'B1020300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-63,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-00000000000A', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000001', 68, 'B1020C00-EEEE-4EEE-8EEE-00000000005C'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000002', 68, 'B1020C00-EEEE-4EEE-8EEE-00000000005C'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000003', 63, 'B1020C00-EEEE-4EEE-8EEE-00000000005C');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-60,@now), 68.00, 10, 'B1020300-EEEE-4EEE-8EEE-000000000001', 'B1020200-EEEE-4EEE-8EEE-00000000000A', 1, 0, @now);
INSERT INTO finalist_selections (id, event_id, team_id, track_id, preliminary_rank, selected_reason, selected_at, created_at, updated_at, selection_method, eligible) VALUES
  ('B1020D00-EEEE-4EEE-8EEE-000000000001', 'B1020100-EEEE-4EEE-8EEE-000000000001', 'B1020200-EEEE-4EEE-8EEE-000000000001', 'B1020400-EEEE-4EEE-8EEE-000000000001', 1, N'Top 1', DATEADD(DAY,-59,@now), @now, @now, N'AUTO', 1),
  ('B1020D00-EEEE-4EEE-8EEE-000000000002', 'B1020100-EEEE-4EEE-8EEE-000000000001', 'B1020200-EEEE-4EEE-8EEE-000000000002', 'B1020400-EEEE-4EEE-8EEE-000000000001', 2, N'Top 2', DATEADD(DAY,-59,@now), @now, @now, N'AUTO', 1),
  ('B1020D00-EEEE-4EEE-8EEE-000000000003', 'B1020100-EEEE-4EEE-8EEE-000000000001', 'B1020200-EEEE-4EEE-8EEE-000000000003', 'B1020400-EEEE-4EEE-8EEE-000000000001', 3, N'Top 3', DATEADD(DAY,-59,@now), @now, @now, N'AUTO', 1),
  ('B1020D00-EEEE-4EEE-8EEE-000000000004', 'B1020100-EEEE-4EEE-8EEE-000000000001', 'B1020200-EEEE-4EEE-8EEE-000000000004', 'B1020400-EEEE-4EEE-8EEE-000000000001', 4, N'Top 4', DATEADD(DAY,-59,@now), @now, @now, N'AUTO', 1);
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1020500-EEEE-4EEE-8EEE-000000000014', @now, @ownerEmail, NULL, 'B1020300-EEEE-4EEE-8EEE-000000000002', N'SCORED', @vinhId, 'B1020200-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1020B00-EEEE-4EEE-8EEE-000000000014', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e2-final-t1', N'https://docs.google.com/presentation/d/vinh-e2-final-t1', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-56,@now), 1, 'B1020500-EEEE-4EEE-8EEE-000000000014');
UPDATE submissions SET current_version_id='B1020B00-EEEE-4EEE-8EEE-000000000014' WHERE id='B1020500-EEEE-4EEE-8EEE-000000000014';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-000000000065', @now, @ownerEmail, DATEADD(DAY,-52,@now), @j1, 'B1020300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-53,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000014', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000004', 92, 'B1020C00-EEEE-4EEE-8EEE-000000000065'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000005', 92, 'B1020C00-EEEE-4EEE-8EEE-000000000065'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000006', 88, 'B1020C00-EEEE-4EEE-8EEE-000000000065');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-000000000066', @now, @ownerEmail, DATEADD(DAY,-52,@now), @j2, 'B1020300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-53,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000014', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000004', 92, 'B1020C00-EEEE-4EEE-8EEE-000000000066'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000005', 92, 'B1020C00-EEEE-4EEE-8EEE-000000000066'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000006', 88, 'B1020C00-EEEE-4EEE-8EEE-000000000066');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-50,@now), 92.00, 1, 'B1020300-EEEE-4EEE-8EEE-000000000002', 'B1020200-EEEE-4EEE-8EEE-000000000001', 1, 0, @now);
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1020500-EEEE-4EEE-8EEE-000000000015', @now, @ownerEmail, NULL, 'B1020300-EEEE-4EEE-8EEE-000000000002', N'SCORED', @r1, 'B1020200-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1020B00-EEEE-4EEE-8EEE-000000000015', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e2-final-t2', N'https://docs.google.com/presentation/d/vinh-e2-final-t2', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-56,@now), 1, 'B1020500-EEEE-4EEE-8EEE-000000000015');
UPDATE submissions SET current_version_id='B1020B00-EEEE-4EEE-8EEE-000000000015' WHERE id='B1020500-EEEE-4EEE-8EEE-000000000015';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-00000000006F', @now, @ownerEmail, DATEADD(DAY,-52,@now), @j1, 'B1020300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-53,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000015', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000004', 86, 'B1020C00-EEEE-4EEE-8EEE-00000000006F'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000005', 86, 'B1020C00-EEEE-4EEE-8EEE-00000000006F'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000006', 82, 'B1020C00-EEEE-4EEE-8EEE-00000000006F');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-000000000070', @now, @ownerEmail, DATEADD(DAY,-52,@now), @j2, 'B1020300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-53,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000015', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000004', 86, 'B1020C00-EEEE-4EEE-8EEE-000000000070'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000005', 86, 'B1020C00-EEEE-4EEE-8EEE-000000000070'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000006', 82, 'B1020C00-EEEE-4EEE-8EEE-000000000070');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-50,@now), 86.00, 2, 'B1020300-EEEE-4EEE-8EEE-000000000002', 'B1020200-EEEE-4EEE-8EEE-000000000002', 1, 0, @now);
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1020500-EEEE-4EEE-8EEE-000000000016', @now, @ownerEmail, NULL, 'B1020300-EEEE-4EEE-8EEE-000000000002', N'SCORED', @r4, 'B1020200-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1020B00-EEEE-4EEE-8EEE-000000000016', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e2-final-t3', N'https://docs.google.com/presentation/d/vinh-e2-final-t3', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-56,@now), 1, 'B1020500-EEEE-4EEE-8EEE-000000000016');
UPDATE submissions SET current_version_id='B1020B00-EEEE-4EEE-8EEE-000000000016' WHERE id='B1020500-EEEE-4EEE-8EEE-000000000016';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-000000000079', @now, @ownerEmail, DATEADD(DAY,-52,@now), @j1, 'B1020300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-53,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000016', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000004', 80, 'B1020C00-EEEE-4EEE-8EEE-000000000079'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000005', 80, 'B1020C00-EEEE-4EEE-8EEE-000000000079'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000006', 76, 'B1020C00-EEEE-4EEE-8EEE-000000000079');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-00000000007A', @now, @ownerEmail, DATEADD(DAY,-52,@now), @j2, 'B1020300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-53,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000016', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000004', 80, 'B1020C00-EEEE-4EEE-8EEE-00000000007A'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000005', 80, 'B1020C00-EEEE-4EEE-8EEE-00000000007A'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000006', 76, 'B1020C00-EEEE-4EEE-8EEE-00000000007A');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-50,@now), 80.00, 3, 'B1020300-EEEE-4EEE-8EEE-000000000002', 'B1020200-EEEE-4EEE-8EEE-000000000003', 1, 0, @now);
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1020500-EEEE-4EEE-8EEE-000000000017', @now, @ownerEmail, NULL, 'B1020300-EEEE-4EEE-8EEE-000000000002', N'SCORED', @r7, 'B1020200-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1020B00-EEEE-4EEE-8EEE-000000000017', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e2-final-t4', N'https://docs.google.com/presentation/d/vinh-e2-final-t4', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-56,@now), 1, 'B1020500-EEEE-4EEE-8EEE-000000000017');
UPDATE submissions SET current_version_id='B1020B00-EEEE-4EEE-8EEE-000000000017' WHERE id='B1020500-EEEE-4EEE-8EEE-000000000017';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-000000000083', @now, @ownerEmail, DATEADD(DAY,-52,@now), @j1, 'B1020300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-53,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000017', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000004', 74, 'B1020C00-EEEE-4EEE-8EEE-000000000083'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000005', 74, 'B1020C00-EEEE-4EEE-8EEE-000000000083'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000006', 70, 'B1020C00-EEEE-4EEE-8EEE-000000000083');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1020C00-EEEE-4EEE-8EEE-000000000084', @now, @ownerEmail, DATEADD(DAY,-52,@now), @j2, 'B1020300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-53,@now), N'COMPLETED', 'B1020500-EEEE-4EEE-8EEE-000000000017', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000004', 74, 'B1020C00-EEEE-4EEE-8EEE-000000000084'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000005', 74, 'B1020C00-EEEE-4EEE-8EEE-000000000084'),
  (NEWID(), @now, @ownerEmail, 'B1020600-EEEE-4EEE-8EEE-000000000006', 70, 'B1020C00-EEEE-4EEE-8EEE-000000000084');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-50,@now), 74.00, 4, 'B1020300-EEEE-4EEE-8EEE-000000000002', 'B1020200-EEEE-4EEE-8EEE-000000000004', 1, 0, @now);
INSERT INTO published_results (id, created_at, dispute_deadline, published_at, published_by, round_id) VALUES
  ('B1020E00-EEEE-4EEE-8EEE-000000000001', @now, DATEADD(DAY,2,DATEADD(DAY,-60,@now)), DATEADD(DAY,-60,@now), @coordId, 'B1020300-EEEE-4EEE-8EEE-000000000001'),
  ('B1020E00-EEEE-4EEE-8EEE-000000000002', @now, DATEADD(DAY,2,DATEADD(DAY,-50,@now)), DATEADD(DAY,-50,@now), @coordId, 'B1020300-EEEE-4EEE-8EEE-000000000002');
INSERT INTO team_awards (id, event_id, team_id, prize_id, awarded_at, created_at, updated_at, created_by) VALUES
  ('B1020F00-EEEE-4EEE-8EEE-000000000001', 'B1020100-EEEE-4EEE-8EEE-000000000001', 'B1020200-EEEE-4EEE-8EEE-000000000001', 'B1020700-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-50,@now), @now, @now, @ownerEmail),
  ('B1020F00-EEEE-4EEE-8EEE-000000000002', 'B1020100-EEEE-4EEE-8EEE-000000000001', 'B1020200-EEEE-4EEE-8EEE-000000000002', 'B1020700-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-50,@now), @now, @now, @ownerEmail),
  ('B1020F00-EEEE-4EEE-8EEE-000000000003', 'B1020100-EEEE-4EEE-8EEE-000000000001', 'B1020200-EEEE-4EEE-8EEE-000000000003', 'B1020700-EEEE-4EEE-8EEE-000000000003', DATEADD(DAY,-50,@now), @now, @now, @ownerEmail);
INSERT INTO participation_certificates (id, created_at, created_by, event_id, user_id, team_id, issued_at)
SELECT NEWID(), @now, @ownerEmail, 'B1020100-EEEE-4EEE-8EEE-000000000001', tm.user_id, tm.team_id, DATEADD(DAY,-50,@now)
FROM team_members tm WHERE tm.event_id = 'B1020100-EEEE-4EEE-8EEE-000000000001';
INSERT INTO participant_feedbacks (id, created_at, created_by, comment, event_id, overall_rating, submitted_at, team_id, user_id)
VALUES ('B1021000-EEEE-4EEE-8EEE-000000000001', @now, @ownerEmail, N'Great event — clear rounds and fair judging.', 'B1020100-EEEE-4EEE-8EEE-000000000001', 5, DATEADD(DAY,-49,@now), 'B1020200-EEEE-4EEE-8EEE-000000000001', @vinhId);

-- ========== Vinh Showcase 3 - Alumni Build Day ==========
INSERT INTO hackathon_events (
  id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at,
  avatar_url, score_scale_max
) VALUES (
  'B1030100-EEEE-4EEE-8EEE-000000000001', N'Vinh Showcase 3 - Alumni Build Day', N'Spring', 2026,
  DATEADD(DAY,-40,@today), DATEADD(DAY,-10,@today),
  DATEADD(DAY,-70,@today), DATEADD(DAY,-50,@today),
  N'Full COMPLETED showcase for achievements QA.', N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
  3, 5, 4, 8, @templateId, N'COMPLETED', 1, @coordId, @ownerEmail, @now, @now, NULL, 100);
INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, created_at, updated_at, created_by)
VALUES ('B1030400-EEEE-4EEE-8EEE-000000000001', 'B1030100-EEEE-4EEE-8EEE-000000000001', N'Alumni Track', N'Showcase track', 15, N'OPEN', NULL, @now, @now, @ownerEmail);
INSERT INTO competition_groups (id, track_id, event_id, name, max_teams, sort_order, created_at, updated_at, created_by)
VALUES ('B1030A00-EEEE-4EEE-8EEE-000000000001', 'B1030400-EEEE-4EEE-8EEE-000000000001', 'B1030100-EEEE-4EEE-8EEE-000000000001', N'Group A', 15, 0, @now, @now, @ownerEmail);
INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, min_judges_per_round, created_at, updated_at, created_by) VALUES
  ('B1030300-EEEE-4EEE-8EEE-000000000001', 'B1030100-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(DAY,-35,@now), DATEADD(DAY,-20,@now), DATEADD(DAY,-25,@now), DATEADD(DAY,-25,@now), DATEADD(DAY,-20,@now), 4, N'PER_TRACK_TOP_N', 40, 2, @now, @now, @ownerEmail),
  ('B1030300-EEEE-4EEE-8EEE-000000000002', 'B1030100-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', N'FINAL', DATEADD(DAY,-20,@now), DATEADD(DAY,-10,@now), NULL, DATEADD(DAY,-15,@now), DATEADD(DAY,-10,@now), 4, N'FINALIST_POOL', 60, 2, @now, @now, @ownerEmail);
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('B1030600-EEEE-4EEE-8EEE-000000000001', 'B1030300-EEEE-4EEE-8EEE-000000000001', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, @ownerEmail),
  ('B1030600-EEEE-4EEE-8EEE-000000000002', 'B1030300-EEEE-4EEE-8EEE-000000000001', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, @ownerEmail),
  ('B1030600-EEEE-4EEE-8EEE-000000000003', 'B1030300-EEEE-4EEE-8EEE-000000000001', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, @ownerEmail);
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('B1030600-EEEE-4EEE-8EEE-000000000004', 'B1030300-EEEE-4EEE-8EEE-000000000002', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, @ownerEmail),
  ('B1030600-EEEE-4EEE-8EEE-000000000005', 'B1030300-EEEE-4EEE-8EEE-000000000002', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, @ownerEmail),
  ('B1030600-EEEE-4EEE-8EEE-000000000006', 'B1030300-EEEE-4EEE-8EEE-000000000002', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, @ownerEmail);
INSERT INTO event_schedules (id, event_id, type, title, description, start_time, end_time, gate, sort_order, created_at, updated_at) VALUES
  ('B1030800-EEEE-4EEE-8EEE-000000000001', 'B1030100-EEEE-4EEE-8EEE-000000000001', N'WORKSHOP', N'Workshop', NULL, DATEADD(DAY,-38,@now), DATEADD(HOUR,3,DATEADD(DAY,-38,@now)), NULL, 0, @now, @now),
  ('B1030800-EEEE-4EEE-8EEE-000000000002', 'B1030100-EEEE-4EEE-8EEE-000000000001', N'OPENING', N'Opening', N'Kickoff', DATEADD(DAY,-36,@now), DATEADD(HOUR,2,DATEADD(DAY,-36,@now)), NULL, 1, @now, @now),
  ('B1030800-EEEE-4EEE-8EEE-000000000003', 'B1030100-EEEE-4EEE-8EEE-000000000001', N'SCORING', N'Final scoring', NULL, DATEADD(DAY,-13,@now), DATEADD(DAY,-10,@now), NULL, 2, @now, @now);
INSERT INTO prizes (id, created_at, created_by, quantity, [rank], value, event_id, label, track_id) VALUES
  ('B1030700-EEEE-4EEE-8EEE-000000000001', @now, @ownerEmail, 1, N'FIRST', N'10,000,000 VND + Trophy', 'B1030100-EEEE-4EEE-8EEE-000000000001', N'First Prize', NULL),
  ('B1030700-EEEE-4EEE-8EEE-000000000002', @now, @ownerEmail, 1, N'SECOND', N'5,000,000 VND', 'B1030100-EEEE-4EEE-8EEE-000000000001', N'Second Prize', NULL),
  ('B1030700-EEEE-4EEE-8EEE-000000000003', @now, @ownerEmail, 1, N'THIRD', N'2,000,000 VND', 'B1030100-EEEE-4EEE-8EEE-000000000001', N'Third Prize', NULL);
INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), 'B1030100-EEEE-4EEE-8EEE-000000000001', N'APPROVED', u.id, 0, 1
FROM users u WHERE u.email IN (
  N'nguyentruongvinh05@gmail.com', N'vinh.mate1@fpt.edu.vn', N'vinh.mate2@fpt.edu.vn',
  N'vinh.r01@fpt.edu.vn', N'vinh.r02@fpt.edu.vn', N'vinh.r03@fpt.edu.vn', N'vinh.r04@fpt.edu.vn', N'vinh.r05@fpt.edu.vn', N'vinh.r06@fpt.edu.vn',
  N'vinh.r07@fpt.edu.vn', N'vinh.r08@fpt.edu.vn', N'vinh.r09@fpt.edu.vn', N'vinh.r10@fpt.edu.vn', N'vinh.r11@fpt.edu.vn', N'vinh.r12@fpt.edu.vn',
  N'vinh.r13@fpt.edu.vn', N'vinh.r14@fpt.edu.vn', N'vinh.r15@fpt.edu.vn', N'vinh.r16@fpt.edu.vn', N'vinh.r17@fpt.edu.vn', N'vinh.r18@fpt.edu.vn',
  N'vinh.r19@fpt.edu.vn', N'vinh.r20@fpt.edu.vn', N'vinh.r21@fpt.edu.vn', N'vinh.r22@fpt.edu.vn', N'vinh.r23@fpt.edu.vn', N'vinh.r24@fpt.edu.vn',
  N'vinh.r25@fpt.edu.vn', N'vinh.r26@fpt.edu.vn', N'vinh.r27@fpt.edu.vn');
INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id, created_by) VALUES
  (NEWID(), @now, @now, @j1, 'B1030100-EEEE-4EEE-8EEE-000000000001', @ownerEmail),
  (NEWID(), @now, @now, @j2, 'B1030100-EEEE-4EEE-8EEE-000000000001', @ownerEmail);
INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active, created_by) VALUES
  (NEWID(), @now, @now, @j1, 'B1030300-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1, @ownerEmail),
  (NEWID(), @now, @now, @j2, 'B1030300-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1, @ownerEmail),
  (NEWID(), @now, @now, @j1, 'B1030300-EEEE-4EEE-8EEE-000000000002', N'ROUND', 1, @ownerEmail),
  (NEWID(), @now, @now, @j2, 'B1030300-EEEE-4EEE-8EEE-000000000002', N'ROUND', 1, @ownerEmail);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1030200-EEEE-4EEE-8EEE-000000000001', @now, @ownerEmail, 'B1030100-EEEE-4EEE-8EEE-000000000001', @vinhId, N'Team Vinh Bronze', N'CONFIRMED', 'B1030400-EEEE-4EEE-8EEE-000000000001', 'B1030A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'LEADER', @vinhId, 'B1030200-EEEE-4EEE-8EEE-000000000001', 'B1030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'MEMBER', @mate1Id, 'B1030200-EEEE-4EEE-8EEE-000000000001', 'B1030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'MEMBER', @mate2Id, 'B1030200-EEEE-4EEE-8EEE-000000000001', 'B1030100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1030500-EEEE-4EEE-8EEE-000000000001', @now, @ownerEmail, NULL, 'B1030300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @vinhId, 'B1030200-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1030B00-EEEE-4EEE-8EEE-000000000001', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e3-t1', N'https://docs.google.com/presentation/d/vinh-e3-t1', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-26,@now), 1, 'B1030500-EEEE-4EEE-8EEE-000000000001');
UPDATE submissions SET current_version_id='B1030B00-EEEE-4EEE-8EEE-000000000001' WHERE id='B1030500-EEEE-4EEE-8EEE-000000000001';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-000000000001', @now, @ownerEmail, DATEADD(DAY,-22,@now), @j1, 'B1030300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-23,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000001', 95, 'B1030C00-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000002', 95, 'B1030C00-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000003', 90, 'B1030C00-EEEE-4EEE-8EEE-000000000001');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-000000000002', @now, @ownerEmail, DATEADD(DAY,-22,@now), @j2, 'B1030300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-23,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000001', 95, 'B1030C00-EEEE-4EEE-8EEE-000000000002'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000002', 95, 'B1030C00-EEEE-4EEE-8EEE-000000000002'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000003', 90, 'B1030C00-EEEE-4EEE-8EEE-000000000002');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-20,@now), 95.00, 1, 'B1030300-EEEE-4EEE-8EEE-000000000001', 'B1030200-EEEE-4EEE-8EEE-000000000001', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1030200-EEEE-4EEE-8EEE-000000000002', @now, @ownerEmail, 'B1030100-EEEE-4EEE-8EEE-000000000001', @r1, N'Team Rival Beta', N'CONFIRMED', 'B1030400-EEEE-4EEE-8EEE-000000000001', 'B1030A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'LEADER', @r1, 'B1030200-EEEE-4EEE-8EEE-000000000002', 'B1030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'MEMBER', @r2, 'B1030200-EEEE-4EEE-8EEE-000000000002', 'B1030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'MEMBER', @r3, 'B1030200-EEEE-4EEE-8EEE-000000000002', 'B1030100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1030500-EEEE-4EEE-8EEE-000000000002', @now, @ownerEmail, NULL, 'B1030300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r1, 'B1030200-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1030B00-EEEE-4EEE-8EEE-000000000002', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e3-t2', N'https://docs.google.com/presentation/d/vinh-e3-t2', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-26,@now), 1, 'B1030500-EEEE-4EEE-8EEE-000000000002');
UPDATE submissions SET current_version_id='B1030B00-EEEE-4EEE-8EEE-000000000002' WHERE id='B1030500-EEEE-4EEE-8EEE-000000000002';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-00000000000B', @now, @ownerEmail, DATEADD(DAY,-22,@now), @j1, 'B1030300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-23,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000001', 92, 'B1030C00-EEEE-4EEE-8EEE-00000000000B'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000002', 92, 'B1030C00-EEEE-4EEE-8EEE-00000000000B'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000003', 87, 'B1030C00-EEEE-4EEE-8EEE-00000000000B');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-00000000000C', @now, @ownerEmail, DATEADD(DAY,-22,@now), @j2, 'B1030300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-23,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000001', 92, 'B1030C00-EEEE-4EEE-8EEE-00000000000C'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000002', 92, 'B1030C00-EEEE-4EEE-8EEE-00000000000C'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000003', 87, 'B1030C00-EEEE-4EEE-8EEE-00000000000C');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-20,@now), 92.00, 2, 'B1030300-EEEE-4EEE-8EEE-000000000001', 'B1030200-EEEE-4EEE-8EEE-000000000002', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1030200-EEEE-4EEE-8EEE-000000000003', @now, @ownerEmail, 'B1030100-EEEE-4EEE-8EEE-000000000001', @r4, N'Team Rival Gamma', N'CONFIRMED', 'B1030400-EEEE-4EEE-8EEE-000000000001', 'B1030A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'LEADER', @r4, 'B1030200-EEEE-4EEE-8EEE-000000000003', 'B1030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'MEMBER', @r5, 'B1030200-EEEE-4EEE-8EEE-000000000003', 'B1030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'MEMBER', @r6, 'B1030200-EEEE-4EEE-8EEE-000000000003', 'B1030100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1030500-EEEE-4EEE-8EEE-000000000003', @now, @ownerEmail, NULL, 'B1030300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r4, 'B1030200-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1030B00-EEEE-4EEE-8EEE-000000000003', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e3-t3', N'https://docs.google.com/presentation/d/vinh-e3-t3', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-26,@now), 1, 'B1030500-EEEE-4EEE-8EEE-000000000003');
UPDATE submissions SET current_version_id='B1030B00-EEEE-4EEE-8EEE-000000000003' WHERE id='B1030500-EEEE-4EEE-8EEE-000000000003';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-000000000015', @now, @ownerEmail, DATEADD(DAY,-22,@now), @j1, 'B1030300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-23,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000001', 89, 'B1030C00-EEEE-4EEE-8EEE-000000000015'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000002', 89, 'B1030C00-EEEE-4EEE-8EEE-000000000015'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000003', 84, 'B1030C00-EEEE-4EEE-8EEE-000000000015');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-000000000016', @now, @ownerEmail, DATEADD(DAY,-22,@now), @j2, 'B1030300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-23,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000001', 89, 'B1030C00-EEEE-4EEE-8EEE-000000000016'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000002', 89, 'B1030C00-EEEE-4EEE-8EEE-000000000016'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000003', 84, 'B1030C00-EEEE-4EEE-8EEE-000000000016');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-20,@now), 89.00, 3, 'B1030300-EEEE-4EEE-8EEE-000000000001', 'B1030200-EEEE-4EEE-8EEE-000000000003', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1030200-EEEE-4EEE-8EEE-000000000004', @now, @ownerEmail, 'B1030100-EEEE-4EEE-8EEE-000000000001', @r7, N'Team Rival Delta', N'CONFIRMED', 'B1030400-EEEE-4EEE-8EEE-000000000001', 'B1030A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'LEADER', @r7, 'B1030200-EEEE-4EEE-8EEE-000000000004', 'B1030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'MEMBER', @r8, 'B1030200-EEEE-4EEE-8EEE-000000000004', 'B1030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'MEMBER', @r9, 'B1030200-EEEE-4EEE-8EEE-000000000004', 'B1030100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1030500-EEEE-4EEE-8EEE-000000000004', @now, @ownerEmail, NULL, 'B1030300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r7, 'B1030200-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1030B00-EEEE-4EEE-8EEE-000000000004', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e3-t4', N'https://docs.google.com/presentation/d/vinh-e3-t4', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-26,@now), 1, 'B1030500-EEEE-4EEE-8EEE-000000000004');
UPDATE submissions SET current_version_id='B1030B00-EEEE-4EEE-8EEE-000000000004' WHERE id='B1030500-EEEE-4EEE-8EEE-000000000004';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-00000000001F', @now, @ownerEmail, DATEADD(DAY,-22,@now), @j1, 'B1030300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-23,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000001', 86, 'B1030C00-EEEE-4EEE-8EEE-00000000001F'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000002', 86, 'B1030C00-EEEE-4EEE-8EEE-00000000001F'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000003', 81, 'B1030C00-EEEE-4EEE-8EEE-00000000001F');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-000000000020', @now, @ownerEmail, DATEADD(DAY,-22,@now), @j2, 'B1030300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-23,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000001', 86, 'B1030C00-EEEE-4EEE-8EEE-000000000020'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000002', 86, 'B1030C00-EEEE-4EEE-8EEE-000000000020'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000003', 81, 'B1030C00-EEEE-4EEE-8EEE-000000000020');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-20,@now), 86.00, 4, 'B1030300-EEEE-4EEE-8EEE-000000000001', 'B1030200-EEEE-4EEE-8EEE-000000000004', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1030200-EEEE-4EEE-8EEE-000000000005', @now, @ownerEmail, 'B1030100-EEEE-4EEE-8EEE-000000000001', @r10, N'Team Rival Epsilon', N'CONFIRMED', 'B1030400-EEEE-4EEE-8EEE-000000000001', 'B1030A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'LEADER', @r10, 'B1030200-EEEE-4EEE-8EEE-000000000005', 'B1030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'MEMBER', @r11, 'B1030200-EEEE-4EEE-8EEE-000000000005', 'B1030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'MEMBER', @r12, 'B1030200-EEEE-4EEE-8EEE-000000000005', 'B1030100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1030500-EEEE-4EEE-8EEE-000000000005', @now, @ownerEmail, NULL, 'B1030300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r10, 'B1030200-EEEE-4EEE-8EEE-000000000005', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1030B00-EEEE-4EEE-8EEE-000000000005', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e3-t5', N'https://docs.google.com/presentation/d/vinh-e3-t5', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-26,@now), 1, 'B1030500-EEEE-4EEE-8EEE-000000000005');
UPDATE submissions SET current_version_id='B1030B00-EEEE-4EEE-8EEE-000000000005' WHERE id='B1030500-EEEE-4EEE-8EEE-000000000005';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-000000000029', @now, @ownerEmail, DATEADD(DAY,-22,@now), @j1, 'B1030300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-23,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000005', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000001', 83, 'B1030C00-EEEE-4EEE-8EEE-000000000029'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000002', 83, 'B1030C00-EEEE-4EEE-8EEE-000000000029'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000003', 78, 'B1030C00-EEEE-4EEE-8EEE-000000000029');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-00000000002A', @now, @ownerEmail, DATEADD(DAY,-22,@now), @j2, 'B1030300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-23,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000005', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000001', 83, 'B1030C00-EEEE-4EEE-8EEE-00000000002A'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000002', 83, 'B1030C00-EEEE-4EEE-8EEE-00000000002A'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000003', 78, 'B1030C00-EEEE-4EEE-8EEE-00000000002A');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-20,@now), 83.00, 5, 'B1030300-EEEE-4EEE-8EEE-000000000001', 'B1030200-EEEE-4EEE-8EEE-000000000005', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1030200-EEEE-4EEE-8EEE-000000000006', @now, @ownerEmail, 'B1030100-EEEE-4EEE-8EEE-000000000001', @r13, N'Team Rival Zeta', N'CONFIRMED', 'B1030400-EEEE-4EEE-8EEE-000000000001', 'B1030A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'LEADER', @r13, 'B1030200-EEEE-4EEE-8EEE-000000000006', 'B1030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'MEMBER', @r14, 'B1030200-EEEE-4EEE-8EEE-000000000006', 'B1030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'MEMBER', @r15, 'B1030200-EEEE-4EEE-8EEE-000000000006', 'B1030100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1030500-EEEE-4EEE-8EEE-000000000006', @now, @ownerEmail, NULL, 'B1030300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r13, 'B1030200-EEEE-4EEE-8EEE-000000000006', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1030B00-EEEE-4EEE-8EEE-000000000006', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e3-t6', N'https://docs.google.com/presentation/d/vinh-e3-t6', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-26,@now), 1, 'B1030500-EEEE-4EEE-8EEE-000000000006');
UPDATE submissions SET current_version_id='B1030B00-EEEE-4EEE-8EEE-000000000006' WHERE id='B1030500-EEEE-4EEE-8EEE-000000000006';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-000000000033', @now, @ownerEmail, DATEADD(DAY,-22,@now), @j1, 'B1030300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-23,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000006', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000001', 80, 'B1030C00-EEEE-4EEE-8EEE-000000000033'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000002', 80, 'B1030C00-EEEE-4EEE-8EEE-000000000033'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000003', 75, 'B1030C00-EEEE-4EEE-8EEE-000000000033');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-000000000034', @now, @ownerEmail, DATEADD(DAY,-22,@now), @j2, 'B1030300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-23,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000006', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000001', 80, 'B1030C00-EEEE-4EEE-8EEE-000000000034'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000002', 80, 'B1030C00-EEEE-4EEE-8EEE-000000000034'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000003', 75, 'B1030C00-EEEE-4EEE-8EEE-000000000034');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-20,@now), 80.00, 6, 'B1030300-EEEE-4EEE-8EEE-000000000001', 'B1030200-EEEE-4EEE-8EEE-000000000006', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1030200-EEEE-4EEE-8EEE-000000000007', @now, @ownerEmail, 'B1030100-EEEE-4EEE-8EEE-000000000001', @r16, N'Team Rival Eta', N'CONFIRMED', 'B1030400-EEEE-4EEE-8EEE-000000000001', 'B1030A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'LEADER', @r16, 'B1030200-EEEE-4EEE-8EEE-000000000007', 'B1030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'MEMBER', @r17, 'B1030200-EEEE-4EEE-8EEE-000000000007', 'B1030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'MEMBER', @r18, 'B1030200-EEEE-4EEE-8EEE-000000000007', 'B1030100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1030500-EEEE-4EEE-8EEE-000000000007', @now, @ownerEmail, NULL, 'B1030300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r16, 'B1030200-EEEE-4EEE-8EEE-000000000007', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1030B00-EEEE-4EEE-8EEE-000000000007', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e3-t7', N'https://docs.google.com/presentation/d/vinh-e3-t7', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-26,@now), 1, 'B1030500-EEEE-4EEE-8EEE-000000000007');
UPDATE submissions SET current_version_id='B1030B00-EEEE-4EEE-8EEE-000000000007' WHERE id='B1030500-EEEE-4EEE-8EEE-000000000007';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-00000000003D', @now, @ownerEmail, DATEADD(DAY,-22,@now), @j1, 'B1030300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-23,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000007', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000001', 77, 'B1030C00-EEEE-4EEE-8EEE-00000000003D'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000002', 77, 'B1030C00-EEEE-4EEE-8EEE-00000000003D'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000003', 72, 'B1030C00-EEEE-4EEE-8EEE-00000000003D');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-00000000003E', @now, @ownerEmail, DATEADD(DAY,-22,@now), @j2, 'B1030300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-23,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000007', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000001', 77, 'B1030C00-EEEE-4EEE-8EEE-00000000003E'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000002', 77, 'B1030C00-EEEE-4EEE-8EEE-00000000003E'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000003', 72, 'B1030C00-EEEE-4EEE-8EEE-00000000003E');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-20,@now), 77.00, 7, 'B1030300-EEEE-4EEE-8EEE-000000000001', 'B1030200-EEEE-4EEE-8EEE-000000000007', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1030200-EEEE-4EEE-8EEE-000000000008', @now, @ownerEmail, 'B1030100-EEEE-4EEE-8EEE-000000000001', @r19, N'Team Rival Theta', N'CONFIRMED', 'B1030400-EEEE-4EEE-8EEE-000000000001', 'B1030A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'LEADER', @r19, 'B1030200-EEEE-4EEE-8EEE-000000000008', 'B1030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'MEMBER', @r20, 'B1030200-EEEE-4EEE-8EEE-000000000008', 'B1030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'MEMBER', @r21, 'B1030200-EEEE-4EEE-8EEE-000000000008', 'B1030100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1030500-EEEE-4EEE-8EEE-000000000008', @now, @ownerEmail, NULL, 'B1030300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r19, 'B1030200-EEEE-4EEE-8EEE-000000000008', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1030B00-EEEE-4EEE-8EEE-000000000008', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e3-t8', N'https://docs.google.com/presentation/d/vinh-e3-t8', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-26,@now), 1, 'B1030500-EEEE-4EEE-8EEE-000000000008');
UPDATE submissions SET current_version_id='B1030B00-EEEE-4EEE-8EEE-000000000008' WHERE id='B1030500-EEEE-4EEE-8EEE-000000000008';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-000000000047', @now, @ownerEmail, DATEADD(DAY,-22,@now), @j1, 'B1030300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-23,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000008', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000001', 74, 'B1030C00-EEEE-4EEE-8EEE-000000000047'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000002', 74, 'B1030C00-EEEE-4EEE-8EEE-000000000047'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000003', 69, 'B1030C00-EEEE-4EEE-8EEE-000000000047');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-000000000048', @now, @ownerEmail, DATEADD(DAY,-22,@now), @j2, 'B1030300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-23,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000008', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000001', 74, 'B1030C00-EEEE-4EEE-8EEE-000000000048'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000002', 74, 'B1030C00-EEEE-4EEE-8EEE-000000000048'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000003', 69, 'B1030C00-EEEE-4EEE-8EEE-000000000048');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-20,@now), 74.00, 8, 'B1030300-EEEE-4EEE-8EEE-000000000001', 'B1030200-EEEE-4EEE-8EEE-000000000008', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1030200-EEEE-4EEE-8EEE-000000000009', @now, @ownerEmail, 'B1030100-EEEE-4EEE-8EEE-000000000001', @r22, N'Team Rival Iota', N'CONFIRMED', 'B1030400-EEEE-4EEE-8EEE-000000000001', 'B1030A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'LEADER', @r22, 'B1030200-EEEE-4EEE-8EEE-000000000009', 'B1030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'MEMBER', @r23, 'B1030200-EEEE-4EEE-8EEE-000000000009', 'B1030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'MEMBER', @r24, 'B1030200-EEEE-4EEE-8EEE-000000000009', 'B1030100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1030500-EEEE-4EEE-8EEE-000000000009', @now, @ownerEmail, NULL, 'B1030300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r22, 'B1030200-EEEE-4EEE-8EEE-000000000009', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1030B00-EEEE-4EEE-8EEE-000000000009', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e3-t9', N'https://docs.google.com/presentation/d/vinh-e3-t9', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-26,@now), 1, 'B1030500-EEEE-4EEE-8EEE-000000000009');
UPDATE submissions SET current_version_id='B1030B00-EEEE-4EEE-8EEE-000000000009' WHERE id='B1030500-EEEE-4EEE-8EEE-000000000009';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-000000000051', @now, @ownerEmail, DATEADD(DAY,-22,@now), @j1, 'B1030300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-23,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000009', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000001', 71, 'B1030C00-EEEE-4EEE-8EEE-000000000051'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000002', 71, 'B1030C00-EEEE-4EEE-8EEE-000000000051'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000003', 66, 'B1030C00-EEEE-4EEE-8EEE-000000000051');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-000000000052', @now, @ownerEmail, DATEADD(DAY,-22,@now), @j2, 'B1030300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-23,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000009', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000001', 71, 'B1030C00-EEEE-4EEE-8EEE-000000000052'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000002', 71, 'B1030C00-EEEE-4EEE-8EEE-000000000052'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000003', 66, 'B1030C00-EEEE-4EEE-8EEE-000000000052');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-20,@now), 71.00, 9, 'B1030300-EEEE-4EEE-8EEE-000000000001', 'B1030200-EEEE-4EEE-8EEE-000000000009', 1, 0, @now);
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('B1030200-EEEE-4EEE-8EEE-00000000000A', @now, @ownerEmail, 'B1030100-EEEE-4EEE-8EEE-000000000001', @r25, N'Team Rival Kappa', N'CONFIRMED', 'B1030400-EEEE-4EEE-8EEE-000000000001', 'B1030A00-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'LEADER', @r25, 'B1030200-EEEE-4EEE-8EEE-00000000000A', 'B1030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'MEMBER', @r26, 'B1030200-EEEE-4EEE-8EEE-00000000000A', 'B1030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @ownerEmail, DATEADD(DAY,-45,@now), N'MEMBER', @r27, 'B1030200-EEEE-4EEE-8EEE-00000000000A', 'B1030100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1030500-EEEE-4EEE-8EEE-00000000000A', @now, @ownerEmail, NULL, 'B1030300-EEEE-4EEE-8EEE-000000000001', N'SCORED', @r25, 'B1030200-EEEE-4EEE-8EEE-00000000000A', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1030B00-EEEE-4EEE-8EEE-00000000000A', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e3-t10', N'https://docs.google.com/presentation/d/vinh-e3-t10', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-26,@now), 1, 'B1030500-EEEE-4EEE-8EEE-00000000000A');
UPDATE submissions SET current_version_id='B1030B00-EEEE-4EEE-8EEE-00000000000A' WHERE id='B1030500-EEEE-4EEE-8EEE-00000000000A';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-00000000005B', @now, @ownerEmail, DATEADD(DAY,-22,@now), @j1, 'B1030300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-23,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-00000000000A', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000001', 68, 'B1030C00-EEEE-4EEE-8EEE-00000000005B'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000002', 68, 'B1030C00-EEEE-4EEE-8EEE-00000000005B'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000003', 63, 'B1030C00-EEEE-4EEE-8EEE-00000000005B');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-00000000005C', @now, @ownerEmail, DATEADD(DAY,-22,@now), @j2, 'B1030300-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-23,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-00000000000A', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000001', 68, 'B1030C00-EEEE-4EEE-8EEE-00000000005C'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000002', 68, 'B1030C00-EEEE-4EEE-8EEE-00000000005C'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000003', 63, 'B1030C00-EEEE-4EEE-8EEE-00000000005C');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-20,@now), 68.00, 10, 'B1030300-EEEE-4EEE-8EEE-000000000001', 'B1030200-EEEE-4EEE-8EEE-00000000000A', 1, 0, @now);
INSERT INTO finalist_selections (id, event_id, team_id, track_id, preliminary_rank, selected_reason, selected_at, created_at, updated_at, selection_method, eligible) VALUES
  ('B1030D00-EEEE-4EEE-8EEE-000000000001', 'B1030100-EEEE-4EEE-8EEE-000000000001', 'B1030200-EEEE-4EEE-8EEE-000000000001', 'B1030400-EEEE-4EEE-8EEE-000000000001', 1, N'Top 1', DATEADD(DAY,-19,@now), @now, @now, N'AUTO', 1),
  ('B1030D00-EEEE-4EEE-8EEE-000000000002', 'B1030100-EEEE-4EEE-8EEE-000000000001', 'B1030200-EEEE-4EEE-8EEE-000000000002', 'B1030400-EEEE-4EEE-8EEE-000000000001', 2, N'Top 2', DATEADD(DAY,-19,@now), @now, @now, N'AUTO', 1),
  ('B1030D00-EEEE-4EEE-8EEE-000000000003', 'B1030100-EEEE-4EEE-8EEE-000000000001', 'B1030200-EEEE-4EEE-8EEE-000000000003', 'B1030400-EEEE-4EEE-8EEE-000000000001', 3, N'Top 3', DATEADD(DAY,-19,@now), @now, @now, N'AUTO', 1),
  ('B1030D00-EEEE-4EEE-8EEE-000000000004', 'B1030100-EEEE-4EEE-8EEE-000000000001', 'B1030200-EEEE-4EEE-8EEE-000000000004', 'B1030400-EEEE-4EEE-8EEE-000000000001', 4, N'Top 4', DATEADD(DAY,-19,@now), @now, @now, N'AUTO', 1);
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1030500-EEEE-4EEE-8EEE-000000000014', @now, @ownerEmail, NULL, 'B1030300-EEEE-4EEE-8EEE-000000000002', N'SCORED', @vinhId, 'B1030200-EEEE-4EEE-8EEE-000000000001', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1030B00-EEEE-4EEE-8EEE-000000000014', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e3-final-t1', N'https://docs.google.com/presentation/d/vinh-e3-final-t1', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-16,@now), 1, 'B1030500-EEEE-4EEE-8EEE-000000000014');
UPDATE submissions SET current_version_id='B1030B00-EEEE-4EEE-8EEE-000000000014' WHERE id='B1030500-EEEE-4EEE-8EEE-000000000014';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-000000000065', @now, @ownerEmail, DATEADD(DAY,-12,@now), @j1, 'B1030300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-13,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000014', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000004', 92, 'B1030C00-EEEE-4EEE-8EEE-000000000065'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000005', 92, 'B1030C00-EEEE-4EEE-8EEE-000000000065'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000006', 88, 'B1030C00-EEEE-4EEE-8EEE-000000000065');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-000000000066', @now, @ownerEmail, DATEADD(DAY,-12,@now), @j2, 'B1030300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-13,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000014', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000004', 92, 'B1030C00-EEEE-4EEE-8EEE-000000000066'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000005', 92, 'B1030C00-EEEE-4EEE-8EEE-000000000066'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000006', 88, 'B1030C00-EEEE-4EEE-8EEE-000000000066');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-10,@now), 92.00, 1, 'B1030300-EEEE-4EEE-8EEE-000000000002', 'B1030200-EEEE-4EEE-8EEE-000000000001', 1, 0, @now);
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1030500-EEEE-4EEE-8EEE-000000000015', @now, @ownerEmail, NULL, 'B1030300-EEEE-4EEE-8EEE-000000000002', N'SCORED', @r1, 'B1030200-EEEE-4EEE-8EEE-000000000002', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1030B00-EEEE-4EEE-8EEE-000000000015', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e3-final-t2', N'https://docs.google.com/presentation/d/vinh-e3-final-t2', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-16,@now), 1, 'B1030500-EEEE-4EEE-8EEE-000000000015');
UPDATE submissions SET current_version_id='B1030B00-EEEE-4EEE-8EEE-000000000015' WHERE id='B1030500-EEEE-4EEE-8EEE-000000000015';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-00000000006F', @now, @ownerEmail, DATEADD(DAY,-12,@now), @j1, 'B1030300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-13,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000015', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000004', 86, 'B1030C00-EEEE-4EEE-8EEE-00000000006F'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000005', 86, 'B1030C00-EEEE-4EEE-8EEE-00000000006F'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000006', 82, 'B1030C00-EEEE-4EEE-8EEE-00000000006F');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-000000000070', @now, @ownerEmail, DATEADD(DAY,-12,@now), @j2, 'B1030300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-13,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000015', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000004', 86, 'B1030C00-EEEE-4EEE-8EEE-000000000070'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000005', 86, 'B1030C00-EEEE-4EEE-8EEE-000000000070'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000006', 82, 'B1030C00-EEEE-4EEE-8EEE-000000000070');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-10,@now), 86.00, 2, 'B1030300-EEEE-4EEE-8EEE-000000000002', 'B1030200-EEEE-4EEE-8EEE-000000000002', 1, 0, @now);
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1030500-EEEE-4EEE-8EEE-000000000016', @now, @ownerEmail, NULL, 'B1030300-EEEE-4EEE-8EEE-000000000002', N'SCORED', @r4, 'B1030200-EEEE-4EEE-8EEE-000000000003', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1030B00-EEEE-4EEE-8EEE-000000000016', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e3-final-t3', N'https://docs.google.com/presentation/d/vinh-e3-final-t3', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-16,@now), 1, 'B1030500-EEEE-4EEE-8EEE-000000000016');
UPDATE submissions SET current_version_id='B1030B00-EEEE-4EEE-8EEE-000000000016' WHERE id='B1030500-EEEE-4EEE-8EEE-000000000016';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-000000000079', @now, @ownerEmail, DATEADD(DAY,-12,@now), @j1, 'B1030300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-13,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000016', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000004', 80, 'B1030C00-EEEE-4EEE-8EEE-000000000079'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000005', 80, 'B1030C00-EEEE-4EEE-8EEE-000000000079'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000006', 76, 'B1030C00-EEEE-4EEE-8EEE-000000000079');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-00000000007A', @now, @ownerEmail, DATEADD(DAY,-12,@now), @j2, 'B1030300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-13,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000016', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000004', 80, 'B1030C00-EEEE-4EEE-8EEE-00000000007A'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000005', 80, 'B1030C00-EEEE-4EEE-8EEE-00000000007A'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000006', 76, 'B1030C00-EEEE-4EEE-8EEE-00000000007A');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-10,@now), 80.00, 3, 'B1030300-EEEE-4EEE-8EEE-000000000002', 'B1030200-EEEE-4EEE-8EEE-000000000003', 1, 0, @now);
INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)
VALUES ('B1030500-EEEE-4EEE-8EEE-000000000017', @now, @ownerEmail, NULL, 'B1030300-EEEE-4EEE-8EEE-000000000002', N'SCORED', @r7, 'B1030200-EEEE-4EEE-8EEE-000000000004', 0);
INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)
VALUES ('B1030B00-EEEE-4EEE-8EEE-000000000017', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e3-final-t4', N'https://docs.google.com/presentation/d/vinh-e3-final-t4', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-16,@now), 1, 'B1030500-EEEE-4EEE-8EEE-000000000017');
UPDATE submissions SET current_version_id='B1030B00-EEEE-4EEE-8EEE-000000000017' WHERE id='B1030500-EEEE-4EEE-8EEE-000000000017';
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-000000000083', @now, @ownerEmail, DATEADD(DAY,-12,@now), @j1, 'B1030300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-13,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000017', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000004', 74, 'B1030C00-EEEE-4EEE-8EEE-000000000083'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000005', 74, 'B1030C00-EEEE-4EEE-8EEE-000000000083'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000006', 70, 'B1030C00-EEEE-4EEE-8EEE-000000000083');
INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)
VALUES ('B1030C00-EEEE-4EEE-8EEE-000000000084', @now, @ownerEmail, DATEADD(DAY,-12,@now), @j2, 'B1030300-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-13,@now), N'COMPLETED', 'B1030500-EEEE-4EEE-8EEE-000000000017', 0);
INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000004', 74, 'B1030C00-EEEE-4EEE-8EEE-000000000084'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000005', 74, 'B1030C00-EEEE-4EEE-8EEE-000000000084'),
  (NEWID(), @now, @ownerEmail, 'B1030600-EEEE-4EEE-8EEE-000000000006', 70, 'B1030C00-EEEE-4EEE-8EEE-000000000084');
INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)
VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,-10,@now), 74.00, 4, 'B1030300-EEEE-4EEE-8EEE-000000000002', 'B1030200-EEEE-4EEE-8EEE-000000000004', 1, 0, @now);
INSERT INTO published_results (id, created_at, dispute_deadline, published_at, published_by, round_id) VALUES
  ('B1030E00-EEEE-4EEE-8EEE-000000000001', @now, DATEADD(DAY,2,DATEADD(DAY,-20,@now)), DATEADD(DAY,-20,@now), @coordId, 'B1030300-EEEE-4EEE-8EEE-000000000001'),
  ('B1030E00-EEEE-4EEE-8EEE-000000000002', @now, DATEADD(DAY,2,DATEADD(DAY,-10,@now)), DATEADD(DAY,-10,@now), @coordId, 'B1030300-EEEE-4EEE-8EEE-000000000002');
INSERT INTO team_awards (id, event_id, team_id, prize_id, awarded_at, created_at, updated_at, created_by) VALUES
  ('B1030F00-EEEE-4EEE-8EEE-000000000001', 'B1030100-EEEE-4EEE-8EEE-000000000001', 'B1030200-EEEE-4EEE-8EEE-000000000001', 'B1030700-EEEE-4EEE-8EEE-000000000003', DATEADD(DAY,-10,@now), @now, @now, @ownerEmail),
  ('B1030F00-EEEE-4EEE-8EEE-000000000002', 'B1030100-EEEE-4EEE-8EEE-000000000001', 'B1030200-EEEE-4EEE-8EEE-000000000002', 'B1030700-EEEE-4EEE-8EEE-000000000001', DATEADD(DAY,-10,@now), @now, @now, @ownerEmail),
  ('B1030F00-EEEE-4EEE-8EEE-000000000003', 'B1030100-EEEE-4EEE-8EEE-000000000001', 'B1030200-EEEE-4EEE-8EEE-000000000003', 'B1030700-EEEE-4EEE-8EEE-000000000002', DATEADD(DAY,-10,@now), @now, @now, @ownerEmail);
INSERT INTO participation_certificates (id, created_at, created_by, event_id, user_id, team_id, issued_at)
SELECT NEWID(), @now, @ownerEmail, 'B1030100-EEEE-4EEE-8EEE-000000000001', tm.user_id, tm.team_id, DATEADD(DAY,-10,@now)
FROM team_members tm WHERE tm.event_id = 'B1030100-EEEE-4EEE-8EEE-000000000001';
INSERT INTO participant_feedbacks (id, created_at, created_by, comment, event_id, overall_rating, submitted_at, team_id, user_id)
VALUES ('B1031000-EEEE-4EEE-8EEE-000000000001', @now, @ownerEmail, N'Great event — clear rounds and fair judging.', 'B1030100-EEEE-4EEE-8EEE-000000000001', 5, DATEADD(DAY,-9,@now), 'B1030200-EEEE-4EEE-8EEE-000000000001', @vinhId);

COMMIT TRANSACTION;
PRINT 'seed_vinh_achievements.sql complete (full COMPLETED graph)';
PRINT 'Login: nguyentruongvinh05@gmail.com / Demo@123456';
PRINT 'Awards: Showcase1 FIRST, Showcase2 SECOND, Showcase3 THIRD + certificates';
