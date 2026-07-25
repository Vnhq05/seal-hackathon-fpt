-- Patch local DEV events so AS2 can demo:
--   1) Competition progress / at-risk teams
--   2) Publish results by track + round
-- Safe: only touches named DEV events below. Idempotent on re-run for progress teams.
-- Password for accounts already in DB (coordinator / lecturer / progresstest*): use your existing seed passwords.

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @now DATETIME2 = SYSUTCDATETIME();

DECLARE @progressEventId UNIQUEIDENTIFIER = '92FD2C6D-E6DB-4B4B-B034-AB240D5627F9'; -- DEV Competition Progress Test
DECLARE @progressRoundId UNIQUEIDENTIFIER = '0F96E4B6-8991-449F-B4F1-39B6FBFC327C';
DECLARE @progressTrackId UNIQUEIDENTIFIER = '580A20EC-FACD-4818-951D-4F8B0C09396D';
DECLARE @progressTeamNoSubmit UNIQUEIDENTIFIER = 'FC952D2C-467F-418E-A76A-428619010AC2';

DECLARE @lockEventId UNIQUEIDENTIFIER = '5BD90FF7-8FB9-48A9-A7FA-7A9E2C0F36AE'; -- DEV Submission Lock Test
DECLARE @lockPrelimId UNIQUEIDENTIFIER = '78776040-3CF7-41D9-A2D4-61A8F807B9CA';
DECLARE @lockFinalId UNIQUEIDENTIFIER = '72ABD3B4-1F90-4481-965B-DECCC16E9321';

DECLARE @coordId UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'coordinator@seal.com');
DECLARE @mentorId UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'mentor.lbtest@fpt.edu.vn');
DECLARE @u101 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'progresstest101@fpt.edu.vn');
DECLARE @u102 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'progresstest102@fpt.edu.vn');
DECLARE @u103 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'progresstest103@fpt.edu.vn');
DECLARE @u104 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'progresstest104@fpt.edu.vn');
DECLARE @u105 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'progresstest105@fpt.edu.vn');

IF @coordId IS NULL OR @mentorId IS NULL OR @u101 IS NULL OR @u102 IS NULL OR @u103 IS NULL OR @u104 IS NULL OR @u105 IS NULL
BEGIN
    RAISERROR('Required users missing (coordinator / mentor.lbtest / progresstest101-105).', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END

IF NOT EXISTS (SELECT 1 FROM hackathon_events WHERE id = @progressEventId)
   OR NOT EXISTS (SELECT 1 FROM hackathon_events WHERE id = @lockEventId)
BEGIN
    RAISERROR('DEV Competition Progress Test or DEV Submission Lock Test not found.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END

-- ============================================================
-- A) Publish-by-track/round: tune Lock Test (already has scores+rankings)
-- ============================================================
UPDATE hackathon_events
SET status = N'SCORING',
    leaderboard_public = 0,
    updated_at = @now
WHERE id = @lockEventId;

UPDATE rounds
SET advancement_rule = N'PER_TRACK_TOP_N',
    advancement_cutoff = 1,
    round_type = N'PRELIMINARY',
    updated_at = @now
WHERE id = @lockPrelimId;

UPDATE rounds
SET advancement_rule = N'NONE',
    round_type = N'FINAL',
    updated_at = @now
WHERE id = @lockFinalId;

-- Ensure no published_results so coordinator can click Publish
DELETE FROM published_results WHERE round_id IN (@lockPrelimId, @lockFinalId);

-- ============================================================
-- B) Progress board: reopen deadline window + mixed risk teams
-- ============================================================
UPDATE hackathon_events
SET status = N'ACTIVE',
    start_date = CAST(DATEADD(DAY, -1, @now) AS DATE),
    end_date = CAST(DATEADD(DAY, 3, @now) AS DATE),
    registration_deadline = CAST(DATEADD(DAY, -1, @now) AS DATE),
    leaderboard_public = 1,
    updated_at = @now
WHERE id = @progressEventId;

