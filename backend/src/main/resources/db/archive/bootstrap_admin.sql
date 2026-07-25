-- Creates the one SYSTEM_ADMIN account used to bootstrap a clean database.
--
-- Why this script exists: AuthService.register() only accepts FPT_STUDENT and EXTERNAL_STUDENT,
-- and AdminUserController is @PreAuthorize("hasRole('SYSTEM_ADMIN')"). With no admin row in the
-- database there is no way to create one through the app — this script breaks that cycle.
-- Everything else (coordinators, lecturers, students) is created from the admin UI afterwards.
--
-- Before running:
--   1. Generate a BCrypt hash — from the `backend` directory:
--        mvn -q dependency:build-classpath -Dmdep.outputFile=target/cp.txt
--        java -cp "$(cat target/cp.txt)" tools/GenerateAdminHash.java
--   2. Paste the printed hash into @passwordHash below.
--   3. Keep @adminEmail in sync with app.protected-emails (application.yml,
--      application-dev.properties, .env) so the account cannot be deleted by accident.
--
-- Run: sqlcmd -S localhost -U sa -P <password> -d SEAL -I -i bootstrap_admin.sql
--
-- Re-running is safe: it updates the existing row's password and unlocks it rather than inserting
-- a duplicate, so it doubles as a password reset if you lock yourself out.

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @adminEmail  NVARCHAR(255) = N'admin@seal.com';
DECLARE @fullName    NVARCHAR(255) = N'System Admin';
DECLARE @passwordHash NVARCHAR(255) = N'PASTE_BCRYPT_HASH_HERE';

DECLARE @now DATETIME2 = SYSUTCDATETIME();

IF @passwordHash = N'PASTE_BCRYPT_HASH_HERE'
BEGIN
    RAISERROR('Set @passwordHash first — run tools/GenerateAdminHash.java to produce one.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END

IF @passwordHash NOT LIKE '$2[aby]$%'
BEGIN
    RAISERROR('@passwordHash does not look like a BCrypt hash (expected a $2a$/$2b$/$2y$ prefix).', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END

IF EXISTS (SELECT 1 FROM users WHERE email = @adminEmail)
BEGIN
    UPDATE users
    SET password_hash         = @passwordHash,
        full_name             = @fullName,
        user_type             = 'SYSTEM_ADMIN',
        status                = 'ACTIVE',
        failed_login_attempts = 0,
        locked_until          = NULL,
        student_standing      = 'ENROLLED',
        temporary_account     = 0,
        updated_at            = @now,
        updated_by            = @adminEmail
    WHERE email = @adminEmail;

    PRINT 'Updated existing admin: ' + @adminEmail;
END
ELSE
BEGIN
    INSERT INTO users (
        id, email, password_hash, full_name,
        phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until,
        semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by
    ) VALUES (
        NEWID(), @adminEmail, @passwordHash, @fullName,
        NULL, NULL, NULL, NULL,
        'SYSTEM_ADMIN', 'ACTIVE', 0, NULL,
        NULL, 'ENROLLED', 0,
        @now, @now, @adminEmail, @adminEmail
    );

    PRINT 'Created admin: ' + @adminEmail;
END

COMMIT TRANSACTION;
PRINT 'Log in at /login, then create coordinators and lecturers from the admin UI.';
