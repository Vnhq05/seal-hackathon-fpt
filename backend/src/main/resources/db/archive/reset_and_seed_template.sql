-- Reset all hackathon events and rebuild SEAL Hackathon Spring 2026 template.
-- Prerequisites:
--   1. Start backend once with profile `dev` (DataSeeder seeds scoring_templates).
--   2. Run bootstrap_admin.sql first — @ownerEmail below must exist in `users`.
-- Run: sqlcmd -S localhost -U sa -P <password> -d SEAL -I -i reset_and_seed_template.sql

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- Owner of the seeded event. Must match an EVENT_COORDINATOR or SYSTEM_ADMIN in `users`:
-- ownership is enforced via owner_user_id (V7); created_by is audit-only.
DECLARE @ownerEmail NVARCHAR(255) = N'admin@seal.com';
DECLARE @ownerUserId UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = @ownerEmail);

DECLARE @now DATETIME2 = SYSUTCDATETIME();
DECLARE @today DATE = CAST(@now AS DATE);
DECLARE @templateId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM scoring_templates ORDER BY created_at);

IF @ownerUserId IS NULL
BEGIN
    RAISERROR('Owner %s not found in users — run bootstrap_admin.sql first.', 16, 1, @ownerEmail);
    ROLLBACK TRANSACTION;
    RETURN;
END

DECLARE @eventId UNIQUEIDENTIFIER = '77F2A5A3-6538-4FCF-B85A-666066465E68';
DECLARE @prelimId UNIQUEIDENTIFIER = 'A1000001-0001-0001-0001-000000000001';
DECLARE @finalId UNIQUEIDENTIFIER = 'A1000001-0001-0001-0001-000000000002';
DECLARE @trackA UNIQUEIDENTIFIER = 'A2000001-0001-0001-0001-000000000001';
DECLARE @trackB UNIQUEIDENTIFIER = 'A2000001-0001-0001-0001-000000000002';
DECLARE @trackC UNIQUEIDENTIFIER = 'A2000001-0001-0001-0001-000000000003';

DECLARE @regOpen DATE = DATEADD(MONTH, -3, @today);
DECLARE @regDeadline DATE = DATEADD(MONTH, 1, @today);
DECLARE @compDay DATE = DATEADD(MONTH, 2, @today);
DECLARE @compDayDt DATETIME2 = CAST(@compDay AS DATETIME2);
DECLARE @dayM3 DATETIME2 = DATEADD(DAY, -3, @compDayDt);
DECLARE @dayM1 DATETIME2 = DATEADD(DAY, -1, @compDayDt);

DECLARE @allEventIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @allEventIds (id) SELECT id FROM hackathon_events;

DECLARE @teamIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @teamIds (id)
SELECT t.id FROM teams t WHERE t.event_id IN (SELECT id FROM @allEventIds);

-- Orphans left by earlier incomplete wipes (team.event_id points at a deleted event).
INSERT INTO @teamIds (id)
SELECT t.id FROM teams t
WHERE NOT EXISTS (SELECT 1 FROM hackathon_events e WHERE e.id = t.event_id)
  AND NOT EXISTS (SELECT 1 FROM @teamIds x WHERE x.id = t.id);

DECLARE @roundIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @roundIds (id)
SELECT r.id FROM rounds r WHERE r.event_id IN (SELECT id FROM @allEventIds);

DECLARE @submissionIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @submissionIds (id)
SELECT s.id FROM submissions s
INNER JOIN @teamIds t ON s.team_id = t.id;

-- Deep cleanup (FK-safe order)
DELETE jc FROM judge_comments jc
INNER JOIN judge_scores js ON js.id = jc.judge_score_id
WHERE js.submission_id IN (SELECT id FROM @submissionIds);

DELETE jsd FROM judge_score_details jsd
INNER JOIN judge_scores js ON js.id = jsd.judge_score_id
WHERE js.submission_id IN (SELECT id FROM @submissionIds);

