-- Assignment-stage demo: CLOSED_REGISTRATION + 10 CONFIRMED teams (no track/judge/mentor yet).
-- Password for ALL accounts: 12345678
-- Regenerate: node _gen_seed_assignment_demo.mjs
-- Run: sqlcmd -S localhost,1433 -U sa -P <pwd> -C -d SEAL -f 65001 -I -i seed_assignment_demo.sql

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @now DATETIME2 = SYSDATETIME();
DECLARE @pwd NVARCHAR(255) = N'$2a$10$3Ee4YwgqIw0MnDJeYtNDOOccbcr7G/t0mhmapneTSjuZTh9qa6AMq';
DECLARE @templateId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM scoring_templates WHERE name = N'Standard Hackathon' ORDER BY created_at);
IF @templateId IS NULL SET @templateId = (SELECT TOP 1 id FROM scoring_templates ORDER BY created_at);
IF @templateId IS NULL BEGIN RAISERROR('No scoring template. Start backend with profile dev first.', 16, 1); ROLLBACK TRANSACTION; RETURN; END

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.coord@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Demo Coordinator', user_type=N'EVENT_COORDINATOR', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.coord@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D000000-EEEE-4EEE-8EEE-000000000001',N'assign.coord@fpt.edu.vn',@pwd,N'Assign Demo Coordinator',NULL,NULL,NULL,N'FPT University',N'EVENT_COORDINATOR',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.judge1@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Judge One', user_type=N'LECTURER', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.judge1@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D000000-EEEE-4EEE-8EEE-000000000002',N'assign.judge1@fpt.edu.vn',@pwd,N'Assign Judge One',NULL,NULL,NULL,N'FPT University',N'LECTURER',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.judge2@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Judge Two', user_type=N'LECTURER', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.judge2@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D000000-EEEE-4EEE-8EEE-000000000003',N'assign.judge2@fpt.edu.vn',@pwd,N'Assign Judge Two',NULL,NULL,NULL,N'FPT University',N'LECTURER',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.judge3@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Judge Three', user_type=N'LECTURER', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.judge3@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D000000-EEEE-4EEE-8EEE-000000000004',N'assign.judge3@fpt.edu.vn',@pwd,N'Assign Judge Three',NULL,NULL,NULL,N'FPT University',N'LECTURER',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.mentor1@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Mentor One', user_type=N'LECTURER', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.mentor1@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D000000-EEEE-4EEE-8EEE-000000000005',N'assign.mentor1@fpt.edu.vn',@pwd,N'Assign Mentor One',NULL,NULL,NULL,N'FPT University',N'LECTURER',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.mentor2@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Mentor Two', user_type=N'LECTURER', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.mentor2@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D000000-EEEE-4EEE-8EEE-000000000006',N'assign.mentor2@fpt.edu.vn',@pwd,N'Assign Mentor Two',NULL,NULL,NULL,N'FPT University',N'LECTURER',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.mentor3@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Mentor Three', user_type=N'LECTURER', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.mentor3@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D000000-EEEE-4EEE-8EEE-000000000007',N'assign.mentor3@fpt.edu.vn',@pwd,N'Assign Mentor Three',NULL,NULL,NULL,N'FPT University',N'LECTURER',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s01@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 01', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29201', university_name=N'FPT University',
    semester=4, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s01@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-000000000001',N'assign.s01@fpt.edu.vn',@pwd,N'Assign Student 01',NULL,NULL,N'SE29201',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,4,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s02@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 02', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29202', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s02@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-000000000002',N'assign.s02@fpt.edu.vn',@pwd,N'Assign Student 02',NULL,NULL,N'SE29202',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s03@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 03', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29203', university_name=N'FPT University',
    semester=6, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s03@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-000000000003',N'assign.s03@fpt.edu.vn',@pwd,N'Assign Student 03',NULL,NULL,N'SE29203',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,6,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s04@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 04', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29204', university_name=N'FPT University',
    semester=7, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s04@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-000000000004',N'assign.s04@fpt.edu.vn',@pwd,N'Assign Student 04',NULL,NULL,N'SE29204',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,7,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s05@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 05', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29205', university_name=N'FPT University',
    semester=8, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s05@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-000000000005',N'assign.s05@fpt.edu.vn',@pwd,N'Assign Student 05',NULL,NULL,N'SE29205',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,8,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s06@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 06', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29206', university_name=N'FPT University',
    semester=4, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s06@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-000000000006',N'assign.s06@fpt.edu.vn',@pwd,N'Assign Student 06',NULL,NULL,N'SE29206',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,4,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s07@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 07', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29207', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s07@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-000000000007',N'assign.s07@fpt.edu.vn',@pwd,N'Assign Student 07',NULL,NULL,N'SE29207',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s08@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 08', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29208', university_name=N'FPT University',
    semester=6, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s08@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-000000000008',N'assign.s08@fpt.edu.vn',@pwd,N'Assign Student 08',NULL,NULL,N'SE29208',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,6,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s09@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 09', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29209', university_name=N'FPT University',
    semester=7, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s09@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-000000000009',N'assign.s09@fpt.edu.vn',@pwd,N'Assign Student 09',NULL,NULL,N'SE29209',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,7,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s10@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 10', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29210', university_name=N'FPT University',
    semester=8, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s10@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-00000000000A',N'assign.s10@fpt.edu.vn',@pwd,N'Assign Student 10',NULL,NULL,N'SE29210',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,8,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s11@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 11', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29211', university_name=N'FPT University',
    semester=4, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s11@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-00000000000B',N'assign.s11@fpt.edu.vn',@pwd,N'Assign Student 11',NULL,NULL,N'SE29211',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,4,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s12@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 12', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29212', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s12@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-00000000000C',N'assign.s12@fpt.edu.vn',@pwd,N'Assign Student 12',NULL,NULL,N'SE29212',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s13@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 13', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29213', university_name=N'FPT University',
    semester=6, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s13@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-00000000000D',N'assign.s13@fpt.edu.vn',@pwd,N'Assign Student 13',NULL,NULL,N'SE29213',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,6,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s14@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 14', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29214', university_name=N'FPT University',
    semester=7, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s14@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-00000000000E',N'assign.s14@fpt.edu.vn',@pwd,N'Assign Student 14',NULL,NULL,N'SE29214',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,7,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s15@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 15', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29215', university_name=N'FPT University',
    semester=8, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s15@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-00000000000F',N'assign.s15@fpt.edu.vn',@pwd,N'Assign Student 15',NULL,NULL,N'SE29215',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,8,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s16@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 16', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29216', university_name=N'FPT University',
    semester=4, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s16@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-000000000010',N'assign.s16@fpt.edu.vn',@pwd,N'Assign Student 16',NULL,NULL,N'SE29216',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,4,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s17@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 17', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29217', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s17@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-000000000011',N'assign.s17@fpt.edu.vn',@pwd,N'Assign Student 17',NULL,NULL,N'SE29217',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s18@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 18', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29218', university_name=N'FPT University',
    semester=6, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s18@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-000000000012',N'assign.s18@fpt.edu.vn',@pwd,N'Assign Student 18',NULL,NULL,N'SE29218',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,6,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s19@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 19', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29219', university_name=N'FPT University',
    semester=7, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s19@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-000000000013',N'assign.s19@fpt.edu.vn',@pwd,N'Assign Student 19',NULL,NULL,N'SE29219',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,7,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s20@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 20', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29220', university_name=N'FPT University',
    semester=8, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s20@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-000000000014',N'assign.s20@fpt.edu.vn',@pwd,N'Assign Student 20',NULL,NULL,N'SE29220',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,8,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s21@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 21', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29221', university_name=N'FPT University',
    semester=4, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s21@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-000000000015',N'assign.s21@fpt.edu.vn',@pwd,N'Assign Student 21',NULL,NULL,N'SE29221',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,4,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s22@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 22', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29222', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s22@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-000000000016',N'assign.s22@fpt.edu.vn',@pwd,N'Assign Student 22',NULL,NULL,N'SE29222',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s23@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 23', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29223', university_name=N'FPT University',
    semester=6, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s23@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-000000000017',N'assign.s23@fpt.edu.vn',@pwd,N'Assign Student 23',NULL,NULL,N'SE29223',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,6,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s24@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 24', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29224', university_name=N'FPT University',
    semester=7, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s24@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-000000000018',N'assign.s24@fpt.edu.vn',@pwd,N'Assign Student 24',NULL,NULL,N'SE29224',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,7,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s25@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 25', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29225', university_name=N'FPT University',
    semester=8, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s25@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-000000000019',N'assign.s25@fpt.edu.vn',@pwd,N'Assign Student 25',NULL,NULL,N'SE29225',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,8,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s26@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 26', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29226', university_name=N'FPT University',
    semester=4, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s26@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-00000000001A',N'assign.s26@fpt.edu.vn',@pwd,N'Assign Student 26',NULL,NULL,N'SE29226',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,4,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s27@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 27', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29227', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s27@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-00000000001B',N'assign.s27@fpt.edu.vn',@pwd,N'Assign Student 27',NULL,NULL,N'SE29227',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s28@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 28', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29228', university_name=N'FPT University',
    semester=6, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s28@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-00000000001C',N'assign.s28@fpt.edu.vn',@pwd,N'Assign Student 28',NULL,NULL,N'SE29228',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,6,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s29@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 29', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29229', university_name=N'FPT University',
    semester=7, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s29@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-00000000001D',N'assign.s29@fpt.edu.vn',@pwd,N'Assign Student 29',NULL,NULL,N'SE29229',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,7,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'assign.s30@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Assign Student 30', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29230', university_name=N'FPT University',
    semester=8, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'assign.s30@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES ('0D010000-EEEE-4EEE-8EEE-00000000001E',N'assign.s30@fpt.edu.vn',@pwd,N'Assign Student 30',NULL,NULL,N'SE29230',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,8,N'ENROLLED',0,@now,@now);

