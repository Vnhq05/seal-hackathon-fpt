-- Restore SEAL Hackathon Spring 2026 (landing page event) and remove test events.
-- Run: sqlcmd -S localhost -U sa -P <password> -d SEAL -i restore_seal_spring_2026_and_cleanup.sql

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
BEGIN TRANSACTION;

DECLARE @now DATETIME2 = SYSUTCDATETIME();
DECLARE @templateId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM scoring_templates ORDER BY created_at);

DECLARE @testIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @testIds (id) VALUES
    ('B3250AE2-AFAA-4464-93DA-D5642F2E0C6A'),
    ('BD4D630D-5DC1-44D3-BFAF-6D7A0CBE1632'),
    ('605A601F-9B66-430A-8F2E-4522C2D6E965'),
    ('E618A0FB-72DD-43B3-B34E-ACABFD7276A0'),
    ('73AA9B9C-24CB-4625-9A9A-9CE6A95EDF21'),
    ('8E0221DD-F035-4267-81BF-BB083B6F1975');

DECLARE @teamIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @teamIds (id)
SELECT t.id FROM teams t WHERE t.event_id IN (SELECT id FROM @testIds);

DECLARE @roundIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @roundIds (id)
SELECT r.id FROM rounds r WHERE r.event_id IN (SELECT id FROM @testIds);

DECLARE @submissionIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @submissionIds (id)
SELECT s.id FROM submissions s
INNER JOIN @teamIds t ON s.team_id = t.id;

-- Deep cleanup for test events
DELETE jc FROM judge_comments jc
INNER JOIN judge_scores js ON js.id = jc.judge_score_id
WHERE js.submission_id IN (SELECT id FROM @submissionIds);

DELETE jsd FROM judge_score_details jsd
INNER JOIN judge_scores js ON js.id = jsd.judge_score_id
WHERE js.submission_id IN (SELECT id FROM @submissionIds);

DELETE FROM judge_scores WHERE submission_id IN (SELECT id FROM @submissionIds);
DELETE sa FROM submission_attachments sa
INNER JOIN submission_versions sv ON sv.id = sa.submission_version_id
WHERE sv.submission_id IN (SELECT id FROM @submissionIds);
DELETE FROM submission_versions WHERE submission_id IN (SELECT id FROM @submissionIds);
DELETE FROM submissions WHERE id IN (SELECT id FROM @submissionIds);

DELETE FROM team_judge_assignments WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM mentor_teams WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM invitations WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM mentor_invitations WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM team_join_requests WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM team_leave_requests WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM team_needed_roles WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM team_members WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM teams WHERE id IN (SELECT id FROM @teamIds);

DELETE FROM event_enrollments WHERE event_id IN (SELECT id FROM @testIds);
DELETE FROM event_magic_tokens WHERE event_id IN (SELECT id FROM @testIds);
DELETE FROM participant_feedbacks WHERE event_id IN (SELECT id FROM @testIds);
DELETE FROM participation_certificates WHERE event_id IN (SELECT id FROM @testIds);
DELETE FROM score_review_requests WHERE event_id IN (SELECT id FROM @testIds);
DELETE FROM team_awards WHERE event_id IN (SELECT id FROM @testIds);
DELETE FROM finalist_contested_slot_teams WHERE contested_slot_id IN (
    SELECT id FROM finalist_contested_slots WHERE event_id IN (SELECT id FROM @testIds)
);
DELETE FROM finalist_contested_slots WHERE event_id IN (SELECT id FROM @testIds);
DELETE FROM finalist_selections WHERE event_id IN (SELECT id FROM @testIds);
DELETE FROM track_draw_sessions WHERE event_id IN (SELECT id FROM @testIds);

DELETE ja FROM judge_assignments ja WHERE ja.round_id IN (SELECT id FROM @roundIds);
DELETE c FROM criteria c WHERE c.round_id IN (SELECT id FROM @roundIds);
DELETE FROM rounds WHERE id IN (SELECT id FROM @roundIds);

DELETE FROM event_judge_assignments WHERE event_id IN (SELECT id FROM @testIds);
DELETE FROM event_mentor_assignments WHERE event_id IN (SELECT id FROM @testIds);
DELETE FROM mentor_assignments WHERE event_id IN (SELECT id FROM @testIds);
DELETE FROM event_tiebreaker_criteria WHERE event_id IN (SELECT id FROM @testIds);
DELETE FROM honored_guests WHERE event_id IN (SELECT id FROM @testIds);
DELETE FROM prizes WHERE event_id IN (SELECT id FROM @testIds);
DELETE FROM event_schedules WHERE event_id IN (SELECT id FROM @testIds);
DELETE FROM allowed_email_domains WHERE event_id IN (SELECT id FROM @testIds);
DELETE FROM tracks WHERE event_id IN (SELECT id FROM @testIds);
DELETE FROM hackathon_events WHERE id IN (SELECT id FROM @testIds);

