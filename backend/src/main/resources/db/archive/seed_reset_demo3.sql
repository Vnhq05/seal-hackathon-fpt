-- Reset Demo 3 only. Password: Demo@123456
SET NOCOUNT ON; SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON; SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @pwd NVARCHAR(255) = N'$2a$10$7ZqT629/ciaVAXuzx7B0zO.wFlLuVz6NK3/tNioMOWFLb2gPkXeU2';
DECLARE @now DATETIME2 = SYSUTCDATETIME();
DECLARE @today DATE = CAST(@now AS DATE);
DECLARE @templateId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM scoring_templates ORDER BY created_at);
DECLARE @ownerUserId UNIQUEIDENTIFIER = (
  SELECT TOP 1 id FROM users WHERE email IN (N'admin@seal.com', N'coordinator@seal.com')
  ORDER BY CASE email WHEN N'admin@seal.com' THEN 0 ELSE 1 END);
DECLARE @ownerEmail NVARCHAR(255) = (SELECT email FROM users WHERE id = @ownerUserId);
IF @templateId IS NULL BEGIN RAISERROR('No scoring template.', 16, 1); ROLLBACK; RETURN; END
IF @ownerUserId IS NULL BEGIN RAISERROR('Need admin/coordinator.', 16, 1); ROLLBACK; RETURN; END

DECLARE @eventId UNIQUEIDENTIFIER = 'FE030100-EEEE-4EEE-8EEE-000000000001';
DECLARE @packTeams TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @packTeams SELECT id FROM teams WHERE event_id = @eventId;
DECLARE @packRounds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @packRounds SELECT id FROM rounds WHERE event_id = @eventId;
DECLARE @packSubs TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @packSubs SELECT s.id FROM submissions s WHERE s.round_id IN (SELECT id FROM @packRounds);

DELETE jc FROM judge_comments jc INNER JOIN judge_scores js ON js.id = jc.judge_score_id WHERE js.submission_id IN (SELECT id FROM @packSubs);
DELETE jsd FROM judge_score_details jsd INNER JOIN judge_scores js ON js.id = jsd.judge_score_id WHERE js.submission_id IN (SELECT id FROM @packSubs);
DELETE FROM judge_scores WHERE submission_id IN (SELECT id FROM @packSubs);
IF OBJECT_ID(N'dbo.score_review_requests', N'U') IS NOT NULL DELETE FROM score_review_requests WHERE submission_id IN (SELECT id FROM @packSubs);
IF OBJECT_ID(N'dbo.submission_attachments', N'U') IS NOT NULL
  DELETE sa FROM submission_attachments sa INNER JOIN submission_versions sv ON sv.id = sa.submission_version_id WHERE sv.submission_id IN (SELECT id FROM @packSubs);