DECLARE @coordId UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.coord@fpt.edu.vn');
DECLARE @s01 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s01@fpt.edu.vn');
DECLARE @s02 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s02@fpt.edu.vn');
DECLARE @s03 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s03@fpt.edu.vn');
DECLARE @s04 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s04@fpt.edu.vn');
DECLARE @s05 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s05@fpt.edu.vn');
DECLARE @s06 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s06@fpt.edu.vn');
DECLARE @s07 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s07@fpt.edu.vn');
DECLARE @s08 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s08@fpt.edu.vn');
DECLARE @s09 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s09@fpt.edu.vn');
DECLARE @s10 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s10@fpt.edu.vn');
DECLARE @s11 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s11@fpt.edu.vn');
DECLARE @s12 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s12@fpt.edu.vn');
DECLARE @s13 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s13@fpt.edu.vn');
DECLARE @s14 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s14@fpt.edu.vn');
DECLARE @s15 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s15@fpt.edu.vn');
DECLARE @s16 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s16@fpt.edu.vn');
DECLARE @s17 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s17@fpt.edu.vn');
DECLARE @s18 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s18@fpt.edu.vn');
DECLARE @s19 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s19@fpt.edu.vn');
DECLARE @s20 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s20@fpt.edu.vn');
DECLARE @s21 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s21@fpt.edu.vn');
DECLARE @s22 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s22@fpt.edu.vn');
DECLARE @s23 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s23@fpt.edu.vn');
DECLARE @s24 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s24@fpt.edu.vn');
DECLARE @s25 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s25@fpt.edu.vn');
DECLARE @s26 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s26@fpt.edu.vn');
DECLARE @s27 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s27@fpt.edu.vn');
DECLARE @s28 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s28@fpt.edu.vn');
DECLARE @s29 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s29@fpt.edu.vn');
DECLARE @s30 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s30@fpt.edu.vn');