UPDATE rounds
SET start_date = DATEADD(DAY, -1, @now),
    slide_deadline = DATEADD(HOUR, -4, @now),
    submission_deadline = DATEADD(HOUR, 2, @now), -- inside alert-lead-time (6h)
    scoring_deadline = DATEADD(DAY, 2, @now),
    end_date = DATEADD(DAY, 2, @now),
    round_type = N'PRELIMINARY',
    updated_at = @now
WHERE id = @progressRoundId;

-- Wipe prior progress demo graph for this event (keep Team No Submit shell)
DECLARE @extraTeams TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @extraTeams (id)
SELECT id FROM teams
WHERE event_id = @progressEventId
  AND id <> @progressTeamNoSubmit;

DECLARE @extraSubs TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @extraSubs (id)
SELECT s.id FROM submissions s
WHERE s.round_id = @progressRoundId
   OR s.team_id IN (SELECT id FROM @extraTeams);

DELETE FROM notification_recipients WHERE notification_id IN (
    SELECT id FROM notifications
    WHERE type = N'TEAM_PROGRESS_ALERT'
      AND reference_id IN (
          SELECT id FROM teams WHERE event_id = @progressEventId
      ));
DELETE FROM notifications
WHERE type = N'TEAM_PROGRESS_ALERT'
  AND reference_id IN (SELECT id FROM teams WHERE event_id = @progressEventId);

DELETE FROM team_progress_alerts WHERE round_id = @progressRoundId;

DELETE sa FROM submission_attachments sa
INNER JOIN submission_versions sv ON sv.id = sa.submission_version_id
WHERE sv.submission_id IN (SELECT id FROM @extraSubs);
DELETE FROM submission_versions WHERE submission_id IN (SELECT id FROM @extraSubs);
DELETE FROM submissions WHERE id IN (SELECT id FROM @extraSubs);

DELETE FROM mentor_teams WHERE team_id IN (SELECT id FROM @extraTeams) OR team_id = @progressTeamNoSubmit;
DELETE FROM team_members WHERE team_id IN (SELECT id FROM @extraTeams);
DELETE FROM teams WHERE id IN (SELECT id FROM @extraTeams);

-- Keep enrollments for progresstest*; ensure all five enrolled
MERGE event_enrollments AS t
USING (VALUES
    (@u101), (@u102), (@u103), (@u104), (@u105)
) AS s(user_id)
ON t.event_id = @progressEventId AND t.user_id = s.user_id
WHEN NOT MATCHED THEN
    INSERT (id, created_at, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
    VALUES (NEWID(), @now, @now, @progressEventId, N'APPROVED', s.user_id, 0, 0);

-- Mentor on event + track
IF NOT EXISTS (SELECT 1 FROM event_mentor_assignments WHERE event_id = @progressEventId AND mentor_user_id = @mentorId)
    INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at)
    VALUES (NEWID(), @progressEventId, @mentorId, @now, @now);

IF NOT EXISTS (SELECT 1 FROM mentor_assignments WHERE event_id = @progressEventId AND mentor_user_id = @mentorId AND track_id = @progressTrackId)
    INSERT INTO mentor_assignments (id, created_at, assigned_at, mentor_user_id, event_id, track_id)
    VALUES (NEWID(), @now, @now, @mentorId, @progressEventId, @progressTrackId);

-- Fixed team ids for progress scenarios
DECLARE @teamStalled UNIQUEIDENTIFIER = 'A1000001-EEEE-4EEE-8EEE-000000000001';
DECLARE @teamLastMin UNIQUEIDENTIFIER = 'A1000001-EEEE-4EEE-8EEE-000000000002';
DECLARE @teamHealthy UNIQUEIDENTIFIER = 'A1000001-EEEE-4EEE-8EEE-000000000003';

