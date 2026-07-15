-- Run once on SQL Server when event_magic_tokens table is missing.
-- Required when spring.jpa.hibernate.ddl-auto=validate (default).

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'event_magic_tokens')
BEGIN
    CREATE TABLE event_magic_tokens (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        user_id UNIQUEIDENTIFIER NOT NULL,
        event_id UNIQUEIDENTIFIER NOT NULL,
        token NVARCHAR(255) NOT NULL UNIQUE,
        expires_at DATETIME2(6) NOT NULL,
        used BIT NOT NULL DEFAULT 0,
        created_at DATETIME2(6) NOT NULL,
        updated_at DATETIME2(6) NULL,
        created_by NVARCHAR(255) NULL,
        updated_by NVARCHAR(255) NULL
    );

    CREATE INDEX IX_event_magic_tokens_user_event
        ON event_magic_tokens (user_id, event_id);
END;
