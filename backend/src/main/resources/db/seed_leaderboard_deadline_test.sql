-- Dev seed: event + 5-member team near submission deadline, no submission.
-- For testing coordinator at-risk panel / team progress / LiveScore context.
-- Run: sqlcmd -S localhost -U sa -P <password> -d SEAL -I -i seed_leaderboard_deadline_test.sql

SET NOCOUNT ON;
GO

DECLARE @eventName NVARCHAR(255) = N'SEAL Leaderboard Deadline Test';
DECLARE @teamName NVARCHAR(255) = N'Team Last Minute';
DECLARE @now DATETIME2 = GETDATE();
DECLARE @submissionDeadline DATETIME2 = DATEADD(HOUR, 3, @now);
DECLARE @scoringDeadline DATETIME2 = DATEADD(DAY, 2, @now);
DECLARE @roundStart DATETIME2 = DATEADD(DAY, -1, @now);
DECLARE @roundEnd DATETIME2 = DATEADD(DAY, 3, @now);
DECLARE @eventStart DATE = CAST(DATEADD(DAY, -7, @now) AS DATE);
DECLARE @eventEnd DATE = CAST(DATEADD(DAY, 14, @now) AS DATE);
DECLARE @regDeadline DATE = CAST(DATEADD(DAY, -3, @now) AS DATE);

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
    RAISERROR('No scoring template found. Start backend with dev profile first.', 16, 1);
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
        @eventId, @eventName, N'Summer', 2026,
        @eventStart, @eventEnd,
        DATEADD(MONTH, -1, @eventStart), @regDeadline,
        N'Test event — one team near submission deadline without a submission.',
        N'FPT University Da Nang', N'OFFLINE', N'GENERIC',
        1, 10, 4, 8,
        @templateId, N'ACTIVE', 1,
        N'coordinator@seal.com', @now, @now
    );

    INSERT INTO tracks (id, event_id, name, description, max_teams, status, created_at, updated_at)
    VALUES (@trackId, @eventId, N'Software Track', N'Leaderboard deadline test track', 20, N'OPEN', @now, @now);

    INSERT INTO rounds (
        id, event_id, round_number, name,
        start_date, end_date, submission_deadline, scoring_deadline,
        advancement_cutoff, round_weight, min_judges_per_round,
        created_at, updated_at
    ) VALUES (
        @roundId, @eventId, 1, N'Round One',
        @roundStart, @roundEnd, @submissionDeadline, @scoringDeadline,
        5, 100, 2,
        @now, @now
    );

    INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at)
    VALUES
        (NEWID(), @roundId, N'Innovation', N'Innovation and creativity', 30, 0, 1, 5, @now, @now),
        (NEWID(), @roundId, N'Technical', N'Technical implementation', 40, 1, 1, 5, @now, @now),
        (NEWID(), @roundId, N'Presentation', N'Presentation quality', 30, 2, 1, 5, @now, @now);

    PRINT 'Created event: ' + @eventName;
END
ELSE
BEGIN
    SELECT @roundId = id FROM rounds WHERE event_id = @eventId AND round_number = 1;
    SELECT @trackId = id FROM tracks WHERE event_id = @eventId;

    UPDATE hackathon_events
    SET status = N'ACTIVE',
        leaderboard_public = 1,
        updated_at = @now
    WHERE id = @eventId;

    UPDATE rounds
    SET start_date = @roundStart,
        end_date = @roundEnd,
        submission_deadline = @submissionDeadline,
        scoring_deadline = @scoringDeadline,
        updated_at = @now
    WHERE id = @roundId;

    PRINT 'Updated existing event deadlines: ' + @eventName;
END;

DECLARE @students TABLE (
    email NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(255) NOT NULL,
    student_id NVARCHAR(20) NOT NULL,
    semester INT NOT NULL,
    is_leader BIT NOT NULL
);

INSERT INTO @students (email, full_name, student_id, semester, is_leader) VALUES
    (N'lbtest201@fpt.edu.vn', N'LB Test Leader 201', N'SE19100201', 5, 1),
    (N'lbtest202@fpt.edu.vn', N'LB Test Member 202', N'SE19100202', 5, 0),
    (N'lbtest203@fpt.edu.vn', N'LB Test Member 203', N'SE19100203', 6, 0),
    (N'lbtest204@fpt.edu.vn', N'LB Test Member 204', N'SE19100204', 6, 0),
    (N'lbtest205@fpt.edu.vn', N'LB Test Member 205', N'SE19100205', 7, 0);

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
    END
    ELSE
    BEGIN
        UPDATE event_enrollments
        SET status = N'APPROVED', updated_at = @now
        WHERE user_id = @userId AND event_id = @eventId;
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