INSERT INTO teams (id, created_at, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, is_recruiting, recruitment_note)
VALUES
    (@teamStalled, @now, @progressEventId, @u102, N'Team Stalled Build', N'CONFIRMED', @progressTrackId, @now, N'MANUAL', 0, N'Progress demo: STALLED'),
    (@teamLastMin, @now, @progressEventId, @u103, N'Team Last Minute', N'CONFIRMED', @progressTrackId, @now, N'MANUAL', 0, N'Progress demo: LAST_MINUTE'),
    (@teamHealthy, @now, @progressEventId, @u104, N'Team Healthy Progress', N'CONFIRMED', @progressTrackId, @now, N'MANUAL', 0, N'Progress demo: OK');

-- Ensure Team No Submit still on track / confirmed / led by 101
UPDATE teams
SET name = N'Team No Submit',
    status = N'CONFIRMED',
    leader_id = @u101,
    track_id = @progressTrackId,
    track_assigned_at = @now,
    track_assignment_method = N'MANUAL',
    updated_at = @now
WHERE id = @progressTeamNoSubmit;

DELETE FROM team_members WHERE team_id = @progressTeamNoSubmit;
INSERT INTO team_members (id, created_at, joined_at, role, user_id, team_id) VALUES
    (NEWID(), @now, @now, N'LEADER', @u101, @progressTeamNoSubmit),
    (NEWID(), @now, @now, N'LEADER', @u102, @teamStalled),
    (NEWID(), @now, @now, N'LEADER', @u103, @teamLastMin),
    (NEWID(), @now, @now, N'LEADER', @u104, @teamHealthy),
    (NEWID(), @now, @now, N'MEMBER', @u105, @teamHealthy);

INSERT INTO mentor_teams (id, created_at, assigned_at, mentor_user_id, team_id) VALUES
    (NEWID(), @now, @now, @mentorId, @progressTeamNoSubmit),
    (NEWID(), @now, @now, @mentorId, @teamStalled),
    (NEWID(), @now, @now, @mentorId, @teamLastMin),
    (NEWID(), @now, @now, @mentorId, @teamHealthy);

-- Submissions: stalled / last-minute / healthy (2 versions)
DECLARE @subStalled UNIQUEIDENTIFIER = 'A2000001-EEEE-4EEE-8EEE-000000000001';
DECLARE @subLast UNIQUEIDENTIFIER = 'A2000001-EEEE-4EEE-8EEE-000000000002';
DECLARE @subOk UNIQUEIDENTIFIER = 'A2000001-EEEE-4EEE-8EEE-000000000003';
DECLARE @verStalled UNIQUEIDENTIFIER = 'A3000001-EEEE-4EEE-8EEE-000000000001';
DECLARE @verLast UNIQUEIDENTIFIER = 'A3000001-EEEE-4EEE-8EEE-000000000002';
DECLARE @verOk1 UNIQUEIDENTIFIER = 'A3000001-EEEE-4EEE-8EEE-000000000003';
DECLARE @verOk2 UNIQUEIDENTIFIER = 'A3000001-EEEE-4EEE-8EEE-000000000004';

INSERT INTO submissions (id, created_at, current_version_id, round_id, status, submitted_by, team_id) VALUES
    (@subStalled, @now, NULL, @progressRoundId, N'SUBMITTED', @u102, @teamStalled),
    (@subLast, @now, NULL, @progressRoundId, N'SUBMITTED', @u103, @teamLastMin),
    (@subOk, @now, NULL, @progressRoundId, N'SUBMITTED', @u104, @teamHealthy);

INSERT INTO submission_versions (id, created_at, demo_url, github_url, slide_url, submitted_at, version_number, submission_id) VALUES
    (@verStalled, @now,
     N'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
     N'https://github.com/seal-fpt/team-stalled',
     N'https://docs.google.com/presentation/d/progress-stalled',
     DATEADD(HOUR, -30, @now), 1, @subStalled),
    (@verLast, @now,
     N'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
     N'https://github.com/seal-fpt/team-last-minute',
     N'https://docs.google.com/presentation/d/progress-last',
     DATEADD(MINUTE, -45, @now), 1, @subLast),
    (@verOk1, @now,
     N'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
     N'https://github.com/seal-fpt/team-healthy',
     N'https://docs.google.com/presentation/d/progress-ok-v1',
     DATEADD(HOUR, -40, @now), 1, @subOk),
    (@verOk2, @now,
     N'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
     N'https://github.com/seal-fpt/team-healthy',
     N'https://docs.google.com/presentation/d/progress-ok-v2',
     DATEADD(HOUR, -3, @now), 2, @subOk);

