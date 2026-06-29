-- Run once on SQL Server when team matching columns/tables are missing.
-- Required when spring.jpa.hibernate.ddl-auto=validate (default).

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'teams') AND name = N'is_recruiting'
)
BEGIN
    ALTER TABLE teams ADD is_recruiting BIT NOT NULL CONSTRAINT DF_teams_is_recruiting DEFAULT 0;
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'teams') AND name = N'recruitment_note'
)
BEGIN
    ALTER TABLE teams ADD recruitment_note NVARCHAR(1000) NULL;
END;

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'team_needed_roles')
BEGIN
    CREATE TABLE team_needed_roles (
        team_id UNIQUEIDENTIFIER NOT NULL,
        role NVARCHAR(30) NOT NULL,
        CONSTRAINT PK_team_needed_roles PRIMARY KEY (team_id, role),
        CONSTRAINT FK_team_needed_roles_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'event_enrollments') AND name = N'is_looking_for_team'
)
BEGIN
    ALTER TABLE event_enrollments ADD is_looking_for_team BIT NOT NULL
        CONSTRAINT DF_event_enrollments_is_looking_for_team DEFAULT 0;
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'event_enrollments') AND name = N'preferred_role'
)
BEGIN
    ALTER TABLE event_enrollments ADD preferred_role NVARCHAR(30) NULL;
END;