DELETE FROM judge_scores WHERE submission_id IN (SELECT id FROM @submissionIds);

-- Orphan scores left when a submission was deleted outside this wipe.
DELETE jc FROM judge_comments jc
INNER JOIN judge_scores js ON js.id = jc.judge_score_id
WHERE NOT EXISTS (SELECT 1 FROM submissions s WHERE s.id = js.submission_id);

DELETE jsd FROM judge_score_details jsd
INNER JOIN judge_scores js ON js.id = jsd.judge_score_id
WHERE NOT EXISTS (SELECT 1 FROM submissions s WHERE s.id = js.submission_id);

DELETE FROM judge_scores
WHERE NOT EXISTS (SELECT 1 FROM submissions s WHERE s.id = judge_scores.submission_id);

DELETE sa FROM submission_attachments sa
INNER JOIN submission_versions sv ON sv.id = sa.submission_version_id
WHERE sv.submission_id IN (SELECT id FROM @submissionIds);

DELETE FROM submission_versions WHERE submission_id IN (SELECT id FROM @submissionIds);
DELETE FROM submissions WHERE id IN (SELECT id FROM @submissionIds);

DELETE FROM mentor_teams WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM invitations WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM mentor_invitations WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM team_join_requests WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM team_leave_requests WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM team_needed_roles WHERE team_id IN (SELECT id FROM @teamIds);

IF OBJECT_ID(N'team_progress_alerts', N'U') IS NOT NULL
    DELETE FROM team_progress_alerts WHERE team_id IN (SELECT id FROM @teamIds);

DELETE FROM team_members WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM teams WHERE id IN (SELECT id FROM @teamIds);

DELETE FROM event_enrollments WHERE event_id IN (SELECT id FROM @allEventIds);
-- Orphan enrollments whose event was already gone before this run.
DELETE FROM event_enrollments
WHERE NOT EXISTS (SELECT 1 FROM hackathon_events e WHERE e.id = event_enrollments.event_id);
DELETE FROM event_magic_tokens WHERE event_id IN (SELECT id FROM @allEventIds);
DELETE FROM participant_feedbacks WHERE event_id IN (SELECT id FROM @allEventIds);
DELETE FROM participation_certificates WHERE event_id IN (SELECT id FROM @allEventIds);
DELETE FROM score_review_requests WHERE event_id IN (SELECT id FROM @allEventIds);
DELETE FROM team_awards WHERE event_id IN (SELECT id FROM @allEventIds);

DELETE FROM finalist_contested_slot_teams WHERE contested_slot_id IN (
    SELECT id FROM finalist_contested_slots WHERE event_id IN (SELECT id FROM @allEventIds)
);
DELETE FROM finalist_contested_slots WHERE event_id IN (SELECT id FROM @allEventIds);
DELETE FROM finalist_selections WHERE event_id IN (SELECT id FROM @allEventIds);
DELETE FROM track_draw_sessions WHERE event_id IN (SELECT id FROM @allEventIds);

IF OBJECT_ID(N'disputes', N'U') IS NOT NULL
    DELETE FROM disputes WHERE round_id IN (SELECT id FROM @roundIds);

IF OBJECT_ID(N'advancements', N'U') IS NOT NULL
    DELETE FROM advancements WHERE round_id IN (SELECT id FROM @roundIds);

DELETE FROM rankings WHERE round_id IN (SELECT id FROM @roundIds);
DELETE FROM published_results WHERE round_id IN (SELECT id FROM @roundIds);

DELETE ja FROM judge_assignments ja WHERE ja.round_id IN (SELECT id FROM @roundIds);
DELETE c FROM criteria c WHERE c.round_id IN (SELECT id FROM @roundIds);
DELETE FROM rounds WHERE id IN (SELECT id FROM @roundIds);

