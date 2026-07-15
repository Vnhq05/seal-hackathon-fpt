-- Optional event avatar image URL (public path under /api/public/files/events/...)
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'hackathon_events') AND name = N'avatar_url'
)
BEGIN
    ALTER TABLE hackathon_events ADD avatar_url NVARCHAR(500) NULL;
END
GO
