-- Uses 3 existing COMPLETED demo events for student achievements (max 3 certificates).
-- Also deletes the temporary 2024 events that were added earlier.
-- SQL Server only. Run after seed_demo_events.sql:
-- sqlcmd -S localhost -U sa -P <password> -d SEAL -I -i seed_completed_feedback_achievements.sql
-- Idempotent.

SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @now DATETIME2(6) = SYSUTCDATETIME();
DECLARE @studentId UNIQUEIDENTIFIER = (
    SELECT id FROM dbo.users WHERE email = N'nguyen.hoang.minh@fpt.edu.vn'
);
DECLARE @secondaryStudentId UNIQUEIDENTIFIER = (
    SELECT id FROM dbo.users WHERE email = N'nguyentruongvinh05@gmail.com'
);

IF @studentId IS NULL OR @secondaryStudentId IS NULL
BEGIN
    RAISERROR('Required student accounts are missing.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;

-- Temporary events added earlier (to be removed).
DECLARE @extraEventIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @extraEventIds (id) VALUES
    ('08020000-EEEE-4EEE-8EEE-000000000001'),
    ('09020000-EEEE-4EEE-8EEE-000000000001'),
    ('0A020000-EEEE-4EEE-8EEE-000000000001');

DECLARE @extraTeamIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @extraTeamIds (id)
SELECT t.id FROM dbo.teams t WHERE t.event_id IN (SELECT id FROM @extraEventIds);

DECLARE @extraRoundIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @extraRoundIds (id)
SELECT r.id FROM dbo.rounds r WHERE r.event_id IN (SELECT id FROM @extraEventIds);

DECLARE @extraSubmissionIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @extraSubmissionIds (id)
SELECT s.id
FROM dbo.submissions s
INNER JOIN @extraTeamIds t ON s.team_id = t.id;

DELETE jc FROM dbo.judge_comments jc
INNER JOIN dbo.judge_scores js ON js.id = jc.judge_score_id
WHERE js.submission_id IN (SELECT id FROM @extraSubmissionIds);

DELETE jsd FROM dbo.judge_score_details jsd
INNER JOIN dbo.judge_scores js ON js.id = jsd.judge_score_id
WHERE js.submission_id IN (SELECT id FROM @extraSubmissionIds);

DELETE FROM dbo.judge_scores WHERE submission_id IN (SELECT id FROM @extraSubmissionIds);

IF OBJECT_ID(N'dbo.submission_attachments', N'U') IS NOT NULL
    DELETE sa FROM dbo.submission_attachments sa
    INNER JOIN dbo.submission_versions sv ON sv.id = sa.submission_version_id
    WHERE sv.submission_id IN (SELECT id FROM @extraSubmissionIds);

DELETE FROM dbo.submission_versions WHERE submission_id IN (SELECT id FROM @extraSubmissionIds);
DELETE FROM dbo.submissions WHERE id IN (SELECT id FROM @extraSubmissionIds);

IF OBJECT_ID(N'dbo.mentor_chat_messages', N'U') IS NOT NULL
    DELETE FROM dbo.mentor_chat_messages WHERE team_id IN (SELECT id FROM @extraTeamIds);
IF OBJECT_ID(N'dbo.mentor_feedbacks', N'U') IS NOT NULL
    DELETE FROM dbo.mentor_feedbacks WHERE team_id IN (SELECT id FROM @extraTeamIds);

DELETE FROM dbo.mentor_teams WHERE team_id IN (SELECT id FROM @extraTeamIds);
DELETE FROM dbo.invitations WHERE team_id IN (SELECT id FROM @extraTeamIds);
DELETE FROM dbo.mentor_invitations WHERE team_id IN (SELECT id FROM @extraTeamIds);
DELETE FROM dbo.team_join_requests WHERE team_id IN (SELECT id FROM @extraTeamIds);
DELETE FROM dbo.team_leave_requests WHERE team_id IN (SELECT id FROM @extraTeamIds);
DELETE FROM dbo.team_needed_roles WHERE team_id IN (SELECT id FROM @extraTeamIds);
IF OBJECT_ID(N'dbo.team_progress_alerts', N'U') IS NOT NULL
    DELETE FROM dbo.team_progress_alerts WHERE team_id IN (SELECT id FROM @extraTeamIds);

DELETE FROM dbo.team_members WHERE team_id IN (SELECT id FROM @extraTeamIds);
DELETE FROM dbo.teams WHERE id IN (SELECT id FROM @extraTeamIds);
DELETE FROM dbo.event_enrollments WHERE event_id IN (SELECT id FROM @extraEventIds);
DELETE FROM dbo.participant_feedbacks WHERE event_id IN (SELECT id FROM @extraEventIds);
DELETE FROM dbo.participation_certificates WHERE event_id IN (SELECT id FROM @extraEventIds);
DELETE FROM dbo.score_review_requests WHERE event_id IN (SELECT id FROM @extraEventIds);
DELETE FROM dbo.team_awards WHERE event_id IN (SELECT id FROM @extraEventIds);

DELETE FROM dbo.rankings WHERE round_id IN (SELECT id FROM @extraRoundIds);
DELETE FROM dbo.published_results WHERE round_id IN (SELECT id FROM @extraRoundIds);
DELETE FROM dbo.judge_assignments WHERE round_id IN (SELECT id FROM @extraRoundIds);
DELETE FROM dbo.criteria WHERE round_id IN (SELECT id FROM @extraRoundIds);
DELETE FROM dbo.rounds WHERE id IN (SELECT id FROM @extraRoundIds);

DELETE FROM dbo.event_judge_assignments WHERE event_id IN (SELECT id FROM @extraEventIds);
DELETE FROM dbo.event_mentor_assignments WHERE event_id IN (SELECT id FROM @extraEventIds);
DELETE FROM dbo.mentor_assignments WHERE event_id IN (SELECT id FROM @extraEventIds);
DELETE FROM dbo.prizes WHERE event_id IN (SELECT id FROM @extraEventIds);
DELETE FROM dbo.event_schedules WHERE event_id IN (SELECT id FROM @extraEventIds);
DELETE FROM dbo.allowed_email_domains WHERE event_id IN (SELECT id FROM @extraEventIds);

DELETE cg FROM dbo.competition_groups cg
INNER JOIN dbo.tracks tr ON tr.id = cg.track_id
WHERE tr.event_id IN (SELECT id FROM @extraEventIds);

DELETE FROM dbo.tracks WHERE event_id IN (SELECT id FROM @extraEventIds);
DELETE FROM dbo.hackathon_events WHERE id IN (SELECT id FROM @extraEventIds);

-- Existing COMPLETED events already seeded by seed_demo_events.sql
DECLARE @targetEvents TABLE (
    event_id UNIQUEIDENTIFIER PRIMARY KEY,
    team_id UNIQUEIDENTIFIER NOT NULL
);
INSERT INTO @targetEvents (event_id, team_id) VALUES
    ('01020000-EEEE-4EEE-8EEE-000000000001', '01050000-EEEE-4EEE-8EEE-000000000001'), -- Fall 2025 NeuroRetrieve
    ('02020000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000001'), -- Winter 2025 MultiHop Lab
    ('07020000-EEEE-4EEE-8EEE-000000000001', '07050000-EEEE-4EEE-8EEE-000000000001'); -- Alumni 2026 AlumniRAG

IF EXISTS (
    SELECT 1
    FROM @targetEvents te
    WHERE NOT EXISTS (SELECT 1 FROM dbo.hackathon_events he WHERE he.id = te.event_id AND he.status = 'COMPLETED')
       OR NOT EXISTS (SELECT 1 FROM dbo.teams t WHERE t.id = te.team_id AND t.event_id = te.event_id)
)
BEGIN
    RAISERROR('Required completed demo events/teams are missing. Run seed_demo_events.sql first.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END;

-- Keep both students only on the 3 target COMPLETED events (exactly 3 awards + 3 certificates).
DELETE pf
FROM dbo.participant_feedbacks pf
WHERE pf.user_id IN (@studentId, @secondaryStudentId)
  AND pf.event_id NOT IN (SELECT event_id FROM @targetEvents)
  AND EXISTS (
      SELECT 1 FROM dbo.hackathon_events he
      WHERE he.id = pf.event_id AND he.status = 'COMPLETED'
  );

DELETE pc
FROM dbo.participation_certificates pc
WHERE pc.user_id IN (@studentId, @secondaryStudentId)
  AND pc.event_id NOT IN (SELECT event_id FROM @targetEvents);

DELETE tm
FROM dbo.team_members tm
WHERE tm.user_id IN (@studentId, @secondaryStudentId)
  AND tm.event_id NOT IN (SELECT event_id FROM @targetEvents)
  AND EXISTS (
      SELECT 1 FROM dbo.hackathon_events he
      WHERE he.id = tm.event_id AND he.status = 'COMPLETED'
  );

DELETE ee
FROM dbo.event_enrollments ee
WHERE ee.user_id IN (@studentId, @secondaryStudentId)
  AND ee.event_id NOT IN (SELECT event_id FROM @targetEvents)
  AND EXISTS (
      SELECT 1 FROM dbo.hackathon_events he
      WHERE he.id = ee.event_id AND he.status = 'COMPLETED'
  );

INSERT INTO dbo.event_enrollments (
    id, created_at, enrolled_at, event_id, status, user_id,
    is_looking_for_team, is_profile_public
)
SELECT
    NEWID(), @now, DATEADD(DAY, -30, CAST(he.start_date AS DATETIME2)),
    te.event_id, 'APPROVED', s.user_id, 0, 1
FROM @targetEvents te
INNER JOIN dbo.hackathon_events he ON he.id = te.event_id
CROSS JOIN (VALUES (@studentId), (@secondaryStudentId)) AS s(user_id)
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.event_enrollments ee
    WHERE ee.event_id = te.event_id AND ee.user_id = s.user_id
);

INSERT INTO dbo.team_members (
    id, created_at, joined_at, role, user_id, team_id, event_id
)
SELECT
    NEWID(), @now, DATEADD(DAY, -30, CAST(he.start_date AS DATETIME2)),
    CASE WHEN s.user_id = @studentId THEN 'LEADER' ELSE 'MEMBER' END,
    s.user_id, te.team_id, te.event_id
FROM @targetEvents te
INNER JOIN dbo.hackathon_events he ON he.id = te.event_id
CROSS JOIN (VALUES (@studentId), (@secondaryStudentId)) AS s(user_id)
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.team_members tm
    WHERE tm.event_id = te.event_id AND tm.user_id = s.user_id
);

