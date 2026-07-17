-- V16: allow reusing a disbanded team's name.
--
-- Disbanded teams are kept as history rows but no longer "occupy" their name.
-- The plain UNIQUE (event_id, name) blocks creating a new team named like a
-- disbanded one, so it is replaced with a filtered unique index that only
-- applies to live teams (FORMING / CONFIRMED).
--
-- Hibernate ddl-auto=validate does not verify unique constraints (see V11),
-- so the entity-level @UniqueConstraint annotation stays harmless.
ALTER TABLE dbo.teams DROP CONSTRAINT UKh96ggvfjvw458isq93w50kmrf;
GO
CREATE UNIQUE NONCLUSTERED INDEX uq_teams_event_name_live
    ON dbo.teams (event_id, name)
    WHERE status <> 'DISBANDED';
GO
