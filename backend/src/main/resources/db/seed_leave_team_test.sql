-- Dev seed: OPEN event (before competition start) + confirmed 3-member team.
-- For testing voluntary leave team before the competition starts.
-- Run: sqlcmd -S localhost -E -d SEAL -I -i seed_leave_team_test.sql

SET NOCOUNT ON;
GO

DECLARE @eventName NVARCHAR(255) = N'DEV Leave Team Test';
DECLARE @teamName NVARCHAR(255) = N'Team Leave Ready';
DECLARE @now DATETIME2 = GETDATE();
DECLARE @eventStart DATE = CAST(DATEADD(DAY, 14, @now) AS DATE);
DECLARE @eventEnd DATE = CAST(DATEADD(DAY, 45, @now) AS DATE);
DECLARE @regOpen DATE = CAST(DATEADD(DAY, -7, @now) AS DATE);
DECLARE @regDeadline DATE = CAST(DATEADD(DAY, 10, @now) AS DATE);
DECLARE @roundStart DATETIME2 = DATEADD(DAY, 14, @now);
DECLARE @roundEnd DATETIME2 = DATEADD(DAY, 45, @now);
DECLARE @submissionDeadline DATETIME2 = DATEADD(DAY, 42, @now);
DECLARE @scoringDeadline DATETIME2 = DATEADD(DAY, 45, @now);

DECLARE @eventId UNIQUEIDENTIFIER;
DECLARE @roundId UNIQUEIDENTIFIER;
DECLARE @trackId UNIQUEIDENTIFIER;
DECLARE @teamId UNIQUEIDENTIFIER;
DECLARE @templateId UNIQUEIDENTIFIER;
DECLARE @passwordHash NVARCHAR(255);
DECLARE @university NVARCHAR(255);

SELECT TOP 1 @templateId = id FROM scoring_templates ORDER BY created_at;
IF @templateId IS NULL
BEGIN
    RAISERROR('No scoring template found.', 16, 1);
    RETURN;
END;

SELECT @passwordHash = password_hash, @university = university_name
FROM users WHERE email = N'student1@fpt.edu.vn';
IF @passwordHash IS NULL
BEGIN
    RAISERROR('Template user student1@fpt.edu.vn not found.', 16, 1);
    RETURN;
END;

SELECT @eventId = id FROM hackathon_events WHERE name = @eventName;

IF @eventId IS NULL
BEGIN
    SET @eventId = NEWID();
    SET @roundId = NEWID();
    SET @trackId = NEWID();

    INSERT INTO hackathon_events (
        id, name, season, year, start_date, end_date,
        registration_open_date, registration_deadline,
        description, location, format, competition_format,
        min_team, max_team, semester_min, semester_max,
        scoring_template_id, status, leaderboard_public,
        created_by, created_at, updated_at
    ) VALUES (
        @eventId, @eventName, N'Spring', 2026,
        @eventStart, @eventEnd,
        @regOpen, @regDeadline,
        N'Dev event for testing leave team before competition starts.',
        N'FPT University Da Nang', N'OFFLINE', N'GENERIC',
        3, 5, 4, 8,
        @templateId, N'OPEN', 0,
        N'coordinator@seal.com', @now, @now
    );

    INSERT INTO tracks (id, event_id, name, description, max_teams, status, scoring_template_id, created_at, updated_at)
    VALUES (@trackId, @eventId, N'General Track', N'Leave-team smoke-test track', 20, N'OPEN', @templateId, @now, @now);

    INSERT INTO rounds (
        id, event_id, round_number, name,
        start_date, end_date, submission_deadline, scoring_deadline,
        advancement_cutoff, round_weight, min_judges_per_round, round_type,
        created_at, updated_at
    ) VALUES (
        @roundId, @eventId, 1, N'Round One',
        @roundStart, @roundEnd, @submissionDeadline, @scoringDeadline,
        10, 100, 2, N'PRELIMINARY',
        @now, @now
    );

    PRINT 'Created event: ' + @eventName;
END
ELSE
BEGIN
    SELECT @roundId = id FROM rounds WHERE event_id = @eventId AND round_number = 1;
    SELECT @trackId = id FROM tracks WHERE event_id = @eventId;

    UPDATE hackathon_events
    SET status = N'OPEN',
        start_date = @eventStart,
        end_date = @eventEnd,
        registration_open_date = @regOpen,
        registration_deadline = @regDeadline,
        updated_at = @now
    WHERE id = @eventId;

    UPDATE rounds
    SET start_date = @roundStart,
        end_date = @roundEnd,
        submission_deadline = @submissionDeadline,
        scoring_deadline = @scoringDeadline,
        updated_at = @now
    WHERE id = @roundId;

    PRINT 'Updated existing event: ' + @eventName;