DECLARE @wipe TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @wipe VALUES ('0D010000-EEEE-4EEE-8EEE-000000000001');
DECLARE @wTeams TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @wTeams SELECT id FROM teams WHERE event_id IN (SELECT id FROM @wipe);
DECLARE @wRounds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @wRounds SELECT id FROM rounds WHERE event_id IN (SELECT id FROM @wipe);
DECLARE @wSubs TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @wSubs SELECT id FROM submissions WHERE team_id IN (SELECT id FROM @wTeams);
DELETE jc FROM judge_comments jc INNER JOIN judge_scores js ON js.id=jc.judge_score_id WHERE js.submission_id IN (SELECT id FROM @wSubs);
DELETE jsd FROM judge_score_details jsd INNER JOIN judge_scores js ON js.id=jsd.judge_score_id WHERE js.submission_id IN (SELECT id FROM @wSubs);
DELETE FROM judge_scores WHERE submission_id IN (SELECT id FROM @wSubs);
DELETE sa FROM submission_attachments sa INNER JOIN submission_versions sv ON sv.id=sa.submission_version_id WHERE sv.submission_id IN (SELECT id FROM @wSubs);
DELETE FROM submission_versions WHERE submission_id IN (SELECT id FROM @wSubs);
DELETE FROM submissions WHERE id IN (SELECT id FROM @wSubs);
IF OBJECT_ID(N'mentor_chat_messages', N'U') IS NOT NULL DELETE FROM mentor_chat_messages WHERE team_id IN (SELECT id FROM @wTeams);
IF OBJECT_ID(N'mentor_feedbacks', N'U') IS NOT NULL DELETE FROM mentor_feedbacks WHERE team_id IN (SELECT id FROM @wTeams);
DELETE FROM mentor_teams WHERE team_id IN (SELECT id FROM @wTeams);
DELETE FROM invitations WHERE team_id IN (SELECT id FROM @wTeams);
DELETE FROM mentor_invitations WHERE team_id IN (SELECT id FROM @wTeams);
DELETE FROM team_join_requests WHERE team_id IN (SELECT id FROM @wTeams);
DELETE FROM team_leave_requests WHERE team_id IN (SELECT id FROM @wTeams);
DELETE FROM team_needed_roles WHERE team_id IN (SELECT id FROM @wTeams);
IF OBJECT_ID(N'team_progress_alerts', N'U') IS NOT NULL DELETE FROM team_progress_alerts WHERE team_id IN (SELECT id FROM @wTeams);
DELETE FROM team_members WHERE team_id IN (SELECT id FROM @wTeams);
DELETE FROM teams WHERE id IN (SELECT id FROM @wTeams);
DELETE FROM event_enrollments WHERE event_id IN (SELECT id FROM @wipe);
DELETE FROM event_magic_tokens WHERE event_id IN (SELECT id FROM @wipe);
DELETE FROM participant_feedbacks WHERE event_id IN (SELECT id FROM @wipe);
DELETE FROM participation_certificates WHERE event_id IN (SELECT id FROM @wipe);
DELETE FROM score_review_requests WHERE event_id IN (SELECT id FROM @wipe);
DELETE FROM team_awards WHERE event_id IN (SELECT id FROM @wipe);
DELETE FROM finalist_contested_slot_teams WHERE contested_slot_id IN (SELECT id FROM finalist_contested_slots WHERE event_id IN (SELECT id FROM @wipe));
DELETE FROM finalist_contested_slots WHERE event_id IN (SELECT id FROM @wipe);
DELETE FROM finalist_selections WHERE event_id IN (SELECT id FROM @wipe);
DELETE FROM track_draw_sessions WHERE event_id IN (SELECT id FROM @wipe);
IF OBJECT_ID(N'disputes', N'U') IS NOT NULL DELETE FROM disputes WHERE round_id IN (SELECT id FROM @wRounds);
IF OBJECT_ID(N'advancements', N'U') IS NOT NULL DELETE FROM advancements WHERE round_id IN (SELECT id FROM @wRounds);
DELETE FROM rankings WHERE round_id IN (SELECT id FROM @wRounds);
DELETE FROM published_results WHERE round_id IN (SELECT id FROM @wRounds);
DELETE FROM judge_assignments WHERE round_id IN (SELECT id FROM @wRounds);
DELETE FROM criteria WHERE round_id IN (SELECT id FROM @wRounds);
DELETE FROM rounds WHERE id IN (SELECT id FROM @wRounds);
DELETE FROM event_judge_assignments WHERE event_id IN (SELECT id FROM @wipe);
DELETE FROM event_mentor_assignments WHERE event_id IN (SELECT id FROM @wipe);
DELETE FROM mentor_assignments WHERE event_id IN (SELECT id FROM @wipe);
DELETE FROM event_tiebreaker_criteria WHERE event_id IN (SELECT id FROM @wipe);
DELETE FROM honored_guests WHERE event_id IN (SELECT id FROM @wipe);
DELETE FROM prizes WHERE event_id IN (SELECT id FROM @wipe);
DELETE FROM event_schedules WHERE event_id IN (SELECT id FROM @wipe);
DELETE FROM allowed_email_domains WHERE event_id IN (SELECT id FROM @wipe);
IF OBJECT_ID(N'competition_groups', N'U') IS NOT NULL
  DELETE cg FROM competition_groups cg INNER JOIN tracks tr ON tr.id = cg.track_id WHERE tr.event_id IN (SELECT id FROM @wipe);
