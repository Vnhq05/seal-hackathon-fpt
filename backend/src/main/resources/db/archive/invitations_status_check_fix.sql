-- Fix: CHECK constraint on invitations.status is missing 'CANCELLED'.
-- Root cause: constraint was auto-named (CK__invitatio__statu__xxxxxxxx),
-- created outside tracked migrations, and never updated when the
-- InvitationStatus enum gained a CANCELLED value.
-- Idempotent: only touches the constraint if CANCELLED is not already allowed.

DECLARE @invStatusCk NVARCHAR(256);
SELECT @invStatusCk = cc.name
FROM sys.check_constraints cc
WHERE cc.parent_object_id = OBJECT_ID('invitations')
  AND cc.definition LIKE '%status%'
  AND cc.definition NOT LIKE '%CANCELLED%';

IF @invStatusCk IS NOT NULL
    EXEC('ALTER TABLE invitations DROP CONSTRAINT ' + @invStatusCk);
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints cc
    WHERE cc.parent_object_id = OBJECT_ID('invitations')
      AND cc.definition LIKE '%status%'
      AND cc.definition LIKE '%CANCELLED%'
)
BEGIN
    ALTER TABLE invitations
    ADD CONSTRAINT CK_invitations_status
    CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'));
END
GO
