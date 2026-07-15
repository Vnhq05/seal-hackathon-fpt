-- Run once on SQL Server when team join/leave request tables are missing.
-- Required when spring.jpa.hibernate.ddl-auto=validate (default).

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'team_join_requests')
BEGIN
    CREATE TABLE team_join_requests (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        team_id UNIQUEIDENTIFIER NOT NULL,
        event_id UNIQUEIDENTIFIER NOT NULL,
        requester_id UNIQUEIDENTIFIER NOT NULL,
        status NVARCHAR(20) NOT NULL,
        message NVARCHAR(500) NULL,
        resolved_at DATETIME2(6) NULL,
        created_at DATETIME2(6) NOT NULL,
        updated_at DATETIME2(6) NULL,
        created_by NVARCHAR(255) NULL,
        updated_by NVARCHAR(255) NULL,
        CONSTRAINT FK_team_join_requests_team FOREIGN KEY (team_id) REFERENCES teams(id)
    );

    CREATE INDEX IX_team_join_requests_requester_event
        ON team_join_requests (requester_id, event_id);

    CREATE INDEX IX_team_join_requests_team_status
        ON team_join_requests (team_id, status);
END;

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'team_leave_requests')
BEGIN
    CREATE TABLE team_leave_requests (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        team_id UNIQUEIDENTIFIER NOT NULL,
        event_id UNIQUEIDENTIFIER NOT NULL,
        user_id UNIQUEIDENTIFIER NOT NULL,
        status NVARCHAR(20) NOT NULL,
        reason NVARCHAR(500) NULL,
        resolved_by UNIQUEIDENTIFIER NULL,
        resolved_at DATETIME2(6) NULL,
        created_at DATETIME2(6) NOT NULL,
        updated_at DATETIME2(6) NULL,
        created_by NVARCHAR(255) NULL,
        updated_by NVARCHAR(255) NULL,
        CONSTRAINT FK_team_leave_requests_team FOREIGN KEY (team_id) REFERENCES teams(id)
    );

    CREATE INDEX IX_team_leave_requests_event_status
        ON team_leave_requests (event_id, status);

    CREATE INDEX IX_team_leave_requests_team_status
        ON team_leave_requests (team_id, status);
END;