DELETE FROM tracks WHERE event_id IN (SELECT id FROM @wipe);
DELETE FROM hackathon_events WHERE id IN (SELECT id FROM @wipe);

-- Event: registration closed, competition not started yet
INSERT INTO hackathon_events (
  id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at
) VALUES (
  '0D010000-EEEE-4EEE-8EEE-000000000001',
  N'Assignment Demo - Closed Registration 10 Teams',
  N'Summer', 2026,
  CAST(DATEADD(DAY, 7, @now) AS DATE), CAST(DATEADD(DAY, 8, @now) AS DATE),
  CAST(DATEADD(DAY, -30, @now) AS DATE), CAST(DATEADD(DAY, -1, @now) AS DATE),
  N'Demo event for Assignment QA: registration closed with 10 confirmed teams. Tracks/judges/mentors are intentionally unassigned so coordinators can test the full assignment flow.',
  N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
  3, 5, 4, 8,
  @templateId, N'CLOSED_REGISTRATION', 0, @coordId, N'assign.coord@fpt.edu.vn', @now, @now
);

INSERT INTO tracks (id, event_id, name, description, max_teams, status, created_at, updated_at) VALUES
  ('0D040000-EEEE-4EEE-8EEE-000000000001', '0D010000-EEEE-4EEE-8EEE-000000000001', N'Grounded Retrieval', N'SEAL track: Grounded Retrieval', 8, N'OPEN', @now, @now),
  ('0D040000-EEEE-4EEE-8EEE-000000000002', '0D010000-EEEE-4EEE-8EEE-000000000001', N'Agent Orchestration', N'SEAL track: Agent Orchestration', 8, N'OPEN', @now, @now),
  ('0D040000-EEEE-4EEE-8EEE-000000000003', '0D010000-EEEE-4EEE-8EEE-000000000001', N'Enterprise Copilot', N'SEAL track: Enterprise Copilot', 8, N'OPEN', @now, @now);

