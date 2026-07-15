-- Score adjustment workflow (direction B): request note, approval fields, extended statuses.
-- Idempotent for dev/local SQL Server.

SET NOCOUNT ON;
GO

IF COL_LENGTH('score_review_requests', 'adjustment_type') IS NULL
    ALTER TABLE score_review_requests ADD adjustment_type NVARCHAR(32) NULL;
GO

IF COL_LENGTH('score_review_requests', 'requested_by') IS NULL
    ALTER TABLE score_review_requests ADD requested_by UNIQUEIDENTIFIER NULL;
GO

IF COL_LENGTH('score_review_requests', 'request_note') IS NULL
    ALTER TABLE score_review_requests ADD request_note NVARCHAR(2000) NULL;
GO

IF COL_LENGTH('score_review_requests', 'approved_at') IS NULL
    ALTER TABLE score_review_requests ADD approved_at DATETIME2 NULL;
GO

IF COL_LENGTH('score_review_requests', 'approved_by') IS NULL
    ALTER TABLE score_review_requests ADD approved_by UNIQUEIDENTIFIER NULL;
GO

UPDATE score_review_requests
SET adjustment_type = N'AUTO_DEVIATION'
WHERE adjustment_type IS NULL;
GO

-- Status CHECK must include APPROVED/REJECTED/ADJUSTED (score adjustment workflow).
DECLARE @statusCk NVARCHAR(256);
SELECT @statusCk = cc.name
FROM sys.check_constraints cc
WHERE cc.parent_object_id = OBJECT_ID(N'score_review_requests')
  AND cc.definition LIKE N'%status%'
  AND (
      cc.definition NOT LIKE N'%APPROVED%'
      OR cc.definition NOT LIKE N'%REJECTED%'
      OR cc.definition NOT LIKE N'%ADJUSTED%'
  );

IF @statusCk IS NOT NULL
    EXEC('ALTER TABLE score_review_requests DROP CONSTRAINT [' + @statusCk + ']');
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints cc
    WHERE cc.parent_object_id = OBJECT_ID(N'score_review_requests')
      AND cc.name = N'CK_score_review_requests_status'
)
BEGIN
    ALTER TABLE score_review_requests
    ADD CONSTRAINT CK_score_review_requests_status
    CHECK ([status] IN (
        N'OPEN',
        N'APPROVED',
        N'ADJUSTED',
        N'REJECTED',
        N'RESOLVED',
        N'IGNORED'
    ));
END
GO

PRINT 'score_adjustment_workflow_migration completed.';
GO
