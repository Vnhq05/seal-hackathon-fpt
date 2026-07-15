-- V3: optimistic locking columns for workflow aggregates.
-- Ranking keeps business column `version`; uses `lock_version` for @Version.
-- Submission uses `opt_lock` to avoid clashing with submission_versions conceptually.

ALTER TABLE dbo.teams ADD version BIGINT NOT NULL CONSTRAINT DF_teams_version DEFAULT (0);
ALTER TABLE dbo.invitations ADD version BIGINT NOT NULL CONSTRAINT DF_invitations_version DEFAULT (0);
ALTER TABLE dbo.team_join_requests ADD version BIGINT NOT NULL CONSTRAINT DF_team_join_requests_version DEFAULT (0);
ALTER TABLE dbo.team_leave_requests ADD version BIGINT NOT NULL CONSTRAINT DF_team_leave_requests_version DEFAULT (0);
ALTER TABLE dbo.submissions ADD opt_lock BIGINT NOT NULL CONSTRAINT DF_submissions_opt_lock DEFAULT (0);
ALTER TABLE dbo.rankings ADD lock_version BIGINT NOT NULL CONSTRAINT DF_rankings_lock_version DEFAULT (0);
ALTER TABLE dbo.score_review_requests ADD version BIGINT NOT NULL CONSTRAINT DF_score_review_requests_version DEFAULT (0);
