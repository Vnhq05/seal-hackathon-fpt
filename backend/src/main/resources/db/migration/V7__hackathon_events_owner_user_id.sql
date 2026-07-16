-- V7: split business ownership out of the audit column.
-- See backend/docs/adr-event-owner-vs-created-by.md.
--
-- created_by served both @CreatedBy audit and coordinator authorization. AuditorAware
-- always overwrote the ownership write on insert, and updatable=false blocked any later
-- correction, so admin-creates-for-coordinator silently locked the coordinator out.
-- owner_user_id carries ownership from here on; created_by goes back to audit only.
ALTER TABLE dbo.hackathon_events
    ADD owner_user_id UNIQUEIDENTIFIER NULL;
GO

-- Backfill from the email currently held in created_by. Idempotent.
-- Deliberately NULL where ownership is not attributable: rows written without a
-- SecurityContext carry 'system', and an email may no longer match any user because
-- created_by stores a mutable natural key. NULL fails closed -- EventOwnershipGuard
-- rejects non-admins on mismatch, and admins bypass it, so those events stay manageable.
UPDATE e
SET owner_user_id = u.id
FROM dbo.hackathon_events e
INNER JOIN dbo.users u ON u.email = e.created_by
WHERE e.created_by IS NOT NULL
  AND e.created_by <> 'system';
GO

CREATE INDEX idx_hackathon_events_owner_user_id
    ON dbo.hackathon_events (owner_user_id);
GO

-- No FK to users yet: whether cross-module references get one is the FK-policy question
-- tracked as E4. Deferred deliberately.