-- Restore landing page event (same id as before deletion)
DECLARE @eventId UNIQUEIDENTIFIER = '77F2A5A3-6538-4FCF-B85A-666066465E68';
DECLARE @prelimId UNIQUEIDENTIFIER = 'A1000001-0001-0001-0001-000000000001';
DECLARE @finalId UNIQUEIDENTIFIER = 'A1000001-0001-0001-0001-000000000002';
DECLARE @trackA UNIQUEIDENTIFIER = 'A2000001-0001-0001-0001-000000000001';
DECLARE @trackB UNIQUEIDENTIFIER = 'A2000001-0001-0001-0001-000000000002';
DECLARE @trackC UNIQUEIDENTIFIER = 'A2000001-0001-0001-0001-000000000003';

-- Remove orphaned rows for this event id (from prior partial runs)
DELETE c FROM criteria c
INNER JOIN rounds r ON r.id = c.round_id
WHERE r.event_id = @eventId;
DELETE FROM judge_assignments WHERE round_id IN (SELECT id FROM rounds WHERE event_id = @eventId);
DELETE FROM rounds WHERE event_id = @eventId;
DELETE FROM tracks WHERE event_id = @eventId;
DELETE FROM prizes WHERE event_id = @eventId;
DELETE FROM event_schedules WHERE event_id = @eventId;
DELETE FROM allowed_email_domains WHERE event_id = @eventId;
DELETE FROM event_judge_assignments WHERE event_id = @eventId;
DELETE FROM event_mentor_assignments WHERE event_id = @eventId;
DELETE FROM mentor_assignments WHERE event_id = @eventId;
DELETE FROM event_tiebreaker_criteria WHERE event_id = @eventId;
DELETE FROM honored_guests WHERE event_id = @eventId;
DELETE FROM hackathon_events WHERE id = @eventId;

IF @templateId IS NULL
BEGIN
    RAISERROR('No scoring template found.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END

INSERT INTO hackathon_events (
    id, name, season, year, start_date, end_date,
    registration_open_date, registration_deadline,
    description, location, format, competition_format,
    min_team, max_team, semester_min, semester_max,
    scoring_template_id, status, leaderboard_public,
    created_by, created_at, updated_at
) VALUES (
    @eventId,
    N'SEAL Hackathon Spring 2026',
    N'Spring', 2026,
    '2026-08-15', '2026-08-15',
    '2026-03-15', '2026-07-31',
    N'SEAL Hackathon Spring 2026 - Agentic RAG',
    N'FPT University HCM', 'OFFLINE', 'SEAL_RAG_2026',
    3, 5, 4, 8,
    @templateId, 'UPCOMING', 0,
    N'coordinator@seal.com', @now, @now
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
     '2026-04-12 07:00:00', '2026-04-12 15:30:00',
     '2026-04-12 10:00:00', '2026-04-12 14:00:00', '2026-04-12 15:30:00',
     2, 'PER_TRACK_TOP_N', 40, @now, @now),
    (@finalId, @eventId, 2, N'Finals', 'FINAL',
     '2026-04-12 15:30:00', '2026-04-12 17:00:00',
     NULL, '2026-04-12 15:30:00', '2026-04-12 17:00:00',
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
    (NEWID(), @eventId, 'WORKSHOP', N'Workshop', NULL, '2026-04-09 09:00:00', '2026-04-09 12:00:00', NULL, 0, @now, @now),
    (NEWID(), @eventId, 'OPENING', N'Opening & track draw', N'Teams pick tracks in turn; organizers draw topics per track', '2026-04-11 14:00:00', '2026-04-11 17:00:00', NULL, 1, @now, @now),
    (NEWID(), @eventId, 'TRACK_DRAW', N'Track selection draw', NULL, '2026-04-11 14:00:00', '2026-04-11 16:00:00', NULL, 2, @now, @now),
    (NEWID(), @eventId, 'MILESTONE', N'Milestone 1 - Idea & architecture completion', N'Design Agentic RAG architecture', '2026-04-12 07:00:00', '2026-04-12 10:00:00', 'SLIDE_SUBMISSION', 3, @now, @now),
    (NEWID(), @eventId, 'MILESTONE', N'Milestone 2 - Pitching & product completion', N'Parallel pitching and coding', '2026-04-12 10:00:00', '2026-04-12 14:00:00', 'DEMO_SUBMISSION', 4, @now, @now),
    (NEWID(), @eventId, 'SCORING', N'Preliminary scoring', N'5-minute presentation + 3-minute Q&A', '2026-04-12 14:00:00', '2026-04-12 15:30:00', NULL, 5, @now, @now),
    (NEWID(), @eventId, 'FINAL', N'Finals', N'7-minute presentation + 3-minute Q&A - Top 6 teams', '2026-04-12 15:30:00', '2026-04-12 17:00:00', NULL, 6, @now, @now),
    (NEWID(), @eventId, 'CEREMONY', N'Awards & closing ceremony', NULL, '2026-04-12 17:00:00', '2026-04-12 18:00:00', NULL, 7, @now, @now);

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

COMMIT TRANSACTION;
PRINT 'Done: removed test events and restored SEAL Hackathon Spring 2026 (' + CAST(@eventId AS NVARCHAR(36)) + ').';