DELETE FROM event_judge_assignments WHERE event_id IN (SELECT id FROM @allEventIds);
DELETE FROM event_mentor_assignments WHERE event_id IN (SELECT id FROM @allEventIds);
DELETE FROM mentor_assignments WHERE event_id IN (SELECT id FROM @allEventIds);
DELETE FROM event_tiebreaker_criteria WHERE event_id IN (SELECT id FROM @allEventIds);
DELETE FROM honored_guests WHERE event_id IN (SELECT id FROM @allEventIds);
DELETE FROM prizes WHERE event_id IN (SELECT id FROM @allEventIds);
DELETE FROM event_schedules WHERE event_id IN (SELECT id FROM @allEventIds);
DELETE FROM allowed_email_domains WHERE event_id IN (SELECT id FROM @allEventIds);
DELETE FROM tracks WHERE event_id IN (SELECT id FROM @allEventIds);
DELETE FROM hackathon_events WHERE id IN (SELECT id FROM @allEventIds);

IF @templateId IS NULL
BEGIN
    RAISERROR('No scoring template found. Start backend with dev profile first.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END

INSERT INTO hackathon_events (
    id, name, season, year, start_date, end_date,
    registration_open_date, registration_deadline,
    description, location, format, competition_format,
    min_team, max_team, semester_min, semester_max,
    scoring_template_id, status, leaderboard_public,
    owner_user_id, created_by, created_at, updated_at
) VALUES (
    @eventId,
    N'SEAL Hackathon Spring 2026',
    N'Spring', 2026,
    @compDay, @compDay,
    @regOpen, @regDeadline,
    N'SEAL Hackathon Spring 2026 - Agentic RAG',
    N'FPT University HCM', 'OFFLINE', 'SEAL_RAG_2026',
    3, 5, 4, 8,
    @templateId, 'UPCOMING', 0,
    @ownerUserId, @ownerEmail, @now, @now
);

INSERT INTO tracks (id, event_id, name, description, max_teams, status, created_at, updated_at) VALUES
    (@trackA, @eventId, N'Track A', N'SEAL Spring 2026 - Track A', 8, 'OPEN', @now, @now),
    (@trackB, @eventId, N'Track B', N'SEAL Spring 2026 - Track B', 8, 'OPEN', @now, @now),
    (@trackC, @eventId, N'Track C', N'SEAL Spring 2026 - Track C', 8, 'OPEN', @now, @now);

INSERT INTO rounds (
    id, event_id, round_number, name, round_type,
    start_date, end_date, slide_deadline, submission_deadline, scoring_deadline,
    advancement_cutoff, advancement_rule, round_weight, created_at, updated_at
) VALUES
    (@prelimId, @eventId, 1, N'Preliminary Round', 'PRELIMINARY',
     DATEADD(HOUR, 7, @compDayDt),
     DATEADD(MINUTE, 15 * 60 + 30, @compDayDt),
     DATEADD(HOUR, 10, @compDayDt),
     DATEADD(HOUR, 14, @compDayDt),
     DATEADD(MINUTE, 15 * 60 + 30, @compDayDt),
     2, 'PER_TRACK_TOP_N', 40, @now, @now),
    (@finalId, @eventId, 2, N'Finals', 'FINAL',
     DATEADD(MINUTE, 15 * 60 + 30, @compDayDt),
     DATEADD(HOUR, 17, @compDayDt),
     NULL,
     DATEADD(MINUTE, 15 * 60 + 30, @compDayDt),
     DATEADD(HOUR, 17, @compDayDt),
     6, 'FINALIST_POOL', 60, @now, @now);

INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at) VALUES
    (NEWID(), @prelimId, N'Accuracy and Domain Relevance', N'Accuracy and Domain Relevance', 30, 0, 1, 5, @now, @now),
    (NEWID(), @prelimId, N'Agentic RAG Architecture & Algorithm', N'Agentic RAG Architecture & Algorithm', 30, 1, 1, 5, @now, @now),
    (NEWID(), @prelimId, N'Ideas & Presentation', N'Ideas & Presentation', 15, 2, 1, 5, @now, @now),
    (NEWID(), @prelimId, N'Feasibility & Creativity', N'Feasibility & Creativity', 15, 3, 1, 5, @now, @now),
    (NEWID(), @prelimId, N'User Experience & Interactive Interface', N'User Experience & Interactive Interface', 10, 4, 1, 5, @now, @now),
    (NEWID(), @finalId, N'Data Processing & Retrieval Quality', N'Data Processing & Retrieval Quality', 30, 0, 1, 5, @now, @now),
    (NEWID(), @finalId, N'Reliability & Hallucination Resistance', N'Reliability & Hallucination Resistance', 20, 1, 1, 5, @now, @now),
    (NEWID(), @finalId, N'Agent Reasoning & Multi-hop Processing', N'Agent Reasoning & Multi-hop Processing', 20, 2, 1, 5, @now, @now),
    (NEWID(), @finalId, N'Practicality & Operational Optimization', N'Practicality & Operational Optimization', 20, 3, 1, 5, @now, @now),
    (NEWID(), @finalId, N'Scalability & Innovation', N'Scalability & Innovation', 10, 4, 1, 5, @now, @now);

