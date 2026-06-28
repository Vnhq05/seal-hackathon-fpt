-- SEAL Hackathon Spring 2026 schema extensions

-- Competition format on events (distinct from location format column "format")
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('hackathon_events') AND name = 'competition_format')
BEGIN
    ALTER TABLE hackathon_events ADD competition_format NVARCHAR(50) NOT NULL DEFAULT 'GENERIC';
END
GO

-- Round type (PRELIMINARY / FINAL)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('rounds') AND name = 'round_type')
BEGIN
    ALTER TABLE rounds ADD round_type NVARCHAR(50) NULL;
END
GO

-- Track topic
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tracks') AND name = 'topic')
BEGIN
    ALTER TABLE tracks ADD topic NVARCHAR(1000) NULL;
END
GO

-- Team track assignment metadata
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('teams') AND name = 'track_assigned_at')
BEGIN
    ALTER TABLE teams ADD track_assigned_at DATETIME2 NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('teams') AND name = 'track_assignment_method')
BEGIN
    ALTER TABLE teams ADD track_assignment_method NVARCHAR(50) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('teams') AND name = 'track_assigned_by')
BEGIN
    ALTER TABLE teams ADD track_assigned_by UNIQUEIDENTIFIER NULL;
END
GO

-- Submission slide URL
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('submission_versions') AND name = 'slide_url')
BEGIN
    ALTER TABLE submission_versions ADD slide_url NVARCHAR(500) NULL;
END
GO

-- Finalist selections
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'finalist_selections')
BEGIN
    CREATE TABLE finalist_selections (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        event_id UNIQUEIDENTIFIER NOT NULL,
        team_id UNIQUEIDENTIFIER NOT NULL,
        track_id UNIQUEIDENTIFIER NULL,
        preliminary_rank INT NOT NULL,
        selected_reason NVARCHAR(500) NULL,
        selected_at DATETIME2 NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT uq_finalist_event_team UNIQUE (event_id, team_id)
    );
    CREATE INDEX idx_finalist_event ON finalist_selections(event_id);
END
GO

-- Team awards (links team to prize after final ranking)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'team_awards')
BEGIN
    CREATE TABLE team_awards (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        event_id UNIQUEIDENTIFIER NOT NULL,
        team_id UNIQUEIDENTIFIER NOT NULL,
        prize_id UNIQUEIDENTIFIER NOT NULL,
        awarded_at DATETIME2 NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT uq_team_award_event_team UNIQUE (event_id, team_id)
    );
    CREATE INDEX idx_team_award_event ON team_awards(event_id);
END
GO

-- Mentor assignment per track
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('mentor_assignments') AND name = 'track_id')
BEGIN
    ALTER TABLE mentor_assignments ADD track_id UNIQUEIDENTIFIER NULL;
END
GO
