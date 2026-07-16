-- V9: stop team_members.event_id from drifting away from its team's event.
-- See backend/docs/adr-fk-policy.md.
--
-- BR-18 ("one team per user per event") is enforced by uq_team_member_event_user UNIQUE
-- (event_id, user_id) on team_members. That column is denormalized from teams.event_id (V1) and
-- nothing has ever kept the two in step. A row written with the wrong event_id makes the unique
-- constraint compare against the wrong event, so BR-18 stops holding -- silently, with no error
-- and no orphan to notice. The user simply ends up on two teams in one event.
--
-- A composite FK fixes this declaratively; no trigger is needed. It also stays inside the team
-- module: it references teams, NOT hackathon_events, so it does not create the cross-module
-- database coupling the FK policy forbids.
--
-- team_members.team_id already has its own FK to teams(id) (V0). It is left in place: the
-- composite subsumes it, but dropping a working constraint buys nothing here.
--
-- If this migration fails with a constraint violation, the database already holds rows where
-- team_members.event_id != teams.event_id. Find them before retrying:
--
--   SELECT tm.id, tm.team_id, tm.event_id AS member_event, t.event_id AS team_event
--   FROM dbo.team_members tm
--   JOIN dbo.teams t ON t.id = tm.team_id
--   WHERE tm.event_id <> t.event_id;
--
-- Those rows are BR-18 violations that were already live; they need a decision, not a silent fix.

-- FK targets must be backed by a unique constraint. id is already the PK, so this pair is unique
-- by construction -- the index exists only to give the FK below something to point at.
ALTER TABLE dbo.teams
    ADD CONSTRAINT uq_teams_id_event UNIQUE (id, event_id);
GO

ALTER TABLE dbo.team_members
    ADD CONSTRAINT fk_team_member_team_event
    FOREIGN KEY (team_id, event_id) REFERENCES dbo.teams (id, event_id);
GO
