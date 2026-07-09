-- Dev: 4 FPT student accounts for testing events OTHER than Fall Demo.
-- Password matches other dev seeds (12345678) via copied hash from student1@fpt.edu.vn.
-- Default enrollment: SEAL Summer Hackathon P (change @eventName if needed).

SET NOCOUNT ON;
GO

DECLARE @eventName NVARCHAR(255) = N'SEAL Summer Hackathon P';
DECLARE @eventId UNIQUEIDENTIFIER;
DECLARE @now DATETIME2 = SYSUTCDATETIME();
DECLARE @passwordHash NVARCHAR(255);
DECLARE @university NVARCHAR(255);

SELECT @eventId = id FROM hackathon_events WHERE name = @eventName;
IF @eventId IS NULL
BEGIN
    RAISERROR('Event not found: %s', 16, 1, @eventName);
    RETURN;
END;

SELECT @passwordHash = password_hash, @university = university_name
FROM users WHERE email = N'student1@fpt.edu.vn';

IF @passwordHash IS NULL
BEGIN
    RAISERROR('Template user student1@fpt.edu.vn not found. Start backend once with dev profile.', 16, 1);
    RETURN;
END;

DECLARE @students TABLE (
    email NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(255) NOT NULL,
    student_id NVARCHAR(20) NOT NULL,
    semester INT NOT NULL
);

INSERT INTO @students (email, full_name, student_id, semester) VALUES
    (N'teststudent101@fpt.edu.vn', N'Test Student 101', N'SE19100101', 5),
    (N'teststudent102@fpt.edu.vn', N'Test Student 102', N'SE19100102', 5),
    (N'teststudent103@fpt.edu.vn', N'Test Student 103', N'SE19100103', 6),
    (N'teststudent104@fpt.edu.vn', N'Test Student 104', N'SE19100104', 6);

DECLARE @email NVARCHAR(255);
DECLARE @fullName NVARCHAR(255);
DECLARE @studentId NVARCHAR(20);
DECLARE @semester INT;
DECLARE @userId UNIQUEIDENTIFIER;

DECLARE student_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT email, full_name, student_id, semester FROM @students;

OPEN student_cursor;
FETCH NEXT FROM student_cursor INTO @email, @fullName, @studentId, @semester;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @userId = NULL;
    SELECT @userId = id FROM users WHERE email = @email;

    IF @userId IS NULL
    BEGIN
        SET @userId = NEWID();
        INSERT INTO users (
            id, email, password_hash, full_name, student_id, university_name,
            user_type, status, failed_login_attempts, semester, student_standing,
            temporary_account, created_at, updated_at
        ) VALUES (
            @userId, @email, @passwordHash, @fullName, @studentId, @university,
            N'FPT_STUDENT', N'ACTIVE', 0, @semester, N'ENROLLED',
            0, @now, @now
        );
        PRINT 'Created user: ' + @email;
    END
    ELSE
    BEGIN
        UPDATE users
        SET password_hash = @passwordHash,
            status = N'ACTIVE',
            failed_login_attempts = 0,
            locked_until = NULL,
            student_standing = N'ENROLLED',
            updated_at = @now
        WHERE id = @userId;
        PRINT 'Updated user: ' + @email;
    END;

    IF NOT EXISTS (SELECT 1 FROM event_enrollments WHERE user_id = @userId AND event_id = @eventId)
    BEGIN
        INSERT INTO event_enrollments (
            id, user_id, event_id, status, enrolled_at,
            is_looking_for_team, is_profile_public, created_at, updated_at
        ) VALUES (
            NEWID(), @userId, @eventId, N'APPROVED', @now,
            0, 0, @now, @now
        );
        PRINT 'Enrolled: ' + @email + ' -> ' + @eventName;
    END
    ELSE
    BEGIN
        UPDATE event_enrollments
        SET status = N'APPROVED', updated_at = @now
        WHERE user_id = @userId AND event_id = @eventId;
        PRINT 'Enrollment already exists (set APPROVED): ' + @email;
    END;

    FETCH NEXT FROM student_cursor INTO @email, @fullName, @studentId, @semester;
END;

CLOSE student_cursor;
DEALLOCATE student_cursor;

PRINT 'seed_test_students_other_event completed for event: ' + @eventName;
GO
