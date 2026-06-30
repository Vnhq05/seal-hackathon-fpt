-- Run once on SQL Server when email_otp_tokens table is missing.
-- Required when spring.jpa.hibernate.ddl-auto=validate (default).

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'email_otp_tokens')
BEGIN
    CREATE TABLE email_otp_tokens (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        user_id UNIQUEIDENTIFIER NOT NULL,
        code NVARCHAR(6) NOT NULL,
        expires_at DATETIME2(6) NOT NULL,
        resend_allowed_at DATETIME2(6) NOT NULL,
        used BIT NOT NULL DEFAULT 0,
        created_at DATETIME2(6) NOT NULL,
        updated_at DATETIME2(6) NULL,
        created_by NVARCHAR(255) NULL,
        updated_by NVARCHAR(255) NULL
    );

    CREATE INDEX IX_email_otp_tokens_user_code
        ON email_otp_tokens (user_id, code);
END;
