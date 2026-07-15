-- V4: unique student_id when present (filtered unique index).
-- Dedupe: keep newest ACTIVE row per student_id; null out other duplicates.

;WITH d AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY student_id
               ORDER BY CASE WHEN status = 'ACTIVE' THEN 0 ELSE 1 END,
                        created_at DESC,
                        id
           ) AS rn
    FROM dbo.users
    WHERE student_id IS NOT NULL
)
UPDATE dbo.users
SET student_id = NULL
WHERE id IN (SELECT id FROM d WHERE rn > 1);

CREATE UNIQUE NONCLUSTERED INDEX uq_users_student_id
    ON dbo.users (student_id)
    WHERE student_id IS NOT NULL;
