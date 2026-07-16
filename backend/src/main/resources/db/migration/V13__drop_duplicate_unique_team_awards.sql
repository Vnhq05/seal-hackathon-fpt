-- V13: drop the duplicate UNIQUE on team_awards that V11 missed.
--
-- Same residue V11 removed from four other tables: a hand-named uq_* and a Hibernate UK<hash> on the
-- identical (event_id, team_id), two unique indexes maintained for one guarantee. Keep the readable
-- uq_team_award_event_team; drop the generated duplicate.
ALTER TABLE dbo.team_awards DROP CONSTRAINT UKpjyb6tp2bup52n3kdss4mg94a;
GO
