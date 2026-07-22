-- AS2 full demo seed: progress (9 teams) + livescore (9 teams) + completed published.
-- Password for ALL accounts: 12345678
-- Uses SYSDATETIME() (local) so progress rules match JVM LocalDateTime.
-- Run: sqlcmd -S localhost -U sa -P <password> -d SEAL -I -i seed_as2_full_demo.sql

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

-- Accounts
IF EXISTS (SELECT 1 FROM users WHERE email = N'admin@seal.com')
  UPDATE users SET password_hash=@pwd, full_name=N'System Admin', user_type=N'SYSTEM_ADMIN', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'admin@seal.com';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'admin@seal.com',@pwd,N'System Admin',NULL,NULL,NULL,N'FPT University',N'SYSTEM_ADMIN',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'coordinator@seal.com')
  UPDATE users SET password_hash=@pwd, full_name=N'Demo Coordinator', user_type=N'EVENT_COORDINATOR', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'coordinator@seal.com';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'coordinator@seal.com',@pwd,N'Demo Coordinator',NULL,NULL,NULL,N'FPT University',N'EVENT_COORDINATOR',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'lecturer1@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Lecturer One', user_type=N'LECTURER', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'lecturer1@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'lecturer1@fpt.edu.vn',@pwd,N'Lecturer One',NULL,NULL,NULL,N'FPT University',N'LECTURER',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'lecturer2@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Lecturer Two', user_type=N'LECTURER', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'lecturer2@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'lecturer2@fpt.edu.vn',@pwd,N'Lecturer Two',NULL,NULL,NULL,N'FPT University',N'LECTURER',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'lecturer3@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Lecturer Three', user_type=N'LECTURER', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'lecturer3@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'lecturer3@fpt.edu.vn',@pwd,N'Lecturer Three',NULL,NULL,NULL,N'FPT University',N'LECTURER',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'mentor.lbtest@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'Mentor LB Test', user_type=N'LECTURER', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
    semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'mentor.lbtest@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'mentor.lbtest@fpt.edu.vn',@pwd,N'Mentor LB Test',NULL,NULL,NULL,N'FPT University',N'LECTURER',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s01@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 01', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29101', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s01@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s01@fpt.edu.vn',@pwd,N'AS2 Student 01',NULL,NULL,N'SE29101',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s02@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 02', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29102', university_name=N'FPT University',
    semester=6, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s02@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s02@fpt.edu.vn',@pwd,N'AS2 Student 02',NULL,NULL,N'SE29102',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,6,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s03@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 03', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29103', university_name=N'FPT University',
    semester=7, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s03@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s03@fpt.edu.vn',@pwd,N'AS2 Student 03',NULL,NULL,N'SE29103',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,7,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s04@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 04', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29104', university_name=N'FPT University',
    semester=8, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s04@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s04@fpt.edu.vn',@pwd,N'AS2 Student 04',NULL,NULL,N'SE29104',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,8,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s05@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 05', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29105', university_name=N'FPT University',
    semester=4, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s05@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s05@fpt.edu.vn',@pwd,N'AS2 Student 05',NULL,NULL,N'SE29105',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,4,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s06@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 06', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29106', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s06@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s06@fpt.edu.vn',@pwd,N'AS2 Student 06',NULL,NULL,N'SE29106',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s07@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 07', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29107', university_name=N'FPT University',
    semester=6, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s07@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s07@fpt.edu.vn',@pwd,N'AS2 Student 07',NULL,NULL,N'SE29107',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,6,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s08@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 08', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29108', university_name=N'FPT University',
    semester=7, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s08@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s08@fpt.edu.vn',@pwd,N'AS2 Student 08',NULL,NULL,N'SE29108',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,7,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s09@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 09', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29109', university_name=N'FPT University',
    semester=8, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s09@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s09@fpt.edu.vn',@pwd,N'AS2 Student 09',NULL,NULL,N'SE29109',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,8,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s10@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 10', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29110', university_name=N'FPT University',
    semester=4, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s10@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s10@fpt.edu.vn',@pwd,N'AS2 Student 10',NULL,NULL,N'SE29110',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,4,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s11@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 11', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29111', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s11@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s11@fpt.edu.vn',@pwd,N'AS2 Student 11',NULL,NULL,N'SE29111',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s12@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 12', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29112', university_name=N'FPT University',
    semester=6, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s12@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s12@fpt.edu.vn',@pwd,N'AS2 Student 12',NULL,NULL,N'SE29112',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,6,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s13@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 13', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29113', university_name=N'FPT University',
    semester=7, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s13@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s13@fpt.edu.vn',@pwd,N'AS2 Student 13',NULL,NULL,N'SE29113',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,7,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s14@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 14', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29114', university_name=N'FPT University',
    semester=8, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s14@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s14@fpt.edu.vn',@pwd,N'AS2 Student 14',NULL,NULL,N'SE29114',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,8,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s15@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 15', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29115', university_name=N'FPT University',
    semester=4, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s15@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s15@fpt.edu.vn',@pwd,N'AS2 Student 15',NULL,NULL,N'SE29115',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,4,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s16@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 16', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29116', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s16@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s16@fpt.edu.vn',@pwd,N'AS2 Student 16',NULL,NULL,N'SE29116',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s17@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 17', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29117', university_name=N'FPT University',
    semester=6, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s17@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s17@fpt.edu.vn',@pwd,N'AS2 Student 17',NULL,NULL,N'SE29117',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,6,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s18@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 18', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29118', university_name=N'FPT University',
    semester=7, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s18@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s18@fpt.edu.vn',@pwd,N'AS2 Student 18',NULL,NULL,N'SE29118',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,7,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s19@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 19', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29119', university_name=N'FPT University',
    semester=8, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s19@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s19@fpt.edu.vn',@pwd,N'AS2 Student 19',NULL,NULL,N'SE29119',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,8,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s20@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 20', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29120', university_name=N'FPT University',
    semester=4, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s20@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s20@fpt.edu.vn',@pwd,N'AS2 Student 20',NULL,NULL,N'SE29120',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,4,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s21@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 21', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29121', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s21@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s21@fpt.edu.vn',@pwd,N'AS2 Student 21',NULL,NULL,N'SE29121',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s22@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 22', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29122', university_name=N'FPT University',
    semester=6, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s22@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s22@fpt.edu.vn',@pwd,N'AS2 Student 22',NULL,NULL,N'SE29122',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,6,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s23@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 23', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29123', university_name=N'FPT University',
    semester=7, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s23@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s23@fpt.edu.vn',@pwd,N'AS2 Student 23',NULL,NULL,N'SE29123',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,7,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s24@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 24', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29124', university_name=N'FPT University',
    semester=8, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s24@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s24@fpt.edu.vn',@pwd,N'AS2 Student 24',NULL,NULL,N'SE29124',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,8,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s25@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 25', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29125', university_name=N'FPT University',
    semester=4, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s25@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s25@fpt.edu.vn',@pwd,N'AS2 Student 25',NULL,NULL,N'SE29125',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,4,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s26@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 26', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29126', university_name=N'FPT University',
    semester=5, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s26@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s26@fpt.edu.vn',@pwd,N'AS2 Student 26',NULL,NULL,N'SE29126',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,5,N'ENROLLED',0,@now,@now);

IF EXISTS (SELECT 1 FROM users WHERE email = N'as2.s27@fpt.edu.vn')
  UPDATE users SET password_hash=@pwd, full_name=N'AS2 Student 27', user_type=N'FPT_STUDENT', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, student_id=N'SE29127', university_name=N'FPT University',
    semester=6, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'as2.s27@fpt.edu.vn';
ELSE
  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)
  VALUES (NEWID(),N'as2.s27@fpt.edu.vn',@pwd,N'AS2 Student 27',NULL,NULL,N'SE29127',N'FPT University',N'FPT_STUDENT',N'ACTIVE',0,NULL,6,N'ENROLLED',0,@now,@now);

DECLARE @coordId UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'coordinator@seal.com');
DECLARE @mentorId UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'mentor.lbtest@fpt.edu.vn');
DECLARE @j1 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'lecturer1@fpt.edu.vn');
DECLARE @j2 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'lecturer2@fpt.edu.vn');
DECLARE @j3 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'lecturer3@fpt.edu.vn');
DECLARE @s01 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s01@fpt.edu.vn');
DECLARE @s02 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s02@fpt.edu.vn');
DECLARE @s03 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s03@fpt.edu.vn');
DECLARE @s04 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s04@fpt.edu.vn');
DECLARE @s05 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s05@fpt.edu.vn');
DECLARE @s06 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s06@fpt.edu.vn');
DECLARE @s07 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s07@fpt.edu.vn');
DECLARE @s08 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s08@fpt.edu.vn');
DECLARE @s09 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s09@fpt.edu.vn');
DECLARE @s10 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s10@fpt.edu.vn');
DECLARE @s11 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s11@fpt.edu.vn');
DECLARE @s12 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s12@fpt.edu.vn');
DECLARE @s13 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s13@fpt.edu.vn');
DECLARE @s14 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s14@fpt.edu.vn');
DECLARE @s15 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s15@fpt.edu.vn');
DECLARE @s16 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s16@fpt.edu.vn');
DECLARE @s17 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s17@fpt.edu.vn');
DECLARE @s18 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s18@fpt.edu.vn');
DECLARE @s19 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s19@fpt.edu.vn');
DECLARE @s20 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s20@fpt.edu.vn');
DECLARE @s21 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s21@fpt.edu.vn');
DECLARE @s22 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s22@fpt.edu.vn');
DECLARE @s23 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s23@fpt.edu.vn');
DECLARE @s24 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s24@fpt.edu.vn');
DECLARE @s25 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s25@fpt.edu.vn');
DECLARE @s26 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s26@fpt.edu.vn');
DECLARE @s27 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s27@fpt.edu.vn');

DECLARE @wipe TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @wipe VALUES ('C1000001-EEEE-4EEE-8EEE-000000000001'),('C1000002-EEEE-4EEE-8EEE-000000000001'),('C1000003-EEEE-4EEE-8EEE-000000000001');
DECLARE @wTeams TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @wTeams SELECT id FROM teams WHERE event_id IN (SELECT id FROM @wipe);
DECLARE @wRounds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @wRounds SELECT id FROM rounds WHERE event_id IN (SELECT id FROM @wipe);
DECLARE @wSubs TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @wSubs SELECT id FROM submissions WHERE team_id IN (SELECT id FROM @wTeams);
DELETE FROM notification_recipients WHERE notification_id IN (SELECT id FROM notifications WHERE type=N'TEAM_PROGRESS_ALERT' AND reference_id IN (SELECT id FROM @wTeams));
DELETE FROM notifications WHERE type=N'TEAM_PROGRESS_ALERT' AND reference_id IN (SELECT id FROM @wTeams);
DELETE FROM team_progress_alerts WHERE team_id IN (SELECT id FROM @wTeams);
DELETE jc FROM judge_comments jc INNER JOIN judge_scores js ON js.id=jc.judge_score_id WHERE js.submission_id IN (SELECT id FROM @wSubs);
DELETE jsd FROM judge_score_details jsd INNER JOIN judge_scores js ON js.id=jsd.judge_score_id WHERE js.submission_id IN (SELECT id FROM @wSubs);
DELETE FROM judge_scores WHERE submission_id IN (SELECT id FROM @wSubs);
DELETE sa FROM submission_attachments sa INNER JOIN submission_versions sv ON sv.id=sa.submission_version_id WHERE sv.submission_id IN (SELECT id FROM @wSubs);
DELETE FROM submission_versions WHERE submission_id IN (SELECT id FROM @wSubs);
DELETE FROM submissions WHERE id IN (SELECT id FROM @wSubs);
DELETE FROM mentor_teams WHERE team_id IN (SELECT id FROM @wTeams);
DELETE FROM team_members WHERE team_id IN (SELECT id FROM @wTeams);
DELETE FROM teams WHERE id IN (SELECT id FROM @wTeams);
DELETE FROM event_enrollments WHERE event_id IN (SELECT id FROM @wipe);
DELETE FROM team_awards WHERE event_id IN (SELECT id FROM @wipe);
DELETE FROM finalist_selections WHERE event_id IN (SELECT id FROM @wipe);
DELETE FROM rankings WHERE round_id IN (SELECT id FROM @wRounds);
DELETE FROM published_results WHERE round_id IN (SELECT id FROM @wRounds);
IF OBJECT_ID(N'advancements',N'U') IS NOT NULL DELETE FROM advancements WHERE round_id IN (SELECT id FROM @wRounds);
DELETE FROM judge_assignments WHERE round_id IN (SELECT id FROM @wRounds);
DELETE FROM criteria WHERE round_id IN (SELECT id FROM @wRounds);
DELETE FROM rounds WHERE id IN (SELECT id FROM @wRounds);
DELETE FROM event_judge_assignments WHERE event_id IN (SELECT id FROM @wipe);
DELETE FROM event_mentor_assignments WHERE event_id IN (SELECT id FROM @wipe);
DELETE FROM mentor_assignments WHERE event_id IN (SELECT id FROM @wipe);
DELETE FROM prizes WHERE event_id IN (SELECT id FROM @wipe);
DELETE FROM tracks WHERE event_id IN (SELECT id FROM @wipe);
DELETE FROM hackathon_events WHERE id IN (SELECT id FROM @wipe);

-- === AS2 Progress Demo - 9 Teams Submission Watch ===
INSERT INTO hackathon_events (
  id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at
) VALUES (
  'C1000001-EEEE-4EEE-8EEE-000000000001', N'AS2 Progress Demo - 9 Teams Submission Watch', N'Summer', 2026,
  CAST(DATEADD(DAY,-1,@now) AS DATE), CAST(DATEADD(DAY,3,@now) AS DATE),
  CAST(DATEADD(DAY,-20,@now) AS DATE), CAST(DATEADD(DAY,-1,@now) AS DATE),
  N'AS2 demo event', N'FPT University HCM', N'OFFLINE', N'GENERIC',
  1, 5, 1, 9, @templateId, N'ACTIVE', 0, @coordId, N'coordinator@seal.com', @now, @now
);

INSERT INTO tracks (id, event_id, name, description, max_teams, status, created_at, updated_at) VALUES
  ('01040000-EEEE-4EEE-8EEE-000000000001', 'C1000001-EEEE-4EEE-8EEE-000000000001', N'Grounded Retrieval', N'Track Grounded Retrieval', 8, N'OPEN', @now, @now),
  ('01040000-EEEE-4EEE-8EEE-000000000002', 'C1000001-EEEE-4EEE-8EEE-000000000001', N'Agent Orchestration', N'Track Agent Orchestration', 8, N'OPEN', @now, @now),
  ('01040000-EEEE-4EEE-8EEE-000000000003', 'C1000001-EEEE-4EEE-8EEE-000000000001', N'Enterprise Copilot', N'Track Enterprise Copilot', 8, N'OPEN', @now, @now);

INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, created_at, updated_at) VALUES
  ('01030000-EEEE-4EEE-8EEE-000000000001', 'C1000001-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(DAY,-1,@now), DATEADD(DAY,2,@now), DATEADD(HOUR,-5,@now), DATEADD(HOUR,3,@now), DATEADD(DAY,2,@now), 2, N'PER_TRACK_TOP_N', 40, @now, @now),
  ('01030000-EEEE-4EEE-8EEE-000000000002', 'C1000001-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', N'FINAL', DATEADD(DAY,2,@now), DATEADD(DAY,3,@now), NULL, DATEADD(DAY,2,@now), DATEADD(DAY,3,@now), 6, N'FINALIST_POOL', 60, @now, @now);

INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at) VALUES
  ('01060000-EEEE-4EEE-8EEE-000000000001', '01030000-EEEE-4EEE-8EEE-000000000001', N'Innovation', N'Innovation', 25, 0, 1, 5, @now, @now),
  ('01060000-EEEE-4EEE-8EEE-000000000002', '01030000-EEEE-4EEE-8EEE-000000000001', N'Technical', N'Technical', 30, 1, 1, 5, @now, @now),
  ('01060000-EEEE-4EEE-8EEE-000000000003', '01030000-EEEE-4EEE-8EEE-000000000001', N'Business Value', N'Business Value', 25, 2, 1, 5, @now, @now),
  ('01060000-EEEE-4EEE-8EEE-000000000004', '01030000-EEEE-4EEE-8EEE-000000000001', N'Presentation', N'Presentation', 20, 3, 1, 5, @now, @now),
  ('01060000-EEEE-4EEE-8EEE-00000000000B', '01030000-EEEE-4EEE-8EEE-000000000002', N'Innovation', N'Innovation', 25, 0, 1, 5, @now, @now),
  ('01060000-EEEE-4EEE-8EEE-00000000000C', '01030000-EEEE-4EEE-8EEE-000000000002', N'Technical', N'Technical', 30, 1, 1, 5, @now, @now),
  ('01060000-EEEE-4EEE-8EEE-00000000000D', '01030000-EEEE-4EEE-8EEE-000000000002', N'Business Value', N'Business Value', 25, 2, 1, 5, @now, @now),
  ('01060000-EEEE-4EEE-8EEE-00000000000E', '01030000-EEEE-4EEE-8EEE-000000000002', N'Presentation', N'Presentation', 20, 3, 1, 5, @now, @now);

INSERT INTO prizes (id, event_id, rank, value, quantity, label, created_at, updated_at) VALUES
  ('01070000-EEEE-4EEE-8EEE-000000000001', 'C1000001-EEEE-4EEE-8EEE-000000000001', N'FIRST', N'7000000', 1, N'First Prize', @now, @now),
  ('01070000-EEEE-4EEE-8EEE-000000000002', 'C1000001-EEEE-4EEE-8EEE-000000000001', N'SECOND', N'5000000', 1, N'Second Prize', @now, @now),
  ('01070000-EEEE-4EEE-8EEE-000000000003', 'C1000001-EEEE-4EEE-8EEE-000000000001', N'THIRD', N'3000000', 1, N'Third Prize', @now, @now),
  ('01070000-EEEE-4EEE-8EEE-000000000004', 'C1000001-EEEE-4EEE-8EEE-000000000001', N'CONSOLATION', N'1500000', 1, N'Consolation Prize', @now, @now);

INSERT INTO event_enrollments (id, created_at, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, @now, 'C1000001-EEEE-4EEE-8EEE-000000000001', N'APPROVED', u.id, 0, 0 FROM users u WHERE u.email IN (
  N'as2.s01@fpt.edu.vn',
  N'as2.s02@fpt.edu.vn',
  N'as2.s03@fpt.edu.vn',
  N'as2.s04@fpt.edu.vn',
  N'as2.s05@fpt.edu.vn',
  N'as2.s06@fpt.edu.vn',
  N'as2.s07@fpt.edu.vn',
  N'as2.s08@fpt.edu.vn',
  N'as2.s09@fpt.edu.vn'
);

INSERT INTO teams (id, created_at, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, is_recruiting, recruitment_note, version) VALUES
  ('01050000-EEEE-4EEE-8EEE-000000000001', @now, 'C1000001-EEEE-4EEE-8EEE-000000000001', @s01, N'AlphaPulse', N'CONFIRMED', '01040000-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', 0, N'Demo team', 0),
  ('01050000-EEEE-4EEE-8EEE-000000000002', @now, 'C1000001-EEEE-4EEE-8EEE-000000000001', @s02, N'BetaForge', N'CONFIRMED', '01040000-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', 0, N'Demo team', 0),
  ('01050000-EEEE-4EEE-8EEE-000000000003', @now, 'C1000001-EEEE-4EEE-8EEE-000000000001', @s03, N'GammaHop', N'CONFIRMED', '01040000-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', 0, N'Demo team', 0),
  ('01050000-EEEE-4EEE-8EEE-000000000004', @now, 'C1000001-EEEE-4EEE-8EEE-000000000001', @s04, N'DeltaRAG', N'CONFIRMED', '01040000-EEEE-4EEE-8EEE-000000000002', @now, N'MANUAL', 0, N'Demo team', 0),
  ('01050000-EEEE-4EEE-8EEE-000000000005', @now, 'C1000001-EEEE-4EEE-8EEE-000000000001', @s05, N'EpsilonBot', N'CONFIRMED', '01040000-EEEE-4EEE-8EEE-000000000002', @now, N'MANUAL', 0, N'Demo team', 0),
  ('01050000-EEEE-4EEE-8EEE-000000000006', @now, 'C1000001-EEEE-4EEE-8EEE-000000000001', @s06, N'ZetaPilot', N'CONFIRMED', '01040000-EEEE-4EEE-8EEE-000000000002', @now, N'MANUAL', 0, N'Demo team', 0),
  ('01050000-EEEE-4EEE-8EEE-000000000007', @now, 'C1000001-EEEE-4EEE-8EEE-000000000001', @s07, N'EtaChain', N'CONFIRMED', '01040000-EEEE-4EEE-8EEE-000000000003', @now, N'MANUAL', 0, N'Demo team', 0),
  ('01050000-EEEE-4EEE-8EEE-000000000008', @now, 'C1000001-EEEE-4EEE-8EEE-000000000001', @s08, N'ThetaVault', N'CONFIRMED', '01040000-EEEE-4EEE-8EEE-000000000003', @now, N'MANUAL', 0, N'Demo team', 0),
  ('01050000-EEEE-4EEE-8EEE-000000000009', @now, 'C1000001-EEEE-4EEE-8EEE-000000000001', @s09, N'IotaLens', N'CONFIRMED', '01040000-EEEE-4EEE-8EEE-000000000003', @now, N'MANUAL', 0, N'Demo team', 0);

INSERT INTO team_members (id, created_at, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @now, N'LEADER', @s01, '01050000-EEEE-4EEE-8EEE-000000000001', 'C1000001-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, N'LEADER', @s02, '01050000-EEEE-4EEE-8EEE-000000000002', 'C1000001-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, N'LEADER', @s03, '01050000-EEEE-4EEE-8EEE-000000000003', 'C1000001-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, N'LEADER', @s04, '01050000-EEEE-4EEE-8EEE-000000000004', 'C1000001-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, N'LEADER', @s05, '01050000-EEEE-4EEE-8EEE-000000000005', 'C1000001-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, N'LEADER', @s06, '01050000-EEEE-4EEE-8EEE-000000000006', 'C1000001-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, N'LEADER', @s07, '01050000-EEEE-4EEE-8EEE-000000000007', 'C1000001-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, N'LEADER', @s08, '01050000-EEEE-4EEE-8EEE-000000000008', 'C1000001-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, N'LEADER', @s09, '01050000-EEEE-4EEE-8EEE-000000000009', 'C1000001-EEEE-4EEE-8EEE-000000000001');

INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id) VALUES
  (NEWID(), @now, @now, @j1, 'C1000001-EEEE-4EEE-8EEE-000000000001'), (NEWID(), @now, @now, @j2, 'C1000001-EEEE-4EEE-8EEE-000000000001'), (NEWID(), @now, @now, @j3, 'C1000001-EEEE-4EEE-8EEE-000000000001');
INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active) VALUES
  (NEWID(), @now, @now, @j1, '01030000-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1), (NEWID(), @now, @now, @j2, '01030000-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1), (NEWID(), @now, @now, @j3, '01030000-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1),
  (NEWID(), @now, @now, @j1, '01030000-EEEE-4EEE-8EEE-000000000002', N'ROUND', 1), (NEWID(), @now, @now, @j2, '01030000-EEEE-4EEE-8EEE-000000000002', N'ROUND', 1), (NEWID(), @now, @now, @j3, '01030000-EEEE-4EEE-8EEE-000000000002', N'ROUND', 1);
INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at) VALUES (NEWID(), 'C1000001-EEEE-4EEE-8EEE-000000000001', @mentorId, @now, @now);
INSERT INTO mentor_assignments (id, created_at, assigned_at, mentor_user_id, event_id, track_id) VALUES
  (NEWID(), @now, @now, @mentorId, 'C1000001-EEEE-4EEE-8EEE-000000000001', '01040000-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, @mentorId, 'C1000001-EEEE-4EEE-8EEE-000000000001', '01040000-EEEE-4EEE-8EEE-000000000002'),
  (NEWID(), @now, @now, @mentorId, 'C1000001-EEEE-4EEE-8EEE-000000000001', '01040000-EEEE-4EEE-8EEE-000000000003');
INSERT INTO mentor_teams (id, created_at, assigned_at, mentor_user_id, team_id) VALUES
  (NEWID(), @now, @now, @mentorId, '01050000-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, @mentorId, '01050000-EEEE-4EEE-8EEE-000000000002'),
  (NEWID(), @now, @now, @mentorId, '01050000-EEEE-4EEE-8EEE-000000000003'),
  (NEWID(), @now, @now, @mentorId, '01050000-EEEE-4EEE-8EEE-000000000004'),
  (NEWID(), @now, @now, @mentorId, '01050000-EEEE-4EEE-8EEE-000000000005'),
  (NEWID(), @now, @now, @mentorId, '01050000-EEEE-4EEE-8EEE-000000000006'),
  (NEWID(), @now, @now, @mentorId, '01050000-EEEE-4EEE-8EEE-000000000007'),
  (NEWID(), @now, @now, @mentorId, '01050000-EEEE-4EEE-8EEE-000000000008'),
  (NEWID(), @now, @now, @mentorId, '01050000-EEEE-4EEE-8EEE-000000000009');

INSERT INTO submissions (id, created_at, current_version_id, round_id, status, submitted_by, team_id, opt_lock) VALUES
  ('010D0000-EEEE-4EEE-8EEE-000000000001', @now, NULL, '01030000-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', @s04, '01050000-EEEE-4EEE-8EEE-000000000004', 0),
  ('010D0000-EEEE-4EEE-8EEE-000000000002', @now, NULL, '01030000-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', @s05, '01050000-EEEE-4EEE-8EEE-000000000005', 0),
  ('010D0000-EEEE-4EEE-8EEE-000000000003', @now, NULL, '01030000-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', @s06, '01050000-EEEE-4EEE-8EEE-000000000006', 0),
  ('010D0000-EEEE-4EEE-8EEE-000000000004', @now, NULL, '01030000-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', @s07, '01050000-EEEE-4EEE-8EEE-000000000007', 0),
  ('010D0000-EEEE-4EEE-8EEE-000000000005', @now, NULL, '01030000-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', @s08, '01050000-EEEE-4EEE-8EEE-000000000008', 0),
  ('010D0000-EEEE-4EEE-8EEE-000000000006', @now, NULL, '01030000-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', @s09, '01050000-EEEE-4EEE-8EEE-000000000009', 0);
INSERT INTO submission_versions (id, created_at, demo_url, github_url, slide_url, submitted_at, version_number, submission_id) VALUES
  ('010E0000-EEEE-4EEE-8EEE-000000000001', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/deltarag', N'https://docs.google.com/presentation/d/deltarag', DATEADD(HOUR,-30,@now), 1, '010D0000-EEEE-4EEE-8EEE-000000000001'),
  ('010E0000-EEEE-4EEE-8EEE-000000000002', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/epsilonbot', N'https://docs.google.com/presentation/d/epsilonbot', DATEADD(HOUR,-30,@now), 1, '010D0000-EEEE-4EEE-8EEE-000000000002'),
  ('010E0000-EEEE-4EEE-8EEE-000000000003', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/zetapilot', N'https://docs.google.com/presentation/d/zetapilot', DATEADD(MINUTE,-40,@now), 1, '010D0000-EEEE-4EEE-8EEE-000000000003'),
  ('010E0000-EEEE-4EEE-8EEE-000000000004', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/etachain', N'https://docs.google.com/presentation/d/etachain', DATEADD(MINUTE,-40,@now), 1, '010D0000-EEEE-4EEE-8EEE-000000000004'),
  ('010E0000-EEEE-4EEE-8EEE-000000000005', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/thetavault', N'https://docs.google.com/presentation/d/thetavault-v1', DATEADD(HOUR,-40,@now), 1, '010D0000-EEEE-4EEE-8EEE-000000000005'),
  ('010E0000-EEEE-4EEE-8EEE-000000000006', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/thetavault', N'https://docs.google.com/presentation/d/thetavault-v2', DATEADD(HOUR,-2,@now), 2, '010D0000-EEEE-4EEE-8EEE-000000000005'),
  ('010E0000-EEEE-4EEE-8EEE-000000000007', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/iotalens', N'https://docs.google.com/presentation/d/iotalens-v1', DATEADD(HOUR,-40,@now), 1, '010D0000-EEEE-4EEE-8EEE-000000000006'),
  ('010E0000-EEEE-4EEE-8EEE-000000000008', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/iotalens', N'https://docs.google.com/presentation/d/iotalens-v2', DATEADD(HOUR,-2,@now), 2, '010D0000-EEEE-4EEE-8EEE-000000000006');
INSERT INTO submission_attachments (id, created_at, file_name, file_size, file_url, page_count, submission_version_id) VALUES
  (NEWID(), @now, N'pitch.pdf', 102400, N'/uploads/demo/deltarag.pdf', 2, '010E0000-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'pitch.pdf', 102400, N'/uploads/demo/epsilonbot.pdf', 2, '010E0000-EEEE-4EEE-8EEE-000000000002'),
  (NEWID(), @now, N'pitch.pdf', 102400, N'/uploads/demo/zetapilot.pdf', 2, '010E0000-EEEE-4EEE-8EEE-000000000003'),
  (NEWID(), @now, N'pitch.pdf', 102400, N'/uploads/demo/etachain.pdf', 2, '010E0000-EEEE-4EEE-8EEE-000000000004'),
  (NEWID(), @now, N'pitch-v2.pdf', 204800, N'/uploads/demo/thetavault-v2.pdf', 2, '010E0000-EEEE-4EEE-8EEE-000000000006'),
  (NEWID(), @now, N'pitch-v2.pdf', 204800, N'/uploads/demo/iotalens-v2.pdf', 2, '010E0000-EEEE-4EEE-8EEE-000000000008');
UPDATE submissions SET current_version_id='010E0000-EEEE-4EEE-8EEE-000000000001' WHERE id='010D0000-EEEE-4EEE-8EEE-000000000001';
UPDATE submissions SET current_version_id='010E0000-EEEE-4EEE-8EEE-000000000002' WHERE id='010D0000-EEEE-4EEE-8EEE-000000000002';
UPDATE submissions SET current_version_id='010E0000-EEEE-4EEE-8EEE-000000000003' WHERE id='010D0000-EEEE-4EEE-8EEE-000000000003';
UPDATE submissions SET current_version_id='010E0000-EEEE-4EEE-8EEE-000000000004' WHERE id='010D0000-EEEE-4EEE-8EEE-000000000004';
UPDATE submissions SET current_version_id='010E0000-EEEE-4EEE-8EEE-000000000006' WHERE id='010D0000-EEEE-4EEE-8EEE-000000000005';
UPDATE submissions SET current_version_id='010E0000-EEEE-4EEE-8EEE-000000000008' WHERE id='010D0000-EEEE-4EEE-8EEE-000000000006';
INSERT INTO team_progress_alerts (id, team_id, round_id, risk_level, reasons, last_alerted_at, created_at, updated_at) VALUES
  (NEWID(), '01050000-EEEE-4EEE-8EEE-000000000001', '01030000-EEEE-4EEE-8EEE-000000000001', N'CRITICAL', N'NOT_STARTED', @now, @now, @now),
  (NEWID(), '01050000-EEEE-4EEE-8EEE-000000000002', '01030000-EEEE-4EEE-8EEE-000000000001', N'CRITICAL', N'NOT_STARTED', @now, @now, @now),
  (NEWID(), '01050000-EEEE-4EEE-8EEE-000000000003', '01030000-EEEE-4EEE-8EEE-000000000001', N'CRITICAL', N'NOT_STARTED', @now, @now, @now),
  (NEWID(), '01050000-EEEE-4EEE-8EEE-000000000004', '01030000-EEEE-4EEE-8EEE-000000000001', N'AT_RISK', N'STALLED', @now, @now, @now),
  (NEWID(), '01050000-EEEE-4EEE-8EEE-000000000005', '01030000-EEEE-4EEE-8EEE-000000000001', N'AT_RISK', N'STALLED', @now, @now, @now),
  (NEWID(), '01050000-EEEE-4EEE-8EEE-000000000006', '01030000-EEEE-4EEE-8EEE-000000000001', N'AT_RISK', N'SINGLE_VERSION_LAST_MINUTE', @now, @now, @now),
  (NEWID(), '01050000-EEEE-4EEE-8EEE-000000000007', '01030000-EEEE-4EEE-8EEE-000000000001', N'AT_RISK', N'SINGLE_VERSION_LAST_MINUTE', @now, @now, @now);

INSERT INTO notifications (id, created_at, message, reference_id, reference_type, title, type) VALUES
  ('01190000-EEEE-4EEE-8EEE-000000000001', @now, N'Team AlphaPulse has not started submission (NOT_STARTED).', '01050000-EEEE-4EEE-8EEE-000000000001', N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT'),
  ('01190000-EEEE-4EEE-8EEE-000000000002', @now, N'Team BetaForge has not started submission (NOT_STARTED).', '01050000-EEEE-4EEE-8EEE-000000000002', N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT'),
  ('01190000-EEEE-4EEE-8EEE-000000000003', @now, N'Team GammaHop has not started submission (NOT_STARTED).', '01050000-EEEE-4EEE-8EEE-000000000003', N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT'),
  ('01190000-EEEE-4EEE-8EEE-000000000004', @now, N'Team DeltaRAG stalled (STALLED).', '01050000-EEEE-4EEE-8EEE-000000000004', N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT'),
  ('01190000-EEEE-4EEE-8EEE-000000000005', @now, N'Team EpsilonBot stalled (STALLED).', '01050000-EEEE-4EEE-8EEE-000000000005', N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT'),
  ('01190000-EEEE-4EEE-8EEE-000000000006', @now, N'Team ZetaPilot last-minute single version.', '01050000-EEEE-4EEE-8EEE-000000000006', N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT'),
  ('01190000-EEEE-4EEE-8EEE-000000000007', @now, N'Team EtaChain last-minute single version.', '01050000-EEEE-4EEE-8EEE-000000000007', N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT');
INSERT INTO notification_recipients (id, created_at, channel, read_at, sent_at, user_id, notification_id) VALUES
  (NEWID(), @now, N'IN_APP', NULL, @now, @s01, '01190000-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'IN_APP', NULL, @now, @mentorId, '01190000-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'IN_APP', NULL, @now, @coordId, '01190000-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'IN_APP', NULL, @now, @s02, '01190000-EEEE-4EEE-8EEE-000000000002'),
  (NEWID(), @now, N'IN_APP', NULL, @now, @mentorId, '01190000-EEEE-4EEE-8EEE-000000000002'),
  (NEWID(), @now, N'IN_APP', NULL, @now, @coordId, '01190000-EEEE-4EEE-8EEE-000000000002'),
  (NEWID(), @now, N'IN_APP', NULL, @now, @s03, '01190000-EEEE-4EEE-8EEE-000000000003'),
  (NEWID(), @now, N'IN_APP', NULL, @now, @mentorId, '01190000-EEEE-4EEE-8EEE-000000000003'),
  (NEWID(), @now, N'IN_APP', NULL, @now, @coordId, '01190000-EEEE-4EEE-8EEE-000000000003'),
  (NEWID(), @now, N'IN_APP', NULL, @now, @s04, '01190000-EEEE-4EEE-8EEE-000000000004'),
  (NEWID(), @now, N'IN_APP', NULL, @now, @mentorId, '01190000-EEEE-4EEE-8EEE-000000000004'),
  (NEWID(), @now, N'IN_APP', NULL, @now, @coordId, '01190000-EEEE-4EEE-8EEE-000000000004'),
  (NEWID(), @now, N'IN_APP', NULL, @now, @s05, '01190000-EEEE-4EEE-8EEE-000000000005'),
  (NEWID(), @now, N'IN_APP', NULL, @now, @mentorId, '01190000-EEEE-4EEE-8EEE-000000000005'),
  (NEWID(), @now, N'IN_APP', NULL, @now, @coordId, '01190000-EEEE-4EEE-8EEE-000000000005'),
  (NEWID(), @now, N'IN_APP', NULL, @now, @s06, '01190000-EEEE-4EEE-8EEE-000000000006'),
  (NEWID(), @now, N'IN_APP', NULL, @now, @mentorId, '01190000-EEEE-4EEE-8EEE-000000000006'),
  (NEWID(), @now, N'IN_APP', NULL, @now, @coordId, '01190000-EEEE-4EEE-8EEE-000000000006'),
  (NEWID(), @now, N'IN_APP', NULL, @now, @s07, '01190000-EEEE-4EEE-8EEE-000000000007'),
  (NEWID(), @now, N'IN_APP', NULL, @now, @mentorId, '01190000-EEEE-4EEE-8EEE-000000000007'),
  (NEWID(), @now, N'IN_APP', NULL, @now, @coordId, '01190000-EEEE-4EEE-8EEE-000000000007');

-- === AS2 LiveScore Demo - 9 Teams Arena ===
INSERT INTO hackathon_events (
  id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at
) VALUES (
  'C1000002-EEEE-4EEE-8EEE-000000000001', N'AS2 LiveScore Demo - 9 Teams Arena', N'Summer', 2026,
  CAST(DATEADD(DAY,-5,@now) AS DATE), CAST(DATEADD(DAY,10,@now) AS DATE),
  CAST(DATEADD(DAY,-40,@now) AS DATE), CAST(DATEADD(DAY,-10,@now) AS DATE),
  N'AS2 demo event', N'FPT University HCM', N'OFFLINE', N'GENERIC',
  1, 5, 1, 9, @templateId, N'SCORING', 0, @coordId, N'coordinator@seal.com', @now, @now
);

INSERT INTO tracks (id, event_id, name, description, max_teams, status, created_at, updated_at) VALUES
  ('02040000-EEEE-4EEE-8EEE-000000000001', 'C1000002-EEEE-4EEE-8EEE-000000000001', N'Grounded Retrieval', N'Track Grounded Retrieval', 8, N'OPEN', @now, @now),
  ('02040000-EEEE-4EEE-8EEE-000000000002', 'C1000002-EEEE-4EEE-8EEE-000000000001', N'Agent Orchestration', N'Track Agent Orchestration', 8, N'OPEN', @now, @now),
  ('02040000-EEEE-4EEE-8EEE-000000000003', 'C1000002-EEEE-4EEE-8EEE-000000000001', N'Enterprise Copilot', N'Track Enterprise Copilot', 8, N'OPEN', @now, @now);

INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, created_at, updated_at) VALUES
  ('02030000-EEEE-4EEE-8EEE-000000000001', 'C1000002-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(DAY,-3,@now), DATEADD(DAY,5,@now), DATEADD(DAY,-2,@now), DATEADD(HOUR,-12,@now), DATEADD(DAY,5,@now), 2, N'PER_TRACK_TOP_N', 40, @now, @now),
  ('02030000-EEEE-4EEE-8EEE-000000000002', 'C1000002-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', N'FINAL', DATEADD(DAY,5,@now), DATEADD(DAY,8,@now), NULL, DATEADD(DAY,6,@now), DATEADD(DAY,8,@now), 6, N'NONE', 60, @now, @now);

INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at) VALUES
  ('02060000-EEEE-4EEE-8EEE-000000000001', '02030000-EEEE-4EEE-8EEE-000000000001', N'Innovation', N'Innovation', 25, 0, 1, 5, @now, @now),
  ('02060000-EEEE-4EEE-8EEE-000000000002', '02030000-EEEE-4EEE-8EEE-000000000001', N'Technical', N'Technical', 30, 1, 1, 5, @now, @now),
  ('02060000-EEEE-4EEE-8EEE-000000000003', '02030000-EEEE-4EEE-8EEE-000000000001', N'Business Value', N'Business Value', 25, 2, 1, 5, @now, @now),
  ('02060000-EEEE-4EEE-8EEE-000000000004', '02030000-EEEE-4EEE-8EEE-000000000001', N'Presentation', N'Presentation', 20, 3, 1, 5, @now, @now),
  ('02060000-EEEE-4EEE-8EEE-00000000000B', '02030000-EEEE-4EEE-8EEE-000000000002', N'Innovation', N'Innovation', 25, 0, 1, 5, @now, @now),
  ('02060000-EEEE-4EEE-8EEE-00000000000C', '02030000-EEEE-4EEE-8EEE-000000000002', N'Technical', N'Technical', 30, 1, 1, 5, @now, @now),
  ('02060000-EEEE-4EEE-8EEE-00000000000D', '02030000-EEEE-4EEE-8EEE-000000000002', N'Business Value', N'Business Value', 25, 2, 1, 5, @now, @now),
  ('02060000-EEEE-4EEE-8EEE-00000000000E', '02030000-EEEE-4EEE-8EEE-000000000002', N'Presentation', N'Presentation', 20, 3, 1, 5, @now, @now);

INSERT INTO prizes (id, event_id, rank, value, quantity, label, created_at, updated_at) VALUES
  ('02070000-EEEE-4EEE-8EEE-000000000001', 'C1000002-EEEE-4EEE-8EEE-000000000001', N'FIRST', N'7000000', 1, N'First Prize', @now, @now),
  ('02070000-EEEE-4EEE-8EEE-000000000002', 'C1000002-EEEE-4EEE-8EEE-000000000001', N'SECOND', N'5000000', 1, N'Second Prize', @now, @now),
  ('02070000-EEEE-4EEE-8EEE-000000000003', 'C1000002-EEEE-4EEE-8EEE-000000000001', N'THIRD', N'3000000', 1, N'Third Prize', @now, @now),
  ('02070000-EEEE-4EEE-8EEE-000000000004', 'C1000002-EEEE-4EEE-8EEE-000000000001', N'CONSOLATION', N'1500000', 1, N'Consolation Prize', @now, @now);

INSERT INTO event_enrollments (id, created_at, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, @now, 'C1000002-EEEE-4EEE-8EEE-000000000001', N'APPROVED', u.id, 0, 0 FROM users u WHERE u.email IN (
  N'as2.s10@fpt.edu.vn',
  N'as2.s11@fpt.edu.vn',
  N'as2.s12@fpt.edu.vn',
  N'as2.s13@fpt.edu.vn',
  N'as2.s14@fpt.edu.vn',
  N'as2.s15@fpt.edu.vn',
  N'as2.s16@fpt.edu.vn',
  N'as2.s17@fpt.edu.vn',
  N'as2.s18@fpt.edu.vn'
);

INSERT INTO teams (id, created_at, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, is_recruiting, recruitment_note, version) VALUES
  ('02050000-EEEE-4EEE-8EEE-000000000001', @now, 'C1000002-EEEE-4EEE-8EEE-000000000001', @s10, N'LiveNova', N'CONFIRMED', '02040000-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', 0, N'Demo team', 0),
  ('02050000-EEEE-4EEE-8EEE-000000000002', @now, 'C1000002-EEEE-4EEE-8EEE-000000000001', @s11, N'LiveOrbit', N'CONFIRMED', '02040000-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', 0, N'Demo team', 0),
  ('02050000-EEEE-4EEE-8EEE-000000000003', @now, 'C1000002-EEEE-4EEE-8EEE-000000000001', @s12, N'LiveQuark', N'CONFIRMED', '02040000-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', 0, N'Demo team', 0),
  ('02050000-EEEE-4EEE-8EEE-000000000004', @now, 'C1000002-EEEE-4EEE-8EEE-000000000001', @s13, N'LivePulse', N'CONFIRMED', '02040000-EEEE-4EEE-8EEE-000000000002', @now, N'MANUAL', 0, N'Demo team', 0),
  ('02050000-EEEE-4EEE-8EEE-000000000005', @now, 'C1000002-EEEE-4EEE-8EEE-000000000001', @s14, N'LiveVector', N'CONFIRMED', '02040000-EEEE-4EEE-8EEE-000000000002', @now, N'MANUAL', 0, N'Demo team', 0),
  ('02050000-EEEE-4EEE-8EEE-000000000006', @now, 'C1000002-EEEE-4EEE-8EEE-000000000001', @s15, N'LivePrism', N'CONFIRMED', '02040000-EEEE-4EEE-8EEE-000000000002', @now, N'MANUAL', 0, N'Demo team', 0),
  ('02050000-EEEE-4EEE-8EEE-000000000007', @now, 'C1000002-EEEE-4EEE-8EEE-000000000001', @s16, N'LiveNexus', N'CONFIRMED', '02040000-EEEE-4EEE-8EEE-000000000003', @now, N'MANUAL', 0, N'Demo team', 0),
  ('02050000-EEEE-4EEE-8EEE-000000000008', @now, 'C1000002-EEEE-4EEE-8EEE-000000000001', @s17, N'LiveSpark', N'CONFIRMED', '02040000-EEEE-4EEE-8EEE-000000000003', @now, N'MANUAL', 0, N'Demo team', 0),
  ('02050000-EEEE-4EEE-8EEE-000000000009', @now, 'C1000002-EEEE-4EEE-8EEE-000000000001', @s18, N'LiveAxiom', N'CONFIRMED', '02040000-EEEE-4EEE-8EEE-000000000003', @now, N'MANUAL', 0, N'Demo team', 0);

INSERT INTO team_members (id, created_at, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @now, N'LEADER', @s10, '02050000-EEEE-4EEE-8EEE-000000000001', 'C1000002-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, N'LEADER', @s11, '02050000-EEEE-4EEE-8EEE-000000000002', 'C1000002-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, N'LEADER', @s12, '02050000-EEEE-4EEE-8EEE-000000000003', 'C1000002-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, N'LEADER', @s13, '02050000-EEEE-4EEE-8EEE-000000000004', 'C1000002-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, N'LEADER', @s14, '02050000-EEEE-4EEE-8EEE-000000000005', 'C1000002-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, N'LEADER', @s15, '02050000-EEEE-4EEE-8EEE-000000000006', 'C1000002-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, N'LEADER', @s16, '02050000-EEEE-4EEE-8EEE-000000000007', 'C1000002-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, N'LEADER', @s17, '02050000-EEEE-4EEE-8EEE-000000000008', 'C1000002-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, N'LEADER', @s18, '02050000-EEEE-4EEE-8EEE-000000000009', 'C1000002-EEEE-4EEE-8EEE-000000000001');

INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id) VALUES
  (NEWID(), @now, @now, @j1, 'C1000002-EEEE-4EEE-8EEE-000000000001'), (NEWID(), @now, @now, @j2, 'C1000002-EEEE-4EEE-8EEE-000000000001'), (NEWID(), @now, @now, @j3, 'C1000002-EEEE-4EEE-8EEE-000000000001');
INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active) VALUES
  (NEWID(), @now, @now, @j1, '02030000-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1), (NEWID(), @now, @now, @j2, '02030000-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1), (NEWID(), @now, @now, @j3, '02030000-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1),
  (NEWID(), @now, @now, @j1, '02030000-EEEE-4EEE-8EEE-000000000002', N'ROUND', 1), (NEWID(), @now, @now, @j2, '02030000-EEEE-4EEE-8EEE-000000000002', N'ROUND', 1), (NEWID(), @now, @now, @j3, '02030000-EEEE-4EEE-8EEE-000000000002', N'ROUND', 1);
INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at) VALUES (NEWID(), 'C1000002-EEEE-4EEE-8EEE-000000000001', @mentorId, @now, @now);
INSERT INTO mentor_assignments (id, created_at, assigned_at, mentor_user_id, event_id, track_id) VALUES
  (NEWID(), @now, @now, @mentorId, 'C1000002-EEEE-4EEE-8EEE-000000000001', '02040000-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, @mentorId, 'C1000002-EEEE-4EEE-8EEE-000000000001', '02040000-EEEE-4EEE-8EEE-000000000002'),
  (NEWID(), @now, @now, @mentorId, 'C1000002-EEEE-4EEE-8EEE-000000000001', '02040000-EEEE-4EEE-8EEE-000000000003');
INSERT INTO mentor_teams (id, created_at, assigned_at, mentor_user_id, team_id) VALUES
  (NEWID(), @now, @now, @mentorId, '02050000-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, @mentorId, '02050000-EEEE-4EEE-8EEE-000000000002'),
  (NEWID(), @now, @now, @mentorId, '02050000-EEEE-4EEE-8EEE-000000000003'),
  (NEWID(), @now, @now, @mentorId, '02050000-EEEE-4EEE-8EEE-000000000004'),
  (NEWID(), @now, @now, @mentorId, '02050000-EEEE-4EEE-8EEE-000000000005'),
  (NEWID(), @now, @now, @mentorId, '02050000-EEEE-4EEE-8EEE-000000000006'),
  (NEWID(), @now, @now, @mentorId, '02050000-EEEE-4EEE-8EEE-000000000007'),
  (NEWID(), @now, @now, @mentorId, '02050000-EEEE-4EEE-8EEE-000000000008'),
  (NEWID(), @now, @now, @mentorId, '02050000-EEEE-4EEE-8EEE-000000000009');

INSERT INTO submissions (id, created_at, current_version_id, round_id, status, submitted_by, team_id, opt_lock) VALUES
  ('020D0000-EEEE-4EEE-8EEE-000000000001', @now, NULL, '02030000-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', @s10, '02050000-EEEE-4EEE-8EEE-000000000001', 0),
  ('020D0000-EEEE-4EEE-8EEE-000000000002', @now, NULL, '02030000-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', @s11, '02050000-EEEE-4EEE-8EEE-000000000002', 0),
  ('020D0000-EEEE-4EEE-8EEE-000000000003', @now, NULL, '02030000-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', @s12, '02050000-EEEE-4EEE-8EEE-000000000003', 0),
  ('020D0000-EEEE-4EEE-8EEE-000000000004', @now, NULL, '02030000-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', @s13, '02050000-EEEE-4EEE-8EEE-000000000004', 0),
  ('020D0000-EEEE-4EEE-8EEE-000000000005', @now, NULL, '02030000-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', @s14, '02050000-EEEE-4EEE-8EEE-000000000005', 0),
  ('020D0000-EEEE-4EEE-8EEE-000000000006', @now, NULL, '02030000-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', @s15, '02050000-EEEE-4EEE-8EEE-000000000006', 0),
  ('020D0000-EEEE-4EEE-8EEE-000000000007', @now, NULL, '02030000-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', @s16, '02050000-EEEE-4EEE-8EEE-000000000007', 0),
  ('020D0000-EEEE-4EEE-8EEE-000000000008', @now, NULL, '02030000-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', @s17, '02050000-EEEE-4EEE-8EEE-000000000008', 0),
  ('020D0000-EEEE-4EEE-8EEE-000000000009', @now, NULL, '02030000-EEEE-4EEE-8EEE-000000000001', N'SUBMITTED', @s18, '02050000-EEEE-4EEE-8EEE-000000000009', 0);
INSERT INTO submission_versions (id, created_at, demo_url, github_url, slide_url, submitted_at, version_number, submission_id) VALUES
  ('020E0000-EEEE-4EEE-8EEE-000000000001', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/livenova', N'https://docs.google.com/presentation/d/livenova', DATEADD(HOUR, -14, @now), 1, '020D0000-EEEE-4EEE-8EEE-000000000001'),
  ('020E0000-EEEE-4EEE-8EEE-000000000002', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/liveorbit', N'https://docs.google.com/presentation/d/liveorbit', DATEADD(HOUR, -15, @now), 1, '020D0000-EEEE-4EEE-8EEE-000000000002'),
  ('020E0000-EEEE-4EEE-8EEE-000000000003', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/livequark', N'https://docs.google.com/presentation/d/livequark', DATEADD(HOUR, -16, @now), 1, '020D0000-EEEE-4EEE-8EEE-000000000003'),
  ('020E0000-EEEE-4EEE-8EEE-000000000004', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/livepulse', N'https://docs.google.com/presentation/d/livepulse', DATEADD(HOUR, -17, @now), 1, '020D0000-EEEE-4EEE-8EEE-000000000004'),
  ('020E0000-EEEE-4EEE-8EEE-000000000005', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/livevector', N'https://docs.google.com/presentation/d/livevector', DATEADD(HOUR, -18, @now), 1, '020D0000-EEEE-4EEE-8EEE-000000000005'),
  ('020E0000-EEEE-4EEE-8EEE-000000000006', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/liveprism', N'https://docs.google.com/presentation/d/liveprism', DATEADD(HOUR, -19, @now), 1, '020D0000-EEEE-4EEE-8EEE-000000000006'),
  ('020E0000-EEEE-4EEE-8EEE-000000000007', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/livenexus', N'https://docs.google.com/presentation/d/livenexus', DATEADD(HOUR, -20, @now), 1, '020D0000-EEEE-4EEE-8EEE-000000000007'),
  ('020E0000-EEEE-4EEE-8EEE-000000000008', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/livespark', N'https://docs.google.com/presentation/d/livespark', DATEADD(HOUR, -21, @now), 1, '020D0000-EEEE-4EEE-8EEE-000000000008'),
  ('020E0000-EEEE-4EEE-8EEE-000000000009', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/liveaxiom', N'https://docs.google.com/presentation/d/liveaxiom', DATEADD(HOUR, -22, @now), 1, '020D0000-EEEE-4EEE-8EEE-000000000009');
UPDATE submissions SET current_version_id='020E0000-EEEE-4EEE-8EEE-000000000001' WHERE id='020D0000-EEEE-4EEE-8EEE-000000000001';
UPDATE submissions SET current_version_id='020E0000-EEEE-4EEE-8EEE-000000000002' WHERE id='020D0000-EEEE-4EEE-8EEE-000000000002';
UPDATE submissions SET current_version_id='020E0000-EEEE-4EEE-8EEE-000000000003' WHERE id='020D0000-EEEE-4EEE-8EEE-000000000003';
UPDATE submissions SET current_version_id='020E0000-EEEE-4EEE-8EEE-000000000004' WHERE id='020D0000-EEEE-4EEE-8EEE-000000000004';
UPDATE submissions SET current_version_id='020E0000-EEEE-4EEE-8EEE-000000000005' WHERE id='020D0000-EEEE-4EEE-8EEE-000000000005';
UPDATE submissions SET current_version_id='020E0000-EEEE-4EEE-8EEE-000000000006' WHERE id='020D0000-EEEE-4EEE-8EEE-000000000006';
UPDATE submissions SET current_version_id='020E0000-EEEE-4EEE-8EEE-000000000007' WHERE id='020D0000-EEEE-4EEE-8EEE-000000000007';
UPDATE submissions SET current_version_id='020E0000-EEEE-4EEE-8EEE-000000000008' WHERE id='020D0000-EEEE-4EEE-8EEE-000000000008';
UPDATE submissions SET current_version_id='020E0000-EEEE-4EEE-8EEE-000000000009' WHERE id='020D0000-EEEE-4EEE-8EEE-000000000009';

INSERT INTO judge_scores (id, created_at, completed_at, judge_user_id, round_id, started_at, status, submission_id, version) VALUES
  ('020F0000-EEEE-4EEE-8EEE-000000000001', @now, @now, @j1, '02030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000001', 0),
  ('020F0000-EEEE-4EEE-8EEE-000000000002', @now, @now, @j2, '02030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000001', 0),
  ('020F0000-EEEE-4EEE-8EEE-000000000003', @now, @now, @j3, '02030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000001', 0),
  ('020F0000-EEEE-4EEE-8EEE-000000000004', @now, @now, @j1, '02030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000002', 0),
  ('020F0000-EEEE-4EEE-8EEE-000000000005', @now, @now, @j2, '02030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000002', 0),
  ('020F0000-EEEE-4EEE-8EEE-000000000006', @now, @now, @j3, '02030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000002', 0),
  ('020F0000-EEEE-4EEE-8EEE-000000000007', @now, @now, @j1, '02030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000003', 0),
  ('020F0000-EEEE-4EEE-8EEE-000000000008', @now, @now, @j2, '02030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000003', 0),
  ('020F0000-EEEE-4EEE-8EEE-000000000009', @now, @now, @j3, '02030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000003', 0),
  ('020F0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, @j1, '02030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000004', 0),
  ('020F0000-EEEE-4EEE-8EEE-00000000000B', @now, @now, @j2, '02030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000004', 0),
  ('020F0000-EEEE-4EEE-8EEE-00000000000C', @now, @now, @j3, '02030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000004', 0),
  ('020F0000-EEEE-4EEE-8EEE-00000000000D', @now, @now, @j1, '02030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000005', 0),
  ('020F0000-EEEE-4EEE-8EEE-00000000000E', @now, @now, @j2, '02030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000005', 0),
  ('020F0000-EEEE-4EEE-8EEE-00000000000F', @now, @now, @j3, '02030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000005', 0),
  ('020F0000-EEEE-4EEE-8EEE-000000000010', @now, @now, @j1, '02030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000006', 0),
  ('020F0000-EEEE-4EEE-8EEE-000000000011', @now, NULL, @j2, '02030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'IN_PROGRESS', '020D0000-EEEE-4EEE-8EEE-000000000006', 0),
  ('020F0000-EEEE-4EEE-8EEE-000000000012', @now, @now, @j1, '02030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000007', 0);
INSERT INTO judge_score_details (id, created_at, criteria_id, score, judge_score_id) VALUES
  ('02100000-EEEE-4EEE-8EEE-000000000001', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 5, '020F0000-EEEE-4EEE-8EEE-000000000001'),
  ('02100000-EEEE-4EEE-8EEE-000000000002', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 5, '020F0000-EEEE-4EEE-8EEE-000000000001'),
  ('02100000-EEEE-4EEE-8EEE-000000000003', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 5, '020F0000-EEEE-4EEE-8EEE-000000000001'),
  ('02100000-EEEE-4EEE-8EEE-000000000004', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 4, '020F0000-EEEE-4EEE-8EEE-000000000001'),
  ('02100000-EEEE-4EEE-8EEE-000000000005', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 4, '020F0000-EEEE-4EEE-8EEE-000000000002'),
  ('02100000-EEEE-4EEE-8EEE-000000000006', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 5, '020F0000-EEEE-4EEE-8EEE-000000000002'),
  ('02100000-EEEE-4EEE-8EEE-000000000007', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 4, '020F0000-EEEE-4EEE-8EEE-000000000002'),
  ('02100000-EEEE-4EEE-8EEE-000000000008', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 4, '020F0000-EEEE-4EEE-8EEE-000000000002'),
  ('02100000-EEEE-4EEE-8EEE-000000000009', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 5, '020F0000-EEEE-4EEE-8EEE-000000000003'),
  ('02100000-EEEE-4EEE-8EEE-00000000000A', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 5, '020F0000-EEEE-4EEE-8EEE-000000000003'),
  ('02100000-EEEE-4EEE-8EEE-00000000000B', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 5, '020F0000-EEEE-4EEE-8EEE-000000000003'),
  ('02100000-EEEE-4EEE-8EEE-00000000000C', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 4, '020F0000-EEEE-4EEE-8EEE-000000000003'),
  ('02100000-EEEE-4EEE-8EEE-00000000000D', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 5, '020F0000-EEEE-4EEE-8EEE-000000000004'),
  ('02100000-EEEE-4EEE-8EEE-00000000000E', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 4, '020F0000-EEEE-4EEE-8EEE-000000000004'),
  ('02100000-EEEE-4EEE-8EEE-00000000000F', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 5, '020F0000-EEEE-4EEE-8EEE-000000000004'),
  ('02100000-EEEE-4EEE-8EEE-000000000010', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 4, '020F0000-EEEE-4EEE-8EEE-000000000004'),
  ('02100000-EEEE-4EEE-8EEE-000000000011', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 5, '020F0000-EEEE-4EEE-8EEE-000000000005'),
  ('02100000-EEEE-4EEE-8EEE-000000000012', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 4, '020F0000-EEEE-4EEE-8EEE-000000000005'),
  ('02100000-EEEE-4EEE-8EEE-000000000013', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 5, '020F0000-EEEE-4EEE-8EEE-000000000005'),
  ('02100000-EEEE-4EEE-8EEE-000000000014', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 4, '020F0000-EEEE-4EEE-8EEE-000000000005'),
  ('02100000-EEEE-4EEE-8EEE-000000000015', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 4, '020F0000-EEEE-4EEE-8EEE-000000000006'),
  ('02100000-EEEE-4EEE-8EEE-000000000016', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 4, '020F0000-EEEE-4EEE-8EEE-000000000006'),
  ('02100000-EEEE-4EEE-8EEE-000000000017', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 4, '020F0000-EEEE-4EEE-8EEE-000000000006'),
  ('02100000-EEEE-4EEE-8EEE-000000000018', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 4, '020F0000-EEEE-4EEE-8EEE-000000000006'),
  ('02100000-EEEE-4EEE-8EEE-000000000019', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 4, '020F0000-EEEE-4EEE-8EEE-000000000007'),
  ('02100000-EEEE-4EEE-8EEE-00000000001A', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 5, '020F0000-EEEE-4EEE-8EEE-000000000007'),
  ('02100000-EEEE-4EEE-8EEE-00000000001B', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 4, '020F0000-EEEE-4EEE-8EEE-000000000007'),
  ('02100000-EEEE-4EEE-8EEE-00000000001C', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 4, '020F0000-EEEE-4EEE-8EEE-000000000007'),
  ('02100000-EEEE-4EEE-8EEE-00000000001D', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 3, '020F0000-EEEE-4EEE-8EEE-000000000008'),
  ('02100000-EEEE-4EEE-8EEE-00000000001E', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 5, '020F0000-EEEE-4EEE-8EEE-000000000008'),
  ('02100000-EEEE-4EEE-8EEE-00000000001F', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 3, '020F0000-EEEE-4EEE-8EEE-000000000008'),
  ('02100000-EEEE-4EEE-8EEE-000000000020', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 4, '020F0000-EEEE-4EEE-8EEE-000000000008'),
  ('02100000-EEEE-4EEE-8EEE-000000000021', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 3, '020F0000-EEEE-4EEE-8EEE-000000000009'),
  ('02100000-EEEE-4EEE-8EEE-000000000022', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 5, '020F0000-EEEE-4EEE-8EEE-000000000009'),
  ('02100000-EEEE-4EEE-8EEE-000000000023', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 3, '020F0000-EEEE-4EEE-8EEE-000000000009'),
  ('02100000-EEEE-4EEE-8EEE-000000000024', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 4, '020F0000-EEEE-4EEE-8EEE-000000000009'),
  ('02100000-EEEE-4EEE-8EEE-000000000025', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 4, '020F0000-EEEE-4EEE-8EEE-00000000000A'),
  ('02100000-EEEE-4EEE-8EEE-000000000026', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 4, '020F0000-EEEE-4EEE-8EEE-00000000000A'),
  ('02100000-EEEE-4EEE-8EEE-000000000027', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 5, '020F0000-EEEE-4EEE-8EEE-00000000000A'),
  ('02100000-EEEE-4EEE-8EEE-000000000028', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 4, '020F0000-EEEE-4EEE-8EEE-00000000000A'),
  ('02100000-EEEE-4EEE-8EEE-000000000029', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 4, '020F0000-EEEE-4EEE-8EEE-00000000000B'),
  ('02100000-EEEE-4EEE-8EEE-00000000002A', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 4, '020F0000-EEEE-4EEE-8EEE-00000000000B'),
  ('02100000-EEEE-4EEE-8EEE-00000000002B', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 5, '020F0000-EEEE-4EEE-8EEE-00000000000B'),
  ('02100000-EEEE-4EEE-8EEE-00000000002C', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 4, '020F0000-EEEE-4EEE-8EEE-00000000000B'),
  ('02100000-EEEE-4EEE-8EEE-00000000002D', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 4, '020F0000-EEEE-4EEE-8EEE-00000000000C'),
  ('02100000-EEEE-4EEE-8EEE-00000000002E', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 4, '020F0000-EEEE-4EEE-8EEE-00000000000C'),
  ('02100000-EEEE-4EEE-8EEE-00000000002F', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 5, '020F0000-EEEE-4EEE-8EEE-00000000000C'),
  ('02100000-EEEE-4EEE-8EEE-000000000030', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 4, '020F0000-EEEE-4EEE-8EEE-00000000000C'),
  ('02100000-EEEE-4EEE-8EEE-000000000031', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 4, '020F0000-EEEE-4EEE-8EEE-00000000000D'),
  ('02100000-EEEE-4EEE-8EEE-000000000032', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 4, '020F0000-EEEE-4EEE-8EEE-00000000000D'),
  ('02100000-EEEE-4EEE-8EEE-000000000033', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 4, '020F0000-EEEE-4EEE-8EEE-00000000000D'),
  ('02100000-EEEE-4EEE-8EEE-000000000034', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 3, '020F0000-EEEE-4EEE-8EEE-00000000000D'),
  ('02100000-EEEE-4EEE-8EEE-000000000035', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 3, '020F0000-EEEE-4EEE-8EEE-00000000000E'),
  ('02100000-EEEE-4EEE-8EEE-000000000036', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 4, '020F0000-EEEE-4EEE-8EEE-00000000000E'),
  ('02100000-EEEE-4EEE-8EEE-000000000037', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 3, '020F0000-EEEE-4EEE-8EEE-00000000000E'),
  ('02100000-EEEE-4EEE-8EEE-000000000038', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 3, '020F0000-EEEE-4EEE-8EEE-00000000000E'),
  ('02100000-EEEE-4EEE-8EEE-000000000039', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 3, '020F0000-EEEE-4EEE-8EEE-00000000000F'),
  ('02100000-EEEE-4EEE-8EEE-00000000003A', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 4, '020F0000-EEEE-4EEE-8EEE-00000000000F'),
  ('02100000-EEEE-4EEE-8EEE-00000000003B', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 3, '020F0000-EEEE-4EEE-8EEE-00000000000F'),
  ('02100000-EEEE-4EEE-8EEE-00000000003C', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 3, '020F0000-EEEE-4EEE-8EEE-00000000000F'),
  ('02100000-EEEE-4EEE-8EEE-00000000003D', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 4, '020F0000-EEEE-4EEE-8EEE-000000000010'),
  ('02100000-EEEE-4EEE-8EEE-00000000003E', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 3, '020F0000-EEEE-4EEE-8EEE-000000000010'),
  ('02100000-EEEE-4EEE-8EEE-00000000003F', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 4, '020F0000-EEEE-4EEE-8EEE-000000000010'),
  ('02100000-EEEE-4EEE-8EEE-000000000040', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 4, '020F0000-EEEE-4EEE-8EEE-000000000010'),
  ('02100000-EEEE-4EEE-8EEE-000000000041', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 4, '020F0000-EEEE-4EEE-8EEE-000000000011'),
  ('02100000-EEEE-4EEE-8EEE-000000000042', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 3, '020F0000-EEEE-4EEE-8EEE-000000000011'),
  ('02100000-EEEE-4EEE-8EEE-000000000043', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 3, '020F0000-EEEE-4EEE-8EEE-000000000012'),
  ('02100000-EEEE-4EEE-8EEE-000000000044', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 4, '020F0000-EEEE-4EEE-8EEE-000000000012'),
  ('02100000-EEEE-4EEE-8EEE-000000000045', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 3, '020F0000-EEEE-4EEE-8EEE-000000000012'),
  ('02100000-EEEE-4EEE-8EEE-000000000046', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 4, '020F0000-EEEE-4EEE-8EEE-000000000012');

INSERT INTO rankings (id, created_at, calculated_at, final_score, rank, round_id, team_id, version, lock_version) VALUES
  ('02160000-EEEE-4EEE-8EEE-000000000001', @now, @now, 4.6333, 1, '02030000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000001', 1, 0),
  ('02160000-EEEE-4EEE-8EEE-000000000002', @now, @now, 4.3233, 2, '02030000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000002', 1, 0),
  ('02160000-EEEE-4EEE-8EEE-000000000003', @now, @now, 4.2300, 3, '02030000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000004', 1, 0),
  ('02160000-EEEE-4EEE-8EEE-000000000004', @now, @now, 3.9367, 4, '02030000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000003', 1, 0),
  ('02160000-EEEE-4EEE-8EEE-000000000005', @now, @now, 3.4167, 5, '02030000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000005', 1, 0);

-- LiveScore demo: preliminary scoring in progress — 5 teams ranked, 4 still waiting.

-- === AS2 Completed Demo - Published Final Results ===
INSERT INTO hackathon_events (
  id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at
) VALUES (
  'C1000003-EEEE-4EEE-8EEE-000000000001', N'AS2 Completed Demo - Published Final Results', N'Spring', 2026,
  '2026-04-12', '2026-04-12', '2026-01-10', '2026-03-20',
  N'AS2 demo event', N'FPT University HCM', N'OFFLINE', N'GENERIC',
  1, 5, 1, 9, @templateId, N'COMPLETED', 1, @coordId, N'coordinator@seal.com', @now, @now
);

INSERT INTO tracks (id, event_id, name, description, max_teams, status, created_at, updated_at) VALUES
  ('03040000-EEEE-4EEE-8EEE-000000000001', 'C1000003-EEEE-4EEE-8EEE-000000000001', N'Grounded Retrieval', N'Track Grounded Retrieval', 8, N'OPEN', @now, @now),
  ('03040000-EEEE-4EEE-8EEE-000000000002', 'C1000003-EEEE-4EEE-8EEE-000000000001', N'Agent Orchestration', N'Track Agent Orchestration', 8, N'OPEN', @now, @now),
  ('03040000-EEEE-4EEE-8EEE-000000000003', 'C1000003-EEEE-4EEE-8EEE-000000000001', N'Enterprise Copilot', N'Track Enterprise Copilot', 8, N'OPEN', @now, @now);

INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, created_at, updated_at) VALUES
  ('03030000-EEEE-4EEE-8EEE-000000000001', 'C1000003-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', N'PRELIMINARY', '2026-04-12T07:00:00', '2026-04-12T15:30:00', '2026-04-12T10:00:00', '2026-04-12T14:00:00', '2026-04-12T15:30:00', 2, N'PER_TRACK_TOP_N', 40, @now, @now),
  ('03030000-EEEE-4EEE-8EEE-000000000002', 'C1000003-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', N'FINAL', '2026-04-12T15:30:00', '2026-04-12T17:00:00', NULL, '2026-04-12T15:30:00', '2026-04-12T17:00:00', 6, N'FINALIST_POOL', 60, @now, @now);

INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at) VALUES
  ('03060000-EEEE-4EEE-8EEE-000000000001', '03030000-EEEE-4EEE-8EEE-000000000001', N'Innovation', N'Innovation', 25, 0, 1, 5, @now, @now),
  ('03060000-EEEE-4EEE-8EEE-000000000002', '03030000-EEEE-4EEE-8EEE-000000000001', N'Technical', N'Technical', 30, 1, 1, 5, @now, @now),
  ('03060000-EEEE-4EEE-8EEE-000000000003', '03030000-EEEE-4EEE-8EEE-000000000001', N'Business Value', N'Business Value', 25, 2, 1, 5, @now, @now),
  ('03060000-EEEE-4EEE-8EEE-000000000004', '03030000-EEEE-4EEE-8EEE-000000000001', N'Presentation', N'Presentation', 20, 3, 1, 5, @now, @now),
  ('03060000-EEEE-4EEE-8EEE-00000000000B', '03030000-EEEE-4EEE-8EEE-000000000002', N'Innovation', N'Innovation', 25, 0, 1, 5, @now, @now),
  ('03060000-EEEE-4EEE-8EEE-00000000000C', '03030000-EEEE-4EEE-8EEE-000000000002', N'Technical', N'Technical', 30, 1, 1, 5, @now, @now),
  ('03060000-EEEE-4EEE-8EEE-00000000000D', '03030000-EEEE-4EEE-8EEE-000000000002', N'Business Value', N'Business Value', 25, 2, 1, 5, @now, @now),
  ('03060000-EEEE-4EEE-8EEE-00000000000E', '03030000-EEEE-4EEE-8EEE-000000000002', N'Presentation', N'Presentation', 20, 3, 1, 5, @now, @now);

INSERT INTO prizes (id, event_id, rank, value, quantity, label, created_at, updated_at) VALUES
  ('03070000-EEEE-4EEE-8EEE-000000000001', 'C1000003-EEEE-4EEE-8EEE-000000000001', N'FIRST', N'7000000', 1, N'First Prize', @now, @now),
  ('03070000-EEEE-4EEE-8EEE-000000000002', 'C1000003-EEEE-4EEE-8EEE-000000000001', N'SECOND', N'5000000', 1, N'Second Prize', @now, @now),
  ('03070000-EEEE-4EEE-8EEE-000000000003', 'C1000003-EEEE-4EEE-8EEE-000000000001', N'THIRD', N'3000000', 1, N'Third Prize', @now, @now),
  ('03070000-EEEE-4EEE-8EEE-000000000004', 'C1000003-EEEE-4EEE-8EEE-000000000001', N'CONSOLATION', N'1500000', 1, N'Consolation Prize', @now, @now);

INSERT INTO event_enrollments (id, created_at, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, @now, 'C1000003-EEEE-4EEE-8EEE-000000000001', N'APPROVED', u.id, 0, 0 FROM users u WHERE u.email IN (
  N'as2.s19@fpt.edu.vn',
  N'as2.s20@fpt.edu.vn',
  N'as2.s21@fpt.edu.vn',
  N'as2.s22@fpt.edu.vn',
  N'as2.s23@fpt.edu.vn',
  N'as2.s24@fpt.edu.vn',
  N'as2.s25@fpt.edu.vn',
  N'as2.s26@fpt.edu.vn',
  N'as2.s27@fpt.edu.vn'
);

INSERT INTO teams (id, created_at, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, is_recruiting, recruitment_note, version) VALUES
  ('03050000-EEEE-4EEE-8EEE-000000000001', @now, 'C1000003-EEEE-4EEE-8EEE-000000000001', @s19, N'DoneApex', N'CONFIRMED', '03040000-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', 0, N'Demo team', 0),
  ('03050000-EEEE-4EEE-8EEE-000000000002', @now, 'C1000003-EEEE-4EEE-8EEE-000000000001', @s20, N'DoneBolt', N'CONFIRMED', '03040000-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', 0, N'Demo team', 0),
  ('03050000-EEEE-4EEE-8EEE-000000000003', @now, 'C1000003-EEEE-4EEE-8EEE-000000000001', @s21, N'DoneCrest', N'CONFIRMED', '03040000-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', 0, N'Demo team', 0),
  ('03050000-EEEE-4EEE-8EEE-000000000004', @now, 'C1000003-EEEE-4EEE-8EEE-000000000001', @s22, N'DoneDrift', N'CONFIRMED', '03040000-EEEE-4EEE-8EEE-000000000002', @now, N'MANUAL', 0, N'Demo team', 0),
  ('03050000-EEEE-4EEE-8EEE-000000000005', @now, 'C1000003-EEEE-4EEE-8EEE-000000000001', @s23, N'DoneEcho', N'CONFIRMED', '03040000-EEEE-4EEE-8EEE-000000000002', @now, N'MANUAL', 0, N'Demo team', 0),
  ('03050000-EEEE-4EEE-8EEE-000000000006', @now, 'C1000003-EEEE-4EEE-8EEE-000000000001', @s24, N'DoneFlux', N'CONFIRMED', '03040000-EEEE-4EEE-8EEE-000000000002', @now, N'MANUAL', 0, N'Demo team', 0),
  ('03050000-EEEE-4EEE-8EEE-000000000007', @now, 'C1000003-EEEE-4EEE-8EEE-000000000001', @s25, N'DoneGlow', N'CONFIRMED', '03040000-EEEE-4EEE-8EEE-000000000003', @now, N'MANUAL', 0, N'Demo team', 0),
  ('03050000-EEEE-4EEE-8EEE-000000000008', @now, 'C1000003-EEEE-4EEE-8EEE-000000000001', @s26, N'DoneHalo', N'CONFIRMED', '03040000-EEEE-4EEE-8EEE-000000000003', @now, N'MANUAL', 0, N'Demo team', 0),
  ('03050000-EEEE-4EEE-8EEE-000000000009', @now, 'C1000003-EEEE-4EEE-8EEE-000000000001', @s27, N'DoneIon', N'CONFIRMED', '03040000-EEEE-4EEE-8EEE-000000000003', @now, N'MANUAL', 0, N'Demo team', 0);

INSERT INTO team_members (id, created_at, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, @now, N'LEADER', @s19, '03050000-EEEE-4EEE-8EEE-000000000001', 'C1000003-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, N'LEADER', @s20, '03050000-EEEE-4EEE-8EEE-000000000002', 'C1000003-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, N'LEADER', @s21, '03050000-EEEE-4EEE-8EEE-000000000003', 'C1000003-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, N'LEADER', @s22, '03050000-EEEE-4EEE-8EEE-000000000004', 'C1000003-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, N'LEADER', @s23, '03050000-EEEE-4EEE-8EEE-000000000005', 'C1000003-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, N'LEADER', @s24, '03050000-EEEE-4EEE-8EEE-000000000006', 'C1000003-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, N'LEADER', @s25, '03050000-EEEE-4EEE-8EEE-000000000007', 'C1000003-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, N'LEADER', @s26, '03050000-EEEE-4EEE-8EEE-000000000008', 'C1000003-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, N'LEADER', @s27, '03050000-EEEE-4EEE-8EEE-000000000009', 'C1000003-EEEE-4EEE-8EEE-000000000001');

INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id) VALUES
  (NEWID(), @now, @now, @j1, 'C1000003-EEEE-4EEE-8EEE-000000000001'), (NEWID(), @now, @now, @j2, 'C1000003-EEEE-4EEE-8EEE-000000000001'), (NEWID(), @now, @now, @j3, 'C1000003-EEEE-4EEE-8EEE-000000000001');
INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active) VALUES
  (NEWID(), @now, @now, @j1, '03030000-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1), (NEWID(), @now, @now, @j2, '03030000-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1), (NEWID(), @now, @now, @j3, '03030000-EEEE-4EEE-8EEE-000000000001', N'ROUND', 1),
  (NEWID(), @now, @now, @j1, '03030000-EEEE-4EEE-8EEE-000000000002', N'ROUND', 1), (NEWID(), @now, @now, @j2, '03030000-EEEE-4EEE-8EEE-000000000002', N'ROUND', 1), (NEWID(), @now, @now, @j3, '03030000-EEEE-4EEE-8EEE-000000000002', N'ROUND', 1);
INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at) VALUES (NEWID(), 'C1000003-EEEE-4EEE-8EEE-000000000001', @mentorId, @now, @now);
INSERT INTO mentor_assignments (id, created_at, assigned_at, mentor_user_id, event_id, track_id) VALUES
  (NEWID(), @now, @now, @mentorId, 'C1000003-EEEE-4EEE-8EEE-000000000001', '03040000-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, @mentorId, 'C1000003-EEEE-4EEE-8EEE-000000000001', '03040000-EEEE-4EEE-8EEE-000000000002'),
  (NEWID(), @now, @now, @mentorId, 'C1000003-EEEE-4EEE-8EEE-000000000001', '03040000-EEEE-4EEE-8EEE-000000000003');
INSERT INTO mentor_teams (id, created_at, assigned_at, mentor_user_id, team_id) VALUES
  (NEWID(), @now, @now, @mentorId, '03050000-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, @now, @mentorId, '03050000-EEEE-4EEE-8EEE-000000000002'),
  (NEWID(), @now, @now, @mentorId, '03050000-EEEE-4EEE-8EEE-000000000003'),
  (NEWID(), @now, @now, @mentorId, '03050000-EEEE-4EEE-8EEE-000000000004'),
  (NEWID(), @now, @now, @mentorId, '03050000-EEEE-4EEE-8EEE-000000000005'),
  (NEWID(), @now, @now, @mentorId, '03050000-EEEE-4EEE-8EEE-000000000006'),
  (NEWID(), @now, @now, @mentorId, '03050000-EEEE-4EEE-8EEE-000000000007'),
  (NEWID(), @now, @now, @mentorId, '03050000-EEEE-4EEE-8EEE-000000000008'),
  (NEWID(), @now, @now, @mentorId, '03050000-EEEE-4EEE-8EEE-000000000009');

INSERT INTO submissions (id, created_at, current_version_id, round_id, status, submitted_by, team_id, opt_lock) VALUES
  ('030D0000-EEEE-4EEE-8EEE-000000000001', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000001', N'SCORED', @s19, '03050000-EEEE-4EEE-8EEE-000000000001', 0),
  ('030D0000-EEEE-4EEE-8EEE-000000000002', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000001', N'SCORED', @s20, '03050000-EEEE-4EEE-8EEE-000000000002', 0),
  ('030D0000-EEEE-4EEE-8EEE-000000000003', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000001', N'SCORED', @s21, '03050000-EEEE-4EEE-8EEE-000000000003', 0),
  ('030D0000-EEEE-4EEE-8EEE-000000000004', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000001', N'SCORED', @s22, '03050000-EEEE-4EEE-8EEE-000000000004', 0),
  ('030D0000-EEEE-4EEE-8EEE-000000000005', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000001', N'SCORED', @s23, '03050000-EEEE-4EEE-8EEE-000000000005', 0),
  ('030D0000-EEEE-4EEE-8EEE-000000000006', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000001', N'SCORED', @s24, '03050000-EEEE-4EEE-8EEE-000000000006', 0),
  ('030D0000-EEEE-4EEE-8EEE-000000000007', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000001', N'SCORED', @s25, '03050000-EEEE-4EEE-8EEE-000000000007', 0),
  ('030D0000-EEEE-4EEE-8EEE-000000000008', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000001', N'SCORED', @s26, '03050000-EEEE-4EEE-8EEE-000000000008', 0),
  ('030D0000-EEEE-4EEE-8EEE-000000000009', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000001', N'SCORED', @s27, '03050000-EEEE-4EEE-8EEE-000000000009', 0),
  ('030D0000-EEEE-4EEE-8EEE-00000000000A', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000002', N'SCORED', @s19, '03050000-EEEE-4EEE-8EEE-000000000001', 0),
  ('030D0000-EEEE-4EEE-8EEE-00000000000B', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000002', N'SCORED', @s20, '03050000-EEEE-4EEE-8EEE-000000000002', 0),
  ('030D0000-EEEE-4EEE-8EEE-00000000000C', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000002', N'SCORED', @s22, '03050000-EEEE-4EEE-8EEE-000000000004', 0),
  ('030D0000-EEEE-4EEE-8EEE-00000000000D', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000002', N'SCORED', @s24, '03050000-EEEE-4EEE-8EEE-000000000006', 0),
  ('030D0000-EEEE-4EEE-8EEE-00000000000E', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000002', N'SCORED', @s25, '03050000-EEEE-4EEE-8EEE-000000000007', 0),
  ('030D0000-EEEE-4EEE-8EEE-00000000000F', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000002', N'SCORED', @s26, '03050000-EEEE-4EEE-8EEE-000000000008', 0);
INSERT INTO submission_versions (id, created_at, demo_url, github_url, slide_url, submitted_at, version_number, submission_id) VALUES
  ('030E0000-EEEE-4EEE-8EEE-000000000001', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/doneapex', N'https://docs.google.com/presentation/d/doneapex', '2026-04-12T13:30:00', 1, '030D0000-EEEE-4EEE-8EEE-000000000001'),
  ('030E0000-EEEE-4EEE-8EEE-000000000002', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/donebolt', N'https://docs.google.com/presentation/d/donebolt', '2026-04-12T13:31:00', 1, '030D0000-EEEE-4EEE-8EEE-000000000002'),
  ('030E0000-EEEE-4EEE-8EEE-000000000003', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/donecrest', N'https://docs.google.com/presentation/d/donecrest', '2026-04-12T13:32:00', 1, '030D0000-EEEE-4EEE-8EEE-000000000003'),
  ('030E0000-EEEE-4EEE-8EEE-000000000004', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/donedrift', N'https://docs.google.com/presentation/d/donedrift', '2026-04-12T13:33:00', 1, '030D0000-EEEE-4EEE-8EEE-000000000004'),
  ('030E0000-EEEE-4EEE-8EEE-000000000005', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/doneecho', N'https://docs.google.com/presentation/d/doneecho', '2026-04-12T13:34:00', 1, '030D0000-EEEE-4EEE-8EEE-000000000005'),
  ('030E0000-EEEE-4EEE-8EEE-000000000006', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/doneflux', N'https://docs.google.com/presentation/d/doneflux', '2026-04-12T13:35:00', 1, '030D0000-EEEE-4EEE-8EEE-000000000006'),
  ('030E0000-EEEE-4EEE-8EEE-000000000007', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/doneglow', N'https://docs.google.com/presentation/d/doneglow', '2026-04-12T13:36:00', 1, '030D0000-EEEE-4EEE-8EEE-000000000007'),
  ('030E0000-EEEE-4EEE-8EEE-000000000008', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/donehalo', N'https://docs.google.com/presentation/d/donehalo', '2026-04-12T13:37:00', 1, '030D0000-EEEE-4EEE-8EEE-000000000008'),
  ('030E0000-EEEE-4EEE-8EEE-000000000009', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/doneion', N'https://docs.google.com/presentation/d/doneion', '2026-04-12T13:38:00', 1, '030D0000-EEEE-4EEE-8EEE-000000000009'),
  ('030E0000-EEEE-4EEE-8EEE-00000000000A', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/doneapex', N'https://docs.google.com/presentation/d/doneapex', '2026-04-12T13:39:00', 1, '030D0000-EEEE-4EEE-8EEE-00000000000A'),
  ('030E0000-EEEE-4EEE-8EEE-00000000000B', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/donebolt', N'https://docs.google.com/presentation/d/donebolt', '2026-04-12T13:40:00', 1, '030D0000-EEEE-4EEE-8EEE-00000000000B'),
  ('030E0000-EEEE-4EEE-8EEE-00000000000C', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/donedrift', N'https://docs.google.com/presentation/d/donedrift', '2026-04-12T13:41:00', 1, '030D0000-EEEE-4EEE-8EEE-00000000000C'),
  ('030E0000-EEEE-4EEE-8EEE-00000000000D', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/doneflux', N'https://docs.google.com/presentation/d/doneflux', '2026-04-12T13:42:00', 1, '030D0000-EEEE-4EEE-8EEE-00000000000D'),
  ('030E0000-EEEE-4EEE-8EEE-00000000000E', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/doneglow', N'https://docs.google.com/presentation/d/doneglow', '2026-04-12T13:43:00', 1, '030D0000-EEEE-4EEE-8EEE-00000000000E'),
  ('030E0000-EEEE-4EEE-8EEE-00000000000F', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/donehalo', N'https://docs.google.com/presentation/d/donehalo', '2026-04-12T13:44:00', 1, '030D0000-EEEE-4EEE-8EEE-00000000000F');
UPDATE submissions SET current_version_id='030E0000-EEEE-4EEE-8EEE-000000000001' WHERE id='030D0000-EEEE-4EEE-8EEE-000000000001';
UPDATE submissions SET current_version_id='030E0000-EEEE-4EEE-8EEE-000000000002' WHERE id='030D0000-EEEE-4EEE-8EEE-000000000002';
UPDATE submissions SET current_version_id='030E0000-EEEE-4EEE-8EEE-000000000003' WHERE id='030D0000-EEEE-4EEE-8EEE-000000000003';
UPDATE submissions SET current_version_id='030E0000-EEEE-4EEE-8EEE-000000000004' WHERE id='030D0000-EEEE-4EEE-8EEE-000000000004';
UPDATE submissions SET current_version_id='030E0000-EEEE-4EEE-8EEE-000000000005' WHERE id='030D0000-EEEE-4EEE-8EEE-000000000005';
UPDATE submissions SET current_version_id='030E0000-EEEE-4EEE-8EEE-000000000006' WHERE id='030D0000-EEEE-4EEE-8EEE-000000000006';
UPDATE submissions SET current_version_id='030E0000-EEEE-4EEE-8EEE-000000000007' WHERE id='030D0000-EEEE-4EEE-8EEE-000000000007';
UPDATE submissions SET current_version_id='030E0000-EEEE-4EEE-8EEE-000000000008' WHERE id='030D0000-EEEE-4EEE-8EEE-000000000008';
UPDATE submissions SET current_version_id='030E0000-EEEE-4EEE-8EEE-000000000009' WHERE id='030D0000-EEEE-4EEE-8EEE-000000000009';
UPDATE submissions SET current_version_id='030E0000-EEEE-4EEE-8EEE-00000000000A' WHERE id='030D0000-EEEE-4EEE-8EEE-00000000000A';
UPDATE submissions SET current_version_id='030E0000-EEEE-4EEE-8EEE-00000000000B' WHERE id='030D0000-EEEE-4EEE-8EEE-00000000000B';
UPDATE submissions SET current_version_id='030E0000-EEEE-4EEE-8EEE-00000000000C' WHERE id='030D0000-EEEE-4EEE-8EEE-00000000000C';
UPDATE submissions SET current_version_id='030E0000-EEEE-4EEE-8EEE-00000000000D' WHERE id='030D0000-EEEE-4EEE-8EEE-00000000000D';
UPDATE submissions SET current_version_id='030E0000-EEEE-4EEE-8EEE-00000000000E' WHERE id='030D0000-EEEE-4EEE-8EEE-00000000000E';
UPDATE submissions SET current_version_id='030E0000-EEEE-4EEE-8EEE-00000000000F' WHERE id='030D0000-EEEE-4EEE-8EEE-00000000000F';

INSERT INTO judge_scores (id, created_at, completed_at, judge_user_id, round_id, started_at, status, submission_id, version) VALUES
  ('030F0000-EEEE-4EEE-8EEE-000000000001', @now, @now, @j1, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000001', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000002', @now, @now, @j2, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000001', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000003', @now, @now, @j3, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000001', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000004', @now, @now, @j1, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000002', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000005', @now, @now, @j2, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000002', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000006', @now, @now, @j3, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000002', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000007', @now, @now, @j1, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000003', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000008', @now, @now, @j2, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000003', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000009', @now, @now, @j3, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000003', 0),
  ('030F0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, @j1, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000004', 0),
  ('030F0000-EEEE-4EEE-8EEE-00000000000B', @now, @now, @j2, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000004', 0),
  ('030F0000-EEEE-4EEE-8EEE-00000000000C', @now, @now, @j3, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000004', 0),
  ('030F0000-EEEE-4EEE-8EEE-00000000000D', @now, @now, @j1, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000005', 0),
  ('030F0000-EEEE-4EEE-8EEE-00000000000E', @now, @now, @j2, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000005', 0),
  ('030F0000-EEEE-4EEE-8EEE-00000000000F', @now, @now, @j3, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000005', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000010', @now, @now, @j1, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000006', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000011', @now, @now, @j2, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000006', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000012', @now, @now, @j3, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000006', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000013', @now, @now, @j1, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000007', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000014', @now, @now, @j2, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000007', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000015', @now, @now, @j3, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000007', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000016', @now, @now, @j1, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000008', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000017', @now, @now, @j2, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000008', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000018', @now, @now, @j3, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000008', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000019', @now, @now, @j1, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000009', 0),
  ('030F0000-EEEE-4EEE-8EEE-00000000001A', @now, @now, @j2, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000009', 0),
  ('030F0000-EEEE-4EEE-8EEE-00000000001B', @now, @now, @j3, '03030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR,-2,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000009', 0),
  ('030F0000-EEEE-4EEE-8EEE-00000000001C', @now, @now, @j1, '03030000-EEEE-4EEE-8EEE-000000000002', DATEADD(HOUR,-1,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000A', 0),
  ('030F0000-EEEE-4EEE-8EEE-00000000001D', @now, @now, @j2, '03030000-EEEE-4EEE-8EEE-000000000002', DATEADD(HOUR,-1,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000A', 0),
  ('030F0000-EEEE-4EEE-8EEE-00000000001E', @now, @now, @j3, '03030000-EEEE-4EEE-8EEE-000000000002', DATEADD(HOUR,-1,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000A', 0),
  ('030F0000-EEEE-4EEE-8EEE-00000000001F', @now, @now, @j1, '03030000-EEEE-4EEE-8EEE-000000000002', DATEADD(HOUR,-1,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000B', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000020', @now, @now, @j2, '03030000-EEEE-4EEE-8EEE-000000000002', DATEADD(HOUR,-1,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000B', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000021', @now, @now, @j3, '03030000-EEEE-4EEE-8EEE-000000000002', DATEADD(HOUR,-1,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000B', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000022', @now, @now, @j1, '03030000-EEEE-4EEE-8EEE-000000000002', DATEADD(HOUR,-1,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000C', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000023', @now, @now, @j2, '03030000-EEEE-4EEE-8EEE-000000000002', DATEADD(HOUR,-1,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000C', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000024', @now, @now, @j3, '03030000-EEEE-4EEE-8EEE-000000000002', DATEADD(HOUR,-1,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000C', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000025', @now, @now, @j1, '03030000-EEEE-4EEE-8EEE-000000000002', DATEADD(HOUR,-1,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000D', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000026', @now, @now, @j2, '03030000-EEEE-4EEE-8EEE-000000000002', DATEADD(HOUR,-1,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000D', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000027', @now, @now, @j3, '03030000-EEEE-4EEE-8EEE-000000000002', DATEADD(HOUR,-1,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000D', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000028', @now, @now, @j1, '03030000-EEEE-4EEE-8EEE-000000000002', DATEADD(HOUR,-1,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000E', 0),
  ('030F0000-EEEE-4EEE-8EEE-000000000029', @now, @now, @j2, '03030000-EEEE-4EEE-8EEE-000000000002', DATEADD(HOUR,-1,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000E', 0),
  ('030F0000-EEEE-4EEE-8EEE-00000000002A', @now, @now, @j3, '03030000-EEEE-4EEE-8EEE-000000000002', DATEADD(HOUR,-1,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000E', 0),
  ('030F0000-EEEE-4EEE-8EEE-00000000002B', @now, @now, @j1, '03030000-EEEE-4EEE-8EEE-000000000002', DATEADD(HOUR,-1,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000F', 0),
  ('030F0000-EEEE-4EEE-8EEE-00000000002C', @now, @now, @j2, '03030000-EEEE-4EEE-8EEE-000000000002', DATEADD(HOUR,-1,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000F', 0),
  ('030F0000-EEEE-4EEE-8EEE-00000000002D', @now, @now, @j3, '03030000-EEEE-4EEE-8EEE-000000000002', DATEADD(HOUR,-1,@now), N'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000F', 0);
INSERT INTO judge_score_details (id, created_at, criteria_id, score, judge_score_id) VALUES
  ('03100000-EEEE-4EEE-8EEE-000000000001', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 5, '030F0000-EEEE-4EEE-8EEE-000000000001'),
  ('03100000-EEEE-4EEE-8EEE-000000000002', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 5, '030F0000-EEEE-4EEE-8EEE-000000000001'),
  ('03100000-EEEE-4EEE-8EEE-000000000003', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 5, '030F0000-EEEE-4EEE-8EEE-000000000001'),
  ('03100000-EEEE-4EEE-8EEE-000000000004', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-000000000001'),
  ('03100000-EEEE-4EEE-8EEE-000000000005', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 4, '030F0000-EEEE-4EEE-8EEE-000000000002'),
  ('03100000-EEEE-4EEE-8EEE-000000000006', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 5, '030F0000-EEEE-4EEE-8EEE-000000000002'),
  ('03100000-EEEE-4EEE-8EEE-000000000007', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 4, '030F0000-EEEE-4EEE-8EEE-000000000002'),
  ('03100000-EEEE-4EEE-8EEE-000000000008', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-000000000002'),
  ('03100000-EEEE-4EEE-8EEE-000000000009', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 5, '030F0000-EEEE-4EEE-8EEE-000000000003'),
  ('03100000-EEEE-4EEE-8EEE-00000000000A', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 5, '030F0000-EEEE-4EEE-8EEE-000000000003'),
  ('03100000-EEEE-4EEE-8EEE-00000000000B', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 5, '030F0000-EEEE-4EEE-8EEE-000000000003'),
  ('03100000-EEEE-4EEE-8EEE-00000000000C', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-000000000003'),
  ('03100000-EEEE-4EEE-8EEE-00000000000D', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 5, '030F0000-EEEE-4EEE-8EEE-000000000004'),
  ('03100000-EEEE-4EEE-8EEE-00000000000E', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 4, '030F0000-EEEE-4EEE-8EEE-000000000004'),
  ('03100000-EEEE-4EEE-8EEE-00000000000F', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 5, '030F0000-EEEE-4EEE-8EEE-000000000004'),
  ('03100000-EEEE-4EEE-8EEE-000000000010', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-000000000004'),
  ('03100000-EEEE-4EEE-8EEE-000000000011', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 5, '030F0000-EEEE-4EEE-8EEE-000000000005'),
  ('03100000-EEEE-4EEE-8EEE-000000000012', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 4, '030F0000-EEEE-4EEE-8EEE-000000000005'),
  ('03100000-EEEE-4EEE-8EEE-000000000013', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 5, '030F0000-EEEE-4EEE-8EEE-000000000005'),
  ('03100000-EEEE-4EEE-8EEE-000000000014', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-000000000005'),
  ('03100000-EEEE-4EEE-8EEE-000000000015', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 4, '030F0000-EEEE-4EEE-8EEE-000000000006'),
  ('03100000-EEEE-4EEE-8EEE-000000000016', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 4, '030F0000-EEEE-4EEE-8EEE-000000000006'),
  ('03100000-EEEE-4EEE-8EEE-000000000017', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 4, '030F0000-EEEE-4EEE-8EEE-000000000006'),
  ('03100000-EEEE-4EEE-8EEE-000000000018', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-000000000006'),
  ('03100000-EEEE-4EEE-8EEE-000000000019', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 4, '030F0000-EEEE-4EEE-8EEE-000000000007'),
  ('03100000-EEEE-4EEE-8EEE-00000000001A', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 5, '030F0000-EEEE-4EEE-8EEE-000000000007'),
  ('03100000-EEEE-4EEE-8EEE-00000000001B', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 4, '030F0000-EEEE-4EEE-8EEE-000000000007'),
  ('03100000-EEEE-4EEE-8EEE-00000000001C', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-000000000007'),
  ('03100000-EEEE-4EEE-8EEE-00000000001D', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 3, '030F0000-EEEE-4EEE-8EEE-000000000008'),
  ('03100000-EEEE-4EEE-8EEE-00000000001E', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 5, '030F0000-EEEE-4EEE-8EEE-000000000008'),
  ('03100000-EEEE-4EEE-8EEE-00000000001F', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 3, '030F0000-EEEE-4EEE-8EEE-000000000008'),
  ('03100000-EEEE-4EEE-8EEE-000000000020', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-000000000008'),
  ('03100000-EEEE-4EEE-8EEE-000000000021', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 3, '030F0000-EEEE-4EEE-8EEE-000000000009'),
  ('03100000-EEEE-4EEE-8EEE-000000000022', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 5, '030F0000-EEEE-4EEE-8EEE-000000000009'),
  ('03100000-EEEE-4EEE-8EEE-000000000023', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 3, '030F0000-EEEE-4EEE-8EEE-000000000009'),
  ('03100000-EEEE-4EEE-8EEE-000000000024', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-000000000009'),
  ('03100000-EEEE-4EEE-8EEE-000000000025', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 4, '030F0000-EEEE-4EEE-8EEE-00000000000A'),
  ('03100000-EEEE-4EEE-8EEE-000000000026', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 4, '030F0000-EEEE-4EEE-8EEE-00000000000A'),
  ('03100000-EEEE-4EEE-8EEE-000000000027', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 5, '030F0000-EEEE-4EEE-8EEE-00000000000A'),
  ('03100000-EEEE-4EEE-8EEE-000000000028', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-00000000000A'),
  ('03100000-EEEE-4EEE-8EEE-000000000029', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 4, '030F0000-EEEE-4EEE-8EEE-00000000000B'),
  ('03100000-EEEE-4EEE-8EEE-00000000002A', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 4, '030F0000-EEEE-4EEE-8EEE-00000000000B'),
  ('03100000-EEEE-4EEE-8EEE-00000000002B', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 5, '030F0000-EEEE-4EEE-8EEE-00000000000B'),
  ('03100000-EEEE-4EEE-8EEE-00000000002C', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-00000000000B'),
  ('03100000-EEEE-4EEE-8EEE-00000000002D', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 4, '030F0000-EEEE-4EEE-8EEE-00000000000C'),
  ('03100000-EEEE-4EEE-8EEE-00000000002E', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 4, '030F0000-EEEE-4EEE-8EEE-00000000000C'),
  ('03100000-EEEE-4EEE-8EEE-00000000002F', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 5, '030F0000-EEEE-4EEE-8EEE-00000000000C'),
  ('03100000-EEEE-4EEE-8EEE-000000000030', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-00000000000C'),
  ('03100000-EEEE-4EEE-8EEE-000000000031', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 4, '030F0000-EEEE-4EEE-8EEE-00000000000D'),
  ('03100000-EEEE-4EEE-8EEE-000000000032', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 4, '030F0000-EEEE-4EEE-8EEE-00000000000D'),
  ('03100000-EEEE-4EEE-8EEE-000000000033', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 4, '030F0000-EEEE-4EEE-8EEE-00000000000D'),
  ('03100000-EEEE-4EEE-8EEE-000000000034', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 3, '030F0000-EEEE-4EEE-8EEE-00000000000D'),
  ('03100000-EEEE-4EEE-8EEE-000000000035', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 3, '030F0000-EEEE-4EEE-8EEE-00000000000E'),
  ('03100000-EEEE-4EEE-8EEE-000000000036', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 4, '030F0000-EEEE-4EEE-8EEE-00000000000E'),
  ('03100000-EEEE-4EEE-8EEE-000000000037', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 3, '030F0000-EEEE-4EEE-8EEE-00000000000E'),
  ('03100000-EEEE-4EEE-8EEE-000000000038', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 3, '030F0000-EEEE-4EEE-8EEE-00000000000E'),
  ('03100000-EEEE-4EEE-8EEE-000000000039', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 3, '030F0000-EEEE-4EEE-8EEE-00000000000F'),
  ('03100000-EEEE-4EEE-8EEE-00000000003A', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 4, '030F0000-EEEE-4EEE-8EEE-00000000000F'),
  ('03100000-EEEE-4EEE-8EEE-00000000003B', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 3, '030F0000-EEEE-4EEE-8EEE-00000000000F'),
  ('03100000-EEEE-4EEE-8EEE-00000000003C', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 3, '030F0000-EEEE-4EEE-8EEE-00000000000F'),
  ('03100000-EEEE-4EEE-8EEE-00000000003D', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 4, '030F0000-EEEE-4EEE-8EEE-000000000010'),
  ('03100000-EEEE-4EEE-8EEE-00000000003E', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 3, '030F0000-EEEE-4EEE-8EEE-000000000010'),
  ('03100000-EEEE-4EEE-8EEE-00000000003F', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 4, '030F0000-EEEE-4EEE-8EEE-000000000010'),
  ('03100000-EEEE-4EEE-8EEE-000000000040', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-000000000010'),
  ('03100000-EEEE-4EEE-8EEE-000000000041', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 4, '030F0000-EEEE-4EEE-8EEE-000000000011'),
  ('03100000-EEEE-4EEE-8EEE-000000000042', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 3, '030F0000-EEEE-4EEE-8EEE-000000000011'),
  ('03100000-EEEE-4EEE-8EEE-000000000043', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 4, '030F0000-EEEE-4EEE-8EEE-000000000011'),
  ('03100000-EEEE-4EEE-8EEE-000000000044', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-000000000011'),
  ('03100000-EEEE-4EEE-8EEE-000000000045', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 3, '030F0000-EEEE-4EEE-8EEE-000000000012'),
  ('03100000-EEEE-4EEE-8EEE-000000000046', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 3, '030F0000-EEEE-4EEE-8EEE-000000000012'),
  ('03100000-EEEE-4EEE-8EEE-000000000047', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 3, '030F0000-EEEE-4EEE-8EEE-000000000012'),
  ('03100000-EEEE-4EEE-8EEE-000000000048', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-000000000012'),
  ('03100000-EEEE-4EEE-8EEE-000000000049', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 3, '030F0000-EEEE-4EEE-8EEE-000000000013'),
  ('03100000-EEEE-4EEE-8EEE-00000000004A', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 4, '030F0000-EEEE-4EEE-8EEE-000000000013'),
  ('03100000-EEEE-4EEE-8EEE-00000000004B', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 3, '030F0000-EEEE-4EEE-8EEE-000000000013'),
  ('03100000-EEEE-4EEE-8EEE-00000000004C', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-000000000013'),
  ('03100000-EEEE-4EEE-8EEE-00000000004D', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 2, '030F0000-EEEE-4EEE-8EEE-000000000014'),
  ('03100000-EEEE-4EEE-8EEE-00000000004E', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 4, '030F0000-EEEE-4EEE-8EEE-000000000014'),
  ('03100000-EEEE-4EEE-8EEE-00000000004F', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 2, '030F0000-EEEE-4EEE-8EEE-000000000014'),
  ('03100000-EEEE-4EEE-8EEE-000000000050', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-000000000014'),
  ('03100000-EEEE-4EEE-8EEE-000000000051', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 3, '030F0000-EEEE-4EEE-8EEE-000000000015'),
  ('03100000-EEEE-4EEE-8EEE-000000000052', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 4, '030F0000-EEEE-4EEE-8EEE-000000000015'),
  ('03100000-EEEE-4EEE-8EEE-000000000053', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 3, '030F0000-EEEE-4EEE-8EEE-000000000015'),
  ('03100000-EEEE-4EEE-8EEE-000000000054', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-000000000015'),
  ('03100000-EEEE-4EEE-8EEE-000000000055', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 3, '030F0000-EEEE-4EEE-8EEE-000000000016'),
  ('03100000-EEEE-4EEE-8EEE-000000000056', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 3, '030F0000-EEEE-4EEE-8EEE-000000000016'),
  ('03100000-EEEE-4EEE-8EEE-000000000057', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 4, '030F0000-EEEE-4EEE-8EEE-000000000016'),
  ('03100000-EEEE-4EEE-8EEE-000000000058', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 3, '030F0000-EEEE-4EEE-8EEE-000000000016'),
  ('03100000-EEEE-4EEE-8EEE-000000000059', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 3, '030F0000-EEEE-4EEE-8EEE-000000000017'),
  ('03100000-EEEE-4EEE-8EEE-00000000005A', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 3, '030F0000-EEEE-4EEE-8EEE-000000000017'),
  ('03100000-EEEE-4EEE-8EEE-00000000005B', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 4, '030F0000-EEEE-4EEE-8EEE-000000000017'),
  ('03100000-EEEE-4EEE-8EEE-00000000005C', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 3, '030F0000-EEEE-4EEE-8EEE-000000000017'),
  ('03100000-EEEE-4EEE-8EEE-00000000005D', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 2, '030F0000-EEEE-4EEE-8EEE-000000000018'),
  ('03100000-EEEE-4EEE-8EEE-00000000005E', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 3, '030F0000-EEEE-4EEE-8EEE-000000000018'),
  ('03100000-EEEE-4EEE-8EEE-00000000005F', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 3, '030F0000-EEEE-4EEE-8EEE-000000000018'),
  ('03100000-EEEE-4EEE-8EEE-000000000060', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 3, '030F0000-EEEE-4EEE-8EEE-000000000018'),
  ('03100000-EEEE-4EEE-8EEE-000000000061', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 3, '030F0000-EEEE-4EEE-8EEE-000000000019'),
  ('03100000-EEEE-4EEE-8EEE-000000000062', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 3, '030F0000-EEEE-4EEE-8EEE-000000000019'),
  ('03100000-EEEE-4EEE-8EEE-000000000063', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 3, '030F0000-EEEE-4EEE-8EEE-000000000019'),
  ('03100000-EEEE-4EEE-8EEE-000000000064', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 3, '030F0000-EEEE-4EEE-8EEE-000000000019'),
  ('03100000-EEEE-4EEE-8EEE-000000000065', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 2, '030F0000-EEEE-4EEE-8EEE-00000000001A'),
  ('03100000-EEEE-4EEE-8EEE-000000000066', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 3, '030F0000-EEEE-4EEE-8EEE-00000000001A'),
  ('03100000-EEEE-4EEE-8EEE-000000000067', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 2, '030F0000-EEEE-4EEE-8EEE-00000000001A'),
  ('03100000-EEEE-4EEE-8EEE-000000000068', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 3, '030F0000-EEEE-4EEE-8EEE-00000000001A'),
  ('03100000-EEEE-4EEE-8EEE-000000000069', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 2, '030F0000-EEEE-4EEE-8EEE-00000000001B'),
  ('03100000-EEEE-4EEE-8EEE-00000000006A', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 3, '030F0000-EEEE-4EEE-8EEE-00000000001B'),
  ('03100000-EEEE-4EEE-8EEE-00000000006B', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 2, '030F0000-EEEE-4EEE-8EEE-00000000001B'),
  ('03100000-EEEE-4EEE-8EEE-00000000006C', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 3, '030F0000-EEEE-4EEE-8EEE-00000000001B'),
  ('03100000-EEEE-4EEE-8EEE-00000000006D', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 5, '030F0000-EEEE-4EEE-8EEE-00000000001C'),
  ('03100000-EEEE-4EEE-8EEE-00000000006E', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 5, '030F0000-EEEE-4EEE-8EEE-00000000001C'),
  ('03100000-EEEE-4EEE-8EEE-00000000006F', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 5, '030F0000-EEEE-4EEE-8EEE-00000000001C'),
  ('03100000-EEEE-4EEE-8EEE-000000000070', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 5, '030F0000-EEEE-4EEE-8EEE-00000000001C'),
  ('03100000-EEEE-4EEE-8EEE-000000000071', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 5, '030F0000-EEEE-4EEE-8EEE-00000000001D'),
  ('03100000-EEEE-4EEE-8EEE-000000000072', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 5, '030F0000-EEEE-4EEE-8EEE-00000000001D'),
  ('03100000-EEEE-4EEE-8EEE-000000000073', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 5, '030F0000-EEEE-4EEE-8EEE-00000000001D'),
  ('03100000-EEEE-4EEE-8EEE-000000000074', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 5, '030F0000-EEEE-4EEE-8EEE-00000000001D'),
  ('03100000-EEEE-4EEE-8EEE-000000000075', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 4, '030F0000-EEEE-4EEE-8EEE-00000000001E'),
  ('03100000-EEEE-4EEE-8EEE-000000000076', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 5, '030F0000-EEEE-4EEE-8EEE-00000000001E'),
  ('03100000-EEEE-4EEE-8EEE-000000000077', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 4, '030F0000-EEEE-4EEE-8EEE-00000000001E'),
  ('03100000-EEEE-4EEE-8EEE-000000000078', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 5, '030F0000-EEEE-4EEE-8EEE-00000000001E'),
  ('03100000-EEEE-4EEE-8EEE-000000000079', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 5, '030F0000-EEEE-4EEE-8EEE-00000000001F'),
  ('03100000-EEEE-4EEE-8EEE-00000000007A', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 5, '030F0000-EEEE-4EEE-8EEE-00000000001F'),
  ('03100000-EEEE-4EEE-8EEE-00000000007B', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 4, '030F0000-EEEE-4EEE-8EEE-00000000001F'),
  ('03100000-EEEE-4EEE-8EEE-00000000007C', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 5, '030F0000-EEEE-4EEE-8EEE-00000000001F'),
  ('03100000-EEEE-4EEE-8EEE-00000000007D', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 4, '030F0000-EEEE-4EEE-8EEE-000000000020'),
  ('03100000-EEEE-4EEE-8EEE-00000000007E', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 5, '030F0000-EEEE-4EEE-8EEE-000000000020'),
  ('03100000-EEEE-4EEE-8EEE-00000000007F', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 3, '030F0000-EEEE-4EEE-8EEE-000000000020'),
  ('03100000-EEEE-4EEE-8EEE-000000000080', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 5, '030F0000-EEEE-4EEE-8EEE-000000000020'),
  ('03100000-EEEE-4EEE-8EEE-000000000081', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 5, '030F0000-EEEE-4EEE-8EEE-000000000021'),
  ('03100000-EEEE-4EEE-8EEE-000000000082', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 5, '030F0000-EEEE-4EEE-8EEE-000000000021'),
  ('03100000-EEEE-4EEE-8EEE-000000000083', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 4, '030F0000-EEEE-4EEE-8EEE-000000000021'),
  ('03100000-EEEE-4EEE-8EEE-000000000084', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 5, '030F0000-EEEE-4EEE-8EEE-000000000021'),
  ('03100000-EEEE-4EEE-8EEE-000000000085', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 5, '030F0000-EEEE-4EEE-8EEE-000000000022'),
  ('03100000-EEEE-4EEE-8EEE-000000000086', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 4, '030F0000-EEEE-4EEE-8EEE-000000000022'),
  ('03100000-EEEE-4EEE-8EEE-000000000087', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 5, '030F0000-EEEE-4EEE-8EEE-000000000022'),
  ('03100000-EEEE-4EEE-8EEE-000000000088', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 4, '030F0000-EEEE-4EEE-8EEE-000000000022'),
  ('03100000-EEEE-4EEE-8EEE-000000000089', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 5, '030F0000-EEEE-4EEE-8EEE-000000000023'),
  ('03100000-EEEE-4EEE-8EEE-00000000008A', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 4, '030F0000-EEEE-4EEE-8EEE-000000000023'),
  ('03100000-EEEE-4EEE-8EEE-00000000008B', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 5, '030F0000-EEEE-4EEE-8EEE-000000000023'),
  ('03100000-EEEE-4EEE-8EEE-00000000008C', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 4, '030F0000-EEEE-4EEE-8EEE-000000000023'),
  ('03100000-EEEE-4EEE-8EEE-00000000008D', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 5, '030F0000-EEEE-4EEE-8EEE-000000000024'),
  ('03100000-EEEE-4EEE-8EEE-00000000008E', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 4, '030F0000-EEEE-4EEE-8EEE-000000000024'),
  ('03100000-EEEE-4EEE-8EEE-00000000008F', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 5, '030F0000-EEEE-4EEE-8EEE-000000000024'),
  ('03100000-EEEE-4EEE-8EEE-000000000090', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 4, '030F0000-EEEE-4EEE-8EEE-000000000024'),
  ('03100000-EEEE-4EEE-8EEE-000000000091', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 4, '030F0000-EEEE-4EEE-8EEE-000000000025'),
  ('03100000-EEEE-4EEE-8EEE-000000000092', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 5, '030F0000-EEEE-4EEE-8EEE-000000000025'),
  ('03100000-EEEE-4EEE-8EEE-000000000093', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 4, '030F0000-EEEE-4EEE-8EEE-000000000025'),
  ('03100000-EEEE-4EEE-8EEE-000000000094', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 5, '030F0000-EEEE-4EEE-8EEE-000000000025'),
  ('03100000-EEEE-4EEE-8EEE-000000000095', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 3, '030F0000-EEEE-4EEE-8EEE-000000000026'),
  ('03100000-EEEE-4EEE-8EEE-000000000096', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 5, '030F0000-EEEE-4EEE-8EEE-000000000026'),
  ('03100000-EEEE-4EEE-8EEE-000000000097', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 3, '030F0000-EEEE-4EEE-8EEE-000000000026'),
  ('03100000-EEEE-4EEE-8EEE-000000000098', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 5, '030F0000-EEEE-4EEE-8EEE-000000000026'),
  ('03100000-EEEE-4EEE-8EEE-000000000099', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 3, '030F0000-EEEE-4EEE-8EEE-000000000027'),
  ('03100000-EEEE-4EEE-8EEE-00000000009A', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 5, '030F0000-EEEE-4EEE-8EEE-000000000027'),
  ('03100000-EEEE-4EEE-8EEE-00000000009B', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 3, '030F0000-EEEE-4EEE-8EEE-000000000027'),
  ('03100000-EEEE-4EEE-8EEE-00000000009C', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 5, '030F0000-EEEE-4EEE-8EEE-000000000027'),
  ('03100000-EEEE-4EEE-8EEE-00000000009D', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 4, '030F0000-EEEE-4EEE-8EEE-000000000028'),
  ('03100000-EEEE-4EEE-8EEE-00000000009E', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 4, '030F0000-EEEE-4EEE-8EEE-000000000028'),
  ('03100000-EEEE-4EEE-8EEE-00000000009F', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 5, '030F0000-EEEE-4EEE-8EEE-000000000028'),
  ('03100000-EEEE-4EEE-8EEE-0000000000A0', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 4, '030F0000-EEEE-4EEE-8EEE-000000000028'),
  ('03100000-EEEE-4EEE-8EEE-0000000000A1', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 4, '030F0000-EEEE-4EEE-8EEE-000000000029'),
  ('03100000-EEEE-4EEE-8EEE-0000000000A2', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 4, '030F0000-EEEE-4EEE-8EEE-000000000029'),
  ('03100000-EEEE-4EEE-8EEE-0000000000A3', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 5, '030F0000-EEEE-4EEE-8EEE-000000000029'),
  ('03100000-EEEE-4EEE-8EEE-0000000000A4', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 4, '030F0000-EEEE-4EEE-8EEE-000000000029'),
  ('03100000-EEEE-4EEE-8EEE-0000000000A5', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 4, '030F0000-EEEE-4EEE-8EEE-00000000002A'),
  ('03100000-EEEE-4EEE-8EEE-0000000000A6', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 4, '030F0000-EEEE-4EEE-8EEE-00000000002A'),
  ('03100000-EEEE-4EEE-8EEE-0000000000A7', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 5, '030F0000-EEEE-4EEE-8EEE-00000000002A'),
  ('03100000-EEEE-4EEE-8EEE-0000000000A8', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 4, '030F0000-EEEE-4EEE-8EEE-00000000002A'),
  ('03100000-EEEE-4EEE-8EEE-0000000000A9', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 4, '030F0000-EEEE-4EEE-8EEE-00000000002B'),
  ('03100000-EEEE-4EEE-8EEE-0000000000AA', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 4, '030F0000-EEEE-4EEE-8EEE-00000000002B'),
  ('03100000-EEEE-4EEE-8EEE-0000000000AB', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 4, '030F0000-EEEE-4EEE-8EEE-00000000002B'),
  ('03100000-EEEE-4EEE-8EEE-0000000000AC', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 4, '030F0000-EEEE-4EEE-8EEE-00000000002B'),
  ('03100000-EEEE-4EEE-8EEE-0000000000AD', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 3, '030F0000-EEEE-4EEE-8EEE-00000000002C'),
  ('03100000-EEEE-4EEE-8EEE-0000000000AE', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 4, '030F0000-EEEE-4EEE-8EEE-00000000002C'),
  ('03100000-EEEE-4EEE-8EEE-0000000000AF', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 3, '030F0000-EEEE-4EEE-8EEE-00000000002C'),
  ('03100000-EEEE-4EEE-8EEE-0000000000B0', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 4, '030F0000-EEEE-4EEE-8EEE-00000000002C'),
  ('03100000-EEEE-4EEE-8EEE-0000000000B1', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 4, '030F0000-EEEE-4EEE-8EEE-00000000002D'),
  ('03100000-EEEE-4EEE-8EEE-0000000000B2', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 4, '030F0000-EEEE-4EEE-8EEE-00000000002D'),
  ('03100000-EEEE-4EEE-8EEE-0000000000B3', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 4, '030F0000-EEEE-4EEE-8EEE-00000000002D'),
  ('03100000-EEEE-4EEE-8EEE-0000000000B4', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 4, '030F0000-EEEE-4EEE-8EEE-00000000002D');

INSERT INTO rankings (id, created_at, calculated_at, final_score, rank, round_id, team_id, version, lock_version) VALUES
  ('03160000-EEEE-4EEE-8EEE-000000000001', @now, @now, 4.6333, 1, '03030000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000001', 1, 0),
  ('03160000-EEEE-4EEE-8EEE-000000000002', @now, @now, 4.3233, 2, '03030000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000002', 1, 0),
  ('03160000-EEEE-4EEE-8EEE-000000000003', @now, @now, 4.2300, 3, '03030000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000004', 1, 0),
  ('03160000-EEEE-4EEE-8EEE-000000000004', @now, @now, 3.9367, 4, '03030000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000003', 1, 0),
  ('03160000-EEEE-4EEE-8EEE-000000000005', @now, @now, 3.4933, 5, '03030000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000006', 1, 0),
  ('03160000-EEEE-4EEE-8EEE-000000000006', @now, @now, 3.4167, 6, '03030000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000005', 1, 0),
  ('03160000-EEEE-4EEE-8EEE-000000000007', @now, @now, 3.2733, 7, '03030000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000007', 1, 0),
  ('03160000-EEEE-4EEE-8EEE-000000000008', @now, @now, 3.0133, 8, '03030000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000008', 1, 0),
  ('03160000-EEEE-4EEE-8EEE-000000000009', @now, @now, 2.5867, 9, '03030000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000009', 1, 0);

INSERT INTO rankings (id, created_at, calculated_at, final_score, rank, round_id, team_id, version, lock_version) VALUES
  ('03170000-EEEE-4EEE-8EEE-000000000001', @now, @now, 4.8333, 1, '03030000-EEEE-4EEE-8EEE-000000000002', '03050000-EEEE-4EEE-8EEE-000000000001', 1, 0),
  ('03170000-EEEE-4EEE-8EEE-000000000002', @now, @now, 4.5733, 2, '03030000-EEEE-4EEE-8EEE-000000000002', '03050000-EEEE-4EEE-8EEE-000000000002', 1, 0),
  ('03170000-EEEE-4EEE-8EEE-000000000003', @now, @now, 4.4800, 3, '03030000-EEEE-4EEE-8EEE-000000000002', '03050000-EEEE-4EEE-8EEE-000000000004', 1, 0),
  ('03170000-EEEE-4EEE-8EEE-000000000004', @now, @now, 4.2200, 4, '03030000-EEEE-4EEE-8EEE-000000000002', '03050000-EEEE-4EEE-8EEE-000000000007', 1, 0),
  ('03170000-EEEE-4EEE-8EEE-000000000005', @now, @now, 4.1267, 5, '03030000-EEEE-4EEE-8EEE-000000000002', '03050000-EEEE-4EEE-8EEE-000000000006', 1, 0),
  ('03170000-EEEE-4EEE-8EEE-000000000006', @now, @now, 3.7833, 6, '03030000-EEEE-4EEE-8EEE-000000000002', '03050000-EEEE-4EEE-8EEE-000000000008', 1, 0);

INSERT INTO finalist_selections (id, event_id, team_id, track_id, preliminary_rank, selected_reason, selected_at, created_at, updated_at, selection_method, eligible) VALUES
  ('03180000-EEEE-4EEE-8EEE-000000000001', 'C1000003-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000001', '03040000-EEEE-4EEE-8EEE-000000000001', 1, N'Top 1 in track', @now, @now, @now, N'AUTO', 1),
  ('03180000-EEEE-4EEE-8EEE-000000000002', 'C1000003-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000002', '03040000-EEEE-4EEE-8EEE-000000000001', 2, N'Top 2 in track', @now, @now, @now, N'AUTO', 1),
  ('03180000-EEEE-4EEE-8EEE-000000000003', 'C1000003-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000004', '03040000-EEEE-4EEE-8EEE-000000000002', 1, N'Top 1 in track', @now, @now, @now, N'AUTO', 1),
  ('03180000-EEEE-4EEE-8EEE-000000000004', 'C1000003-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000006', '03040000-EEEE-4EEE-8EEE-000000000002', 2, N'Top 2 in track', @now, @now, @now, N'AUTO', 1),
  ('03180000-EEEE-4EEE-8EEE-000000000005', 'C1000003-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000007', '03040000-EEEE-4EEE-8EEE-000000000003', 1, N'Top 1 in track', @now, @now, @now, N'AUTO', 1),
  ('03180000-EEEE-4EEE-8EEE-000000000006', 'C1000003-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000008', '03040000-EEEE-4EEE-8EEE-000000000003', 2, N'Top 2 in track', @now, @now, @now, N'AUTO', 1);

INSERT INTO published_results (id, created_at, dispute_deadline, published_at, published_by, round_id) VALUES
  ('03190000-EEEE-4EEE-8EEE-000000000001', @now, DATEADD(DAY,2,@now), @now, @coordId, '03030000-EEEE-4EEE-8EEE-000000000001'),
  ('03190000-EEEE-4EEE-8EEE-000000000002', @now, DATEADD(DAY,2,@now), @now, @coordId, '03030000-EEEE-4EEE-8EEE-000000000002');
INSERT INTO team_awards (id, event_id, team_id, prize_id, awarded_at, created_at, updated_at) VALUES
  ('031A0000-EEEE-4EEE-8EEE-000000000001', 'C1000003-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000001', '03070000-EEEE-4EEE-8EEE-000000000001', @now, @now, @now),
  ('031A0000-EEEE-4EEE-8EEE-000000000002', 'C1000003-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000002', '03070000-EEEE-4EEE-8EEE-000000000002', @now, @now, @now),
  ('031A0000-EEEE-4EEE-8EEE-000000000003', 'C1000003-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000004', '03070000-EEEE-4EEE-8EEE-000000000003', @now, @now, @now),
  ('031A0000-EEEE-4EEE-8EEE-000000000004', 'C1000003-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000007', '03070000-EEEE-4EEE-8EEE-000000000004', @now, @now, @now);

COMMIT TRANSACTION;
PRINT 'seed_as2_full_demo.sql complete. Password: 12345678';
PRINT '1) Progress 9 teams: C1000001-EEEE-4EEE-8EEE-000000000001';
PRINT '2) LiveScore 9 teams (not published): C1000002-EEEE-4EEE-8EEE-000000000001';
PRINT '3) Completed published: C1000003-EEEE-4EEE-8EEE-000000000001';
PRINT 'Login: coordinator@seal.com | mentor.lbtest@fpt.edu.vn | as2.s01@fpt.edu.vn | as2.s10@fpt.edu.vn | as2.s19@fpt.edu.vn';
