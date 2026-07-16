-- V12: give the three same-module event children the FK they were missing.
-- See backend/docs/adr-fk-policy.md, category (a).
--
-- event_schedules, allowed_email_domains and track_draw_sessions all carry event_id but had no FK to
-- hackathon_events and no JPA cascade from it, so EventService.deleteEvent silently orphaned them.
-- These are same-module children of the event aggregate, so per the FK policy they get a FK. The
-- action stays NO ACTION to match every other event child (rounds, tracks, prizes, ...); deleteEvent
-- now removes these three explicitly before deleting the event, the same way JPA removes the others.
--
-- allowed_email_domains.event_id is nullable (platform-wide domains have no event); a FK permits null,
-- so those rows are unaffected.
--
-- WITH CHECK (the default) validates existing rows. If it fails, orphans already exist -- find them:
--   SELECT 'event_schedules' t, s.id FROM dbo.event_schedules s
--     LEFT JOIN dbo.hackathon_events e ON e.id = s.event_id WHERE e.id IS NULL
--   UNION ALL SELECT 'allowed_email_domains', d.id FROM dbo.allowed_email_domains d
--     LEFT JOIN dbo.hackathon_events e ON e.id = d.event_id WHERE d.event_id IS NOT NULL AND e.id IS NULL
--   UNION ALL SELECT 'track_draw_sessions', ts.id FROM dbo.track_draw_sessions ts
--     LEFT JOIN dbo.hackathon_events e ON e.id = ts.event_id WHERE e.id IS NULL;
ALTER TABLE dbo.event_schedules
    ADD CONSTRAINT fk_event_schedule_event
    FOREIGN KEY (event_id) REFERENCES dbo.hackathon_events (id);
GO

ALTER TABLE dbo.allowed_email_domains
    ADD CONSTRAINT fk_allowed_email_domain_event
    FOREIGN KEY (event_id) REFERENCES dbo.hackathon_events (id);
GO

ALTER TABLE dbo.track_draw_sessions
    ADD CONSTRAINT fk_track_draw_session_event
    FOREIGN KEY (event_id) REFERENCES dbo.hackathon_events (id);
GO
