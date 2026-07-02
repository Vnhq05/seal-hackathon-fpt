-- Allow platform-wide email domains (event_id = NULL) managed in system configuration.

IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'allowed_email_domains')
      AND name = 'event_id'
      AND is_nullable = 0
)
BEGIN
    ALTER TABLE allowed_email_domains ALTER COLUMN event_id UNIQUEIDENTIFIER NULL;
    PRINT 'allowed_email_domains.event_id is now nullable for platform-wide domains.';
END