INSERT INTO prizes (id, event_id, rank, value, quantity, label, created_at, updated_at) VALUES
    (NEWID(), @eventId, 'FIRST', '7000000', 1, N'First Prize', @now, @now),
    (NEWID(), @eventId, 'SECOND', '5000000', 1, N'Second Prize', @now, @now),
    (NEWID(), @eventId, 'THIRD', '3000000', 1, N'Third Prize', @now, @now),
    (NEWID(), @eventId, 'CONSOLATION', '1500000', 1, N'Consolation Prize', @now, @now);

INSERT INTO event_schedules (id, event_id, type, title, description, start_time, end_time, gate, sort_order, created_at, updated_at) VALUES
    (NEWID(), @eventId, 'WORKSHOP', N'Workshop', NULL, DATEADD(HOUR, 9, @dayM3), DATEADD(HOUR, 12, @dayM3), NULL, 0, @now, @now),
    (NEWID(), @eventId, 'OPENING', N'Opening & track draw', N'Teams pick tracks in turn; organizers draw topics per track', DATEADD(HOUR, 14, @dayM1), DATEADD(HOUR, 17, @dayM1), NULL, 1, @now, @now),
    (NEWID(), @eventId, 'TRACK_DRAW', N'Track selection draw', NULL, DATEADD(HOUR, 14, @dayM1), DATEADD(HOUR, 16, @dayM1), NULL, 2, @now, @now),
    (NEWID(), @eventId, 'MILESTONE', N'Milestone 1 - Idea & architecture completion', N'Design Agentic RAG architecture', DATEADD(HOUR, 7, @compDayDt), DATEADD(HOUR, 10, @compDayDt), 'SLIDE_SUBMISSION', 3, @now, @now),
    (NEWID(), @eventId, 'MILESTONE', N'Milestone 2 - Pitching & product completion', N'Parallel pitching and coding', DATEADD(HOUR, 10, @compDayDt), DATEADD(HOUR, 14, @compDayDt), 'DEMO_SUBMISSION', 4, @now, @now),
    (NEWID(), @eventId, 'SCORING', N'Preliminary scoring', N'5-minute presentation + 3-minute Q&A', DATEADD(HOUR, 14, @compDayDt), DATEADD(MINUTE, 15 * 60 + 30, @compDayDt), NULL, 5, @now, @now),
    (NEWID(), @eventId, 'FINAL', N'Finals', N'7-minute presentation + 3-minute Q&A - Top 6 teams', DATEADD(MINUTE, 15 * 60 + 30, @compDayDt), DATEADD(HOUR, 17, @compDayDt), NULL, 6, @now, @now),
    (NEWID(), @eventId, 'CEREMONY', N'Awards & closing ceremony', NULL, DATEADD(HOUR, 17, @compDayDt), DATEADD(HOUR, 18, @compDayDt), NULL, 7, @now, @now);

