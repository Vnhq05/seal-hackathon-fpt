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

PRINT 'score_adjustment_workflow_migration completed.';
GO
