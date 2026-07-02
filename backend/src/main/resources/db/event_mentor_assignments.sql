IF NOT EXISTS (
    SELECT 1 FROM sys.tables WHERE name = N'event_mentor_assignments'
)
BEGIN
    CREATE TABLE event_mentor_assignments (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        event_id UNIQUEIDENTIFIER NOT NULL,
        mentor_user_id UNIQUEIDENTIFIER NOT NULL,
        assigned_at DATETIME2 NOT NULL,
        created_at DATETIME2 NOT NULL,
        updated_at DATETIME2 NULL,
        created_by NVARCHAR(255) NULL,
        updated_by NVARCHAR(255) NULL,
        CONSTRAINT uq_event_mentor UNIQUE (event_id, mentor_user_id),
        CONSTRAINT fk_event_mentor_event FOREIGN KEY (event_id) REFERENCES hackathon_events(id)
    );
END;
