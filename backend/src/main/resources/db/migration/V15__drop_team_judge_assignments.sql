-- V15: drop team_judge_assignments.
--
-- Judges for a team are derived from the judge pool (judge_assignments) by scope rather than
-- assigned per team. Score deviation and conflict-of-interest checks now read the pool, so
-- nothing references this table.
-- No FK points at it: V0 creates it standalone and V1..V14 add no index or constraint.
DROP TABLE dbo.team_judge_assignments;
GO