-- Competition groups for tracks that still lack them (group-first judging).
DECLARE @tracksWithoutGroups TABLE (track_id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @tracksWithoutGroups
SELECT t.id
FROM dbo.tracks t
INNER JOIN dbo.hackathon_events he ON he.id = t.event_id
WHERE he.status <> 'CANCELLED'
  AND NOT EXISTS (
      SELECT 1 FROM dbo.competition_groups cg WHERE cg.track_id = t.id
  );

INSERT INTO dbo.competition_groups (id, track_id, name, created_at, updated_at)
SELECT NEWID(), track_id, N'Group A', @now, @now
FROM @tracksWithoutGroups;

INSERT INTO dbo.competition_groups (id, track_id, name, created_at, updated_at)
SELECT NEWID(), track_id, N'Group B', @now, @now
FROM @tracksWithoutGroups;

;WITH RankedTeams AS (
    SELECT
        t.id AS team_id,
        t.track_id,
        ROW_NUMBER() OVER (PARTITION BY t.track_id ORDER BY t.created_at, t.id) AS team_no
    FROM dbo.teams t
    WHERE t.track_id IS NOT NULL
      AND t.group_id IS NULL
      AND t.status <> 'DISBANDED'
),
RankedGroups AS (
    SELECT
        cg.id AS group_id,
        cg.track_id,
        ROW_NUMBER() OVER (PARTITION BY cg.track_id ORDER BY cg.name, cg.id) AS group_no,
        COUNT(*) OVER (PARTITION BY cg.track_id) AS group_count
    FROM dbo.competition_groups cg
)
UPDATE team
SET group_id = grp.group_id,
    updated_at = @now
FROM dbo.teams team
INNER JOIN RankedTeams rt ON rt.team_id = team.id
INNER JOIN RankedGroups grp
    ON grp.track_id = rt.track_id
   AND grp.group_no = ((rt.team_no - 1) % grp.group_count) + 1;

-- Certificates only for the 3 target events (max 3 per student).
INSERT INTO dbo.participation_certificates (
    id, created_at, updated_at, event_id, issued_at, team_id, user_id
)
SELECT
    NEWID(), @now, @now, te.event_id,
    DATEADD(HOUR, 11, CAST(he.end_date AS DATETIME2)),
    te.team_id, s.user_id
FROM @targetEvents te
INNER JOIN dbo.hackathon_events he ON he.id = te.event_id
CROSS JOIN (VALUES (@studentId), (@secondaryStudentId)) AS s(user_id)
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.participation_certificates pc
    WHERE pc.event_id = te.event_id AND pc.user_id = s.user_id
);

