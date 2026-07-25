-- V23: judge_score_details.score must allow event scale 1–100 (entity @Max(100)).
-- Some live DBs still have legacy CHECK score <= 10 from older SEAL rubrics.

DECLARE @ck NVARCHAR(256);
SELECT @ck = cc.name
FROM sys.check_constraints cc
WHERE cc.parent_object_id = OBJECT_ID(N'dbo.judge_score_details')
  AND cc.definition LIKE N'%[score]%';

IF @ck IS NOT NULL
BEGIN
    DECLARE @dropSql NVARCHAR(500) = N'ALTER TABLE dbo.judge_score_details DROP CONSTRAINT ' + QUOTENAME(@ck);
    EXEC sp_executesql @dropSql;
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID(N'dbo.judge_score_details')
      AND name = N'CK_judge_score_details_score_0_100'
)
BEGIN
    ALTER TABLE dbo.judge_score_details
        ADD CONSTRAINT CK_judge_score_details_score_0_100
        CHECK ([score] >= (0) AND [score] <= (100));
END;
