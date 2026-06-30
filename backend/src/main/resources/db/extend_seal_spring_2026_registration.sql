-- Extend SEAL Hackathon Spring 2026 registration window for external-student testing.
-- Also shifts competition dates forward so resolveStatus() returns OPEN (not COMPLETED).

DECLARE @eventId UNIQUEIDENTIFIER = '77F2A5A3-6538-4FCF-B85A-666066465E68';

UPDATE hackathon_events
SET registration_open_date = '2026-03-15',
    registration_deadline = '2026-07-31',
    start_date = '2026-08-15',
    end_date = '2026-08-15',
    status = 'UPCOMING',
    updated_at = SYSUTCDATETIME()
WHERE id = @eventId;

PRINT 'SEAL Hackathon Spring 2026 registration extended through 2026-07-31.';
