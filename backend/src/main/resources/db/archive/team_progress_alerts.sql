-- Team progress alert dedup/cooldown records
-- Required when spring.jpa.hibernate.ddl-auto=validate (default).

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'team_progress_alerts')
BEGIN
    CREATE TABLE team_progress_alerts (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        team_id UNIQUEIDENTIFIER NOT NULL,
        round_id UNIQUEIDENTIFIER NOT NULL,
        risk_level NVARCHAR(20) NOT NULL,
        reasons NVARCHAR(500) NULL,
        last_alerted_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL,
        updated_at DATETIME2 NULL,
        created_by NVARCHAR(255) NULL,
        updated_by NVARCHAR(255) NULL,
        CONSTRAINT uq_team_progress_alert_team_round UNIQUE (team_id, round_id)
    );
END;
GO