UPDATE submissions SET current_version_id = NULL WHERE id IN (SELECT id FROM @packSubs);
DELETE FROM submission_versions WHERE submission_id IN (SELECT id FROM @packSubs);
DELETE FROM submissions WHERE id IN (SELECT id FROM @packSubs);
IF OBJECT_ID(N'dbo.published_results', N'U') IS NOT NULL DELETE FROM published_results WHERE round_id IN (SELECT id FROM @packRounds);
IF OBJECT_ID(N'dbo.rankings', N'U') IS NOT NULL DELETE FROM rankings WHERE round_id IN (SELECT id FROM @packRounds);
IF OBJECT_ID(N'dbo.finalist_selections', N'U') IS NOT NULL DELETE FROM finalist_selections WHERE event_id = @eventId;
IF OBJECT_ID(N'dbo.mentor_chat_messages', N'U') IS NOT NULL DELETE FROM mentor_chat_messages WHERE team_id IN (SELECT id FROM @packTeams);
IF OBJECT_ID(N'dbo.mentor_feedbacks', N'U') IS NOT NULL DELETE FROM mentor_feedbacks WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM mentor_teams WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM mentor_assignments WHERE event_id = @eventId;
DELETE FROM event_mentor_assignments WHERE event_id = @eventId;
DELETE FROM judge_assignments WHERE round_id IN (SELECT id FROM @packRounds);
DELETE FROM event_judge_assignments WHERE event_id = @eventId;
DELETE FROM invitations WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM mentor_invitations WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM team_join_requests WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM team_leave_requests WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM team_needed_roles WHERE team_id IN (SELECT id FROM @packTeams);
IF OBJECT_ID(N'dbo.team_progress_alerts', N'U') IS NOT NULL DELETE FROM team_progress_alerts WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM team_members WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM teams WHERE id IN (SELECT id FROM @packTeams);
DELETE FROM criteria WHERE round_id IN (SELECT id FROM @packRounds);
DELETE FROM rounds WHERE id IN (SELECT id FROM @packRounds);
DELETE FROM competition_groups WHERE track_id IN (SELECT id FROM tracks WHERE event_id = @eventId);
DELETE FROM tracks WHERE event_id = @eventId;
DELETE FROM prizes WHERE event_id = @eventId;
DELETE FROM event_schedules WHERE event_id = @eventId;
DELETE FROM allowed_email_domains WHERE event_id = @eventId;
DELETE FROM event_enrollments WHERE event_id = @eventId;
DELETE FROM hackathon_events WHERE id = @eventId;

UPDATE users SET password_hash=@pwd, status=N'ACTIVE', failed_login_attempts=0, locked_until=NULL, updated_at=@now
WHERE email IN (N'demo.coord@fpt.edu.vn', N'demo.mentor1@fpt.edu.vn') OR email LIKE N'demo.assign.s%@fpt.edu.vn';

DECLARE @coordId UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.coord@fpt.edu.vn');
DECLARE @mentor1Id UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.mentor1@fpt.edu.vn');
IF @coordId IS NULL OR @mentor1Id IS NULL OR NOT EXISTS (SELECT 1 FROM users WHERE email=N'demo.assign.s01@fpt.edu.vn')
BEGIN
  RAISERROR('Demo 3 accounts missing. Run full seed_feature_demo_pack.sql once first.', 16, 1);
  ROLLBACK; RETURN;
END
-- ========== 3) Assignment + MentorHub ==========
INSERT INTO hackathon_events (id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at,
  avatar_url, require_awards_before_complete, score_scale_max) VALUES (
  'FE030100-EEEE-4EEE-8EEE-000000000001', N'Demo 3 - Assignment (10 Teams Closed Reg)', N'Summer', 2026,
  DATEADD(DAY, 7, @today), DATEADD(DAY, 8, @today),
  DATEADD(DAY, -30, @today), DATEADD(DAY, -1, @today),
  N'10 CONFIRMED teams. Most unassigned for Assignment QA; Team 01 pre-linked to mentor for MentorHub.', N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',
  3, 5, 4, 8, @templateId, N'CLOSED_REGISTRATION', 0, @coordId, N'demo.coord@fpt.edu.vn', @now, @now, NULL, 0, 100);
