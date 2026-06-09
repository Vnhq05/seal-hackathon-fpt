-- Tính năng Mentor (mời mentor qua email, phòng chat 1-1) thêm 4 bảng entity
-- nhưng chưa có migration nào tạo chúng. Migration này tạo các bảng nếu chưa có
-- (idempotent), rồi bổ sung cột message + from_email cho mentor_requests
-- để Mentor thấy "From <email>" và nội dung tin nhắn khi nhận lời mời.

-- 1) Bảng mentors
IF OBJECT_ID('dbo.mentors', 'U') IS NULL
BEGIN
    CREATE TABLE mentors (
        id           BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_mentors PRIMARY KEY,
        user_id      BIGINT NOT NULL CONSTRAINT UQ_mentors_user UNIQUE,
        full_name    NVARCHAR(100) NOT NULL,
        specialty    NVARCHAR(255) NULL,
        organization NVARCHAR(255) NULL,
        CONSTRAINT FK_mentors_user FOREIGN KEY (user_id) REFERENCES users(id)
    );
END;

-- 2) Bảng mentor_rooms (phòng chat 1-1 giữa team và mentor)
IF OBJECT_ID('dbo.mentor_rooms', 'U') IS NULL
BEGIN
    CREATE TABLE mentor_rooms (
        id         BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_mentor_rooms PRIMARY KEY,
        team_id    BIGINT NOT NULL CONSTRAINT UQ_mentor_rooms_team UNIQUE,
        mentor_id  BIGINT NOT NULL,
        created_at DATETIME2 NULL
    );
END;

-- 3) Bảng chat_messages (tin nhắn trong phòng mentor)
IF OBJECT_ID('dbo.chat_messages', 'U') IS NULL
BEGIN
    CREATE TABLE chat_messages (
        id              BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_chat_messages PRIMARY KEY,
        room_id         BIGINT NOT NULL,
        sender_id       BIGINT NOT NULL,
        sender_name     NVARCHAR(255) NOT NULL,
        message_content NVARCHAR(MAX) NOT NULL,
        created_at      DATETIME2 NULL,
        CONSTRAINT FK_chat_messages_room FOREIGN KEY (room_id) REFERENCES mentor_rooms(id) ON DELETE CASCADE
    );
END;

-- 4) Bảng mentor_requests (lời mời mentor)
IF OBJECT_ID('dbo.mentor_requests', 'U') IS NULL
BEGIN
    CREATE TABLE mentor_requests (
        id         BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_mentor_requests PRIMARY KEY,
        team_id    BIGINT NOT NULL,
        mentor_id  BIGINT NOT NULL,
        status     NVARCHAR(50) NULL,
        message    NVARCHAR(MAX) NULL,
        from_email NVARCHAR(190) NULL,
        created_at DATETIME2 NULL,
        updated_at DATETIME2 NULL
    );
END;

-- Bổ sung cột cho DB đã có sẵn bảng mentor_requests nhưng thiếu cột
IF COL_LENGTH('dbo.mentor_requests', 'message') IS NULL
BEGIN
    ALTER TABLE dbo.mentor_requests
        ADD message NVARCHAR(MAX) NULL;
END;

IF COL_LENGTH('dbo.mentor_requests', 'from_email') IS NULL
BEGIN
    ALTER TABLE dbo.mentor_requests
        ADD from_email NVARCHAR(190) NULL;
END;
