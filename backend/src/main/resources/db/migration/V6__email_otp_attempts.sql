-- V6: per-token OTP failed-attempt counter (brute-force protection).
ALTER TABLE dbo.email_otp_tokens
    ADD attempts INT NOT NULL CONSTRAINT DF_email_otp_tokens_attempts DEFAULT (0);
