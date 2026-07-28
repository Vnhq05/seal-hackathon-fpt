-- Reset Demo 6 to "before Advance" (after prelim scored+ranked).
-- Keeps: prelim submissions, scores, rankings, judge assignments (prelim + final panel).
-- Clears: advancements, finalists, awards, published results, Final carry-over subs/scores/rankings.
-- Unlocks prelim scores (LOCKED → COMPLETED) so Livescore can Lock again after Advance.
--
-- Event: Demo 6 - Final Advancement (Prelim Done) · Summer 2026
-- Password (demo users): Demo@123456
--
-- After reset:
--   1. Admin Livescore → Preliminary → Advance (Preview/Confirm) → Publish
--   2. Login final.judge / demo final judges → score Final
--   3. Admin Livescore → Finals → Recalc → Lock → Publish → Assign Awards
--
-- Run:
--   sqlcmd -S localhost -U sa -P <password> -d SEAL -C -I -i reset_demo6_before_advance.sql

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @eventId UNIQUEIDENTIFIER = 'FE060100-EEEE-4EEE-8EEE-000000000001';
DECLARE @prelimId UNIQUEIDENTIFIER = 'FE060300-EEEE-4EEE-8EEE-000000000001';
DECLARE @finalId UNIQUEIDENTIFIER = 'FE060300-EEEE-4EEE-8EEE-000000000002';

IF NOT EXISTS (SELECT 1 FROM hackathon_events WHERE id = @eventId)
BEGIN
    RAISERROR('Demo 6 event not found (FE060100-...). Seed feature demo pack first.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END

DECLARE @finalSubmissionIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @finalSubmissionIds (id)
SELECT id FROM submissions WHERE round_id = @finalId;

-- ── Awards / finalists / contested ──
IF OBJECT_ID(N'dbo.team_awards', N'U') IS NOT NULL
    DELETE FROM team_awards WHERE event_id = @eventId;

IF OBJECT_ID(N'dbo.finalist_contested_slot_teams', N'U') IS NOT NULL
    DELETE FROM finalist_contested_slot_teams WHERE contested_slot_id IN (
        SELECT id FROM finalist_contested_slots WHERE event_id = @eventId);

IF OBJECT_ID(N'dbo.finalist_contested_slots', N'U') IS NOT NULL
    DELETE FROM finalist_contested_slots WHERE event_id = @eventId;

IF OBJECT_ID(N'dbo.finalist_selections', N'U') IS NOT NULL
    DELETE FROM finalist_selections WHERE event_id = @eventId;

-- ── Publish + advancement (prelim) ──
IF OBJECT_ID(N'dbo.published_results', N'U') IS NOT NULL
    DELETE FROM published_results WHERE round_id IN (@prelimId, @finalId);

IF OBJECT_ID(N'dbo.advancements', N'U') IS NOT NULL
    DELETE FROM advancements WHERE round_id IN (@prelimId, @finalId);

IF OBJECT_ID(N'dbo.disputes', N'U') IS NOT NULL
    DELETE FROM disputes WHERE round_id IN (@prelimId, @finalId);

-- ── Final rankings (if any) ──
DELETE FROM rankings WHERE round_id = @finalId;

-- ── Final scores + carried submissions ──
IF EXISTS (SELECT 1 FROM @finalSubmissionIds)
BEGIN
    IF OBJECT_ID(N'dbo.judge_comments', N'U') IS NOT NULL
        DELETE jc FROM judge_comments jc
        INNER JOIN judge_scores js ON js.id = jc.judge_score_id
        WHERE js.submission_id IN (SELECT id FROM @finalSubmissionIds);

    DELETE jsd FROM judge_score_details jsd
    INNER JOIN judge_scores js ON js.id = jsd.judge_score_id
    WHERE js.submission_id IN (SELECT id FROM @finalSubmissionIds);

    DELETE FROM judge_scores WHERE submission_id IN (SELECT id FROM @finalSubmissionIds)
        OR round_id = @finalId;

    UPDATE submissions SET current_version_id = NULL
    WHERE id IN (SELECT id FROM @finalSubmissionIds);

    IF OBJECT_ID(N'dbo.submission_attachments', N'U') IS NOT NULL
        DELETE sa FROM submission_attachments sa
        INNER JOIN submission_versions sv ON sv.id = sa.submission_version_id
        WHERE sv.submission_id IN (SELECT id FROM @finalSubmissionIds);

    DELETE FROM submission_versions WHERE submission_id IN (SELECT id FROM @finalSubmissionIds);
    DELETE FROM submissions WHERE id IN (SELECT id FROM @finalSubmissionIds);
END
ELSE
BEGIN
    DELETE FROM judge_scores WHERE round_id = @finalId;
END

-- ── Unlock prelim scores so Lock step can run again after Advance ──
UPDATE judge_scores
SET status = N'COMPLETED', updated_at = SYSUTCDATETIME()
WHERE round_id = @prelimId AND status = N'LOCKED';

-- Keep event in SCORING; leaderboard private until publish again
UPDATE hackathon_events
SET leaderboard_public = 0,
    status = N'SCORING',
    updated_at = SYSUTCDATETIME()
WHERE id = @eventId;

COMMIT TRANSACTION;

PRINT '=== Demo 6 reset OK: before Advance ===';
PRINT 'Event: Demo 6 - Final Advancement (Prelim Done)';
PRINT 'Kept: prelim scores (COMPLETED), rankings, submissions, Final judge assignments';
PRINT 'Cleared: advancements, finalists, awards, published_results, Final carry-over';
PRINT 'Next: Livescore Preliminary → Advance → Publish → Final judges score → Assign Awards';