-- Domains: skipped per-event (DB has global UNIQUE on domain); ensure platform fpt.edu.vn once below.
INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, auto_generate_groups, created_at, updated_at, created_by)
VALUES ('FE030400-EEEE-4EEE-8EEE-000000000001', 'FE030100-EEEE-4EEE-8EEE-000000000001', N'Grounded Retrieval', N'Demo track', NULL, N'OPEN', NULL, 0, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, auto_generate_groups, created_at, updated_at, created_by)
VALUES ('FE030400-EEEE-4EEE-8EEE-000000000002', 'FE030100-EEEE-4EEE-8EEE-000000000001', N'Agent Orchestration', N'Demo track', NULL, N'OPEN', NULL, 0, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, min_judges_per_round, created_at, updated_at, created_by) VALUES
  ('FE030300-EEEE-4EEE-8EEE-000000000001', 'FE030100-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(DAY,7,@now), DATEADD(DAY,8,@now), DATEADD(HOUR,-2,DATEADD(DAY,7,@now)), DATEADD(DAY,7,@now), DATEADD(DAY,8,@now), 2, N'PER_TRACK_TOP_N', 40, 2, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE030300-EEEE-4EEE-8EEE-000000000002', 'FE030100-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', N'FINAL', DATEADD(DAY,8,@now), DATEADD(DAY,9,@now), NULL, DATEADD(DAY,8,@now), DATEADD(DAY,9,@now), 4, N'FINALIST_POOL', 60, 2, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE030600-EEEE-4EEE-8EEE-000000000001', 'FE030300-EEEE-4EEE-8EEE-000000000001', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE030600-EEEE-4EEE-8EEE-000000000002', 'FE030300-EEEE-4EEE-8EEE-000000000001', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE030600-EEEE-4EEE-8EEE-000000000003', 'FE030300-EEEE-4EEE-8EEE-000000000001', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES
  ('FE030600-EEEE-4EEE-8EEE-000000000004', 'FE030300-EEEE-4EEE-8EEE-000000000002', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE030600-EEEE-4EEE-8EEE-000000000005', 'FE030300-EEEE-4EEE-8EEE-000000000002', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),
  ('FE030600-EEEE-4EEE-8EEE-000000000006', 'FE030300-EEEE-4EEE-8EEE-000000000002', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at, created_by)
VALUES (NEWID(), 'FE030100-EEEE-4EEE-8EEE-000000000001', @mentor1Id, @now, @now, N'demo.coord@fpt.edu.vn');
INSERT INTO mentor_assignments (id, created_at, created_by, assigned_at, mentor_user_id, track_id, event_id, team_id, active)
VALUES (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, @mentor1Id, 'FE030400-EEEE-4EEE-8EEE-000000000001', 'FE030100-EEEE-4EEE-8EEE-000000000001', NULL, 1);
INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)
SELECT NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, 'FE030100-EEEE-4EEE-8EEE-000000000001', N'APPROVED', u.id, 1, 1
FROM users u WHERE u.email LIKE N'demo.assign.s%@fpt.edu.vn';
DECLARE @L_FE030200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s01@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s02@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000001 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s03@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000001', @now, N'demo.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000001, N'Assign Alpha', N'CONFIRMED', 'FE030400-EEEE-4EEE-8EEE-000000000001', @now, N'MANUAL', @coordId, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000001, 'FE030200-EEEE-4EEE-8EEE-000000000001', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000001, 'FE030200-EEEE-4EEE-8EEE-000000000001', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000001, 'FE030200-EEEE-4EEE-8EEE-000000000001', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s04@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s05@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000002 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s06@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000002', @now, N'demo.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000002, N'Assign Beta', N'CONFIRMED', NULL, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000002, 'FE030200-EEEE-4EEE-8EEE-000000000002', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000002, 'FE030200-EEEE-4EEE-8EEE-000000000002', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000002, 'FE030200-EEEE-4EEE-8EEE-000000000002', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s07@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s08@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000003 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s09@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000003', @now, N'demo.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000003, N'Assign Gamma', N'CONFIRMED', NULL, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000003, 'FE030200-EEEE-4EEE-8EEE-000000000003', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000003, 'FE030200-EEEE-4EEE-8EEE-000000000003', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000003, 'FE030200-EEEE-4EEE-8EEE-000000000003', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s10@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s11@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000004 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s12@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000004', @now, N'demo.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000004, N'Assign Delta', N'CONFIRMED', NULL, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000004, 'FE030200-EEEE-4EEE-8EEE-000000000004', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000004, 'FE030200-EEEE-4EEE-8EEE-000000000004', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000004, 'FE030200-EEEE-4EEE-8EEE-000000000004', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE000000000005 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s13@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000005 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s14@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000005 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s15@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000005', @now, N'demo.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000005, N'Assign Epsilon', N'CONFIRMED', NULL, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000005, 'FE030200-EEEE-4EEE-8EEE-000000000005', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000005, 'FE030200-EEEE-4EEE-8EEE-000000000005', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000005, 'FE030200-EEEE-4EEE-8EEE-000000000005', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE000000000006 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s16@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000006 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s17@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000006 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s18@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000006', @now, N'demo.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000006, N'Assign Zeta', N'CONFIRMED', NULL, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000006, 'FE030200-EEEE-4EEE-8EEE-000000000006', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000006, 'FE030200-EEEE-4EEE-8EEE-000000000006', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000006, 'FE030200-EEEE-4EEE-8EEE-000000000006', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE000000000007 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s19@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000007 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s20@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000007 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s21@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000007', @now, N'demo.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000007, N'Assign Eta', N'CONFIRMED', NULL, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000007, 'FE030200-EEEE-4EEE-8EEE-000000000007', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000007, 'FE030200-EEEE-4EEE-8EEE-000000000007', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000007, 'FE030200-EEEE-4EEE-8EEE-000000000007', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE000000000008 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s22@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000008 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s23@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000008 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s24@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000008', @now, N'demo.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000008, N'Assign Theta', N'CONFIRMED', NULL, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000008, 'FE030200-EEEE-4EEE-8EEE-000000000008', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000008, 'FE030200-EEEE-4EEE-8EEE-000000000008', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000008, 'FE030200-EEEE-4EEE-8EEE-000000000008', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE000000000009 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s25@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE000000000009 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s26@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE000000000009 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s27@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-000000000009', @now, N'demo.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE000000000009, N'Assign Iota', N'CONFIRMED', NULL, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE000000000009, 'FE030200-EEEE-4EEE-8EEE-000000000009', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE000000000009, 'FE030200-EEEE-4EEE-8EEE-000000000009', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE000000000009, 'FE030200-EEEE-4EEE-8EEE-000000000009', 'FE030100-EEEE-4EEE-8EEE-000000000001');
DECLARE @L_FE030200EEEE4EEE8EEE00000000000A UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s28@fpt.edu.vn');
DECLARE @M2_FE030200EEEE4EEE8EEE00000000000A UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s29@fpt.edu.vn');
DECLARE @M3_FE030200EEEE4EEE8EEE00000000000A UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.assign.s30@fpt.edu.vn');
INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)
VALUES ('FE030200-EEEE-4EEE-8EEE-00000000000A', @now, N'demo.coord@fpt.edu.vn', 'FE030100-EEEE-4EEE-8EEE-000000000001', @L_FE030200EEEE4EEE8EEE00000000000A, N'Assign Kappa', N'CONFIRMED', NULL, 0, N'Demo team.', 0);
INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_FE030200EEEE4EEE8EEE00000000000A, 'FE030200-EEEE-4EEE-8EEE-00000000000A', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_FE030200EEEE4EEE8EEE00000000000A, 'FE030200-EEEE-4EEE-8EEE-00000000000A', 'FE030100-EEEE-4EEE-8EEE-000000000001'),
  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_FE030200EEEE4EEE8EEE00000000000A, 'FE030200-EEEE-4EEE-8EEE-00000000000A', 'FE030100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO mentor_teams (id, created_at, created_by, assigned_at, mentor_user_id, team_id)
VALUES (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, @mentor1Id, 'FE030200-EEEE-4EEE-8EEE-000000000001');


COMMIT TRANSACTION;
PRINT 'Demo 3 reset OK: CLOSED_REGISTRATION + 10 teams';
PRINT 'Mentor: demo.mentor1@fpt.edu.vn / Demo@123456 (Assign Alpha)';
PRINT 'Leader: demo.assign.s01@fpt.edu.vn / Demo@123456';
