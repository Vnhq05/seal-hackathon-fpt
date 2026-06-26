-- Fix Spring Modulith event_publication table when Hibernate created VARCHAR(255) columns.
-- Required for domain events with UUID payloads (e.g. JoinRequestCreatedEvent).

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = N'event_publication')
BEGIN
    IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'event_publication') AND name = N'serialized_event'
    )
    BEGIN
        ALTER TABLE event_publication ALTER COLUMN serialized_event NVARCHAR(MAX) NOT NULL;
    END;

    IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'event_publication') AND name = N'listener_id'
    )
    BEGIN
        ALTER TABLE event_publication ALTER COLUMN listener_id NVARCHAR(512) NOT NULL;
    END;

    IF EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'event_publication') AND name = N'event_type'
    )
    BEGIN
        ALTER TABLE event_publication ALTER COLUMN event_type NVARCHAR(512) NOT NULL;
    END;
END;
