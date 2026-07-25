-- Removes every account except the bootstrap admin, plus the per-user rows that hang off them.
--
-- This deletes by "keep only @adminEmail" rather than by a list of demo addresses on purpose: the
-- old seeders and scenario scripts created accounts under many prefixes (student*, scoretest*,
-- feedbacktest*, progresstest*, leavetest*, teststudent*, lecturer*, coordinator@seal.com, ...) and
-- an allow-list is the only way to be sure none are missed.
--
-- Run order matters — event-scoped rows must go first:
--   1. bootstrap_admin.sql          (creates @adminEmail)
--   2. reset_and_seed_template.sql  (wipes events, teams, submissions, scores)
--   3. purge_demo_data.sql          (this script)
-- Running this out of order aborts with a message instead of leaving dangling references.
--
-- Run: sqlcmd -S localhost -U sa -P <password> -d SEAL -I -i purge_demo_data.sql

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @adminEmail NVARCHAR(255) = N'admin@seal.com';

DECLARE @adminId UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = @adminEmail);

IF @adminId IS NULL
BEGIN
    RAISERROR('Admin %s not found — run bootstrap_admin.sql first, or this would delete every account.', 16, 1, @adminEmail);
    ROLLBACK TRANSACTION;
    RETURN;
END

-- Orphans the event wipe leaves behind: these are keyed by team_id / track_id with no FK
-- constraint, so reset_and_seed_template.sql does not reach them.
DELETE FROM mentor_chat_messages WHERE team_id NOT IN (SELECT id FROM teams);
DELETE FROM mentor_feedbacks     WHERE team_id NOT IN (SELECT id FROM teams);
DELETE FROM competition_groups   WHERE track_id NOT IN (SELECT id FROM tracks);

-- Refuse to run if event data still points at accounts we are about to delete.
IF EXISTS (SELECT 1 FROM event_enrollments WHERE user_id <> @adminId)
    OR EXISTS (SELECT 1 FROM team_members WHERE user_id <> @adminId)
    OR EXISTS (SELECT 1 FROM teams WHERE leader_id <> @adminId)
    OR EXISTS (SELECT 1 FROM judge_scores WHERE judge_user_id <> @adminId)
BEGIN
    RAISERROR('Event data still references other accounts — run reset_and_seed_template.sql first.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END

-- Per-user rows that survive the event wipe.
DELETE FROM notification_recipients WHERE user_id <> @adminId;
DELETE FROM refresh_tokens          WHERE user_id <> @adminId;
DELETE FROM password_reset_tokens   WHERE user_id <> @adminId;
DELETE FROM email_otp_tokens        WHERE user_id <> @adminId;
DELETE FROM audit_logs              WHERE actor_id IS NOT NULL AND actor_id <> @adminId;

-- Notifications are fan-out rows; drop the ones nobody can see any more.
DELETE FROM notifications
WHERE id NOT IN (SELECT notification_id FROM notification_recipients);

DECLARE @deleted INT;
DELETE FROM users WHERE id <> @adminId;
SET @deleted = @@ROWCOUNT;

COMMIT TRANSACTION;
PRINT 'Deleted ' + CAST(@deleted AS NVARCHAR(10)) + ' account(s). Remaining admin: ' + @adminEmail;
PRINT 'Create coordinators, lecturers and students from the admin UI at /admin/users.';
