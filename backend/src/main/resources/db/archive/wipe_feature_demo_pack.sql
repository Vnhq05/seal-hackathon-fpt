-- Wipe feature demo pack (8 FE0x events) + test.* pack accounts. Keeps admin@seal.com and template.
-- Run after smoke test:
--   sqlcmd -S localhost,1433 -U sa -P <pwd> -C -d SEAL -f 65001 -I -i wipe_feature_demo_pack.sql

SET NOCOUNT ON; SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON; SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @packEvents TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @packEvents VALUES ('FE010100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO @packEvents VALUES ('FE020100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO @packEvents VALUES ('FE030100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO @packEvents VALUES ('FE040100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO @packEvents VALUES ('FE050100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO @packEvents VALUES ('FE060100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO @packEvents VALUES ('FE070100-EEEE-4EEE-8EEE-000000000001');
INSERT INTO @packEvents VALUES ('FE080100-EEEE-4EEE-8EEE-000000000001');

DECLARE @packTeams TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @packTeams SELECT id FROM teams WHERE event_id IN (SELECT id FROM @packEvents);
DECLARE @packRounds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @packRounds SELECT id FROM rounds WHERE event_id IN (SELECT id FROM @packEvents);
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
IF OBJECT_ID(N'dbo.finalist_selections', N'U') IS NOT NULL DELETE FROM finalist_selections WHERE event_id IN (SELECT id FROM @packEvents);
IF OBJECT_ID(N'dbo.team_awards', N'U') IS NOT NULL DELETE FROM team_awards WHERE event_id IN (SELECT id FROM @packEvents);
IF OBJECT_ID(N'dbo.participation_certificates', N'U') IS NOT NULL DELETE FROM participation_certificates WHERE event_id IN (SELECT id FROM @packEvents);
IF OBJECT_ID(N'dbo.participant_feedbacks', N'U') IS NOT NULL DELETE FROM participant_feedbacks WHERE event_id IN (SELECT id FROM @packEvents);
IF OBJECT_ID(N'dbo.mentor_chat_messages', N'U') IS NOT NULL DELETE FROM mentor_chat_messages WHERE team_id IN (SELECT id FROM @packTeams);
IF OBJECT_ID(N'dbo.mentor_feedbacks', N'U') IS NOT NULL DELETE FROM mentor_feedbacks WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM mentor_teams WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM mentor_assignments WHERE event_id IN (SELECT id FROM @packEvents);
DELETE FROM event_mentor_assignments WHERE event_id IN (SELECT id FROM @packEvents);
DELETE FROM judge_assignments WHERE round_id IN (SELECT id FROM @packRounds);
DELETE FROM event_judge_assignments WHERE event_id IN (SELECT id FROM @packEvents);
DELETE FROM invitations WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM mentor_invitations WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM team_join_requests WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM team_leave_requests WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM team_needed_roles WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM notification_recipients WHERE notification_id IN (
  SELECT id FROM notifications WHERE type = N'TEAM_PROGRESS_ALERT' AND reference_id IN (SELECT id FROM @packTeams));
DELETE FROM notifications WHERE type = N'TEAM_PROGRESS_ALERT' AND reference_id IN (SELECT id FROM @packTeams);
IF OBJECT_ID(N'dbo.team_progress_alerts', N'U') IS NOT NULL DELETE FROM team_progress_alerts WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM team_members WHERE team_id IN (SELECT id FROM @packTeams);
DELETE FROM teams WHERE id IN (SELECT id FROM @packTeams);
DELETE FROM criteria WHERE round_id IN (SELECT id FROM @packRounds);
DELETE FROM rounds WHERE id IN (SELECT id FROM @packRounds);
DELETE FROM competition_groups WHERE track_id IN (SELECT id FROM tracks WHERE event_id IN (SELECT id FROM @packEvents));
DELETE FROM tracks WHERE event_id IN (SELECT id FROM @packEvents);
DELETE FROM prizes WHERE event_id IN (SELECT id FROM @packEvents);
DELETE FROM event_schedules WHERE event_id IN (SELECT id FROM @packEvents);
DELETE FROM allowed_email_domains WHERE event_id IN (SELECT id FROM @packEvents);
DELETE FROM event_enrollments WHERE event_id IN (SELECT id FROM @packEvents);
DELETE FROM hackathon_events WHERE id IN (SELECT id FROM @packEvents);

DECLARE @packUsers TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @packUsers (id)
SELECT id FROM users WHERE email LIKE N'test.%@fpt.edu.vn'
   OR email IN (N'test.coord@fpt.edu.vn');

DELETE FROM notification_recipients WHERE user_id IN (SELECT id FROM @packUsers);
DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM @packUsers);
DELETE FROM password_reset_tokens WHERE user_id IN (SELECT id FROM @packUsers);
DELETE FROM email_otp_tokens WHERE user_id IN (SELECT id FROM @packUsers);
DELETE FROM users WHERE id IN (SELECT id FROM @packUsers);

COMMIT TRANSACTION;
PRINT 'wipe_feature_demo_pack.sql complete — pack events + test.* users removed.';
