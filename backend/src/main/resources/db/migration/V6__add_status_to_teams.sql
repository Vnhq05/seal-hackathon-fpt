IF COL_LENGTH('dbo.teams', 'status') IS NULL
BEGIN
ALTER TABLE dbo.teams
    ADD status NVARCHAR(30) NOT NULL
        CONSTRAINT DF_teams_status DEFAULT 'INCOMPLETE';
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_teams_status'
)
BEGIN
EXEC('
        ALTER TABLE dbo.teams
        ADD CONSTRAINT CK_teams_status
        CHECK (status IN (''INCOMPLETE'', ''REGISTERED'', ''INVALID''))
    ');
END;