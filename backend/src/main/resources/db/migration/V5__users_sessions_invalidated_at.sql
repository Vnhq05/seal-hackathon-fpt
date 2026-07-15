-- V5: session invalidation watermark for access-token revocation (keep 7d lifetime).
ALTER TABLE dbo.users ADD sessions_invalidated_at datetime2(6) NULL;
