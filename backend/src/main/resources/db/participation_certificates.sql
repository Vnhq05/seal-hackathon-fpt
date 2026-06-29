-- Run once on SQL Server when participation_certificates table is missing.
-- Required when spring.jpa.hibernate.ddl-auto=validate (default).

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'participation_certificates')
BEGIN
    CREATE TABLE participation_certificates (
        id UNIQUEIDENTIFIER NOT NULL,
        event_id UNIQUEIDENTIFIER NOT NULL,
        user_id UNIQUEIDENTIFIER NOT NULL,
        team_id UNIQUEIDENTIFIER NOT NULL,
        issued_at DATETIME2 NOT NULL,
        created_at DATETIME2 NOT NULL,
        updated_at DATETIME2 NULL,
        created_by NVARCHAR(255) NULL,
        updated_by NVARCHAR(255) NULL,
        CONSTRAINT PK_participation_certificates PRIMARY KEY (id),
        CONSTRAINT UQ_participation_certificates_event_user UNIQUE (event_id, user_id)
    );

    CREATE INDEX idx_participation_certificates_event_id
        ON participation_certificates (event_id);
END;