INSERT INTO allowed_email_domains (id, event_id, domain, university_label, created_at, updated_at) VALUES
    (NEWID(), @eventId, 'fpt.edu.vn', N'FPT University', @now, @now),
    (NEWID(), @eventId, 'fe.edu.vn', N'FPT Education', @now, @now),
    (NEWID(), @eventId, 'hcmut.edu.vn', N'Ho Chi Minh City University of Technology', @now, @now),
    (NEWID(), @eventId, 'hcmus.edu.vn', N'Vietnam National University Ho Chi Minh City - University of Science', @now, @now),
    (NEWID(), @eventId, 'student.hcmus.edu.vn', N'Vietnam National University Ho Chi Minh City - University of Science', @now, @now),
    (NEWID(), @eventId, 'uit.edu.vn', N'University of Information Technology', @now, @now),
    (NEWID(), @eventId, 'hcmute.edu.vn', N'Ho Chi Minh City University of Education and Technology', @now, @now),
    (NEWID(), @eventId, 'ueh.edu.vn', N'University of Economics Ho Chi Minh City', @now, @now),
    (NEWID(), @eventId, 'student.ueh.edu.vn', N'University of Economics Ho Chi Minh City', @now, @now),
    (NEWID(), @eventId, 'student.iuh.edu.vn', N'Industrial University of Ho Chi Minh City', @now, @now);

-- Prefer demo mentors from seed_demo_events; else any LECTURER pool.
DECLARE @mentor1 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'pham.quoc.bao@fpt.edu.vn');
DECLARE @mentor2 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'tran.minh.khang@fpt.edu.vn');
DECLARE @mentor3 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = N'nguyen.thi.lan@fpt.edu.vn');

IF @mentor1 IS NULL
    SET @mentor1 = (SELECT TOP 1 id FROM users WHERE user_type = N'LECTURER' ORDER BY created_at);
IF @mentor2 IS NULL
    SET @mentor2 = (SELECT TOP 1 id FROM users WHERE user_type = N'LECTURER' AND id <> @mentor1 ORDER BY created_at);
IF @mentor3 IS NULL
    SET @mentor3 = (SELECT TOP 1 id FROM users WHERE user_type = N'LECTURER' AND id NOT IN (@mentor1, @mentor2) ORDER BY created_at);

IF @mentor1 IS NOT NULL
BEGIN
    INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at)
    VALUES (NEWID(), @eventId, @mentor1, @now, @now);
    INSERT INTO mentor_assignments (id, created_at, assigned_at, mentor_user_id, event_id, track_id)
    VALUES (NEWID(), @now, @now, @mentor1, @eventId, @trackA);
END
IF @mentor2 IS NOT NULL
BEGIN
    INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at)
    VALUES (NEWID(), @eventId, @mentor2, @now, @now);
    INSERT INTO mentor_assignments (id, created_at, assigned_at, mentor_user_id, event_id, track_id)
    VALUES (NEWID(), @now, @now, @mentor2, @eventId, @trackB);
END
IF @mentor3 IS NOT NULL
BEGIN
    INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at)
    VALUES (NEWID(), @eventId, @mentor3, @now, @now);
    INSERT INTO mentor_assignments (id, created_at, assigned_at, mentor_user_id, event_id, track_id)
    VALUES (NEWID(), @now, @now, @mentor3, @eventId, @trackC);
END

COMMIT TRANSACTION;
PRINT 'Done: reset all events and restored SEAL Hackathon Spring 2026 (' + CAST(@eventId AS NVARCHAR(36)) + ').';
PRINT 'Resolved status: OPEN (registration open until ' + CONVERT(NVARCHAR(10), @regDeadline, 120) + ').';
PRINT 'Mentors: up to 3 lecturers (1 per track) when accounts exist — run seed_demo_events.sql for full staff.';
