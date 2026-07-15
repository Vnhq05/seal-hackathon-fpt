-- V2: allow AccountStatus.DELETED for soft-delete (audit / UUID refs retained).
-- Fail-fast: drop + recreate CHECK by known name from V0; create DELETED-aware CHECK.

ALTER TABLE dbo.users DROP CONSTRAINT CK__users__status__797309D9;

ALTER TABLE dbo.users ADD CONSTRAINT CK__users__status
    CHECK ([status] IN ('PENDING', 'ACTIVE', 'REJECTED', 'LOCKED', 'DELETED'));
