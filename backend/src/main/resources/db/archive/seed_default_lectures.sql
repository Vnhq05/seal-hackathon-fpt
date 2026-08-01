-- Default Add Lecture pool: 7 judges + 7 mentors on every feature-demo Test event.
-- Password: Demo@123456
-- Idempotent — safe to re-run after reset.
-- Run: sqlcmd -S localhost -U sa -P <pwd> -C -d SEAL -f 65001 -I -i seed_default_lectures.sql

SET NOCOUNT ON; SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON; SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @pwd NVARCHAR(255) = N'$2a$10$7ZqT629/ciaVAXuzx7B0zO.wFlLuVz6NK3/tNioMOWFLb2gPkXeU2';
DECLARE @now DATETIME2 = SYSDATETIME();
DECLARE @ownerEmail NVARCHAR(255) = COALESCE(
  (SELECT email FROM users WHERE email = N'test.coord@fpt.edu.vn'),
  (SELECT TOP 1 email FROM users WHERE email IN (N'admin@seal.com', N'coordinator@seal.com'))
);
IF @ownerEmail IS NULL SET @ownerEmail = N'seed_default_lectures';

DECLARE @staff TABLE (
  id UNIQUEIDENTIFIER NOT NULL,
  email NVARCHAR(255) NOT NULL,
  full_name NVARCHAR(255) NOT NULL,
  kind NVARCHAR(10) NOT NULL
);
INSERT INTO @staff (id, email, full_name, kind) VALUES
  ('FE000000-EEEE-4EEE-8EEE-000000000002', N'test.mentor1@fpt.edu.vn', N'Test Mentor One', N'MENTOR'),
  ('FE000000-EEEE-4EEE-8EEE-000000000008', N'test.mentor2@fpt.edu.vn', N'Test Mentor Two', N'MENTOR'),
  ('FE000000-EEEE-4EEE-8EEE-000000000009', N'test.mentor3@fpt.edu.vn', N'Test Mentor Three', N'MENTOR'),
  ('FE000000-EEEE-4EEE-8EEE-00000000000A', N'test.mentor4@fpt.edu.vn', N'Test Mentor Four', N'MENTOR'),
  ('FE000000-EEEE-4EEE-8EEE-00000000000B', N'test.mentor5@fpt.edu.vn', N'Test Mentor Five', N'MENTOR'),
  ('FE000000-EEEE-4EEE-8EEE-00000000000C', N'test.mentor6@fpt.edu.vn', N'Test Mentor Six', N'MENTOR'),
  ('FE000000-EEEE-4EEE-8EEE-00000000000D', N'test.mentor7@fpt.edu.vn', N'Test Mentor Seven', N'MENTOR'),
  ('FE000000-EEEE-4EEE-8EEE-000000000003', N'test.judge1@fpt.edu.vn', N'Test Judge One', N'JUDGE'),
  ('FE000000-EEEE-4EEE-8EEE-000000000004', N'test.judge2@fpt.edu.vn', N'Test Judge Two', N'JUDGE'),
  ('FE000000-EEEE-4EEE-8EEE-000000000005', N'test.judge3@fpt.edu.vn', N'Test Judge Three (Pending)', N'JUDGE'),
  ('FE000000-EEEE-4EEE-8EEE-00000000000E', N'test.judge4@fpt.edu.vn', N'Test Judge Four', N'JUDGE'),
  ('FE000000-EEEE-4EEE-8EEE-00000000000F', N'test.judge5@fpt.edu.vn', N'Test Judge Five', N'JUDGE'),
  ('FE000000-EEEE-4EEE-8EEE-000000000010', N'test.judge6@fpt.edu.vn', N'Test Judge Six', N'JUDGE'),
  ('FE000000-EEEE-4EEE-8EEE-000000000011', N'test.judge7@fpt.edu.vn', N'Test Judge Seven', N'JUDGE');

-- Upsert lecturer accounts
DECLARE @id UNIQUEIDENTIFIER, @email NVARCHAR(255), @name NVARCHAR(255);
DECLARE c CURSOR LOCAL FAST_FORWARD FOR SELECT id, email, full_name FROM @staff;
OPEN c;
FETCH NEXT FROM c INTO @id, @email, @name;
WHILE @@FETCH_STATUS = 0
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE email = @email)
    UPDATE users SET password_hash=@pwd, full_name=@name, user_type=N'LECTURER', status=N'ACTIVE',
      failed_login_attempts=0, locked_until=NULL, student_id=NULL, university_name=N'FPT University',
      semester=NULL, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail
    WHERE email=@email;
  ELSE
    INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,
      user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,
      created_at,updated_at,created_by,updated_by)
    VALUES (@id,@email,@pwd,@name,NULL,NULL,NULL,N'FPT University',
      N'LECTURER',N'ACTIVE',0,NULL,NULL,N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);
  FETCH NEXT FROM c INTO @id, @email, @name;
END
CLOSE c; DEALLOCATE c;

DECLARE @packEvents TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @packEvents VALUES
  ('FE010100-EEEE-4EEE-8EEE-000000000001'),
  ('FE020100-EEEE-4EEE-8EEE-000000000001'),
  ('FE030100-EEEE-4EEE-8EEE-000000000001'),
  ('FE040100-EEEE-4EEE-8EEE-000000000001'),
  ('FE050100-EEEE-4EEE-8EEE-000000000001'),
  ('FE060100-EEEE-4EEE-8EEE-000000000001'),
  ('FE070100-EEEE-4EEE-8EEE-000000000001'),
  ('FE080100-EEEE-4EEE-8EEE-000000000001');

-- Attach default pools to every existing pack event
INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id, created_by)
SELECT NEWID(), @now, @now, u.id, e.id, @ownerEmail
FROM @packEvents e
CROSS JOIN @staff s
INNER JOIN users u ON u.email = s.email
WHERE s.kind = N'JUDGE'
  AND EXISTS (SELECT 1 FROM hackathon_events he WHERE he.id = e.id)
  AND NOT EXISTS (
    SELECT 1 FROM event_judge_assignments x
    WHERE x.event_id = e.id AND x.judge_user_id = u.id
  );

INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at, created_by)
SELECT NEWID(), e.id, u.id, @now, @now, @ownerEmail
FROM @packEvents e
CROSS JOIN @staff s
INNER JOIN users u ON u.email = s.email
WHERE s.kind = N'MENTOR'
  AND EXISTS (SELECT 1 FROM hackathon_events he WHERE he.id = e.id)
  AND NOT EXISTS (
    SELECT 1 FROM event_mentor_assignments x
    WHERE x.event_id = e.id AND x.mentor_user_id = u.id
  );

COMMIT TRANSACTION;

PRINT 'Default lecture pools ready (password Demo@123456)';
PRINT '  Judges:  test.judge1..7@fpt.edu.vn';
PRINT '  Mentors: test.mentor1..7@fpt.edu.vn';

SELECT e.name,
  (SELECT COUNT(*) FROM event_judge_assignments j WHERE j.event_id = e.id) AS judges,
  (SELECT COUNT(*) FROM event_mentor_assignments m WHERE m.event_id = e.id) AS mentors
FROM hackathon_events e
WHERE e.id IN (SELECT id FROM @packEvents)
ORDER BY e.name;