;WITH RankedCertificates AS (
    SELECT
        pc.id,
        ROW_NUMBER() OVER (
            PARTITION BY pc.user_id
            ORDER BY
                CASE WHEN EXISTS (
                    SELECT 1 FROM @targetEvents te WHERE te.event_id = pc.event_id
                ) THEN 0 ELSE 1 END,
                pc.issued_at DESC,
                pc.id
        ) AS certificate_no
    FROM dbo.participation_certificates pc
)
DELETE FROM RankedCertificates
WHERE certificate_no > 3;

-- Ensure every COMPLETED event still has feedback for admin review.
INSERT INTO dbo.participant_feedbacks (
    id, created_at, updated_at, comment, event_id,
    overall_rating, submitted_at, team_id, user_id
)
SELECT
    NEWID(), @now, @now,
    N'Well organized event with clear judging criteria; the round-by-round feedback genuinely helped our team improve the product.',
    he.id,
    5,
    DATEADD(DAY, 1, CAST(he.end_date AS DATETIME2)),
    tm.team_id, tm.user_id
FROM dbo.hackathon_events he
INNER JOIN dbo.team_members tm ON tm.event_id = he.id
INNER JOIN dbo.teams t ON t.id = tm.team_id AND t.status = 'CONFIRMED'
WHERE he.status = 'COMPLETED'
  AND NOT EXISTS (
      SELECT 1 FROM dbo.participant_feedbacks pf
      WHERE pf.event_id = he.id AND pf.user_id = tm.user_id
  );

COMMIT TRANSACTION;

SELECT
    u.email,
    COUNT(DISTINCT ta.id) AS awards,
    COUNT(DISTINCT pc.id) AS certificates
FROM dbo.users u
LEFT JOIN dbo.team_members tm ON tm.user_id = u.id
LEFT JOIN dbo.team_awards ta ON ta.team_id = tm.team_id
LEFT JOIN dbo.participation_certificates pc ON pc.user_id = u.id
WHERE u.email IN (N'nguyen.hoang.minh@fpt.edu.vn', N'nguyentruongvinh05@gmail.com')
GROUP BY u.email
ORDER BY u.email;

SELECT id, name, status
FROM dbo.hackathon_events
WHERE status = 'COMPLETED'
ORDER BY end_date;