DECLARE @compDt DATETIME2 = DATEADD(HOUR, 7, CAST(CAST(DATEADD(DAY, 7, @now) AS DATE) AS DATETIME2));
DECLARE @prelimSub DATETIME2 = DATEADD(HOUR, 14, @compDt);
DECLARE @prelimScore DATETIME2 = DATEADD(MINUTE, 15 * 60 + 30, @compDt);
DECLARE @finalEnd DATETIME2 = DATEADD(HOUR, 17, @compDt);
INSERT INTO rounds (
  id, event_id, round_number, name, round_type,
  start_date, end_date, slide_deadline, submission_deadline, scoring_deadline,
  advancement_cutoff, advancement_rule, round_weight, created_at, updated_at
) VALUES
  ('0D030000-EEEE-4EEE-8EEE-000000000001', '0D010000-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', N'PRELIMINARY',
   @compDt, @prelimScore, DATEADD(HOUR, 10, @compDt), @prelimSub, @prelimScore,
   2, N'PER_TRACK_TOP_N', 40, @now, @now),
  ('0D030000-EEEE-4EEE-8EEE-000000000002', '0D010000-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', N'FINAL',
   @prelimScore, @finalEnd, NULL, @prelimScore, @finalEnd,
   6, N'FINALIST_POOL', 60, @now, @now);

INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at) VALUES
  ('0D060000-EEEE-4EEE-8EEE-000000000001', '0D030000-EEEE-4EEE-8EEE-000000000001', N'Innovation', N'Innovation', 25, 0, 1, 5, @now, @now),
  ('0D060000-EEEE-4EEE-8EEE-000000000002', '0D030000-EEEE-4EEE-8EEE-000000000001', N'Technical', N'Technical', 30, 1, 1, 5, @now, @now),
  ('0D060000-EEEE-4EEE-8EEE-000000000003', '0D030000-EEEE-4EEE-8EEE-000000000001', N'Business Value', N'Business Value', 25, 2, 1, 5, @now, @now),
  ('0D060000-EEEE-4EEE-8EEE-000000000004', '0D030000-EEEE-4EEE-8EEE-000000000001', N'Presentation', N'Presentation', 20, 3, 1, 5, @now, @now),
  ('0D060000-EEEE-4EEE-8EEE-00000000000B', '0D030000-EEEE-4EEE-8EEE-000000000002', N'Innovation', N'Innovation', 25, 0, 1, 5, @now, @now),
  ('0D060000-EEEE-4EEE-8EEE-00000000000C', '0D030000-EEEE-4EEE-8EEE-000000000002', N'Technical', N'Technical', 30, 1, 1, 5, @now, @now),
  ('0D060000-EEEE-4EEE-8EEE-00000000000D', '0D030000-EEEE-4EEE-8EEE-000000000002', N'Business Value', N'Business Value', 25, 2, 1, 5, @now, @now),
  ('0D060000-EEEE-4EEE-8EEE-00000000000E', '0D030000-EEEE-4EEE-8EEE-000000000002', N'Presentation', N'Presentation', 20, 3, 1, 5, @now, @now);