INSERT INTO submission_attachments (id, created_at, file_name, file_size, file_url, page_count, submission_version_id) VALUES
    (NEWID(), @now, N'pitch.pdf', 102400, N'/uploads/demo/progress-stalled.pdf', 2, @verStalled),
    (NEWID(), @now, N'pitch.pdf', 102400, N'/uploads/demo/progress-last.pdf', 2, @verLast),
    (NEWID(), @now, N'pitch-v2.pdf', 204800, N'/uploads/demo/progress-ok-v2.pdf', 2, @verOk2);

UPDATE submissions SET current_version_id = @verStalled WHERE id = @subStalled;
UPDATE submissions SET current_version_id = @verLast WHERE id = @subLast;
UPDATE submissions SET current_version_id = @verOk2 WHERE id = @subOk;

INSERT INTO team_progress_alerts (id, team_id, round_id, risk_level, reasons, last_alerted_at, created_at, updated_at) VALUES
    (NEWID(), @progressTeamNoSubmit, @progressRoundId, N'CRITICAL', N'NOT_STARTED', @now, @now, @now),
    (NEWID(), @teamStalled, @progressRoundId, N'AT_RISK', N'STALLED', @now, @now, @now),
    (NEWID(), @teamLastMin, @progressRoundId, N'AT_RISK', N'SINGLE_VERSION_LAST_MINUTE', @now, @now, @now);

DECLARE @n1 UNIQUEIDENTIFIER = NEWID();
DECLARE @n2 UNIQUEIDENTIFIER = NEWID();
DECLARE @n3 UNIQUEIDENTIFIER = NEWID();

INSERT INTO notifications (id, created_at, message, reference_id, reference_type, title, type) VALUES
    (@n1, @now, N'Team No Submit has not started submission and the deadline is approaching (NOT_STARTED).', @progressTeamNoSubmit, N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT'),
    (@n2, @now, N'Team Stalled Build has stalled — no submission update in 24h+ (STALLED).', @teamStalled, N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT'),
    (@n3, @now, N'Team Last Minute submitted a single version in the last-minute window (SINGLE_VERSION_LAST_MINUTE).', @teamLastMin, N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT');

INSERT INTO notification_recipients (id, created_at, channel, read_at, sent_at, user_id, notification_id) VALUES
    (NEWID(), @now, N'IN_APP', NULL, @now, @u101, @n1),
    (NEWID(), @now, N'IN_APP', NULL, @now, @mentorId, @n1),
    (NEWID(), @now, N'IN_APP', NULL, @now, @coordId, @n1),
    (NEWID(), @now, N'IN_APP', NULL, @now, @u102, @n2),
    (NEWID(), @now, N'IN_APP', NULL, @now, @mentorId, @n2),
    (NEWID(), @now, N'IN_APP', NULL, @now, @coordId, @n2),
    (NEWID(), @now, N'IN_APP', NULL, @now, @u103, @n3),
    (NEWID(), @now, N'IN_APP', NULL, @now, @mentorId, @n3),
    (NEWID(), @now, N'IN_APP', NULL, @now, @coordId, @n3);

COMMIT TRANSACTION;

PRINT 'AS2 patch complete.';
PRINT '1) Progress: DEV Competition Progress Test (92FD2C6D-...) — deadline +2h, 4 teams (NOT_STARTED/STALLED/LAST_MINUTE/OK)';
PRINT '   Login: coordinator@seal.com | mentor.lbtest@fpt.edu.vn | progresstest101@fpt.edu.vn';
PRINT '2) Publish: DEV Submission Lock Test (5BD90FF7-...) — rankings ready, NOT published, PER_TRACK_TOP_N on prelim';
PRINT '   Login: coordinator@seal.com → /coordinator/livescore/5BD90FF7-8FB9-48A9-A7FA-7A9E2C0F36AE';