END;

DECLARE @students TABLE (
    email NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(255) NOT NULL,
    student_id NVARCHAR(20) NOT NULL,
    semester INT NOT NULL,
    is_leader BIT NOT NULL
);

INSERT INTO @students (email, full_name, student_id, semester, is_leader) VALUES
    (N'leavetest101@fpt.edu.vn', N'Leave Test 101', N'SE19100301', 5, 1),
    (N'leavetest102@fpt.edu.vn', N'Leave Test 102', N'SE19100302', 5, 0),
    (N'leavetest103@fpt.edu.vn', N'Leave Test 103', N'SE19100303', 6, 0);

DECLARE @email NVARCHAR(255);
DECLARE @fullName NVARCHAR(255);
DECLARE @studentId NVARCHAR(20);
DECLARE @semester INT;
DECLARE @isLeader BIT;
DECLARE @userId UNIQUEIDENTIFIER;
DECLARE @leaderId UNIQUEIDENTIFIER;

DECLARE student_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT email, full_name, student_id, semester, is_leader FROM @students;

OPEN student_cursor;
FETCH NEXT FROM student_cursor INTO @email, @fullName, @studentId, @semester, @isLeader;

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

    IF @isLeader = 1 SET @leaderId = @userId;

    IF NOT EXISTS (SELECT 1 FROM event_enrollments WHERE user_id = @userId AND event_id = @eventId)
    BEGIN
        INSERT INTO event_enrollments (
            id, user_id, event_id, status, enrolled_at,
            is_looking_for_team, is_profile_public, created_at, updated_at
        ) VALUES (
            NEWID(), @userId, @eventId, N'APPROVED', @now,
            0, 0, @now, @now
        );
        PRINT 'Enrolled: ' + @email;
    END
    ELSE
    BEGIN
        UPDATE event_enrollments
        SET status = N'APPROVED', updated_at = @now
        WHERE user_id = @userId AND event_id = @eventId;
        PRINT 'Enrollment refreshed: ' + @email;
    END;

    FETCH NEXT FROM student_cursor INTO @email, @fullName, @studentId, @semester, @isLeader;
END;

CLOSE student_cursor;
DEALLOCATE student_cursor;

SELECT @teamId = id FROM teams WHERE event_id = @eventId AND name = @teamName;

IF @teamId IS NULL
BEGIN
    SET @teamId = NEWID();
    INSERT INTO teams (
        id, event_id, name, leader_id, status, track_id,
        is_recruiting, created_at, updated_at
    ) VALUES (
        @teamId, @eventId, @teamName, @leaderId, N'CONFIRMED', @trackId,
        0, @now, @now
    );
    PRINT 'Created team: ' + @teamName;
END
ELSE
BEGIN
    UPDATE teams
    SET leader_id = @leaderId,
        status = N'CONFIRMED',
        track_id = @trackId,
        is_recruiting = 0,
        updated_at = @now
    WHERE id = @teamId;
    PRINT 'Updated team: ' + @teamName;
END;

DECLARE member_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT email, is_leader FROM @students;

OPEN member_cursor;
FETCH NEXT FROM member_cursor INTO @email, @isLeader;

WHILE @@FETCH_STATUS = 0
BEGIN
    SELECT @userId = id FROM users WHERE email = @email;

    IF NOT EXISTS (SELECT 1 FROM team_members WHERE team_id = @teamId AND user_id = @userId)
    BEGIN
        INSERT INTO team_members (id, team_id, user_id, role, joined_at, created_at, updated_at)
        VALUES (
            NEWID(), @teamId, @userId,
            CASE WHEN @isLeader = 1 THEN N'LEADER' ELSE N'MEMBER' END,
            @now, @now, @now
        );
        PRINT 'Added member: ' + @email;
    END;

    FETCH NEXT FROM member_cursor INTO @email, @isLeader;
END;

CLOSE member_cursor;
DEALLOCATE member_cursor;

PRINT '';
PRINT '=== Leave team test ready ===';
PRINT 'Event: ' + @eventName + ' (OPEN, starts in ~14 days)';
PRINT 'Team:  ' + @teamName;
PRINT 'Login as MEMBER (can leave): leavetest102@fpt.edu.vn / 12345678';
PRINT 'Leader (must transfer first):  leavetest101@fpt.edu.vn / 12345678';
PRINT 'Go to Student → Teams → Leave team';
GO