INSERT INTO prizes (id, event_id, rank, value, quantity, label, created_at, updated_at) VALUES
  ('0D070000-EEEE-4EEE-8EEE-000000000001', '0D010000-EEEE-4EEE-8EEE-000000000001', N'FIRST', N'7000000', 1, N'First Prize', @now, @now),
  ('0D070000-EEEE-4EEE-8EEE-000000000002', '0D010000-EEEE-4EEE-8EEE-000000000001', N'SECOND', N'5000000', 1, N'Second Prize', @now, @now),
  ('0D070000-EEEE-4EEE-8EEE-000000000003', '0D010000-EEEE-4EEE-8EEE-000000000001', N'THIRD', N'3000000', 1, N'Third Prize', @now, @now),
  ('0D070000-EEEE-4EEE-8EEE-000000000004', '0D010000-EEEE-4EEE-8EEE-000000000001', N'CONSOLATION', N'1500000', 1, N'Consolation Prize', @now, @now);

INSERT INTO event_schedules (id, event_id, type, title, description, start_time, end_time, gate, sort_order, created_at, updated_at) VALUES
  ('0D080000-EEEE-4EEE-8EEE-000000000001', '0D010000-EEEE-4EEE-8EEE-000000000001', N'WORKSHOP', N'Workshop', NULL, DATEADD(DAY, 4, @now), DATEADD(HOUR, 3, DATEADD(DAY, 4, @now)), NULL, 0, @now, @now),
  ('0D080000-EEEE-4EEE-8EEE-000000000002', '0D010000-EEEE-4EEE-8EEE-000000000001', N'OPENING', N'Opening & track draw', N'Teams pick tracks; organizers assign judges/mentors', DATEADD(DAY, 6, @now), DATEADD(HOUR, 3, DATEADD(DAY, 6, @now)), NULL, 1, @now, @now),
  ('0D080000-EEEE-4EEE-8EEE-000000000003', '0D010000-EEEE-4EEE-8EEE-000000000001', N'TRACK_DRAW', N'Track selection draw', NULL, DATEADD(DAY, 6, @now), DATEADD(HOUR, 2, DATEADD(DAY, 6, @now)), NULL, 2, @now, @now),
  ('0D080000-EEEE-4EEE-8EEE-000000000004', '0D010000-EEEE-4EEE-8EEE-000000000001', N'MILESTONE', N'Milestone 1 - Idea & architecture', NULL, @compDt, DATEADD(HOUR, 10, @compDt), N'SLIDE_SUBMISSION', 3, @now, @now),
  ('0D080000-EEEE-4EEE-8EEE-000000000005', '0D010000-EEEE-4EEE-8EEE-000000000001', N'MILESTONE', N'Milestone 2 - Demo', NULL, DATEADD(HOUR, 10, @compDt), @prelimSub, N'DEMO_SUBMISSION', 4, @now, @now),
  ('0D080000-EEEE-4EEE-8EEE-000000000006', '0D010000-EEEE-4EEE-8EEE-000000000001', N'SCORING', N'Preliminary scoring', NULL, @prelimSub, @prelimScore, NULL, 5, @now, @now),
  ('0D080000-EEEE-4EEE-8EEE-000000000007', '0D010000-EEEE-4EEE-8EEE-000000000001', N'FINAL', N'Finals', NULL, @prelimScore, @finalEnd, NULL, 6, @now, @now),
  ('0D080000-EEEE-4EEE-8EEE-000000000008', '0D010000-EEEE-4EEE-8EEE-000000000001', N'CEREMONY', N'Awards & closing', NULL, @finalEnd, DATEADD(HOUR, 1, @finalEnd), NULL, 7, @now, @now);

INSERT INTO allowed_email_domains (id, event_id, domain, university_label, created_at, updated_at) VALUES
  ('0D090000-EEEE-4EEE-8EEE-000000000001', '0D010000-EEEE-4EEE-8EEE-000000000001', N'fpt.edu.vn', N'FPT University', @now, @now);

