-- Quick bootstrap admin for local demo (password: Demo@123456)
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

DECLARE @now DATETIME2 = SYSUTCDATETIME();
DECLARE @hash NVARCHAR(255) = N'$2a$10$7ZqT629/ciaVAXuzx7B0zO.wFlLuVz6NK3/tNioMOWFLb2gPkXeU2';

IF EXISTS (SELECT 1 FROM users WHERE email = N'admin@seal.com')
BEGIN
  UPDATE users SET password_hash=@hash, full_name=N'System Admin', user_type=N'SYSTEM_ADMIN', status=N'ACTIVE',
    failed_login_attempts=0, locked_until=NULL, temporary_account=0, updated_at=@now
  WHERE email=N'admin@seal.com';
END
ELSE
BEGIN
  INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
    user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
    created_at, updated_at, created_by, updated_by)
  VALUES (NEWID(), N'admin@seal.com', @hash, N'System Admin', NULL, NULL, NULL, N'FPT University',
    N'SYSTEM_ADMIN', N'ACTIVE', 0, NULL, NULL, N'ENROLLED', 0, @now, @now, N'bootstrap', N'bootstrap');
END

PRINT 'admin@seal.com ready (Demo@123456)';
