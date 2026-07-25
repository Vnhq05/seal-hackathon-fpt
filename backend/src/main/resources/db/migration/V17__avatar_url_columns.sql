-- V17: columns present on entity / V0 baseline but missing on older live SEAL DBs.
IF COL_LENGTH(N'dbo.hackathon_events', N'avatar_url') IS NULL
    ALTER TABLE dbo.hackathon_events ADD avatar_url NVARCHAR(500) NULL;

IF COL_LENGTH(N'dbo.users', N'avatar_url') IS NULL
    ALTER TABLE dbo.users ADD avatar_url NVARCHAR(500) NULL;
