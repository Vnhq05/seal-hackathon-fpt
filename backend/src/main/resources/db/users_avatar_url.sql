-- Optional user profile avatar image URL (public path under /api/public/files/users/...)
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'users') AND name = N'avatar_url'
)
BEGIN
    ALTER TABLE users ADD avatar_url NVARCHAR(500) NULL;
END
GO