INSERT INTO event_enrollments (id, created_at, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public) VALUES
  ('0D0A0000-EEEE-4EEE-8EEE-000000000001', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s01, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-000000000002', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s02, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-000000000003', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s03, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-000000000004', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s04, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-000000000005', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s05, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-000000000006', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s06, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-000000000007', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s07, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-000000000008', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s08, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-000000000009', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s09, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s10, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-00000000000B', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s11, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-00000000000C', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s12, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-00000000000D', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s13, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-00000000000E', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s14, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-00000000000F', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s15, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-000000000010', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s16, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-000000000011', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s17, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-000000000012', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s18, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-000000000013', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s19, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-000000000014', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s20, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-000000000015', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s21, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-000000000016', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s22, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-000000000017', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s23, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-000000000018', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s24, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-000000000019', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s25, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-00000000001A', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s26, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-00000000001B', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s27, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-00000000001C', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s28, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-00000000001D', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s29, 0, 0),
  ('0D0A0000-EEEE-4EEE-8EEE-00000000001E', @now, @now, '0D010000-EEEE-4EEE-8EEE-000000000001', N'APPROVED', @s30, 0, 0);

-- Teams intentionally have track_id NULL so Assignment UI can assign/draw tracks
INSERT INTO teams (id, created_at, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, is_recruiting, recruitment_note, version) VALUES
  ('0D050000-EEEE-4EEE-8EEE-000000000001', @now, '0D010000-EEEE-4EEE-8EEE-000000000001', @s01, N'Assign Alpha', N'CONFIRMED', NULL, NULL, NULL, 0, N'Ready for track/judge/mentor assignment.', 0),
  ('0D050000-EEEE-4EEE-8EEE-000000000002', @now, '0D010000-EEEE-4EEE-8EEE-000000000001', @s04, N'Assign Beta', N'CONFIRMED', NULL, NULL, NULL, 0, N'Ready for track/judge/mentor assignment.', 0),
  ('0D050000-EEEE-4EEE-8EEE-000000000003', @now, '0D010000-EEEE-4EEE-8EEE-000000000001', @s07, N'Assign Gamma', N'CONFIRMED', NULL, NULL, NULL, 0, N'Ready for track/judge/mentor assignment.', 0),
  ('0D050000-EEEE-4EEE-8EEE-000000000004', @now, '0D010000-EEEE-4EEE-8EEE-000000000001', @s10, N'Assign Delta', N'CONFIRMED', NULL, NULL, NULL, 0, N'Ready for track/judge/mentor assignment.', 0),
  ('0D050000-EEEE-4EEE-8EEE-000000000005', @now, '0D010000-EEEE-4EEE-8EEE-000000000001', @s13, N'Assign Epsilon', N'CONFIRMED', NULL, NULL, NULL, 0, N'Ready for track/judge/mentor assignment.', 0),
  ('0D050000-EEEE-4EEE-8EEE-000000000006', @now, '0D010000-EEEE-4EEE-8EEE-000000000001', @s16, N'Assign Zeta', N'CONFIRMED', NULL, NULL, NULL, 0, N'Ready for track/judge/mentor assignment.', 0),
  ('0D050000-EEEE-4EEE-8EEE-000000000007', @now, '0D010000-EEEE-4EEE-8EEE-000000000001', @s19, N'Assign Eta', N'CONFIRMED', NULL, NULL, NULL, 0, N'Ready for track/judge/mentor assignment.', 0),
  ('0D050000-EEEE-4EEE-8EEE-000000000008', @now, '0D010000-EEEE-4EEE-8EEE-000000000001', @s22, N'Assign Theta', N'CONFIRMED', NULL, NULL, NULL, 0, N'Ready for track/judge/mentor assignment.', 0),
  ('0D050000-EEEE-4EEE-8EEE-000000000009', @now, '0D010000-EEEE-4EEE-8EEE-000000000001', @s25, N'Assign Iota', N'CONFIRMED', NULL, NULL, NULL, 0, N'Ready for track/judge/mentor assignment.', 0),
  ('0D050000-EEEE-4EEE-8EEE-00000000000A', @now, '0D010000-EEEE-4EEE-8EEE-000000000001', @s28, N'Assign Kappa', N'CONFIRMED', NULL, NULL, NULL, 0, N'Ready for track/judge/mentor assignment.', 0);

INSERT INTO team_members (id, created_at, joined_at, role, user_id, team_id, event_id) VALUES
  ('0D0B0000-EEEE-4EEE-8EEE-000000000001', @now, @now, N'LEADER', @s01, '0D050000-EEEE-4EEE-8EEE-000000000001', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-000000000002', @now, @now, N'MEMBER', @s02, '0D050000-EEEE-4EEE-8EEE-000000000001', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-000000000003', @now, @now, N'MEMBER', @s03, '0D050000-EEEE-4EEE-8EEE-000000000001', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-000000000004', @now, @now, N'LEADER', @s04, '0D050000-EEEE-4EEE-8EEE-000000000002', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-000000000005', @now, @now, N'MEMBER', @s05, '0D050000-EEEE-4EEE-8EEE-000000000002', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-000000000006', @now, @now, N'MEMBER', @s06, '0D050000-EEEE-4EEE-8EEE-000000000002', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-000000000007', @now, @now, N'LEADER', @s07, '0D050000-EEEE-4EEE-8EEE-000000000003', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-000000000008', @now, @now, N'MEMBER', @s08, '0D050000-EEEE-4EEE-8EEE-000000000003', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-000000000009', @now, @now, N'MEMBER', @s09, '0D050000-EEEE-4EEE-8EEE-000000000003', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, N'LEADER', @s10, '0D050000-EEEE-4EEE-8EEE-000000000004', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-00000000000B', @now, @now, N'MEMBER', @s11, '0D050000-EEEE-4EEE-8EEE-000000000004', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-00000000000C', @now, @now, N'MEMBER', @s12, '0D050000-EEEE-4EEE-8EEE-000000000004', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-00000000000D', @now, @now, N'LEADER', @s13, '0D050000-EEEE-4EEE-8EEE-000000000005', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-00000000000E', @now, @now, N'MEMBER', @s14, '0D050000-EEEE-4EEE-8EEE-000000000005', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-00000000000F', @now, @now, N'MEMBER', @s15, '0D050000-EEEE-4EEE-8EEE-000000000005', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-000000000010', @now, @now, N'LEADER', @s16, '0D050000-EEEE-4EEE-8EEE-000000000006', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-000000000011', @now, @now, N'MEMBER', @s17, '0D050000-EEEE-4EEE-8EEE-000000000006', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-000000000012', @now, @now, N'MEMBER', @s18, '0D050000-EEEE-4EEE-8EEE-000000000006', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-000000000013', @now, @now, N'LEADER', @s19, '0D050000-EEEE-4EEE-8EEE-000000000007', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-000000000014', @now, @now, N'MEMBER', @s20, '0D050000-EEEE-4EEE-8EEE-000000000007', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-000000000015', @now, @now, N'MEMBER', @s21, '0D050000-EEEE-4EEE-8EEE-000000000007', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-000000000016', @now, @now, N'LEADER', @s22, '0D050000-EEEE-4EEE-8EEE-000000000008', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-000000000017', @now, @now, N'MEMBER', @s23, '0D050000-EEEE-4EEE-8EEE-000000000008', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-000000000018', @now, @now, N'MEMBER', @s24, '0D050000-EEEE-4EEE-8EEE-000000000008', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-000000000019', @now, @now, N'LEADER', @s25, '0D050000-EEEE-4EEE-8EEE-000000000009', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-00000000001A', @now, @now, N'MEMBER', @s26, '0D050000-EEEE-4EEE-8EEE-000000000009', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-00000000001B', @now, @now, N'MEMBER', @s27, '0D050000-EEEE-4EEE-8EEE-000000000009', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-00000000001C', @now, @now, N'LEADER', @s28, '0D050000-EEEE-4EEE-8EEE-00000000000A', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-00000000001D', @now, @now, N'MEMBER', @s29, '0D050000-EEEE-4EEE-8EEE-00000000000A', '0D010000-EEEE-4EEE-8EEE-000000000001'),
  ('0D0B0000-EEEE-4EEE-8EEE-00000000001E', @now, @now, N'MEMBER', @s30, '0D050000-EEEE-4EEE-8EEE-00000000000A', '0D010000-EEEE-4EEE-8EEE-000000000001');

-- Intentionally NO event_judge_assignments / mentor_assignments / competition_groups
-- so Assignment pages start from a clean post-registration state.

COMMIT TRANSACTION;
PRINT 'Assignment demo ready: CLOSED_REGISTRATION + 10 CONFIRMED teams (no track/judge/mentor).';
PRINT 'EventId=0D010000-EEEE-4EEE-8EEE-000000000001';
PRINT 'Login coordinator: assign.coord@fpt.edu.vn / 12345678';
PRINT 'Judge pool: assign.judge1..3@fpt.edu.vn | Mentor pool: assign.mentor1..3@fpt.edu.vn';
PRINT 'Sample leader: assign.s01@fpt.edu.vn / 12345678';
PRINT 'UI: /coordinator/assignments/teams  (select Assignment Demo event)';
