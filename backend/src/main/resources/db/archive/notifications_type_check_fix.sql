-- Fix: CHECK constraint on notifications.type must include all NotificationType enum values.
-- Idempotent: drops outdated type constraints and recreates CK_notifications_type.

SET NOCOUNT ON;
GO

DECLARE @typeCk NVARCHAR(256);
DECLARE @needsRecreate BIT = 0;

IF EXISTS (
    SELECT 1 FROM sys.check_constraints cc
    WHERE cc.parent_object_id = OBJECT_ID(N'notifications')
      AND cc.name = N'CK_notifications_type'
      AND cc.definition NOT LIKE N'%SCORE_ADJUSTMENT_APPROVED%'
)
    SET @needsRecreate = 1;

IF @needsRecreate = 1
    ALTER TABLE notifications DROP CONSTRAINT CK_notifications_type;
GO

DECLARE @legacyCk NVARCHAR(256);
SELECT @legacyCk = cc.name
FROM sys.check_constraints cc
WHERE cc.parent_object_id = OBJECT_ID(N'notifications')
  AND cc.definition LIKE N'%type%'
  AND cc.definition NOT LIKE N'%SCORE_ADJUSTMENT_APPROVED%';

IF @legacyCk IS NOT NULL
    EXEC('ALTER TABLE notifications DROP CONSTRAINT ' + @legacyCk);
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints cc
    WHERE cc.parent_object_id = OBJECT_ID(N'notifications')
      AND cc.name = N'CK_notifications_type'
)
BEGIN
    ALTER TABLE notifications
    ADD CONSTRAINT CK_notifications_type
    CHECK ([type] IN (
        N'ACCOUNT_APPROVED',
        N'ACCOUNT_REJECTED',
        N'INTERNAL_ACCOUNT_CREATED',
        N'TEAM_REGISTERED',
        N'TEAM_CONFIRMED',
        N'INVITATION_RECEIVED',
        N'MENTOR_TEAM_ASSIGNED',
        N'SUBMISSION_CREATED',
        N'JUDGE_ASSIGNED',
        N'JUDGE_ASSIGNMENT_CHANGED',
        N'JUDGE_ASSIGNMENT_REMOVED',
        N'MENTOR_ASSIGNED',
        N'SCORE_ADJUSTMENT_APPROVED',
        N'SCORING_REOPENED',
        N'RESULTS_PUBLISHED',
        N'DISPUTE_FILED',
        N'JOIN_REQUEST_RECEIVED',
        N'JOIN_REQUEST_ACCEPTED',
        N'JOIN_REQUEST_REJECTED',
        N'LEAVE_REQUEST_CREATED',
        N'LEAVE_REQUEST_APPROVED',
        N'LEAVE_REQUEST_REJECTED',
        N'INVITATION_ACCEPTED',
        N'INVITATION_EXPIRED',
        N'MEMBER_KICKED',
        N'TEAM_PROGRESS_ALERT'
    ));
END
GO

PRINT 'notifications_type_check_fix completed.';
GO