DECLARE @memberEmail NVARCHAR(255);
DECLARE @memberUserId UNIQUEIDENTIFIER;

DECLARE member_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT email FROM @students;

OPEN member_cursor;
FETCH NEXT FROM member_cursor INTO @memberEmail;

WHILE @@FETCH_STATUS = 0
BEGIN
    SELECT @memberUserId = id FROM users WHERE email = @memberEmail;

    IF NOT EXISTS (SELECT 1 FROM team_members WHERE team_id = @teamId AND user_id = @memberUserId)
    BEGIN
        INSERT INTO team_members (id, team_id, user_id, role, joined_at, created_at, updated_at)
        VALUES (
            NEWID(), @teamId, @memberUserId,
            CASE WHEN @memberUserId = @leaderId THEN N'LEADER' ELSE N'MEMBER' END,
            @now, @now, @now
        );
    END;

    FETCH NEXT FROM member_cursor INTO @memberEmail;
END;

CLOSE member_cursor;
DEALLOCATE member_cursor;

-- Ensure no submission exists for this team in round 1
DELETE sv
FROM submission_versions sv
INNER JOIN submissions s ON s.id = sv.submission_id
WHERE s.team_id = @teamId AND s.round_id = @roundId;

DELETE FROM submissions WHERE team_id = @teamId AND round_id = @roundId;

-- Mentor account + track/event assignment + team binding
DECLARE @mentorEmail NVARCHAR(255) = N'mentor.lbtest@fpt.edu.vn';
DECLARE @mentorName NVARCHAR(255) = N'LB Test Mentor';
DECLARE @mentorId UNIQUEIDENTIFIER;
DECLARE @lecturerHash NVARCHAR(255);

SELECT @lecturerHash = password_hash FROM users WHERE email = N'lecturer1@fpt.edu.vn';
IF @lecturerHash IS NULL
    SELECT @lecturerHash = @passwordHash;

SELECT @mentorId = id FROM users WHERE email = @mentorEmail;
IF @mentorId IS NULL
BEGIN
    SET @mentorId = NEWID();
    INSERT INTO users (
        id, email, password_hash, full_name,
        user_type, status, failed_login_attempts, student_standing,
        temporary_account, created_at, updated_at
    ) VALUES (
        @mentorId, @mentorEmail, @lecturerHash, @mentorName,
        N'LECTURER', N'ACTIVE', 0, N'ENROLLED',
        0, @now, @now
    );
    PRINT 'Created mentor: ' + @mentorEmail;
END
ELSE
BEGIN
    UPDATE users
    SET password_hash = @lecturerHash,
        status = N'ACTIVE',
        failed_login_attempts = 0,
        locked_until = NULL,
        user_type = N'LECTURER',
        updated_at = @now
    WHERE id = @mentorId;
    PRINT 'Updated mentor: ' + @mentorEmail;
END;

IF NOT EXISTS (
    SELECT 1 FROM event_mentor_assignments
    WHERE event_id = @eventId AND mentor_user_id = @mentorId
)
BEGIN
    INSERT INTO event_mentor_assignments (
        id, event_id, mentor_user_id, assigned_at, created_at, updated_at
    ) VALUES (
        NEWID(), @eventId, @mentorId, @now, @now, @now
    );
END;

IF NOT EXISTS (
    SELECT 1 FROM mentor_assignments
    WHERE event_id = @eventId AND track_id = @trackId AND mentor_user_id = @mentorId
)
BEGIN
    INSERT INTO mentor_assignments (
        id, event_id, track_id, mentor_user_id, assigned_at, created_at, updated_at
    ) VALUES (
        NEWID(), @eventId, @trackId, @mentorId, @now, @now, @now
    );
END;

IF NOT EXISTS (
    SELECT 1 FROM mentor_teams
    WHERE mentor_user_id = @mentorId AND team_id = @teamId
)
BEGIN
    INSERT INTO mentor_teams (
        id, mentor_user_id, team_id, assigned_at, created_at, updated_at
    ) VALUES (
        NEWID(), @mentorId, @teamId, @now, @now, @now
    );
    PRINT 'Assigned mentor to team: ' + @teamName;
END
ELSE
    PRINT 'Mentor already assigned to team: ' + @teamName;

PRINT 'seed_leaderboard_deadline_test completed.';
PRINT 'Event: ' + @eventName;
PRINT 'Team: ' + @teamName + ' (5 members, no submission)';
PRINT 'Mentor: ' + @mentorEmail + ' (password: 12345678)';
PRINT 'Submission deadline: ' + CONVERT(NVARCHAR(30), @submissionDeadline, 120);
GO
