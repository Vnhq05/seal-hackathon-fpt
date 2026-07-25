-- Seed 7 realistic SEAL Hackathon seasons for local/dev QA.
-- Prerequisites:
--   1. bootstrap_admin.sql
--   2. Backend started once with profile dev (scoring_templates)
--   3. Prefer reset_and_seed_template.sql first (keeps template 77F2A5A3-6538-4FCF-B85A-666066465E68)
-- Run: sqlcmd -S localhost -U sa -P <password> -d SEAL -I -i seed_demo_events.sql
-- Idempotent: deletes only the 7 demo event graphs below, never the Spring 2026 template.
-- Shared demo password for all seeded accounts: Demo@123456

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

DECLARE @demoHash NVARCHAR(255) = N'$2a$10$7ZqT629/ciaVAXuzx7B0zO.wFlLuVz6NK3/tNioMOWFLb2gPkXeU2'; -- password: Demo@123456
DECLARE @now DATETIME2 = SYSUTCDATETIME();
DECLARE @templateId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM scoring_templates ORDER BY created_at);

IF @demoHash NOT LIKE '$2[aby]$%'
BEGIN
    RAISERROR('@demoHash does not look like a BCrypt hash.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END

IF @templateId IS NULL
BEGIN
    RAISERROR('No scoring template found. Start backend with dev profile first.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END

DECLARE @demoEventIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @demoEventIds (id) VALUES ('01020000-EEEE-4EEE-8EEE-000000000001');
INSERT INTO @demoEventIds (id) VALUES ('02020000-EEEE-4EEE-8EEE-000000000001');
INSERT INTO @demoEventIds (id) VALUES ('03020000-EEEE-4EEE-8EEE-000000000001');
INSERT INTO @demoEventIds (id) VALUES ('04020000-EEEE-4EEE-8EEE-000000000001');
INSERT INTO @demoEventIds (id) VALUES ('05020000-EEEE-4EEE-8EEE-000000000001');
INSERT INTO @demoEventIds (id) VALUES ('06020000-EEEE-4EEE-8EEE-000000000001');
INSERT INTO @demoEventIds (id) VALUES ('07020000-EEEE-4EEE-8EEE-000000000001');

-- Refuse to touch the Spring 2026 template
IF EXISTS (SELECT 1 FROM @demoEventIds WHERE id = '77F2A5A3-6538-4FCF-B85A-666066465E68')
BEGIN
    RAISERROR('Demo event id collided with template id.', 16, 1);
    ROLLBACK TRANSACTION;
    RETURN;
END

DECLARE @teamIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @teamIds (id) SELECT t.id FROM teams t WHERE t.event_id IN (SELECT id FROM @demoEventIds);
DECLARE @roundIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @roundIds (id) SELECT r.id FROM rounds r WHERE r.event_id IN (SELECT id FROM @demoEventIds);
DECLARE @submissionIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);
INSERT INTO @submissionIds (id)
SELECT s.id FROM submissions s INNER JOIN @teamIds t ON s.team_id = t.id;

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
IF OBJECT_ID(N'mentor_chat_messages', N'U') IS NOT NULL
    DELETE FROM mentor_chat_messages WHERE team_id IN (SELECT id FROM @teamIds);
IF OBJECT_ID(N'mentor_feedbacks', N'U') IS NOT NULL
    DELETE FROM mentor_feedbacks WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM mentor_teams WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM invitations WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM mentor_invitations WHERE team_id IN (SELECT id FROM @teamIds);
-- Drop prior progress-alert notifications for demo teams
DELETE FROM notification_recipients WHERE notification_id IN (
    SELECT id FROM notifications
    WHERE type = N'TEAM_PROGRESS_ALERT' AND reference_id IN (SELECT id FROM @teamIds));
DELETE FROM notifications
WHERE type = N'TEAM_PROGRESS_ALERT' AND reference_id IN (SELECT id FROM @teamIds);
DELETE FROM team_join_requests WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM team_leave_requests WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM team_needed_roles WHERE team_id IN (SELECT id FROM @teamIds);
IF OBJECT_ID(N'team_progress_alerts', N'U') IS NOT NULL
    DELETE FROM team_progress_alerts WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM team_members WHERE team_id IN (SELECT id FROM @teamIds);
DELETE FROM teams WHERE id IN (SELECT id FROM @teamIds);
DELETE FROM event_enrollments WHERE event_id IN (SELECT id FROM @demoEventIds);
DELETE FROM event_magic_tokens WHERE event_id IN (SELECT id FROM @demoEventIds);
DELETE FROM participant_feedbacks WHERE event_id IN (SELECT id FROM @demoEventIds);
DELETE FROM participation_certificates WHERE event_id IN (SELECT id FROM @demoEventIds);
DELETE FROM score_review_requests WHERE event_id IN (SELECT id FROM @demoEventIds);
DELETE FROM team_awards WHERE event_id IN (SELECT id FROM @demoEventIds);
DELETE FROM finalist_contested_slot_teams WHERE contested_slot_id IN (
    SELECT id FROM finalist_contested_slots WHERE event_id IN (SELECT id FROM @demoEventIds));
DELETE FROM finalist_contested_slots WHERE event_id IN (SELECT id FROM @demoEventIds);
DELETE FROM finalist_selections WHERE event_id IN (SELECT id FROM @demoEventIds);
DELETE FROM track_draw_sessions WHERE event_id IN (SELECT id FROM @demoEventIds);
IF OBJECT_ID(N'disputes', N'U') IS NOT NULL
    DELETE FROM disputes WHERE round_id IN (SELECT id FROM @roundIds);
IF OBJECT_ID(N'advancements', N'U') IS NOT NULL
    DELETE FROM advancements WHERE round_id IN (SELECT id FROM @roundIds);
DELETE FROM rankings WHERE round_id IN (SELECT id FROM @roundIds);
DELETE FROM published_results WHERE round_id IN (SELECT id FROM @roundIds);
DELETE FROM judge_assignments WHERE round_id IN (SELECT id FROM @roundIds);
DELETE FROM criteria WHERE round_id IN (SELECT id FROM @roundIds);
DELETE FROM rounds WHERE id IN (SELECT id FROM @roundIds);
DELETE FROM event_judge_assignments WHERE event_id IN (SELECT id FROM @demoEventIds);
DELETE FROM event_mentor_assignments WHERE event_id IN (SELECT id FROM @demoEventIds);
DELETE FROM mentor_assignments WHERE event_id IN (SELECT id FROM @demoEventIds);
DELETE FROM event_tiebreaker_criteria WHERE event_id IN (SELECT id FROM @demoEventIds);
DELETE FROM honored_guests WHERE event_id IN (SELECT id FROM @demoEventIds);
DELETE FROM prizes WHERE event_id IN (SELECT id FROM @demoEventIds);
DELETE FROM event_schedules WHERE event_id IN (SELECT id FROM @demoEventIds);
DELETE FROM allowed_email_domains WHERE event_id IN (SELECT id FROM @demoEventIds);
IF OBJECT_ID(N'competition_groups', N'U') IS NOT NULL
    DELETE cg FROM competition_groups cg
    INNER JOIN tracks tr ON tr.id = cg.track_id
    WHERE tr.event_id IN (SELECT id FROM @demoEventIds);
DELETE FROM tracks WHERE event_id IN (SELECT id FROM @demoEventIds);
DELETE FROM hackathon_events WHERE id IN (SELECT id FROM @demoEventIds);

-- Remove prior demo accounts that reused emails with different ids (safe after event wipe)
DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email IN (
    N'tran.thanh.ha@fpt.edu.vn',
    N'nguyen.van.duc@fpt.edu.vn',
    N'le.thi.mai.anh@fpt.edu.vn',
    N'vo.thi.huong@fpt.edu.vn',
    N'pham.quoc.bao@fpt.edu.vn',
    N'tran.minh.khang@fpt.edu.vn',
    N'nguyen.thi.lan@fpt.edu.vn',
    N'nguyen.hoang.minh@fpt.edu.vn',
    N'tran.thu.ha@fpt.edu.vn',
    N'le.quang.huy@fpt.edu.vn',
    N'pham.ngoc.anh@fpt.edu.vn',
    N'hoang.duc.anh@fpt.edu.vn',
    N'vu.minh.chau@fpt.edu.vn',
    N'dang.thanh.tung@fpt.edu.vn',
    N'bui.thi.lan@fpt.edu.vn',
    N'ngo.van.khoa@fpt.edu.vn',
    N'do.hai.yen@fpt.edu.vn',
    N'ly.quoc.bao@fpt.edu.vn',
    N'mai.phuong.thao@fpt.edu.vn',
    N'trinh.nhat.nam@fpt.edu.vn',
    N'phan.gia.bao@fpt.edu.vn',
    N'huynh.khanh.vy@fpt.edu.vn',
    N'vo.thanh.phong@fpt.edu.vn',
    N'dinh.ngoc.mai@fpt.edu.vn',
    N'cao.minh.tuan@fpt.edu.vn',
    N'luong.thi.huong@fpt.edu.vn',
    N'ta.duc.long@fpt.edu.vn',
    N'ho.quang.vinh@fpt.edu.vn',
    N'chu.thi.my@fpt.edu.vn',
    N'doan.anh.khoa@fpt.edu.vn',
    N'lam.thanh.truc@fpt.edu.vn',
    N'tong.minh.duc@fpt.edu.vn',
    N'nghiem.ha.my@fpt.edu.vn',
    N'quach.nhat.hao@fpt.edu.vn',
    N'nguyen.hoang.minh.summer26@fpt.edu.vn',
    N'tran.thu.ha.summer26@fpt.edu.vn',
    N'le.quang.huy.summer26@fpt.edu.vn',
    N'pham.ngoc.anh.summer26@fpt.edu.vn',
    N'hoang.duc.anh.summer26@fpt.edu.vn',
    N'vu.minh.chau.summer26@fpt.edu.vn',
    N'dang.thanh.tung.summer26@fpt.edu.vn',
    N'bui.thi.lan.summer26@fpt.edu.vn',
    N'ngo.van.khoa.summer26@fpt.edu.vn',
    N'do.hai.yen.summer26@fpt.edu.vn',
    N'ly.quoc.bao.summer26@fpt.edu.vn',
    N'mai.phuong.thao.summer26@fpt.edu.vn',
    N'trinh.nhat.nam.summer26@fpt.edu.vn',
    N'phan.gia.bao.summer26@fpt.edu.vn',
    N'huynh.khanh.vy.summer26@fpt.edu.vn',
    N'vo.thanh.phong.summer26@fpt.edu.vn',
    N'dinh.ngoc.mai.summer26@fpt.edu.vn',
    N'cao.minh.tuan.summer26@fpt.edu.vn',
    N'luong.thi.huong.summer26@fpt.edu.vn',
    N'ta.duc.long.summer26@fpt.edu.vn',
    N'ho.quang.vinh.summer26@fpt.edu.vn',
    N'chu.thi.my.summer26@fpt.edu.vn',
    N'doan.anh.khoa.summer26@fpt.edu.vn',
    N'lam.thanh.truc.summer26@fpt.edu.vn',
    N'tong.minh.duc.summer26@fpt.edu.vn',
    N'nghiem.ha.my.summer26@fpt.edu.vn',
    N'quach.nhat.hao.summer26@fpt.edu.vn',
    N'nguyen.hoang.minh.closing26@fpt.edu.vn',
    N'tran.thu.ha.closing26@fpt.edu.vn',
    N'le.quang.huy.closing26@fpt.edu.vn',
    N'pham.ngoc.anh.closing26@fpt.edu.vn',
    N'hoang.duc.anh.closing26@fpt.edu.vn',
    N'vu.minh.chau.closing26@fpt.edu.vn',
    N'dang.thanh.tung.closing26@fpt.edu.vn',
    N'bui.thi.lan.closing26@fpt.edu.vn',
    N'ngo.van.khoa.closing26@fpt.edu.vn',
    N'do.hai.yen.closing26@fpt.edu.vn',
    N'ly.quoc.bao.closing26@fpt.edu.vn',
    N'mai.phuong.thao.closing26@fpt.edu.vn',
    N'trinh.nhat.nam.closing26@fpt.edu.vn',
    N'phan.gia.bao.closing26@fpt.edu.vn',
    N'huynh.khanh.vy.closing26@fpt.edu.vn',
    N'vo.thanh.phong.closing26@fpt.edu.vn',
    N'dinh.ngoc.mai.closing26@fpt.edu.vn',
    N'cao.minh.tuan.closing26@fpt.edu.vn',
    N'luong.thi.huong.closing26@fpt.edu.vn',
    N'ta.duc.long.closing26@fpt.edu.vn',
    N'ho.quang.vinh.closing26@fpt.edu.vn',
    N'chu.thi.my.closing26@fpt.edu.vn',
    N'doan.anh.khoa.closing26@fpt.edu.vn',
    N'lam.thanh.truc.closing26@fpt.edu.vn',
    N'tong.minh.duc.closing26@fpt.edu.vn',
    N'nghiem.ha.my.closing26@fpt.edu.vn',
    N'quach.nhat.hao.closing26@fpt.edu.vn',
    N'nguyen.hoang.minh.preview26@fpt.edu.vn',
    N'tran.thu.ha.preview26@fpt.edu.vn',
    N'le.quang.huy.preview26@fpt.edu.vn',
    N'pham.ngoc.anh.preview26@fpt.edu.vn',
    N'hoang.duc.anh.preview26@fpt.edu.vn',
    N'vu.minh.chau.preview26@fpt.edu.vn',
    N'dang.thanh.tung.preview26@fpt.edu.vn',
    N'bui.thi.lan.preview26@fpt.edu.vn',
    N'ngo.van.khoa.preview26@fpt.edu.vn',
    N'do.hai.yen.preview26@fpt.edu.vn',
    N'ly.quoc.bao.preview26@fpt.edu.vn',
    N'mai.phuong.thao.preview26@fpt.edu.vn',
    N'trinh.nhat.nam.preview26@fpt.edu.vn',
    N'phan.gia.bao.preview26@fpt.edu.vn',
    N'huynh.khanh.vy.preview26@fpt.edu.vn',
    N'vo.thanh.phong.preview26@fpt.edu.vn',
    N'dinh.ngoc.mai.preview26@fpt.edu.vn',
    N'cao.minh.tuan.preview26@fpt.edu.vn',
    N'luong.thi.huong.preview26@fpt.edu.vn',
    N'ta.duc.long.preview26@fpt.edu.vn',
    N'ho.quang.vinh.preview26@fpt.edu.vn',
    N'chu.thi.my.preview26@fpt.edu.vn',
    N'doan.anh.khoa.preview26@fpt.edu.vn',
    N'lam.thanh.truc.preview26@fpt.edu.vn',
    N'tong.minh.duc.preview26@fpt.edu.vn',
    N'nghiem.ha.my.preview26@fpt.edu.vn',
    N'quach.nhat.hao.preview26@fpt.edu.vn'
) AND id NOT IN (
    '00000000-EEEE-4EEE-8EEE-000000000001',
    '00000000-EEEE-4EEE-8EEE-000000000002',
    '00000000-EEEE-4EEE-8EEE-000000000003',
    '00000000-EEEE-4EEE-8EEE-000000000005',
    '00000000-EEEE-4EEE-8EEE-000000000004',
    '00000000-EEEE-4EEE-8EEE-000000000006',
    '00000000-EEEE-4EEE-8EEE-000000000007',
    '01010000-EEEE-4EEE-8EEE-000000000001',
    '01010000-EEEE-4EEE-8EEE-000000000002',
    '01010000-EEEE-4EEE-8EEE-000000000003',
    '01010000-EEEE-4EEE-8EEE-000000000004',
    '01010000-EEEE-4EEE-8EEE-000000000005',
    '01010000-EEEE-4EEE-8EEE-000000000006',
    '01010000-EEEE-4EEE-8EEE-000000000007',
    '01010000-EEEE-4EEE-8EEE-000000000008',
    '01010000-EEEE-4EEE-8EEE-000000000009',
    '01010000-EEEE-4EEE-8EEE-00000000000A',
    '01010000-EEEE-4EEE-8EEE-00000000000B',
    '01010000-EEEE-4EEE-8EEE-00000000000C',
    '01010000-EEEE-4EEE-8EEE-00000000000D',
    '01010000-EEEE-4EEE-8EEE-00000000000E',
    '01010000-EEEE-4EEE-8EEE-00000000000F',
    '01010000-EEEE-4EEE-8EEE-000000000010',
    '01010000-EEEE-4EEE-8EEE-000000000011',
    '01010000-EEEE-4EEE-8EEE-000000000012',
    '01010000-EEEE-4EEE-8EEE-000000000013',
    '01010000-EEEE-4EEE-8EEE-000000000014',
    '01010000-EEEE-4EEE-8EEE-000000000015',
    '01010000-EEEE-4EEE-8EEE-000000000016',
    '01010000-EEEE-4EEE-8EEE-000000000017',
    '01010000-EEEE-4EEE-8EEE-000000000018',
    '01010000-EEEE-4EEE-8EEE-000000000019',
    '01010000-EEEE-4EEE-8EEE-00000000001A',
    '01010000-EEEE-4EEE-8EEE-00000000001B',
    '04010000-EEEE-4EEE-8EEE-000000000001',
    '04010000-EEEE-4EEE-8EEE-000000000002',
    '04010000-EEEE-4EEE-8EEE-000000000003',
    '04010000-EEEE-4EEE-8EEE-000000000004',
    '04010000-EEEE-4EEE-8EEE-000000000005',
    '04010000-EEEE-4EEE-8EEE-000000000006',
    '04010000-EEEE-4EEE-8EEE-000000000007',
    '04010000-EEEE-4EEE-8EEE-000000000008',
    '04010000-EEEE-4EEE-8EEE-000000000009',
    '04010000-EEEE-4EEE-8EEE-00000000000A',
    '04010000-EEEE-4EEE-8EEE-00000000000B',
    '04010000-EEEE-4EEE-8EEE-00000000000C',
    '04010000-EEEE-4EEE-8EEE-00000000000D',
    '04010000-EEEE-4EEE-8EEE-00000000000E',
    '04010000-EEEE-4EEE-8EEE-00000000000F',
    '04010000-EEEE-4EEE-8EEE-000000000010',
    '04010000-EEEE-4EEE-8EEE-000000000011',
    '04010000-EEEE-4EEE-8EEE-000000000012',
    '04010000-EEEE-4EEE-8EEE-000000000013',
    '04010000-EEEE-4EEE-8EEE-000000000014',
    '04010000-EEEE-4EEE-8EEE-000000000015',
    '04010000-EEEE-4EEE-8EEE-000000000016',
    '04010000-EEEE-4EEE-8EEE-000000000017',
    '04010000-EEEE-4EEE-8EEE-000000000018',
    '04010000-EEEE-4EEE-8EEE-000000000019',
    '04010000-EEEE-4EEE-8EEE-00000000001A',
    '04010000-EEEE-4EEE-8EEE-00000000001B',
    '05010000-EEEE-4EEE-8EEE-000000000001',
    '05010000-EEEE-4EEE-8EEE-000000000002',
    '05010000-EEEE-4EEE-8EEE-000000000003',
    '05010000-EEEE-4EEE-8EEE-000000000004',
    '05010000-EEEE-4EEE-8EEE-000000000005',
    '05010000-EEEE-4EEE-8EEE-000000000006',
    '05010000-EEEE-4EEE-8EEE-000000000007',
    '05010000-EEEE-4EEE-8EEE-000000000008',
    '05010000-EEEE-4EEE-8EEE-000000000009',
    '05010000-EEEE-4EEE-8EEE-00000000000A',
    '05010000-EEEE-4EEE-8EEE-00000000000B',
    '05010000-EEEE-4EEE-8EEE-00000000000C',
    '05010000-EEEE-4EEE-8EEE-00000000000D',
    '05010000-EEEE-4EEE-8EEE-00000000000E',
    '05010000-EEEE-4EEE-8EEE-00000000000F',
    '05010000-EEEE-4EEE-8EEE-000000000010',
    '05010000-EEEE-4EEE-8EEE-000000000011',
    '05010000-EEEE-4EEE-8EEE-000000000012',
    '05010000-EEEE-4EEE-8EEE-000000000013',
    '05010000-EEEE-4EEE-8EEE-000000000014',
    '05010000-EEEE-4EEE-8EEE-000000000015',
    '05010000-EEEE-4EEE-8EEE-000000000016',
    '05010000-EEEE-4EEE-8EEE-000000000017',
    '05010000-EEEE-4EEE-8EEE-000000000018',
    '05010000-EEEE-4EEE-8EEE-000000000019',
    '05010000-EEEE-4EEE-8EEE-00000000001A',
    '05010000-EEEE-4EEE-8EEE-00000000001B',
    '06010000-EEEE-4EEE-8EEE-000000000001',
    '06010000-EEEE-4EEE-8EEE-000000000002',
    '06010000-EEEE-4EEE-8EEE-000000000003',
    '06010000-EEEE-4EEE-8EEE-000000000004',
    '06010000-EEEE-4EEE-8EEE-000000000005',
    '06010000-EEEE-4EEE-8EEE-000000000006',
    '06010000-EEEE-4EEE-8EEE-000000000007',
    '06010000-EEEE-4EEE-8EEE-000000000008',
    '06010000-EEEE-4EEE-8EEE-000000000009',
    '06010000-EEEE-4EEE-8EEE-00000000000A',
    '06010000-EEEE-4EEE-8EEE-00000000000B',
    '06010000-EEEE-4EEE-8EEE-00000000000C',
    '06010000-EEEE-4EEE-8EEE-00000000000D',
    '06010000-EEEE-4EEE-8EEE-00000000000E',
    '06010000-EEEE-4EEE-8EEE-00000000000F',
    '06010000-EEEE-4EEE-8EEE-000000000010',
    '06010000-EEEE-4EEE-8EEE-000000000011',
    '06010000-EEEE-4EEE-8EEE-000000000012',
    '06010000-EEEE-4EEE-8EEE-000000000013',
    '06010000-EEEE-4EEE-8EEE-000000000014',
    '06010000-EEEE-4EEE-8EEE-000000000015',
    '06010000-EEEE-4EEE-8EEE-000000000016',
    '06010000-EEEE-4EEE-8EEE-000000000017',
    '06010000-EEEE-4EEE-8EEE-000000000018',
    '06010000-EEEE-4EEE-8EEE-000000000019',
    '06010000-EEEE-4EEE-8EEE-00000000001A',
    '06010000-EEEE-4EEE-8EEE-00000000001B'
));
DELETE FROM password_reset_tokens WHERE user_id IN (SELECT id FROM users WHERE email IN (
    N'tran.thanh.ha@fpt.edu.vn',
    N'nguyen.van.duc@fpt.edu.vn',
    N'le.thi.mai.anh@fpt.edu.vn',
    N'vo.thi.huong@fpt.edu.vn',
    N'pham.quoc.bao@fpt.edu.vn',
    N'tran.minh.khang@fpt.edu.vn',
    N'nguyen.thi.lan@fpt.edu.vn',
    N'nguyen.hoang.minh@fpt.edu.vn',
    N'tran.thu.ha@fpt.edu.vn',
    N'le.quang.huy@fpt.edu.vn',
    N'pham.ngoc.anh@fpt.edu.vn',
    N'hoang.duc.anh@fpt.edu.vn',
    N'vu.minh.chau@fpt.edu.vn',
    N'dang.thanh.tung@fpt.edu.vn',
    N'bui.thi.lan@fpt.edu.vn',
    N'ngo.van.khoa@fpt.edu.vn',
    N'do.hai.yen@fpt.edu.vn',
    N'ly.quoc.bao@fpt.edu.vn',
    N'mai.phuong.thao@fpt.edu.vn',
    N'trinh.nhat.nam@fpt.edu.vn',
    N'phan.gia.bao@fpt.edu.vn',
    N'huynh.khanh.vy@fpt.edu.vn',
    N'vo.thanh.phong@fpt.edu.vn',
    N'dinh.ngoc.mai@fpt.edu.vn',
    N'cao.minh.tuan@fpt.edu.vn',
    N'luong.thi.huong@fpt.edu.vn',
    N'ta.duc.long@fpt.edu.vn',
    N'ho.quang.vinh@fpt.edu.vn',
    N'chu.thi.my@fpt.edu.vn',
    N'doan.anh.khoa@fpt.edu.vn',
    N'lam.thanh.truc@fpt.edu.vn',
    N'tong.minh.duc@fpt.edu.vn',
    N'nghiem.ha.my@fpt.edu.vn',
    N'quach.nhat.hao@fpt.edu.vn',
    N'nguyen.hoang.minh.summer26@fpt.edu.vn',
    N'tran.thu.ha.summer26@fpt.edu.vn',
    N'le.quang.huy.summer26@fpt.edu.vn',
    N'pham.ngoc.anh.summer26@fpt.edu.vn',
    N'hoang.duc.anh.summer26@fpt.edu.vn',
    N'vu.minh.chau.summer26@fpt.edu.vn',
    N'dang.thanh.tung.summer26@fpt.edu.vn',
    N'bui.thi.lan.summer26@fpt.edu.vn',
    N'ngo.van.khoa.summer26@fpt.edu.vn',
    N'do.hai.yen.summer26@fpt.edu.vn',
    N'ly.quoc.bao.summer26@fpt.edu.vn',
    N'mai.phuong.thao.summer26@fpt.edu.vn',
    N'trinh.nhat.nam.summer26@fpt.edu.vn',
    N'phan.gia.bao.summer26@fpt.edu.vn',
    N'huynh.khanh.vy.summer26@fpt.edu.vn',
    N'vo.thanh.phong.summer26@fpt.edu.vn',
    N'dinh.ngoc.mai.summer26@fpt.edu.vn',
    N'cao.minh.tuan.summer26@fpt.edu.vn',
    N'luong.thi.huong.summer26@fpt.edu.vn',
    N'ta.duc.long.summer26@fpt.edu.vn',
    N'ho.quang.vinh.summer26@fpt.edu.vn',
    N'chu.thi.my.summer26@fpt.edu.vn',
    N'doan.anh.khoa.summer26@fpt.edu.vn',
    N'lam.thanh.truc.summer26@fpt.edu.vn',
    N'tong.minh.duc.summer26@fpt.edu.vn',
    N'nghiem.ha.my.summer26@fpt.edu.vn',
    N'quach.nhat.hao.summer26@fpt.edu.vn',
    N'nguyen.hoang.minh.closing26@fpt.edu.vn',
    N'tran.thu.ha.closing26@fpt.edu.vn',
    N'le.quang.huy.closing26@fpt.edu.vn',
    N'pham.ngoc.anh.closing26@fpt.edu.vn',
    N'hoang.duc.anh.closing26@fpt.edu.vn',
    N'vu.minh.chau.closing26@fpt.edu.vn',
    N'dang.thanh.tung.closing26@fpt.edu.vn',
    N'bui.thi.lan.closing26@fpt.edu.vn',
    N'ngo.van.khoa.closing26@fpt.edu.vn',
    N'do.hai.yen.closing26@fpt.edu.vn',
    N'ly.quoc.bao.closing26@fpt.edu.vn',
    N'mai.phuong.thao.closing26@fpt.edu.vn',
    N'trinh.nhat.nam.closing26@fpt.edu.vn',
    N'phan.gia.bao.closing26@fpt.edu.vn',
    N'huynh.khanh.vy.closing26@fpt.edu.vn',
    N'vo.thanh.phong.closing26@fpt.edu.vn',
    N'dinh.ngoc.mai.closing26@fpt.edu.vn',
    N'cao.minh.tuan.closing26@fpt.edu.vn',
    N'luong.thi.huong.closing26@fpt.edu.vn',
    N'ta.duc.long.closing26@fpt.edu.vn',
    N'ho.quang.vinh.closing26@fpt.edu.vn',
    N'chu.thi.my.closing26@fpt.edu.vn',
    N'doan.anh.khoa.closing26@fpt.edu.vn',
    N'lam.thanh.truc.closing26@fpt.edu.vn',
    N'tong.minh.duc.closing26@fpt.edu.vn',
    N'nghiem.ha.my.closing26@fpt.edu.vn',
    N'quach.nhat.hao.closing26@fpt.edu.vn',
    N'nguyen.hoang.minh.preview26@fpt.edu.vn',
    N'tran.thu.ha.preview26@fpt.edu.vn',
    N'le.quang.huy.preview26@fpt.edu.vn',
    N'pham.ngoc.anh.preview26@fpt.edu.vn',
    N'hoang.duc.anh.preview26@fpt.edu.vn',
    N'vu.minh.chau.preview26@fpt.edu.vn',
    N'dang.thanh.tung.preview26@fpt.edu.vn',
    N'bui.thi.lan.preview26@fpt.edu.vn',
    N'ngo.van.khoa.preview26@fpt.edu.vn',
    N'do.hai.yen.preview26@fpt.edu.vn',
    N'ly.quoc.bao.preview26@fpt.edu.vn',
    N'mai.phuong.thao.preview26@fpt.edu.vn',
    N'trinh.nhat.nam.preview26@fpt.edu.vn',
    N'phan.gia.bao.preview26@fpt.edu.vn',
    N'huynh.khanh.vy.preview26@fpt.edu.vn',
    N'vo.thanh.phong.preview26@fpt.edu.vn',
    N'dinh.ngoc.mai.preview26@fpt.edu.vn',
    N'cao.minh.tuan.preview26@fpt.edu.vn',
    N'luong.thi.huong.preview26@fpt.edu.vn',
    N'ta.duc.long.preview26@fpt.edu.vn',
    N'ho.quang.vinh.preview26@fpt.edu.vn',
    N'chu.thi.my.preview26@fpt.edu.vn',
    N'doan.anh.khoa.preview26@fpt.edu.vn',
    N'lam.thanh.truc.preview26@fpt.edu.vn',
    N'tong.minh.duc.preview26@fpt.edu.vn',
    N'nghiem.ha.my.preview26@fpt.edu.vn',
    N'quach.nhat.hao.preview26@fpt.edu.vn'
) AND id NOT IN (
    '00000000-EEEE-4EEE-8EEE-000000000001',
    '00000000-EEEE-4EEE-8EEE-000000000002',
    '00000000-EEEE-4EEE-8EEE-000000000003',
    '00000000-EEEE-4EEE-8EEE-000000000005',
    '00000000-EEEE-4EEE-8EEE-000000000004',
    '00000000-EEEE-4EEE-8EEE-000000000006',
    '00000000-EEEE-4EEE-8EEE-000000000007',
    '01010000-EEEE-4EEE-8EEE-000000000001',
    '01010000-EEEE-4EEE-8EEE-000000000002',
    '01010000-EEEE-4EEE-8EEE-000000000003',
    '01010000-EEEE-4EEE-8EEE-000000000004',
    '01010000-EEEE-4EEE-8EEE-000000000005',
    '01010000-EEEE-4EEE-8EEE-000000000006',
    '01010000-EEEE-4EEE-8EEE-000000000007',
    '01010000-EEEE-4EEE-8EEE-000000000008',
    '01010000-EEEE-4EEE-8EEE-000000000009',
    '01010000-EEEE-4EEE-8EEE-00000000000A',
    '01010000-EEEE-4EEE-8EEE-00000000000B',
    '01010000-EEEE-4EEE-8EEE-00000000000C',
    '01010000-EEEE-4EEE-8EEE-00000000000D',
    '01010000-EEEE-4EEE-8EEE-00000000000E',
    '01010000-EEEE-4EEE-8EEE-00000000000F',
    '01010000-EEEE-4EEE-8EEE-000000000010',
    '01010000-EEEE-4EEE-8EEE-000000000011',
    '01010000-EEEE-4EEE-8EEE-000000000012',
    '01010000-EEEE-4EEE-8EEE-000000000013',
    '01010000-EEEE-4EEE-8EEE-000000000014',
    '01010000-EEEE-4EEE-8EEE-000000000015',
    '01010000-EEEE-4EEE-8EEE-000000000016',
    '01010000-EEEE-4EEE-8EEE-000000000017',
    '01010000-EEEE-4EEE-8EEE-000000000018',
    '01010000-EEEE-4EEE-8EEE-000000000019',
    '01010000-EEEE-4EEE-8EEE-00000000001A',
    '01010000-EEEE-4EEE-8EEE-00000000001B',
    '04010000-EEEE-4EEE-8EEE-000000000001',
    '04010000-EEEE-4EEE-8EEE-000000000002',
    '04010000-EEEE-4EEE-8EEE-000000000003',
    '04010000-EEEE-4EEE-8EEE-000000000004',
    '04010000-EEEE-4EEE-8EEE-000000000005',
    '04010000-EEEE-4EEE-8EEE-000000000006',
    '04010000-EEEE-4EEE-8EEE-000000000007',
    '04010000-EEEE-4EEE-8EEE-000000000008',
    '04010000-EEEE-4EEE-8EEE-000000000009',
    '04010000-EEEE-4EEE-8EEE-00000000000A',
    '04010000-EEEE-4EEE-8EEE-00000000000B',
    '04010000-EEEE-4EEE-8EEE-00000000000C',
    '04010000-EEEE-4EEE-8EEE-00000000000D',
    '04010000-EEEE-4EEE-8EEE-00000000000E',
    '04010000-EEEE-4EEE-8EEE-00000000000F',
    '04010000-EEEE-4EEE-8EEE-000000000010',
    '04010000-EEEE-4EEE-8EEE-000000000011',
    '04010000-EEEE-4EEE-8EEE-000000000012',
    '04010000-EEEE-4EEE-8EEE-000000000013',
    '04010000-EEEE-4EEE-8EEE-000000000014',
    '04010000-EEEE-4EEE-8EEE-000000000015',
    '04010000-EEEE-4EEE-8EEE-000000000016',
    '04010000-EEEE-4EEE-8EEE-000000000017',
    '04010000-EEEE-4EEE-8EEE-000000000018',
    '04010000-EEEE-4EEE-8EEE-000000000019',
    '04010000-EEEE-4EEE-8EEE-00000000001A',
    '04010000-EEEE-4EEE-8EEE-00000000001B',
    '05010000-EEEE-4EEE-8EEE-000000000001',
    '05010000-EEEE-4EEE-8EEE-000000000002',
    '05010000-EEEE-4EEE-8EEE-000000000003',
    '05010000-EEEE-4EEE-8EEE-000000000004',
    '05010000-EEEE-4EEE-8EEE-000000000005',
    '05010000-EEEE-4EEE-8EEE-000000000006',
    '05010000-EEEE-4EEE-8EEE-000000000007',
    '05010000-EEEE-4EEE-8EEE-000000000008',
    '05010000-EEEE-4EEE-8EEE-000000000009',
    '05010000-EEEE-4EEE-8EEE-00000000000A',
    '05010000-EEEE-4EEE-8EEE-00000000000B',
    '05010000-EEEE-4EEE-8EEE-00000000000C',
    '05010000-EEEE-4EEE-8EEE-00000000000D',
    '05010000-EEEE-4EEE-8EEE-00000000000E',
    '05010000-EEEE-4EEE-8EEE-00000000000F',
    '05010000-EEEE-4EEE-8EEE-000000000010',
    '05010000-EEEE-4EEE-8EEE-000000000011',
    '05010000-EEEE-4EEE-8EEE-000000000012',
    '05010000-EEEE-4EEE-8EEE-000000000013',
    '05010000-EEEE-4EEE-8EEE-000000000014',
    '05010000-EEEE-4EEE-8EEE-000000000015',
    '05010000-EEEE-4EEE-8EEE-000000000016',
    '05010000-EEEE-4EEE-8EEE-000000000017',
    '05010000-EEEE-4EEE-8EEE-000000000018',
    '05010000-EEEE-4EEE-8EEE-000000000019',
    '05010000-EEEE-4EEE-8EEE-00000000001A',
    '05010000-EEEE-4EEE-8EEE-00000000001B',
    '06010000-EEEE-4EEE-8EEE-000000000001',
    '06010000-EEEE-4EEE-8EEE-000000000002',
    '06010000-EEEE-4EEE-8EEE-000000000003',
    '06010000-EEEE-4EEE-8EEE-000000000004',
    '06010000-EEEE-4EEE-8EEE-000000000005',
    '06010000-EEEE-4EEE-8EEE-000000000006',
    '06010000-EEEE-4EEE-8EEE-000000000007',
    '06010000-EEEE-4EEE-8EEE-000000000008',
    '06010000-EEEE-4EEE-8EEE-000000000009',
    '06010000-EEEE-4EEE-8EEE-00000000000A',
    '06010000-EEEE-4EEE-8EEE-00000000000B',
    '06010000-EEEE-4EEE-8EEE-00000000000C',
    '06010000-EEEE-4EEE-8EEE-00000000000D',
    '06010000-EEEE-4EEE-8EEE-00000000000E',
    '06010000-EEEE-4EEE-8EEE-00000000000F',
    '06010000-EEEE-4EEE-8EEE-000000000010',
    '06010000-EEEE-4EEE-8EEE-000000000011',
    '06010000-EEEE-4EEE-8EEE-000000000012',
    '06010000-EEEE-4EEE-8EEE-000000000013',
    '06010000-EEEE-4EEE-8EEE-000000000014',
    '06010000-EEEE-4EEE-8EEE-000000000015',
    '06010000-EEEE-4EEE-8EEE-000000000016',
    '06010000-EEEE-4EEE-8EEE-000000000017',
    '06010000-EEEE-4EEE-8EEE-000000000018',
    '06010000-EEEE-4EEE-8EEE-000000000019',
    '06010000-EEEE-4EEE-8EEE-00000000001A',
    '06010000-EEEE-4EEE-8EEE-00000000001B'
));
DELETE FROM email_otp_tokens WHERE user_id IN (SELECT id FROM users WHERE email IN (
    N'tran.thanh.ha@fpt.edu.vn',
    N'nguyen.van.duc@fpt.edu.vn',
    N'le.thi.mai.anh@fpt.edu.vn',
    N'vo.thi.huong@fpt.edu.vn',
    N'pham.quoc.bao@fpt.edu.vn',
    N'tran.minh.khang@fpt.edu.vn',
    N'nguyen.thi.lan@fpt.edu.vn',
    N'nguyen.hoang.minh@fpt.edu.vn',
    N'tran.thu.ha@fpt.edu.vn',
    N'le.quang.huy@fpt.edu.vn',
    N'pham.ngoc.anh@fpt.edu.vn',
    N'hoang.duc.anh@fpt.edu.vn',
    N'vu.minh.chau@fpt.edu.vn',
    N'dang.thanh.tung@fpt.edu.vn',
    N'bui.thi.lan@fpt.edu.vn',
    N'ngo.van.khoa@fpt.edu.vn',
    N'do.hai.yen@fpt.edu.vn',
    N'ly.quoc.bao@fpt.edu.vn',
    N'mai.phuong.thao@fpt.edu.vn',
    N'trinh.nhat.nam@fpt.edu.vn',
    N'phan.gia.bao@fpt.edu.vn',
    N'huynh.khanh.vy@fpt.edu.vn',
    N'vo.thanh.phong@fpt.edu.vn',
    N'dinh.ngoc.mai@fpt.edu.vn',
    N'cao.minh.tuan@fpt.edu.vn',
    N'luong.thi.huong@fpt.edu.vn',
    N'ta.duc.long@fpt.edu.vn',
    N'ho.quang.vinh@fpt.edu.vn',
    N'chu.thi.my@fpt.edu.vn',
    N'doan.anh.khoa@fpt.edu.vn',
    N'lam.thanh.truc@fpt.edu.vn',
    N'tong.minh.duc@fpt.edu.vn',
    N'nghiem.ha.my@fpt.edu.vn',
    N'quach.nhat.hao@fpt.edu.vn',
    N'nguyen.hoang.minh.summer26@fpt.edu.vn',
    N'tran.thu.ha.summer26@fpt.edu.vn',
    N'le.quang.huy.summer26@fpt.edu.vn',
    N'pham.ngoc.anh.summer26@fpt.edu.vn',
    N'hoang.duc.anh.summer26@fpt.edu.vn',
    N'vu.minh.chau.summer26@fpt.edu.vn',
    N'dang.thanh.tung.summer26@fpt.edu.vn',
    N'bui.thi.lan.summer26@fpt.edu.vn',
    N'ngo.van.khoa.summer26@fpt.edu.vn',
    N'do.hai.yen.summer26@fpt.edu.vn',
    N'ly.quoc.bao.summer26@fpt.edu.vn',
    N'mai.phuong.thao.summer26@fpt.edu.vn',
    N'trinh.nhat.nam.summer26@fpt.edu.vn',
    N'phan.gia.bao.summer26@fpt.edu.vn',
    N'huynh.khanh.vy.summer26@fpt.edu.vn',
    N'vo.thanh.phong.summer26@fpt.edu.vn',
    N'dinh.ngoc.mai.summer26@fpt.edu.vn',
    N'cao.minh.tuan.summer26@fpt.edu.vn',
    N'luong.thi.huong.summer26@fpt.edu.vn',
    N'ta.duc.long.summer26@fpt.edu.vn',
    N'ho.quang.vinh.summer26@fpt.edu.vn',
    N'chu.thi.my.summer26@fpt.edu.vn',
    N'doan.anh.khoa.summer26@fpt.edu.vn',
    N'lam.thanh.truc.summer26@fpt.edu.vn',
    N'tong.minh.duc.summer26@fpt.edu.vn',
    N'nghiem.ha.my.summer26@fpt.edu.vn',
    N'quach.nhat.hao.summer26@fpt.edu.vn',
    N'nguyen.hoang.minh.closing26@fpt.edu.vn',
    N'tran.thu.ha.closing26@fpt.edu.vn',
    N'le.quang.huy.closing26@fpt.edu.vn',
    N'pham.ngoc.anh.closing26@fpt.edu.vn',
    N'hoang.duc.anh.closing26@fpt.edu.vn',
    N'vu.minh.chau.closing26@fpt.edu.vn',
    N'dang.thanh.tung.closing26@fpt.edu.vn',
    N'bui.thi.lan.closing26@fpt.edu.vn',
    N'ngo.van.khoa.closing26@fpt.edu.vn',
    N'do.hai.yen.closing26@fpt.edu.vn',
    N'ly.quoc.bao.closing26@fpt.edu.vn',
    N'mai.phuong.thao.closing26@fpt.edu.vn',
    N'trinh.nhat.nam.closing26@fpt.edu.vn',
    N'phan.gia.bao.closing26@fpt.edu.vn',
    N'huynh.khanh.vy.closing26@fpt.edu.vn',
    N'vo.thanh.phong.closing26@fpt.edu.vn',
    N'dinh.ngoc.mai.closing26@fpt.edu.vn',
    N'cao.minh.tuan.closing26@fpt.edu.vn',
    N'luong.thi.huong.closing26@fpt.edu.vn',
    N'ta.duc.long.closing26@fpt.edu.vn',
    N'ho.quang.vinh.closing26@fpt.edu.vn',
    N'chu.thi.my.closing26@fpt.edu.vn',
    N'doan.anh.khoa.closing26@fpt.edu.vn',
    N'lam.thanh.truc.closing26@fpt.edu.vn',
    N'tong.minh.duc.closing26@fpt.edu.vn',
    N'nghiem.ha.my.closing26@fpt.edu.vn',
    N'quach.nhat.hao.closing26@fpt.edu.vn',
    N'nguyen.hoang.minh.preview26@fpt.edu.vn',
    N'tran.thu.ha.preview26@fpt.edu.vn',
    N'le.quang.huy.preview26@fpt.edu.vn',
    N'pham.ngoc.anh.preview26@fpt.edu.vn',
    N'hoang.duc.anh.preview26@fpt.edu.vn',
    N'vu.minh.chau.preview26@fpt.edu.vn',
    N'dang.thanh.tung.preview26@fpt.edu.vn',
    N'bui.thi.lan.preview26@fpt.edu.vn',
    N'ngo.van.khoa.preview26@fpt.edu.vn',
    N'do.hai.yen.preview26@fpt.edu.vn',
    N'ly.quoc.bao.preview26@fpt.edu.vn',
    N'mai.phuong.thao.preview26@fpt.edu.vn',
    N'trinh.nhat.nam.preview26@fpt.edu.vn',
    N'phan.gia.bao.preview26@fpt.edu.vn',
    N'huynh.khanh.vy.preview26@fpt.edu.vn',
    N'vo.thanh.phong.preview26@fpt.edu.vn',
    N'dinh.ngoc.mai.preview26@fpt.edu.vn',
    N'cao.minh.tuan.preview26@fpt.edu.vn',
    N'luong.thi.huong.preview26@fpt.edu.vn',
    N'ta.duc.long.preview26@fpt.edu.vn',
    N'ho.quang.vinh.preview26@fpt.edu.vn',
    N'chu.thi.my.preview26@fpt.edu.vn',
    N'doan.anh.khoa.preview26@fpt.edu.vn',
    N'lam.thanh.truc.preview26@fpt.edu.vn',
    N'tong.minh.duc.preview26@fpt.edu.vn',
    N'nghiem.ha.my.preview26@fpt.edu.vn',
    N'quach.nhat.hao.preview26@fpt.edu.vn'
) AND id NOT IN (
    '00000000-EEEE-4EEE-8EEE-000000000001',
    '00000000-EEEE-4EEE-8EEE-000000000002',
    '00000000-EEEE-4EEE-8EEE-000000000003',
    '00000000-EEEE-4EEE-8EEE-000000000005',
    '00000000-EEEE-4EEE-8EEE-000000000004',
    '00000000-EEEE-4EEE-8EEE-000000000006',
    '00000000-EEEE-4EEE-8EEE-000000000007',
    '01010000-EEEE-4EEE-8EEE-000000000001',
    '01010000-EEEE-4EEE-8EEE-000000000002',
    '01010000-EEEE-4EEE-8EEE-000000000003',
    '01010000-EEEE-4EEE-8EEE-000000000004',
    '01010000-EEEE-4EEE-8EEE-000000000005',
    '01010000-EEEE-4EEE-8EEE-000000000006',
    '01010000-EEEE-4EEE-8EEE-000000000007',
    '01010000-EEEE-4EEE-8EEE-000000000008',
    '01010000-EEEE-4EEE-8EEE-000000000009',
    '01010000-EEEE-4EEE-8EEE-00000000000A',
    '01010000-EEEE-4EEE-8EEE-00000000000B',
    '01010000-EEEE-4EEE-8EEE-00000000000C',
    '01010000-EEEE-4EEE-8EEE-00000000000D',
    '01010000-EEEE-4EEE-8EEE-00000000000E',
    '01010000-EEEE-4EEE-8EEE-00000000000F',
    '01010000-EEEE-4EEE-8EEE-000000000010',
    '01010000-EEEE-4EEE-8EEE-000000000011',
    '01010000-EEEE-4EEE-8EEE-000000000012',
    '01010000-EEEE-4EEE-8EEE-000000000013',
    '01010000-EEEE-4EEE-8EEE-000000000014',
    '01010000-EEEE-4EEE-8EEE-000000000015',
    '01010000-EEEE-4EEE-8EEE-000000000016',
    '01010000-EEEE-4EEE-8EEE-000000000017',
    '01010000-EEEE-4EEE-8EEE-000000000018',
    '01010000-EEEE-4EEE-8EEE-000000000019',
    '01010000-EEEE-4EEE-8EEE-00000000001A',
    '01010000-EEEE-4EEE-8EEE-00000000001B',
    '04010000-EEEE-4EEE-8EEE-000000000001',
    '04010000-EEEE-4EEE-8EEE-000000000002',
    '04010000-EEEE-4EEE-8EEE-000000000003',
    '04010000-EEEE-4EEE-8EEE-000000000004',
    '04010000-EEEE-4EEE-8EEE-000000000005',
    '04010000-EEEE-4EEE-8EEE-000000000006',
    '04010000-EEEE-4EEE-8EEE-000000000007',
    '04010000-EEEE-4EEE-8EEE-000000000008',
    '04010000-EEEE-4EEE-8EEE-000000000009',
    '04010000-EEEE-4EEE-8EEE-00000000000A',
    '04010000-EEEE-4EEE-8EEE-00000000000B',
    '04010000-EEEE-4EEE-8EEE-00000000000C',
    '04010000-EEEE-4EEE-8EEE-00000000000D',
    '04010000-EEEE-4EEE-8EEE-00000000000E',
    '04010000-EEEE-4EEE-8EEE-00000000000F',
    '04010000-EEEE-4EEE-8EEE-000000000010',
    '04010000-EEEE-4EEE-8EEE-000000000011',
    '04010000-EEEE-4EEE-8EEE-000000000012',
    '04010000-EEEE-4EEE-8EEE-000000000013',
    '04010000-EEEE-4EEE-8EEE-000000000014',
    '04010000-EEEE-4EEE-8EEE-000000000015',
    '04010000-EEEE-4EEE-8EEE-000000000016',
    '04010000-EEEE-4EEE-8EEE-000000000017',
    '04010000-EEEE-4EEE-8EEE-000000000018',
    '04010000-EEEE-4EEE-8EEE-000000000019',
    '04010000-EEEE-4EEE-8EEE-00000000001A',
    '04010000-EEEE-4EEE-8EEE-00000000001B',
    '05010000-EEEE-4EEE-8EEE-000000000001',
    '05010000-EEEE-4EEE-8EEE-000000000002',
    '05010000-EEEE-4EEE-8EEE-000000000003',
    '05010000-EEEE-4EEE-8EEE-000000000004',
    '05010000-EEEE-4EEE-8EEE-000000000005',
    '05010000-EEEE-4EEE-8EEE-000000000006',
    '05010000-EEEE-4EEE-8EEE-000000000007',
    '05010000-EEEE-4EEE-8EEE-000000000008',
    '05010000-EEEE-4EEE-8EEE-000000000009',
    '05010000-EEEE-4EEE-8EEE-00000000000A',
    '05010000-EEEE-4EEE-8EEE-00000000000B',
    '05010000-EEEE-4EEE-8EEE-00000000000C',
    '05010000-EEEE-4EEE-8EEE-00000000000D',
    '05010000-EEEE-4EEE-8EEE-00000000000E',
    '05010000-EEEE-4EEE-8EEE-00000000000F',
    '05010000-EEEE-4EEE-8EEE-000000000010',
    '05010000-EEEE-4EEE-8EEE-000000000011',
    '05010000-EEEE-4EEE-8EEE-000000000012',
    '05010000-EEEE-4EEE-8EEE-000000000013',
    '05010000-EEEE-4EEE-8EEE-000000000014',
    '05010000-EEEE-4EEE-8EEE-000000000015',
    '05010000-EEEE-4EEE-8EEE-000000000016',
    '05010000-EEEE-4EEE-8EEE-000000000017',
    '05010000-EEEE-4EEE-8EEE-000000000018',
    '05010000-EEEE-4EEE-8EEE-000000000019',
    '05010000-EEEE-4EEE-8EEE-00000000001A',
    '05010000-EEEE-4EEE-8EEE-00000000001B',
    '06010000-EEEE-4EEE-8EEE-000000000001',
    '06010000-EEEE-4EEE-8EEE-000000000002',
    '06010000-EEEE-4EEE-8EEE-000000000003',
    '06010000-EEEE-4EEE-8EEE-000000000004',
    '06010000-EEEE-4EEE-8EEE-000000000005',
    '06010000-EEEE-4EEE-8EEE-000000000006',
    '06010000-EEEE-4EEE-8EEE-000000000007',
    '06010000-EEEE-4EEE-8EEE-000000000008',
    '06010000-EEEE-4EEE-8EEE-000000000009',
    '06010000-EEEE-4EEE-8EEE-00000000000A',
    '06010000-EEEE-4EEE-8EEE-00000000000B',
    '06010000-EEEE-4EEE-8EEE-00000000000C',
    '06010000-EEEE-4EEE-8EEE-00000000000D',
    '06010000-EEEE-4EEE-8EEE-00000000000E',
    '06010000-EEEE-4EEE-8EEE-00000000000F',
    '06010000-EEEE-4EEE-8EEE-000000000010',
    '06010000-EEEE-4EEE-8EEE-000000000011',
    '06010000-EEEE-4EEE-8EEE-000000000012',
    '06010000-EEEE-4EEE-8EEE-000000000013',
    '06010000-EEEE-4EEE-8EEE-000000000014',
    '06010000-EEEE-4EEE-8EEE-000000000015',
    '06010000-EEEE-4EEE-8EEE-000000000016',
    '06010000-EEEE-4EEE-8EEE-000000000017',
    '06010000-EEEE-4EEE-8EEE-000000000018',
    '06010000-EEEE-4EEE-8EEE-000000000019',
    '06010000-EEEE-4EEE-8EEE-00000000001A',
    '06010000-EEEE-4EEE-8EEE-00000000001B'
));
DELETE FROM notification_recipients WHERE user_id IN (SELECT id FROM users WHERE email IN (
    N'tran.thanh.ha@fpt.edu.vn',
    N'nguyen.van.duc@fpt.edu.vn',
    N'le.thi.mai.anh@fpt.edu.vn',
    N'vo.thi.huong@fpt.edu.vn',
    N'pham.quoc.bao@fpt.edu.vn',
    N'tran.minh.khang@fpt.edu.vn',
    N'nguyen.thi.lan@fpt.edu.vn',
    N'nguyen.hoang.minh@fpt.edu.vn',
    N'tran.thu.ha@fpt.edu.vn',
    N'le.quang.huy@fpt.edu.vn',
    N'pham.ngoc.anh@fpt.edu.vn',
    N'hoang.duc.anh@fpt.edu.vn',
    N'vu.minh.chau@fpt.edu.vn',
    N'dang.thanh.tung@fpt.edu.vn',
    N'bui.thi.lan@fpt.edu.vn',
    N'ngo.van.khoa@fpt.edu.vn',
    N'do.hai.yen@fpt.edu.vn',
    N'ly.quoc.bao@fpt.edu.vn',
    N'mai.phuong.thao@fpt.edu.vn',
    N'trinh.nhat.nam@fpt.edu.vn',
    N'phan.gia.bao@fpt.edu.vn',
    N'huynh.khanh.vy@fpt.edu.vn',
    N'vo.thanh.phong@fpt.edu.vn',
    N'dinh.ngoc.mai@fpt.edu.vn',
    N'cao.minh.tuan@fpt.edu.vn',
    N'luong.thi.huong@fpt.edu.vn',
    N'ta.duc.long@fpt.edu.vn',
    N'ho.quang.vinh@fpt.edu.vn',
    N'chu.thi.my@fpt.edu.vn',
    N'doan.anh.khoa@fpt.edu.vn',
    N'lam.thanh.truc@fpt.edu.vn',
    N'tong.minh.duc@fpt.edu.vn',
    N'nghiem.ha.my@fpt.edu.vn',
    N'quach.nhat.hao@fpt.edu.vn',
    N'nguyen.hoang.minh.summer26@fpt.edu.vn',
    N'tran.thu.ha.summer26@fpt.edu.vn',
    N'le.quang.huy.summer26@fpt.edu.vn',
    N'pham.ngoc.anh.summer26@fpt.edu.vn',
    N'hoang.duc.anh.summer26@fpt.edu.vn',
    N'vu.minh.chau.summer26@fpt.edu.vn',
    N'dang.thanh.tung.summer26@fpt.edu.vn',
    N'bui.thi.lan.summer26@fpt.edu.vn',
    N'ngo.van.khoa.summer26@fpt.edu.vn',
    N'do.hai.yen.summer26@fpt.edu.vn',
    N'ly.quoc.bao.summer26@fpt.edu.vn',
    N'mai.phuong.thao.summer26@fpt.edu.vn',
    N'trinh.nhat.nam.summer26@fpt.edu.vn',
    N'phan.gia.bao.summer26@fpt.edu.vn',
    N'huynh.khanh.vy.summer26@fpt.edu.vn',
    N'vo.thanh.phong.summer26@fpt.edu.vn',
    N'dinh.ngoc.mai.summer26@fpt.edu.vn',
    N'cao.minh.tuan.summer26@fpt.edu.vn',
    N'luong.thi.huong.summer26@fpt.edu.vn',
    N'ta.duc.long.summer26@fpt.edu.vn',
    N'ho.quang.vinh.summer26@fpt.edu.vn',
    N'chu.thi.my.summer26@fpt.edu.vn',
    N'doan.anh.khoa.summer26@fpt.edu.vn',
    N'lam.thanh.truc.summer26@fpt.edu.vn',
    N'tong.minh.duc.summer26@fpt.edu.vn',
    N'nghiem.ha.my.summer26@fpt.edu.vn',
    N'quach.nhat.hao.summer26@fpt.edu.vn',
    N'nguyen.hoang.minh.closing26@fpt.edu.vn',
    N'tran.thu.ha.closing26@fpt.edu.vn',
    N'le.quang.huy.closing26@fpt.edu.vn',
    N'pham.ngoc.anh.closing26@fpt.edu.vn',
    N'hoang.duc.anh.closing26@fpt.edu.vn',
    N'vu.minh.chau.closing26@fpt.edu.vn',
    N'dang.thanh.tung.closing26@fpt.edu.vn',
    N'bui.thi.lan.closing26@fpt.edu.vn',
    N'ngo.van.khoa.closing26@fpt.edu.vn',
    N'do.hai.yen.closing26@fpt.edu.vn',
    N'ly.quoc.bao.closing26@fpt.edu.vn',
    N'mai.phuong.thao.closing26@fpt.edu.vn',
    N'trinh.nhat.nam.closing26@fpt.edu.vn',
    N'phan.gia.bao.closing26@fpt.edu.vn',
    N'huynh.khanh.vy.closing26@fpt.edu.vn',
    N'vo.thanh.phong.closing26@fpt.edu.vn',
    N'dinh.ngoc.mai.closing26@fpt.edu.vn',
    N'cao.minh.tuan.closing26@fpt.edu.vn',
    N'luong.thi.huong.closing26@fpt.edu.vn',
    N'ta.duc.long.closing26@fpt.edu.vn',
    N'ho.quang.vinh.closing26@fpt.edu.vn',
    N'chu.thi.my.closing26@fpt.edu.vn',
    N'doan.anh.khoa.closing26@fpt.edu.vn',
    N'lam.thanh.truc.closing26@fpt.edu.vn',
    N'tong.minh.duc.closing26@fpt.edu.vn',
    N'nghiem.ha.my.closing26@fpt.edu.vn',
    N'quach.nhat.hao.closing26@fpt.edu.vn',
    N'nguyen.hoang.minh.preview26@fpt.edu.vn',
    N'tran.thu.ha.preview26@fpt.edu.vn',
    N'le.quang.huy.preview26@fpt.edu.vn',
    N'pham.ngoc.anh.preview26@fpt.edu.vn',
    N'hoang.duc.anh.preview26@fpt.edu.vn',
    N'vu.minh.chau.preview26@fpt.edu.vn',
    N'dang.thanh.tung.preview26@fpt.edu.vn',
    N'bui.thi.lan.preview26@fpt.edu.vn',
    N'ngo.van.khoa.preview26@fpt.edu.vn',
    N'do.hai.yen.preview26@fpt.edu.vn',
    N'ly.quoc.bao.preview26@fpt.edu.vn',
    N'mai.phuong.thao.preview26@fpt.edu.vn',
    N'trinh.nhat.nam.preview26@fpt.edu.vn',
    N'phan.gia.bao.preview26@fpt.edu.vn',
    N'huynh.khanh.vy.preview26@fpt.edu.vn',
    N'vo.thanh.phong.preview26@fpt.edu.vn',
    N'dinh.ngoc.mai.preview26@fpt.edu.vn',
    N'cao.minh.tuan.preview26@fpt.edu.vn',
    N'luong.thi.huong.preview26@fpt.edu.vn',
    N'ta.duc.long.preview26@fpt.edu.vn',
    N'ho.quang.vinh.preview26@fpt.edu.vn',
    N'chu.thi.my.preview26@fpt.edu.vn',
    N'doan.anh.khoa.preview26@fpt.edu.vn',
    N'lam.thanh.truc.preview26@fpt.edu.vn',
    N'tong.minh.duc.preview26@fpt.edu.vn',
    N'nghiem.ha.my.preview26@fpt.edu.vn',
    N'quach.nhat.hao.preview26@fpt.edu.vn'
) AND id NOT IN (
    '00000000-EEEE-4EEE-8EEE-000000000001',
    '00000000-EEEE-4EEE-8EEE-000000000002',
    '00000000-EEEE-4EEE-8EEE-000000000003',
    '00000000-EEEE-4EEE-8EEE-000000000005',
    '00000000-EEEE-4EEE-8EEE-000000000004',
    '00000000-EEEE-4EEE-8EEE-000000000006',
    '00000000-EEEE-4EEE-8EEE-000000000007',
    '01010000-EEEE-4EEE-8EEE-000000000001',
    '01010000-EEEE-4EEE-8EEE-000000000002',
    '01010000-EEEE-4EEE-8EEE-000000000003',
    '01010000-EEEE-4EEE-8EEE-000000000004',
    '01010000-EEEE-4EEE-8EEE-000000000005',
    '01010000-EEEE-4EEE-8EEE-000000000006',
    '01010000-EEEE-4EEE-8EEE-000000000007',
    '01010000-EEEE-4EEE-8EEE-000000000008',
    '01010000-EEEE-4EEE-8EEE-000000000009',
    '01010000-EEEE-4EEE-8EEE-00000000000A',
    '01010000-EEEE-4EEE-8EEE-00000000000B',
    '01010000-EEEE-4EEE-8EEE-00000000000C',
    '01010000-EEEE-4EEE-8EEE-00000000000D',
    '01010000-EEEE-4EEE-8EEE-00000000000E',
    '01010000-EEEE-4EEE-8EEE-00000000000F',
    '01010000-EEEE-4EEE-8EEE-000000000010',
    '01010000-EEEE-4EEE-8EEE-000000000011',
    '01010000-EEEE-4EEE-8EEE-000000000012',
    '01010000-EEEE-4EEE-8EEE-000000000013',
    '01010000-EEEE-4EEE-8EEE-000000000014',
    '01010000-EEEE-4EEE-8EEE-000000000015',
    '01010000-EEEE-4EEE-8EEE-000000000016',
    '01010000-EEEE-4EEE-8EEE-000000000017',
    '01010000-EEEE-4EEE-8EEE-000000000018',
    '01010000-EEEE-4EEE-8EEE-000000000019',
    '01010000-EEEE-4EEE-8EEE-00000000001A',
    '01010000-EEEE-4EEE-8EEE-00000000001B',
    '04010000-EEEE-4EEE-8EEE-000000000001',
    '04010000-EEEE-4EEE-8EEE-000000000002',
    '04010000-EEEE-4EEE-8EEE-000000000003',
    '04010000-EEEE-4EEE-8EEE-000000000004',
    '04010000-EEEE-4EEE-8EEE-000000000005',
    '04010000-EEEE-4EEE-8EEE-000000000006',
    '04010000-EEEE-4EEE-8EEE-000000000007',
    '04010000-EEEE-4EEE-8EEE-000000000008',
    '04010000-EEEE-4EEE-8EEE-000000000009',
    '04010000-EEEE-4EEE-8EEE-00000000000A',
    '04010000-EEEE-4EEE-8EEE-00000000000B',
    '04010000-EEEE-4EEE-8EEE-00000000000C',
    '04010000-EEEE-4EEE-8EEE-00000000000D',
    '04010000-EEEE-4EEE-8EEE-00000000000E',
    '04010000-EEEE-4EEE-8EEE-00000000000F',
    '04010000-EEEE-4EEE-8EEE-000000000010',
    '04010000-EEEE-4EEE-8EEE-000000000011',
    '04010000-EEEE-4EEE-8EEE-000000000012',
    '04010000-EEEE-4EEE-8EEE-000000000013',
    '04010000-EEEE-4EEE-8EEE-000000000014',
    '04010000-EEEE-4EEE-8EEE-000000000015',
    '04010000-EEEE-4EEE-8EEE-000000000016',
    '04010000-EEEE-4EEE-8EEE-000000000017',
    '04010000-EEEE-4EEE-8EEE-000000000018',
    '04010000-EEEE-4EEE-8EEE-000000000019',
    '04010000-EEEE-4EEE-8EEE-00000000001A',
    '04010000-EEEE-4EEE-8EEE-00000000001B',
    '05010000-EEEE-4EEE-8EEE-000000000001',
    '05010000-EEEE-4EEE-8EEE-000000000002',
    '05010000-EEEE-4EEE-8EEE-000000000003',
    '05010000-EEEE-4EEE-8EEE-000000000004',
    '05010000-EEEE-4EEE-8EEE-000000000005',
    '05010000-EEEE-4EEE-8EEE-000000000006',
    '05010000-EEEE-4EEE-8EEE-000000000007',
    '05010000-EEEE-4EEE-8EEE-000000000008',
    '05010000-EEEE-4EEE-8EEE-000000000009',
    '05010000-EEEE-4EEE-8EEE-00000000000A',
    '05010000-EEEE-4EEE-8EEE-00000000000B',
    '05010000-EEEE-4EEE-8EEE-00000000000C',
    '05010000-EEEE-4EEE-8EEE-00000000000D',
    '05010000-EEEE-4EEE-8EEE-00000000000E',
    '05010000-EEEE-4EEE-8EEE-00000000000F',
    '05010000-EEEE-4EEE-8EEE-000000000010',
    '05010000-EEEE-4EEE-8EEE-000000000011',
    '05010000-EEEE-4EEE-8EEE-000000000012',
    '05010000-EEEE-4EEE-8EEE-000000000013',
    '05010000-EEEE-4EEE-8EEE-000000000014',
    '05010000-EEEE-4EEE-8EEE-000000000015',
    '05010000-EEEE-4EEE-8EEE-000000000016',
    '05010000-EEEE-4EEE-8EEE-000000000017',
    '05010000-EEEE-4EEE-8EEE-000000000018',
    '05010000-EEEE-4EEE-8EEE-000000000019',
    '05010000-EEEE-4EEE-8EEE-00000000001A',
    '05010000-EEEE-4EEE-8EEE-00000000001B',
    '06010000-EEEE-4EEE-8EEE-000000000001',
    '06010000-EEEE-4EEE-8EEE-000000000002',
    '06010000-EEEE-4EEE-8EEE-000000000003',
    '06010000-EEEE-4EEE-8EEE-000000000004',
    '06010000-EEEE-4EEE-8EEE-000000000005',
    '06010000-EEEE-4EEE-8EEE-000000000006',
    '06010000-EEEE-4EEE-8EEE-000000000007',
    '06010000-EEEE-4EEE-8EEE-000000000008',
    '06010000-EEEE-4EEE-8EEE-000000000009',
    '06010000-EEEE-4EEE-8EEE-00000000000A',
    '06010000-EEEE-4EEE-8EEE-00000000000B',
    '06010000-EEEE-4EEE-8EEE-00000000000C',
    '06010000-EEEE-4EEE-8EEE-00000000000D',
    '06010000-EEEE-4EEE-8EEE-00000000000E',
    '06010000-EEEE-4EEE-8EEE-00000000000F',
    '06010000-EEEE-4EEE-8EEE-000000000010',
    '06010000-EEEE-4EEE-8EEE-000000000011',
    '06010000-EEEE-4EEE-8EEE-000000000012',
    '06010000-EEEE-4EEE-8EEE-000000000013',
    '06010000-EEEE-4EEE-8EEE-000000000014',
    '06010000-EEEE-4EEE-8EEE-000000000015',
    '06010000-EEEE-4EEE-8EEE-000000000016',
    '06010000-EEEE-4EEE-8EEE-000000000017',
    '06010000-EEEE-4EEE-8EEE-000000000018',
    '06010000-EEEE-4EEE-8EEE-000000000019',
    '06010000-EEEE-4EEE-8EEE-00000000001A',
    '06010000-EEEE-4EEE-8EEE-00000000001B'
));
DELETE FROM users WHERE email IN (
    N'tran.thanh.ha@fpt.edu.vn',
    N'nguyen.van.duc@fpt.edu.vn',
    N'le.thi.mai.anh@fpt.edu.vn',
    N'vo.thi.huong@fpt.edu.vn',
    N'pham.quoc.bao@fpt.edu.vn',
    N'tran.minh.khang@fpt.edu.vn',
    N'nguyen.thi.lan@fpt.edu.vn',
    N'nguyen.hoang.minh@fpt.edu.vn',
    N'tran.thu.ha@fpt.edu.vn',
    N'le.quang.huy@fpt.edu.vn',
    N'pham.ngoc.anh@fpt.edu.vn',
    N'hoang.duc.anh@fpt.edu.vn',
    N'vu.minh.chau@fpt.edu.vn',
    N'dang.thanh.tung@fpt.edu.vn',
    N'bui.thi.lan@fpt.edu.vn',
    N'ngo.van.khoa@fpt.edu.vn',
    N'do.hai.yen@fpt.edu.vn',
    N'ly.quoc.bao@fpt.edu.vn',
    N'mai.phuong.thao@fpt.edu.vn',
    N'trinh.nhat.nam@fpt.edu.vn',
    N'phan.gia.bao@fpt.edu.vn',
    N'huynh.khanh.vy@fpt.edu.vn',
    N'vo.thanh.phong@fpt.edu.vn',
    N'dinh.ngoc.mai@fpt.edu.vn',
    N'cao.minh.tuan@fpt.edu.vn',
    N'luong.thi.huong@fpt.edu.vn',
    N'ta.duc.long@fpt.edu.vn',
    N'ho.quang.vinh@fpt.edu.vn',
    N'chu.thi.my@fpt.edu.vn',
    N'doan.anh.khoa@fpt.edu.vn',
    N'lam.thanh.truc@fpt.edu.vn',
    N'tong.minh.duc@fpt.edu.vn',
    N'nghiem.ha.my@fpt.edu.vn',
    N'quach.nhat.hao@fpt.edu.vn',
    N'nguyen.hoang.minh.summer26@fpt.edu.vn',
    N'tran.thu.ha.summer26@fpt.edu.vn',
    N'le.quang.huy.summer26@fpt.edu.vn',
    N'pham.ngoc.anh.summer26@fpt.edu.vn',
    N'hoang.duc.anh.summer26@fpt.edu.vn',
    N'vu.minh.chau.summer26@fpt.edu.vn',
    N'dang.thanh.tung.summer26@fpt.edu.vn',
    N'bui.thi.lan.summer26@fpt.edu.vn',
    N'ngo.van.khoa.summer26@fpt.edu.vn',
    N'do.hai.yen.summer26@fpt.edu.vn',
    N'ly.quoc.bao.summer26@fpt.edu.vn',
    N'mai.phuong.thao.summer26@fpt.edu.vn',
    N'trinh.nhat.nam.summer26@fpt.edu.vn',
    N'phan.gia.bao.summer26@fpt.edu.vn',
    N'huynh.khanh.vy.summer26@fpt.edu.vn',
    N'vo.thanh.phong.summer26@fpt.edu.vn',
    N'dinh.ngoc.mai.summer26@fpt.edu.vn',
    N'cao.minh.tuan.summer26@fpt.edu.vn',
    N'luong.thi.huong.summer26@fpt.edu.vn',
    N'ta.duc.long.summer26@fpt.edu.vn',
    N'ho.quang.vinh.summer26@fpt.edu.vn',
    N'chu.thi.my.summer26@fpt.edu.vn',
    N'doan.anh.khoa.summer26@fpt.edu.vn',
    N'lam.thanh.truc.summer26@fpt.edu.vn',
    N'tong.minh.duc.summer26@fpt.edu.vn',
    N'nghiem.ha.my.summer26@fpt.edu.vn',
    N'quach.nhat.hao.summer26@fpt.edu.vn',
    N'nguyen.hoang.minh.closing26@fpt.edu.vn',
    N'tran.thu.ha.closing26@fpt.edu.vn',
    N'le.quang.huy.closing26@fpt.edu.vn',
    N'pham.ngoc.anh.closing26@fpt.edu.vn',
    N'hoang.duc.anh.closing26@fpt.edu.vn',
    N'vu.minh.chau.closing26@fpt.edu.vn',
    N'dang.thanh.tung.closing26@fpt.edu.vn',
    N'bui.thi.lan.closing26@fpt.edu.vn',
    N'ngo.van.khoa.closing26@fpt.edu.vn',
    N'do.hai.yen.closing26@fpt.edu.vn',
    N'ly.quoc.bao.closing26@fpt.edu.vn',
    N'mai.phuong.thao.closing26@fpt.edu.vn',
    N'trinh.nhat.nam.closing26@fpt.edu.vn',
    N'phan.gia.bao.closing26@fpt.edu.vn',
    N'huynh.khanh.vy.closing26@fpt.edu.vn',
    N'vo.thanh.phong.closing26@fpt.edu.vn',
    N'dinh.ngoc.mai.closing26@fpt.edu.vn',
    N'cao.minh.tuan.closing26@fpt.edu.vn',
    N'luong.thi.huong.closing26@fpt.edu.vn',
    N'ta.duc.long.closing26@fpt.edu.vn',
    N'ho.quang.vinh.closing26@fpt.edu.vn',
    N'chu.thi.my.closing26@fpt.edu.vn',
    N'doan.anh.khoa.closing26@fpt.edu.vn',
    N'lam.thanh.truc.closing26@fpt.edu.vn',
    N'tong.minh.duc.closing26@fpt.edu.vn',
    N'nghiem.ha.my.closing26@fpt.edu.vn',
    N'quach.nhat.hao.closing26@fpt.edu.vn',
    N'nguyen.hoang.minh.preview26@fpt.edu.vn',
    N'tran.thu.ha.preview26@fpt.edu.vn',
    N'le.quang.huy.preview26@fpt.edu.vn',
    N'pham.ngoc.anh.preview26@fpt.edu.vn',
    N'hoang.duc.anh.preview26@fpt.edu.vn',
    N'vu.minh.chau.preview26@fpt.edu.vn',
    N'dang.thanh.tung.preview26@fpt.edu.vn',
    N'bui.thi.lan.preview26@fpt.edu.vn',
    N'ngo.van.khoa.preview26@fpt.edu.vn',
    N'do.hai.yen.preview26@fpt.edu.vn',
    N'ly.quoc.bao.preview26@fpt.edu.vn',
    N'mai.phuong.thao.preview26@fpt.edu.vn',
    N'trinh.nhat.nam.preview26@fpt.edu.vn',
    N'phan.gia.bao.preview26@fpt.edu.vn',
    N'huynh.khanh.vy.preview26@fpt.edu.vn',
    N'vo.thanh.phong.preview26@fpt.edu.vn',
    N'dinh.ngoc.mai.preview26@fpt.edu.vn',
    N'cao.minh.tuan.preview26@fpt.edu.vn',
    N'luong.thi.huong.preview26@fpt.edu.vn',
    N'ta.duc.long.preview26@fpt.edu.vn',
    N'ho.quang.vinh.preview26@fpt.edu.vn',
    N'chu.thi.my.preview26@fpt.edu.vn',
    N'doan.anh.khoa.preview26@fpt.edu.vn',
    N'lam.thanh.truc.preview26@fpt.edu.vn',
    N'tong.minh.duc.preview26@fpt.edu.vn',
    N'nghiem.ha.my.preview26@fpt.edu.vn',
    N'quach.nhat.hao.preview26@fpt.edu.vn'
) AND id NOT IN (
    '00000000-EEEE-4EEE-8EEE-000000000001',
    '00000000-EEEE-4EEE-8EEE-000000000002',
    '00000000-EEEE-4EEE-8EEE-000000000003',
    '00000000-EEEE-4EEE-8EEE-000000000005',
    '00000000-EEEE-4EEE-8EEE-000000000004',
    '00000000-EEEE-4EEE-8EEE-000000000006',
    '00000000-EEEE-4EEE-8EEE-000000000007',
    '01010000-EEEE-4EEE-8EEE-000000000001',
    '01010000-EEEE-4EEE-8EEE-000000000002',
    '01010000-EEEE-4EEE-8EEE-000000000003',
    '01010000-EEEE-4EEE-8EEE-000000000004',
    '01010000-EEEE-4EEE-8EEE-000000000005',
    '01010000-EEEE-4EEE-8EEE-000000000006',
    '01010000-EEEE-4EEE-8EEE-000000000007',
    '01010000-EEEE-4EEE-8EEE-000000000008',
    '01010000-EEEE-4EEE-8EEE-000000000009',
    '01010000-EEEE-4EEE-8EEE-00000000000A',
    '01010000-EEEE-4EEE-8EEE-00000000000B',
    '01010000-EEEE-4EEE-8EEE-00000000000C',
    '01010000-EEEE-4EEE-8EEE-00000000000D',
    '01010000-EEEE-4EEE-8EEE-00000000000E',
    '01010000-EEEE-4EEE-8EEE-00000000000F',
    '01010000-EEEE-4EEE-8EEE-000000000010',
    '01010000-EEEE-4EEE-8EEE-000000000011',
    '01010000-EEEE-4EEE-8EEE-000000000012',
    '01010000-EEEE-4EEE-8EEE-000000000013',
    '01010000-EEEE-4EEE-8EEE-000000000014',
    '01010000-EEEE-4EEE-8EEE-000000000015',
    '01010000-EEEE-4EEE-8EEE-000000000016',
    '01010000-EEEE-4EEE-8EEE-000000000017',
    '01010000-EEEE-4EEE-8EEE-000000000018',
    '01010000-EEEE-4EEE-8EEE-000000000019',
    '01010000-EEEE-4EEE-8EEE-00000000001A',
    '01010000-EEEE-4EEE-8EEE-00000000001B',
    '04010000-EEEE-4EEE-8EEE-000000000001',
    '04010000-EEEE-4EEE-8EEE-000000000002',
    '04010000-EEEE-4EEE-8EEE-000000000003',
    '04010000-EEEE-4EEE-8EEE-000000000004',
    '04010000-EEEE-4EEE-8EEE-000000000005',
    '04010000-EEEE-4EEE-8EEE-000000000006',
    '04010000-EEEE-4EEE-8EEE-000000000007',
    '04010000-EEEE-4EEE-8EEE-000000000008',
    '04010000-EEEE-4EEE-8EEE-000000000009',
    '04010000-EEEE-4EEE-8EEE-00000000000A',
    '04010000-EEEE-4EEE-8EEE-00000000000B',
    '04010000-EEEE-4EEE-8EEE-00000000000C',
    '04010000-EEEE-4EEE-8EEE-00000000000D',
    '04010000-EEEE-4EEE-8EEE-00000000000E',
    '04010000-EEEE-4EEE-8EEE-00000000000F',
    '04010000-EEEE-4EEE-8EEE-000000000010',
    '04010000-EEEE-4EEE-8EEE-000000000011',
    '04010000-EEEE-4EEE-8EEE-000000000012',
    '04010000-EEEE-4EEE-8EEE-000000000013',
    '04010000-EEEE-4EEE-8EEE-000000000014',
    '04010000-EEEE-4EEE-8EEE-000000000015',
    '04010000-EEEE-4EEE-8EEE-000000000016',
    '04010000-EEEE-4EEE-8EEE-000000000017',
    '04010000-EEEE-4EEE-8EEE-000000000018',
    '04010000-EEEE-4EEE-8EEE-000000000019',
    '04010000-EEEE-4EEE-8EEE-00000000001A',
    '04010000-EEEE-4EEE-8EEE-00000000001B',
    '05010000-EEEE-4EEE-8EEE-000000000001',
    '05010000-EEEE-4EEE-8EEE-000000000002',
    '05010000-EEEE-4EEE-8EEE-000000000003',
    '05010000-EEEE-4EEE-8EEE-000000000004',
    '05010000-EEEE-4EEE-8EEE-000000000005',
    '05010000-EEEE-4EEE-8EEE-000000000006',
    '05010000-EEEE-4EEE-8EEE-000000000007',
    '05010000-EEEE-4EEE-8EEE-000000000008',
    '05010000-EEEE-4EEE-8EEE-000000000009',
    '05010000-EEEE-4EEE-8EEE-00000000000A',
    '05010000-EEEE-4EEE-8EEE-00000000000B',
    '05010000-EEEE-4EEE-8EEE-00000000000C',
    '05010000-EEEE-4EEE-8EEE-00000000000D',
    '05010000-EEEE-4EEE-8EEE-00000000000E',
    '05010000-EEEE-4EEE-8EEE-00000000000F',
    '05010000-EEEE-4EEE-8EEE-000000000010',
    '05010000-EEEE-4EEE-8EEE-000000000011',
    '05010000-EEEE-4EEE-8EEE-000000000012',
    '05010000-EEEE-4EEE-8EEE-000000000013',
    '05010000-EEEE-4EEE-8EEE-000000000014',
    '05010000-EEEE-4EEE-8EEE-000000000015',
    '05010000-EEEE-4EEE-8EEE-000000000016',
    '05010000-EEEE-4EEE-8EEE-000000000017',
    '05010000-EEEE-4EEE-8EEE-000000000018',
    '05010000-EEEE-4EEE-8EEE-000000000019',
    '05010000-EEEE-4EEE-8EEE-00000000001A',
    '05010000-EEEE-4EEE-8EEE-00000000001B',
    '06010000-EEEE-4EEE-8EEE-000000000001',
    '06010000-EEEE-4EEE-8EEE-000000000002',
    '06010000-EEEE-4EEE-8EEE-000000000003',
    '06010000-EEEE-4EEE-8EEE-000000000004',
    '06010000-EEEE-4EEE-8EEE-000000000005',
    '06010000-EEEE-4EEE-8EEE-000000000006',
    '06010000-EEEE-4EEE-8EEE-000000000007',
    '06010000-EEEE-4EEE-8EEE-000000000008',
    '06010000-EEEE-4EEE-8EEE-000000000009',
    '06010000-EEEE-4EEE-8EEE-00000000000A',
    '06010000-EEEE-4EEE-8EEE-00000000000B',
    '06010000-EEEE-4EEE-8EEE-00000000000C',
    '06010000-EEEE-4EEE-8EEE-00000000000D',
    '06010000-EEEE-4EEE-8EEE-00000000000E',
    '06010000-EEEE-4EEE-8EEE-00000000000F',
    '06010000-EEEE-4EEE-8EEE-000000000010',
    '06010000-EEEE-4EEE-8EEE-000000000011',
    '06010000-EEEE-4EEE-8EEE-000000000012',
    '06010000-EEEE-4EEE-8EEE-000000000013',
    '06010000-EEEE-4EEE-8EEE-000000000014',
    '06010000-EEEE-4EEE-8EEE-000000000015',
    '06010000-EEEE-4EEE-8EEE-000000000016',
    '06010000-EEEE-4EEE-8EEE-000000000017',
    '06010000-EEEE-4EEE-8EEE-000000000018',
    '06010000-EEEE-4EEE-8EEE-000000000019',
    '06010000-EEEE-4EEE-8EEE-00000000001A',
    '06010000-EEEE-4EEE-8EEE-00000000001B'
);

-- Upsert staff + student pools by fixed id
IF EXISTS (SELECT 1 FROM users WHERE id = '00000000-EEEE-4EEE-8EEE-000000000001')
BEGIN
    UPDATE users SET email = N'tran.thanh.ha@fpt.edu.vn', password_hash = @demoHash, full_name = N'Trần Thanh Hà', user_type = 'EVENT_COORDINATOR',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = NULL, university_name = NULL,
        semester = NULL, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '00000000-EEEE-4EEE-8EEE-000000000001';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('00000000-EEEE-4EEE-8EEE-000000000001', N'tran.thanh.ha@fpt.edu.vn', @demoHash, N'Trần Thanh Hà', NULL, NULL,
        NULL, NULL,
        'EVENT_COORDINATOR', 'ACTIVE', 0, NULL, NULL, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '00000000-EEEE-4EEE-8EEE-000000000002')
BEGIN
    UPDATE users SET email = N'nguyen.van.duc@fpt.edu.vn', password_hash = @demoHash, full_name = N'Nguyễn Văn Đức', user_type = 'LECTURER',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = NULL, university_name = NULL,
        semester = NULL, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '00000000-EEEE-4EEE-8EEE-000000000002';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('00000000-EEEE-4EEE-8EEE-000000000002', N'nguyen.van.duc@fpt.edu.vn', @demoHash, N'Nguyễn Văn Đức', NULL, NULL,
        NULL, NULL,
        'LECTURER', 'ACTIVE', 0, NULL, NULL, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '00000000-EEEE-4EEE-8EEE-000000000003')
BEGIN
    UPDATE users SET email = N'le.thi.mai.anh@fpt.edu.vn', password_hash = @demoHash, full_name = N'Lê Thị Mai Anh', user_type = 'LECTURER',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = NULL, university_name = NULL,
        semester = NULL, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '00000000-EEEE-4EEE-8EEE-000000000003';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('00000000-EEEE-4EEE-8EEE-000000000003', N'le.thi.mai.anh@fpt.edu.vn', @demoHash, N'Lê Thị Mai Anh', NULL, NULL,
        NULL, NULL,
        'LECTURER', 'ACTIVE', 0, NULL, NULL, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '00000000-EEEE-4EEE-8EEE-000000000005')
BEGIN
    UPDATE users SET email = N'vo.thi.huong@fpt.edu.vn', password_hash = @demoHash, full_name = N'Võ Thị Hương', user_type = 'LECTURER',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = NULL, university_name = NULL,
        semester = NULL, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '00000000-EEEE-4EEE-8EEE-000000000005';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('00000000-EEEE-4EEE-8EEE-000000000005', N'vo.thi.huong@fpt.edu.vn', @demoHash, N'Võ Thị Hương', NULL, NULL,
        NULL, NULL,
        'LECTURER', 'ACTIVE', 0, NULL, NULL, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '00000000-EEEE-4EEE-8EEE-000000000004')
BEGIN
    UPDATE users SET email = N'pham.quoc.bao@fpt.edu.vn', password_hash = @demoHash, full_name = N'Phạm Quốc Bảo', user_type = 'LECTURER',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = NULL, university_name = NULL,
        semester = NULL, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '00000000-EEEE-4EEE-8EEE-000000000004';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('00000000-EEEE-4EEE-8EEE-000000000004', N'pham.quoc.bao@fpt.edu.vn', @demoHash, N'Phạm Quốc Bảo', NULL, NULL,
        NULL, NULL,
        'LECTURER', 'ACTIVE', 0, NULL, NULL, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '00000000-EEEE-4EEE-8EEE-000000000006')
BEGIN
    UPDATE users SET email = N'tran.minh.khang@fpt.edu.vn', password_hash = @demoHash, full_name = N'Trần Minh Khang', user_type = 'LECTURER',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = NULL, university_name = NULL,
        semester = NULL, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '00000000-EEEE-4EEE-8EEE-000000000006';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('00000000-EEEE-4EEE-8EEE-000000000006', N'tran.minh.khang@fpt.edu.vn', @demoHash, N'Trần Minh Khang', NULL, NULL,
        NULL, NULL,
        'LECTURER', 'ACTIVE', 0, NULL, NULL, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '00000000-EEEE-4EEE-8EEE-000000000007')
BEGIN
    UPDATE users SET email = N'nguyen.thi.lan@fpt.edu.vn', password_hash = @demoHash, full_name = N'Nguyễn Thị Lan', user_type = 'LECTURER',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = NULL, university_name = NULL,
        semester = NULL, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '00000000-EEEE-4EEE-8EEE-000000000007';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('00000000-EEEE-4EEE-8EEE-000000000007', N'nguyen.thi.lan@fpt.edu.vn', @demoHash, N'Nguyễn Thị Lan', NULL, NULL,
        NULL, NULL,
        'LECTURER', 'ACTIVE', 0, NULL, NULL, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-000000000001')
BEGIN
    UPDATE users SET email = N'nguyen.hoang.minh@fpt.edu.vn', password_hash = @demoHash, full_name = N'Nguyễn Hoàng Minh', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184201', university_name = N'FPT University',
        semester = 4, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-000000000001';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-000000000001', N'nguyen.hoang.minh@fpt.edu.vn', @demoHash, N'Nguyễn Hoàng Minh', NULL, NULL,
        N'SE184201', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 4, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-000000000002')
BEGIN
    UPDATE users SET email = N'tran.thu.ha@fpt.edu.vn', password_hash = @demoHash, full_name = N'Trần Thu Hà', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184202', university_name = N'FPT University',
        semester = 5, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-000000000002';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-000000000002', N'tran.thu.ha@fpt.edu.vn', @demoHash, N'Trần Thu Hà', NULL, NULL,
        N'SE184202', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-000000000003')
BEGIN
    UPDATE users SET email = N'le.quang.huy@fpt.edu.vn', password_hash = @demoHash, full_name = N'Lê Quang Huy', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184203', university_name = N'FPT University',
        semester = 6, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-000000000003';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-000000000003', N'le.quang.huy@fpt.edu.vn', @demoHash, N'Lê Quang Huy', NULL, NULL,
        N'SE184203', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 6, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-000000000004')
BEGIN
    UPDATE users SET email = N'pham.ngoc.anh@fpt.edu.vn', password_hash = @demoHash, full_name = N'Phạm Ngọc Anh', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184204', university_name = N'FPT University',
        semester = 7, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-000000000004';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-000000000004', N'pham.ngoc.anh@fpt.edu.vn', @demoHash, N'Phạm Ngọc Anh', NULL, NULL,
        N'SE184204', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 7, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-000000000005')
BEGIN
    UPDATE users SET email = N'hoang.duc.anh@fpt.edu.vn', password_hash = @demoHash, full_name = N'Hoàng Đức Anh', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184205', university_name = N'FPT University',
        semester = 8, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-000000000005';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-000000000005', N'hoang.duc.anh@fpt.edu.vn', @demoHash, N'Hoàng Đức Anh', NULL, NULL,
        N'SE184205', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 8, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-000000000006')
BEGIN
    UPDATE users SET email = N'vu.minh.chau@fpt.edu.vn', password_hash = @demoHash, full_name = N'Vũ Minh Châu', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184206', university_name = N'FPT University',
        semester = 4, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-000000000006';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-000000000006', N'vu.minh.chau@fpt.edu.vn', @demoHash, N'Vũ Minh Châu', NULL, NULL,
        N'SE184206', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 4, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-000000000007')
BEGIN
    UPDATE users SET email = N'dang.thanh.tung@fpt.edu.vn', password_hash = @demoHash, full_name = N'Đặng Thanh Tùng', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184207', university_name = N'FPT University',
        semester = 5, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-000000000007';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-000000000007', N'dang.thanh.tung@fpt.edu.vn', @demoHash, N'Đặng Thanh Tùng', NULL, NULL,
        N'SE184207', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-000000000008')
BEGIN
    UPDATE users SET email = N'bui.thi.lan@fpt.edu.vn', password_hash = @demoHash, full_name = N'Bùi Thị Lan', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184208', university_name = N'FPT University',
        semester = 6, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-000000000008';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-000000000008', N'bui.thi.lan@fpt.edu.vn', @demoHash, N'Bùi Thị Lan', NULL, NULL,
        N'SE184208', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 6, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-000000000009')
BEGIN
    UPDATE users SET email = N'ngo.van.khoa@fpt.edu.vn', password_hash = @demoHash, full_name = N'Ngô Văn Khoa', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184209', university_name = N'FPT University',
        semester = 7, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-000000000009';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-000000000009', N'ngo.van.khoa@fpt.edu.vn', @demoHash, N'Ngô Văn Khoa', NULL, NULL,
        N'SE184209', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 7, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-00000000000A')
BEGIN
    UPDATE users SET email = N'do.hai.yen@fpt.edu.vn', password_hash = @demoHash, full_name = N'Đỗ Hải Yến', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184210', university_name = N'FPT University',
        semester = 8, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-00000000000A';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-00000000000A', N'do.hai.yen@fpt.edu.vn', @demoHash, N'Đỗ Hải Yến', NULL, NULL,
        N'SE184210', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 8, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-00000000000B')
BEGIN
    UPDATE users SET email = N'ly.quoc.bao@fpt.edu.vn', password_hash = @demoHash, full_name = N'Lý Quốc Bảo', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184211', university_name = N'FPT University',
        semester = 4, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-00000000000B';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-00000000000B', N'ly.quoc.bao@fpt.edu.vn', @demoHash, N'Lý Quốc Bảo', NULL, NULL,
        N'SE184211', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 4, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-00000000000C')
BEGIN
    UPDATE users SET email = N'mai.phuong.thao@fpt.edu.vn', password_hash = @demoHash, full_name = N'Mai Phương Thảo', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184212', university_name = N'FPT University',
        semester = 5, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-00000000000C';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-00000000000C', N'mai.phuong.thao@fpt.edu.vn', @demoHash, N'Mai Phương Thảo', NULL, NULL,
        N'SE184212', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-00000000000D')
BEGIN
    UPDATE users SET email = N'trinh.nhat.nam@fpt.edu.vn', password_hash = @demoHash, full_name = N'Trịnh Nhật Nam', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184213', university_name = N'FPT University',
        semester = 6, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-00000000000D';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-00000000000D', N'trinh.nhat.nam@fpt.edu.vn', @demoHash, N'Trịnh Nhật Nam', NULL, NULL,
        N'SE184213', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 6, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-00000000000E')
BEGIN
    UPDATE users SET email = N'phan.gia.bao@fpt.edu.vn', password_hash = @demoHash, full_name = N'Phan Gia Bảo', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184214', university_name = N'FPT University',
        semester = 7, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-00000000000E';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-00000000000E', N'phan.gia.bao@fpt.edu.vn', @demoHash, N'Phan Gia Bảo', NULL, NULL,
        N'SE184214', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 7, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-00000000000F')
BEGIN
    UPDATE users SET email = N'huynh.khanh.vy@fpt.edu.vn', password_hash = @demoHash, full_name = N'Huỳnh Khánh Vy', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184215', university_name = N'FPT University',
        semester = 8, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-00000000000F';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-00000000000F', N'huynh.khanh.vy@fpt.edu.vn', @demoHash, N'Huỳnh Khánh Vy', NULL, NULL,
        N'SE184215', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 8, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-000000000010')
BEGIN
    UPDATE users SET email = N'vo.thanh.phong@fpt.edu.vn', password_hash = @demoHash, full_name = N'Võ Thanh Phong', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184216', university_name = N'FPT University',
        semester = 4, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-000000000010';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-000000000010', N'vo.thanh.phong@fpt.edu.vn', @demoHash, N'Võ Thanh Phong', NULL, NULL,
        N'SE184216', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 4, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-000000000011')
BEGIN
    UPDATE users SET email = N'dinh.ngoc.mai@fpt.edu.vn', password_hash = @demoHash, full_name = N'Đinh Ngọc Mai', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184217', university_name = N'FPT University',
        semester = 5, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-000000000011';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-000000000011', N'dinh.ngoc.mai@fpt.edu.vn', @demoHash, N'Đinh Ngọc Mai', NULL, NULL,
        N'SE184217', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-000000000012')
BEGIN
    UPDATE users SET email = N'cao.minh.tuan@fpt.edu.vn', password_hash = @demoHash, full_name = N'Cao Minh Tuấn', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184218', university_name = N'FPT University',
        semester = 6, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-000000000012';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-000000000012', N'cao.minh.tuan@fpt.edu.vn', @demoHash, N'Cao Minh Tuấn', NULL, NULL,
        N'SE184218', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 6, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-000000000013')
BEGIN
    UPDATE users SET email = N'luong.thi.huong@fpt.edu.vn', password_hash = @demoHash, full_name = N'Lương Thị Hương', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184219', university_name = N'FPT University',
        semester = 7, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-000000000013';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-000000000013', N'luong.thi.huong@fpt.edu.vn', @demoHash, N'Lương Thị Hương', NULL, NULL,
        N'SE184219', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 7, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-000000000014')
BEGIN
    UPDATE users SET email = N'ta.duc.long@fpt.edu.vn', password_hash = @demoHash, full_name = N'Tạ Đức Long', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184220', university_name = N'FPT University',
        semester = 8, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-000000000014';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-000000000014', N'ta.duc.long@fpt.edu.vn', @demoHash, N'Tạ Đức Long', NULL, NULL,
        N'SE184220', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 8, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-000000000015')
BEGIN
    UPDATE users SET email = N'ho.quang.vinh@fpt.edu.vn', password_hash = @demoHash, full_name = N'Hồ Quang Vinh', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184221', university_name = N'FPT University',
        semester = 4, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-000000000015';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-000000000015', N'ho.quang.vinh@fpt.edu.vn', @demoHash, N'Hồ Quang Vinh', NULL, NULL,
        N'SE184221', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 4, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-000000000016')
BEGIN
    UPDATE users SET email = N'chu.thi.my@fpt.edu.vn', password_hash = @demoHash, full_name = N'Chu Thị Mỹ', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184222', university_name = N'FPT University',
        semester = 5, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-000000000016';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-000000000016', N'chu.thi.my@fpt.edu.vn', @demoHash, N'Chu Thị Mỹ', NULL, NULL,
        N'SE184222', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-000000000017')
BEGIN
    UPDATE users SET email = N'doan.anh.khoa@fpt.edu.vn', password_hash = @demoHash, full_name = N'Đoàn Anh Khoa', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184223', university_name = N'FPT University',
        semester = 6, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-000000000017';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-000000000017', N'doan.anh.khoa@fpt.edu.vn', @demoHash, N'Đoàn Anh Khoa', NULL, NULL,
        N'SE184223', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 6, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-000000000018')
BEGIN
    UPDATE users SET email = N'lam.thanh.truc@fpt.edu.vn', password_hash = @demoHash, full_name = N'Lâm Thanh Trúc', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184224', university_name = N'FPT University',
        semester = 7, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-000000000018';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-000000000018', N'lam.thanh.truc@fpt.edu.vn', @demoHash, N'Lâm Thanh Trúc', NULL, NULL,
        N'SE184224', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 7, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-000000000019')
BEGIN
    UPDATE users SET email = N'tong.minh.duc@fpt.edu.vn', password_hash = @demoHash, full_name = N'Tống Minh Đức', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184225', university_name = N'FPT University',
        semester = 8, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-000000000019';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-000000000019', N'tong.minh.duc@fpt.edu.vn', @demoHash, N'Tống Minh Đức', NULL, NULL,
        N'SE184225', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 8, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-00000000001A')
BEGIN
    UPDATE users SET email = N'nghiem.ha.my@fpt.edu.vn', password_hash = @demoHash, full_name = N'Nghiêm Hà My', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184226', university_name = N'FPT University',
        semester = 4, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-00000000001A';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-00000000001A', N'nghiem.ha.my@fpt.edu.vn', @demoHash, N'Nghiêm Hà My', NULL, NULL,
        N'SE184226', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 4, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '01010000-EEEE-4EEE-8EEE-00000000001B')
BEGIN
    UPDATE users SET email = N'quach.nhat.hao@fpt.edu.vn', password_hash = @demoHash, full_name = N'Quách Nhật Hào', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE184227', university_name = N'FPT University',
        semester = 5, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '01010000-EEEE-4EEE-8EEE-00000000001B';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('01010000-EEEE-4EEE-8EEE-00000000001B', N'quach.nhat.hao@fpt.edu.vn', @demoHash, N'Quách Nhật Hào', NULL, NULL,
        N'SE184227', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-000000000001')
BEGIN
    UPDATE users SET email = N'nguyen.hoang.minh.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Nguyễn Hoàng Minh', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185201', university_name = N'FPT University',
        semester = 4, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-000000000001';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-000000000001', N'nguyen.hoang.minh.summer26@fpt.edu.vn', @demoHash, N'Nguyễn Hoàng Minh', NULL, NULL,
        N'SE185201', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 4, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-000000000002')
BEGIN
    UPDATE users SET email = N'tran.thu.ha.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Trần Thu Hà', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185202', university_name = N'FPT University',
        semester = 5, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-000000000002';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-000000000002', N'tran.thu.ha.summer26@fpt.edu.vn', @demoHash, N'Trần Thu Hà', NULL, NULL,
        N'SE185202', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-000000000003')
BEGIN
    UPDATE users SET email = N'le.quang.huy.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Lê Quang Huy', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185203', university_name = N'FPT University',
        semester = 6, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-000000000003';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-000000000003', N'le.quang.huy.summer26@fpt.edu.vn', @demoHash, N'Lê Quang Huy', NULL, NULL,
        N'SE185203', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 6, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-000000000004')
BEGIN
    UPDATE users SET email = N'pham.ngoc.anh.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Phạm Ngọc Anh', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185204', university_name = N'FPT University',
        semester = 7, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-000000000004';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-000000000004', N'pham.ngoc.anh.summer26@fpt.edu.vn', @demoHash, N'Phạm Ngọc Anh', NULL, NULL,
        N'SE185204', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 7, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-000000000005')
BEGIN
    UPDATE users SET email = N'hoang.duc.anh.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Hoàng Đức Anh', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185205', university_name = N'FPT University',
        semester = 8, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-000000000005';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-000000000005', N'hoang.duc.anh.summer26@fpt.edu.vn', @demoHash, N'Hoàng Đức Anh', NULL, NULL,
        N'SE185205', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 8, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-000000000006')
BEGIN
    UPDATE users SET email = N'vu.minh.chau.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Vũ Minh Châu', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185206', university_name = N'FPT University',
        semester = 4, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-000000000006';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-000000000006', N'vu.minh.chau.summer26@fpt.edu.vn', @demoHash, N'Vũ Minh Châu', NULL, NULL,
        N'SE185206', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 4, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-000000000007')
BEGIN
    UPDATE users SET email = N'dang.thanh.tung.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Đặng Thanh Tùng', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185207', university_name = N'FPT University',
        semester = 5, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-000000000007';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-000000000007', N'dang.thanh.tung.summer26@fpt.edu.vn', @demoHash, N'Đặng Thanh Tùng', NULL, NULL,
        N'SE185207', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-000000000008')
BEGIN
    UPDATE users SET email = N'bui.thi.lan.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Bùi Thị Lan', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185208', university_name = N'FPT University',
        semester = 6, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-000000000008';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-000000000008', N'bui.thi.lan.summer26@fpt.edu.vn', @demoHash, N'Bùi Thị Lan', NULL, NULL,
        N'SE185208', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 6, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-000000000009')
BEGIN
    UPDATE users SET email = N'ngo.van.khoa.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Ngô Văn Khoa', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185209', university_name = N'FPT University',
        semester = 7, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-000000000009';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-000000000009', N'ngo.van.khoa.summer26@fpt.edu.vn', @demoHash, N'Ngô Văn Khoa', NULL, NULL,
        N'SE185209', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 7, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-00000000000A')
BEGIN
    UPDATE users SET email = N'do.hai.yen.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Đỗ Hải Yến', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185210', university_name = N'FPT University',
        semester = 8, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-00000000000A';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-00000000000A', N'do.hai.yen.summer26@fpt.edu.vn', @demoHash, N'Đỗ Hải Yến', NULL, NULL,
        N'SE185210', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 8, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-00000000000B')
BEGIN
    UPDATE users SET email = N'ly.quoc.bao.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Lý Quốc Bảo', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185211', university_name = N'FPT University',
        semester = 4, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-00000000000B';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-00000000000B', N'ly.quoc.bao.summer26@fpt.edu.vn', @demoHash, N'Lý Quốc Bảo', NULL, NULL,
        N'SE185211', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 4, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-00000000000C')
BEGIN
    UPDATE users SET email = N'mai.phuong.thao.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Mai Phương Thảo', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185212', university_name = N'FPT University',
        semester = 5, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-00000000000C';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-00000000000C', N'mai.phuong.thao.summer26@fpt.edu.vn', @demoHash, N'Mai Phương Thảo', NULL, NULL,
        N'SE185212', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-00000000000D')
BEGIN
    UPDATE users SET email = N'trinh.nhat.nam.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Trịnh Nhật Nam', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185213', university_name = N'FPT University',
        semester = 6, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-00000000000D';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-00000000000D', N'trinh.nhat.nam.summer26@fpt.edu.vn', @demoHash, N'Trịnh Nhật Nam', NULL, NULL,
        N'SE185213', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 6, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-00000000000E')
BEGIN
    UPDATE users SET email = N'phan.gia.bao.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Phan Gia Bảo', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185214', university_name = N'FPT University',
        semester = 7, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-00000000000E';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-00000000000E', N'phan.gia.bao.summer26@fpt.edu.vn', @demoHash, N'Phan Gia Bảo', NULL, NULL,
        N'SE185214', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 7, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-00000000000F')
BEGIN
    UPDATE users SET email = N'huynh.khanh.vy.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Huỳnh Khánh Vy', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185215', university_name = N'FPT University',
        semester = 8, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-00000000000F';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-00000000000F', N'huynh.khanh.vy.summer26@fpt.edu.vn', @demoHash, N'Huỳnh Khánh Vy', NULL, NULL,
        N'SE185215', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 8, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-000000000010')
BEGIN
    UPDATE users SET email = N'vo.thanh.phong.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Võ Thanh Phong', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185216', university_name = N'FPT University',
        semester = 4, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-000000000010';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-000000000010', N'vo.thanh.phong.summer26@fpt.edu.vn', @demoHash, N'Võ Thanh Phong', NULL, NULL,
        N'SE185216', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 4, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-000000000011')
BEGIN
    UPDATE users SET email = N'dinh.ngoc.mai.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Đinh Ngọc Mai', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185217', university_name = N'FPT University',
        semester = 5, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-000000000011';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-000000000011', N'dinh.ngoc.mai.summer26@fpt.edu.vn', @demoHash, N'Đinh Ngọc Mai', NULL, NULL,
        N'SE185217', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-000000000012')
BEGIN
    UPDATE users SET email = N'cao.minh.tuan.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Cao Minh Tuấn', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185218', university_name = N'FPT University',
        semester = 6, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-000000000012';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-000000000012', N'cao.minh.tuan.summer26@fpt.edu.vn', @demoHash, N'Cao Minh Tuấn', NULL, NULL,
        N'SE185218', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 6, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-000000000013')
BEGIN
    UPDATE users SET email = N'luong.thi.huong.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Lương Thị Hương', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185219', university_name = N'FPT University',
        semester = 7, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-000000000013';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-000000000013', N'luong.thi.huong.summer26@fpt.edu.vn', @demoHash, N'Lương Thị Hương', NULL, NULL,
        N'SE185219', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 7, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-000000000014')
BEGIN
    UPDATE users SET email = N'ta.duc.long.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Tạ Đức Long', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185220', university_name = N'FPT University',
        semester = 8, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-000000000014';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-000000000014', N'ta.duc.long.summer26@fpt.edu.vn', @demoHash, N'Tạ Đức Long', NULL, NULL,
        N'SE185220', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 8, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-000000000015')
BEGIN
    UPDATE users SET email = N'ho.quang.vinh.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Hồ Quang Vinh', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185221', university_name = N'FPT University',
        semester = 4, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-000000000015';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-000000000015', N'ho.quang.vinh.summer26@fpt.edu.vn', @demoHash, N'Hồ Quang Vinh', NULL, NULL,
        N'SE185221', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 4, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-000000000016')
BEGIN
    UPDATE users SET email = N'chu.thi.my.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Chu Thị Mỹ', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185222', university_name = N'FPT University',
        semester = 5, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-000000000016';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-000000000016', N'chu.thi.my.summer26@fpt.edu.vn', @demoHash, N'Chu Thị Mỹ', NULL, NULL,
        N'SE185222', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-000000000017')
BEGIN
    UPDATE users SET email = N'doan.anh.khoa.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Đoàn Anh Khoa', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185223', university_name = N'FPT University',
        semester = 6, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-000000000017';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-000000000017', N'doan.anh.khoa.summer26@fpt.edu.vn', @demoHash, N'Đoàn Anh Khoa', NULL, NULL,
        N'SE185223', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 6, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-000000000018')
BEGIN
    UPDATE users SET email = N'lam.thanh.truc.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Lâm Thanh Trúc', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185224', university_name = N'FPT University',
        semester = 7, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-000000000018';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-000000000018', N'lam.thanh.truc.summer26@fpt.edu.vn', @demoHash, N'Lâm Thanh Trúc', NULL, NULL,
        N'SE185224', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 7, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-000000000019')
BEGIN
    UPDATE users SET email = N'tong.minh.duc.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Tống Minh Đức', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185225', university_name = N'FPT University',
        semester = 8, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-000000000019';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-000000000019', N'tong.minh.duc.summer26@fpt.edu.vn', @demoHash, N'Tống Minh Đức', NULL, NULL,
        N'SE185225', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 8, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-00000000001A')
BEGIN
    UPDATE users SET email = N'nghiem.ha.my.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Nghiêm Hà My', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185226', university_name = N'FPT University',
        semester = 4, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-00000000001A';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-00000000001A', N'nghiem.ha.my.summer26@fpt.edu.vn', @demoHash, N'Nghiêm Hà My', NULL, NULL,
        N'SE185226', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 4, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '04010000-EEEE-4EEE-8EEE-00000000001B')
BEGIN
    UPDATE users SET email = N'quach.nhat.hao.summer26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Quách Nhật Hào', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE185227', university_name = N'FPT University',
        semester = 5, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '04010000-EEEE-4EEE-8EEE-00000000001B';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('04010000-EEEE-4EEE-8EEE-00000000001B', N'quach.nhat.hao.summer26@fpt.edu.vn', @demoHash, N'Quách Nhật Hào', NULL, NULL,
        N'SE185227', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-000000000001')
BEGIN
    UPDATE users SET email = N'nguyen.hoang.minh.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Nguyễn Hoàng Minh', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186201', university_name = N'FPT University',
        semester = 4, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-000000000001';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-000000000001', N'nguyen.hoang.minh.closing26@fpt.edu.vn', @demoHash, N'Nguyễn Hoàng Minh', NULL, NULL,
        N'SE186201', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 4, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-000000000002')
BEGIN
    UPDATE users SET email = N'tran.thu.ha.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Trần Thu Hà', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186202', university_name = N'FPT University',
        semester = 5, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-000000000002';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-000000000002', N'tran.thu.ha.closing26@fpt.edu.vn', @demoHash, N'Trần Thu Hà', NULL, NULL,
        N'SE186202', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-000000000003')
BEGIN
    UPDATE users SET email = N'le.quang.huy.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Lê Quang Huy', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186203', university_name = N'FPT University',
        semester = 6, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-000000000003';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-000000000003', N'le.quang.huy.closing26@fpt.edu.vn', @demoHash, N'Lê Quang Huy', NULL, NULL,
        N'SE186203', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 6, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-000000000004')
BEGIN
    UPDATE users SET email = N'pham.ngoc.anh.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Phạm Ngọc Anh', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186204', university_name = N'FPT University',
        semester = 7, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-000000000004';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-000000000004', N'pham.ngoc.anh.closing26@fpt.edu.vn', @demoHash, N'Phạm Ngọc Anh', NULL, NULL,
        N'SE186204', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 7, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-000000000005')
BEGIN
    UPDATE users SET email = N'hoang.duc.anh.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Hoàng Đức Anh', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186205', university_name = N'FPT University',
        semester = 8, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-000000000005';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-000000000005', N'hoang.duc.anh.closing26@fpt.edu.vn', @demoHash, N'Hoàng Đức Anh', NULL, NULL,
        N'SE186205', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 8, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-000000000006')
BEGIN
    UPDATE users SET email = N'vu.minh.chau.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Vũ Minh Châu', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186206', university_name = N'FPT University',
        semester = 4, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-000000000006';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-000000000006', N'vu.minh.chau.closing26@fpt.edu.vn', @demoHash, N'Vũ Minh Châu', NULL, NULL,
        N'SE186206', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 4, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-000000000007')
BEGIN
    UPDATE users SET email = N'dang.thanh.tung.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Đặng Thanh Tùng', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186207', university_name = N'FPT University',
        semester = 5, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-000000000007';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-000000000007', N'dang.thanh.tung.closing26@fpt.edu.vn', @demoHash, N'Đặng Thanh Tùng', NULL, NULL,
        N'SE186207', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-000000000008')
BEGIN
    UPDATE users SET email = N'bui.thi.lan.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Bùi Thị Lan', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186208', university_name = N'FPT University',
        semester = 6, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-000000000008';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-000000000008', N'bui.thi.lan.closing26@fpt.edu.vn', @demoHash, N'Bùi Thị Lan', NULL, NULL,
        N'SE186208', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 6, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-000000000009')
BEGIN
    UPDATE users SET email = N'ngo.van.khoa.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Ngô Văn Khoa', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186209', university_name = N'FPT University',
        semester = 7, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-000000000009';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-000000000009', N'ngo.van.khoa.closing26@fpt.edu.vn', @demoHash, N'Ngô Văn Khoa', NULL, NULL,
        N'SE186209', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 7, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-00000000000A')
BEGIN
    UPDATE users SET email = N'do.hai.yen.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Đỗ Hải Yến', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186210', university_name = N'FPT University',
        semester = 8, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-00000000000A';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-00000000000A', N'do.hai.yen.closing26@fpt.edu.vn', @demoHash, N'Đỗ Hải Yến', NULL, NULL,
        N'SE186210', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 8, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-00000000000B')
BEGIN
    UPDATE users SET email = N'ly.quoc.bao.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Lý Quốc Bảo', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186211', university_name = N'FPT University',
        semester = 4, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-00000000000B';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-00000000000B', N'ly.quoc.bao.closing26@fpt.edu.vn', @demoHash, N'Lý Quốc Bảo', NULL, NULL,
        N'SE186211', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 4, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-00000000000C')
BEGIN
    UPDATE users SET email = N'mai.phuong.thao.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Mai Phương Thảo', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186212', university_name = N'FPT University',
        semester = 5, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-00000000000C';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-00000000000C', N'mai.phuong.thao.closing26@fpt.edu.vn', @demoHash, N'Mai Phương Thảo', NULL, NULL,
        N'SE186212', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-00000000000D')
BEGIN
    UPDATE users SET email = N'trinh.nhat.nam.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Trịnh Nhật Nam', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186213', university_name = N'FPT University',
        semester = 6, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-00000000000D';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-00000000000D', N'trinh.nhat.nam.closing26@fpt.edu.vn', @demoHash, N'Trịnh Nhật Nam', NULL, NULL,
        N'SE186213', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 6, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-00000000000E')
BEGIN
    UPDATE users SET email = N'phan.gia.bao.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Phan Gia Bảo', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186214', university_name = N'FPT University',
        semester = 7, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-00000000000E';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-00000000000E', N'phan.gia.bao.closing26@fpt.edu.vn', @demoHash, N'Phan Gia Bảo', NULL, NULL,
        N'SE186214', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 7, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-00000000000F')
BEGIN
    UPDATE users SET email = N'huynh.khanh.vy.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Huỳnh Khánh Vy', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186215', university_name = N'FPT University',
        semester = 8, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-00000000000F';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-00000000000F', N'huynh.khanh.vy.closing26@fpt.edu.vn', @demoHash, N'Huỳnh Khánh Vy', NULL, NULL,
        N'SE186215', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 8, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-000000000010')
BEGIN
    UPDATE users SET email = N'vo.thanh.phong.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Võ Thanh Phong', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186216', university_name = N'FPT University',
        semester = 4, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-000000000010';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-000000000010', N'vo.thanh.phong.closing26@fpt.edu.vn', @demoHash, N'Võ Thanh Phong', NULL, NULL,
        N'SE186216', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 4, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-000000000011')
BEGIN
    UPDATE users SET email = N'dinh.ngoc.mai.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Đinh Ngọc Mai', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186217', university_name = N'FPT University',
        semester = 5, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-000000000011';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-000000000011', N'dinh.ngoc.mai.closing26@fpt.edu.vn', @demoHash, N'Đinh Ngọc Mai', NULL, NULL,
        N'SE186217', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-000000000012')
BEGIN
    UPDATE users SET email = N'cao.minh.tuan.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Cao Minh Tuấn', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186218', university_name = N'FPT University',
        semester = 6, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-000000000012';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-000000000012', N'cao.minh.tuan.closing26@fpt.edu.vn', @demoHash, N'Cao Minh Tuấn', NULL, NULL,
        N'SE186218', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 6, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-000000000013')
BEGIN
    UPDATE users SET email = N'luong.thi.huong.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Lương Thị Hương', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186219', university_name = N'FPT University',
        semester = 7, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-000000000013';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-000000000013', N'luong.thi.huong.closing26@fpt.edu.vn', @demoHash, N'Lương Thị Hương', NULL, NULL,
        N'SE186219', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 7, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-000000000014')
BEGIN
    UPDATE users SET email = N'ta.duc.long.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Tạ Đức Long', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186220', university_name = N'FPT University',
        semester = 8, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-000000000014';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-000000000014', N'ta.duc.long.closing26@fpt.edu.vn', @demoHash, N'Tạ Đức Long', NULL, NULL,
        N'SE186220', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 8, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-000000000015')
BEGIN
    UPDATE users SET email = N'ho.quang.vinh.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Hồ Quang Vinh', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186221', university_name = N'FPT University',
        semester = 4, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-000000000015';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-000000000015', N'ho.quang.vinh.closing26@fpt.edu.vn', @demoHash, N'Hồ Quang Vinh', NULL, NULL,
        N'SE186221', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 4, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-000000000016')
BEGIN
    UPDATE users SET email = N'chu.thi.my.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Chu Thị Mỹ', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186222', university_name = N'FPT University',
        semester = 5, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-000000000016';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-000000000016', N'chu.thi.my.closing26@fpt.edu.vn', @demoHash, N'Chu Thị Mỹ', NULL, NULL,
        N'SE186222', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-000000000017')
BEGIN
    UPDATE users SET email = N'doan.anh.khoa.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Đoàn Anh Khoa', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186223', university_name = N'FPT University',
        semester = 6, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-000000000017';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-000000000017', N'doan.anh.khoa.closing26@fpt.edu.vn', @demoHash, N'Đoàn Anh Khoa', NULL, NULL,
        N'SE186223', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 6, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-000000000018')
BEGIN
    UPDATE users SET email = N'lam.thanh.truc.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Lâm Thanh Trúc', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186224', university_name = N'FPT University',
        semester = 7, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-000000000018';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-000000000018', N'lam.thanh.truc.closing26@fpt.edu.vn', @demoHash, N'Lâm Thanh Trúc', NULL, NULL,
        N'SE186224', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 7, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-000000000019')
BEGIN
    UPDATE users SET email = N'tong.minh.duc.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Tống Minh Đức', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186225', university_name = N'FPT University',
        semester = 8, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-000000000019';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-000000000019', N'tong.minh.duc.closing26@fpt.edu.vn', @demoHash, N'Tống Minh Đức', NULL, NULL,
        N'SE186225', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 8, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-00000000001A')
BEGIN
    UPDATE users SET email = N'nghiem.ha.my.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Nghiêm Hà My', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186226', university_name = N'FPT University',
        semester = 4, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-00000000001A';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-00000000001A', N'nghiem.ha.my.closing26@fpt.edu.vn', @demoHash, N'Nghiêm Hà My', NULL, NULL,
        N'SE186226', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 4, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '05010000-EEEE-4EEE-8EEE-00000000001B')
BEGIN
    UPDATE users SET email = N'quach.nhat.hao.closing26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Quách Nhật Hào', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE186227', university_name = N'FPT University',
        semester = 5, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '05010000-EEEE-4EEE-8EEE-00000000001B';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('05010000-EEEE-4EEE-8EEE-00000000001B', N'quach.nhat.hao.closing26@fpt.edu.vn', @demoHash, N'Quách Nhật Hào', NULL, NULL,
        N'SE186227', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-000000000001')
BEGIN
    UPDATE users SET email = N'nguyen.hoang.minh.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Nguyễn Hoàng Minh', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187201', university_name = N'FPT University',
        semester = 4, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-000000000001';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-000000000001', N'nguyen.hoang.minh.preview26@fpt.edu.vn', @demoHash, N'Nguyễn Hoàng Minh', NULL, NULL,
        N'SE187201', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 4, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-000000000002')
BEGIN
    UPDATE users SET email = N'tran.thu.ha.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Trần Thu Hà', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187202', university_name = N'FPT University',
        semester = 5, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-000000000002';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-000000000002', N'tran.thu.ha.preview26@fpt.edu.vn', @demoHash, N'Trần Thu Hà', NULL, NULL,
        N'SE187202', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-000000000003')
BEGIN
    UPDATE users SET email = N'le.quang.huy.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Lê Quang Huy', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187203', university_name = N'FPT University',
        semester = 6, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-000000000003';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-000000000003', N'le.quang.huy.preview26@fpt.edu.vn', @demoHash, N'Lê Quang Huy', NULL, NULL,
        N'SE187203', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 6, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-000000000004')
BEGIN
    UPDATE users SET email = N'pham.ngoc.anh.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Phạm Ngọc Anh', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187204', university_name = N'FPT University',
        semester = 7, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-000000000004';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-000000000004', N'pham.ngoc.anh.preview26@fpt.edu.vn', @demoHash, N'Phạm Ngọc Anh', NULL, NULL,
        N'SE187204', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 7, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-000000000005')
BEGIN
    UPDATE users SET email = N'hoang.duc.anh.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Hoàng Đức Anh', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187205', university_name = N'FPT University',
        semester = 8, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-000000000005';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-000000000005', N'hoang.duc.anh.preview26@fpt.edu.vn', @demoHash, N'Hoàng Đức Anh', NULL, NULL,
        N'SE187205', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 8, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-000000000006')
BEGIN
    UPDATE users SET email = N'vu.minh.chau.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Vũ Minh Châu', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187206', university_name = N'FPT University',
        semester = 4, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-000000000006';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-000000000006', N'vu.minh.chau.preview26@fpt.edu.vn', @demoHash, N'Vũ Minh Châu', NULL, NULL,
        N'SE187206', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 4, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-000000000007')
BEGIN
    UPDATE users SET email = N'dang.thanh.tung.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Đặng Thanh Tùng', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187207', university_name = N'FPT University',
        semester = 5, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-000000000007';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-000000000007', N'dang.thanh.tung.preview26@fpt.edu.vn', @demoHash, N'Đặng Thanh Tùng', NULL, NULL,
        N'SE187207', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-000000000008')
BEGIN
    UPDATE users SET email = N'bui.thi.lan.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Bùi Thị Lan', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187208', university_name = N'FPT University',
        semester = 6, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-000000000008';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-000000000008', N'bui.thi.lan.preview26@fpt.edu.vn', @demoHash, N'Bùi Thị Lan', NULL, NULL,
        N'SE187208', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 6, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-000000000009')
BEGIN
    UPDATE users SET email = N'ngo.van.khoa.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Ngô Văn Khoa', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187209', university_name = N'FPT University',
        semester = 7, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-000000000009';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-000000000009', N'ngo.van.khoa.preview26@fpt.edu.vn', @demoHash, N'Ngô Văn Khoa', NULL, NULL,
        N'SE187209', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 7, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-00000000000A')
BEGIN
    UPDATE users SET email = N'do.hai.yen.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Đỗ Hải Yến', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187210', university_name = N'FPT University',
        semester = 8, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-00000000000A';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-00000000000A', N'do.hai.yen.preview26@fpt.edu.vn', @demoHash, N'Đỗ Hải Yến', NULL, NULL,
        N'SE187210', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 8, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-00000000000B')
BEGIN
    UPDATE users SET email = N'ly.quoc.bao.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Lý Quốc Bảo', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187211', university_name = N'FPT University',
        semester = 4, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-00000000000B';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-00000000000B', N'ly.quoc.bao.preview26@fpt.edu.vn', @demoHash, N'Lý Quốc Bảo', NULL, NULL,
        N'SE187211', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 4, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-00000000000C')
BEGIN
    UPDATE users SET email = N'mai.phuong.thao.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Mai Phương Thảo', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187212', university_name = N'FPT University',
        semester = 5, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-00000000000C';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-00000000000C', N'mai.phuong.thao.preview26@fpt.edu.vn', @demoHash, N'Mai Phương Thảo', NULL, NULL,
        N'SE187212', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-00000000000D')
BEGIN
    UPDATE users SET email = N'trinh.nhat.nam.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Trịnh Nhật Nam', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187213', university_name = N'FPT University',
        semester = 6, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-00000000000D';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-00000000000D', N'trinh.nhat.nam.preview26@fpt.edu.vn', @demoHash, N'Trịnh Nhật Nam', NULL, NULL,
        N'SE187213', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 6, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-00000000000E')
BEGIN
    UPDATE users SET email = N'phan.gia.bao.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Phan Gia Bảo', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187214', university_name = N'FPT University',
        semester = 7, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-00000000000E';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-00000000000E', N'phan.gia.bao.preview26@fpt.edu.vn', @demoHash, N'Phan Gia Bảo', NULL, NULL,
        N'SE187214', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 7, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-00000000000F')
BEGIN
    UPDATE users SET email = N'huynh.khanh.vy.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Huỳnh Khánh Vy', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187215', university_name = N'FPT University',
        semester = 8, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-00000000000F';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-00000000000F', N'huynh.khanh.vy.preview26@fpt.edu.vn', @demoHash, N'Huỳnh Khánh Vy', NULL, NULL,
        N'SE187215', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 8, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-000000000010')
BEGIN
    UPDATE users SET email = N'vo.thanh.phong.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Võ Thanh Phong', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187216', university_name = N'FPT University',
        semester = 4, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-000000000010';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-000000000010', N'vo.thanh.phong.preview26@fpt.edu.vn', @demoHash, N'Võ Thanh Phong', NULL, NULL,
        N'SE187216', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 4, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-000000000011')
BEGIN
    UPDATE users SET email = N'dinh.ngoc.mai.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Đinh Ngọc Mai', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187217', university_name = N'FPT University',
        semester = 5, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-000000000011';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-000000000011', N'dinh.ngoc.mai.preview26@fpt.edu.vn', @demoHash, N'Đinh Ngọc Mai', NULL, NULL,
        N'SE187217', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-000000000012')
BEGIN
    UPDATE users SET email = N'cao.minh.tuan.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Cao Minh Tuấn', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187218', university_name = N'FPT University',
        semester = 6, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-000000000012';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-000000000012', N'cao.minh.tuan.preview26@fpt.edu.vn', @demoHash, N'Cao Minh Tuấn', NULL, NULL,
        N'SE187218', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 6, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-000000000013')
BEGIN
    UPDATE users SET email = N'luong.thi.huong.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Lương Thị Hương', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187219', university_name = N'FPT University',
        semester = 7, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-000000000013';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-000000000013', N'luong.thi.huong.preview26@fpt.edu.vn', @demoHash, N'Lương Thị Hương', NULL, NULL,
        N'SE187219', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 7, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-000000000014')
BEGIN
    UPDATE users SET email = N'ta.duc.long.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Tạ Đức Long', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187220', university_name = N'FPT University',
        semester = 8, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-000000000014';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-000000000014', N'ta.duc.long.preview26@fpt.edu.vn', @demoHash, N'Tạ Đức Long', NULL, NULL,
        N'SE187220', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 8, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-000000000015')
BEGIN
    UPDATE users SET email = N'ho.quang.vinh.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Hồ Quang Vinh', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187221', university_name = N'FPT University',
        semester = 4, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-000000000015';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-000000000015', N'ho.quang.vinh.preview26@fpt.edu.vn', @demoHash, N'Hồ Quang Vinh', NULL, NULL,
        N'SE187221', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 4, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-000000000016')
BEGIN
    UPDATE users SET email = N'chu.thi.my.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Chu Thị Mỹ', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187222', university_name = N'FPT University',
        semester = 5, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-000000000016';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-000000000016', N'chu.thi.my.preview26@fpt.edu.vn', @demoHash, N'Chu Thị Mỹ', NULL, NULL,
        N'SE187222', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-000000000017')
BEGIN
    UPDATE users SET email = N'doan.anh.khoa.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Đoàn Anh Khoa', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187223', university_name = N'FPT University',
        semester = 6, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-000000000017';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-000000000017', N'doan.anh.khoa.preview26@fpt.edu.vn', @demoHash, N'Đoàn Anh Khoa', NULL, NULL,
        N'SE187223', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 6, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-000000000018')
BEGIN
    UPDATE users SET email = N'lam.thanh.truc.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Lâm Thanh Trúc', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187224', university_name = N'FPT University',
        semester = 7, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-000000000018';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-000000000018', N'lam.thanh.truc.preview26@fpt.edu.vn', @demoHash, N'Lâm Thanh Trúc', NULL, NULL,
        N'SE187224', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 7, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-000000000019')
BEGIN
    UPDATE users SET email = N'tong.minh.duc.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Tống Minh Đức', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187225', university_name = N'FPT University',
        semester = 8, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-000000000019';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-000000000019', N'tong.minh.duc.preview26@fpt.edu.vn', @demoHash, N'Tống Minh Đức', NULL, NULL,
        N'SE187225', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 8, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-00000000001A')
BEGIN
    UPDATE users SET email = N'nghiem.ha.my.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Nghiêm Hà My', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187226', university_name = N'FPT University',
        semester = 4, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-00000000001A';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-00000000001A', N'nghiem.ha.my.preview26@fpt.edu.vn', @demoHash, N'Nghiêm Hà My', NULL, NULL,
        N'SE187226', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 4, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

IF EXISTS (SELECT 1 FROM users WHERE id = '06010000-EEEE-4EEE-8EEE-00000000001B')
BEGIN
    UPDATE users SET email = N'quach.nhat.hao.preview26@fpt.edu.vn', password_hash = @demoHash, full_name = N'Quách Nhật Hào', user_type = 'FPT_STUDENT',
        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,
        student_id = N'SE187227', university_name = N'FPT University',
        semester = 5, student_standing = 'ENROLLED', temporary_account = 0,
        updated_at = @now, updated_by = N'tran.thanh.ha@fpt.edu.vn'
    WHERE id = '06010000-EEEE-4EEE-8EEE-00000000001B';
END
ELSE
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,
        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,
        created_at, updated_at, created_by, updated_by)
    VALUES ('06010000-EEEE-4EEE-8EEE-00000000001B', N'quach.nhat.hao.preview26@fpt.edu.vn', @demoHash, N'Quách Nhật Hào', NULL, NULL,
        N'SE187227', N'FPT University',
        'FPT_STUDENT', 'ACTIVE', 0, NULL, 5, 'ENROLLED', 0,
        @now, @now, N'tran.thanh.ha@fpt.edu.vn', N'tran.thanh.ha@fpt.edu.vn');
END

DECLARE @coordId UNIQUEIDENTIFIER = '00000000-EEEE-4EEE-8EEE-000000000001';
DECLARE @judge1Id UNIQUEIDENTIFIER = '00000000-EEEE-4EEE-8EEE-000000000002';
DECLARE @judge2Id UNIQUEIDENTIFIER = '00000000-EEEE-4EEE-8EEE-000000000003';
DECLARE @judge3Id UNIQUEIDENTIFIER = '00000000-EEEE-4EEE-8EEE-000000000005';
DECLARE @mentor1Id UNIQUEIDENTIFIER = '00000000-EEEE-4EEE-8EEE-000000000004';
DECLARE @mentor2Id UNIQUEIDENTIFIER = '00000000-EEEE-4EEE-8EEE-000000000006';
DECLARE @mentor3Id UNIQUEIDENTIFIER = '00000000-EEEE-4EEE-8EEE-000000000007';

-- ============================================================
-- === SEAL Hackathon Fall 2025 - Agentic RAG Foundations ===
-- QA phase: COMPLETED end-to-end (scores, rankings, awards, published)
-- Login: tran.thanh.ha@fpt.edu.vn (coordinator) or nguyen.hoang.minh@fpt.edu.vn (team leader) / Demo@123456
-- View: /hackathons/01020000-EEEE-4EEE-8EEE-000000000001/livescore
-- ============================================================

DECLARE @e1_compDay DATE = '2025-11-15';
DECLARE @e1_endDay DATE = '2025-11-15';
DECLARE @e1_compDt DATETIME2 = CAST(@e1_compDay AS DATETIME2);
DECLARE @e1_regOpen DATE = '2025-08-01';
DECLARE @e1_regDeadline DATE = '2025-10-31';
DECLARE @e1_prelimStart DATETIME2 = DATEADD(HOUR, 7, @e1_compDt);
DECLARE @e1_prelimSub DATETIME2 = DATEADD(HOUR, 14, @e1_compDt);
DECLARE @e1_prelimScore DATETIME2 = DATEADD(MINUTE, 15*60+30, @e1_compDt);
DECLARE @e1_finalStart DATETIME2 = DATEADD(MINUTE, 15*60+30, @e1_compDt);
DECLARE @e1_finalSub DATETIME2 = DATEADD(MINUTE, 15*60+30, @e1_compDt);
DECLARE @e1_finalScore DATETIME2 = DATEADD(HOUR, 17, @e1_compDt);
DECLARE @e1_finalEnd DATETIME2 = DATEADD(HOUR, 17, @e1_compDt);

INSERT INTO hackathon_events (
    id, name, season, year, start_date, end_date,
    registration_open_date, registration_deadline,
    description, location, format, competition_format,
    min_team, max_team, semester_min, semester_max,
    scoring_template_id, status, leaderboard_public,
    owner_user_id, created_by, created_at, updated_at
) VALUES (
    '01020000-EEEE-4EEE-8EEE-000000000001',
    N'SEAL Hackathon Fall 2025 - Agentic RAG Foundations',
    N'Fall', 2025,
    @e1_compDay, @e1_endDay,
    @e1_regOpen, @e1_regDeadline,
    N'SEAL Hackathon Fall 2025 focuses on Agentic RAG systems: grounded retrieval, multi-step agent orchestration, and enterprise-ready copilots built by FPT University teams.',
    N'FPT University HCM', 'OFFLINE', 'SEAL_RAG_2026',
    3, 5, 4, 8,
    @templateId, 'COMPLETED', 1,
    @coordId, N'tran.thanh.ha@fpt.edu.vn', @now, @now
);

INSERT INTO tracks (id, event_id, name, description, max_teams, status, created_at, updated_at) VALUES
    ('01040000-EEEE-4EEE-8EEE-000000000001', '01020000-EEEE-4EEE-8EEE-000000000001', N'Grounded Retrieval', N'SEAL track: Grounded Retrieval', 8, 'OPEN', @now, @now),
    ('01040000-EEEE-4EEE-8EEE-000000000002', '01020000-EEEE-4EEE-8EEE-000000000001', N'Agent Orchestration', N'SEAL track: Agent Orchestration', 8, 'OPEN', @now, @now),
    ('01040000-EEEE-4EEE-8EEE-000000000003', '01020000-EEEE-4EEE-8EEE-000000000001', N'Enterprise Copilot', N'SEAL track: Enterprise Copilot', 8, 'OPEN', @now, @now);

INSERT INTO rounds (
    id, event_id, round_number, name, round_type,
    start_date, end_date, slide_deadline, submission_deadline, scoring_deadline,
    advancement_cutoff, advancement_rule, round_weight, created_at, updated_at
) VALUES
    ('01030000-EEEE-4EEE-8EEE-000000000001', '01020000-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', 'PRELIMINARY',
     @e1_prelimStart, @e1_prelimScore, DATEADD(HOUR, -4, @e1_prelimSub),
     @e1_prelimSub, @e1_prelimScore,
     2, 'PER_TRACK_TOP_N', 40, @now, @now),
    ('01030000-EEEE-4EEE-8EEE-000000000002', '01020000-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', 'FINAL',
     @e1_finalStart, @e1_finalEnd, NULL,
     @e1_finalSub, @e1_finalScore,
     6, 'FINALIST_POOL', 60, @now, @now);

INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at) VALUES
    ('01060000-EEEE-4EEE-8EEE-000000000001', '01030000-EEEE-4EEE-8EEE-000000000001', N'Accuracy and Domain Relevance', N'Accuracy and Domain Relevance', 30, 0, 1, 5, @now, @now),
    ('01060000-EEEE-4EEE-8EEE-000000000002', '01030000-EEEE-4EEE-8EEE-000000000001', N'Agentic RAG Architecture & Algorithm', N'Agentic RAG Architecture & Algorithm', 30, 1, 1, 5, @now, @now),
    ('01060000-EEEE-4EEE-8EEE-000000000003', '01030000-EEEE-4EEE-8EEE-000000000001', N'Ideas & Presentation', N'Ideas & Presentation', 15, 2, 1, 5, @now, @now),
    ('01060000-EEEE-4EEE-8EEE-000000000004', '01030000-EEEE-4EEE-8EEE-000000000001', N'Feasibility & Creativity', N'Feasibility & Creativity', 15, 3, 1, 5, @now, @now),
    ('01060000-EEEE-4EEE-8EEE-000000000005', '01030000-EEEE-4EEE-8EEE-000000000001', N'User Experience & Interactive Interface', N'User Experience & Interactive Interface', 10, 4, 1, 5, @now, @now),
    ('01060000-EEEE-4EEE-8EEE-00000000000B', '01030000-EEEE-4EEE-8EEE-000000000002', N'Data Processing & Retrieval Quality', N'Data Processing & Retrieval Quality', 30, 0, 1, 5, @now, @now),
    ('01060000-EEEE-4EEE-8EEE-00000000000C', '01030000-EEEE-4EEE-8EEE-000000000002', N'Reliability & Hallucination Resistance', N'Reliability & Hallucination Resistance', 20, 1, 1, 5, @now, @now),
    ('01060000-EEEE-4EEE-8EEE-00000000000D', '01030000-EEEE-4EEE-8EEE-000000000002', N'Agent Reasoning & Multi-hop Processing', N'Agent Reasoning & Multi-hop Processing', 20, 2, 1, 5, @now, @now),
    ('01060000-EEEE-4EEE-8EEE-00000000000E', '01030000-EEEE-4EEE-8EEE-000000000002', N'Practicality & Operational Optimization', N'Practicality & Operational Optimization', 20, 3, 1, 5, @now, @now),
    ('01060000-EEEE-4EEE-8EEE-00000000000F', '01030000-EEEE-4EEE-8EEE-000000000002', N'Scalability & Innovation', N'Scalability & Innovation', 10, 4, 1, 5, @now, @now);

INSERT INTO prizes (id, event_id, rank, value, quantity, label, created_at, updated_at) VALUES
    ('01070000-EEEE-4EEE-8EEE-000000000001', '01020000-EEEE-4EEE-8EEE-000000000001', 'FIRST', '7000000', 1, N'First Prize', @now, @now),
    ('01070000-EEEE-4EEE-8EEE-000000000002', '01020000-EEEE-4EEE-8EEE-000000000001', 'SECOND', '5000000', 1, N'Second Prize', @now, @now),
    ('01070000-EEEE-4EEE-8EEE-000000000003', '01020000-EEEE-4EEE-8EEE-000000000001', 'THIRD', '3000000', 1, N'Third Prize', @now, @now),
    ('01070000-EEEE-4EEE-8EEE-000000000004', '01020000-EEEE-4EEE-8EEE-000000000001', 'CONSOLATION', '1500000', 1, N'Consolation Prize', @now, @now);

INSERT INTO event_schedules (id, event_id, type, title, description, start_time, end_time, gate, sort_order, created_at, updated_at) VALUES
    ('01080000-EEEE-4EEE-8EEE-000000000001', '01020000-EEEE-4EEE-8EEE-000000000001', 'WORKSHOP', N'Workshop', NULL, DATEADD(DAY, -3, @e1_compDt), DATEADD(HOUR, 3, DATEADD(DAY, -3, @e1_compDt)), NULL, 0, @now, @now),
    ('01080000-EEEE-4EEE-8EEE-000000000002', '01020000-EEEE-4EEE-8EEE-000000000001', 'OPENING', N'Opening & track draw', N'Teams pick tracks in turn; organizers draw topics per track', DATEADD(DAY, -1, @e1_compDt), DATEADD(HOUR, 3, DATEADD(DAY, -1, @e1_compDt)), NULL, 1, @now, @now),
    ('01080000-EEEE-4EEE-8EEE-000000000003', '01020000-EEEE-4EEE-8EEE-000000000001', 'TRACK_DRAW', N'Track selection draw', NULL, DATEADD(DAY, -1, @e1_compDt), DATEADD(HOUR, 2, DATEADD(DAY, -1, @e1_compDt)), NULL, 2, @now, @now),
    ('01080000-EEEE-4EEE-8EEE-000000000004', '01020000-EEEE-4EEE-8EEE-000000000001', 'MILESTONE', N'Milestone 1 - Idea & architecture completion', N'Design Agentic RAG architecture', @e1_prelimStart, DATEADD(HOUR, 3, @e1_prelimStart), 'SLIDE_SUBMISSION', 3, @now, @now),
    ('01080000-EEEE-4EEE-8EEE-000000000005', '01020000-EEEE-4EEE-8EEE-000000000001', 'MILESTONE', N'Milestone 2 - Pitching & product completion', N'Parallel pitching and coding', DATEADD(HOUR, 3, @e1_prelimStart), @e1_prelimSub, 'DEMO_SUBMISSION', 4, @now, @now),
    ('01080000-EEEE-4EEE-8EEE-000000000006', '01020000-EEEE-4EEE-8EEE-000000000001', 'SCORING', N'Preliminary scoring', N'5-minute presentation + 3-minute Q&A', @e1_prelimSub, @e1_prelimScore, NULL, 5, @now, @now),
    ('01080000-EEEE-4EEE-8EEE-000000000007', '01020000-EEEE-4EEE-8EEE-000000000001', 'FINAL', N'Finals', N'7-minute presentation + 3-minute Q&A - Top 6 teams', @e1_finalStart, @e1_finalEnd, NULL, 6, @now, @now),
    ('01080000-EEEE-4EEE-8EEE-000000000008', '01020000-EEEE-4EEE-8EEE-000000000001', 'CEREMONY', N'Awards & closing ceremony', NULL, @e1_finalEnd, DATEADD(HOUR, 1, @e1_finalEnd), NULL, 7, @now, @now);

INSERT INTO allowed_email_domains (id, event_id, domain, university_label, created_at, updated_at) VALUES
    ('01090000-EEEE-4EEE-8EEE-000000000001', '01020000-EEEE-4EEE-8EEE-000000000001', 'fpt.edu.vn', N'FPT University', @now, @now),
    ('01090000-EEEE-4EEE-8EEE-000000000002', '01020000-EEEE-4EEE-8EEE-000000000001', 'fe.edu.vn', N'FPT Education', @now, @now),
    ('01090000-EEEE-4EEE-8EEE-000000000003', '01020000-EEEE-4EEE-8EEE-000000000001', 'hcmut.edu.vn', N'Ho Chi Minh City University of Technology', @now, @now),
    ('01090000-EEEE-4EEE-8EEE-000000000004', '01020000-EEEE-4EEE-8EEE-000000000001', 'hcmus.edu.vn', N'Vietnam National University Ho Chi Minh City - University of Science', @now, @now),
    ('01090000-EEEE-4EEE-8EEE-000000000005', '01020000-EEEE-4EEE-8EEE-000000000001', 'student.hcmus.edu.vn', N'Vietnam National University Ho Chi Minh City - University of Science', @now, @now),
    ('01090000-EEEE-4EEE-8EEE-000000000006', '01020000-EEEE-4EEE-8EEE-000000000001', 'uit.edu.vn', N'University of Information Technology', @now, @now),
    ('01090000-EEEE-4EEE-8EEE-000000000007', '01020000-EEEE-4EEE-8EEE-000000000001', 'hcmute.edu.vn', N'Ho Chi Minh City University of Education and Technology', @now, @now),
    ('01090000-EEEE-4EEE-8EEE-000000000008', '01020000-EEEE-4EEE-8EEE-000000000001', 'ueh.edu.vn', N'University of Economics Ho Chi Minh City', @now, @now),
    ('01090000-EEEE-4EEE-8EEE-000000000009', '01020000-EEEE-4EEE-8EEE-000000000001', 'student.ueh.edu.vn', N'University of Economics Ho Chi Minh City', @now, @now),
    ('01090000-EEEE-4EEE-8EEE-00000000000A', '01020000-EEEE-4EEE-8EEE-000000000001', 'student.iuh.edu.vn', N'Industrial University of Ho Chi Minh City', @now, @now);

INSERT INTO event_enrollments (id, created_at, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public) VALUES
    ('010A0000-EEEE-4EEE-8EEE-000000000001', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000001', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-000000000002', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000002', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-000000000003', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000003', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-000000000004', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000004', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-000000000005', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000005', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-000000000006', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000006', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-000000000007', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000007', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-000000000008', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000008', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-000000000009', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000009', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000000A', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-00000000000B', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000000B', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-00000000000C', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000000C', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-00000000000D', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000000D', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-00000000000E', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000000E', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-00000000000F', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000000F', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-000000000010', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000010', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-000000000011', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000011', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-000000000012', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000012', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-000000000013', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000013', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-000000000014', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000014', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-000000000015', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000015', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-000000000016', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000016', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-000000000017', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000017', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-000000000018', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000018', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-000000000019', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000019', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-00000000001A', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000001A', 0, 0),
    ('010A0000-EEEE-4EEE-8EEE-00000000001B', @now, @now, '01020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000001B', 0, 0);

INSERT INTO teams (id, created_at, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, is_recruiting, recruitment_note, version) VALUES
    ('01050000-EEEE-4EEE-8EEE-000000000001', @now, '01020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000001', N'NeuroRetrieve', 'CONFIRMED', '01040000-EEEE-4EEE-8EEE-000000000001', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Grounded Retrieval track.', 0),
    ('01050000-EEEE-4EEE-8EEE-000000000002', @now, '01020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000004', N'CiteGuard', 'CONFIRMED', '01040000-EEEE-4EEE-8EEE-000000000001', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Grounded Retrieval track.', 0),
    ('01050000-EEEE-4EEE-8EEE-000000000003', @now, '01020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000007', N'HopChain', 'CONFIRMED', '01040000-EEEE-4EEE-8EEE-000000000001', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Grounded Retrieval track.', 0),
    ('01050000-EEEE-4EEE-8EEE-000000000004', @now, '01020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-00000000000A', N'DocuPilot', 'CONFIRMED', '01040000-EEEE-4EEE-8EEE-000000000002', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Agent Orchestration track.', 0),
    ('01050000-EEEE-4EEE-8EEE-000000000005', @now, '01020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-00000000000D', N'RAGForge', 'CONFIRMED', '01040000-EEEE-4EEE-8EEE-000000000002', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Agent Orchestration track.', 0),
    ('01050000-EEEE-4EEE-8EEE-000000000006', @now, '01020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000010', N'ContextLens', 'CONFIRMED', '01040000-EEEE-4EEE-8EEE-000000000002', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Agent Orchestration track.', 0),
    ('01050000-EEEE-4EEE-8EEE-000000000007', @now, '01020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000013', N'VaultAgent', 'CONFIRMED', '01040000-EEEE-4EEE-8EEE-000000000003', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Enterprise Copilot track.', 0),
    ('01050000-EEEE-4EEE-8EEE-000000000008', @now, '01020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000016', N'PolicyPilot', 'CONFIRMED', '01040000-EEEE-4EEE-8EEE-000000000003', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Enterprise Copilot track.', 0),
    ('01050000-EEEE-4EEE-8EEE-000000000009', @now, '01020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000019', N'GroundTruth', 'CONFIRMED', '01040000-EEEE-4EEE-8EEE-000000000003', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Enterprise Copilot track.', 0);

INSERT INTO team_members (id, created_at, joined_at, role, user_id, team_id, event_id) VALUES
    ('010B0000-EEEE-4EEE-8EEE-000000000001', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000001', '01050000-EEEE-4EEE-8EEE-000000000001', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-000000000002', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000002', '01050000-EEEE-4EEE-8EEE-000000000001', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-000000000003', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000003', '01050000-EEEE-4EEE-8EEE-000000000001', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-000000000004', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000004', '01050000-EEEE-4EEE-8EEE-000000000002', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-000000000005', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000005', '01050000-EEEE-4EEE-8EEE-000000000002', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-000000000006', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000006', '01050000-EEEE-4EEE-8EEE-000000000002', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-000000000007', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000007', '01050000-EEEE-4EEE-8EEE-000000000003', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-000000000008', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000008', '01050000-EEEE-4EEE-8EEE-000000000003', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-000000000009', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000009', '01050000-EEEE-4EEE-8EEE-000000000003', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-00000000000A', '01050000-EEEE-4EEE-8EEE-000000000004', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-00000000000B', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-00000000000B', '01050000-EEEE-4EEE-8EEE-000000000004', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-00000000000C', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-00000000000C', '01050000-EEEE-4EEE-8EEE-000000000004', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-00000000000D', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-00000000000D', '01050000-EEEE-4EEE-8EEE-000000000005', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-00000000000E', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-00000000000E', '01050000-EEEE-4EEE-8EEE-000000000005', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-00000000000F', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-00000000000F', '01050000-EEEE-4EEE-8EEE-000000000005', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-000000000010', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000010', '01050000-EEEE-4EEE-8EEE-000000000006', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-000000000011', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000011', '01050000-EEEE-4EEE-8EEE-000000000006', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-000000000012', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000012', '01050000-EEEE-4EEE-8EEE-000000000006', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-000000000013', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000013', '01050000-EEEE-4EEE-8EEE-000000000007', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-000000000014', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000014', '01050000-EEEE-4EEE-8EEE-000000000007', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-000000000015', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000015', '01050000-EEEE-4EEE-8EEE-000000000007', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-000000000016', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000016', '01050000-EEEE-4EEE-8EEE-000000000008', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-000000000017', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000017', '01050000-EEEE-4EEE-8EEE-000000000008', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-000000000018', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000018', '01050000-EEEE-4EEE-8EEE-000000000008', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-000000000019', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000019', '01050000-EEEE-4EEE-8EEE-000000000009', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-00000000001A', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-00000000001A', '01050000-EEEE-4EEE-8EEE-000000000009', '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010B0000-EEEE-4EEE-8EEE-00000000001B', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-00000000001B', '01050000-EEEE-4EEE-8EEE-000000000009', '01020000-EEEE-4EEE-8EEE-000000000001');

INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id) VALUES
    ('010C0000-EEEE-4EEE-8EEE-000000000001', @now, @now, @judge1Id, '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010C0000-EEEE-4EEE-8EEE-000000000002', @now, @now, @judge2Id, '01020000-EEEE-4EEE-8EEE-000000000001'),
    ('010C0000-EEEE-4EEE-8EEE-000000000008', @now, @now, @judge3Id, '01020000-EEEE-4EEE-8EEE-000000000001');
INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active) VALUES
    ('010C0000-EEEE-4EEE-8EEE-000000000003', @now, @now, @judge1Id, '01030000-EEEE-4EEE-8EEE-000000000001', 'ROUND', 1),
    ('010C0000-EEEE-4EEE-8EEE-000000000004', @now, @now, @judge2Id, '01030000-EEEE-4EEE-8EEE-000000000001', 'ROUND', 1),
    ('010C0000-EEEE-4EEE-8EEE-000000000009', @now, @now, @judge3Id, '01030000-EEEE-4EEE-8EEE-000000000001', 'ROUND', 1),
    ('010C0000-EEEE-4EEE-8EEE-000000000005', @now, @now, @judge1Id, '01030000-EEEE-4EEE-8EEE-000000000002', 'ROUND', 1),
    ('010C0000-EEEE-4EEE-8EEE-000000000006', @now, @now, @judge2Id, '01030000-EEEE-4EEE-8EEE-000000000002', 'ROUND', 1),
    ('010C0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, @judge3Id, '01030000-EEEE-4EEE-8EEE-000000000002', 'ROUND', 1);
INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at) VALUES
    ('010C0000-EEEE-4EEE-8EEE-000000000007', '01020000-EEEE-4EEE-8EEE-000000000001', @mentor1Id, @now, @now),
    ('010C0000-EEEE-4EEE-8EEE-00000000000B', '01020000-EEEE-4EEE-8EEE-000000000001', @mentor2Id, @now, @now),
    ('010C0000-EEEE-4EEE-8EEE-00000000000C', '01020000-EEEE-4EEE-8EEE-000000000001', @mentor3Id, @now, @now);

INSERT INTO mentor_assignments (id, created_at, assigned_at, mentor_user_id, event_id, track_id) VALUES
    ('01160000-EEEE-4EEE-8EEE-000000000001', @now, @now, @mentor1Id, '01020000-EEEE-4EEE-8EEE-000000000001', '01040000-EEEE-4EEE-8EEE-000000000001'),
    ('01160000-EEEE-4EEE-8EEE-000000000002', @now, @now, @mentor2Id, '01020000-EEEE-4EEE-8EEE-000000000001', '01040000-EEEE-4EEE-8EEE-000000000002'),
    ('01160000-EEEE-4EEE-8EEE-000000000003', @now, @now, @mentor3Id, '01020000-EEEE-4EEE-8EEE-000000000001', '01040000-EEEE-4EEE-8EEE-000000000003');

INSERT INTO mentor_teams (id, created_at, assigned_at, mentor_user_id, team_id) VALUES
    ('01170000-EEEE-4EEE-8EEE-000000000001', @now, @now, @mentor1Id, '01050000-EEEE-4EEE-8EEE-000000000001'),
    ('01170000-EEEE-4EEE-8EEE-000000000002', @now, @now, @mentor1Id, '01050000-EEEE-4EEE-8EEE-000000000002'),
    ('01170000-EEEE-4EEE-8EEE-000000000003', @now, @now, @mentor1Id, '01050000-EEEE-4EEE-8EEE-000000000003'),
    ('01170000-EEEE-4EEE-8EEE-000000000004', @now, @now, @mentor2Id, '01050000-EEEE-4EEE-8EEE-000000000004'),
    ('01170000-EEEE-4EEE-8EEE-000000000005', @now, @now, @mentor2Id, '01050000-EEEE-4EEE-8EEE-000000000005'),
    ('01170000-EEEE-4EEE-8EEE-000000000006', @now, @now, @mentor2Id, '01050000-EEEE-4EEE-8EEE-000000000006'),
    ('01170000-EEEE-4EEE-8EEE-000000000007', @now, @now, @mentor3Id, '01050000-EEEE-4EEE-8EEE-000000000007'),
    ('01170000-EEEE-4EEE-8EEE-000000000008', @now, @now, @mentor3Id, '01050000-EEEE-4EEE-8EEE-000000000008'),
    ('01170000-EEEE-4EEE-8EEE-000000000009', @now, @now, @mentor3Id, '01050000-EEEE-4EEE-8EEE-000000000009');

INSERT INTO mentor_invitations (id, created_at, team_id, mentor_user_id, inviter_id, status, message) VALUES
    ('01180000-EEEE-4EEE-8EEE-000000000001', @now, '01050000-EEEE-4EEE-8EEE-000000000001', @mentor1Id, '01010000-EEEE-4EEE-8EEE-000000000001', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('01180000-EEEE-4EEE-8EEE-000000000002', @now, '01050000-EEEE-4EEE-8EEE-000000000002', @mentor1Id, '01010000-EEEE-4EEE-8EEE-000000000004', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('01180000-EEEE-4EEE-8EEE-000000000003', @now, '01050000-EEEE-4EEE-8EEE-000000000003', @mentor1Id, '01010000-EEEE-4EEE-8EEE-000000000007', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('01180000-EEEE-4EEE-8EEE-000000000004', @now, '01050000-EEEE-4EEE-8EEE-000000000004', @mentor2Id, '01010000-EEEE-4EEE-8EEE-00000000000A', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('01180000-EEEE-4EEE-8EEE-000000000005', @now, '01050000-EEEE-4EEE-8EEE-000000000005', @mentor2Id, '01010000-EEEE-4EEE-8EEE-00000000000D', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('01180000-EEEE-4EEE-8EEE-000000000006', @now, '01050000-EEEE-4EEE-8EEE-000000000006', @mentor2Id, '01010000-EEEE-4EEE-8EEE-000000000010', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('01180000-EEEE-4EEE-8EEE-000000000007', @now, '01050000-EEEE-4EEE-8EEE-000000000007', @mentor3Id, '01010000-EEEE-4EEE-8EEE-000000000013', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('01180000-EEEE-4EEE-8EEE-000000000008', @now, '01050000-EEEE-4EEE-8EEE-000000000008', @mentor3Id, '01010000-EEEE-4EEE-8EEE-000000000016', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('01180000-EEEE-4EEE-8EEE-000000000009', @now, '01050000-EEEE-4EEE-8EEE-000000000009', @mentor3Id, '01010000-EEEE-4EEE-8EEE-000000000019', 'ACCEPTED', N'Seeded mentor assignment for QA');

INSERT INTO submissions (id, created_at, current_version_id, round_id, status, submitted_by, team_id, opt_lock) VALUES
    ('010D0000-EEEE-4EEE-8EEE-000000000001', @now, NULL, '01030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000001', '01050000-EEEE-4EEE-8EEE-000000000001', 0),
    ('010D0000-EEEE-4EEE-8EEE-000000000002', @now, NULL, '01030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000004', '01050000-EEEE-4EEE-8EEE-000000000002', 0),
    ('010D0000-EEEE-4EEE-8EEE-000000000003', @now, NULL, '01030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000007', '01050000-EEEE-4EEE-8EEE-000000000003', 0),
    ('010D0000-EEEE-4EEE-8EEE-000000000004', @now, NULL, '01030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-00000000000A', '01050000-EEEE-4EEE-8EEE-000000000004', 0),
    ('010D0000-EEEE-4EEE-8EEE-000000000005', @now, NULL, '01030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-00000000000D', '01050000-EEEE-4EEE-8EEE-000000000005', 0),
    ('010D0000-EEEE-4EEE-8EEE-000000000006', @now, NULL, '01030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000010', '01050000-EEEE-4EEE-8EEE-000000000006', 0),
    ('010D0000-EEEE-4EEE-8EEE-000000000007', @now, NULL, '01030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000013', '01050000-EEEE-4EEE-8EEE-000000000007', 0),
    ('010D0000-EEEE-4EEE-8EEE-000000000008', @now, NULL, '01030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000016', '01050000-EEEE-4EEE-8EEE-000000000008', 0),
    ('010D0000-EEEE-4EEE-8EEE-000000000009', @now, NULL, '01030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000019', '01050000-EEEE-4EEE-8EEE-000000000009', 0),
    ('010D0000-EEEE-4EEE-8EEE-00000000000A', @now, NULL, '01030000-EEEE-4EEE-8EEE-000000000002', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000001', '01050000-EEEE-4EEE-8EEE-000000000001', 0),
    ('010D0000-EEEE-4EEE-8EEE-00000000000B', @now, NULL, '01030000-EEEE-4EEE-8EEE-000000000002', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000004', '01050000-EEEE-4EEE-8EEE-000000000002', 0),
    ('010D0000-EEEE-4EEE-8EEE-00000000000C', @now, NULL, '01030000-EEEE-4EEE-8EEE-000000000002', 'SCORED', '01010000-EEEE-4EEE-8EEE-00000000000A', '01050000-EEEE-4EEE-8EEE-000000000004', 0),
    ('010D0000-EEEE-4EEE-8EEE-00000000000D', @now, NULL, '01030000-EEEE-4EEE-8EEE-000000000002', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000010', '01050000-EEEE-4EEE-8EEE-000000000006', 0),
    ('010D0000-EEEE-4EEE-8EEE-00000000000E', @now, NULL, '01030000-EEEE-4EEE-8EEE-000000000002', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000016', '01050000-EEEE-4EEE-8EEE-000000000008', 0),
    ('010D0000-EEEE-4EEE-8EEE-00000000000F', @now, NULL, '01030000-EEEE-4EEE-8EEE-000000000002', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000013', '01050000-EEEE-4EEE-8EEE-000000000007', 0);

INSERT INTO submission_versions (id, created_at, demo_url, github_url, slide_url, submitted_at, version_number, submission_id) VALUES
    ('010E0000-EEEE-4EEE-8EEE-000000000001', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/neuroretrieve', N'https://docs.google.com/presentation/d/seal-1-0', DATEADD(MINUTE, -30, @e1_prelimSub), 1, '010D0000-EEEE-4EEE-8EEE-000000000001'),
    ('010E0000-EEEE-4EEE-8EEE-000000000002', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/citeguard', N'https://docs.google.com/presentation/d/seal-1-1', DATEADD(MINUTE, -31, @e1_prelimSub), 1, '010D0000-EEEE-4EEE-8EEE-000000000002'),
    ('010E0000-EEEE-4EEE-8EEE-000000000003', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/hopchain', N'https://docs.google.com/presentation/d/seal-1-2', DATEADD(MINUTE, -32, @e1_prelimSub), 1, '010D0000-EEEE-4EEE-8EEE-000000000003'),
    ('010E0000-EEEE-4EEE-8EEE-000000000004', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/docupilot', N'https://docs.google.com/presentation/d/seal-1-3', DATEADD(MINUTE, -33, @e1_prelimSub), 1, '010D0000-EEEE-4EEE-8EEE-000000000004'),
    ('010E0000-EEEE-4EEE-8EEE-000000000005', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/ragforge', N'https://docs.google.com/presentation/d/seal-1-4', DATEADD(MINUTE, -34, @e1_prelimSub), 1, '010D0000-EEEE-4EEE-8EEE-000000000005'),
    ('010E0000-EEEE-4EEE-8EEE-000000000006', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/contextlens', N'https://docs.google.com/presentation/d/seal-1-5', DATEADD(MINUTE, -35, @e1_prelimSub), 1, '010D0000-EEEE-4EEE-8EEE-000000000006'),
    ('010E0000-EEEE-4EEE-8EEE-000000000007', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vaultagent', N'https://docs.google.com/presentation/d/seal-1-6', DATEADD(MINUTE, -36, @e1_prelimSub), 1, '010D0000-EEEE-4EEE-8EEE-000000000007'),
    ('010E0000-EEEE-4EEE-8EEE-000000000008', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/policypilot', N'https://docs.google.com/presentation/d/seal-1-7', DATEADD(MINUTE, -37, @e1_prelimSub), 1, '010D0000-EEEE-4EEE-8EEE-000000000008'),
    ('010E0000-EEEE-4EEE-8EEE-000000000009', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/groundtruth', N'https://docs.google.com/presentation/d/seal-1-8', DATEADD(MINUTE, -38, @e1_prelimSub), 1, '010D0000-EEEE-4EEE-8EEE-000000000009'),
    ('010E0000-EEEE-4EEE-8EEE-00000000000A', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/neuroretrieve', N'https://docs.google.com/presentation/d/seal-1-9', DATEADD(MINUTE, -39, @e1_prelimSub), 1, '010D0000-EEEE-4EEE-8EEE-00000000000A'),
    ('010E0000-EEEE-4EEE-8EEE-00000000000B', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/citeguard', N'https://docs.google.com/presentation/d/seal-1-10', DATEADD(MINUTE, -40, @e1_prelimSub), 1, '010D0000-EEEE-4EEE-8EEE-00000000000B'),
    ('010E0000-EEEE-4EEE-8EEE-00000000000C', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/docupilot', N'https://docs.google.com/presentation/d/seal-1-11', DATEADD(MINUTE, -41, @e1_prelimSub), 1, '010D0000-EEEE-4EEE-8EEE-00000000000C'),
    ('010E0000-EEEE-4EEE-8EEE-00000000000D', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/contextlens', N'https://docs.google.com/presentation/d/seal-1-12', DATEADD(MINUTE, -42, @e1_prelimSub), 1, '010D0000-EEEE-4EEE-8EEE-00000000000D'),
    ('010E0000-EEEE-4EEE-8EEE-00000000000E', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/policypilot', N'https://docs.google.com/presentation/d/seal-1-13', DATEADD(MINUTE, -43, @e1_prelimSub), 1, '010D0000-EEEE-4EEE-8EEE-00000000000E'),
    ('010E0000-EEEE-4EEE-8EEE-00000000000F', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vaultagent', N'https://docs.google.com/presentation/d/seal-1-14', DATEADD(MINUTE, -44, @e1_prelimSub), 1, '010D0000-EEEE-4EEE-8EEE-00000000000F');

UPDATE submissions SET current_version_id = '010E0000-EEEE-4EEE-8EEE-000000000001' WHERE id = '010D0000-EEEE-4EEE-8EEE-000000000001';
UPDATE submissions SET current_version_id = '010E0000-EEEE-4EEE-8EEE-000000000002' WHERE id = '010D0000-EEEE-4EEE-8EEE-000000000002';
UPDATE submissions SET current_version_id = '010E0000-EEEE-4EEE-8EEE-000000000003' WHERE id = '010D0000-EEEE-4EEE-8EEE-000000000003';
UPDATE submissions SET current_version_id = '010E0000-EEEE-4EEE-8EEE-000000000004' WHERE id = '010D0000-EEEE-4EEE-8EEE-000000000004';
UPDATE submissions SET current_version_id = '010E0000-EEEE-4EEE-8EEE-000000000005' WHERE id = '010D0000-EEEE-4EEE-8EEE-000000000005';
UPDATE submissions SET current_version_id = '010E0000-EEEE-4EEE-8EEE-000000000006' WHERE id = '010D0000-EEEE-4EEE-8EEE-000000000006';
UPDATE submissions SET current_version_id = '010E0000-EEEE-4EEE-8EEE-000000000007' WHERE id = '010D0000-EEEE-4EEE-8EEE-000000000007';
UPDATE submissions SET current_version_id = '010E0000-EEEE-4EEE-8EEE-000000000008' WHERE id = '010D0000-EEEE-4EEE-8EEE-000000000008';
UPDATE submissions SET current_version_id = '010E0000-EEEE-4EEE-8EEE-000000000009' WHERE id = '010D0000-EEEE-4EEE-8EEE-000000000009';
UPDATE submissions SET current_version_id = '010E0000-EEEE-4EEE-8EEE-00000000000A' WHERE id = '010D0000-EEEE-4EEE-8EEE-00000000000A';
UPDATE submissions SET current_version_id = '010E0000-EEEE-4EEE-8EEE-00000000000B' WHERE id = '010D0000-EEEE-4EEE-8EEE-00000000000B';
UPDATE submissions SET current_version_id = '010E0000-EEEE-4EEE-8EEE-00000000000C' WHERE id = '010D0000-EEEE-4EEE-8EEE-00000000000C';
UPDATE submissions SET current_version_id = '010E0000-EEEE-4EEE-8EEE-00000000000D' WHERE id = '010D0000-EEEE-4EEE-8EEE-00000000000D';
UPDATE submissions SET current_version_id = '010E0000-EEEE-4EEE-8EEE-00000000000E' WHERE id = '010D0000-EEEE-4EEE-8EEE-00000000000E';
UPDATE submissions SET current_version_id = '010E0000-EEEE-4EEE-8EEE-00000000000F' WHERE id = '010D0000-EEEE-4EEE-8EEE-00000000000F';

INSERT INTO judge_scores (id, created_at, completed_at, judge_user_id, round_id, started_at, status, submission_id, version) VALUES
    ('010F0000-EEEE-4EEE-8EEE-000000000001', @now, @e1_prelimScore, @judge1Id, '01030000-EEEE-4EEE-8EEE-000000000001', @e1_prelimSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-000000000001', 0),
    ('010F0000-EEEE-4EEE-8EEE-000000000002', @now, @e1_prelimScore, @judge2Id, '01030000-EEEE-4EEE-8EEE-000000000001', @e1_prelimSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-000000000001', 0),
    ('010F0000-EEEE-4EEE-8EEE-000000000003', @now, @e1_prelimScore, @judge1Id, '01030000-EEEE-4EEE-8EEE-000000000001', @e1_prelimSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-000000000002', 0),
    ('010F0000-EEEE-4EEE-8EEE-000000000004', @now, @e1_prelimScore, @judge2Id, '01030000-EEEE-4EEE-8EEE-000000000001', @e1_prelimSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-000000000002', 0),
    ('010F0000-EEEE-4EEE-8EEE-000000000005', @now, @e1_prelimScore, @judge1Id, '01030000-EEEE-4EEE-8EEE-000000000001', @e1_prelimSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-000000000003', 0),
    ('010F0000-EEEE-4EEE-8EEE-000000000006', @now, @e1_prelimScore, @judge2Id, '01030000-EEEE-4EEE-8EEE-000000000001', @e1_prelimSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-000000000003', 0),
    ('010F0000-EEEE-4EEE-8EEE-000000000007', @now, @e1_prelimScore, @judge1Id, '01030000-EEEE-4EEE-8EEE-000000000001', @e1_prelimSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-000000000004', 0),
    ('010F0000-EEEE-4EEE-8EEE-000000000008', @now, @e1_prelimScore, @judge2Id, '01030000-EEEE-4EEE-8EEE-000000000001', @e1_prelimSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-000000000004', 0),
    ('010F0000-EEEE-4EEE-8EEE-000000000009', @now, @e1_prelimScore, @judge1Id, '01030000-EEEE-4EEE-8EEE-000000000001', @e1_prelimSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-000000000005', 0),
    ('010F0000-EEEE-4EEE-8EEE-00000000000A', @now, @e1_prelimScore, @judge2Id, '01030000-EEEE-4EEE-8EEE-000000000001', @e1_prelimSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-000000000005', 0),
    ('010F0000-EEEE-4EEE-8EEE-00000000000B', @now, @e1_prelimScore, @judge1Id, '01030000-EEEE-4EEE-8EEE-000000000001', @e1_prelimSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-000000000006', 0),
    ('010F0000-EEEE-4EEE-8EEE-00000000000C', @now, @e1_prelimScore, @judge2Id, '01030000-EEEE-4EEE-8EEE-000000000001', @e1_prelimSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-000000000006', 0),
    ('010F0000-EEEE-4EEE-8EEE-00000000000D', @now, @e1_prelimScore, @judge1Id, '01030000-EEEE-4EEE-8EEE-000000000001', @e1_prelimSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-000000000007', 0),
    ('010F0000-EEEE-4EEE-8EEE-00000000000E', @now, @e1_prelimScore, @judge2Id, '01030000-EEEE-4EEE-8EEE-000000000001', @e1_prelimSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-000000000007', 0),
    ('010F0000-EEEE-4EEE-8EEE-00000000000F', @now, @e1_prelimScore, @judge1Id, '01030000-EEEE-4EEE-8EEE-000000000001', @e1_prelimSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-000000000008', 0),
    ('010F0000-EEEE-4EEE-8EEE-000000000010', @now, @e1_prelimScore, @judge2Id, '01030000-EEEE-4EEE-8EEE-000000000001', @e1_prelimSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-000000000008', 0),
    ('010F0000-EEEE-4EEE-8EEE-000000000011', @now, @e1_prelimScore, @judge1Id, '01030000-EEEE-4EEE-8EEE-000000000001', @e1_prelimSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-000000000009', 0),
    ('010F0000-EEEE-4EEE-8EEE-000000000012', @now, @e1_prelimScore, @judge2Id, '01030000-EEEE-4EEE-8EEE-000000000001', @e1_prelimSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-000000000009', 0),
    ('010F0000-EEEE-4EEE-8EEE-000000000013', @now, @e1_finalScore, @judge1Id, '01030000-EEEE-4EEE-8EEE-000000000002', @e1_finalSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-00000000000A', 0),
    ('010F0000-EEEE-4EEE-8EEE-000000000014', @now, @e1_finalScore, @judge2Id, '01030000-EEEE-4EEE-8EEE-000000000002', @e1_finalSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-00000000000A', 0),
    ('010F0000-EEEE-4EEE-8EEE-000000000015', @now, @e1_finalScore, @judge1Id, '01030000-EEEE-4EEE-8EEE-000000000002', @e1_finalSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-00000000000B', 0),
    ('010F0000-EEEE-4EEE-8EEE-000000000016', @now, @e1_finalScore, @judge2Id, '01030000-EEEE-4EEE-8EEE-000000000002', @e1_finalSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-00000000000B', 0),
    ('010F0000-EEEE-4EEE-8EEE-000000000017', @now, @e1_finalScore, @judge1Id, '01030000-EEEE-4EEE-8EEE-000000000002', @e1_finalSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-00000000000C', 0),
    ('010F0000-EEEE-4EEE-8EEE-000000000018', @now, @e1_finalScore, @judge2Id, '01030000-EEEE-4EEE-8EEE-000000000002', @e1_finalSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-00000000000C', 0),
    ('010F0000-EEEE-4EEE-8EEE-000000000019', @now, @e1_finalScore, @judge1Id, '01030000-EEEE-4EEE-8EEE-000000000002', @e1_finalSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-00000000000D', 0),
    ('010F0000-EEEE-4EEE-8EEE-00000000001A', @now, @e1_finalScore, @judge2Id, '01030000-EEEE-4EEE-8EEE-000000000002', @e1_finalSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-00000000000D', 0),
    ('010F0000-EEEE-4EEE-8EEE-00000000001B', @now, @e1_finalScore, @judge1Id, '01030000-EEEE-4EEE-8EEE-000000000002', @e1_finalSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-00000000000E', 0),
    ('010F0000-EEEE-4EEE-8EEE-00000000001C', @now, @e1_finalScore, @judge2Id, '01030000-EEEE-4EEE-8EEE-000000000002', @e1_finalSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-00000000000E', 0),
    ('010F0000-EEEE-4EEE-8EEE-00000000001D', @now, @e1_finalScore, @judge1Id, '01030000-EEEE-4EEE-8EEE-000000000002', @e1_finalSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-00000000000F', 0),
    ('010F0000-EEEE-4EEE-8EEE-00000000001E', @now, @e1_finalScore, @judge2Id, '01030000-EEEE-4EEE-8EEE-000000000002', @e1_finalSub, 'COMPLETED', '010D0000-EEEE-4EEE-8EEE-00000000000F', 0);

INSERT INTO judge_score_details (id, created_at, criteria_id, score, judge_score_id) VALUES
    ('010E0000-EEEE-4EEE-8EEE-000000000001', @now, '01060000-EEEE-4EEE-8EEE-000000000001', 5, '010F0000-EEEE-4EEE-8EEE-000000000001'),
    ('010E0000-EEEE-4EEE-8EEE-000000000002', @now, '01060000-EEEE-4EEE-8EEE-000000000002', 5, '010F0000-EEEE-4EEE-8EEE-000000000001'),
    ('010E0000-EEEE-4EEE-8EEE-000000000003', @now, '01060000-EEEE-4EEE-8EEE-000000000003', 5, '010F0000-EEEE-4EEE-8EEE-000000000001'),
    ('010E0000-EEEE-4EEE-8EEE-000000000004', @now, '01060000-EEEE-4EEE-8EEE-000000000004', 4, '010F0000-EEEE-4EEE-8EEE-000000000001'),
    ('010E0000-EEEE-4EEE-8EEE-000000000005', @now, '01060000-EEEE-4EEE-8EEE-000000000005', 5, '010F0000-EEEE-4EEE-8EEE-000000000001'),
    ('010E0000-EEEE-4EEE-8EEE-000000000006', @now, '01060000-EEEE-4EEE-8EEE-000000000001', 4, '010F0000-EEEE-4EEE-8EEE-000000000002'),
    ('010E0000-EEEE-4EEE-8EEE-000000000007', @now, '01060000-EEEE-4EEE-8EEE-000000000002', 5, '010F0000-EEEE-4EEE-8EEE-000000000002'),
    ('010E0000-EEEE-4EEE-8EEE-000000000008', @now, '01060000-EEEE-4EEE-8EEE-000000000003', 4, '010F0000-EEEE-4EEE-8EEE-000000000002'),
    ('010E0000-EEEE-4EEE-8EEE-000000000009', @now, '01060000-EEEE-4EEE-8EEE-000000000004', 4, '010F0000-EEEE-4EEE-8EEE-000000000002'),
    ('010E0000-EEEE-4EEE-8EEE-00000000000A', @now, '01060000-EEEE-4EEE-8EEE-000000000005', 4, '010F0000-EEEE-4EEE-8EEE-000000000002'),
    ('010E0000-EEEE-4EEE-8EEE-00000000000B', @now, '01060000-EEEE-4EEE-8EEE-000000000001', 5, '010F0000-EEEE-4EEE-8EEE-000000000003'),
    ('010E0000-EEEE-4EEE-8EEE-00000000000C', @now, '01060000-EEEE-4EEE-8EEE-000000000002', 4, '010F0000-EEEE-4EEE-8EEE-000000000003'),
    ('010E0000-EEEE-4EEE-8EEE-00000000000D', @now, '01060000-EEEE-4EEE-8EEE-000000000003', 5, '010F0000-EEEE-4EEE-8EEE-000000000003'),
    ('010E0000-EEEE-4EEE-8EEE-00000000000E', @now, '01060000-EEEE-4EEE-8EEE-000000000004', 4, '010F0000-EEEE-4EEE-8EEE-000000000003'),
    ('010E0000-EEEE-4EEE-8EEE-00000000000F', @now, '01060000-EEEE-4EEE-8EEE-000000000005', 4, '010F0000-EEEE-4EEE-8EEE-000000000003'),
    ('010E0000-EEEE-4EEE-8EEE-000000000010', @now, '01060000-EEEE-4EEE-8EEE-000000000001', 5, '010F0000-EEEE-4EEE-8EEE-000000000004'),
    ('010E0000-EEEE-4EEE-8EEE-000000000011', @now, '01060000-EEEE-4EEE-8EEE-000000000002', 4, '010F0000-EEEE-4EEE-8EEE-000000000004'),
    ('010E0000-EEEE-4EEE-8EEE-000000000012', @now, '01060000-EEEE-4EEE-8EEE-000000000003', 5, '010F0000-EEEE-4EEE-8EEE-000000000004'),
    ('010E0000-EEEE-4EEE-8EEE-000000000013', @now, '01060000-EEEE-4EEE-8EEE-000000000004', 4, '010F0000-EEEE-4EEE-8EEE-000000000004'),
    ('010E0000-EEEE-4EEE-8EEE-000000000014', @now, '01060000-EEEE-4EEE-8EEE-000000000005', 4, '010F0000-EEEE-4EEE-8EEE-000000000004'),
    ('010E0000-EEEE-4EEE-8EEE-000000000015', @now, '01060000-EEEE-4EEE-8EEE-000000000001', 4, '010F0000-EEEE-4EEE-8EEE-000000000005'),
    ('010E0000-EEEE-4EEE-8EEE-000000000016', @now, '01060000-EEEE-4EEE-8EEE-000000000002', 5, '010F0000-EEEE-4EEE-8EEE-000000000005'),
    ('010E0000-EEEE-4EEE-8EEE-000000000017', @now, '01060000-EEEE-4EEE-8EEE-000000000003', 4, '010F0000-EEEE-4EEE-8EEE-000000000005'),
    ('010E0000-EEEE-4EEE-8EEE-000000000018', @now, '01060000-EEEE-4EEE-8EEE-000000000004', 4, '010F0000-EEEE-4EEE-8EEE-000000000005'),
    ('010E0000-EEEE-4EEE-8EEE-000000000019', @now, '01060000-EEEE-4EEE-8EEE-000000000005', 4, '010F0000-EEEE-4EEE-8EEE-000000000005'),
    ('010E0000-EEEE-4EEE-8EEE-00000000001A', @now, '01060000-EEEE-4EEE-8EEE-000000000001', 3, '010F0000-EEEE-4EEE-8EEE-000000000006'),
    ('010E0000-EEEE-4EEE-8EEE-00000000001B', @now, '01060000-EEEE-4EEE-8EEE-000000000002', 5, '010F0000-EEEE-4EEE-8EEE-000000000006'),
    ('010E0000-EEEE-4EEE-8EEE-00000000001C', @now, '01060000-EEEE-4EEE-8EEE-000000000003', 3, '010F0000-EEEE-4EEE-8EEE-000000000006'),
    ('010E0000-EEEE-4EEE-8EEE-00000000001D', @now, '01060000-EEEE-4EEE-8EEE-000000000004', 4, '010F0000-EEEE-4EEE-8EEE-000000000006'),
    ('010E0000-EEEE-4EEE-8EEE-00000000001E', @now, '01060000-EEEE-4EEE-8EEE-000000000005', 3, '010F0000-EEEE-4EEE-8EEE-000000000006'),
    ('010E0000-EEEE-4EEE-8EEE-00000000001F', @now, '01060000-EEEE-4EEE-8EEE-000000000001', 4, '010F0000-EEEE-4EEE-8EEE-000000000007'),
    ('010E0000-EEEE-4EEE-8EEE-000000000020', @now, '01060000-EEEE-4EEE-8EEE-000000000002', 4, '010F0000-EEEE-4EEE-8EEE-000000000007'),
    ('010E0000-EEEE-4EEE-8EEE-000000000021', @now, '01060000-EEEE-4EEE-8EEE-000000000003', 4, '010F0000-EEEE-4EEE-8EEE-000000000007'),
    ('010E0000-EEEE-4EEE-8EEE-000000000022', @now, '01060000-EEEE-4EEE-8EEE-000000000004', 5, '010F0000-EEEE-4EEE-8EEE-000000000007'),
    ('010E0000-EEEE-4EEE-8EEE-000000000023', @now, '01060000-EEEE-4EEE-8EEE-000000000005', 4, '010F0000-EEEE-4EEE-8EEE-000000000007'),
    ('010E0000-EEEE-4EEE-8EEE-000000000024', @now, '01060000-EEEE-4EEE-8EEE-000000000001', 4, '010F0000-EEEE-4EEE-8EEE-000000000008'),
    ('010E0000-EEEE-4EEE-8EEE-000000000025', @now, '01060000-EEEE-4EEE-8EEE-000000000002', 4, '010F0000-EEEE-4EEE-8EEE-000000000008'),
    ('010E0000-EEEE-4EEE-8EEE-000000000026', @now, '01060000-EEEE-4EEE-8EEE-000000000003', 4, '010F0000-EEEE-4EEE-8EEE-000000000008'),
    ('010E0000-EEEE-4EEE-8EEE-000000000027', @now, '01060000-EEEE-4EEE-8EEE-000000000004', 5, '010F0000-EEEE-4EEE-8EEE-000000000008'),
    ('010E0000-EEEE-4EEE-8EEE-000000000028', @now, '01060000-EEEE-4EEE-8EEE-000000000005', 4, '010F0000-EEEE-4EEE-8EEE-000000000008'),
    ('010E0000-EEEE-4EEE-8EEE-000000000029', @now, '01060000-EEEE-4EEE-8EEE-000000000001', 4, '010F0000-EEEE-4EEE-8EEE-000000000009'),
    ('010E0000-EEEE-4EEE-8EEE-00000000002A', @now, '01060000-EEEE-4EEE-8EEE-000000000002', 4, '010F0000-EEEE-4EEE-8EEE-000000000009'),
    ('010E0000-EEEE-4EEE-8EEE-00000000002B', @now, '01060000-EEEE-4EEE-8EEE-000000000003', 4, '010F0000-EEEE-4EEE-8EEE-000000000009'),
    ('010E0000-EEEE-4EEE-8EEE-00000000002C', @now, '01060000-EEEE-4EEE-8EEE-000000000004', 3, '010F0000-EEEE-4EEE-8EEE-000000000009'),
    ('010E0000-EEEE-4EEE-8EEE-00000000002D', @now, '01060000-EEEE-4EEE-8EEE-000000000005', 4, '010F0000-EEEE-4EEE-8EEE-000000000009'),
    ('010E0000-EEEE-4EEE-8EEE-00000000002E', @now, '01060000-EEEE-4EEE-8EEE-000000000001', 3, '010F0000-EEEE-4EEE-8EEE-00000000000A'),
    ('010E0000-EEEE-4EEE-8EEE-00000000002F', @now, '01060000-EEEE-4EEE-8EEE-000000000002', 4, '010F0000-EEEE-4EEE-8EEE-00000000000A'),
    ('010E0000-EEEE-4EEE-8EEE-000000000030', @now, '01060000-EEEE-4EEE-8EEE-000000000003', 3, '010F0000-EEEE-4EEE-8EEE-00000000000A'),
    ('010E0000-EEEE-4EEE-8EEE-000000000031', @now, '01060000-EEEE-4EEE-8EEE-000000000004', 3, '010F0000-EEEE-4EEE-8EEE-00000000000A'),
    ('010E0000-EEEE-4EEE-8EEE-000000000032', @now, '01060000-EEEE-4EEE-8EEE-000000000005', 3, '010F0000-EEEE-4EEE-8EEE-00000000000A'),
    ('010E0000-EEEE-4EEE-8EEE-000000000033', @now, '01060000-EEEE-4EEE-8EEE-000000000001', 4, '010F0000-EEEE-4EEE-8EEE-00000000000B'),
    ('010E0000-EEEE-4EEE-8EEE-000000000034', @now, '01060000-EEEE-4EEE-8EEE-000000000002', 3, '010F0000-EEEE-4EEE-8EEE-00000000000B'),
    ('010E0000-EEEE-4EEE-8EEE-000000000035', @now, '01060000-EEEE-4EEE-8EEE-000000000003', 4, '010F0000-EEEE-4EEE-8EEE-00000000000B'),
    ('010E0000-EEEE-4EEE-8EEE-000000000036', @now, '01060000-EEEE-4EEE-8EEE-000000000004', 4, '010F0000-EEEE-4EEE-8EEE-00000000000B'),
    ('010E0000-EEEE-4EEE-8EEE-000000000037', @now, '01060000-EEEE-4EEE-8EEE-000000000005', 3, '010F0000-EEEE-4EEE-8EEE-00000000000B'),
    ('010E0000-EEEE-4EEE-8EEE-000000000038', @now, '01060000-EEEE-4EEE-8EEE-000000000001', 4, '010F0000-EEEE-4EEE-8EEE-00000000000C'),
    ('010E0000-EEEE-4EEE-8EEE-000000000039', @now, '01060000-EEEE-4EEE-8EEE-000000000002', 3, '010F0000-EEEE-4EEE-8EEE-00000000000C'),
    ('010E0000-EEEE-4EEE-8EEE-00000000003A', @now, '01060000-EEEE-4EEE-8EEE-000000000003', 4, '010F0000-EEEE-4EEE-8EEE-00000000000C'),
    ('010E0000-EEEE-4EEE-8EEE-00000000003B', @now, '01060000-EEEE-4EEE-8EEE-000000000004', 4, '010F0000-EEEE-4EEE-8EEE-00000000000C'),
    ('010E0000-EEEE-4EEE-8EEE-00000000003C', @now, '01060000-EEEE-4EEE-8EEE-000000000005', 3, '010F0000-EEEE-4EEE-8EEE-00000000000C'),
    ('010E0000-EEEE-4EEE-8EEE-00000000003D', @now, '01060000-EEEE-4EEE-8EEE-000000000001', 3, '010F0000-EEEE-4EEE-8EEE-00000000000D'),
    ('010E0000-EEEE-4EEE-8EEE-00000000003E', @now, '01060000-EEEE-4EEE-8EEE-000000000002', 4, '010F0000-EEEE-4EEE-8EEE-00000000000D'),
    ('010E0000-EEEE-4EEE-8EEE-00000000003F', @now, '01060000-EEEE-4EEE-8EEE-000000000003', 3, '010F0000-EEEE-4EEE-8EEE-00000000000D'),
    ('010E0000-EEEE-4EEE-8EEE-000000000040', @now, '01060000-EEEE-4EEE-8EEE-000000000004', 3, '010F0000-EEEE-4EEE-8EEE-00000000000D'),
    ('010E0000-EEEE-4EEE-8EEE-000000000041', @now, '01060000-EEEE-4EEE-8EEE-000000000005', 4, '010F0000-EEEE-4EEE-8EEE-00000000000D'),
    ('010E0000-EEEE-4EEE-8EEE-000000000042', @now, '01060000-EEEE-4EEE-8EEE-000000000001', 2, '010F0000-EEEE-4EEE-8EEE-00000000000E'),
    ('010E0000-EEEE-4EEE-8EEE-000000000043', @now, '01060000-EEEE-4EEE-8EEE-000000000002', 4, '010F0000-EEEE-4EEE-8EEE-00000000000E'),
    ('010E0000-EEEE-4EEE-8EEE-000000000044', @now, '01060000-EEEE-4EEE-8EEE-000000000003', 2, '010F0000-EEEE-4EEE-8EEE-00000000000E'),
    ('010E0000-EEEE-4EEE-8EEE-000000000045', @now, '01060000-EEEE-4EEE-8EEE-000000000004', 3, '010F0000-EEEE-4EEE-8EEE-00000000000E'),
    ('010E0000-EEEE-4EEE-8EEE-000000000046', @now, '01060000-EEEE-4EEE-8EEE-000000000005', 3, '010F0000-EEEE-4EEE-8EEE-00000000000E'),
    ('010E0000-EEEE-4EEE-8EEE-000000000047', @now, '01060000-EEEE-4EEE-8EEE-000000000001', 3, '010F0000-EEEE-4EEE-8EEE-00000000000F'),
    ('010E0000-EEEE-4EEE-8EEE-000000000048', @now, '01060000-EEEE-4EEE-8EEE-000000000002', 3, '010F0000-EEEE-4EEE-8EEE-00000000000F'),
    ('010E0000-EEEE-4EEE-8EEE-000000000049', @now, '01060000-EEEE-4EEE-8EEE-000000000003', 3, '010F0000-EEEE-4EEE-8EEE-00000000000F'),
    ('010E0000-EEEE-4EEE-8EEE-00000000004A', @now, '01060000-EEEE-4EEE-8EEE-000000000004', 4, '010F0000-EEEE-4EEE-8EEE-00000000000F'),
    ('010E0000-EEEE-4EEE-8EEE-00000000004B', @now, '01060000-EEEE-4EEE-8EEE-000000000005', 3, '010F0000-EEEE-4EEE-8EEE-00000000000F'),
    ('010E0000-EEEE-4EEE-8EEE-00000000004C', @now, '01060000-EEEE-4EEE-8EEE-000000000001', 3, '010F0000-EEEE-4EEE-8EEE-000000000010'),
    ('010E0000-EEEE-4EEE-8EEE-00000000004D', @now, '01060000-EEEE-4EEE-8EEE-000000000002', 3, '010F0000-EEEE-4EEE-8EEE-000000000010'),
    ('010E0000-EEEE-4EEE-8EEE-00000000004E', @now, '01060000-EEEE-4EEE-8EEE-000000000003', 3, '010F0000-EEEE-4EEE-8EEE-000000000010'),
    ('010E0000-EEEE-4EEE-8EEE-00000000004F', @now, '01060000-EEEE-4EEE-8EEE-000000000004', 4, '010F0000-EEEE-4EEE-8EEE-000000000010'),
    ('010E0000-EEEE-4EEE-8EEE-000000000050', @now, '01060000-EEEE-4EEE-8EEE-000000000005', 3, '010F0000-EEEE-4EEE-8EEE-000000000010'),
    ('010E0000-EEEE-4EEE-8EEE-000000000051', @now, '01060000-EEEE-4EEE-8EEE-000000000001', 3, '010F0000-EEEE-4EEE-8EEE-000000000011'),
    ('010E0000-EEEE-4EEE-8EEE-000000000052', @now, '01060000-EEEE-4EEE-8EEE-000000000002', 3, '010F0000-EEEE-4EEE-8EEE-000000000011'),
    ('010E0000-EEEE-4EEE-8EEE-000000000053', @now, '01060000-EEEE-4EEE-8EEE-000000000003', 2, '010F0000-EEEE-4EEE-8EEE-000000000011'),
    ('010E0000-EEEE-4EEE-8EEE-000000000054', @now, '01060000-EEEE-4EEE-8EEE-000000000004', 3, '010F0000-EEEE-4EEE-8EEE-000000000011'),
    ('010E0000-EEEE-4EEE-8EEE-000000000055', @now, '01060000-EEEE-4EEE-8EEE-000000000005', 3, '010F0000-EEEE-4EEE-8EEE-000000000011'),
    ('010E0000-EEEE-4EEE-8EEE-000000000056', @now, '01060000-EEEE-4EEE-8EEE-000000000001', 2, '010F0000-EEEE-4EEE-8EEE-000000000012'),
    ('010E0000-EEEE-4EEE-8EEE-000000000057', @now, '01060000-EEEE-4EEE-8EEE-000000000002', 3, '010F0000-EEEE-4EEE-8EEE-000000000012'),
    ('010E0000-EEEE-4EEE-8EEE-000000000058', @now, '01060000-EEEE-4EEE-8EEE-000000000003', 1, '010F0000-EEEE-4EEE-8EEE-000000000012'),
    ('010E0000-EEEE-4EEE-8EEE-000000000059', @now, '01060000-EEEE-4EEE-8EEE-000000000004', 3, '010F0000-EEEE-4EEE-8EEE-000000000012'),
    ('010E0000-EEEE-4EEE-8EEE-00000000005A', @now, '01060000-EEEE-4EEE-8EEE-000000000005', 2, '010F0000-EEEE-4EEE-8EEE-000000000012'),
    ('010E0000-EEEE-4EEE-8EEE-00000000005B', @now, '01060000-EEEE-4EEE-8EEE-00000000000B', 5, '010F0000-EEEE-4EEE-8EEE-000000000013'),
    ('010E0000-EEEE-4EEE-8EEE-00000000005C', @now, '01060000-EEEE-4EEE-8EEE-00000000000C', 5, '010F0000-EEEE-4EEE-8EEE-000000000013'),
    ('010E0000-EEEE-4EEE-8EEE-00000000005D', @now, '01060000-EEEE-4EEE-8EEE-00000000000D', 5, '010F0000-EEEE-4EEE-8EEE-000000000013'),
    ('010E0000-EEEE-4EEE-8EEE-00000000005E', @now, '01060000-EEEE-4EEE-8EEE-00000000000E', 5, '010F0000-EEEE-4EEE-8EEE-000000000013'),
    ('010E0000-EEEE-4EEE-8EEE-00000000005F', @now, '01060000-EEEE-4EEE-8EEE-00000000000F', 4, '010F0000-EEEE-4EEE-8EEE-000000000013'),
    ('010E0000-EEEE-4EEE-8EEE-000000000060', @now, '01060000-EEEE-4EEE-8EEE-00000000000B', 5, '010F0000-EEEE-4EEE-8EEE-000000000014'),
    ('010E0000-EEEE-4EEE-8EEE-000000000061', @now, '01060000-EEEE-4EEE-8EEE-00000000000C', 5, '010F0000-EEEE-4EEE-8EEE-000000000014'),
    ('010E0000-EEEE-4EEE-8EEE-000000000062', @now, '01060000-EEEE-4EEE-8EEE-00000000000D', 5, '010F0000-EEEE-4EEE-8EEE-000000000014'),
    ('010E0000-EEEE-4EEE-8EEE-000000000063', @now, '01060000-EEEE-4EEE-8EEE-00000000000E', 5, '010F0000-EEEE-4EEE-8EEE-000000000014'),
    ('010E0000-EEEE-4EEE-8EEE-000000000064', @now, '01060000-EEEE-4EEE-8EEE-00000000000F', 4, '010F0000-EEEE-4EEE-8EEE-000000000014'),
    ('010E0000-EEEE-4EEE-8EEE-000000000065', @now, '01060000-EEEE-4EEE-8EEE-00000000000B', 5, '010F0000-EEEE-4EEE-8EEE-000000000015'),
    ('010E0000-EEEE-4EEE-8EEE-000000000066', @now, '01060000-EEEE-4EEE-8EEE-00000000000C', 4, '010F0000-EEEE-4EEE-8EEE-000000000015'),
    ('010E0000-EEEE-4EEE-8EEE-000000000067', @now, '01060000-EEEE-4EEE-8EEE-00000000000D', 5, '010F0000-EEEE-4EEE-8EEE-000000000015'),
    ('010E0000-EEEE-4EEE-8EEE-000000000068', @now, '01060000-EEEE-4EEE-8EEE-00000000000E', 4, '010F0000-EEEE-4EEE-8EEE-000000000015'),
    ('010E0000-EEEE-4EEE-8EEE-000000000069', @now, '01060000-EEEE-4EEE-8EEE-00000000000F', 5, '010F0000-EEEE-4EEE-8EEE-000000000015'),
    ('010E0000-EEEE-4EEE-8EEE-00000000006A', @now, '01060000-EEEE-4EEE-8EEE-00000000000B', 4, '010F0000-EEEE-4EEE-8EEE-000000000016'),
    ('010E0000-EEEE-4EEE-8EEE-00000000006B', @now, '01060000-EEEE-4EEE-8EEE-00000000000C', 4, '010F0000-EEEE-4EEE-8EEE-000000000016'),
    ('010E0000-EEEE-4EEE-8EEE-00000000006C', @now, '01060000-EEEE-4EEE-8EEE-00000000000D', 4, '010F0000-EEEE-4EEE-8EEE-000000000016'),
    ('010E0000-EEEE-4EEE-8EEE-00000000006D', @now, '01060000-EEEE-4EEE-8EEE-00000000000E', 4, '010F0000-EEEE-4EEE-8EEE-000000000016'),
    ('010E0000-EEEE-4EEE-8EEE-00000000006E', @now, '01060000-EEEE-4EEE-8EEE-00000000000F', 4, '010F0000-EEEE-4EEE-8EEE-000000000016'),
    ('010E0000-EEEE-4EEE-8EEE-00000000006F', @now, '01060000-EEEE-4EEE-8EEE-00000000000B', 4, '010F0000-EEEE-4EEE-8EEE-000000000017'),
    ('010E0000-EEEE-4EEE-8EEE-000000000070', @now, '01060000-EEEE-4EEE-8EEE-00000000000C', 5, '010F0000-EEEE-4EEE-8EEE-000000000017'),
    ('010E0000-EEEE-4EEE-8EEE-000000000071', @now, '01060000-EEEE-4EEE-8EEE-00000000000D', 4, '010F0000-EEEE-4EEE-8EEE-000000000017'),
    ('010E0000-EEEE-4EEE-8EEE-000000000072', @now, '01060000-EEEE-4EEE-8EEE-00000000000E', 5, '010F0000-EEEE-4EEE-8EEE-000000000017'),
    ('010E0000-EEEE-4EEE-8EEE-000000000073', @now, '01060000-EEEE-4EEE-8EEE-00000000000F', 4, '010F0000-EEEE-4EEE-8EEE-000000000017'),
    ('010E0000-EEEE-4EEE-8EEE-000000000074', @now, '01060000-EEEE-4EEE-8EEE-00000000000B', 4, '010F0000-EEEE-4EEE-8EEE-000000000018'),
    ('010E0000-EEEE-4EEE-8EEE-000000000075', @now, '01060000-EEEE-4EEE-8EEE-00000000000C', 5, '010F0000-EEEE-4EEE-8EEE-000000000018'),
    ('010E0000-EEEE-4EEE-8EEE-000000000076', @now, '01060000-EEEE-4EEE-8EEE-00000000000D', 4, '010F0000-EEEE-4EEE-8EEE-000000000018'),
    ('010E0000-EEEE-4EEE-8EEE-000000000077', @now, '01060000-EEEE-4EEE-8EEE-00000000000E', 5, '010F0000-EEEE-4EEE-8EEE-000000000018'),
    ('010E0000-EEEE-4EEE-8EEE-000000000078', @now, '01060000-EEEE-4EEE-8EEE-00000000000F', 4, '010F0000-EEEE-4EEE-8EEE-000000000018'),
    ('010E0000-EEEE-4EEE-8EEE-000000000079', @now, '01060000-EEEE-4EEE-8EEE-00000000000B', 4, '010F0000-EEEE-4EEE-8EEE-000000000019'),
    ('010E0000-EEEE-4EEE-8EEE-00000000007A', @now, '01060000-EEEE-4EEE-8EEE-00000000000C', 4, '010F0000-EEEE-4EEE-8EEE-000000000019'),
    ('010E0000-EEEE-4EEE-8EEE-00000000007B', @now, '01060000-EEEE-4EEE-8EEE-00000000000D', 5, '010F0000-EEEE-4EEE-8EEE-000000000019'),
    ('010E0000-EEEE-4EEE-8EEE-00000000007C', @now, '01060000-EEEE-4EEE-8EEE-00000000000E', 4, '010F0000-EEEE-4EEE-8EEE-000000000019'),
    ('010E0000-EEEE-4EEE-8EEE-00000000007D', @now, '01060000-EEEE-4EEE-8EEE-00000000000F', 4, '010F0000-EEEE-4EEE-8EEE-000000000019'),
    ('010E0000-EEEE-4EEE-8EEE-00000000007E', @now, '01060000-EEEE-4EEE-8EEE-00000000000B', 3, '010F0000-EEEE-4EEE-8EEE-00000000001A'),
    ('010E0000-EEEE-4EEE-8EEE-00000000007F', @now, '01060000-EEEE-4EEE-8EEE-00000000000C', 4, '010F0000-EEEE-4EEE-8EEE-00000000001A'),
    ('010E0000-EEEE-4EEE-8EEE-000000000080', @now, '01060000-EEEE-4EEE-8EEE-00000000000D', 4, '010F0000-EEEE-4EEE-8EEE-00000000001A'),
    ('010E0000-EEEE-4EEE-8EEE-000000000081', @now, '01060000-EEEE-4EEE-8EEE-00000000000E', 4, '010F0000-EEEE-4EEE-8EEE-00000000001A'),
    ('010E0000-EEEE-4EEE-8EEE-000000000082', @now, '01060000-EEEE-4EEE-8EEE-00000000000F', 3, '010F0000-EEEE-4EEE-8EEE-00000000001A'),
    ('010E0000-EEEE-4EEE-8EEE-000000000083', @now, '01060000-EEEE-4EEE-8EEE-00000000000B', 4, '010F0000-EEEE-4EEE-8EEE-00000000001B'),
    ('010E0000-EEEE-4EEE-8EEE-000000000084', @now, '01060000-EEEE-4EEE-8EEE-00000000000C', 4, '010F0000-EEEE-4EEE-8EEE-00000000001B'),
    ('010E0000-EEEE-4EEE-8EEE-000000000085', @now, '01060000-EEEE-4EEE-8EEE-00000000000D', 4, '010F0000-EEEE-4EEE-8EEE-00000000001B'),
    ('010E0000-EEEE-4EEE-8EEE-000000000086', @now, '01060000-EEEE-4EEE-8EEE-00000000000E', 4, '010F0000-EEEE-4EEE-8EEE-00000000001B'),
    ('010E0000-EEEE-4EEE-8EEE-000000000087', @now, '01060000-EEEE-4EEE-8EEE-00000000000F', 3, '010F0000-EEEE-4EEE-8EEE-00000000001B'),
    ('010E0000-EEEE-4EEE-8EEE-000000000088', @now, '01060000-EEEE-4EEE-8EEE-00000000000B', 4, '010F0000-EEEE-4EEE-8EEE-00000000001C'),
    ('010E0000-EEEE-4EEE-8EEE-000000000089', @now, '01060000-EEEE-4EEE-8EEE-00000000000C', 4, '010F0000-EEEE-4EEE-8EEE-00000000001C'),
    ('010E0000-EEEE-4EEE-8EEE-00000000008A', @now, '01060000-EEEE-4EEE-8EEE-00000000000D', 4, '010F0000-EEEE-4EEE-8EEE-00000000001C'),
    ('010E0000-EEEE-4EEE-8EEE-00000000008B', @now, '01060000-EEEE-4EEE-8EEE-00000000000E', 4, '010F0000-EEEE-4EEE-8EEE-00000000001C'),
    ('010E0000-EEEE-4EEE-8EEE-00000000008C', @now, '01060000-EEEE-4EEE-8EEE-00000000000F', 3, '010F0000-EEEE-4EEE-8EEE-00000000001C'),
    ('010E0000-EEEE-4EEE-8EEE-00000000008D', @now, '01060000-EEEE-4EEE-8EEE-00000000000B', 3, '010F0000-EEEE-4EEE-8EEE-00000000001D'),
    ('010E0000-EEEE-4EEE-8EEE-00000000008E', @now, '01060000-EEEE-4EEE-8EEE-00000000000C', 4, '010F0000-EEEE-4EEE-8EEE-00000000001D'),
    ('010E0000-EEEE-4EEE-8EEE-00000000008F', @now, '01060000-EEEE-4EEE-8EEE-00000000000D', 4, '010F0000-EEEE-4EEE-8EEE-00000000001D'),
    ('010E0000-EEEE-4EEE-8EEE-000000000090', @now, '01060000-EEEE-4EEE-8EEE-00000000000E', 4, '010F0000-EEEE-4EEE-8EEE-00000000001D'),
    ('010E0000-EEEE-4EEE-8EEE-000000000091', @now, '01060000-EEEE-4EEE-8EEE-00000000000F', 4, '010F0000-EEEE-4EEE-8EEE-00000000001D'),
    ('010E0000-EEEE-4EEE-8EEE-000000000092', @now, '01060000-EEEE-4EEE-8EEE-00000000000B', 2, '010F0000-EEEE-4EEE-8EEE-00000000001E'),
    ('010E0000-EEEE-4EEE-8EEE-000000000093', @now, '01060000-EEEE-4EEE-8EEE-00000000000C', 4, '010F0000-EEEE-4EEE-8EEE-00000000001E'),
    ('010E0000-EEEE-4EEE-8EEE-000000000094', @now, '01060000-EEEE-4EEE-8EEE-00000000000D', 3, '010F0000-EEEE-4EEE-8EEE-00000000001E'),
    ('010E0000-EEEE-4EEE-8EEE-000000000095', @now, '01060000-EEEE-4EEE-8EEE-00000000000E', 4, '010F0000-EEEE-4EEE-8EEE-00000000001E'),
    ('010E0000-EEEE-4EEE-8EEE-000000000096', @now, '01060000-EEEE-4EEE-8EEE-00000000000F', 3, '010F0000-EEEE-4EEE-8EEE-00000000001E');

INSERT INTO rankings (id, created_at, calculated_at, final_score, rank, round_id, team_id, version, lock_version) VALUES
    ('01100000-EEEE-4EEE-8EEE-000000000001', @now, @e1_prelimScore, 4.5750, 1, '01030000-EEEE-4EEE-8EEE-000000000001', '01050000-EEEE-4EEE-8EEE-000000000001', 1, 0),
    ('01100000-EEEE-4EEE-8EEE-000000000002', @now, @e1_prelimScore, 4.4400, 2, '01030000-EEEE-4EEE-8EEE-000000000001', '01050000-EEEE-4EEE-8EEE-000000000002', 1, 0),
    ('01100000-EEEE-4EEE-8EEE-000000000003', @now, @e1_prelimScore, 4.1300, 3, '01030000-EEEE-4EEE-8EEE-000000000001', '01050000-EEEE-4EEE-8EEE-000000000004', 1, 0),
    ('01100000-EEEE-4EEE-8EEE-000000000004', @now, @e1_prelimScore, 3.9950, 4, '01030000-EEEE-4EEE-8EEE-000000000001', '01050000-EEEE-4EEE-8EEE-000000000003', 1, 0),
    ('01100000-EEEE-4EEE-8EEE-000000000005', @now, @e1_prelimScore, 3.5600, 5, '01030000-EEEE-4EEE-8EEE-000000000001', '01050000-EEEE-4EEE-8EEE-000000000006', 1, 0),
    ('01100000-EEEE-4EEE-8EEE-000000000006', @now, @e1_prelimScore, 3.5250, 6, '01030000-EEEE-4EEE-8EEE-000000000001', '01050000-EEEE-4EEE-8EEE-000000000005', 1, 0),
    ('01100000-EEEE-4EEE-8EEE-000000000007', @now, @e1_prelimScore, 3.0900, 7, '01030000-EEEE-4EEE-8EEE-000000000001', '01050000-EEEE-4EEE-8EEE-000000000008', 1, 0),
    ('01100000-EEEE-4EEE-8EEE-000000000008', @now, @e1_prelimScore, 3.0550, 8, '01030000-EEEE-4EEE-8EEE-000000000001', '01050000-EEEE-4EEE-8EEE-000000000007', 1, 0),
    ('01100000-EEEE-4EEE-8EEE-000000000009', @now, @e1_prelimScore, 2.4950, 9, '01030000-EEEE-4EEE-8EEE-000000000001', '01050000-EEEE-4EEE-8EEE-000000000009', 1, 0);

INSERT INTO rankings (id, created_at, calculated_at, final_score, rank, round_id, team_id, version, lock_version) VALUES
    ('01110000-EEEE-4EEE-8EEE-000000000001', @now, @e1_finalScore, 4.9000, 1, '01030000-EEEE-4EEE-8EEE-000000000002', '01050000-EEEE-4EEE-8EEE-000000000001', 1, 0),
    ('01110000-EEEE-4EEE-8EEE-000000000002', @now, @e1_finalScore, 4.3900, 2, '01030000-EEEE-4EEE-8EEE-000000000002', '01050000-EEEE-4EEE-8EEE-000000000004', 1, 0),
    ('01110000-EEEE-4EEE-8EEE-000000000003', @now, @e1_finalScore, 4.2800, 3, '01030000-EEEE-4EEE-8EEE-000000000002', '01050000-EEEE-4EEE-8EEE-000000000002', 1, 0),
    ('01110000-EEEE-4EEE-8EEE-000000000004', @now, @e1_finalScore, 3.8700, 4, '01030000-EEEE-4EEE-8EEE-000000000002', '01050000-EEEE-4EEE-8EEE-000000000006', 1, 0),
    ('01110000-EEEE-4EEE-8EEE-000000000005', @now, @e1_finalScore, 3.8600, 5, '01030000-EEEE-4EEE-8EEE-000000000002', '01050000-EEEE-4EEE-8EEE-000000000008', 1, 0),
    ('01110000-EEEE-4EEE-8EEE-000000000006', @now, @e1_finalScore, 3.3500, 6, '01030000-EEEE-4EEE-8EEE-000000000002', '01050000-EEEE-4EEE-8EEE-000000000007', 1, 0);

INSERT INTO finalist_selections (id, event_id, team_id, track_id, preliminary_rank, selected_reason, selected_at, created_at, updated_at, selection_method, eligible) VALUES
    ('01120000-EEEE-4EEE-8EEE-000000000001', '01020000-EEEE-4EEE-8EEE-000000000001', '01050000-EEEE-4EEE-8EEE-000000000001', '01040000-EEEE-4EEE-8EEE-000000000001', 1, N'Top 1 in track', @e1_prelimScore, @now, @now, 'AUTO', 1),
    ('01120000-EEEE-4EEE-8EEE-000000000002', '01020000-EEEE-4EEE-8EEE-000000000001', '01050000-EEEE-4EEE-8EEE-000000000002', '01040000-EEEE-4EEE-8EEE-000000000001', 2, N'Top 2 in track', @e1_prelimScore, @now, @now, 'AUTO', 1),
    ('01120000-EEEE-4EEE-8EEE-000000000003', '01020000-EEEE-4EEE-8EEE-000000000001', '01050000-EEEE-4EEE-8EEE-000000000004', '01040000-EEEE-4EEE-8EEE-000000000002', 1, N'Top 1 in track', @e1_prelimScore, @now, @now, 'AUTO', 1),
    ('01120000-EEEE-4EEE-8EEE-000000000004', '01020000-EEEE-4EEE-8EEE-000000000001', '01050000-EEEE-4EEE-8EEE-000000000006', '01040000-EEEE-4EEE-8EEE-000000000002', 2, N'Top 2 in track', @e1_prelimScore, @now, @now, 'AUTO', 1),
    ('01120000-EEEE-4EEE-8EEE-000000000005', '01020000-EEEE-4EEE-8EEE-000000000001', '01050000-EEEE-4EEE-8EEE-000000000008', '01040000-EEEE-4EEE-8EEE-000000000003', 1, N'Top 1 in track', @e1_prelimScore, @now, @now, 'AUTO', 1),
    ('01120000-EEEE-4EEE-8EEE-000000000006', '01020000-EEEE-4EEE-8EEE-000000000001', '01050000-EEEE-4EEE-8EEE-000000000007', '01040000-EEEE-4EEE-8EEE-000000000003', 2, N'Top 2 in track', @e1_prelimScore, @now, @now, 'AUTO', 1);

INSERT INTO published_results (id, created_at, dispute_deadline, published_at, published_by, round_id) VALUES
    ('01130000-EEEE-4EEE-8EEE-000000000001', @now, DATEADD(DAY, 2, @e1_prelimScore), @e1_prelimScore, @coordId, '01030000-EEEE-4EEE-8EEE-000000000001'),
    ('01130000-EEEE-4EEE-8EEE-000000000002', @now, DATEADD(DAY, 2, @e1_finalScore), @e1_finalScore, @coordId, '01030000-EEEE-4EEE-8EEE-000000000002');

INSERT INTO team_awards (id, event_id, team_id, prize_id, awarded_at, created_at, updated_at) VALUES
    ('01140000-EEEE-4EEE-8EEE-000000000001', '01020000-EEEE-4EEE-8EEE-000000000001', '01050000-EEEE-4EEE-8EEE-000000000001', '01070000-EEEE-4EEE-8EEE-000000000001', @e1_finalEnd, @now, @now),
    ('01140000-EEEE-4EEE-8EEE-000000000002', '01020000-EEEE-4EEE-8EEE-000000000001', '01050000-EEEE-4EEE-8EEE-000000000004', '01070000-EEEE-4EEE-8EEE-000000000002', @e1_finalEnd, @now, @now),
    ('01140000-EEEE-4EEE-8EEE-000000000003', '01020000-EEEE-4EEE-8EEE-000000000001', '01050000-EEEE-4EEE-8EEE-000000000002', '01070000-EEEE-4EEE-8EEE-000000000003', @e1_finalEnd, @now, @now),
    ('01140000-EEEE-4EEE-8EEE-000000000004', '01020000-EEEE-4EEE-8EEE-000000000001', '01050000-EEEE-4EEE-8EEE-000000000006', '01070000-EEEE-4EEE-8EEE-000000000004', @e1_finalEnd, @now, @now);

-- ============================================================
-- === SEAL Hackathon Winter 2025 - Multi-hop RAG Agents ===
-- QA phase: COMPLETED end-to-end
-- Login: tran.thanh.ha@fpt.edu.vn or nguyen.hoang.minh@fpt.edu.vn / Demo@123456
-- View: /hackathons/02020000-EEEE-4EEE-8EEE-000000000001/livescore
-- ============================================================

DECLARE @e2_compDay DATE = '2026-01-18';
DECLARE @e2_endDay DATE = '2026-01-18';
DECLARE @e2_compDt DATETIME2 = CAST(@e2_compDay AS DATETIME2);
DECLARE @e2_regOpen DATE = '2025-10-01';
DECLARE @e2_regDeadline DATE = '2025-12-20';
DECLARE @e2_prelimStart DATETIME2 = DATEADD(HOUR, 7, @e2_compDt);
DECLARE @e2_prelimSub DATETIME2 = DATEADD(HOUR, 14, @e2_compDt);
DECLARE @e2_prelimScore DATETIME2 = DATEADD(MINUTE, 15*60+30, @e2_compDt);
DECLARE @e2_finalStart DATETIME2 = DATEADD(MINUTE, 15*60+30, @e2_compDt);
DECLARE @e2_finalSub DATETIME2 = DATEADD(MINUTE, 15*60+30, @e2_compDt);
DECLARE @e2_finalScore DATETIME2 = DATEADD(HOUR, 17, @e2_compDt);
DECLARE @e2_finalEnd DATETIME2 = DATEADD(HOUR, 17, @e2_compDt);

INSERT INTO hackathon_events (
    id, name, season, year, start_date, end_date,
    registration_open_date, registration_deadline,
    description, location, format, competition_format,
    min_team, max_team, semester_min, semester_max,
    scoring_template_id, status, leaderboard_public,
    owner_user_id, created_by, created_at, updated_at
) VALUES (
    '02020000-EEEE-4EEE-8EEE-000000000001',
    N'SEAL Hackathon Winter 2025 - Multi-hop RAG Agents',
    N'Winter', 2025,
    @e2_compDay, @e2_endDay,
    @e2_regOpen, @e2_regDeadline,
    N'SEAL Hackathon Winter 2025 focuses on Agentic RAG systems: grounded retrieval, multi-step agent orchestration, and enterprise-ready copilots built by FPT University teams.',
    N'FPT University HCM', 'OFFLINE', 'SEAL_RAG_2026',
    3, 5, 4, 8,
    @templateId, 'COMPLETED', 1,
    @coordId, N'tran.thanh.ha@fpt.edu.vn', @now, @now
);

INSERT INTO tracks (id, event_id, name, description, max_teams, status, created_at, updated_at) VALUES
    ('02040000-EEEE-4EEE-8EEE-000000000001', '02020000-EEEE-4EEE-8EEE-000000000001', N'Grounded Retrieval', N'SEAL track: Grounded Retrieval', 8, 'OPEN', @now, @now),
    ('02040000-EEEE-4EEE-8EEE-000000000002', '02020000-EEEE-4EEE-8EEE-000000000001', N'Agent Orchestration', N'SEAL track: Agent Orchestration', 8, 'OPEN', @now, @now),
    ('02040000-EEEE-4EEE-8EEE-000000000003', '02020000-EEEE-4EEE-8EEE-000000000001', N'Enterprise Copilot', N'SEAL track: Enterprise Copilot', 8, 'OPEN', @now, @now);

INSERT INTO rounds (
    id, event_id, round_number, name, round_type,
    start_date, end_date, slide_deadline, submission_deadline, scoring_deadline,
    advancement_cutoff, advancement_rule, round_weight, created_at, updated_at
) VALUES
    ('02030000-EEEE-4EEE-8EEE-000000000001', '02020000-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', 'PRELIMINARY',
     @e2_prelimStart, @e2_prelimScore, DATEADD(HOUR, -4, @e2_prelimSub),
     @e2_prelimSub, @e2_prelimScore,
     2, 'PER_TRACK_TOP_N', 40, @now, @now),
    ('02030000-EEEE-4EEE-8EEE-000000000002', '02020000-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', 'FINAL',
     @e2_finalStart, @e2_finalEnd, NULL,
     @e2_finalSub, @e2_finalScore,
     6, 'FINALIST_POOL', 60, @now, @now);

INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at) VALUES
    ('02060000-EEEE-4EEE-8EEE-000000000001', '02030000-EEEE-4EEE-8EEE-000000000001', N'Accuracy and Domain Relevance', N'Accuracy and Domain Relevance', 30, 0, 1, 5, @now, @now),
    ('02060000-EEEE-4EEE-8EEE-000000000002', '02030000-EEEE-4EEE-8EEE-000000000001', N'Agentic RAG Architecture & Algorithm', N'Agentic RAG Architecture & Algorithm', 30, 1, 1, 5, @now, @now),
    ('02060000-EEEE-4EEE-8EEE-000000000003', '02030000-EEEE-4EEE-8EEE-000000000001', N'Ideas & Presentation', N'Ideas & Presentation', 15, 2, 1, 5, @now, @now),
    ('02060000-EEEE-4EEE-8EEE-000000000004', '02030000-EEEE-4EEE-8EEE-000000000001', N'Feasibility & Creativity', N'Feasibility & Creativity', 15, 3, 1, 5, @now, @now),
    ('02060000-EEEE-4EEE-8EEE-000000000005', '02030000-EEEE-4EEE-8EEE-000000000001', N'User Experience & Interactive Interface', N'User Experience & Interactive Interface', 10, 4, 1, 5, @now, @now),
    ('02060000-EEEE-4EEE-8EEE-00000000000B', '02030000-EEEE-4EEE-8EEE-000000000002', N'Data Processing & Retrieval Quality', N'Data Processing & Retrieval Quality', 30, 0, 1, 5, @now, @now),
    ('02060000-EEEE-4EEE-8EEE-00000000000C', '02030000-EEEE-4EEE-8EEE-000000000002', N'Reliability & Hallucination Resistance', N'Reliability & Hallucination Resistance', 20, 1, 1, 5, @now, @now),
    ('02060000-EEEE-4EEE-8EEE-00000000000D', '02030000-EEEE-4EEE-8EEE-000000000002', N'Agent Reasoning & Multi-hop Processing', N'Agent Reasoning & Multi-hop Processing', 20, 2, 1, 5, @now, @now),
    ('02060000-EEEE-4EEE-8EEE-00000000000E', '02030000-EEEE-4EEE-8EEE-000000000002', N'Practicality & Operational Optimization', N'Practicality & Operational Optimization', 20, 3, 1, 5, @now, @now),
    ('02060000-EEEE-4EEE-8EEE-00000000000F', '02030000-EEEE-4EEE-8EEE-000000000002', N'Scalability & Innovation', N'Scalability & Innovation', 10, 4, 1, 5, @now, @now);

INSERT INTO prizes (id, event_id, rank, value, quantity, label, created_at, updated_at) VALUES
    ('02070000-EEEE-4EEE-8EEE-000000000001', '02020000-EEEE-4EEE-8EEE-000000000001', 'FIRST', '7000000', 1, N'First Prize', @now, @now),
    ('02070000-EEEE-4EEE-8EEE-000000000002', '02020000-EEEE-4EEE-8EEE-000000000001', 'SECOND', '5000000', 1, N'Second Prize', @now, @now),
    ('02070000-EEEE-4EEE-8EEE-000000000003', '02020000-EEEE-4EEE-8EEE-000000000001', 'THIRD', '3000000', 1, N'Third Prize', @now, @now),
    ('02070000-EEEE-4EEE-8EEE-000000000004', '02020000-EEEE-4EEE-8EEE-000000000001', 'CONSOLATION', '1500000', 1, N'Consolation Prize', @now, @now);

INSERT INTO event_schedules (id, event_id, type, title, description, start_time, end_time, gate, sort_order, created_at, updated_at) VALUES
    ('02080000-EEEE-4EEE-8EEE-000000000001', '02020000-EEEE-4EEE-8EEE-000000000001', 'WORKSHOP', N'Workshop', NULL, DATEADD(DAY, -3, @e2_compDt), DATEADD(HOUR, 3, DATEADD(DAY, -3, @e2_compDt)), NULL, 0, @now, @now),
    ('02080000-EEEE-4EEE-8EEE-000000000002', '02020000-EEEE-4EEE-8EEE-000000000001', 'OPENING', N'Opening & track draw', N'Teams pick tracks in turn; organizers draw topics per track', DATEADD(DAY, -1, @e2_compDt), DATEADD(HOUR, 3, DATEADD(DAY, -1, @e2_compDt)), NULL, 1, @now, @now),
    ('02080000-EEEE-4EEE-8EEE-000000000003', '02020000-EEEE-4EEE-8EEE-000000000001', 'TRACK_DRAW', N'Track selection draw', NULL, DATEADD(DAY, -1, @e2_compDt), DATEADD(HOUR, 2, DATEADD(DAY, -1, @e2_compDt)), NULL, 2, @now, @now),
    ('02080000-EEEE-4EEE-8EEE-000000000004', '02020000-EEEE-4EEE-8EEE-000000000001', 'MILESTONE', N'Milestone 1 - Idea & architecture completion', N'Design Agentic RAG architecture', @e2_prelimStart, DATEADD(HOUR, 3, @e2_prelimStart), 'SLIDE_SUBMISSION', 3, @now, @now),
    ('02080000-EEEE-4EEE-8EEE-000000000005', '02020000-EEEE-4EEE-8EEE-000000000001', 'MILESTONE', N'Milestone 2 - Pitching & product completion', N'Parallel pitching and coding', DATEADD(HOUR, 3, @e2_prelimStart), @e2_prelimSub, 'DEMO_SUBMISSION', 4, @now, @now),
    ('02080000-EEEE-4EEE-8EEE-000000000006', '02020000-EEEE-4EEE-8EEE-000000000001', 'SCORING', N'Preliminary scoring', N'5-minute presentation + 3-minute Q&A', @e2_prelimSub, @e2_prelimScore, NULL, 5, @now, @now),
    ('02080000-EEEE-4EEE-8EEE-000000000007', '02020000-EEEE-4EEE-8EEE-000000000001', 'FINAL', N'Finals', N'7-minute presentation + 3-minute Q&A - Top 6 teams', @e2_finalStart, @e2_finalEnd, NULL, 6, @now, @now),
    ('02080000-EEEE-4EEE-8EEE-000000000008', '02020000-EEEE-4EEE-8EEE-000000000001', 'CEREMONY', N'Awards & closing ceremony', NULL, @e2_finalEnd, DATEADD(HOUR, 1, @e2_finalEnd), NULL, 7, @now, @now);

INSERT INTO allowed_email_domains (id, event_id, domain, university_label, created_at, updated_at) VALUES
    ('02090000-EEEE-4EEE-8EEE-000000000001', '02020000-EEEE-4EEE-8EEE-000000000001', 'fpt.edu.vn', N'FPT University', @now, @now),
    ('02090000-EEEE-4EEE-8EEE-000000000002', '02020000-EEEE-4EEE-8EEE-000000000001', 'fe.edu.vn', N'FPT Education', @now, @now),
    ('02090000-EEEE-4EEE-8EEE-000000000003', '02020000-EEEE-4EEE-8EEE-000000000001', 'hcmut.edu.vn', N'Ho Chi Minh City University of Technology', @now, @now),
    ('02090000-EEEE-4EEE-8EEE-000000000004', '02020000-EEEE-4EEE-8EEE-000000000001', 'hcmus.edu.vn', N'Vietnam National University Ho Chi Minh City - University of Science', @now, @now),
    ('02090000-EEEE-4EEE-8EEE-000000000005', '02020000-EEEE-4EEE-8EEE-000000000001', 'student.hcmus.edu.vn', N'Vietnam National University Ho Chi Minh City - University of Science', @now, @now),
    ('02090000-EEEE-4EEE-8EEE-000000000006', '02020000-EEEE-4EEE-8EEE-000000000001', 'uit.edu.vn', N'University of Information Technology', @now, @now),
    ('02090000-EEEE-4EEE-8EEE-000000000007', '02020000-EEEE-4EEE-8EEE-000000000001', 'hcmute.edu.vn', N'Ho Chi Minh City University of Education and Technology', @now, @now),
    ('02090000-EEEE-4EEE-8EEE-000000000008', '02020000-EEEE-4EEE-8EEE-000000000001', 'ueh.edu.vn', N'University of Economics Ho Chi Minh City', @now, @now),
    ('02090000-EEEE-4EEE-8EEE-000000000009', '02020000-EEEE-4EEE-8EEE-000000000001', 'student.ueh.edu.vn', N'University of Economics Ho Chi Minh City', @now, @now),
    ('02090000-EEEE-4EEE-8EEE-00000000000A', '02020000-EEEE-4EEE-8EEE-000000000001', 'student.iuh.edu.vn', N'Industrial University of Ho Chi Minh City', @now, @now);

INSERT INTO event_enrollments (id, created_at, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public) VALUES
    ('020A0000-EEEE-4EEE-8EEE-000000000001', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000001', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-000000000002', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000002', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-000000000003', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000003', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-000000000004', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000004', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-000000000005', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000005', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-000000000006', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000006', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-000000000007', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000007', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-000000000008', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000008', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-000000000009', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000009', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000000A', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-00000000000B', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000000B', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-00000000000C', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000000C', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-00000000000D', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000000D', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-00000000000E', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000000E', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-00000000000F', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000000F', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-000000000010', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000010', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-000000000011', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000011', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-000000000012', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000012', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-000000000013', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000013', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-000000000014', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000014', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-000000000015', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000015', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-000000000016', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000016', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-000000000017', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000017', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-000000000018', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000018', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-000000000019', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000019', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-00000000001A', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000001A', 0, 0),
    ('020A0000-EEEE-4EEE-8EEE-00000000001B', @now, @now, '02020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000001B', 0, 0);

INSERT INTO teams (id, created_at, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, is_recruiting, recruitment_note, version) VALUES
    ('02050000-EEEE-4EEE-8EEE-000000000001', @now, '02020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000001', N'MultiHop Lab', 'CONFIRMED', '02040000-EEEE-4EEE-8EEE-000000000001', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Grounded Retrieval track.', 0),
    ('02050000-EEEE-4EEE-8EEE-000000000002', @now, '02020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000004', N'PathFinder AI', 'CONFIRMED', '02040000-EEEE-4EEE-8EEE-000000000001', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Grounded Retrieval track.', 0),
    ('02050000-EEEE-4EEE-8EEE-000000000003', @now, '02020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000007', N'LinkWeaver', 'CONFIRMED', '02040000-EEEE-4EEE-8EEE-000000000001', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Grounded Retrieval track.', 0),
    ('02050000-EEEE-4EEE-8EEE-000000000004', @now, '02020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-00000000000A', N'ReasonStack', 'CONFIRMED', '02040000-EEEE-4EEE-8EEE-000000000002', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Agent Orchestration track.', 0),
    ('02050000-EEEE-4EEE-8EEE-000000000005', @now, '02020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-00000000000D', N'ChainOfThought', 'CONFIRMED', '02040000-EEEE-4EEE-8EEE-000000000002', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Agent Orchestration track.', 0),
    ('02050000-EEEE-4EEE-8EEE-000000000006', @now, '02020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000010', N'QueryRouter', 'CONFIRMED', '02040000-EEEE-4EEE-8EEE-000000000002', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Agent Orchestration track.', 0),
    ('02050000-EEEE-4EEE-8EEE-000000000007', @now, '02020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000013', N'FactBridge', 'CONFIRMED', '02040000-EEEE-4EEE-8EEE-000000000003', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Enterprise Copilot track.', 0),
    ('02050000-EEEE-4EEE-8EEE-000000000008', @now, '02020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000016', N'HopScout', 'CONFIRMED', '02040000-EEEE-4EEE-8EEE-000000000003', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Enterprise Copilot track.', 0),
    ('02050000-EEEE-4EEE-8EEE-000000000009', @now, '02020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000019', N'AnswerTrail', 'CONFIRMED', '02040000-EEEE-4EEE-8EEE-000000000003', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Enterprise Copilot track.', 0);

INSERT INTO team_members (id, created_at, joined_at, role, user_id, team_id, event_id) VALUES
    ('020B0000-EEEE-4EEE-8EEE-000000000001', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000001', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-000000000002', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000002', '02050000-EEEE-4EEE-8EEE-000000000001', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-000000000003', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000003', '02050000-EEEE-4EEE-8EEE-000000000001', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-000000000004', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000004', '02050000-EEEE-4EEE-8EEE-000000000002', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-000000000005', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000005', '02050000-EEEE-4EEE-8EEE-000000000002', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-000000000006', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000006', '02050000-EEEE-4EEE-8EEE-000000000002', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-000000000007', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000007', '02050000-EEEE-4EEE-8EEE-000000000003', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-000000000008', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000008', '02050000-EEEE-4EEE-8EEE-000000000003', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-000000000009', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000009', '02050000-EEEE-4EEE-8EEE-000000000003', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-00000000000A', '02050000-EEEE-4EEE-8EEE-000000000004', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-00000000000B', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-00000000000B', '02050000-EEEE-4EEE-8EEE-000000000004', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-00000000000C', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-00000000000C', '02050000-EEEE-4EEE-8EEE-000000000004', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-00000000000D', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-00000000000D', '02050000-EEEE-4EEE-8EEE-000000000005', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-00000000000E', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-00000000000E', '02050000-EEEE-4EEE-8EEE-000000000005', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-00000000000F', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-00000000000F', '02050000-EEEE-4EEE-8EEE-000000000005', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-000000000010', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000010', '02050000-EEEE-4EEE-8EEE-000000000006', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-000000000011', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000011', '02050000-EEEE-4EEE-8EEE-000000000006', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-000000000012', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000012', '02050000-EEEE-4EEE-8EEE-000000000006', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-000000000013', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000013', '02050000-EEEE-4EEE-8EEE-000000000007', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-000000000014', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000014', '02050000-EEEE-4EEE-8EEE-000000000007', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-000000000015', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000015', '02050000-EEEE-4EEE-8EEE-000000000007', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-000000000016', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000016', '02050000-EEEE-4EEE-8EEE-000000000008', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-000000000017', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000017', '02050000-EEEE-4EEE-8EEE-000000000008', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-000000000018', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000018', '02050000-EEEE-4EEE-8EEE-000000000008', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-000000000019', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000019', '02050000-EEEE-4EEE-8EEE-000000000009', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-00000000001A', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-00000000001A', '02050000-EEEE-4EEE-8EEE-000000000009', '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020B0000-EEEE-4EEE-8EEE-00000000001B', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-00000000001B', '02050000-EEEE-4EEE-8EEE-000000000009', '02020000-EEEE-4EEE-8EEE-000000000001');

INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id) VALUES
    ('020C0000-EEEE-4EEE-8EEE-000000000001', @now, @now, @judge1Id, '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020C0000-EEEE-4EEE-8EEE-000000000002', @now, @now, @judge2Id, '02020000-EEEE-4EEE-8EEE-000000000001'),
    ('020C0000-EEEE-4EEE-8EEE-000000000008', @now, @now, @judge3Id, '02020000-EEEE-4EEE-8EEE-000000000001');
INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active) VALUES
    ('020C0000-EEEE-4EEE-8EEE-000000000003', @now, @now, @judge1Id, '02030000-EEEE-4EEE-8EEE-000000000001', 'ROUND', 1),
    ('020C0000-EEEE-4EEE-8EEE-000000000004', @now, @now, @judge2Id, '02030000-EEEE-4EEE-8EEE-000000000001', 'ROUND', 1),
    ('020C0000-EEEE-4EEE-8EEE-000000000009', @now, @now, @judge3Id, '02030000-EEEE-4EEE-8EEE-000000000001', 'ROUND', 1),
    ('020C0000-EEEE-4EEE-8EEE-000000000005', @now, @now, @judge1Id, '02030000-EEEE-4EEE-8EEE-000000000002', 'ROUND', 1),
    ('020C0000-EEEE-4EEE-8EEE-000000000006', @now, @now, @judge2Id, '02030000-EEEE-4EEE-8EEE-000000000002', 'ROUND', 1),
    ('020C0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, @judge3Id, '02030000-EEEE-4EEE-8EEE-000000000002', 'ROUND', 1);
INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at) VALUES
    ('020C0000-EEEE-4EEE-8EEE-000000000007', '02020000-EEEE-4EEE-8EEE-000000000001', @mentor1Id, @now, @now),
    ('020C0000-EEEE-4EEE-8EEE-00000000000B', '02020000-EEEE-4EEE-8EEE-000000000001', @mentor2Id, @now, @now),
    ('020C0000-EEEE-4EEE-8EEE-00000000000C', '02020000-EEEE-4EEE-8EEE-000000000001', @mentor3Id, @now, @now);

INSERT INTO mentor_assignments (id, created_at, assigned_at, mentor_user_id, event_id, track_id) VALUES
    ('02160000-EEEE-4EEE-8EEE-000000000001', @now, @now, @mentor1Id, '02020000-EEEE-4EEE-8EEE-000000000001', '02040000-EEEE-4EEE-8EEE-000000000001'),
    ('02160000-EEEE-4EEE-8EEE-000000000002', @now, @now, @mentor2Id, '02020000-EEEE-4EEE-8EEE-000000000001', '02040000-EEEE-4EEE-8EEE-000000000002'),
    ('02160000-EEEE-4EEE-8EEE-000000000003', @now, @now, @mentor3Id, '02020000-EEEE-4EEE-8EEE-000000000001', '02040000-EEEE-4EEE-8EEE-000000000003');

INSERT INTO mentor_teams (id, created_at, assigned_at, mentor_user_id, team_id) VALUES
    ('02170000-EEEE-4EEE-8EEE-000000000001', @now, @now, @mentor1Id, '02050000-EEEE-4EEE-8EEE-000000000001'),
    ('02170000-EEEE-4EEE-8EEE-000000000002', @now, @now, @mentor1Id, '02050000-EEEE-4EEE-8EEE-000000000002'),
    ('02170000-EEEE-4EEE-8EEE-000000000003', @now, @now, @mentor1Id, '02050000-EEEE-4EEE-8EEE-000000000003'),
    ('02170000-EEEE-4EEE-8EEE-000000000004', @now, @now, @mentor2Id, '02050000-EEEE-4EEE-8EEE-000000000004'),
    ('02170000-EEEE-4EEE-8EEE-000000000005', @now, @now, @mentor2Id, '02050000-EEEE-4EEE-8EEE-000000000005'),
    ('02170000-EEEE-4EEE-8EEE-000000000006', @now, @now, @mentor2Id, '02050000-EEEE-4EEE-8EEE-000000000006'),
    ('02170000-EEEE-4EEE-8EEE-000000000007', @now, @now, @mentor3Id, '02050000-EEEE-4EEE-8EEE-000000000007'),
    ('02170000-EEEE-4EEE-8EEE-000000000008', @now, @now, @mentor3Id, '02050000-EEEE-4EEE-8EEE-000000000008'),
    ('02170000-EEEE-4EEE-8EEE-000000000009', @now, @now, @mentor3Id, '02050000-EEEE-4EEE-8EEE-000000000009');

INSERT INTO mentor_invitations (id, created_at, team_id, mentor_user_id, inviter_id, status, message) VALUES
    ('02180000-EEEE-4EEE-8EEE-000000000001', @now, '02050000-EEEE-4EEE-8EEE-000000000001', @mentor1Id, '01010000-EEEE-4EEE-8EEE-000000000001', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('02180000-EEEE-4EEE-8EEE-000000000002', @now, '02050000-EEEE-4EEE-8EEE-000000000002', @mentor1Id, '01010000-EEEE-4EEE-8EEE-000000000004', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('02180000-EEEE-4EEE-8EEE-000000000003', @now, '02050000-EEEE-4EEE-8EEE-000000000003', @mentor1Id, '01010000-EEEE-4EEE-8EEE-000000000007', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('02180000-EEEE-4EEE-8EEE-000000000004', @now, '02050000-EEEE-4EEE-8EEE-000000000004', @mentor2Id, '01010000-EEEE-4EEE-8EEE-00000000000A', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('02180000-EEEE-4EEE-8EEE-000000000005', @now, '02050000-EEEE-4EEE-8EEE-000000000005', @mentor2Id, '01010000-EEEE-4EEE-8EEE-00000000000D', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('02180000-EEEE-4EEE-8EEE-000000000006', @now, '02050000-EEEE-4EEE-8EEE-000000000006', @mentor2Id, '01010000-EEEE-4EEE-8EEE-000000000010', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('02180000-EEEE-4EEE-8EEE-000000000007', @now, '02050000-EEEE-4EEE-8EEE-000000000007', @mentor3Id, '01010000-EEEE-4EEE-8EEE-000000000013', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('02180000-EEEE-4EEE-8EEE-000000000008', @now, '02050000-EEEE-4EEE-8EEE-000000000008', @mentor3Id, '01010000-EEEE-4EEE-8EEE-000000000016', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('02180000-EEEE-4EEE-8EEE-000000000009', @now, '02050000-EEEE-4EEE-8EEE-000000000009', @mentor3Id, '01010000-EEEE-4EEE-8EEE-000000000019', 'ACCEPTED', N'Seeded mentor assignment for QA');

INSERT INTO submissions (id, created_at, current_version_id, round_id, status, submitted_by, team_id, opt_lock) VALUES
    ('020D0000-EEEE-4EEE-8EEE-000000000001', @now, NULL, '02030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000001', 0),
    ('020D0000-EEEE-4EEE-8EEE-000000000002', @now, NULL, '02030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000004', '02050000-EEEE-4EEE-8EEE-000000000002', 0),
    ('020D0000-EEEE-4EEE-8EEE-000000000003', @now, NULL, '02030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000007', '02050000-EEEE-4EEE-8EEE-000000000003', 0),
    ('020D0000-EEEE-4EEE-8EEE-000000000004', @now, NULL, '02030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-00000000000A', '02050000-EEEE-4EEE-8EEE-000000000004', 0),
    ('020D0000-EEEE-4EEE-8EEE-000000000005', @now, NULL, '02030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-00000000000D', '02050000-EEEE-4EEE-8EEE-000000000005', 0),
    ('020D0000-EEEE-4EEE-8EEE-000000000006', @now, NULL, '02030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000010', '02050000-EEEE-4EEE-8EEE-000000000006', 0),
    ('020D0000-EEEE-4EEE-8EEE-000000000007', @now, NULL, '02030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000013', '02050000-EEEE-4EEE-8EEE-000000000007', 0),
    ('020D0000-EEEE-4EEE-8EEE-000000000008', @now, NULL, '02030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000016', '02050000-EEEE-4EEE-8EEE-000000000008', 0),
    ('020D0000-EEEE-4EEE-8EEE-000000000009', @now, NULL, '02030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000019', '02050000-EEEE-4EEE-8EEE-000000000009', 0),
    ('020D0000-EEEE-4EEE-8EEE-00000000000A', @now, NULL, '02030000-EEEE-4EEE-8EEE-000000000002', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000001', 0),
    ('020D0000-EEEE-4EEE-8EEE-00000000000B', @now, NULL, '02030000-EEEE-4EEE-8EEE-000000000002', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000004', '02050000-EEEE-4EEE-8EEE-000000000002', 0),
    ('020D0000-EEEE-4EEE-8EEE-00000000000C', @now, NULL, '02030000-EEEE-4EEE-8EEE-000000000002', 'SCORED', '01010000-EEEE-4EEE-8EEE-00000000000A', '02050000-EEEE-4EEE-8EEE-000000000004', 0),
    ('020D0000-EEEE-4EEE-8EEE-00000000000D', @now, NULL, '02030000-EEEE-4EEE-8EEE-000000000002', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000010', '02050000-EEEE-4EEE-8EEE-000000000006', 0),
    ('020D0000-EEEE-4EEE-8EEE-00000000000E', @now, NULL, '02030000-EEEE-4EEE-8EEE-000000000002', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000016', '02050000-EEEE-4EEE-8EEE-000000000008', 0),
    ('020D0000-EEEE-4EEE-8EEE-00000000000F', @now, NULL, '02030000-EEEE-4EEE-8EEE-000000000002', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000013', '02050000-EEEE-4EEE-8EEE-000000000007', 0);

INSERT INTO submission_versions (id, created_at, demo_url, github_url, slide_url, submitted_at, version_number, submission_id) VALUES
    ('020E0000-EEEE-4EEE-8EEE-000000000001', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/multihop-lab', N'https://docs.google.com/presentation/d/seal-2-0', DATEADD(MINUTE, -30, @e2_prelimSub), 1, '020D0000-EEEE-4EEE-8EEE-000000000001'),
    ('020E0000-EEEE-4EEE-8EEE-000000000002', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/pathfinder-ai', N'https://docs.google.com/presentation/d/seal-2-1', DATEADD(MINUTE, -31, @e2_prelimSub), 1, '020D0000-EEEE-4EEE-8EEE-000000000002'),
    ('020E0000-EEEE-4EEE-8EEE-000000000003', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/linkweaver', N'https://docs.google.com/presentation/d/seal-2-2', DATEADD(MINUTE, -32, @e2_prelimSub), 1, '020D0000-EEEE-4EEE-8EEE-000000000003'),
    ('020E0000-EEEE-4EEE-8EEE-000000000004', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/reasonstack', N'https://docs.google.com/presentation/d/seal-2-3', DATEADD(MINUTE, -33, @e2_prelimSub), 1, '020D0000-EEEE-4EEE-8EEE-000000000004'),
    ('020E0000-EEEE-4EEE-8EEE-000000000005', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/chainofthought', N'https://docs.google.com/presentation/d/seal-2-4', DATEADD(MINUTE, -34, @e2_prelimSub), 1, '020D0000-EEEE-4EEE-8EEE-000000000005'),
    ('020E0000-EEEE-4EEE-8EEE-000000000006', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/queryrouter', N'https://docs.google.com/presentation/d/seal-2-5', DATEADD(MINUTE, -35, @e2_prelimSub), 1, '020D0000-EEEE-4EEE-8EEE-000000000006'),
    ('020E0000-EEEE-4EEE-8EEE-000000000007', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/factbridge', N'https://docs.google.com/presentation/d/seal-2-6', DATEADD(MINUTE, -36, @e2_prelimSub), 1, '020D0000-EEEE-4EEE-8EEE-000000000007'),
    ('020E0000-EEEE-4EEE-8EEE-000000000008', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/hopscout', N'https://docs.google.com/presentation/d/seal-2-7', DATEADD(MINUTE, -37, @e2_prelimSub), 1, '020D0000-EEEE-4EEE-8EEE-000000000008'),
    ('020E0000-EEEE-4EEE-8EEE-000000000009', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/answertrail', N'https://docs.google.com/presentation/d/seal-2-8', DATEADD(MINUTE, -38, @e2_prelimSub), 1, '020D0000-EEEE-4EEE-8EEE-000000000009'),
    ('020E0000-EEEE-4EEE-8EEE-00000000000A', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/multihop-lab', N'https://docs.google.com/presentation/d/seal-2-9', DATEADD(MINUTE, -39, @e2_prelimSub), 1, '020D0000-EEEE-4EEE-8EEE-00000000000A'),
    ('020E0000-EEEE-4EEE-8EEE-00000000000B', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/pathfinder-ai', N'https://docs.google.com/presentation/d/seal-2-10', DATEADD(MINUTE, -40, @e2_prelimSub), 1, '020D0000-EEEE-4EEE-8EEE-00000000000B'),
    ('020E0000-EEEE-4EEE-8EEE-00000000000C', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/reasonstack', N'https://docs.google.com/presentation/d/seal-2-11', DATEADD(MINUTE, -41, @e2_prelimSub), 1, '020D0000-EEEE-4EEE-8EEE-00000000000C'),
    ('020E0000-EEEE-4EEE-8EEE-00000000000D', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/queryrouter', N'https://docs.google.com/presentation/d/seal-2-12', DATEADD(MINUTE, -42, @e2_prelimSub), 1, '020D0000-EEEE-4EEE-8EEE-00000000000D'),
    ('020E0000-EEEE-4EEE-8EEE-00000000000E', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/hopscout', N'https://docs.google.com/presentation/d/seal-2-13', DATEADD(MINUTE, -43, @e2_prelimSub), 1, '020D0000-EEEE-4EEE-8EEE-00000000000E'),
    ('020E0000-EEEE-4EEE-8EEE-00000000000F', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/factbridge', N'https://docs.google.com/presentation/d/seal-2-14', DATEADD(MINUTE, -44, @e2_prelimSub), 1, '020D0000-EEEE-4EEE-8EEE-00000000000F');

UPDATE submissions SET current_version_id = '020E0000-EEEE-4EEE-8EEE-000000000001' WHERE id = '020D0000-EEEE-4EEE-8EEE-000000000001';
UPDATE submissions SET current_version_id = '020E0000-EEEE-4EEE-8EEE-000000000002' WHERE id = '020D0000-EEEE-4EEE-8EEE-000000000002';
UPDATE submissions SET current_version_id = '020E0000-EEEE-4EEE-8EEE-000000000003' WHERE id = '020D0000-EEEE-4EEE-8EEE-000000000003';
UPDATE submissions SET current_version_id = '020E0000-EEEE-4EEE-8EEE-000000000004' WHERE id = '020D0000-EEEE-4EEE-8EEE-000000000004';
UPDATE submissions SET current_version_id = '020E0000-EEEE-4EEE-8EEE-000000000005' WHERE id = '020D0000-EEEE-4EEE-8EEE-000000000005';
UPDATE submissions SET current_version_id = '020E0000-EEEE-4EEE-8EEE-000000000006' WHERE id = '020D0000-EEEE-4EEE-8EEE-000000000006';
UPDATE submissions SET current_version_id = '020E0000-EEEE-4EEE-8EEE-000000000007' WHERE id = '020D0000-EEEE-4EEE-8EEE-000000000007';
UPDATE submissions SET current_version_id = '020E0000-EEEE-4EEE-8EEE-000000000008' WHERE id = '020D0000-EEEE-4EEE-8EEE-000000000008';
UPDATE submissions SET current_version_id = '020E0000-EEEE-4EEE-8EEE-000000000009' WHERE id = '020D0000-EEEE-4EEE-8EEE-000000000009';
UPDATE submissions SET current_version_id = '020E0000-EEEE-4EEE-8EEE-00000000000A' WHERE id = '020D0000-EEEE-4EEE-8EEE-00000000000A';
UPDATE submissions SET current_version_id = '020E0000-EEEE-4EEE-8EEE-00000000000B' WHERE id = '020D0000-EEEE-4EEE-8EEE-00000000000B';
UPDATE submissions SET current_version_id = '020E0000-EEEE-4EEE-8EEE-00000000000C' WHERE id = '020D0000-EEEE-4EEE-8EEE-00000000000C';
UPDATE submissions SET current_version_id = '020E0000-EEEE-4EEE-8EEE-00000000000D' WHERE id = '020D0000-EEEE-4EEE-8EEE-00000000000D';
UPDATE submissions SET current_version_id = '020E0000-EEEE-4EEE-8EEE-00000000000E' WHERE id = '020D0000-EEEE-4EEE-8EEE-00000000000E';
UPDATE submissions SET current_version_id = '020E0000-EEEE-4EEE-8EEE-00000000000F' WHERE id = '020D0000-EEEE-4EEE-8EEE-00000000000F';

INSERT INTO judge_scores (id, created_at, completed_at, judge_user_id, round_id, started_at, status, submission_id, version) VALUES
    ('020F0000-EEEE-4EEE-8EEE-000000000001', @now, @e2_prelimScore, @judge1Id, '02030000-EEEE-4EEE-8EEE-000000000001', @e2_prelimSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000001', 0),
    ('020F0000-EEEE-4EEE-8EEE-000000000002', @now, @e2_prelimScore, @judge2Id, '02030000-EEEE-4EEE-8EEE-000000000001', @e2_prelimSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000001', 0),
    ('020F0000-EEEE-4EEE-8EEE-000000000003', @now, @e2_prelimScore, @judge1Id, '02030000-EEEE-4EEE-8EEE-000000000001', @e2_prelimSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000002', 0),
    ('020F0000-EEEE-4EEE-8EEE-000000000004', @now, @e2_prelimScore, @judge2Id, '02030000-EEEE-4EEE-8EEE-000000000001', @e2_prelimSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000002', 0),
    ('020F0000-EEEE-4EEE-8EEE-000000000005', @now, @e2_prelimScore, @judge1Id, '02030000-EEEE-4EEE-8EEE-000000000001', @e2_prelimSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000003', 0),
    ('020F0000-EEEE-4EEE-8EEE-000000000006', @now, @e2_prelimScore, @judge2Id, '02030000-EEEE-4EEE-8EEE-000000000001', @e2_prelimSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000003', 0),
    ('020F0000-EEEE-4EEE-8EEE-000000000007', @now, @e2_prelimScore, @judge1Id, '02030000-EEEE-4EEE-8EEE-000000000001', @e2_prelimSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000004', 0),
    ('020F0000-EEEE-4EEE-8EEE-000000000008', @now, @e2_prelimScore, @judge2Id, '02030000-EEEE-4EEE-8EEE-000000000001', @e2_prelimSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000004', 0),
    ('020F0000-EEEE-4EEE-8EEE-000000000009', @now, @e2_prelimScore, @judge1Id, '02030000-EEEE-4EEE-8EEE-000000000001', @e2_prelimSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000005', 0),
    ('020F0000-EEEE-4EEE-8EEE-00000000000A', @now, @e2_prelimScore, @judge2Id, '02030000-EEEE-4EEE-8EEE-000000000001', @e2_prelimSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000005', 0),
    ('020F0000-EEEE-4EEE-8EEE-00000000000B', @now, @e2_prelimScore, @judge1Id, '02030000-EEEE-4EEE-8EEE-000000000001', @e2_prelimSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000006', 0),
    ('020F0000-EEEE-4EEE-8EEE-00000000000C', @now, @e2_prelimScore, @judge2Id, '02030000-EEEE-4EEE-8EEE-000000000001', @e2_prelimSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000006', 0),
    ('020F0000-EEEE-4EEE-8EEE-00000000000D', @now, @e2_prelimScore, @judge1Id, '02030000-EEEE-4EEE-8EEE-000000000001', @e2_prelimSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000007', 0),
    ('020F0000-EEEE-4EEE-8EEE-00000000000E', @now, @e2_prelimScore, @judge2Id, '02030000-EEEE-4EEE-8EEE-000000000001', @e2_prelimSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000007', 0),
    ('020F0000-EEEE-4EEE-8EEE-00000000000F', @now, @e2_prelimScore, @judge1Id, '02030000-EEEE-4EEE-8EEE-000000000001', @e2_prelimSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000008', 0),
    ('020F0000-EEEE-4EEE-8EEE-000000000010', @now, @e2_prelimScore, @judge2Id, '02030000-EEEE-4EEE-8EEE-000000000001', @e2_prelimSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000008', 0),
    ('020F0000-EEEE-4EEE-8EEE-000000000011', @now, @e2_prelimScore, @judge1Id, '02030000-EEEE-4EEE-8EEE-000000000001', @e2_prelimSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000009', 0),
    ('020F0000-EEEE-4EEE-8EEE-000000000012', @now, @e2_prelimScore, @judge2Id, '02030000-EEEE-4EEE-8EEE-000000000001', @e2_prelimSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-000000000009', 0),
    ('020F0000-EEEE-4EEE-8EEE-000000000013', @now, @e2_finalScore, @judge1Id, '02030000-EEEE-4EEE-8EEE-000000000002', @e2_finalSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-00000000000A', 0),
    ('020F0000-EEEE-4EEE-8EEE-000000000014', @now, @e2_finalScore, @judge2Id, '02030000-EEEE-4EEE-8EEE-000000000002', @e2_finalSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-00000000000A', 0),
    ('020F0000-EEEE-4EEE-8EEE-000000000015', @now, @e2_finalScore, @judge1Id, '02030000-EEEE-4EEE-8EEE-000000000002', @e2_finalSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-00000000000B', 0),
    ('020F0000-EEEE-4EEE-8EEE-000000000016', @now, @e2_finalScore, @judge2Id, '02030000-EEEE-4EEE-8EEE-000000000002', @e2_finalSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-00000000000B', 0),
    ('020F0000-EEEE-4EEE-8EEE-000000000017', @now, @e2_finalScore, @judge1Id, '02030000-EEEE-4EEE-8EEE-000000000002', @e2_finalSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-00000000000C', 0),
    ('020F0000-EEEE-4EEE-8EEE-000000000018', @now, @e2_finalScore, @judge2Id, '02030000-EEEE-4EEE-8EEE-000000000002', @e2_finalSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-00000000000C', 0),
    ('020F0000-EEEE-4EEE-8EEE-000000000019', @now, @e2_finalScore, @judge1Id, '02030000-EEEE-4EEE-8EEE-000000000002', @e2_finalSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-00000000000D', 0),
    ('020F0000-EEEE-4EEE-8EEE-00000000001A', @now, @e2_finalScore, @judge2Id, '02030000-EEEE-4EEE-8EEE-000000000002', @e2_finalSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-00000000000D', 0),
    ('020F0000-EEEE-4EEE-8EEE-00000000001B', @now, @e2_finalScore, @judge1Id, '02030000-EEEE-4EEE-8EEE-000000000002', @e2_finalSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-00000000000E', 0),
    ('020F0000-EEEE-4EEE-8EEE-00000000001C', @now, @e2_finalScore, @judge2Id, '02030000-EEEE-4EEE-8EEE-000000000002', @e2_finalSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-00000000000E', 0),
    ('020F0000-EEEE-4EEE-8EEE-00000000001D', @now, @e2_finalScore, @judge1Id, '02030000-EEEE-4EEE-8EEE-000000000002', @e2_finalSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-00000000000F', 0),
    ('020F0000-EEEE-4EEE-8EEE-00000000001E', @now, @e2_finalScore, @judge2Id, '02030000-EEEE-4EEE-8EEE-000000000002', @e2_finalSub, 'COMPLETED', '020D0000-EEEE-4EEE-8EEE-00000000000F', 0);

INSERT INTO judge_score_details (id, created_at, criteria_id, score, judge_score_id) VALUES
    ('020E0000-EEEE-4EEE-8EEE-000000000001', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 5, '020F0000-EEEE-4EEE-8EEE-000000000001'),
    ('020E0000-EEEE-4EEE-8EEE-000000000002', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 5, '020F0000-EEEE-4EEE-8EEE-000000000001'),
    ('020E0000-EEEE-4EEE-8EEE-000000000003', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 5, '020F0000-EEEE-4EEE-8EEE-000000000001'),
    ('020E0000-EEEE-4EEE-8EEE-000000000004', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 4, '020F0000-EEEE-4EEE-8EEE-000000000001'),
    ('020E0000-EEEE-4EEE-8EEE-000000000005', @now, '02060000-EEEE-4EEE-8EEE-000000000005', 5, '020F0000-EEEE-4EEE-8EEE-000000000001'),
    ('020E0000-EEEE-4EEE-8EEE-000000000006', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 4, '020F0000-EEEE-4EEE-8EEE-000000000002'),
    ('020E0000-EEEE-4EEE-8EEE-000000000007', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 5, '020F0000-EEEE-4EEE-8EEE-000000000002'),
    ('020E0000-EEEE-4EEE-8EEE-000000000008', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 4, '020F0000-EEEE-4EEE-8EEE-000000000002'),
    ('020E0000-EEEE-4EEE-8EEE-000000000009', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 4, '020F0000-EEEE-4EEE-8EEE-000000000002'),
    ('020E0000-EEEE-4EEE-8EEE-00000000000A', @now, '02060000-EEEE-4EEE-8EEE-000000000005', 4, '020F0000-EEEE-4EEE-8EEE-000000000002'),
    ('020E0000-EEEE-4EEE-8EEE-00000000000B', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 5, '020F0000-EEEE-4EEE-8EEE-000000000003'),
    ('020E0000-EEEE-4EEE-8EEE-00000000000C', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 4, '020F0000-EEEE-4EEE-8EEE-000000000003'),
    ('020E0000-EEEE-4EEE-8EEE-00000000000D', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 5, '020F0000-EEEE-4EEE-8EEE-000000000003'),
    ('020E0000-EEEE-4EEE-8EEE-00000000000E', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 4, '020F0000-EEEE-4EEE-8EEE-000000000003'),
    ('020E0000-EEEE-4EEE-8EEE-00000000000F', @now, '02060000-EEEE-4EEE-8EEE-000000000005', 4, '020F0000-EEEE-4EEE-8EEE-000000000003'),
    ('020E0000-EEEE-4EEE-8EEE-000000000010', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 5, '020F0000-EEEE-4EEE-8EEE-000000000004'),
    ('020E0000-EEEE-4EEE-8EEE-000000000011', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 4, '020F0000-EEEE-4EEE-8EEE-000000000004'),
    ('020E0000-EEEE-4EEE-8EEE-000000000012', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 5, '020F0000-EEEE-4EEE-8EEE-000000000004'),
    ('020E0000-EEEE-4EEE-8EEE-000000000013', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 4, '020F0000-EEEE-4EEE-8EEE-000000000004'),
    ('020E0000-EEEE-4EEE-8EEE-000000000014', @now, '02060000-EEEE-4EEE-8EEE-000000000005', 4, '020F0000-EEEE-4EEE-8EEE-000000000004'),
    ('020E0000-EEEE-4EEE-8EEE-000000000015', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 4, '020F0000-EEEE-4EEE-8EEE-000000000005'),
    ('020E0000-EEEE-4EEE-8EEE-000000000016', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 5, '020F0000-EEEE-4EEE-8EEE-000000000005'),
    ('020E0000-EEEE-4EEE-8EEE-000000000017', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 4, '020F0000-EEEE-4EEE-8EEE-000000000005'),
    ('020E0000-EEEE-4EEE-8EEE-000000000018', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 4, '020F0000-EEEE-4EEE-8EEE-000000000005'),
    ('020E0000-EEEE-4EEE-8EEE-000000000019', @now, '02060000-EEEE-4EEE-8EEE-000000000005', 4, '020F0000-EEEE-4EEE-8EEE-000000000005'),
    ('020E0000-EEEE-4EEE-8EEE-00000000001A', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 3, '020F0000-EEEE-4EEE-8EEE-000000000006'),
    ('020E0000-EEEE-4EEE-8EEE-00000000001B', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 5, '020F0000-EEEE-4EEE-8EEE-000000000006'),
    ('020E0000-EEEE-4EEE-8EEE-00000000001C', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 3, '020F0000-EEEE-4EEE-8EEE-000000000006'),
    ('020E0000-EEEE-4EEE-8EEE-00000000001D', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 4, '020F0000-EEEE-4EEE-8EEE-000000000006'),
    ('020E0000-EEEE-4EEE-8EEE-00000000001E', @now, '02060000-EEEE-4EEE-8EEE-000000000005', 3, '020F0000-EEEE-4EEE-8EEE-000000000006'),
    ('020E0000-EEEE-4EEE-8EEE-00000000001F', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 4, '020F0000-EEEE-4EEE-8EEE-000000000007'),
    ('020E0000-EEEE-4EEE-8EEE-000000000020', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 4, '020F0000-EEEE-4EEE-8EEE-000000000007'),
    ('020E0000-EEEE-4EEE-8EEE-000000000021', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 4, '020F0000-EEEE-4EEE-8EEE-000000000007'),
    ('020E0000-EEEE-4EEE-8EEE-000000000022', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 5, '020F0000-EEEE-4EEE-8EEE-000000000007'),
    ('020E0000-EEEE-4EEE-8EEE-000000000023', @now, '02060000-EEEE-4EEE-8EEE-000000000005', 4, '020F0000-EEEE-4EEE-8EEE-000000000007'),
    ('020E0000-EEEE-4EEE-8EEE-000000000024', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 4, '020F0000-EEEE-4EEE-8EEE-000000000008'),
    ('020E0000-EEEE-4EEE-8EEE-000000000025', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 4, '020F0000-EEEE-4EEE-8EEE-000000000008'),
    ('020E0000-EEEE-4EEE-8EEE-000000000026', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 4, '020F0000-EEEE-4EEE-8EEE-000000000008'),
    ('020E0000-EEEE-4EEE-8EEE-000000000027', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 5, '020F0000-EEEE-4EEE-8EEE-000000000008'),
    ('020E0000-EEEE-4EEE-8EEE-000000000028', @now, '02060000-EEEE-4EEE-8EEE-000000000005', 4, '020F0000-EEEE-4EEE-8EEE-000000000008'),
    ('020E0000-EEEE-4EEE-8EEE-000000000029', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 4, '020F0000-EEEE-4EEE-8EEE-000000000009'),
    ('020E0000-EEEE-4EEE-8EEE-00000000002A', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 4, '020F0000-EEEE-4EEE-8EEE-000000000009'),
    ('020E0000-EEEE-4EEE-8EEE-00000000002B', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 4, '020F0000-EEEE-4EEE-8EEE-000000000009'),
    ('020E0000-EEEE-4EEE-8EEE-00000000002C', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 3, '020F0000-EEEE-4EEE-8EEE-000000000009'),
    ('020E0000-EEEE-4EEE-8EEE-00000000002D', @now, '02060000-EEEE-4EEE-8EEE-000000000005', 4, '020F0000-EEEE-4EEE-8EEE-000000000009'),
    ('020E0000-EEEE-4EEE-8EEE-00000000002E', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 3, '020F0000-EEEE-4EEE-8EEE-00000000000A'),
    ('020E0000-EEEE-4EEE-8EEE-00000000002F', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 4, '020F0000-EEEE-4EEE-8EEE-00000000000A'),
    ('020E0000-EEEE-4EEE-8EEE-000000000030', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 3, '020F0000-EEEE-4EEE-8EEE-00000000000A'),
    ('020E0000-EEEE-4EEE-8EEE-000000000031', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 3, '020F0000-EEEE-4EEE-8EEE-00000000000A'),
    ('020E0000-EEEE-4EEE-8EEE-000000000032', @now, '02060000-EEEE-4EEE-8EEE-000000000005', 3, '020F0000-EEEE-4EEE-8EEE-00000000000A'),
    ('020E0000-EEEE-4EEE-8EEE-000000000033', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 4, '020F0000-EEEE-4EEE-8EEE-00000000000B'),
    ('020E0000-EEEE-4EEE-8EEE-000000000034', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 3, '020F0000-EEEE-4EEE-8EEE-00000000000B'),
    ('020E0000-EEEE-4EEE-8EEE-000000000035', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 4, '020F0000-EEEE-4EEE-8EEE-00000000000B'),
    ('020E0000-EEEE-4EEE-8EEE-000000000036', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 4, '020F0000-EEEE-4EEE-8EEE-00000000000B'),
    ('020E0000-EEEE-4EEE-8EEE-000000000037', @now, '02060000-EEEE-4EEE-8EEE-000000000005', 3, '020F0000-EEEE-4EEE-8EEE-00000000000B'),
    ('020E0000-EEEE-4EEE-8EEE-000000000038', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 4, '020F0000-EEEE-4EEE-8EEE-00000000000C'),
    ('020E0000-EEEE-4EEE-8EEE-000000000039', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 3, '020F0000-EEEE-4EEE-8EEE-00000000000C'),
    ('020E0000-EEEE-4EEE-8EEE-00000000003A', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 4, '020F0000-EEEE-4EEE-8EEE-00000000000C'),
    ('020E0000-EEEE-4EEE-8EEE-00000000003B', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 4, '020F0000-EEEE-4EEE-8EEE-00000000000C'),
    ('020E0000-EEEE-4EEE-8EEE-00000000003C', @now, '02060000-EEEE-4EEE-8EEE-000000000005', 3, '020F0000-EEEE-4EEE-8EEE-00000000000C'),
    ('020E0000-EEEE-4EEE-8EEE-00000000003D', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 3, '020F0000-EEEE-4EEE-8EEE-00000000000D'),
    ('020E0000-EEEE-4EEE-8EEE-00000000003E', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 4, '020F0000-EEEE-4EEE-8EEE-00000000000D'),
    ('020E0000-EEEE-4EEE-8EEE-00000000003F', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 3, '020F0000-EEEE-4EEE-8EEE-00000000000D'),
    ('020E0000-EEEE-4EEE-8EEE-000000000040', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 3, '020F0000-EEEE-4EEE-8EEE-00000000000D'),
    ('020E0000-EEEE-4EEE-8EEE-000000000041', @now, '02060000-EEEE-4EEE-8EEE-000000000005', 4, '020F0000-EEEE-4EEE-8EEE-00000000000D'),
    ('020E0000-EEEE-4EEE-8EEE-000000000042', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 2, '020F0000-EEEE-4EEE-8EEE-00000000000E'),
    ('020E0000-EEEE-4EEE-8EEE-000000000043', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 4, '020F0000-EEEE-4EEE-8EEE-00000000000E'),
    ('020E0000-EEEE-4EEE-8EEE-000000000044', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 2, '020F0000-EEEE-4EEE-8EEE-00000000000E'),
    ('020E0000-EEEE-4EEE-8EEE-000000000045', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 3, '020F0000-EEEE-4EEE-8EEE-00000000000E'),
    ('020E0000-EEEE-4EEE-8EEE-000000000046', @now, '02060000-EEEE-4EEE-8EEE-000000000005', 3, '020F0000-EEEE-4EEE-8EEE-00000000000E'),
    ('020E0000-EEEE-4EEE-8EEE-000000000047', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 3, '020F0000-EEEE-4EEE-8EEE-00000000000F'),
    ('020E0000-EEEE-4EEE-8EEE-000000000048', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 3, '020F0000-EEEE-4EEE-8EEE-00000000000F'),
    ('020E0000-EEEE-4EEE-8EEE-000000000049', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 3, '020F0000-EEEE-4EEE-8EEE-00000000000F'),
    ('020E0000-EEEE-4EEE-8EEE-00000000004A', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 4, '020F0000-EEEE-4EEE-8EEE-00000000000F'),
    ('020E0000-EEEE-4EEE-8EEE-00000000004B', @now, '02060000-EEEE-4EEE-8EEE-000000000005', 3, '020F0000-EEEE-4EEE-8EEE-00000000000F'),
    ('020E0000-EEEE-4EEE-8EEE-00000000004C', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 3, '020F0000-EEEE-4EEE-8EEE-000000000010'),
    ('020E0000-EEEE-4EEE-8EEE-00000000004D', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 3, '020F0000-EEEE-4EEE-8EEE-000000000010'),
    ('020E0000-EEEE-4EEE-8EEE-00000000004E', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 3, '020F0000-EEEE-4EEE-8EEE-000000000010'),
    ('020E0000-EEEE-4EEE-8EEE-00000000004F', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 4, '020F0000-EEEE-4EEE-8EEE-000000000010'),
    ('020E0000-EEEE-4EEE-8EEE-000000000050', @now, '02060000-EEEE-4EEE-8EEE-000000000005', 3, '020F0000-EEEE-4EEE-8EEE-000000000010'),
    ('020E0000-EEEE-4EEE-8EEE-000000000051', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 3, '020F0000-EEEE-4EEE-8EEE-000000000011'),
    ('020E0000-EEEE-4EEE-8EEE-000000000052', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 3, '020F0000-EEEE-4EEE-8EEE-000000000011'),
    ('020E0000-EEEE-4EEE-8EEE-000000000053', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 2, '020F0000-EEEE-4EEE-8EEE-000000000011'),
    ('020E0000-EEEE-4EEE-8EEE-000000000054', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 3, '020F0000-EEEE-4EEE-8EEE-000000000011'),
    ('020E0000-EEEE-4EEE-8EEE-000000000055', @now, '02060000-EEEE-4EEE-8EEE-000000000005', 3, '020F0000-EEEE-4EEE-8EEE-000000000011'),
    ('020E0000-EEEE-4EEE-8EEE-000000000056', @now, '02060000-EEEE-4EEE-8EEE-000000000001', 2, '020F0000-EEEE-4EEE-8EEE-000000000012'),
    ('020E0000-EEEE-4EEE-8EEE-000000000057', @now, '02060000-EEEE-4EEE-8EEE-000000000002', 3, '020F0000-EEEE-4EEE-8EEE-000000000012'),
    ('020E0000-EEEE-4EEE-8EEE-000000000058', @now, '02060000-EEEE-4EEE-8EEE-000000000003', 1, '020F0000-EEEE-4EEE-8EEE-000000000012'),
    ('020E0000-EEEE-4EEE-8EEE-000000000059', @now, '02060000-EEEE-4EEE-8EEE-000000000004', 3, '020F0000-EEEE-4EEE-8EEE-000000000012'),
    ('020E0000-EEEE-4EEE-8EEE-00000000005A', @now, '02060000-EEEE-4EEE-8EEE-000000000005', 2, '020F0000-EEEE-4EEE-8EEE-000000000012'),
    ('020E0000-EEEE-4EEE-8EEE-00000000005B', @now, '02060000-EEEE-4EEE-8EEE-00000000000B', 5, '020F0000-EEEE-4EEE-8EEE-000000000013'),
    ('020E0000-EEEE-4EEE-8EEE-00000000005C', @now, '02060000-EEEE-4EEE-8EEE-00000000000C', 5, '020F0000-EEEE-4EEE-8EEE-000000000013'),
    ('020E0000-EEEE-4EEE-8EEE-00000000005D', @now, '02060000-EEEE-4EEE-8EEE-00000000000D', 5, '020F0000-EEEE-4EEE-8EEE-000000000013'),
    ('020E0000-EEEE-4EEE-8EEE-00000000005E', @now, '02060000-EEEE-4EEE-8EEE-00000000000E', 5, '020F0000-EEEE-4EEE-8EEE-000000000013'),
    ('020E0000-EEEE-4EEE-8EEE-00000000005F', @now, '02060000-EEEE-4EEE-8EEE-00000000000F', 4, '020F0000-EEEE-4EEE-8EEE-000000000013'),
    ('020E0000-EEEE-4EEE-8EEE-000000000060', @now, '02060000-EEEE-4EEE-8EEE-00000000000B', 5, '020F0000-EEEE-4EEE-8EEE-000000000014'),
    ('020E0000-EEEE-4EEE-8EEE-000000000061', @now, '02060000-EEEE-4EEE-8EEE-00000000000C', 5, '020F0000-EEEE-4EEE-8EEE-000000000014'),
    ('020E0000-EEEE-4EEE-8EEE-000000000062', @now, '02060000-EEEE-4EEE-8EEE-00000000000D', 5, '020F0000-EEEE-4EEE-8EEE-000000000014'),
    ('020E0000-EEEE-4EEE-8EEE-000000000063', @now, '02060000-EEEE-4EEE-8EEE-00000000000E', 5, '020F0000-EEEE-4EEE-8EEE-000000000014'),
    ('020E0000-EEEE-4EEE-8EEE-000000000064', @now, '02060000-EEEE-4EEE-8EEE-00000000000F', 4, '020F0000-EEEE-4EEE-8EEE-000000000014'),
    ('020E0000-EEEE-4EEE-8EEE-000000000065', @now, '02060000-EEEE-4EEE-8EEE-00000000000B', 5, '020F0000-EEEE-4EEE-8EEE-000000000015'),
    ('020E0000-EEEE-4EEE-8EEE-000000000066', @now, '02060000-EEEE-4EEE-8EEE-00000000000C', 4, '020F0000-EEEE-4EEE-8EEE-000000000015'),
    ('020E0000-EEEE-4EEE-8EEE-000000000067', @now, '02060000-EEEE-4EEE-8EEE-00000000000D', 5, '020F0000-EEEE-4EEE-8EEE-000000000015'),
    ('020E0000-EEEE-4EEE-8EEE-000000000068', @now, '02060000-EEEE-4EEE-8EEE-00000000000E', 4, '020F0000-EEEE-4EEE-8EEE-000000000015'),
    ('020E0000-EEEE-4EEE-8EEE-000000000069', @now, '02060000-EEEE-4EEE-8EEE-00000000000F', 5, '020F0000-EEEE-4EEE-8EEE-000000000015'),
    ('020E0000-EEEE-4EEE-8EEE-00000000006A', @now, '02060000-EEEE-4EEE-8EEE-00000000000B', 4, '020F0000-EEEE-4EEE-8EEE-000000000016'),
    ('020E0000-EEEE-4EEE-8EEE-00000000006B', @now, '02060000-EEEE-4EEE-8EEE-00000000000C', 4, '020F0000-EEEE-4EEE-8EEE-000000000016'),
    ('020E0000-EEEE-4EEE-8EEE-00000000006C', @now, '02060000-EEEE-4EEE-8EEE-00000000000D', 4, '020F0000-EEEE-4EEE-8EEE-000000000016'),
    ('020E0000-EEEE-4EEE-8EEE-00000000006D', @now, '02060000-EEEE-4EEE-8EEE-00000000000E', 4, '020F0000-EEEE-4EEE-8EEE-000000000016'),
    ('020E0000-EEEE-4EEE-8EEE-00000000006E', @now, '02060000-EEEE-4EEE-8EEE-00000000000F', 4, '020F0000-EEEE-4EEE-8EEE-000000000016'),
    ('020E0000-EEEE-4EEE-8EEE-00000000006F', @now, '02060000-EEEE-4EEE-8EEE-00000000000B', 4, '020F0000-EEEE-4EEE-8EEE-000000000017'),
    ('020E0000-EEEE-4EEE-8EEE-000000000070', @now, '02060000-EEEE-4EEE-8EEE-00000000000C', 5, '020F0000-EEEE-4EEE-8EEE-000000000017'),
    ('020E0000-EEEE-4EEE-8EEE-000000000071', @now, '02060000-EEEE-4EEE-8EEE-00000000000D', 4, '020F0000-EEEE-4EEE-8EEE-000000000017'),
    ('020E0000-EEEE-4EEE-8EEE-000000000072', @now, '02060000-EEEE-4EEE-8EEE-00000000000E', 5, '020F0000-EEEE-4EEE-8EEE-000000000017'),
    ('020E0000-EEEE-4EEE-8EEE-000000000073', @now, '02060000-EEEE-4EEE-8EEE-00000000000F', 4, '020F0000-EEEE-4EEE-8EEE-000000000017'),
    ('020E0000-EEEE-4EEE-8EEE-000000000074', @now, '02060000-EEEE-4EEE-8EEE-00000000000B', 4, '020F0000-EEEE-4EEE-8EEE-000000000018'),
    ('020E0000-EEEE-4EEE-8EEE-000000000075', @now, '02060000-EEEE-4EEE-8EEE-00000000000C', 5, '020F0000-EEEE-4EEE-8EEE-000000000018'),
    ('020E0000-EEEE-4EEE-8EEE-000000000076', @now, '02060000-EEEE-4EEE-8EEE-00000000000D', 4, '020F0000-EEEE-4EEE-8EEE-000000000018'),
    ('020E0000-EEEE-4EEE-8EEE-000000000077', @now, '02060000-EEEE-4EEE-8EEE-00000000000E', 5, '020F0000-EEEE-4EEE-8EEE-000000000018'),
    ('020E0000-EEEE-4EEE-8EEE-000000000078', @now, '02060000-EEEE-4EEE-8EEE-00000000000F', 4, '020F0000-EEEE-4EEE-8EEE-000000000018'),
    ('020E0000-EEEE-4EEE-8EEE-000000000079', @now, '02060000-EEEE-4EEE-8EEE-00000000000B', 4, '020F0000-EEEE-4EEE-8EEE-000000000019'),
    ('020E0000-EEEE-4EEE-8EEE-00000000007A', @now, '02060000-EEEE-4EEE-8EEE-00000000000C', 4, '020F0000-EEEE-4EEE-8EEE-000000000019'),
    ('020E0000-EEEE-4EEE-8EEE-00000000007B', @now, '02060000-EEEE-4EEE-8EEE-00000000000D', 5, '020F0000-EEEE-4EEE-8EEE-000000000019'),
    ('020E0000-EEEE-4EEE-8EEE-00000000007C', @now, '02060000-EEEE-4EEE-8EEE-00000000000E', 4, '020F0000-EEEE-4EEE-8EEE-000000000019'),
    ('020E0000-EEEE-4EEE-8EEE-00000000007D', @now, '02060000-EEEE-4EEE-8EEE-00000000000F', 4, '020F0000-EEEE-4EEE-8EEE-000000000019'),
    ('020E0000-EEEE-4EEE-8EEE-00000000007E', @now, '02060000-EEEE-4EEE-8EEE-00000000000B', 3, '020F0000-EEEE-4EEE-8EEE-00000000001A'),
    ('020E0000-EEEE-4EEE-8EEE-00000000007F', @now, '02060000-EEEE-4EEE-8EEE-00000000000C', 4, '020F0000-EEEE-4EEE-8EEE-00000000001A'),
    ('020E0000-EEEE-4EEE-8EEE-000000000080', @now, '02060000-EEEE-4EEE-8EEE-00000000000D', 4, '020F0000-EEEE-4EEE-8EEE-00000000001A'),
    ('020E0000-EEEE-4EEE-8EEE-000000000081', @now, '02060000-EEEE-4EEE-8EEE-00000000000E', 4, '020F0000-EEEE-4EEE-8EEE-00000000001A'),
    ('020E0000-EEEE-4EEE-8EEE-000000000082', @now, '02060000-EEEE-4EEE-8EEE-00000000000F', 3, '020F0000-EEEE-4EEE-8EEE-00000000001A'),
    ('020E0000-EEEE-4EEE-8EEE-000000000083', @now, '02060000-EEEE-4EEE-8EEE-00000000000B', 4, '020F0000-EEEE-4EEE-8EEE-00000000001B'),
    ('020E0000-EEEE-4EEE-8EEE-000000000084', @now, '02060000-EEEE-4EEE-8EEE-00000000000C', 4, '020F0000-EEEE-4EEE-8EEE-00000000001B'),
    ('020E0000-EEEE-4EEE-8EEE-000000000085', @now, '02060000-EEEE-4EEE-8EEE-00000000000D', 4, '020F0000-EEEE-4EEE-8EEE-00000000001B'),
    ('020E0000-EEEE-4EEE-8EEE-000000000086', @now, '02060000-EEEE-4EEE-8EEE-00000000000E', 4, '020F0000-EEEE-4EEE-8EEE-00000000001B'),
    ('020E0000-EEEE-4EEE-8EEE-000000000087', @now, '02060000-EEEE-4EEE-8EEE-00000000000F', 3, '020F0000-EEEE-4EEE-8EEE-00000000001B'),
    ('020E0000-EEEE-4EEE-8EEE-000000000088', @now, '02060000-EEEE-4EEE-8EEE-00000000000B', 4, '020F0000-EEEE-4EEE-8EEE-00000000001C'),
    ('020E0000-EEEE-4EEE-8EEE-000000000089', @now, '02060000-EEEE-4EEE-8EEE-00000000000C', 4, '020F0000-EEEE-4EEE-8EEE-00000000001C'),
    ('020E0000-EEEE-4EEE-8EEE-00000000008A', @now, '02060000-EEEE-4EEE-8EEE-00000000000D', 4, '020F0000-EEEE-4EEE-8EEE-00000000001C'),
    ('020E0000-EEEE-4EEE-8EEE-00000000008B', @now, '02060000-EEEE-4EEE-8EEE-00000000000E', 4, '020F0000-EEEE-4EEE-8EEE-00000000001C'),
    ('020E0000-EEEE-4EEE-8EEE-00000000008C', @now, '02060000-EEEE-4EEE-8EEE-00000000000F', 3, '020F0000-EEEE-4EEE-8EEE-00000000001C'),
    ('020E0000-EEEE-4EEE-8EEE-00000000008D', @now, '02060000-EEEE-4EEE-8EEE-00000000000B', 3, '020F0000-EEEE-4EEE-8EEE-00000000001D'),
    ('020E0000-EEEE-4EEE-8EEE-00000000008E', @now, '02060000-EEEE-4EEE-8EEE-00000000000C', 4, '020F0000-EEEE-4EEE-8EEE-00000000001D'),
    ('020E0000-EEEE-4EEE-8EEE-00000000008F', @now, '02060000-EEEE-4EEE-8EEE-00000000000D', 4, '020F0000-EEEE-4EEE-8EEE-00000000001D'),
    ('020E0000-EEEE-4EEE-8EEE-000000000090', @now, '02060000-EEEE-4EEE-8EEE-00000000000E', 4, '020F0000-EEEE-4EEE-8EEE-00000000001D'),
    ('020E0000-EEEE-4EEE-8EEE-000000000091', @now, '02060000-EEEE-4EEE-8EEE-00000000000F', 4, '020F0000-EEEE-4EEE-8EEE-00000000001D'),
    ('020E0000-EEEE-4EEE-8EEE-000000000092', @now, '02060000-EEEE-4EEE-8EEE-00000000000B', 2, '020F0000-EEEE-4EEE-8EEE-00000000001E'),
    ('020E0000-EEEE-4EEE-8EEE-000000000093', @now, '02060000-EEEE-4EEE-8EEE-00000000000C', 4, '020F0000-EEEE-4EEE-8EEE-00000000001E'),
    ('020E0000-EEEE-4EEE-8EEE-000000000094', @now, '02060000-EEEE-4EEE-8EEE-00000000000D', 3, '020F0000-EEEE-4EEE-8EEE-00000000001E'),
    ('020E0000-EEEE-4EEE-8EEE-000000000095', @now, '02060000-EEEE-4EEE-8EEE-00000000000E', 4, '020F0000-EEEE-4EEE-8EEE-00000000001E'),
    ('020E0000-EEEE-4EEE-8EEE-000000000096', @now, '02060000-EEEE-4EEE-8EEE-00000000000F', 3, '020F0000-EEEE-4EEE-8EEE-00000000001E');

INSERT INTO rankings (id, created_at, calculated_at, final_score, rank, round_id, team_id, version, lock_version) VALUES
    ('02100000-EEEE-4EEE-8EEE-000000000001', @now, @e2_prelimScore, 4.5750, 1, '02030000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000001', 1, 0),
    ('02100000-EEEE-4EEE-8EEE-000000000002', @now, @e2_prelimScore, 4.4400, 2, '02030000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000002', 1, 0),
    ('02100000-EEEE-4EEE-8EEE-000000000003', @now, @e2_prelimScore, 4.1300, 3, '02030000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000004', 1, 0),
    ('02100000-EEEE-4EEE-8EEE-000000000004', @now, @e2_prelimScore, 3.9950, 4, '02030000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000003', 1, 0),
    ('02100000-EEEE-4EEE-8EEE-000000000005', @now, @e2_prelimScore, 3.5600, 5, '02030000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000006', 1, 0),
    ('02100000-EEEE-4EEE-8EEE-000000000006', @now, @e2_prelimScore, 3.5250, 6, '02030000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000005', 1, 0),
    ('02100000-EEEE-4EEE-8EEE-000000000007', @now, @e2_prelimScore, 3.0900, 7, '02030000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000008', 1, 0),
    ('02100000-EEEE-4EEE-8EEE-000000000008', @now, @e2_prelimScore, 3.0550, 8, '02030000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000007', 1, 0),
    ('02100000-EEEE-4EEE-8EEE-000000000009', @now, @e2_prelimScore, 2.4950, 9, '02030000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000009', 1, 0);

INSERT INTO rankings (id, created_at, calculated_at, final_score, rank, round_id, team_id, version, lock_version) VALUES
    ('02110000-EEEE-4EEE-8EEE-000000000001', @now, @e2_finalScore, 4.9000, 1, '02030000-EEEE-4EEE-8EEE-000000000002', '02050000-EEEE-4EEE-8EEE-000000000001', 1, 0),
    ('02110000-EEEE-4EEE-8EEE-000000000002', @now, @e2_finalScore, 4.3900, 2, '02030000-EEEE-4EEE-8EEE-000000000002', '02050000-EEEE-4EEE-8EEE-000000000004', 1, 0),
    ('02110000-EEEE-4EEE-8EEE-000000000003', @now, @e2_finalScore, 4.2800, 3, '02030000-EEEE-4EEE-8EEE-000000000002', '02050000-EEEE-4EEE-8EEE-000000000002', 1, 0),
    ('02110000-EEEE-4EEE-8EEE-000000000004', @now, @e2_finalScore, 3.8700, 4, '02030000-EEEE-4EEE-8EEE-000000000002', '02050000-EEEE-4EEE-8EEE-000000000006', 1, 0),
    ('02110000-EEEE-4EEE-8EEE-000000000005', @now, @e2_finalScore, 3.8600, 5, '02030000-EEEE-4EEE-8EEE-000000000002', '02050000-EEEE-4EEE-8EEE-000000000008', 1, 0),
    ('02110000-EEEE-4EEE-8EEE-000000000006', @now, @e2_finalScore, 3.3500, 6, '02030000-EEEE-4EEE-8EEE-000000000002', '02050000-EEEE-4EEE-8EEE-000000000007', 1, 0);

INSERT INTO finalist_selections (id, event_id, team_id, track_id, preliminary_rank, selected_reason, selected_at, created_at, updated_at, selection_method, eligible) VALUES
    ('02120000-EEEE-4EEE-8EEE-000000000001', '02020000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000001', '02040000-EEEE-4EEE-8EEE-000000000001', 1, N'Top 1 in track', @e2_prelimScore, @now, @now, 'AUTO', 1),
    ('02120000-EEEE-4EEE-8EEE-000000000002', '02020000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000002', '02040000-EEEE-4EEE-8EEE-000000000001', 2, N'Top 2 in track', @e2_prelimScore, @now, @now, 'AUTO', 1),
    ('02120000-EEEE-4EEE-8EEE-000000000003', '02020000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000004', '02040000-EEEE-4EEE-8EEE-000000000002', 1, N'Top 1 in track', @e2_prelimScore, @now, @now, 'AUTO', 1),
    ('02120000-EEEE-4EEE-8EEE-000000000004', '02020000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000006', '02040000-EEEE-4EEE-8EEE-000000000002', 2, N'Top 2 in track', @e2_prelimScore, @now, @now, 'AUTO', 1),
    ('02120000-EEEE-4EEE-8EEE-000000000005', '02020000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000008', '02040000-EEEE-4EEE-8EEE-000000000003', 1, N'Top 1 in track', @e2_prelimScore, @now, @now, 'AUTO', 1),
    ('02120000-EEEE-4EEE-8EEE-000000000006', '02020000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000007', '02040000-EEEE-4EEE-8EEE-000000000003', 2, N'Top 2 in track', @e2_prelimScore, @now, @now, 'AUTO', 1);

INSERT INTO published_results (id, created_at, dispute_deadline, published_at, published_by, round_id) VALUES
    ('02130000-EEEE-4EEE-8EEE-000000000001', @now, DATEADD(DAY, 2, @e2_prelimScore), @e2_prelimScore, @coordId, '02030000-EEEE-4EEE-8EEE-000000000001'),
    ('02130000-EEEE-4EEE-8EEE-000000000002', @now, DATEADD(DAY, 2, @e2_finalScore), @e2_finalScore, @coordId, '02030000-EEEE-4EEE-8EEE-000000000002');

INSERT INTO team_awards (id, event_id, team_id, prize_id, awarded_at, created_at, updated_at) VALUES
    ('02140000-EEEE-4EEE-8EEE-000000000001', '02020000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000001', '02070000-EEEE-4EEE-8EEE-000000000001', @e2_finalEnd, @now, @now),
    ('02140000-EEEE-4EEE-8EEE-000000000002', '02020000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000004', '02070000-EEEE-4EEE-8EEE-000000000002', @e2_finalEnd, @now, @now),
    ('02140000-EEEE-4EEE-8EEE-000000000003', '02020000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000002', '02070000-EEEE-4EEE-8EEE-000000000003', @e2_finalEnd, @now, @now),
    ('02140000-EEEE-4EEE-8EEE-000000000004', '02020000-EEEE-4EEE-8EEE-000000000001', '02050000-EEEE-4EEE-8EEE-000000000006', '02070000-EEEE-4EEE-8EEE-000000000004', @e2_finalEnd, @now, @now);

-- ============================================================
-- === SEAL Hackathon Spring 2025 - Enterprise Knowledge Agents ===
-- QA phase: COMPLETED end-to-end
-- Login: tran.thanh.ha@fpt.edu.vn or nguyen.hoang.minh@fpt.edu.vn / Demo@123456
-- View: /hackathons/03020000-EEEE-4EEE-8EEE-000000000001/livescore
-- ============================================================

DECLARE @e3_compDay DATE = '2025-04-12';
DECLARE @e3_endDay DATE = '2025-04-12';
DECLARE @e3_compDt DATETIME2 = CAST(@e3_compDay AS DATETIME2);
DECLARE @e3_regOpen DATE = '2025-01-10';
DECLARE @e3_regDeadline DATE = '2025-03-20';
DECLARE @e3_prelimStart DATETIME2 = DATEADD(HOUR, 7, @e3_compDt);
DECLARE @e3_prelimSub DATETIME2 = DATEADD(HOUR, 14, @e3_compDt);
DECLARE @e3_prelimScore DATETIME2 = DATEADD(MINUTE, 15*60+30, @e3_compDt);
DECLARE @e3_finalStart DATETIME2 = DATEADD(MINUTE, 15*60+30, @e3_compDt);
DECLARE @e3_finalSub DATETIME2 = DATEADD(MINUTE, 15*60+30, @e3_compDt);
DECLARE @e3_finalScore DATETIME2 = DATEADD(HOUR, 17, @e3_compDt);
DECLARE @e3_finalEnd DATETIME2 = DATEADD(HOUR, 17, @e3_compDt);

INSERT INTO hackathon_events (
    id, name, season, year, start_date, end_date,
    registration_open_date, registration_deadline,
    description, location, format, competition_format,
    min_team, max_team, semester_min, semester_max,
    scoring_template_id, status, leaderboard_public,
    owner_user_id, created_by, created_at, updated_at
) VALUES (
    '03020000-EEEE-4EEE-8EEE-000000000001',
    N'SEAL Hackathon Spring 2025 - Enterprise Knowledge Agents',
    N'Spring', 2025,
    @e3_compDay, @e3_endDay,
    @e3_regOpen, @e3_regDeadline,
    N'SEAL Hackathon Spring 2025 focuses on Agentic RAG systems: grounded retrieval, multi-step agent orchestration, and enterprise-ready copilots built by FPT University teams.',
    N'FPT University HCM', 'OFFLINE', 'SEAL_RAG_2026',
    3, 5, 4, 8,
    @templateId, 'COMPLETED', 1,
    @coordId, N'tran.thanh.ha@fpt.edu.vn', @now, @now
);

INSERT INTO tracks (id, event_id, name, description, max_teams, status, created_at, updated_at) VALUES
    ('03040000-EEEE-4EEE-8EEE-000000000001', '03020000-EEEE-4EEE-8EEE-000000000001', N'Grounded Retrieval', N'SEAL track: Grounded Retrieval', 8, 'OPEN', @now, @now),
    ('03040000-EEEE-4EEE-8EEE-000000000002', '03020000-EEEE-4EEE-8EEE-000000000001', N'Agent Orchestration', N'SEAL track: Agent Orchestration', 8, 'OPEN', @now, @now),
    ('03040000-EEEE-4EEE-8EEE-000000000003', '03020000-EEEE-4EEE-8EEE-000000000001', N'Enterprise Copilot', N'SEAL track: Enterprise Copilot', 8, 'OPEN', @now, @now);

INSERT INTO rounds (
    id, event_id, round_number, name, round_type,
    start_date, end_date, slide_deadline, submission_deadline, scoring_deadline,
    advancement_cutoff, advancement_rule, round_weight, created_at, updated_at
) VALUES
    ('03030000-EEEE-4EEE-8EEE-000000000001', '03020000-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', 'PRELIMINARY',
     @e3_prelimStart, @e3_prelimScore, DATEADD(HOUR, -4, @e3_prelimSub),
     @e3_prelimSub, @e3_prelimScore,
     2, 'PER_TRACK_TOP_N', 40, @now, @now),
    ('03030000-EEEE-4EEE-8EEE-000000000002', '03020000-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', 'FINAL',
     @e3_finalStart, @e3_finalEnd, NULL,
     @e3_finalSub, @e3_finalScore,
     6, 'FINALIST_POOL', 60, @now, @now);

INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at) VALUES
    ('03060000-EEEE-4EEE-8EEE-000000000001', '03030000-EEEE-4EEE-8EEE-000000000001', N'Accuracy and Domain Relevance', N'Accuracy and Domain Relevance', 30, 0, 1, 5, @now, @now),
    ('03060000-EEEE-4EEE-8EEE-000000000002', '03030000-EEEE-4EEE-8EEE-000000000001', N'Agentic RAG Architecture & Algorithm', N'Agentic RAG Architecture & Algorithm', 30, 1, 1, 5, @now, @now),
    ('03060000-EEEE-4EEE-8EEE-000000000003', '03030000-EEEE-4EEE-8EEE-000000000001', N'Ideas & Presentation', N'Ideas & Presentation', 15, 2, 1, 5, @now, @now),
    ('03060000-EEEE-4EEE-8EEE-000000000004', '03030000-EEEE-4EEE-8EEE-000000000001', N'Feasibility & Creativity', N'Feasibility & Creativity', 15, 3, 1, 5, @now, @now),
    ('03060000-EEEE-4EEE-8EEE-000000000005', '03030000-EEEE-4EEE-8EEE-000000000001', N'User Experience & Interactive Interface', N'User Experience & Interactive Interface', 10, 4, 1, 5, @now, @now),
    ('03060000-EEEE-4EEE-8EEE-00000000000B', '03030000-EEEE-4EEE-8EEE-000000000002', N'Data Processing & Retrieval Quality', N'Data Processing & Retrieval Quality', 30, 0, 1, 5, @now, @now),
    ('03060000-EEEE-4EEE-8EEE-00000000000C', '03030000-EEEE-4EEE-8EEE-000000000002', N'Reliability & Hallucination Resistance', N'Reliability & Hallucination Resistance', 20, 1, 1, 5, @now, @now),
    ('03060000-EEEE-4EEE-8EEE-00000000000D', '03030000-EEEE-4EEE-8EEE-000000000002', N'Agent Reasoning & Multi-hop Processing', N'Agent Reasoning & Multi-hop Processing', 20, 2, 1, 5, @now, @now),
    ('03060000-EEEE-4EEE-8EEE-00000000000E', '03030000-EEEE-4EEE-8EEE-000000000002', N'Practicality & Operational Optimization', N'Practicality & Operational Optimization', 20, 3, 1, 5, @now, @now),
    ('03060000-EEEE-4EEE-8EEE-00000000000F', '03030000-EEEE-4EEE-8EEE-000000000002', N'Scalability & Innovation', N'Scalability & Innovation', 10, 4, 1, 5, @now, @now);

INSERT INTO prizes (id, event_id, rank, value, quantity, label, created_at, updated_at) VALUES
    ('03070000-EEEE-4EEE-8EEE-000000000001', '03020000-EEEE-4EEE-8EEE-000000000001', 'FIRST', '7000000', 1, N'First Prize', @now, @now),
    ('03070000-EEEE-4EEE-8EEE-000000000002', '03020000-EEEE-4EEE-8EEE-000000000001', 'SECOND', '5000000', 1, N'Second Prize', @now, @now),
    ('03070000-EEEE-4EEE-8EEE-000000000003', '03020000-EEEE-4EEE-8EEE-000000000001', 'THIRD', '3000000', 1, N'Third Prize', @now, @now),
    ('03070000-EEEE-4EEE-8EEE-000000000004', '03020000-EEEE-4EEE-8EEE-000000000001', 'CONSOLATION', '1500000', 1, N'Consolation Prize', @now, @now);

INSERT INTO event_schedules (id, event_id, type, title, description, start_time, end_time, gate, sort_order, created_at, updated_at) VALUES
    ('03080000-EEEE-4EEE-8EEE-000000000001', '03020000-EEEE-4EEE-8EEE-000000000001', 'WORKSHOP', N'Workshop', NULL, DATEADD(DAY, -3, @e3_compDt), DATEADD(HOUR, 3, DATEADD(DAY, -3, @e3_compDt)), NULL, 0, @now, @now),
    ('03080000-EEEE-4EEE-8EEE-000000000002', '03020000-EEEE-4EEE-8EEE-000000000001', 'OPENING', N'Opening & track draw', N'Teams pick tracks in turn; organizers draw topics per track', DATEADD(DAY, -1, @e3_compDt), DATEADD(HOUR, 3, DATEADD(DAY, -1, @e3_compDt)), NULL, 1, @now, @now),
    ('03080000-EEEE-4EEE-8EEE-000000000003', '03020000-EEEE-4EEE-8EEE-000000000001', 'TRACK_DRAW', N'Track selection draw', NULL, DATEADD(DAY, -1, @e3_compDt), DATEADD(HOUR, 2, DATEADD(DAY, -1, @e3_compDt)), NULL, 2, @now, @now),
    ('03080000-EEEE-4EEE-8EEE-000000000004', '03020000-EEEE-4EEE-8EEE-000000000001', 'MILESTONE', N'Milestone 1 - Idea & architecture completion', N'Design Agentic RAG architecture', @e3_prelimStart, DATEADD(HOUR, 3, @e3_prelimStart), 'SLIDE_SUBMISSION', 3, @now, @now),
    ('03080000-EEEE-4EEE-8EEE-000000000005', '03020000-EEEE-4EEE-8EEE-000000000001', 'MILESTONE', N'Milestone 2 - Pitching & product completion', N'Parallel pitching and coding', DATEADD(HOUR, 3, @e3_prelimStart), @e3_prelimSub, 'DEMO_SUBMISSION', 4, @now, @now),
    ('03080000-EEEE-4EEE-8EEE-000000000006', '03020000-EEEE-4EEE-8EEE-000000000001', 'SCORING', N'Preliminary scoring', N'5-minute presentation + 3-minute Q&A', @e3_prelimSub, @e3_prelimScore, NULL, 5, @now, @now),
    ('03080000-EEEE-4EEE-8EEE-000000000007', '03020000-EEEE-4EEE-8EEE-000000000001', 'FINAL', N'Finals', N'7-minute presentation + 3-minute Q&A - Top 6 teams', @e3_finalStart, @e3_finalEnd, NULL, 6, @now, @now),
    ('03080000-EEEE-4EEE-8EEE-000000000008', '03020000-EEEE-4EEE-8EEE-000000000001', 'CEREMONY', N'Awards & closing ceremony', NULL, @e3_finalEnd, DATEADD(HOUR, 1, @e3_finalEnd), NULL, 7, @now, @now);

INSERT INTO allowed_email_domains (id, event_id, domain, university_label, created_at, updated_at) VALUES
    ('03090000-EEEE-4EEE-8EEE-000000000001', '03020000-EEEE-4EEE-8EEE-000000000001', 'fpt.edu.vn', N'FPT University', @now, @now),
    ('03090000-EEEE-4EEE-8EEE-000000000002', '03020000-EEEE-4EEE-8EEE-000000000001', 'fe.edu.vn', N'FPT Education', @now, @now),
    ('03090000-EEEE-4EEE-8EEE-000000000003', '03020000-EEEE-4EEE-8EEE-000000000001', 'hcmut.edu.vn', N'Ho Chi Minh City University of Technology', @now, @now),
    ('03090000-EEEE-4EEE-8EEE-000000000004', '03020000-EEEE-4EEE-8EEE-000000000001', 'hcmus.edu.vn', N'Vietnam National University Ho Chi Minh City - University of Science', @now, @now),
    ('03090000-EEEE-4EEE-8EEE-000000000005', '03020000-EEEE-4EEE-8EEE-000000000001', 'student.hcmus.edu.vn', N'Vietnam National University Ho Chi Minh City - University of Science', @now, @now),
    ('03090000-EEEE-4EEE-8EEE-000000000006', '03020000-EEEE-4EEE-8EEE-000000000001', 'uit.edu.vn', N'University of Information Technology', @now, @now),
    ('03090000-EEEE-4EEE-8EEE-000000000007', '03020000-EEEE-4EEE-8EEE-000000000001', 'hcmute.edu.vn', N'Ho Chi Minh City University of Education and Technology', @now, @now),
    ('03090000-EEEE-4EEE-8EEE-000000000008', '03020000-EEEE-4EEE-8EEE-000000000001', 'ueh.edu.vn', N'University of Economics Ho Chi Minh City', @now, @now),
    ('03090000-EEEE-4EEE-8EEE-000000000009', '03020000-EEEE-4EEE-8EEE-000000000001', 'student.ueh.edu.vn', N'University of Economics Ho Chi Minh City', @now, @now),
    ('03090000-EEEE-4EEE-8EEE-00000000000A', '03020000-EEEE-4EEE-8EEE-000000000001', 'student.iuh.edu.vn', N'Industrial University of Ho Chi Minh City', @now, @now);

INSERT INTO event_enrollments (id, created_at, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public) VALUES
    ('030A0000-EEEE-4EEE-8EEE-000000000001', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000001', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-000000000002', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000002', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-000000000003', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000003', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-000000000004', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000004', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-000000000005', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000005', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-000000000006', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000006', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-000000000007', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000007', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-000000000008', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000008', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-000000000009', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000009', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000000A', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-00000000000B', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000000B', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-00000000000C', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000000C', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-00000000000D', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000000D', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-00000000000E', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000000E', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-00000000000F', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000000F', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-000000000010', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000010', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-000000000011', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000011', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-000000000012', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000012', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-000000000013', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000013', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-000000000014', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000014', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-000000000015', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000015', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-000000000016', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000016', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-000000000017', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000017', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-000000000018', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000018', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-000000000019', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000019', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-00000000001A', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000001A', 0, 0),
    ('030A0000-EEEE-4EEE-8EEE-00000000001B', @now, @now, '03020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000001B', 0, 0);

INSERT INTO teams (id, created_at, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, is_recruiting, recruitment_note, version) VALUES
    ('03050000-EEEE-4EEE-8EEE-000000000001', @now, '03020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000001', N'Enterprise Copilot X', 'CONFIRMED', '03040000-EEEE-4EEE-8EEE-000000000001', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Grounded Retrieval track.', 0),
    ('03050000-EEEE-4EEE-8EEE-000000000002', @now, '03020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000004', N'PolicyRAG', 'CONFIRMED', '03040000-EEEE-4EEE-8EEE-000000000001', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Grounded Retrieval track.', 0),
    ('03050000-EEEE-4EEE-8EEE-000000000003', @now, '03020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000007', N'KnowVault', 'CONFIRMED', '03040000-EEEE-4EEE-8EEE-000000000001', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Grounded Retrieval track.', 0),
    ('03050000-EEEE-4EEE-8EEE-000000000004', @now, '03020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-00000000000A', N'SecureRetrieve', 'CONFIRMED', '03040000-EEEE-4EEE-8EEE-000000000002', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Agent Orchestration track.', 0),
    ('03050000-EEEE-4EEE-8EEE-000000000005', @now, '03020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-00000000000D', N'CorpAgent', 'CONFIRMED', '03040000-EEEE-4EEE-8EEE-000000000002', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Agent Orchestration track.', 0),
    ('03050000-EEEE-4EEE-8EEE-000000000006', @now, '03020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000010', N'InsightDesk', 'CONFIRMED', '03040000-EEEE-4EEE-8EEE-000000000002', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Agent Orchestration track.', 0),
    ('03050000-EEEE-4EEE-8EEE-000000000007', @now, '03020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000013', N'ComplianceBot', 'CONFIRMED', '03040000-EEEE-4EEE-8EEE-000000000003', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Enterprise Copilot track.', 0),
    ('03050000-EEEE-4EEE-8EEE-000000000008', @now, '03020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000016', N'DataSteward', 'CONFIRMED', '03040000-EEEE-4EEE-8EEE-000000000003', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Enterprise Copilot track.', 0),
    ('03050000-EEEE-4EEE-8EEE-000000000009', @now, '03020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000019', N'OpsPilot', 'CONFIRMED', '03040000-EEEE-4EEE-8EEE-000000000003', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Enterprise Copilot track.', 0);

INSERT INTO team_members (id, created_at, joined_at, role, user_id, team_id, event_id) VALUES
    ('030B0000-EEEE-4EEE-8EEE-000000000001', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000001', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-000000000002', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000002', '03050000-EEEE-4EEE-8EEE-000000000001', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-000000000003', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000003', '03050000-EEEE-4EEE-8EEE-000000000001', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-000000000004', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000004', '03050000-EEEE-4EEE-8EEE-000000000002', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-000000000005', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000005', '03050000-EEEE-4EEE-8EEE-000000000002', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-000000000006', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000006', '03050000-EEEE-4EEE-8EEE-000000000002', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-000000000007', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000007', '03050000-EEEE-4EEE-8EEE-000000000003', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-000000000008', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000008', '03050000-EEEE-4EEE-8EEE-000000000003', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-000000000009', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000009', '03050000-EEEE-4EEE-8EEE-000000000003', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-00000000000A', '03050000-EEEE-4EEE-8EEE-000000000004', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-00000000000B', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-00000000000B', '03050000-EEEE-4EEE-8EEE-000000000004', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-00000000000C', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-00000000000C', '03050000-EEEE-4EEE-8EEE-000000000004', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-00000000000D', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-00000000000D', '03050000-EEEE-4EEE-8EEE-000000000005', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-00000000000E', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-00000000000E', '03050000-EEEE-4EEE-8EEE-000000000005', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-00000000000F', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-00000000000F', '03050000-EEEE-4EEE-8EEE-000000000005', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-000000000010', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000010', '03050000-EEEE-4EEE-8EEE-000000000006', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-000000000011', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000011', '03050000-EEEE-4EEE-8EEE-000000000006', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-000000000012', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000012', '03050000-EEEE-4EEE-8EEE-000000000006', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-000000000013', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000013', '03050000-EEEE-4EEE-8EEE-000000000007', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-000000000014', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000014', '03050000-EEEE-4EEE-8EEE-000000000007', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-000000000015', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000015', '03050000-EEEE-4EEE-8EEE-000000000007', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-000000000016', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000016', '03050000-EEEE-4EEE-8EEE-000000000008', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-000000000017', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000017', '03050000-EEEE-4EEE-8EEE-000000000008', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-000000000018', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000018', '03050000-EEEE-4EEE-8EEE-000000000008', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-000000000019', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000019', '03050000-EEEE-4EEE-8EEE-000000000009', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-00000000001A', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-00000000001A', '03050000-EEEE-4EEE-8EEE-000000000009', '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030B0000-EEEE-4EEE-8EEE-00000000001B', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-00000000001B', '03050000-EEEE-4EEE-8EEE-000000000009', '03020000-EEEE-4EEE-8EEE-000000000001');

INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id) VALUES
    ('030C0000-EEEE-4EEE-8EEE-000000000001', @now, @now, @judge1Id, '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030C0000-EEEE-4EEE-8EEE-000000000002', @now, @now, @judge2Id, '03020000-EEEE-4EEE-8EEE-000000000001'),
    ('030C0000-EEEE-4EEE-8EEE-000000000008', @now, @now, @judge3Id, '03020000-EEEE-4EEE-8EEE-000000000001');
INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active) VALUES
    ('030C0000-EEEE-4EEE-8EEE-000000000003', @now, @now, @judge1Id, '03030000-EEEE-4EEE-8EEE-000000000001', 'ROUND', 1),
    ('030C0000-EEEE-4EEE-8EEE-000000000004', @now, @now, @judge2Id, '03030000-EEEE-4EEE-8EEE-000000000001', 'ROUND', 1),
    ('030C0000-EEEE-4EEE-8EEE-000000000009', @now, @now, @judge3Id, '03030000-EEEE-4EEE-8EEE-000000000001', 'ROUND', 1),
    ('030C0000-EEEE-4EEE-8EEE-000000000005', @now, @now, @judge1Id, '03030000-EEEE-4EEE-8EEE-000000000002', 'ROUND', 1),
    ('030C0000-EEEE-4EEE-8EEE-000000000006', @now, @now, @judge2Id, '03030000-EEEE-4EEE-8EEE-000000000002', 'ROUND', 1),
    ('030C0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, @judge3Id, '03030000-EEEE-4EEE-8EEE-000000000002', 'ROUND', 1);
INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at) VALUES
    ('030C0000-EEEE-4EEE-8EEE-000000000007', '03020000-EEEE-4EEE-8EEE-000000000001', @mentor1Id, @now, @now),
    ('030C0000-EEEE-4EEE-8EEE-00000000000B', '03020000-EEEE-4EEE-8EEE-000000000001', @mentor2Id, @now, @now),
    ('030C0000-EEEE-4EEE-8EEE-00000000000C', '03020000-EEEE-4EEE-8EEE-000000000001', @mentor3Id, @now, @now);

INSERT INTO mentor_assignments (id, created_at, assigned_at, mentor_user_id, event_id, track_id) VALUES
    ('03160000-EEEE-4EEE-8EEE-000000000001', @now, @now, @mentor1Id, '03020000-EEEE-4EEE-8EEE-000000000001', '03040000-EEEE-4EEE-8EEE-000000000001'),
    ('03160000-EEEE-4EEE-8EEE-000000000002', @now, @now, @mentor2Id, '03020000-EEEE-4EEE-8EEE-000000000001', '03040000-EEEE-4EEE-8EEE-000000000002'),
    ('03160000-EEEE-4EEE-8EEE-000000000003', @now, @now, @mentor3Id, '03020000-EEEE-4EEE-8EEE-000000000001', '03040000-EEEE-4EEE-8EEE-000000000003');

INSERT INTO mentor_teams (id, created_at, assigned_at, mentor_user_id, team_id) VALUES
    ('03170000-EEEE-4EEE-8EEE-000000000001', @now, @now, @mentor1Id, '03050000-EEEE-4EEE-8EEE-000000000001'),
    ('03170000-EEEE-4EEE-8EEE-000000000002', @now, @now, @mentor1Id, '03050000-EEEE-4EEE-8EEE-000000000002'),
    ('03170000-EEEE-4EEE-8EEE-000000000003', @now, @now, @mentor1Id, '03050000-EEEE-4EEE-8EEE-000000000003'),
    ('03170000-EEEE-4EEE-8EEE-000000000004', @now, @now, @mentor2Id, '03050000-EEEE-4EEE-8EEE-000000000004'),
    ('03170000-EEEE-4EEE-8EEE-000000000005', @now, @now, @mentor2Id, '03050000-EEEE-4EEE-8EEE-000000000005'),
    ('03170000-EEEE-4EEE-8EEE-000000000006', @now, @now, @mentor2Id, '03050000-EEEE-4EEE-8EEE-000000000006'),
    ('03170000-EEEE-4EEE-8EEE-000000000007', @now, @now, @mentor3Id, '03050000-EEEE-4EEE-8EEE-000000000007'),
    ('03170000-EEEE-4EEE-8EEE-000000000008', @now, @now, @mentor3Id, '03050000-EEEE-4EEE-8EEE-000000000008'),
    ('03170000-EEEE-4EEE-8EEE-000000000009', @now, @now, @mentor3Id, '03050000-EEEE-4EEE-8EEE-000000000009');

INSERT INTO mentor_invitations (id, created_at, team_id, mentor_user_id, inviter_id, status, message) VALUES
    ('03180000-EEEE-4EEE-8EEE-000000000001', @now, '03050000-EEEE-4EEE-8EEE-000000000001', @mentor1Id, '01010000-EEEE-4EEE-8EEE-000000000001', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('03180000-EEEE-4EEE-8EEE-000000000002', @now, '03050000-EEEE-4EEE-8EEE-000000000002', @mentor1Id, '01010000-EEEE-4EEE-8EEE-000000000004', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('03180000-EEEE-4EEE-8EEE-000000000003', @now, '03050000-EEEE-4EEE-8EEE-000000000003', @mentor1Id, '01010000-EEEE-4EEE-8EEE-000000000007', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('03180000-EEEE-4EEE-8EEE-000000000004', @now, '03050000-EEEE-4EEE-8EEE-000000000004', @mentor2Id, '01010000-EEEE-4EEE-8EEE-00000000000A', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('03180000-EEEE-4EEE-8EEE-000000000005', @now, '03050000-EEEE-4EEE-8EEE-000000000005', @mentor2Id, '01010000-EEEE-4EEE-8EEE-00000000000D', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('03180000-EEEE-4EEE-8EEE-000000000006', @now, '03050000-EEEE-4EEE-8EEE-000000000006', @mentor2Id, '01010000-EEEE-4EEE-8EEE-000000000010', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('03180000-EEEE-4EEE-8EEE-000000000007', @now, '03050000-EEEE-4EEE-8EEE-000000000007', @mentor3Id, '01010000-EEEE-4EEE-8EEE-000000000013', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('03180000-EEEE-4EEE-8EEE-000000000008', @now, '03050000-EEEE-4EEE-8EEE-000000000008', @mentor3Id, '01010000-EEEE-4EEE-8EEE-000000000016', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('03180000-EEEE-4EEE-8EEE-000000000009', @now, '03050000-EEEE-4EEE-8EEE-000000000009', @mentor3Id, '01010000-EEEE-4EEE-8EEE-000000000019', 'ACCEPTED', N'Seeded mentor assignment for QA');

INSERT INTO submissions (id, created_at, current_version_id, round_id, status, submitted_by, team_id, opt_lock) VALUES
    ('030D0000-EEEE-4EEE-8EEE-000000000001', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000001', 0),
    ('030D0000-EEEE-4EEE-8EEE-000000000002', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000004', '03050000-EEEE-4EEE-8EEE-000000000002', 0),
    ('030D0000-EEEE-4EEE-8EEE-000000000003', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000007', '03050000-EEEE-4EEE-8EEE-000000000003', 0),
    ('030D0000-EEEE-4EEE-8EEE-000000000004', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-00000000000A', '03050000-EEEE-4EEE-8EEE-000000000004', 0),
    ('030D0000-EEEE-4EEE-8EEE-000000000005', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-00000000000D', '03050000-EEEE-4EEE-8EEE-000000000005', 0),
    ('030D0000-EEEE-4EEE-8EEE-000000000006', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000010', '03050000-EEEE-4EEE-8EEE-000000000006', 0),
    ('030D0000-EEEE-4EEE-8EEE-000000000007', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000013', '03050000-EEEE-4EEE-8EEE-000000000007', 0),
    ('030D0000-EEEE-4EEE-8EEE-000000000008', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000016', '03050000-EEEE-4EEE-8EEE-000000000008', 0),
    ('030D0000-EEEE-4EEE-8EEE-000000000009', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000019', '03050000-EEEE-4EEE-8EEE-000000000009', 0),
    ('030D0000-EEEE-4EEE-8EEE-00000000000A', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000002', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000001', 0),
    ('030D0000-EEEE-4EEE-8EEE-00000000000B', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000002', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000004', '03050000-EEEE-4EEE-8EEE-000000000002', 0),
    ('030D0000-EEEE-4EEE-8EEE-00000000000C', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000002', 'SCORED', '01010000-EEEE-4EEE-8EEE-00000000000A', '03050000-EEEE-4EEE-8EEE-000000000004', 0),
    ('030D0000-EEEE-4EEE-8EEE-00000000000D', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000002', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000010', '03050000-EEEE-4EEE-8EEE-000000000006', 0),
    ('030D0000-EEEE-4EEE-8EEE-00000000000E', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000002', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000016', '03050000-EEEE-4EEE-8EEE-000000000008', 0),
    ('030D0000-EEEE-4EEE-8EEE-00000000000F', @now, NULL, '03030000-EEEE-4EEE-8EEE-000000000002', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000013', '03050000-EEEE-4EEE-8EEE-000000000007', 0);

INSERT INTO submission_versions (id, created_at, demo_url, github_url, slide_url, submitted_at, version_number, submission_id) VALUES
    ('030E0000-EEEE-4EEE-8EEE-000000000001', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/enterprise-copilot-x', N'https://docs.google.com/presentation/d/seal-3-0', DATEADD(MINUTE, -30, @e3_prelimSub), 1, '030D0000-EEEE-4EEE-8EEE-000000000001'),
    ('030E0000-EEEE-4EEE-8EEE-000000000002', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/policyrag', N'https://docs.google.com/presentation/d/seal-3-1', DATEADD(MINUTE, -31, @e3_prelimSub), 1, '030D0000-EEEE-4EEE-8EEE-000000000002'),
    ('030E0000-EEEE-4EEE-8EEE-000000000003', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/knowvault', N'https://docs.google.com/presentation/d/seal-3-2', DATEADD(MINUTE, -32, @e3_prelimSub), 1, '030D0000-EEEE-4EEE-8EEE-000000000003'),
    ('030E0000-EEEE-4EEE-8EEE-000000000004', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/secureretrieve', N'https://docs.google.com/presentation/d/seal-3-3', DATEADD(MINUTE, -33, @e3_prelimSub), 1, '030D0000-EEEE-4EEE-8EEE-000000000004'),
    ('030E0000-EEEE-4EEE-8EEE-000000000005', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/corpagent', N'https://docs.google.com/presentation/d/seal-3-4', DATEADD(MINUTE, -34, @e3_prelimSub), 1, '030D0000-EEEE-4EEE-8EEE-000000000005'),
    ('030E0000-EEEE-4EEE-8EEE-000000000006', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/insightdesk', N'https://docs.google.com/presentation/d/seal-3-5', DATEADD(MINUTE, -35, @e3_prelimSub), 1, '030D0000-EEEE-4EEE-8EEE-000000000006'),
    ('030E0000-EEEE-4EEE-8EEE-000000000007', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/compliancebot', N'https://docs.google.com/presentation/d/seal-3-6', DATEADD(MINUTE, -36, @e3_prelimSub), 1, '030D0000-EEEE-4EEE-8EEE-000000000007'),
    ('030E0000-EEEE-4EEE-8EEE-000000000008', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/datasteward', N'https://docs.google.com/presentation/d/seal-3-7', DATEADD(MINUTE, -37, @e3_prelimSub), 1, '030D0000-EEEE-4EEE-8EEE-000000000008'),
    ('030E0000-EEEE-4EEE-8EEE-000000000009', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/opspilot', N'https://docs.google.com/presentation/d/seal-3-8', DATEADD(MINUTE, -38, @e3_prelimSub), 1, '030D0000-EEEE-4EEE-8EEE-000000000009'),
    ('030E0000-EEEE-4EEE-8EEE-00000000000A', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/enterprise-copilot-x', N'https://docs.google.com/presentation/d/seal-3-9', DATEADD(MINUTE, -39, @e3_prelimSub), 1, '030D0000-EEEE-4EEE-8EEE-00000000000A'),
    ('030E0000-EEEE-4EEE-8EEE-00000000000B', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/policyrag', N'https://docs.google.com/presentation/d/seal-3-10', DATEADD(MINUTE, -40, @e3_prelimSub), 1, '030D0000-EEEE-4EEE-8EEE-00000000000B'),
    ('030E0000-EEEE-4EEE-8EEE-00000000000C', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/secureretrieve', N'https://docs.google.com/presentation/d/seal-3-11', DATEADD(MINUTE, -41, @e3_prelimSub), 1, '030D0000-EEEE-4EEE-8EEE-00000000000C'),
    ('030E0000-EEEE-4EEE-8EEE-00000000000D', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/insightdesk', N'https://docs.google.com/presentation/d/seal-3-12', DATEADD(MINUTE, -42, @e3_prelimSub), 1, '030D0000-EEEE-4EEE-8EEE-00000000000D'),
    ('030E0000-EEEE-4EEE-8EEE-00000000000E', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/datasteward', N'https://docs.google.com/presentation/d/seal-3-13', DATEADD(MINUTE, -43, @e3_prelimSub), 1, '030D0000-EEEE-4EEE-8EEE-00000000000E'),
    ('030E0000-EEEE-4EEE-8EEE-00000000000F', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/compliancebot', N'https://docs.google.com/presentation/d/seal-3-14', DATEADD(MINUTE, -44, @e3_prelimSub), 1, '030D0000-EEEE-4EEE-8EEE-00000000000F');

UPDATE submissions SET current_version_id = '030E0000-EEEE-4EEE-8EEE-000000000001' WHERE id = '030D0000-EEEE-4EEE-8EEE-000000000001';
UPDATE submissions SET current_version_id = '030E0000-EEEE-4EEE-8EEE-000000000002' WHERE id = '030D0000-EEEE-4EEE-8EEE-000000000002';
UPDATE submissions SET current_version_id = '030E0000-EEEE-4EEE-8EEE-000000000003' WHERE id = '030D0000-EEEE-4EEE-8EEE-000000000003';
UPDATE submissions SET current_version_id = '030E0000-EEEE-4EEE-8EEE-000000000004' WHERE id = '030D0000-EEEE-4EEE-8EEE-000000000004';
UPDATE submissions SET current_version_id = '030E0000-EEEE-4EEE-8EEE-000000000005' WHERE id = '030D0000-EEEE-4EEE-8EEE-000000000005';
UPDATE submissions SET current_version_id = '030E0000-EEEE-4EEE-8EEE-000000000006' WHERE id = '030D0000-EEEE-4EEE-8EEE-000000000006';
UPDATE submissions SET current_version_id = '030E0000-EEEE-4EEE-8EEE-000000000007' WHERE id = '030D0000-EEEE-4EEE-8EEE-000000000007';
UPDATE submissions SET current_version_id = '030E0000-EEEE-4EEE-8EEE-000000000008' WHERE id = '030D0000-EEEE-4EEE-8EEE-000000000008';
UPDATE submissions SET current_version_id = '030E0000-EEEE-4EEE-8EEE-000000000009' WHERE id = '030D0000-EEEE-4EEE-8EEE-000000000009';
UPDATE submissions SET current_version_id = '030E0000-EEEE-4EEE-8EEE-00000000000A' WHERE id = '030D0000-EEEE-4EEE-8EEE-00000000000A';
UPDATE submissions SET current_version_id = '030E0000-EEEE-4EEE-8EEE-00000000000B' WHERE id = '030D0000-EEEE-4EEE-8EEE-00000000000B';
UPDATE submissions SET current_version_id = '030E0000-EEEE-4EEE-8EEE-00000000000C' WHERE id = '030D0000-EEEE-4EEE-8EEE-00000000000C';
UPDATE submissions SET current_version_id = '030E0000-EEEE-4EEE-8EEE-00000000000D' WHERE id = '030D0000-EEEE-4EEE-8EEE-00000000000D';
UPDATE submissions SET current_version_id = '030E0000-EEEE-4EEE-8EEE-00000000000E' WHERE id = '030D0000-EEEE-4EEE-8EEE-00000000000E';
UPDATE submissions SET current_version_id = '030E0000-EEEE-4EEE-8EEE-00000000000F' WHERE id = '030D0000-EEEE-4EEE-8EEE-00000000000F';

INSERT INTO judge_scores (id, created_at, completed_at, judge_user_id, round_id, started_at, status, submission_id, version) VALUES
    ('030F0000-EEEE-4EEE-8EEE-000000000001', @now, @e3_prelimScore, @judge1Id, '03030000-EEEE-4EEE-8EEE-000000000001', @e3_prelimSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000001', 0),
    ('030F0000-EEEE-4EEE-8EEE-000000000002', @now, @e3_prelimScore, @judge2Id, '03030000-EEEE-4EEE-8EEE-000000000001', @e3_prelimSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000001', 0),
    ('030F0000-EEEE-4EEE-8EEE-000000000003', @now, @e3_prelimScore, @judge1Id, '03030000-EEEE-4EEE-8EEE-000000000001', @e3_prelimSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000002', 0),
    ('030F0000-EEEE-4EEE-8EEE-000000000004', @now, @e3_prelimScore, @judge2Id, '03030000-EEEE-4EEE-8EEE-000000000001', @e3_prelimSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000002', 0),
    ('030F0000-EEEE-4EEE-8EEE-000000000005', @now, @e3_prelimScore, @judge1Id, '03030000-EEEE-4EEE-8EEE-000000000001', @e3_prelimSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000003', 0),
    ('030F0000-EEEE-4EEE-8EEE-000000000006', @now, @e3_prelimScore, @judge2Id, '03030000-EEEE-4EEE-8EEE-000000000001', @e3_prelimSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000003', 0),
    ('030F0000-EEEE-4EEE-8EEE-000000000007', @now, @e3_prelimScore, @judge1Id, '03030000-EEEE-4EEE-8EEE-000000000001', @e3_prelimSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000004', 0),
    ('030F0000-EEEE-4EEE-8EEE-000000000008', @now, @e3_prelimScore, @judge2Id, '03030000-EEEE-4EEE-8EEE-000000000001', @e3_prelimSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000004', 0),
    ('030F0000-EEEE-4EEE-8EEE-000000000009', @now, @e3_prelimScore, @judge1Id, '03030000-EEEE-4EEE-8EEE-000000000001', @e3_prelimSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000005', 0),
    ('030F0000-EEEE-4EEE-8EEE-00000000000A', @now, @e3_prelimScore, @judge2Id, '03030000-EEEE-4EEE-8EEE-000000000001', @e3_prelimSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000005', 0),
    ('030F0000-EEEE-4EEE-8EEE-00000000000B', @now, @e3_prelimScore, @judge1Id, '03030000-EEEE-4EEE-8EEE-000000000001', @e3_prelimSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000006', 0),
    ('030F0000-EEEE-4EEE-8EEE-00000000000C', @now, @e3_prelimScore, @judge2Id, '03030000-EEEE-4EEE-8EEE-000000000001', @e3_prelimSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000006', 0),
    ('030F0000-EEEE-4EEE-8EEE-00000000000D', @now, @e3_prelimScore, @judge1Id, '03030000-EEEE-4EEE-8EEE-000000000001', @e3_prelimSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000007', 0),
    ('030F0000-EEEE-4EEE-8EEE-00000000000E', @now, @e3_prelimScore, @judge2Id, '03030000-EEEE-4EEE-8EEE-000000000001', @e3_prelimSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000007', 0),
    ('030F0000-EEEE-4EEE-8EEE-00000000000F', @now, @e3_prelimScore, @judge1Id, '03030000-EEEE-4EEE-8EEE-000000000001', @e3_prelimSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000008', 0),
    ('030F0000-EEEE-4EEE-8EEE-000000000010', @now, @e3_prelimScore, @judge2Id, '03030000-EEEE-4EEE-8EEE-000000000001', @e3_prelimSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000008', 0),
    ('030F0000-EEEE-4EEE-8EEE-000000000011', @now, @e3_prelimScore, @judge1Id, '03030000-EEEE-4EEE-8EEE-000000000001', @e3_prelimSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000009', 0),
    ('030F0000-EEEE-4EEE-8EEE-000000000012', @now, @e3_prelimScore, @judge2Id, '03030000-EEEE-4EEE-8EEE-000000000001', @e3_prelimSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-000000000009', 0),
    ('030F0000-EEEE-4EEE-8EEE-000000000013', @now, @e3_finalScore, @judge1Id, '03030000-EEEE-4EEE-8EEE-000000000002', @e3_finalSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000A', 0),
    ('030F0000-EEEE-4EEE-8EEE-000000000014', @now, @e3_finalScore, @judge2Id, '03030000-EEEE-4EEE-8EEE-000000000002', @e3_finalSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000A', 0),
    ('030F0000-EEEE-4EEE-8EEE-000000000015', @now, @e3_finalScore, @judge1Id, '03030000-EEEE-4EEE-8EEE-000000000002', @e3_finalSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000B', 0),
    ('030F0000-EEEE-4EEE-8EEE-000000000016', @now, @e3_finalScore, @judge2Id, '03030000-EEEE-4EEE-8EEE-000000000002', @e3_finalSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000B', 0),
    ('030F0000-EEEE-4EEE-8EEE-000000000017', @now, @e3_finalScore, @judge1Id, '03030000-EEEE-4EEE-8EEE-000000000002', @e3_finalSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000C', 0),
    ('030F0000-EEEE-4EEE-8EEE-000000000018', @now, @e3_finalScore, @judge2Id, '03030000-EEEE-4EEE-8EEE-000000000002', @e3_finalSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000C', 0),
    ('030F0000-EEEE-4EEE-8EEE-000000000019', @now, @e3_finalScore, @judge1Id, '03030000-EEEE-4EEE-8EEE-000000000002', @e3_finalSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000D', 0),
    ('030F0000-EEEE-4EEE-8EEE-00000000001A', @now, @e3_finalScore, @judge2Id, '03030000-EEEE-4EEE-8EEE-000000000002', @e3_finalSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000D', 0),
    ('030F0000-EEEE-4EEE-8EEE-00000000001B', @now, @e3_finalScore, @judge1Id, '03030000-EEEE-4EEE-8EEE-000000000002', @e3_finalSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000E', 0),
    ('030F0000-EEEE-4EEE-8EEE-00000000001C', @now, @e3_finalScore, @judge2Id, '03030000-EEEE-4EEE-8EEE-000000000002', @e3_finalSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000E', 0),
    ('030F0000-EEEE-4EEE-8EEE-00000000001D', @now, @e3_finalScore, @judge1Id, '03030000-EEEE-4EEE-8EEE-000000000002', @e3_finalSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000F', 0),
    ('030F0000-EEEE-4EEE-8EEE-00000000001E', @now, @e3_finalScore, @judge2Id, '03030000-EEEE-4EEE-8EEE-000000000002', @e3_finalSub, 'COMPLETED', '030D0000-EEEE-4EEE-8EEE-00000000000F', 0);

INSERT INTO judge_score_details (id, created_at, criteria_id, score, judge_score_id) VALUES
    ('030E0000-EEEE-4EEE-8EEE-000000000001', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 5, '030F0000-EEEE-4EEE-8EEE-000000000001'),
    ('030E0000-EEEE-4EEE-8EEE-000000000002', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 5, '030F0000-EEEE-4EEE-8EEE-000000000001'),
    ('030E0000-EEEE-4EEE-8EEE-000000000003', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 5, '030F0000-EEEE-4EEE-8EEE-000000000001'),
    ('030E0000-EEEE-4EEE-8EEE-000000000004', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-000000000001'),
    ('030E0000-EEEE-4EEE-8EEE-000000000005', @now, '03060000-EEEE-4EEE-8EEE-000000000005', 5, '030F0000-EEEE-4EEE-8EEE-000000000001'),
    ('030E0000-EEEE-4EEE-8EEE-000000000006', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 4, '030F0000-EEEE-4EEE-8EEE-000000000002'),
    ('030E0000-EEEE-4EEE-8EEE-000000000007', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 5, '030F0000-EEEE-4EEE-8EEE-000000000002'),
    ('030E0000-EEEE-4EEE-8EEE-000000000008', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 4, '030F0000-EEEE-4EEE-8EEE-000000000002'),
    ('030E0000-EEEE-4EEE-8EEE-000000000009', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-000000000002'),
    ('030E0000-EEEE-4EEE-8EEE-00000000000A', @now, '03060000-EEEE-4EEE-8EEE-000000000005', 4, '030F0000-EEEE-4EEE-8EEE-000000000002'),
    ('030E0000-EEEE-4EEE-8EEE-00000000000B', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 5, '030F0000-EEEE-4EEE-8EEE-000000000003'),
    ('030E0000-EEEE-4EEE-8EEE-00000000000C', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 4, '030F0000-EEEE-4EEE-8EEE-000000000003'),
    ('030E0000-EEEE-4EEE-8EEE-00000000000D', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 5, '030F0000-EEEE-4EEE-8EEE-000000000003'),
    ('030E0000-EEEE-4EEE-8EEE-00000000000E', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-000000000003'),
    ('030E0000-EEEE-4EEE-8EEE-00000000000F', @now, '03060000-EEEE-4EEE-8EEE-000000000005', 4, '030F0000-EEEE-4EEE-8EEE-000000000003'),
    ('030E0000-EEEE-4EEE-8EEE-000000000010', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 5, '030F0000-EEEE-4EEE-8EEE-000000000004'),
    ('030E0000-EEEE-4EEE-8EEE-000000000011', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 4, '030F0000-EEEE-4EEE-8EEE-000000000004'),
    ('030E0000-EEEE-4EEE-8EEE-000000000012', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 5, '030F0000-EEEE-4EEE-8EEE-000000000004'),
    ('030E0000-EEEE-4EEE-8EEE-000000000013', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-000000000004'),
    ('030E0000-EEEE-4EEE-8EEE-000000000014', @now, '03060000-EEEE-4EEE-8EEE-000000000005', 4, '030F0000-EEEE-4EEE-8EEE-000000000004'),
    ('030E0000-EEEE-4EEE-8EEE-000000000015', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 4, '030F0000-EEEE-4EEE-8EEE-000000000005'),
    ('030E0000-EEEE-4EEE-8EEE-000000000016', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 5, '030F0000-EEEE-4EEE-8EEE-000000000005'),
    ('030E0000-EEEE-4EEE-8EEE-000000000017', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 4, '030F0000-EEEE-4EEE-8EEE-000000000005'),
    ('030E0000-EEEE-4EEE-8EEE-000000000018', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-000000000005'),
    ('030E0000-EEEE-4EEE-8EEE-000000000019', @now, '03060000-EEEE-4EEE-8EEE-000000000005', 4, '030F0000-EEEE-4EEE-8EEE-000000000005'),
    ('030E0000-EEEE-4EEE-8EEE-00000000001A', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 3, '030F0000-EEEE-4EEE-8EEE-000000000006'),
    ('030E0000-EEEE-4EEE-8EEE-00000000001B', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 5, '030F0000-EEEE-4EEE-8EEE-000000000006'),
    ('030E0000-EEEE-4EEE-8EEE-00000000001C', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 3, '030F0000-EEEE-4EEE-8EEE-000000000006'),
    ('030E0000-EEEE-4EEE-8EEE-00000000001D', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-000000000006'),
    ('030E0000-EEEE-4EEE-8EEE-00000000001E', @now, '03060000-EEEE-4EEE-8EEE-000000000005', 3, '030F0000-EEEE-4EEE-8EEE-000000000006'),
    ('030E0000-EEEE-4EEE-8EEE-00000000001F', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 4, '030F0000-EEEE-4EEE-8EEE-000000000007'),
    ('030E0000-EEEE-4EEE-8EEE-000000000020', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 4, '030F0000-EEEE-4EEE-8EEE-000000000007'),
    ('030E0000-EEEE-4EEE-8EEE-000000000021', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 4, '030F0000-EEEE-4EEE-8EEE-000000000007'),
    ('030E0000-EEEE-4EEE-8EEE-000000000022', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 5, '030F0000-EEEE-4EEE-8EEE-000000000007'),
    ('030E0000-EEEE-4EEE-8EEE-000000000023', @now, '03060000-EEEE-4EEE-8EEE-000000000005', 4, '030F0000-EEEE-4EEE-8EEE-000000000007'),
    ('030E0000-EEEE-4EEE-8EEE-000000000024', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 4, '030F0000-EEEE-4EEE-8EEE-000000000008'),
    ('030E0000-EEEE-4EEE-8EEE-000000000025', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 4, '030F0000-EEEE-4EEE-8EEE-000000000008'),
    ('030E0000-EEEE-4EEE-8EEE-000000000026', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 4, '030F0000-EEEE-4EEE-8EEE-000000000008'),
    ('030E0000-EEEE-4EEE-8EEE-000000000027', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 5, '030F0000-EEEE-4EEE-8EEE-000000000008'),
    ('030E0000-EEEE-4EEE-8EEE-000000000028', @now, '03060000-EEEE-4EEE-8EEE-000000000005', 4, '030F0000-EEEE-4EEE-8EEE-000000000008'),
    ('030E0000-EEEE-4EEE-8EEE-000000000029', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 4, '030F0000-EEEE-4EEE-8EEE-000000000009'),
    ('030E0000-EEEE-4EEE-8EEE-00000000002A', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 4, '030F0000-EEEE-4EEE-8EEE-000000000009'),
    ('030E0000-EEEE-4EEE-8EEE-00000000002B', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 4, '030F0000-EEEE-4EEE-8EEE-000000000009'),
    ('030E0000-EEEE-4EEE-8EEE-00000000002C', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 3, '030F0000-EEEE-4EEE-8EEE-000000000009'),
    ('030E0000-EEEE-4EEE-8EEE-00000000002D', @now, '03060000-EEEE-4EEE-8EEE-000000000005', 4, '030F0000-EEEE-4EEE-8EEE-000000000009'),
    ('030E0000-EEEE-4EEE-8EEE-00000000002E', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 3, '030F0000-EEEE-4EEE-8EEE-00000000000A'),
    ('030E0000-EEEE-4EEE-8EEE-00000000002F', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 4, '030F0000-EEEE-4EEE-8EEE-00000000000A'),
    ('030E0000-EEEE-4EEE-8EEE-000000000030', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 3, '030F0000-EEEE-4EEE-8EEE-00000000000A'),
    ('030E0000-EEEE-4EEE-8EEE-000000000031', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 3, '030F0000-EEEE-4EEE-8EEE-00000000000A'),
    ('030E0000-EEEE-4EEE-8EEE-000000000032', @now, '03060000-EEEE-4EEE-8EEE-000000000005', 3, '030F0000-EEEE-4EEE-8EEE-00000000000A'),
    ('030E0000-EEEE-4EEE-8EEE-000000000033', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 4, '030F0000-EEEE-4EEE-8EEE-00000000000B'),
    ('030E0000-EEEE-4EEE-8EEE-000000000034', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 3, '030F0000-EEEE-4EEE-8EEE-00000000000B'),
    ('030E0000-EEEE-4EEE-8EEE-000000000035', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 4, '030F0000-EEEE-4EEE-8EEE-00000000000B'),
    ('030E0000-EEEE-4EEE-8EEE-000000000036', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-00000000000B'),
    ('030E0000-EEEE-4EEE-8EEE-000000000037', @now, '03060000-EEEE-4EEE-8EEE-000000000005', 3, '030F0000-EEEE-4EEE-8EEE-00000000000B'),
    ('030E0000-EEEE-4EEE-8EEE-000000000038', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 4, '030F0000-EEEE-4EEE-8EEE-00000000000C'),
    ('030E0000-EEEE-4EEE-8EEE-000000000039', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 3, '030F0000-EEEE-4EEE-8EEE-00000000000C'),
    ('030E0000-EEEE-4EEE-8EEE-00000000003A', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 4, '030F0000-EEEE-4EEE-8EEE-00000000000C'),
    ('030E0000-EEEE-4EEE-8EEE-00000000003B', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-00000000000C'),
    ('030E0000-EEEE-4EEE-8EEE-00000000003C', @now, '03060000-EEEE-4EEE-8EEE-000000000005', 3, '030F0000-EEEE-4EEE-8EEE-00000000000C'),
    ('030E0000-EEEE-4EEE-8EEE-00000000003D', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 3, '030F0000-EEEE-4EEE-8EEE-00000000000D'),
    ('030E0000-EEEE-4EEE-8EEE-00000000003E', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 4, '030F0000-EEEE-4EEE-8EEE-00000000000D'),
    ('030E0000-EEEE-4EEE-8EEE-00000000003F', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 3, '030F0000-EEEE-4EEE-8EEE-00000000000D'),
    ('030E0000-EEEE-4EEE-8EEE-000000000040', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 3, '030F0000-EEEE-4EEE-8EEE-00000000000D'),
    ('030E0000-EEEE-4EEE-8EEE-000000000041', @now, '03060000-EEEE-4EEE-8EEE-000000000005', 4, '030F0000-EEEE-4EEE-8EEE-00000000000D'),
    ('030E0000-EEEE-4EEE-8EEE-000000000042', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 2, '030F0000-EEEE-4EEE-8EEE-00000000000E'),
    ('030E0000-EEEE-4EEE-8EEE-000000000043', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 4, '030F0000-EEEE-4EEE-8EEE-00000000000E'),
    ('030E0000-EEEE-4EEE-8EEE-000000000044', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 2, '030F0000-EEEE-4EEE-8EEE-00000000000E'),
    ('030E0000-EEEE-4EEE-8EEE-000000000045', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 3, '030F0000-EEEE-4EEE-8EEE-00000000000E'),
    ('030E0000-EEEE-4EEE-8EEE-000000000046', @now, '03060000-EEEE-4EEE-8EEE-000000000005', 3, '030F0000-EEEE-4EEE-8EEE-00000000000E'),
    ('030E0000-EEEE-4EEE-8EEE-000000000047', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 3, '030F0000-EEEE-4EEE-8EEE-00000000000F'),
    ('030E0000-EEEE-4EEE-8EEE-000000000048', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 3, '030F0000-EEEE-4EEE-8EEE-00000000000F'),
    ('030E0000-EEEE-4EEE-8EEE-000000000049', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 3, '030F0000-EEEE-4EEE-8EEE-00000000000F'),
    ('030E0000-EEEE-4EEE-8EEE-00000000004A', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-00000000000F'),
    ('030E0000-EEEE-4EEE-8EEE-00000000004B', @now, '03060000-EEEE-4EEE-8EEE-000000000005', 3, '030F0000-EEEE-4EEE-8EEE-00000000000F'),
    ('030E0000-EEEE-4EEE-8EEE-00000000004C', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 3, '030F0000-EEEE-4EEE-8EEE-000000000010'),
    ('030E0000-EEEE-4EEE-8EEE-00000000004D', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 3, '030F0000-EEEE-4EEE-8EEE-000000000010'),
    ('030E0000-EEEE-4EEE-8EEE-00000000004E', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 3, '030F0000-EEEE-4EEE-8EEE-000000000010'),
    ('030E0000-EEEE-4EEE-8EEE-00000000004F', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 4, '030F0000-EEEE-4EEE-8EEE-000000000010'),
    ('030E0000-EEEE-4EEE-8EEE-000000000050', @now, '03060000-EEEE-4EEE-8EEE-000000000005', 3, '030F0000-EEEE-4EEE-8EEE-000000000010'),
    ('030E0000-EEEE-4EEE-8EEE-000000000051', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 3, '030F0000-EEEE-4EEE-8EEE-000000000011'),
    ('030E0000-EEEE-4EEE-8EEE-000000000052', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 3, '030F0000-EEEE-4EEE-8EEE-000000000011'),
    ('030E0000-EEEE-4EEE-8EEE-000000000053', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 2, '030F0000-EEEE-4EEE-8EEE-000000000011'),
    ('030E0000-EEEE-4EEE-8EEE-000000000054', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 3, '030F0000-EEEE-4EEE-8EEE-000000000011'),
    ('030E0000-EEEE-4EEE-8EEE-000000000055', @now, '03060000-EEEE-4EEE-8EEE-000000000005', 3, '030F0000-EEEE-4EEE-8EEE-000000000011'),
    ('030E0000-EEEE-4EEE-8EEE-000000000056', @now, '03060000-EEEE-4EEE-8EEE-000000000001', 2, '030F0000-EEEE-4EEE-8EEE-000000000012'),
    ('030E0000-EEEE-4EEE-8EEE-000000000057', @now, '03060000-EEEE-4EEE-8EEE-000000000002', 3, '030F0000-EEEE-4EEE-8EEE-000000000012'),
    ('030E0000-EEEE-4EEE-8EEE-000000000058', @now, '03060000-EEEE-4EEE-8EEE-000000000003', 1, '030F0000-EEEE-4EEE-8EEE-000000000012'),
    ('030E0000-EEEE-4EEE-8EEE-000000000059', @now, '03060000-EEEE-4EEE-8EEE-000000000004', 3, '030F0000-EEEE-4EEE-8EEE-000000000012'),
    ('030E0000-EEEE-4EEE-8EEE-00000000005A', @now, '03060000-EEEE-4EEE-8EEE-000000000005', 2, '030F0000-EEEE-4EEE-8EEE-000000000012'),
    ('030E0000-EEEE-4EEE-8EEE-00000000005B', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 5, '030F0000-EEEE-4EEE-8EEE-000000000013'),
    ('030E0000-EEEE-4EEE-8EEE-00000000005C', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 5, '030F0000-EEEE-4EEE-8EEE-000000000013'),
    ('030E0000-EEEE-4EEE-8EEE-00000000005D', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 5, '030F0000-EEEE-4EEE-8EEE-000000000013'),
    ('030E0000-EEEE-4EEE-8EEE-00000000005E', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 5, '030F0000-EEEE-4EEE-8EEE-000000000013'),
    ('030E0000-EEEE-4EEE-8EEE-00000000005F', @now, '03060000-EEEE-4EEE-8EEE-00000000000F', 4, '030F0000-EEEE-4EEE-8EEE-000000000013'),
    ('030E0000-EEEE-4EEE-8EEE-000000000060', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 5, '030F0000-EEEE-4EEE-8EEE-000000000014'),
    ('030E0000-EEEE-4EEE-8EEE-000000000061', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 5, '030F0000-EEEE-4EEE-8EEE-000000000014'),
    ('030E0000-EEEE-4EEE-8EEE-000000000062', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 5, '030F0000-EEEE-4EEE-8EEE-000000000014'),
    ('030E0000-EEEE-4EEE-8EEE-000000000063', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 5, '030F0000-EEEE-4EEE-8EEE-000000000014'),
    ('030E0000-EEEE-4EEE-8EEE-000000000064', @now, '03060000-EEEE-4EEE-8EEE-00000000000F', 4, '030F0000-EEEE-4EEE-8EEE-000000000014'),
    ('030E0000-EEEE-4EEE-8EEE-000000000065', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 5, '030F0000-EEEE-4EEE-8EEE-000000000015'),
    ('030E0000-EEEE-4EEE-8EEE-000000000066', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 4, '030F0000-EEEE-4EEE-8EEE-000000000015'),
    ('030E0000-EEEE-4EEE-8EEE-000000000067', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 5, '030F0000-EEEE-4EEE-8EEE-000000000015'),
    ('030E0000-EEEE-4EEE-8EEE-000000000068', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 4, '030F0000-EEEE-4EEE-8EEE-000000000015'),
    ('030E0000-EEEE-4EEE-8EEE-000000000069', @now, '03060000-EEEE-4EEE-8EEE-00000000000F', 5, '030F0000-EEEE-4EEE-8EEE-000000000015'),
    ('030E0000-EEEE-4EEE-8EEE-00000000006A', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 4, '030F0000-EEEE-4EEE-8EEE-000000000016'),
    ('030E0000-EEEE-4EEE-8EEE-00000000006B', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 4, '030F0000-EEEE-4EEE-8EEE-000000000016'),
    ('030E0000-EEEE-4EEE-8EEE-00000000006C', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 4, '030F0000-EEEE-4EEE-8EEE-000000000016'),
    ('030E0000-EEEE-4EEE-8EEE-00000000006D', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 4, '030F0000-EEEE-4EEE-8EEE-000000000016'),
    ('030E0000-EEEE-4EEE-8EEE-00000000006E', @now, '03060000-EEEE-4EEE-8EEE-00000000000F', 4, '030F0000-EEEE-4EEE-8EEE-000000000016'),
    ('030E0000-EEEE-4EEE-8EEE-00000000006F', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 4, '030F0000-EEEE-4EEE-8EEE-000000000017'),
    ('030E0000-EEEE-4EEE-8EEE-000000000070', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 5, '030F0000-EEEE-4EEE-8EEE-000000000017'),
    ('030E0000-EEEE-4EEE-8EEE-000000000071', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 4, '030F0000-EEEE-4EEE-8EEE-000000000017'),
    ('030E0000-EEEE-4EEE-8EEE-000000000072', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 5, '030F0000-EEEE-4EEE-8EEE-000000000017'),
    ('030E0000-EEEE-4EEE-8EEE-000000000073', @now, '03060000-EEEE-4EEE-8EEE-00000000000F', 4, '030F0000-EEEE-4EEE-8EEE-000000000017'),
    ('030E0000-EEEE-4EEE-8EEE-000000000074', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 4, '030F0000-EEEE-4EEE-8EEE-000000000018'),
    ('030E0000-EEEE-4EEE-8EEE-000000000075', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 5, '030F0000-EEEE-4EEE-8EEE-000000000018'),
    ('030E0000-EEEE-4EEE-8EEE-000000000076', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 4, '030F0000-EEEE-4EEE-8EEE-000000000018'),
    ('030E0000-EEEE-4EEE-8EEE-000000000077', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 5, '030F0000-EEEE-4EEE-8EEE-000000000018'),
    ('030E0000-EEEE-4EEE-8EEE-000000000078', @now, '03060000-EEEE-4EEE-8EEE-00000000000F', 4, '030F0000-EEEE-4EEE-8EEE-000000000018'),
    ('030E0000-EEEE-4EEE-8EEE-000000000079', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 4, '030F0000-EEEE-4EEE-8EEE-000000000019'),
    ('030E0000-EEEE-4EEE-8EEE-00000000007A', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 4, '030F0000-EEEE-4EEE-8EEE-000000000019'),
    ('030E0000-EEEE-4EEE-8EEE-00000000007B', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 5, '030F0000-EEEE-4EEE-8EEE-000000000019'),
    ('030E0000-EEEE-4EEE-8EEE-00000000007C', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 4, '030F0000-EEEE-4EEE-8EEE-000000000019'),
    ('030E0000-EEEE-4EEE-8EEE-00000000007D', @now, '03060000-EEEE-4EEE-8EEE-00000000000F', 4, '030F0000-EEEE-4EEE-8EEE-000000000019'),
    ('030E0000-EEEE-4EEE-8EEE-00000000007E', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 3, '030F0000-EEEE-4EEE-8EEE-00000000001A'),
    ('030E0000-EEEE-4EEE-8EEE-00000000007F', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 4, '030F0000-EEEE-4EEE-8EEE-00000000001A'),
    ('030E0000-EEEE-4EEE-8EEE-000000000080', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 4, '030F0000-EEEE-4EEE-8EEE-00000000001A'),
    ('030E0000-EEEE-4EEE-8EEE-000000000081', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 4, '030F0000-EEEE-4EEE-8EEE-00000000001A'),
    ('030E0000-EEEE-4EEE-8EEE-000000000082', @now, '03060000-EEEE-4EEE-8EEE-00000000000F', 3, '030F0000-EEEE-4EEE-8EEE-00000000001A'),
    ('030E0000-EEEE-4EEE-8EEE-000000000083', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 4, '030F0000-EEEE-4EEE-8EEE-00000000001B'),
    ('030E0000-EEEE-4EEE-8EEE-000000000084', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 4, '030F0000-EEEE-4EEE-8EEE-00000000001B'),
    ('030E0000-EEEE-4EEE-8EEE-000000000085', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 4, '030F0000-EEEE-4EEE-8EEE-00000000001B'),
    ('030E0000-EEEE-4EEE-8EEE-000000000086', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 4, '030F0000-EEEE-4EEE-8EEE-00000000001B'),
    ('030E0000-EEEE-4EEE-8EEE-000000000087', @now, '03060000-EEEE-4EEE-8EEE-00000000000F', 3, '030F0000-EEEE-4EEE-8EEE-00000000001B'),
    ('030E0000-EEEE-4EEE-8EEE-000000000088', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 4, '030F0000-EEEE-4EEE-8EEE-00000000001C'),
    ('030E0000-EEEE-4EEE-8EEE-000000000089', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 4, '030F0000-EEEE-4EEE-8EEE-00000000001C'),
    ('030E0000-EEEE-4EEE-8EEE-00000000008A', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 4, '030F0000-EEEE-4EEE-8EEE-00000000001C'),
    ('030E0000-EEEE-4EEE-8EEE-00000000008B', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 4, '030F0000-EEEE-4EEE-8EEE-00000000001C'),
    ('030E0000-EEEE-4EEE-8EEE-00000000008C', @now, '03060000-EEEE-4EEE-8EEE-00000000000F', 3, '030F0000-EEEE-4EEE-8EEE-00000000001C'),
    ('030E0000-EEEE-4EEE-8EEE-00000000008D', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 3, '030F0000-EEEE-4EEE-8EEE-00000000001D'),
    ('030E0000-EEEE-4EEE-8EEE-00000000008E', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 4, '030F0000-EEEE-4EEE-8EEE-00000000001D'),
    ('030E0000-EEEE-4EEE-8EEE-00000000008F', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 4, '030F0000-EEEE-4EEE-8EEE-00000000001D'),
    ('030E0000-EEEE-4EEE-8EEE-000000000090', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 4, '030F0000-EEEE-4EEE-8EEE-00000000001D'),
    ('030E0000-EEEE-4EEE-8EEE-000000000091', @now, '03060000-EEEE-4EEE-8EEE-00000000000F', 4, '030F0000-EEEE-4EEE-8EEE-00000000001D'),
    ('030E0000-EEEE-4EEE-8EEE-000000000092', @now, '03060000-EEEE-4EEE-8EEE-00000000000B', 2, '030F0000-EEEE-4EEE-8EEE-00000000001E'),
    ('030E0000-EEEE-4EEE-8EEE-000000000093', @now, '03060000-EEEE-4EEE-8EEE-00000000000C', 4, '030F0000-EEEE-4EEE-8EEE-00000000001E'),
    ('030E0000-EEEE-4EEE-8EEE-000000000094', @now, '03060000-EEEE-4EEE-8EEE-00000000000D', 3, '030F0000-EEEE-4EEE-8EEE-00000000001E'),
    ('030E0000-EEEE-4EEE-8EEE-000000000095', @now, '03060000-EEEE-4EEE-8EEE-00000000000E', 4, '030F0000-EEEE-4EEE-8EEE-00000000001E'),
    ('030E0000-EEEE-4EEE-8EEE-000000000096', @now, '03060000-EEEE-4EEE-8EEE-00000000000F', 3, '030F0000-EEEE-4EEE-8EEE-00000000001E');

INSERT INTO rankings (id, created_at, calculated_at, final_score, rank, round_id, team_id, version, lock_version) VALUES
    ('03100000-EEEE-4EEE-8EEE-000000000001', @now, @e3_prelimScore, 4.5750, 1, '03030000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000001', 1, 0),
    ('03100000-EEEE-4EEE-8EEE-000000000002', @now, @e3_prelimScore, 4.4400, 2, '03030000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000002', 1, 0),
    ('03100000-EEEE-4EEE-8EEE-000000000003', @now, @e3_prelimScore, 4.1300, 3, '03030000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000004', 1, 0),
    ('03100000-EEEE-4EEE-8EEE-000000000004', @now, @e3_prelimScore, 3.9950, 4, '03030000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000003', 1, 0),
    ('03100000-EEEE-4EEE-8EEE-000000000005', @now, @e3_prelimScore, 3.5600, 5, '03030000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000006', 1, 0),
    ('03100000-EEEE-4EEE-8EEE-000000000006', @now, @e3_prelimScore, 3.5250, 6, '03030000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000005', 1, 0),
    ('03100000-EEEE-4EEE-8EEE-000000000007', @now, @e3_prelimScore, 3.0900, 7, '03030000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000008', 1, 0),
    ('03100000-EEEE-4EEE-8EEE-000000000008', @now, @e3_prelimScore, 3.0550, 8, '03030000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000007', 1, 0),
    ('03100000-EEEE-4EEE-8EEE-000000000009', @now, @e3_prelimScore, 2.4950, 9, '03030000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000009', 1, 0);

INSERT INTO rankings (id, created_at, calculated_at, final_score, rank, round_id, team_id, version, lock_version) VALUES
    ('03110000-EEEE-4EEE-8EEE-000000000001', @now, @e3_finalScore, 4.9000, 1, '03030000-EEEE-4EEE-8EEE-000000000002', '03050000-EEEE-4EEE-8EEE-000000000001', 1, 0),
    ('03110000-EEEE-4EEE-8EEE-000000000002', @now, @e3_finalScore, 4.3900, 2, '03030000-EEEE-4EEE-8EEE-000000000002', '03050000-EEEE-4EEE-8EEE-000000000004', 1, 0),
    ('03110000-EEEE-4EEE-8EEE-000000000003', @now, @e3_finalScore, 4.2800, 3, '03030000-EEEE-4EEE-8EEE-000000000002', '03050000-EEEE-4EEE-8EEE-000000000002', 1, 0),
    ('03110000-EEEE-4EEE-8EEE-000000000004', @now, @e3_finalScore, 3.8700, 4, '03030000-EEEE-4EEE-8EEE-000000000002', '03050000-EEEE-4EEE-8EEE-000000000006', 1, 0),
    ('03110000-EEEE-4EEE-8EEE-000000000005', @now, @e3_finalScore, 3.8600, 5, '03030000-EEEE-4EEE-8EEE-000000000002', '03050000-EEEE-4EEE-8EEE-000000000008', 1, 0),
    ('03110000-EEEE-4EEE-8EEE-000000000006', @now, @e3_finalScore, 3.3500, 6, '03030000-EEEE-4EEE-8EEE-000000000002', '03050000-EEEE-4EEE-8EEE-000000000007', 1, 0);

INSERT INTO finalist_selections (id, event_id, team_id, track_id, preliminary_rank, selected_reason, selected_at, created_at, updated_at, selection_method, eligible) VALUES
    ('03120000-EEEE-4EEE-8EEE-000000000001', '03020000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000001', '03040000-EEEE-4EEE-8EEE-000000000001', 1, N'Top 1 in track', @e3_prelimScore, @now, @now, 'AUTO', 1),
    ('03120000-EEEE-4EEE-8EEE-000000000002', '03020000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000002', '03040000-EEEE-4EEE-8EEE-000000000001', 2, N'Top 2 in track', @e3_prelimScore, @now, @now, 'AUTO', 1),
    ('03120000-EEEE-4EEE-8EEE-000000000003', '03020000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000004', '03040000-EEEE-4EEE-8EEE-000000000002', 1, N'Top 1 in track', @e3_prelimScore, @now, @now, 'AUTO', 1),
    ('03120000-EEEE-4EEE-8EEE-000000000004', '03020000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000006', '03040000-EEEE-4EEE-8EEE-000000000002', 2, N'Top 2 in track', @e3_prelimScore, @now, @now, 'AUTO', 1),
    ('03120000-EEEE-4EEE-8EEE-000000000005', '03020000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000008', '03040000-EEEE-4EEE-8EEE-000000000003', 1, N'Top 1 in track', @e3_prelimScore, @now, @now, 'AUTO', 1),
    ('03120000-EEEE-4EEE-8EEE-000000000006', '03020000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000007', '03040000-EEEE-4EEE-8EEE-000000000003', 2, N'Top 2 in track', @e3_prelimScore, @now, @now, 'AUTO', 1);

INSERT INTO published_results (id, created_at, dispute_deadline, published_at, published_by, round_id) VALUES
    ('03130000-EEEE-4EEE-8EEE-000000000001', @now, DATEADD(DAY, 2, @e3_prelimScore), @e3_prelimScore, @coordId, '03030000-EEEE-4EEE-8EEE-000000000001'),
    ('03130000-EEEE-4EEE-8EEE-000000000002', @now, DATEADD(DAY, 2, @e3_finalScore), @e3_finalScore, @coordId, '03030000-EEEE-4EEE-8EEE-000000000002');

INSERT INTO team_awards (id, event_id, team_id, prize_id, awarded_at, created_at, updated_at) VALUES
    ('03140000-EEEE-4EEE-8EEE-000000000001', '03020000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000001', '03070000-EEEE-4EEE-8EEE-000000000001', @e3_finalEnd, @now, @now),
    ('03140000-EEEE-4EEE-8EEE-000000000002', '03020000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000004', '03070000-EEEE-4EEE-8EEE-000000000002', @e3_finalEnd, @now, @now),
    ('03140000-EEEE-4EEE-8EEE-000000000003', '03020000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000002', '03070000-EEEE-4EEE-8EEE-000000000003', @e3_finalEnd, @now, @now),
    ('03140000-EEEE-4EEE-8EEE-000000000004', '03020000-EEEE-4EEE-8EEE-000000000001', '03050000-EEEE-4EEE-8EEE-000000000006', '03070000-EEEE-4EEE-8EEE-000000000004', @e3_finalEnd, @now, @now);

-- ============================================================
-- === SEAL Hackathon Summer 2026 - Agentic RAG Build Day ===
-- QA phase: ACTIVE submission window - some teams submitted, none scored
-- Login: vo.thanh.phong.summer26@fpt.edu.vn (leader, no submission yet) / Demo@123456
-- View: /student/submissions
-- ============================================================

DECLARE @e4_compDay DATE = CAST(DATEADD(DAY, -1, @now) AS DATE);
DECLARE @e4_endDay DATE = CAST(DATEADD(DAY, 6, @now) AS DATE);
DECLARE @e4_compDt DATETIME2 = CAST(@e4_compDay AS DATETIME2);
DECLARE @e4_regOpen DATE = CAST(DATEADD(DAY, -20, @now) AS DATE);
DECLARE @e4_regDeadline DATE = CAST(DATEADD(DAY, -2, @now) AS DATE);
DECLARE @e4_prelimStart DATETIME2 = DATEADD(DAY, -1, @now);
DECLARE @e4_prelimSub DATETIME2 = DATEADD(DAY, 3, @now);
DECLARE @e4_prelimScore DATETIME2 = DATEADD(DAY, 5, @now);
DECLARE @e4_finalStart DATETIME2 = DATEADD(DAY, 5, @now);
DECLARE @e4_finalSub DATETIME2 = DATEADD(DAY, 5, @now);
DECLARE @e4_finalScore DATETIME2 = DATEADD(DAY, 6, @now);
DECLARE @e4_finalEnd DATETIME2 = DATEADD(DAY, 6, @now);

INSERT INTO hackathon_events (
    id, name, season, year, start_date, end_date,
    registration_open_date, registration_deadline,
    description, location, format, competition_format,
    min_team, max_team, semester_min, semester_max,
    scoring_template_id, status, leaderboard_public,
    owner_user_id, created_by, created_at, updated_at
) VALUES (
    '04020000-EEEE-4EEE-8EEE-000000000001',
    N'SEAL Hackathon Summer 2026 - Agentic RAG Build Day',
    N'Summer', 2026,
    @e4_compDay, @e4_endDay,
    @e4_regOpen, @e4_regDeadline,
    N'SEAL Hackathon Summer 2026 focuses on Agentic RAG systems: grounded retrieval, multi-step agent orchestration, and enterprise-ready copilots built by FPT University teams.',
    N'FPT University HCM', 'OFFLINE', 'SEAL_RAG_2026',
    3, 5, 4, 8,
    @templateId, 'ACTIVE', 0,
    @coordId, N'tran.thanh.ha@fpt.edu.vn', @now, @now
);

INSERT INTO tracks (id, event_id, name, description, max_teams, status, created_at, updated_at) VALUES
    ('04040000-EEEE-4EEE-8EEE-000000000001', '04020000-EEEE-4EEE-8EEE-000000000001', N'Grounded Retrieval', N'SEAL track: Grounded Retrieval', 8, 'OPEN', @now, @now),
    ('04040000-EEEE-4EEE-8EEE-000000000002', '04020000-EEEE-4EEE-8EEE-000000000001', N'Agent Orchestration', N'SEAL track: Agent Orchestration', 8, 'OPEN', @now, @now),
    ('04040000-EEEE-4EEE-8EEE-000000000003', '04020000-EEEE-4EEE-8EEE-000000000001', N'Enterprise Copilot', N'SEAL track: Enterprise Copilot', 8, 'OPEN', @now, @now);

INSERT INTO rounds (
    id, event_id, round_number, name, round_type,
    start_date, end_date, slide_deadline, submission_deadline, scoring_deadline,
    advancement_cutoff, advancement_rule, round_weight, created_at, updated_at
) VALUES
    ('04030000-EEEE-4EEE-8EEE-000000000001', '04020000-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', 'PRELIMINARY',
     @e4_prelimStart, @e4_prelimScore, DATEADD(HOUR, -4, @e4_prelimSub),
     @e4_prelimSub, @e4_prelimScore,
     2, 'PER_TRACK_TOP_N', 40, @now, @now),
    ('04030000-EEEE-4EEE-8EEE-000000000002', '04020000-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', 'FINAL',
     @e4_finalStart, @e4_finalEnd, NULL,
     @e4_finalSub, @e4_finalScore,
     6, 'FINALIST_POOL', 60, @now, @now);

INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at) VALUES
    ('04060000-EEEE-4EEE-8EEE-000000000001', '04030000-EEEE-4EEE-8EEE-000000000001', N'Accuracy and Domain Relevance', N'Accuracy and Domain Relevance', 30, 0, 1, 5, @now, @now),
    ('04060000-EEEE-4EEE-8EEE-000000000002', '04030000-EEEE-4EEE-8EEE-000000000001', N'Agentic RAG Architecture & Algorithm', N'Agentic RAG Architecture & Algorithm', 30, 1, 1, 5, @now, @now),
    ('04060000-EEEE-4EEE-8EEE-000000000003', '04030000-EEEE-4EEE-8EEE-000000000001', N'Ideas & Presentation', N'Ideas & Presentation', 15, 2, 1, 5, @now, @now),
    ('04060000-EEEE-4EEE-8EEE-000000000004', '04030000-EEEE-4EEE-8EEE-000000000001', N'Feasibility & Creativity', N'Feasibility & Creativity', 15, 3, 1, 5, @now, @now),
    ('04060000-EEEE-4EEE-8EEE-000000000005', '04030000-EEEE-4EEE-8EEE-000000000001', N'User Experience & Interactive Interface', N'User Experience & Interactive Interface', 10, 4, 1, 5, @now, @now),
    ('04060000-EEEE-4EEE-8EEE-00000000000B', '04030000-EEEE-4EEE-8EEE-000000000002', N'Data Processing & Retrieval Quality', N'Data Processing & Retrieval Quality', 30, 0, 1, 5, @now, @now),
    ('04060000-EEEE-4EEE-8EEE-00000000000C', '04030000-EEEE-4EEE-8EEE-000000000002', N'Reliability & Hallucination Resistance', N'Reliability & Hallucination Resistance', 20, 1, 1, 5, @now, @now),
    ('04060000-EEEE-4EEE-8EEE-00000000000D', '04030000-EEEE-4EEE-8EEE-000000000002', N'Agent Reasoning & Multi-hop Processing', N'Agent Reasoning & Multi-hop Processing', 20, 2, 1, 5, @now, @now),
    ('04060000-EEEE-4EEE-8EEE-00000000000E', '04030000-EEEE-4EEE-8EEE-000000000002', N'Practicality & Operational Optimization', N'Practicality & Operational Optimization', 20, 3, 1, 5, @now, @now),
    ('04060000-EEEE-4EEE-8EEE-00000000000F', '04030000-EEEE-4EEE-8EEE-000000000002', N'Scalability & Innovation', N'Scalability & Innovation', 10, 4, 1, 5, @now, @now);

INSERT INTO prizes (id, event_id, rank, value, quantity, label, created_at, updated_at) VALUES
    ('04070000-EEEE-4EEE-8EEE-000000000001', '04020000-EEEE-4EEE-8EEE-000000000001', 'FIRST', '7000000', 1, N'First Prize', @now, @now),
    ('04070000-EEEE-4EEE-8EEE-000000000002', '04020000-EEEE-4EEE-8EEE-000000000001', 'SECOND', '5000000', 1, N'Second Prize', @now, @now),
    ('04070000-EEEE-4EEE-8EEE-000000000003', '04020000-EEEE-4EEE-8EEE-000000000001', 'THIRD', '3000000', 1, N'Third Prize', @now, @now),
    ('04070000-EEEE-4EEE-8EEE-000000000004', '04020000-EEEE-4EEE-8EEE-000000000001', 'CONSOLATION', '1500000', 1, N'Consolation Prize', @now, @now);

INSERT INTO event_schedules (id, event_id, type, title, description, start_time, end_time, gate, sort_order, created_at, updated_at) VALUES
    ('04080000-EEEE-4EEE-8EEE-000000000001', '04020000-EEEE-4EEE-8EEE-000000000001', 'WORKSHOP', N'Workshop', NULL, DATEADD(DAY, -3, @e4_compDt), DATEADD(HOUR, 3, DATEADD(DAY, -3, @e4_compDt)), NULL, 0, @now, @now),
    ('04080000-EEEE-4EEE-8EEE-000000000002', '04020000-EEEE-4EEE-8EEE-000000000001', 'OPENING', N'Opening & track draw', N'Teams pick tracks in turn; organizers draw topics per track', DATEADD(DAY, -1, @e4_compDt), DATEADD(HOUR, 3, DATEADD(DAY, -1, @e4_compDt)), NULL, 1, @now, @now),
    ('04080000-EEEE-4EEE-8EEE-000000000003', '04020000-EEEE-4EEE-8EEE-000000000001', 'TRACK_DRAW', N'Track selection draw', NULL, DATEADD(DAY, -1, @e4_compDt), DATEADD(HOUR, 2, DATEADD(DAY, -1, @e4_compDt)), NULL, 2, @now, @now),
    ('04080000-EEEE-4EEE-8EEE-000000000004', '04020000-EEEE-4EEE-8EEE-000000000001', 'MILESTONE', N'Milestone 1 - Idea & architecture completion', N'Design Agentic RAG architecture', @e4_prelimStart, DATEADD(HOUR, 3, @e4_prelimStart), 'SLIDE_SUBMISSION', 3, @now, @now),
    ('04080000-EEEE-4EEE-8EEE-000000000005', '04020000-EEEE-4EEE-8EEE-000000000001', 'MILESTONE', N'Milestone 2 - Pitching & product completion', N'Parallel pitching and coding', DATEADD(HOUR, 3, @e4_prelimStart), @e4_prelimSub, 'DEMO_SUBMISSION', 4, @now, @now),
    ('04080000-EEEE-4EEE-8EEE-000000000006', '04020000-EEEE-4EEE-8EEE-000000000001', 'SCORING', N'Preliminary scoring', N'5-minute presentation + 3-minute Q&A', @e4_prelimSub, @e4_prelimScore, NULL, 5, @now, @now),
    ('04080000-EEEE-4EEE-8EEE-000000000007', '04020000-EEEE-4EEE-8EEE-000000000001', 'FINAL', N'Finals', N'7-minute presentation + 3-minute Q&A - Top 6 teams', @e4_finalStart, @e4_finalEnd, NULL, 6, @now, @now),
    ('04080000-EEEE-4EEE-8EEE-000000000008', '04020000-EEEE-4EEE-8EEE-000000000001', 'CEREMONY', N'Awards & closing ceremony', NULL, @e4_finalEnd, DATEADD(HOUR, 1, @e4_finalEnd), NULL, 7, @now, @now);

INSERT INTO allowed_email_domains (id, event_id, domain, university_label, created_at, updated_at) VALUES
    ('04090000-EEEE-4EEE-8EEE-000000000001', '04020000-EEEE-4EEE-8EEE-000000000001', 'fpt.edu.vn', N'FPT University', @now, @now),
    ('04090000-EEEE-4EEE-8EEE-000000000002', '04020000-EEEE-4EEE-8EEE-000000000001', 'fe.edu.vn', N'FPT Education', @now, @now),
    ('04090000-EEEE-4EEE-8EEE-000000000003', '04020000-EEEE-4EEE-8EEE-000000000001', 'hcmut.edu.vn', N'Ho Chi Minh City University of Technology', @now, @now),
    ('04090000-EEEE-4EEE-8EEE-000000000004', '04020000-EEEE-4EEE-8EEE-000000000001', 'hcmus.edu.vn', N'Vietnam National University Ho Chi Minh City - University of Science', @now, @now),
    ('04090000-EEEE-4EEE-8EEE-000000000005', '04020000-EEEE-4EEE-8EEE-000000000001', 'student.hcmus.edu.vn', N'Vietnam National University Ho Chi Minh City - University of Science', @now, @now),
    ('04090000-EEEE-4EEE-8EEE-000000000006', '04020000-EEEE-4EEE-8EEE-000000000001', 'uit.edu.vn', N'University of Information Technology', @now, @now),
    ('04090000-EEEE-4EEE-8EEE-000000000007', '04020000-EEEE-4EEE-8EEE-000000000001', 'hcmute.edu.vn', N'Ho Chi Minh City University of Education and Technology', @now, @now),
    ('04090000-EEEE-4EEE-8EEE-000000000008', '04020000-EEEE-4EEE-8EEE-000000000001', 'ueh.edu.vn', N'University of Economics Ho Chi Minh City', @now, @now),
    ('04090000-EEEE-4EEE-8EEE-000000000009', '04020000-EEEE-4EEE-8EEE-000000000001', 'student.ueh.edu.vn', N'University of Economics Ho Chi Minh City', @now, @now),
    ('04090000-EEEE-4EEE-8EEE-00000000000A', '04020000-EEEE-4EEE-8EEE-000000000001', 'student.iuh.edu.vn', N'Industrial University of Ho Chi Minh City', @now, @now);

INSERT INTO event_enrollments (id, created_at, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public) VALUES
    ('040A0000-EEEE-4EEE-8EEE-000000000001', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-000000000001', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-000000000002', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-000000000002', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-000000000003', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-000000000003', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-000000000004', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-000000000004', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-000000000005', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-000000000005', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-000000000006', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-000000000006', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-000000000007', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-000000000007', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-000000000008', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-000000000008', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-000000000009', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-000000000009', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-00000000000A', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-00000000000B', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-00000000000B', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-00000000000C', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-00000000000C', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-00000000000D', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-00000000000D', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-00000000000E', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-00000000000E', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-00000000000F', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-00000000000F', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-000000000010', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-000000000010', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-000000000011', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-000000000011', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-000000000012', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-000000000012', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-000000000013', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-000000000013', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-000000000014', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-000000000014', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-000000000015', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-000000000015', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-000000000016', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-000000000016', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-000000000017', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-000000000017', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-000000000018', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-000000000018', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-000000000019', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-000000000019', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-00000000001A', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-00000000001A', 0, 0),
    ('040A0000-EEEE-4EEE-8EEE-00000000001B', @now, @now, '04020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '04010000-EEEE-4EEE-8EEE-00000000001B', 0, 0);

INSERT INTO teams (id, created_at, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, is_recruiting, recruitment_note, version) VALUES
    ('04050000-EEEE-4EEE-8EEE-000000000001', @now, '04020000-EEEE-4EEE-8EEE-000000000001', '04010000-EEEE-4EEE-8EEE-000000000001', N'BuildFast RAG', 'CONFIRMED', '04040000-EEEE-4EEE-8EEE-000000000001', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Grounded Retrieval track.', 0),
    ('04050000-EEEE-4EEE-8EEE-000000000002', @now, '04020000-EEEE-4EEE-8EEE-000000000001', '04010000-EEEE-4EEE-8EEE-000000000004', N'SprintAgent', 'CONFIRMED', '04040000-EEEE-4EEE-8EEE-000000000001', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Grounded Retrieval track.', 0),
    ('04050000-EEEE-4EEE-8EEE-000000000003', @now, '04020000-EEEE-4EEE-8EEE-000000000001', '04010000-EEEE-4EEE-8EEE-000000000007', N'LiveRetrieve', 'CONFIRMED', '04040000-EEEE-4EEE-8EEE-000000000001', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Grounded Retrieval track.', 0),
    ('04050000-EEEE-4EEE-8EEE-000000000004', @now, '04020000-EEEE-4EEE-8EEE-000000000001', '04010000-EEEE-4EEE-8EEE-00000000000A', N'PitchCraft', 'CONFIRMED', '04040000-EEEE-4EEE-8EEE-000000000002', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Agent Orchestration track.', 0),
    ('04050000-EEEE-4EEE-8EEE-000000000005', @now, '04020000-EEEE-4EEE-8EEE-000000000001', '04010000-EEEE-4EEE-8EEE-00000000000D', N'DemoForge', 'CONFIRMED', '04040000-EEEE-4EEE-8EEE-000000000002', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Agent Orchestration track.', 0),
    ('04050000-EEEE-4EEE-8EEE-000000000006', @now, '04020000-EEEE-4EEE-8EEE-000000000001', '04010000-EEEE-4EEE-8EEE-000000000010', N'RapidHop', 'CONFIRMED', '04040000-EEEE-4EEE-8EEE-000000000002', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Agent Orchestration track.', 0),
    ('04050000-EEEE-4EEE-8EEE-000000000007', @now, '04020000-EEEE-4EEE-8EEE-000000000001', '04010000-EEEE-4EEE-8EEE-000000000013', N'SeedPilot', 'CONFIRMED', '04040000-EEEE-4EEE-8EEE-000000000003', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Enterprise Copilot track.', 0),
    ('04050000-EEEE-4EEE-8EEE-000000000008', @now, '04020000-EEEE-4EEE-8EEE-000000000001', '04010000-EEEE-4EEE-8EEE-000000000016', N'FlashContext', 'CONFIRMED', '04040000-EEEE-4EEE-8EEE-000000000003', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Enterprise Copilot track.', 0),
    ('04050000-EEEE-4EEE-8EEE-000000000009', @now, '04020000-EEEE-4EEE-8EEE-000000000001', '04010000-EEEE-4EEE-8EEE-000000000019', N'WireAgent', 'CONFIRMED', '04040000-EEEE-4EEE-8EEE-000000000003', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Enterprise Copilot track.', 0);

INSERT INTO team_members (id, created_at, joined_at, role, user_id, team_id, event_id) VALUES
    ('040B0000-EEEE-4EEE-8EEE-000000000001', @now, @now, 'LEADER', '04010000-EEEE-4EEE-8EEE-000000000001', '04050000-EEEE-4EEE-8EEE-000000000001', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-000000000002', @now, @now, 'MEMBER', '04010000-EEEE-4EEE-8EEE-000000000002', '04050000-EEEE-4EEE-8EEE-000000000001', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-000000000003', @now, @now, 'MEMBER', '04010000-EEEE-4EEE-8EEE-000000000003', '04050000-EEEE-4EEE-8EEE-000000000001', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-000000000004', @now, @now, 'LEADER', '04010000-EEEE-4EEE-8EEE-000000000004', '04050000-EEEE-4EEE-8EEE-000000000002', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-000000000005', @now, @now, 'MEMBER', '04010000-EEEE-4EEE-8EEE-000000000005', '04050000-EEEE-4EEE-8EEE-000000000002', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-000000000006', @now, @now, 'MEMBER', '04010000-EEEE-4EEE-8EEE-000000000006', '04050000-EEEE-4EEE-8EEE-000000000002', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-000000000007', @now, @now, 'LEADER', '04010000-EEEE-4EEE-8EEE-000000000007', '04050000-EEEE-4EEE-8EEE-000000000003', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-000000000008', @now, @now, 'MEMBER', '04010000-EEEE-4EEE-8EEE-000000000008', '04050000-EEEE-4EEE-8EEE-000000000003', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-000000000009', @now, @now, 'MEMBER', '04010000-EEEE-4EEE-8EEE-000000000009', '04050000-EEEE-4EEE-8EEE-000000000003', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, 'LEADER', '04010000-EEEE-4EEE-8EEE-00000000000A', '04050000-EEEE-4EEE-8EEE-000000000004', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-00000000000B', @now, @now, 'MEMBER', '04010000-EEEE-4EEE-8EEE-00000000000B', '04050000-EEEE-4EEE-8EEE-000000000004', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-00000000000C', @now, @now, 'MEMBER', '04010000-EEEE-4EEE-8EEE-00000000000C', '04050000-EEEE-4EEE-8EEE-000000000004', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-00000000000D', @now, @now, 'LEADER', '04010000-EEEE-4EEE-8EEE-00000000000D', '04050000-EEEE-4EEE-8EEE-000000000005', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-00000000000E', @now, @now, 'MEMBER', '04010000-EEEE-4EEE-8EEE-00000000000E', '04050000-EEEE-4EEE-8EEE-000000000005', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-00000000000F', @now, @now, 'MEMBER', '04010000-EEEE-4EEE-8EEE-00000000000F', '04050000-EEEE-4EEE-8EEE-000000000005', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-000000000010', @now, @now, 'LEADER', '04010000-EEEE-4EEE-8EEE-000000000010', '04050000-EEEE-4EEE-8EEE-000000000006', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-000000000011', @now, @now, 'MEMBER', '04010000-EEEE-4EEE-8EEE-000000000011', '04050000-EEEE-4EEE-8EEE-000000000006', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-000000000012', @now, @now, 'MEMBER', '04010000-EEEE-4EEE-8EEE-000000000012', '04050000-EEEE-4EEE-8EEE-000000000006', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-000000000013', @now, @now, 'LEADER', '04010000-EEEE-4EEE-8EEE-000000000013', '04050000-EEEE-4EEE-8EEE-000000000007', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-000000000014', @now, @now, 'MEMBER', '04010000-EEEE-4EEE-8EEE-000000000014', '04050000-EEEE-4EEE-8EEE-000000000007', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-000000000015', @now, @now, 'MEMBER', '04010000-EEEE-4EEE-8EEE-000000000015', '04050000-EEEE-4EEE-8EEE-000000000007', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-000000000016', @now, @now, 'LEADER', '04010000-EEEE-4EEE-8EEE-000000000016', '04050000-EEEE-4EEE-8EEE-000000000008', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-000000000017', @now, @now, 'MEMBER', '04010000-EEEE-4EEE-8EEE-000000000017', '04050000-EEEE-4EEE-8EEE-000000000008', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-000000000018', @now, @now, 'MEMBER', '04010000-EEEE-4EEE-8EEE-000000000018', '04050000-EEEE-4EEE-8EEE-000000000008', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-000000000019', @now, @now, 'LEADER', '04010000-EEEE-4EEE-8EEE-000000000019', '04050000-EEEE-4EEE-8EEE-000000000009', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-00000000001A', @now, @now, 'MEMBER', '04010000-EEEE-4EEE-8EEE-00000000001A', '04050000-EEEE-4EEE-8EEE-000000000009', '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040B0000-EEEE-4EEE-8EEE-00000000001B', @now, @now, 'MEMBER', '04010000-EEEE-4EEE-8EEE-00000000001B', '04050000-EEEE-4EEE-8EEE-000000000009', '04020000-EEEE-4EEE-8EEE-000000000001');

INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id) VALUES
    ('040C0000-EEEE-4EEE-8EEE-000000000001', @now, @now, @judge1Id, '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040C0000-EEEE-4EEE-8EEE-000000000002', @now, @now, @judge2Id, '04020000-EEEE-4EEE-8EEE-000000000001'),
    ('040C0000-EEEE-4EEE-8EEE-000000000008', @now, @now, @judge3Id, '04020000-EEEE-4EEE-8EEE-000000000001');
INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active) VALUES
    ('040C0000-EEEE-4EEE-8EEE-000000000003', @now, @now, @judge1Id, '04030000-EEEE-4EEE-8EEE-000000000001', 'ROUND', 1),
    ('040C0000-EEEE-4EEE-8EEE-000000000004', @now, @now, @judge2Id, '04030000-EEEE-4EEE-8EEE-000000000001', 'ROUND', 1),
    ('040C0000-EEEE-4EEE-8EEE-000000000009', @now, @now, @judge3Id, '04030000-EEEE-4EEE-8EEE-000000000001', 'ROUND', 1),
    ('040C0000-EEEE-4EEE-8EEE-000000000005', @now, @now, @judge1Id, '04030000-EEEE-4EEE-8EEE-000000000002', 'ROUND', 1),
    ('040C0000-EEEE-4EEE-8EEE-000000000006', @now, @now, @judge2Id, '04030000-EEEE-4EEE-8EEE-000000000002', 'ROUND', 1),
    ('040C0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, @judge3Id, '04030000-EEEE-4EEE-8EEE-000000000002', 'ROUND', 1);
INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at) VALUES
    ('040C0000-EEEE-4EEE-8EEE-000000000007', '04020000-EEEE-4EEE-8EEE-000000000001', @mentor1Id, @now, @now),
    ('040C0000-EEEE-4EEE-8EEE-00000000000B', '04020000-EEEE-4EEE-8EEE-000000000001', @mentor2Id, @now, @now),
    ('040C0000-EEEE-4EEE-8EEE-00000000000C', '04020000-EEEE-4EEE-8EEE-000000000001', @mentor3Id, @now, @now);

INSERT INTO mentor_assignments (id, created_at, assigned_at, mentor_user_id, event_id, track_id) VALUES
    ('04160000-EEEE-4EEE-8EEE-000000000001', @now, @now, @mentor1Id, '04020000-EEEE-4EEE-8EEE-000000000001', '04040000-EEEE-4EEE-8EEE-000000000001'),
    ('04160000-EEEE-4EEE-8EEE-000000000002', @now, @now, @mentor2Id, '04020000-EEEE-4EEE-8EEE-000000000001', '04040000-EEEE-4EEE-8EEE-000000000002'),
    ('04160000-EEEE-4EEE-8EEE-000000000003', @now, @now, @mentor3Id, '04020000-EEEE-4EEE-8EEE-000000000001', '04040000-EEEE-4EEE-8EEE-000000000003');

INSERT INTO mentor_teams (id, created_at, assigned_at, mentor_user_id, team_id) VALUES
    ('04170000-EEEE-4EEE-8EEE-000000000001', @now, @now, @mentor1Id, '04050000-EEEE-4EEE-8EEE-000000000001'),
    ('04170000-EEEE-4EEE-8EEE-000000000002', @now, @now, @mentor1Id, '04050000-EEEE-4EEE-8EEE-000000000002'),
    ('04170000-EEEE-4EEE-8EEE-000000000003', @now, @now, @mentor1Id, '04050000-EEEE-4EEE-8EEE-000000000003'),
    ('04170000-EEEE-4EEE-8EEE-000000000004', @now, @now, @mentor2Id, '04050000-EEEE-4EEE-8EEE-000000000004'),
    ('04170000-EEEE-4EEE-8EEE-000000000005', @now, @now, @mentor2Id, '04050000-EEEE-4EEE-8EEE-000000000005'),
    ('04170000-EEEE-4EEE-8EEE-000000000006', @now, @now, @mentor2Id, '04050000-EEEE-4EEE-8EEE-000000000006'),
    ('04170000-EEEE-4EEE-8EEE-000000000007', @now, @now, @mentor3Id, '04050000-EEEE-4EEE-8EEE-000000000007'),
    ('04170000-EEEE-4EEE-8EEE-000000000008', @now, @now, @mentor3Id, '04050000-EEEE-4EEE-8EEE-000000000008'),
    ('04170000-EEEE-4EEE-8EEE-000000000009', @now, @now, @mentor3Id, '04050000-EEEE-4EEE-8EEE-000000000009');

INSERT INTO mentor_invitations (id, created_at, team_id, mentor_user_id, inviter_id, status, message) VALUES
    ('04180000-EEEE-4EEE-8EEE-000000000001', @now, '04050000-EEEE-4EEE-8EEE-000000000001', @mentor1Id, '04010000-EEEE-4EEE-8EEE-000000000001', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('04180000-EEEE-4EEE-8EEE-000000000002', @now, '04050000-EEEE-4EEE-8EEE-000000000002', @mentor1Id, '04010000-EEEE-4EEE-8EEE-000000000004', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('04180000-EEEE-4EEE-8EEE-000000000003', @now, '04050000-EEEE-4EEE-8EEE-000000000003', @mentor1Id, '04010000-EEEE-4EEE-8EEE-000000000007', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('04180000-EEEE-4EEE-8EEE-000000000004', @now, '04050000-EEEE-4EEE-8EEE-000000000004', @mentor2Id, '04010000-EEEE-4EEE-8EEE-00000000000A', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('04180000-EEEE-4EEE-8EEE-000000000005', @now, '04050000-EEEE-4EEE-8EEE-000000000005', @mentor2Id, '04010000-EEEE-4EEE-8EEE-00000000000D', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('04180000-EEEE-4EEE-8EEE-000000000006', @now, '04050000-EEEE-4EEE-8EEE-000000000006', @mentor2Id, '04010000-EEEE-4EEE-8EEE-000000000010', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('04180000-EEEE-4EEE-8EEE-000000000007', @now, '04050000-EEEE-4EEE-8EEE-000000000007', @mentor3Id, '04010000-EEEE-4EEE-8EEE-000000000013', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('04180000-EEEE-4EEE-8EEE-000000000008', @now, '04050000-EEEE-4EEE-8EEE-000000000008', @mentor3Id, '04010000-EEEE-4EEE-8EEE-000000000016', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('04180000-EEEE-4EEE-8EEE-000000000009', @now, '04050000-EEEE-4EEE-8EEE-000000000009', @mentor3Id, '04010000-EEEE-4EEE-8EEE-000000000019', 'ACCEPTED', N'Seeded mentor assignment for QA');

INSERT INTO submissions (id, created_at, current_version_id, round_id, status, submitted_by, team_id, opt_lock) VALUES
    ('040D0000-EEEE-4EEE-8EEE-000000000001', @now, NULL, '04030000-EEEE-4EEE-8EEE-000000000001', 'SUBMITTED', '04010000-EEEE-4EEE-8EEE-000000000001', '04050000-EEEE-4EEE-8EEE-000000000001', 0),
    ('040D0000-EEEE-4EEE-8EEE-000000000002', @now, NULL, '04030000-EEEE-4EEE-8EEE-000000000001', 'SUBMITTED', '04010000-EEEE-4EEE-8EEE-000000000007', '04050000-EEEE-4EEE-8EEE-000000000003', 0),
    ('040D0000-EEEE-4EEE-8EEE-000000000003', @now, NULL, '04030000-EEEE-4EEE-8EEE-000000000001', 'SUBMITTED', '04010000-EEEE-4EEE-8EEE-00000000000D', '04050000-EEEE-4EEE-8EEE-000000000005', 0),
    ('040D0000-EEEE-4EEE-8EEE-000000000004', @now, NULL, '04030000-EEEE-4EEE-8EEE-000000000001', 'SUBMITTED', '04010000-EEEE-4EEE-8EEE-000000000013', '04050000-EEEE-4EEE-8EEE-000000000007', 0),
    ('040D0000-EEEE-4EEE-8EEE-000000000005', @now, NULL, '04030000-EEEE-4EEE-8EEE-000000000001', 'SUBMITTED', '04010000-EEEE-4EEE-8EEE-000000000019', '04050000-EEEE-4EEE-8EEE-000000000009', 0);

INSERT INTO submission_versions (id, created_at, demo_url, github_url, slide_url, submitted_at, version_number, submission_id) VALUES
    ('040E0000-EEEE-4EEE-8EEE-000000000001', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/buildfast-rag', N'https://docs.google.com/presentation/d/seal-4-0', DATEADD(MINUTE, -30, @e4_prelimSub), 1, '040D0000-EEEE-4EEE-8EEE-000000000001'),
    ('040E0000-EEEE-4EEE-8EEE-000000000002', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/liveretrieve', N'https://docs.google.com/presentation/d/seal-4-1', DATEADD(MINUTE, -31, @e4_prelimSub), 1, '040D0000-EEEE-4EEE-8EEE-000000000002'),
    ('040E0000-EEEE-4EEE-8EEE-000000000003', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/demoforge', N'https://docs.google.com/presentation/d/seal-4-2', DATEADD(MINUTE, -32, @e4_prelimSub), 1, '040D0000-EEEE-4EEE-8EEE-000000000003'),
    ('040E0000-EEEE-4EEE-8EEE-000000000004', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/seedpilot', N'https://docs.google.com/presentation/d/seal-4-3', DATEADD(MINUTE, -33, @e4_prelimSub), 1, '040D0000-EEEE-4EEE-8EEE-000000000004'),
    ('040E0000-EEEE-4EEE-8EEE-000000000005', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/wireagent', N'https://docs.google.com/presentation/d/seal-4-4', DATEADD(MINUTE, -34, @e4_prelimSub), 1, '040D0000-EEEE-4EEE-8EEE-000000000005');

UPDATE submissions SET current_version_id = '040E0000-EEEE-4EEE-8EEE-000000000001' WHERE id = '040D0000-EEEE-4EEE-8EEE-000000000001';
UPDATE submissions SET current_version_id = '040E0000-EEEE-4EEE-8EEE-000000000002' WHERE id = '040D0000-EEEE-4EEE-8EEE-000000000002';
UPDATE submissions SET current_version_id = '040E0000-EEEE-4EEE-8EEE-000000000003' WHERE id = '040D0000-EEEE-4EEE-8EEE-000000000003';
UPDATE submissions SET current_version_id = '040E0000-EEEE-4EEE-8EEE-000000000004' WHERE id = '040D0000-EEEE-4EEE-8EEE-000000000004';
UPDATE submissions SET current_version_id = '040E0000-EEEE-4EEE-8EEE-000000000005' WHERE id = '040D0000-EEEE-4EEE-8EEE-000000000005';

-- ============================================================
-- === SEAL Hackathon Summer Closing 2026 - Final Pitch Week ===
-- QA phase: SCORING - all submitted, partial judge scores
-- Login: nguyen.van.duc@fpt.edu.vn (judge with unfinished scores) / Demo@123456
-- View: /lecturer/scoring
-- ============================================================

DECLARE @e5_compDay DATE = CAST(DATEADD(DAY, -1, @now) AS DATE);
DECLARE @e5_endDay DATE = CAST(DATEADD(DAY, 3, @now) AS DATE);
DECLARE @e5_compDt DATETIME2 = CAST(@e5_compDay AS DATETIME2);
DECLARE @e5_regOpen DATE = CAST(DATEADD(DAY, -40, @now) AS DATE);
DECLARE @e5_regDeadline DATE = CAST(DATEADD(DAY, -10, @now) AS DATE);
DECLARE @e5_prelimStart DATETIME2 = DATEADD(DAY, -3, @now);
DECLARE @e5_prelimSub DATETIME2 = DATEADD(HOUR, -12, @now);
DECLARE @e5_prelimScore DATETIME2 = DATEADD(DAY, 2, @now);
DECLARE @e5_finalStart DATETIME2 = DATEADD(DAY, 2, @now);
DECLARE @e5_finalSub DATETIME2 = DATEADD(DAY, 2, @now);
DECLARE @e5_finalScore DATETIME2 = DATEADD(DAY, 3, @now);
DECLARE @e5_finalEnd DATETIME2 = DATEADD(DAY, 3, @now);

INSERT INTO hackathon_events (
    id, name, season, year, start_date, end_date,
    registration_open_date, registration_deadline,
    description, location, format, competition_format,
    min_team, max_team, semester_min, semester_max,
    scoring_template_id, status, leaderboard_public,
    owner_user_id, created_by, created_at, updated_at
) VALUES (
    '05020000-EEEE-4EEE-8EEE-000000000001',
    N'SEAL Hackathon Summer Closing 2026 - Final Pitch Week',
    N'Summer', 2026,
    @e5_compDay, @e5_endDay,
    @e5_regOpen, @e5_regDeadline,
    N'SEAL Hackathon Summer 2026 focuses on Agentic RAG systems: grounded retrieval, multi-step agent orchestration, and enterprise-ready copilots built by FPT University teams.',
    N'FPT University HCM', 'OFFLINE', 'SEAL_RAG_2026',
    3, 5, 4, 8,
    @templateId, 'SCORING', 0,
    @coordId, N'tran.thanh.ha@fpt.edu.vn', @now, @now
);

INSERT INTO tracks (id, event_id, name, description, max_teams, status, created_at, updated_at) VALUES
    ('05040000-EEEE-4EEE-8EEE-000000000001', '05020000-EEEE-4EEE-8EEE-000000000001', N'Grounded Retrieval', N'SEAL track: Grounded Retrieval', 8, 'OPEN', @now, @now),
    ('05040000-EEEE-4EEE-8EEE-000000000002', '05020000-EEEE-4EEE-8EEE-000000000001', N'Agent Orchestration', N'SEAL track: Agent Orchestration', 8, 'OPEN', @now, @now),
    ('05040000-EEEE-4EEE-8EEE-000000000003', '05020000-EEEE-4EEE-8EEE-000000000001', N'Enterprise Copilot', N'SEAL track: Enterprise Copilot', 8, 'OPEN', @now, @now);

INSERT INTO rounds (
    id, event_id, round_number, name, round_type,
    start_date, end_date, slide_deadline, submission_deadline, scoring_deadline,
    advancement_cutoff, advancement_rule, round_weight, created_at, updated_at
) VALUES
    ('05030000-EEEE-4EEE-8EEE-000000000001', '05020000-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', 'PRELIMINARY',
     @e5_prelimStart, @e5_prelimScore, DATEADD(HOUR, -4, @e5_prelimSub),
     @e5_prelimSub, @e5_prelimScore,
     2, 'PER_TRACK_TOP_N', 40, @now, @now),
    ('05030000-EEEE-4EEE-8EEE-000000000002', '05020000-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', 'FINAL',
     @e5_finalStart, @e5_finalEnd, NULL,
     @e5_finalSub, @e5_finalScore,
     6, 'FINALIST_POOL', 60, @now, @now);

INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at) VALUES
    ('05060000-EEEE-4EEE-8EEE-000000000001', '05030000-EEEE-4EEE-8EEE-000000000001', N'Accuracy and Domain Relevance', N'Accuracy and Domain Relevance', 30, 0, 1, 5, @now, @now),
    ('05060000-EEEE-4EEE-8EEE-000000000002', '05030000-EEEE-4EEE-8EEE-000000000001', N'Agentic RAG Architecture & Algorithm', N'Agentic RAG Architecture & Algorithm', 30, 1, 1, 5, @now, @now),
    ('05060000-EEEE-4EEE-8EEE-000000000003', '05030000-EEEE-4EEE-8EEE-000000000001', N'Ideas & Presentation', N'Ideas & Presentation', 15, 2, 1, 5, @now, @now),
    ('05060000-EEEE-4EEE-8EEE-000000000004', '05030000-EEEE-4EEE-8EEE-000000000001', N'Feasibility & Creativity', N'Feasibility & Creativity', 15, 3, 1, 5, @now, @now),
    ('05060000-EEEE-4EEE-8EEE-000000000005', '05030000-EEEE-4EEE-8EEE-000000000001', N'User Experience & Interactive Interface', N'User Experience & Interactive Interface', 10, 4, 1, 5, @now, @now),
    ('05060000-EEEE-4EEE-8EEE-00000000000B', '05030000-EEEE-4EEE-8EEE-000000000002', N'Data Processing & Retrieval Quality', N'Data Processing & Retrieval Quality', 30, 0, 1, 5, @now, @now),
    ('05060000-EEEE-4EEE-8EEE-00000000000C', '05030000-EEEE-4EEE-8EEE-000000000002', N'Reliability & Hallucination Resistance', N'Reliability & Hallucination Resistance', 20, 1, 1, 5, @now, @now),
    ('05060000-EEEE-4EEE-8EEE-00000000000D', '05030000-EEEE-4EEE-8EEE-000000000002', N'Agent Reasoning & Multi-hop Processing', N'Agent Reasoning & Multi-hop Processing', 20, 2, 1, 5, @now, @now),
    ('05060000-EEEE-4EEE-8EEE-00000000000E', '05030000-EEEE-4EEE-8EEE-000000000002', N'Practicality & Operational Optimization', N'Practicality & Operational Optimization', 20, 3, 1, 5, @now, @now),
    ('05060000-EEEE-4EEE-8EEE-00000000000F', '05030000-EEEE-4EEE-8EEE-000000000002', N'Scalability & Innovation', N'Scalability & Innovation', 10, 4, 1, 5, @now, @now);

INSERT INTO prizes (id, event_id, rank, value, quantity, label, created_at, updated_at) VALUES
    ('05070000-EEEE-4EEE-8EEE-000000000001', '05020000-EEEE-4EEE-8EEE-000000000001', 'FIRST', '7000000', 1, N'First Prize', @now, @now),
    ('05070000-EEEE-4EEE-8EEE-000000000002', '05020000-EEEE-4EEE-8EEE-000000000001', 'SECOND', '5000000', 1, N'Second Prize', @now, @now),
    ('05070000-EEEE-4EEE-8EEE-000000000003', '05020000-EEEE-4EEE-8EEE-000000000001', 'THIRD', '3000000', 1, N'Third Prize', @now, @now),
    ('05070000-EEEE-4EEE-8EEE-000000000004', '05020000-EEEE-4EEE-8EEE-000000000001', 'CONSOLATION', '1500000', 1, N'Consolation Prize', @now, @now);

INSERT INTO event_schedules (id, event_id, type, title, description, start_time, end_time, gate, sort_order, created_at, updated_at) VALUES
    ('05080000-EEEE-4EEE-8EEE-000000000001', '05020000-EEEE-4EEE-8EEE-000000000001', 'WORKSHOP', N'Workshop', NULL, DATEADD(DAY, -3, @e5_compDt), DATEADD(HOUR, 3, DATEADD(DAY, -3, @e5_compDt)), NULL, 0, @now, @now),
    ('05080000-EEEE-4EEE-8EEE-000000000002', '05020000-EEEE-4EEE-8EEE-000000000001', 'OPENING', N'Opening & track draw', N'Teams pick tracks in turn; organizers draw topics per track', DATEADD(DAY, -1, @e5_compDt), DATEADD(HOUR, 3, DATEADD(DAY, -1, @e5_compDt)), NULL, 1, @now, @now),
    ('05080000-EEEE-4EEE-8EEE-000000000003', '05020000-EEEE-4EEE-8EEE-000000000001', 'TRACK_DRAW', N'Track selection draw', NULL, DATEADD(DAY, -1, @e5_compDt), DATEADD(HOUR, 2, DATEADD(DAY, -1, @e5_compDt)), NULL, 2, @now, @now),
    ('05080000-EEEE-4EEE-8EEE-000000000004', '05020000-EEEE-4EEE-8EEE-000000000001', 'MILESTONE', N'Milestone 1 - Idea & architecture completion', N'Design Agentic RAG architecture', @e5_prelimStart, DATEADD(HOUR, 3, @e5_prelimStart), 'SLIDE_SUBMISSION', 3, @now, @now),
    ('05080000-EEEE-4EEE-8EEE-000000000005', '05020000-EEEE-4EEE-8EEE-000000000001', 'MILESTONE', N'Milestone 2 - Pitching & product completion', N'Parallel pitching and coding', DATEADD(HOUR, 3, @e5_prelimStart), @e5_prelimSub, 'DEMO_SUBMISSION', 4, @now, @now),
    ('05080000-EEEE-4EEE-8EEE-000000000006', '05020000-EEEE-4EEE-8EEE-000000000001', 'SCORING', N'Preliminary scoring', N'5-minute presentation + 3-minute Q&A', @e5_prelimSub, @e5_prelimScore, NULL, 5, @now, @now),
    ('05080000-EEEE-4EEE-8EEE-000000000007', '05020000-EEEE-4EEE-8EEE-000000000001', 'FINAL', N'Finals', N'7-minute presentation + 3-minute Q&A - Top 6 teams', @e5_finalStart, @e5_finalEnd, NULL, 6, @now, @now),
    ('05080000-EEEE-4EEE-8EEE-000000000008', '05020000-EEEE-4EEE-8EEE-000000000001', 'CEREMONY', N'Awards & closing ceremony', NULL, @e5_finalEnd, DATEADD(HOUR, 1, @e5_finalEnd), NULL, 7, @now, @now);

INSERT INTO allowed_email_domains (id, event_id, domain, university_label, created_at, updated_at) VALUES
    ('05090000-EEEE-4EEE-8EEE-000000000001', '05020000-EEEE-4EEE-8EEE-000000000001', 'fpt.edu.vn', N'FPT University', @now, @now),
    ('05090000-EEEE-4EEE-8EEE-000000000002', '05020000-EEEE-4EEE-8EEE-000000000001', 'fe.edu.vn', N'FPT Education', @now, @now),
    ('05090000-EEEE-4EEE-8EEE-000000000003', '05020000-EEEE-4EEE-8EEE-000000000001', 'hcmut.edu.vn', N'Ho Chi Minh City University of Technology', @now, @now),
    ('05090000-EEEE-4EEE-8EEE-000000000004', '05020000-EEEE-4EEE-8EEE-000000000001', 'hcmus.edu.vn', N'Vietnam National University Ho Chi Minh City - University of Science', @now, @now),
    ('05090000-EEEE-4EEE-8EEE-000000000005', '05020000-EEEE-4EEE-8EEE-000000000001', 'student.hcmus.edu.vn', N'Vietnam National University Ho Chi Minh City - University of Science', @now, @now),
    ('05090000-EEEE-4EEE-8EEE-000000000006', '05020000-EEEE-4EEE-8EEE-000000000001', 'uit.edu.vn', N'University of Information Technology', @now, @now),
    ('05090000-EEEE-4EEE-8EEE-000000000007', '05020000-EEEE-4EEE-8EEE-000000000001', 'hcmute.edu.vn', N'Ho Chi Minh City University of Education and Technology', @now, @now),
    ('05090000-EEEE-4EEE-8EEE-000000000008', '05020000-EEEE-4EEE-8EEE-000000000001', 'ueh.edu.vn', N'University of Economics Ho Chi Minh City', @now, @now),
    ('05090000-EEEE-4EEE-8EEE-000000000009', '05020000-EEEE-4EEE-8EEE-000000000001', 'student.ueh.edu.vn', N'University of Economics Ho Chi Minh City', @now, @now),
    ('05090000-EEEE-4EEE-8EEE-00000000000A', '05020000-EEEE-4EEE-8EEE-000000000001', 'student.iuh.edu.vn', N'Industrial University of Ho Chi Minh City', @now, @now);

INSERT INTO event_enrollments (id, created_at, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public) VALUES
    ('050A0000-EEEE-4EEE-8EEE-000000000001', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-000000000001', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-000000000002', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-000000000002', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-000000000003', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-000000000003', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-000000000004', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-000000000004', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-000000000005', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-000000000005', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-000000000006', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-000000000006', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-000000000007', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-000000000007', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-000000000008', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-000000000008', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-000000000009', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-000000000009', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-00000000000A', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-00000000000B', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-00000000000B', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-00000000000C', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-00000000000C', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-00000000000D', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-00000000000D', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-00000000000E', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-00000000000E', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-00000000000F', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-00000000000F', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-000000000010', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-000000000010', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-000000000011', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-000000000011', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-000000000012', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-000000000012', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-000000000013', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-000000000013', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-000000000014', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-000000000014', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-000000000015', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-000000000015', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-000000000016', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-000000000016', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-000000000017', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-000000000017', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-000000000018', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-000000000018', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-000000000019', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-000000000019', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-00000000001A', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-00000000001A', 0, 0),
    ('050A0000-EEEE-4EEE-8EEE-00000000001B', @now, @now, '05020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '05010000-EEEE-4EEE-8EEE-00000000001B', 0, 0);

INSERT INTO teams (id, created_at, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, is_recruiting, recruitment_note, version) VALUES
    ('05050000-EEEE-4EEE-8EEE-000000000001', @now, '05020000-EEEE-4EEE-8EEE-000000000001', '05010000-EEEE-4EEE-8EEE-000000000001', N'FinalPitch Pro', 'CONFIRMED', '05040000-EEEE-4EEE-8EEE-000000000001', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Grounded Retrieval track.', 0),
    ('05050000-EEEE-4EEE-8EEE-000000000002', @now, '05020000-EEEE-4EEE-8EEE-000000000001', '05010000-EEEE-4EEE-8EEE-000000000004', N'StageReady', 'CONFIRMED', '05040000-EEEE-4EEE-8EEE-000000000001', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Grounded Retrieval track.', 0),
    ('05050000-EEEE-4EEE-8EEE-000000000003', @now, '05020000-EEEE-4EEE-8EEE-000000000001', '05010000-EEEE-4EEE-8EEE-000000000007', N'JudgeMe', 'CONFIRMED', '05040000-EEEE-4EEE-8EEE-000000000001', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Grounded Retrieval track.', 0),
    ('05050000-EEEE-4EEE-8EEE-000000000004', @now, '05020000-EEEE-4EEE-8EEE-000000000001', '05010000-EEEE-4EEE-8EEE-00000000000A', N'ScoreBoard AI', 'CONFIRMED', '05040000-EEEE-4EEE-8EEE-000000000002', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Agent Orchestration track.', 0),
    ('05050000-EEEE-4EEE-8EEE-000000000005', @now, '05020000-EEEE-4EEE-8EEE-000000000001', '05010000-EEEE-4EEE-8EEE-00000000000D', N'PitchVault', 'CONFIRMED', '05040000-EEEE-4EEE-8EEE-000000000002', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Agent Orchestration track.', 0),
    ('05050000-EEEE-4EEE-8EEE-000000000006', @now, '05020000-EEEE-4EEE-8EEE-000000000001', '05010000-EEEE-4EEE-8EEE-000000000010', N'ClosingAct', 'CONFIRMED', '05040000-EEEE-4EEE-8EEE-000000000002', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Agent Orchestration track.', 0),
    ('05050000-EEEE-4EEE-8EEE-000000000007', @now, '05020000-EEEE-4EEE-8EEE-000000000001', '05010000-EEEE-4EEE-8EEE-000000000013', N'HaloRetrieve', 'CONFIRMED', '05040000-EEEE-4EEE-8EEE-000000000003', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Enterprise Copilot track.', 0),
    ('05050000-EEEE-4EEE-8EEE-000000000008', @now, '05020000-EEEE-4EEE-8EEE-000000000001', '05010000-EEEE-4EEE-8EEE-000000000016', N'SummitAgent', 'CONFIRMED', '05040000-EEEE-4EEE-8EEE-000000000003', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Enterprise Copilot track.', 0),
    ('05050000-EEEE-4EEE-8EEE-000000000009', @now, '05020000-EEEE-4EEE-8EEE-000000000001', '05010000-EEEE-4EEE-8EEE-000000000019', N'LastMile RAG', 'CONFIRMED', '05040000-EEEE-4EEE-8EEE-000000000003', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Enterprise Copilot track.', 0);

INSERT INTO team_members (id, created_at, joined_at, role, user_id, team_id, event_id) VALUES
    ('050B0000-EEEE-4EEE-8EEE-000000000001', @now, @now, 'LEADER', '05010000-EEEE-4EEE-8EEE-000000000001', '05050000-EEEE-4EEE-8EEE-000000000001', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-000000000002', @now, @now, 'MEMBER', '05010000-EEEE-4EEE-8EEE-000000000002', '05050000-EEEE-4EEE-8EEE-000000000001', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-000000000003', @now, @now, 'MEMBER', '05010000-EEEE-4EEE-8EEE-000000000003', '05050000-EEEE-4EEE-8EEE-000000000001', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-000000000004', @now, @now, 'LEADER', '05010000-EEEE-4EEE-8EEE-000000000004', '05050000-EEEE-4EEE-8EEE-000000000002', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-000000000005', @now, @now, 'MEMBER', '05010000-EEEE-4EEE-8EEE-000000000005', '05050000-EEEE-4EEE-8EEE-000000000002', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-000000000006', @now, @now, 'MEMBER', '05010000-EEEE-4EEE-8EEE-000000000006', '05050000-EEEE-4EEE-8EEE-000000000002', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-000000000007', @now, @now, 'LEADER', '05010000-EEEE-4EEE-8EEE-000000000007', '05050000-EEEE-4EEE-8EEE-000000000003', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-000000000008', @now, @now, 'MEMBER', '05010000-EEEE-4EEE-8EEE-000000000008', '05050000-EEEE-4EEE-8EEE-000000000003', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-000000000009', @now, @now, 'MEMBER', '05010000-EEEE-4EEE-8EEE-000000000009', '05050000-EEEE-4EEE-8EEE-000000000003', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, 'LEADER', '05010000-EEEE-4EEE-8EEE-00000000000A', '05050000-EEEE-4EEE-8EEE-000000000004', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-00000000000B', @now, @now, 'MEMBER', '05010000-EEEE-4EEE-8EEE-00000000000B', '05050000-EEEE-4EEE-8EEE-000000000004', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-00000000000C', @now, @now, 'MEMBER', '05010000-EEEE-4EEE-8EEE-00000000000C', '05050000-EEEE-4EEE-8EEE-000000000004', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-00000000000D', @now, @now, 'LEADER', '05010000-EEEE-4EEE-8EEE-00000000000D', '05050000-EEEE-4EEE-8EEE-000000000005', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-00000000000E', @now, @now, 'MEMBER', '05010000-EEEE-4EEE-8EEE-00000000000E', '05050000-EEEE-4EEE-8EEE-000000000005', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-00000000000F', @now, @now, 'MEMBER', '05010000-EEEE-4EEE-8EEE-00000000000F', '05050000-EEEE-4EEE-8EEE-000000000005', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-000000000010', @now, @now, 'LEADER', '05010000-EEEE-4EEE-8EEE-000000000010', '05050000-EEEE-4EEE-8EEE-000000000006', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-000000000011', @now, @now, 'MEMBER', '05010000-EEEE-4EEE-8EEE-000000000011', '05050000-EEEE-4EEE-8EEE-000000000006', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-000000000012', @now, @now, 'MEMBER', '05010000-EEEE-4EEE-8EEE-000000000012', '05050000-EEEE-4EEE-8EEE-000000000006', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-000000000013', @now, @now, 'LEADER', '05010000-EEEE-4EEE-8EEE-000000000013', '05050000-EEEE-4EEE-8EEE-000000000007', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-000000000014', @now, @now, 'MEMBER', '05010000-EEEE-4EEE-8EEE-000000000014', '05050000-EEEE-4EEE-8EEE-000000000007', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-000000000015', @now, @now, 'MEMBER', '05010000-EEEE-4EEE-8EEE-000000000015', '05050000-EEEE-4EEE-8EEE-000000000007', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-000000000016', @now, @now, 'LEADER', '05010000-EEEE-4EEE-8EEE-000000000016', '05050000-EEEE-4EEE-8EEE-000000000008', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-000000000017', @now, @now, 'MEMBER', '05010000-EEEE-4EEE-8EEE-000000000017', '05050000-EEEE-4EEE-8EEE-000000000008', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-000000000018', @now, @now, 'MEMBER', '05010000-EEEE-4EEE-8EEE-000000000018', '05050000-EEEE-4EEE-8EEE-000000000008', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-000000000019', @now, @now, 'LEADER', '05010000-EEEE-4EEE-8EEE-000000000019', '05050000-EEEE-4EEE-8EEE-000000000009', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-00000000001A', @now, @now, 'MEMBER', '05010000-EEEE-4EEE-8EEE-00000000001A', '05050000-EEEE-4EEE-8EEE-000000000009', '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050B0000-EEEE-4EEE-8EEE-00000000001B', @now, @now, 'MEMBER', '05010000-EEEE-4EEE-8EEE-00000000001B', '05050000-EEEE-4EEE-8EEE-000000000009', '05020000-EEEE-4EEE-8EEE-000000000001');

INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id) VALUES
    ('050C0000-EEEE-4EEE-8EEE-000000000001', @now, @now, @judge1Id, '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050C0000-EEEE-4EEE-8EEE-000000000002', @now, @now, @judge2Id, '05020000-EEEE-4EEE-8EEE-000000000001'),
    ('050C0000-EEEE-4EEE-8EEE-000000000008', @now, @now, @judge3Id, '05020000-EEEE-4EEE-8EEE-000000000001');
INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active) VALUES
    ('050C0000-EEEE-4EEE-8EEE-000000000003', @now, @now, @judge1Id, '05030000-EEEE-4EEE-8EEE-000000000001', 'ROUND', 1),
    ('050C0000-EEEE-4EEE-8EEE-000000000004', @now, @now, @judge2Id, '05030000-EEEE-4EEE-8EEE-000000000001', 'ROUND', 1),
    ('050C0000-EEEE-4EEE-8EEE-000000000009', @now, @now, @judge3Id, '05030000-EEEE-4EEE-8EEE-000000000001', 'ROUND', 1),
    ('050C0000-EEEE-4EEE-8EEE-000000000005', @now, @now, @judge1Id, '05030000-EEEE-4EEE-8EEE-000000000002', 'ROUND', 1),
    ('050C0000-EEEE-4EEE-8EEE-000000000006', @now, @now, @judge2Id, '05030000-EEEE-4EEE-8EEE-000000000002', 'ROUND', 1),
    ('050C0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, @judge3Id, '05030000-EEEE-4EEE-8EEE-000000000002', 'ROUND', 1);
INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at) VALUES
    ('050C0000-EEEE-4EEE-8EEE-000000000007', '05020000-EEEE-4EEE-8EEE-000000000001', @mentor1Id, @now, @now),
    ('050C0000-EEEE-4EEE-8EEE-00000000000B', '05020000-EEEE-4EEE-8EEE-000000000001', @mentor2Id, @now, @now),
    ('050C0000-EEEE-4EEE-8EEE-00000000000C', '05020000-EEEE-4EEE-8EEE-000000000001', @mentor3Id, @now, @now);

INSERT INTO mentor_assignments (id, created_at, assigned_at, mentor_user_id, event_id, track_id) VALUES
    ('05160000-EEEE-4EEE-8EEE-000000000001', @now, @now, @mentor1Id, '05020000-EEEE-4EEE-8EEE-000000000001', '05040000-EEEE-4EEE-8EEE-000000000001'),
    ('05160000-EEEE-4EEE-8EEE-000000000002', @now, @now, @mentor2Id, '05020000-EEEE-4EEE-8EEE-000000000001', '05040000-EEEE-4EEE-8EEE-000000000002'),
    ('05160000-EEEE-4EEE-8EEE-000000000003', @now, @now, @mentor3Id, '05020000-EEEE-4EEE-8EEE-000000000001', '05040000-EEEE-4EEE-8EEE-000000000003');

INSERT INTO mentor_teams (id, created_at, assigned_at, mentor_user_id, team_id) VALUES
    ('05170000-EEEE-4EEE-8EEE-000000000001', @now, @now, @mentor1Id, '05050000-EEEE-4EEE-8EEE-000000000001'),
    ('05170000-EEEE-4EEE-8EEE-000000000002', @now, @now, @mentor1Id, '05050000-EEEE-4EEE-8EEE-000000000002'),
    ('05170000-EEEE-4EEE-8EEE-000000000003', @now, @now, @mentor1Id, '05050000-EEEE-4EEE-8EEE-000000000003'),
    ('05170000-EEEE-4EEE-8EEE-000000000004', @now, @now, @mentor2Id, '05050000-EEEE-4EEE-8EEE-000000000004'),
    ('05170000-EEEE-4EEE-8EEE-000000000005', @now, @now, @mentor2Id, '05050000-EEEE-4EEE-8EEE-000000000005'),
    ('05170000-EEEE-4EEE-8EEE-000000000006', @now, @now, @mentor2Id, '05050000-EEEE-4EEE-8EEE-000000000006'),
    ('05170000-EEEE-4EEE-8EEE-000000000007', @now, @now, @mentor3Id, '05050000-EEEE-4EEE-8EEE-000000000007'),
    ('05170000-EEEE-4EEE-8EEE-000000000008', @now, @now, @mentor3Id, '05050000-EEEE-4EEE-8EEE-000000000008'),
    ('05170000-EEEE-4EEE-8EEE-000000000009', @now, @now, @mentor3Id, '05050000-EEEE-4EEE-8EEE-000000000009');

INSERT INTO mentor_invitations (id, created_at, team_id, mentor_user_id, inviter_id, status, message) VALUES
    ('05180000-EEEE-4EEE-8EEE-000000000001', @now, '05050000-EEEE-4EEE-8EEE-000000000001', @mentor1Id, '05010000-EEEE-4EEE-8EEE-000000000001', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('05180000-EEEE-4EEE-8EEE-000000000002', @now, '05050000-EEEE-4EEE-8EEE-000000000002', @mentor1Id, '05010000-EEEE-4EEE-8EEE-000000000004', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('05180000-EEEE-4EEE-8EEE-000000000003', @now, '05050000-EEEE-4EEE-8EEE-000000000003', @mentor1Id, '05010000-EEEE-4EEE-8EEE-000000000007', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('05180000-EEEE-4EEE-8EEE-000000000004', @now, '05050000-EEEE-4EEE-8EEE-000000000004', @mentor2Id, '05010000-EEEE-4EEE-8EEE-00000000000A', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('05180000-EEEE-4EEE-8EEE-000000000005', @now, '05050000-EEEE-4EEE-8EEE-000000000005', @mentor2Id, '05010000-EEEE-4EEE-8EEE-00000000000D', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('05180000-EEEE-4EEE-8EEE-000000000006', @now, '05050000-EEEE-4EEE-8EEE-000000000006', @mentor2Id, '05010000-EEEE-4EEE-8EEE-000000000010', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('05180000-EEEE-4EEE-8EEE-000000000007', @now, '05050000-EEEE-4EEE-8EEE-000000000007', @mentor3Id, '05010000-EEEE-4EEE-8EEE-000000000013', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('05180000-EEEE-4EEE-8EEE-000000000008', @now, '05050000-EEEE-4EEE-8EEE-000000000008', @mentor3Id, '05010000-EEEE-4EEE-8EEE-000000000016', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('05180000-EEEE-4EEE-8EEE-000000000009', @now, '05050000-EEEE-4EEE-8EEE-000000000009', @mentor3Id, '05010000-EEEE-4EEE-8EEE-000000000019', 'ACCEPTED', N'Seeded mentor assignment for QA');

INSERT INTO submissions (id, created_at, current_version_id, round_id, status, submitted_by, team_id, opt_lock) VALUES
    ('050D0000-EEEE-4EEE-8EEE-000000000001', @now, NULL, '05030000-EEEE-4EEE-8EEE-000000000001', 'SUBMITTED', '05010000-EEEE-4EEE-8EEE-000000000001', '05050000-EEEE-4EEE-8EEE-000000000001', 0),
    ('050D0000-EEEE-4EEE-8EEE-000000000002', @now, NULL, '05030000-EEEE-4EEE-8EEE-000000000001', 'SUBMITTED', '05010000-EEEE-4EEE-8EEE-000000000004', '05050000-EEEE-4EEE-8EEE-000000000002', 0),
    ('050D0000-EEEE-4EEE-8EEE-000000000003', @now, NULL, '05030000-EEEE-4EEE-8EEE-000000000001', 'SUBMITTED', '05010000-EEEE-4EEE-8EEE-000000000007', '05050000-EEEE-4EEE-8EEE-000000000003', 0),
    ('050D0000-EEEE-4EEE-8EEE-000000000004', @now, NULL, '05030000-EEEE-4EEE-8EEE-000000000001', 'SUBMITTED', '05010000-EEEE-4EEE-8EEE-00000000000A', '05050000-EEEE-4EEE-8EEE-000000000004', 0),
    ('050D0000-EEEE-4EEE-8EEE-000000000005', @now, NULL, '05030000-EEEE-4EEE-8EEE-000000000001', 'SUBMITTED', '05010000-EEEE-4EEE-8EEE-00000000000D', '05050000-EEEE-4EEE-8EEE-000000000005', 0),
    ('050D0000-EEEE-4EEE-8EEE-000000000006', @now, NULL, '05030000-EEEE-4EEE-8EEE-000000000001', 'SUBMITTED', '05010000-EEEE-4EEE-8EEE-000000000010', '05050000-EEEE-4EEE-8EEE-000000000006', 0),
    ('050D0000-EEEE-4EEE-8EEE-000000000007', @now, NULL, '05030000-EEEE-4EEE-8EEE-000000000001', 'SUBMITTED', '05010000-EEEE-4EEE-8EEE-000000000013', '05050000-EEEE-4EEE-8EEE-000000000007', 0),
    ('050D0000-EEEE-4EEE-8EEE-000000000008', @now, NULL, '05030000-EEEE-4EEE-8EEE-000000000001', 'SUBMITTED', '05010000-EEEE-4EEE-8EEE-000000000016', '05050000-EEEE-4EEE-8EEE-000000000008', 0),
    ('050D0000-EEEE-4EEE-8EEE-000000000009', @now, NULL, '05030000-EEEE-4EEE-8EEE-000000000001', 'SUBMITTED', '05010000-EEEE-4EEE-8EEE-000000000019', '05050000-EEEE-4EEE-8EEE-000000000009', 0);

INSERT INTO submission_versions (id, created_at, demo_url, github_url, slide_url, submitted_at, version_number, submission_id) VALUES
    ('050E0000-EEEE-4EEE-8EEE-000000000001', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/finalpitch-pro', N'https://docs.google.com/presentation/d/seal-5-0', DATEADD(MINUTE, -30, @e5_prelimSub), 1, '050D0000-EEEE-4EEE-8EEE-000000000001'),
    ('050E0000-EEEE-4EEE-8EEE-000000000002', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/stageready', N'https://docs.google.com/presentation/d/seal-5-1', DATEADD(MINUTE, -31, @e5_prelimSub), 1, '050D0000-EEEE-4EEE-8EEE-000000000002'),
    ('050E0000-EEEE-4EEE-8EEE-000000000003', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/judgeme', N'https://docs.google.com/presentation/d/seal-5-2', DATEADD(MINUTE, -32, @e5_prelimSub), 1, '050D0000-EEEE-4EEE-8EEE-000000000003'),
    ('050E0000-EEEE-4EEE-8EEE-000000000004', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/scoreboard-ai', N'https://docs.google.com/presentation/d/seal-5-3', DATEADD(MINUTE, -33, @e5_prelimSub), 1, '050D0000-EEEE-4EEE-8EEE-000000000004'),
    ('050E0000-EEEE-4EEE-8EEE-000000000005', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/pitchvault', N'https://docs.google.com/presentation/d/seal-5-4', DATEADD(MINUTE, -34, @e5_prelimSub), 1, '050D0000-EEEE-4EEE-8EEE-000000000005'),
    ('050E0000-EEEE-4EEE-8EEE-000000000006', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/closingact', N'https://docs.google.com/presentation/d/seal-5-5', DATEADD(MINUTE, -35, @e5_prelimSub), 1, '050D0000-EEEE-4EEE-8EEE-000000000006'),
    ('050E0000-EEEE-4EEE-8EEE-000000000007', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/haloretrieve', N'https://docs.google.com/presentation/d/seal-5-6', DATEADD(MINUTE, -36, @e5_prelimSub), 1, '050D0000-EEEE-4EEE-8EEE-000000000007'),
    ('050E0000-EEEE-4EEE-8EEE-000000000008', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/summitagent', N'https://docs.google.com/presentation/d/seal-5-7', DATEADD(MINUTE, -37, @e5_prelimSub), 1, '050D0000-EEEE-4EEE-8EEE-000000000008'),
    ('050E0000-EEEE-4EEE-8EEE-000000000009', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/lastmile-rag', N'https://docs.google.com/presentation/d/seal-5-8', DATEADD(MINUTE, -38, @e5_prelimSub), 1, '050D0000-EEEE-4EEE-8EEE-000000000009');

UPDATE submissions SET current_version_id = '050E0000-EEEE-4EEE-8EEE-000000000001' WHERE id = '050D0000-EEEE-4EEE-8EEE-000000000001';
UPDATE submissions SET current_version_id = '050E0000-EEEE-4EEE-8EEE-000000000002' WHERE id = '050D0000-EEEE-4EEE-8EEE-000000000002';
UPDATE submissions SET current_version_id = '050E0000-EEEE-4EEE-8EEE-000000000003' WHERE id = '050D0000-EEEE-4EEE-8EEE-000000000003';
UPDATE submissions SET current_version_id = '050E0000-EEEE-4EEE-8EEE-000000000004' WHERE id = '050D0000-EEEE-4EEE-8EEE-000000000004';
UPDATE submissions SET current_version_id = '050E0000-EEEE-4EEE-8EEE-000000000005' WHERE id = '050D0000-EEEE-4EEE-8EEE-000000000005';
UPDATE submissions SET current_version_id = '050E0000-EEEE-4EEE-8EEE-000000000006' WHERE id = '050D0000-EEEE-4EEE-8EEE-000000000006';
UPDATE submissions SET current_version_id = '050E0000-EEEE-4EEE-8EEE-000000000007' WHERE id = '050D0000-EEEE-4EEE-8EEE-000000000007';
UPDATE submissions SET current_version_id = '050E0000-EEEE-4EEE-8EEE-000000000008' WHERE id = '050D0000-EEEE-4EEE-8EEE-000000000008';
UPDATE submissions SET current_version_id = '050E0000-EEEE-4EEE-8EEE-000000000009' WHERE id = '050D0000-EEEE-4EEE-8EEE-000000000009';

INSERT INTO judge_scores (id, created_at, completed_at, judge_user_id, round_id, started_at, status, submission_id, version) VALUES
    ('050F0000-EEEE-4EEE-8EEE-000000000001', @now, @now, @judge1Id, '05030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR, -2, @now), 'COMPLETED', '050D0000-EEEE-4EEE-8EEE-000000000001', 0),
    ('050F0000-EEEE-4EEE-8EEE-000000000002', @now, @now, @judge2Id, '05030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR, -2, @now), 'COMPLETED', '050D0000-EEEE-4EEE-8EEE-000000000001', 0),
    ('050F0000-EEEE-4EEE-8EEE-000000000003', @now, @now, @judge1Id, '05030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR, -2, @now), 'COMPLETED', '050D0000-EEEE-4EEE-8EEE-000000000002', 0),
    ('050F0000-EEEE-4EEE-8EEE-000000000004', @now, @now, @judge2Id, '05030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR, -2, @now), 'COMPLETED', '050D0000-EEEE-4EEE-8EEE-000000000002', 0),
    ('050F0000-EEEE-4EEE-8EEE-000000000005', @now, @now, @judge1Id, '05030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR, -2, @now), 'COMPLETED', '050D0000-EEEE-4EEE-8EEE-000000000003', 0),
    ('050F0000-EEEE-4EEE-8EEE-000000000006', @now, @now, @judge2Id, '05030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR, -2, @now), 'COMPLETED', '050D0000-EEEE-4EEE-8EEE-000000000003', 0),
    ('050F0000-EEEE-4EEE-8EEE-000000000007', @now, @now, @judge1Id, '05030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR, -2, @now), 'COMPLETED', '050D0000-EEEE-4EEE-8EEE-000000000004', 0),
    ('050F0000-EEEE-4EEE-8EEE-000000000008', @now, @now, @judge1Id, '05030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR, -2, @now), 'COMPLETED', '050D0000-EEEE-4EEE-8EEE-000000000005', 0),
    ('050F0000-EEEE-4EEE-8EEE-000000000009', @now, NULL, @judge1Id, '05030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR, -1, @now), 'IN_PROGRESS', '050D0000-EEEE-4EEE-8EEE-000000000006', 0),
    ('050F0000-EEEE-4EEE-8EEE-00000000000A', @now, NULL, @judge1Id, '05030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR, -1, @now), 'IN_PROGRESS', '050D0000-EEEE-4EEE-8EEE-000000000007', 0),
    ('050F0000-EEEE-4EEE-8EEE-00000000000B', @now, NULL, @judge1Id, '05030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR, -1, @now), 'IN_PROGRESS', '050D0000-EEEE-4EEE-8EEE-000000000008', 0),
    ('050F0000-EEEE-4EEE-8EEE-00000000000C', @now, NULL, @judge1Id, '05030000-EEEE-4EEE-8EEE-000000000001', DATEADD(HOUR, -1, @now), 'IN_PROGRESS', '050D0000-EEEE-4EEE-8EEE-000000000009', 0);

INSERT INTO judge_score_details (id, created_at, criteria_id, score, judge_score_id) VALUES
    ('050E0000-EEEE-4EEE-8EEE-000000000001', @now, '05060000-EEEE-4EEE-8EEE-000000000001', 5, '050F0000-EEEE-4EEE-8EEE-000000000001'),
    ('050E0000-EEEE-4EEE-8EEE-000000000002', @now, '05060000-EEEE-4EEE-8EEE-000000000002', 5, '050F0000-EEEE-4EEE-8EEE-000000000001'),
    ('050E0000-EEEE-4EEE-8EEE-000000000003', @now, '05060000-EEEE-4EEE-8EEE-000000000003', 5, '050F0000-EEEE-4EEE-8EEE-000000000001'),
    ('050E0000-EEEE-4EEE-8EEE-000000000004', @now, '05060000-EEEE-4EEE-8EEE-000000000004', 4, '050F0000-EEEE-4EEE-8EEE-000000000001'),
    ('050E0000-EEEE-4EEE-8EEE-000000000005', @now, '05060000-EEEE-4EEE-8EEE-000000000005', 5, '050F0000-EEEE-4EEE-8EEE-000000000001'),
    ('050E0000-EEEE-4EEE-8EEE-000000000006', @now, '05060000-EEEE-4EEE-8EEE-000000000001', 4, '050F0000-EEEE-4EEE-8EEE-000000000002'),
    ('050E0000-EEEE-4EEE-8EEE-000000000007', @now, '05060000-EEEE-4EEE-8EEE-000000000002', 5, '050F0000-EEEE-4EEE-8EEE-000000000002'),
    ('050E0000-EEEE-4EEE-8EEE-000000000008', @now, '05060000-EEEE-4EEE-8EEE-000000000003', 4, '050F0000-EEEE-4EEE-8EEE-000000000002'),
    ('050E0000-EEEE-4EEE-8EEE-000000000009', @now, '05060000-EEEE-4EEE-8EEE-000000000004', 4, '050F0000-EEEE-4EEE-8EEE-000000000002'),
    ('050E0000-EEEE-4EEE-8EEE-00000000000A', @now, '05060000-EEEE-4EEE-8EEE-000000000005', 4, '050F0000-EEEE-4EEE-8EEE-000000000002'),
    ('050E0000-EEEE-4EEE-8EEE-00000000000B', @now, '05060000-EEEE-4EEE-8EEE-000000000001', 5, '050F0000-EEEE-4EEE-8EEE-000000000003'),
    ('050E0000-EEEE-4EEE-8EEE-00000000000C', @now, '05060000-EEEE-4EEE-8EEE-000000000002', 4, '050F0000-EEEE-4EEE-8EEE-000000000003'),
    ('050E0000-EEEE-4EEE-8EEE-00000000000D', @now, '05060000-EEEE-4EEE-8EEE-000000000003', 5, '050F0000-EEEE-4EEE-8EEE-000000000003'),
    ('050E0000-EEEE-4EEE-8EEE-00000000000E', @now, '05060000-EEEE-4EEE-8EEE-000000000004', 4, '050F0000-EEEE-4EEE-8EEE-000000000003'),
    ('050E0000-EEEE-4EEE-8EEE-00000000000F', @now, '05060000-EEEE-4EEE-8EEE-000000000005', 4, '050F0000-EEEE-4EEE-8EEE-000000000003'),
    ('050E0000-EEEE-4EEE-8EEE-000000000010', @now, '05060000-EEEE-4EEE-8EEE-000000000001', 4, '050F0000-EEEE-4EEE-8EEE-000000000004'),
    ('050E0000-EEEE-4EEE-8EEE-000000000011', @now, '05060000-EEEE-4EEE-8EEE-000000000002', 4, '050F0000-EEEE-4EEE-8EEE-000000000004'),
    ('050E0000-EEEE-4EEE-8EEE-000000000012', @now, '05060000-EEEE-4EEE-8EEE-000000000003', 4, '050F0000-EEEE-4EEE-8EEE-000000000004'),
    ('050E0000-EEEE-4EEE-8EEE-000000000013', @now, '05060000-EEEE-4EEE-8EEE-000000000004', 4, '050F0000-EEEE-4EEE-8EEE-000000000004'),
    ('050E0000-EEEE-4EEE-8EEE-000000000014', @now, '05060000-EEEE-4EEE-8EEE-000000000005', 3, '050F0000-EEEE-4EEE-8EEE-000000000004'),
    ('050E0000-EEEE-4EEE-8EEE-000000000015', @now, '05060000-EEEE-4EEE-8EEE-000000000001', 4, '050F0000-EEEE-4EEE-8EEE-000000000005'),
    ('050E0000-EEEE-4EEE-8EEE-000000000016', @now, '05060000-EEEE-4EEE-8EEE-000000000002', 5, '050F0000-EEEE-4EEE-8EEE-000000000005'),
    ('050E0000-EEEE-4EEE-8EEE-000000000017', @now, '05060000-EEEE-4EEE-8EEE-000000000003', 4, '050F0000-EEEE-4EEE-8EEE-000000000005'),
    ('050E0000-EEEE-4EEE-8EEE-000000000018', @now, '05060000-EEEE-4EEE-8EEE-000000000004', 4, '050F0000-EEEE-4EEE-8EEE-000000000005'),
    ('050E0000-EEEE-4EEE-8EEE-000000000019', @now, '05060000-EEEE-4EEE-8EEE-000000000005', 4, '050F0000-EEEE-4EEE-8EEE-000000000005'),
    ('050E0000-EEEE-4EEE-8EEE-00000000001A', @now, '05060000-EEEE-4EEE-8EEE-000000000001', 3, '050F0000-EEEE-4EEE-8EEE-000000000006'),
    ('050E0000-EEEE-4EEE-8EEE-00000000001B', @now, '05060000-EEEE-4EEE-8EEE-000000000002', 5, '050F0000-EEEE-4EEE-8EEE-000000000006'),
    ('050E0000-EEEE-4EEE-8EEE-00000000001C', @now, '05060000-EEEE-4EEE-8EEE-000000000003', 3, '050F0000-EEEE-4EEE-8EEE-000000000006'),
    ('050E0000-EEEE-4EEE-8EEE-00000000001D', @now, '05060000-EEEE-4EEE-8EEE-000000000004', 4, '050F0000-EEEE-4EEE-8EEE-000000000006'),
    ('050E0000-EEEE-4EEE-8EEE-00000000001E', @now, '05060000-EEEE-4EEE-8EEE-000000000005', 3, '050F0000-EEEE-4EEE-8EEE-000000000006'),
    ('050E0000-EEEE-4EEE-8EEE-00000000001F', @now, '05060000-EEEE-4EEE-8EEE-000000000001', 4, '050F0000-EEEE-4EEE-8EEE-000000000007'),
    ('050E0000-EEEE-4EEE-8EEE-000000000020', @now, '05060000-EEEE-4EEE-8EEE-000000000002', 4, '050F0000-EEEE-4EEE-8EEE-000000000007'),
    ('050E0000-EEEE-4EEE-8EEE-000000000021', @now, '05060000-EEEE-4EEE-8EEE-000000000003', 4, '050F0000-EEEE-4EEE-8EEE-000000000007'),
    ('050E0000-EEEE-4EEE-8EEE-000000000022', @now, '05060000-EEEE-4EEE-8EEE-000000000004', 5, '050F0000-EEEE-4EEE-8EEE-000000000007'),
    ('050E0000-EEEE-4EEE-8EEE-000000000023', @now, '05060000-EEEE-4EEE-8EEE-000000000005', 4, '050F0000-EEEE-4EEE-8EEE-000000000007'),
    ('050E0000-EEEE-4EEE-8EEE-000000000024', @now, '05060000-EEEE-4EEE-8EEE-000000000001', 4, '050F0000-EEEE-4EEE-8EEE-000000000008'),
    ('050E0000-EEEE-4EEE-8EEE-000000000025', @now, '05060000-EEEE-4EEE-8EEE-000000000002', 4, '050F0000-EEEE-4EEE-8EEE-000000000008'),
    ('050E0000-EEEE-4EEE-8EEE-000000000026', @now, '05060000-EEEE-4EEE-8EEE-000000000003', 4, '050F0000-EEEE-4EEE-8EEE-000000000008'),
    ('050E0000-EEEE-4EEE-8EEE-000000000027', @now, '05060000-EEEE-4EEE-8EEE-000000000004', 3, '050F0000-EEEE-4EEE-8EEE-000000000008'),
    ('050E0000-EEEE-4EEE-8EEE-000000000028', @now, '05060000-EEEE-4EEE-8EEE-000000000005', 4, '050F0000-EEEE-4EEE-8EEE-000000000008');

UPDATE submissions SET status = 'SUBMITTED' WHERE round_id = '05030000-EEEE-4EEE-8EEE-000000000001';

-- ============================================================
-- === SEAL Hackathon Fall Preview 2026 - Early Access Build ===
-- QA phase: ACTIVE - deadline in ~3h, no submissions, progress alerts + mentor_teams + notifications seeded
-- Login: pham.quoc.bao@fpt.edu.vn (mentor track 1) or nguyen.hoang.minh.preview26@fpt.edu.vn (student leader) / Demo@123456
-- View: admin/lecturer dashboard Teams needing support · /student dashboard banner · notifications
-- ============================================================

DECLARE @e6_compDay DATE = CAST(@now AS DATE);
DECLARE @e6_endDay DATE = CAST(DATEADD(DAY, 3, @now) AS DATE);
DECLARE @e6_compDt DATETIME2 = CAST(@e6_compDay AS DATETIME2);
DECLARE @e6_regOpen DATE = CAST(DATEADD(DAY, -15, @now) AS DATE);
DECLARE @e6_regDeadline DATE = CAST(DATEADD(DAY, -1, @now) AS DATE);
DECLARE @e6_prelimStart DATETIME2 = DATEADD(DAY, -1, @now);
DECLARE @e6_prelimSub DATETIME2 = DATEADD(HOUR, 3, @now);
DECLARE @e6_prelimScore DATETIME2 = DATEADD(DAY, 2, @now);
DECLARE @e6_finalStart DATETIME2 = DATEADD(DAY, 2, @now);
DECLARE @e6_finalSub DATETIME2 = DATEADD(DAY, 2, @now);
DECLARE @e6_finalScore DATETIME2 = DATEADD(DAY, 3, @now);
DECLARE @e6_finalEnd DATETIME2 = DATEADD(DAY, 3, @now);

INSERT INTO hackathon_events (
    id, name, season, year, start_date, end_date,
    registration_open_date, registration_deadline,
    description, location, format, competition_format,
    min_team, max_team, semester_min, semester_max,
    scoring_template_id, status, leaderboard_public,
    owner_user_id, created_by, created_at, updated_at
) VALUES (
    '06020000-EEEE-4EEE-8EEE-000000000001',
    N'SEAL Hackathon Fall Preview 2026 - Early Access Build',
    N'Fall', 2026,
    @e6_compDay, @e6_endDay,
    @e6_regOpen, @e6_regDeadline,
    N'SEAL Hackathon Fall 2026 focuses on Agentic RAG systems: grounded retrieval, multi-step agent orchestration, and enterprise-ready copilots built by FPT University teams.',
    N'FPT University HCM', 'OFFLINE', 'SEAL_RAG_2026',
    3, 5, 4, 8,
    @templateId, 'ACTIVE', 0,
    @coordId, N'tran.thanh.ha@fpt.edu.vn', @now, @now
);

INSERT INTO tracks (id, event_id, name, description, max_teams, status, created_at, updated_at) VALUES
    ('06040000-EEEE-4EEE-8EEE-000000000001', '06020000-EEEE-4EEE-8EEE-000000000001', N'Grounded Retrieval', N'SEAL track: Grounded Retrieval', 8, 'OPEN', @now, @now),
    ('06040000-EEEE-4EEE-8EEE-000000000002', '06020000-EEEE-4EEE-8EEE-000000000001', N'Agent Orchestration', N'SEAL track: Agent Orchestration', 8, 'OPEN', @now, @now),
    ('06040000-EEEE-4EEE-8EEE-000000000003', '06020000-EEEE-4EEE-8EEE-000000000001', N'Enterprise Copilot', N'SEAL track: Enterprise Copilot', 8, 'OPEN', @now, @now);

INSERT INTO rounds (
    id, event_id, round_number, name, round_type,
    start_date, end_date, slide_deadline, submission_deadline, scoring_deadline,
    advancement_cutoff, advancement_rule, round_weight, created_at, updated_at
) VALUES
    ('06030000-EEEE-4EEE-8EEE-000000000001', '06020000-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', 'PRELIMINARY',
     @e6_prelimStart, @e6_prelimScore, DATEADD(HOUR, -4, @e6_prelimSub),
     @e6_prelimSub, @e6_prelimScore,
     2, 'PER_TRACK_TOP_N', 40, @now, @now),
    ('06030000-EEEE-4EEE-8EEE-000000000002', '06020000-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', 'FINAL',
     @e6_finalStart, @e6_finalEnd, NULL,
     @e6_finalSub, @e6_finalScore,
     6, 'FINALIST_POOL', 60, @now, @now);

INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at) VALUES
    ('06060000-EEEE-4EEE-8EEE-000000000001', '06030000-EEEE-4EEE-8EEE-000000000001', N'Accuracy and Domain Relevance', N'Accuracy and Domain Relevance', 30, 0, 1, 5, @now, @now),
    ('06060000-EEEE-4EEE-8EEE-000000000002', '06030000-EEEE-4EEE-8EEE-000000000001', N'Agentic RAG Architecture & Algorithm', N'Agentic RAG Architecture & Algorithm', 30, 1, 1, 5, @now, @now),
    ('06060000-EEEE-4EEE-8EEE-000000000003', '06030000-EEEE-4EEE-8EEE-000000000001', N'Ideas & Presentation', N'Ideas & Presentation', 15, 2, 1, 5, @now, @now),
    ('06060000-EEEE-4EEE-8EEE-000000000004', '06030000-EEEE-4EEE-8EEE-000000000001', N'Feasibility & Creativity', N'Feasibility & Creativity', 15, 3, 1, 5, @now, @now),
    ('06060000-EEEE-4EEE-8EEE-000000000005', '06030000-EEEE-4EEE-8EEE-000000000001', N'User Experience & Interactive Interface', N'User Experience & Interactive Interface', 10, 4, 1, 5, @now, @now),
    ('06060000-EEEE-4EEE-8EEE-00000000000B', '06030000-EEEE-4EEE-8EEE-000000000002', N'Data Processing & Retrieval Quality', N'Data Processing & Retrieval Quality', 30, 0, 1, 5, @now, @now),
    ('06060000-EEEE-4EEE-8EEE-00000000000C', '06030000-EEEE-4EEE-8EEE-000000000002', N'Reliability & Hallucination Resistance', N'Reliability & Hallucination Resistance', 20, 1, 1, 5, @now, @now),
    ('06060000-EEEE-4EEE-8EEE-00000000000D', '06030000-EEEE-4EEE-8EEE-000000000002', N'Agent Reasoning & Multi-hop Processing', N'Agent Reasoning & Multi-hop Processing', 20, 2, 1, 5, @now, @now),
    ('06060000-EEEE-4EEE-8EEE-00000000000E', '06030000-EEEE-4EEE-8EEE-000000000002', N'Practicality & Operational Optimization', N'Practicality & Operational Optimization', 20, 3, 1, 5, @now, @now),
    ('06060000-EEEE-4EEE-8EEE-00000000000F', '06030000-EEEE-4EEE-8EEE-000000000002', N'Scalability & Innovation', N'Scalability & Innovation', 10, 4, 1, 5, @now, @now);

INSERT INTO prizes (id, event_id, rank, value, quantity, label, created_at, updated_at) VALUES
    ('06070000-EEEE-4EEE-8EEE-000000000001', '06020000-EEEE-4EEE-8EEE-000000000001', 'FIRST', '7000000', 1, N'First Prize', @now, @now),
    ('06070000-EEEE-4EEE-8EEE-000000000002', '06020000-EEEE-4EEE-8EEE-000000000001', 'SECOND', '5000000', 1, N'Second Prize', @now, @now),
    ('06070000-EEEE-4EEE-8EEE-000000000003', '06020000-EEEE-4EEE-8EEE-000000000001', 'THIRD', '3000000', 1, N'Third Prize', @now, @now),
    ('06070000-EEEE-4EEE-8EEE-000000000004', '06020000-EEEE-4EEE-8EEE-000000000001', 'CONSOLATION', '1500000', 1, N'Consolation Prize', @now, @now);

INSERT INTO event_schedules (id, event_id, type, title, description, start_time, end_time, gate, sort_order, created_at, updated_at) VALUES
    ('06080000-EEEE-4EEE-8EEE-000000000001', '06020000-EEEE-4EEE-8EEE-000000000001', 'WORKSHOP', N'Workshop', NULL, DATEADD(DAY, -3, @e6_compDt), DATEADD(HOUR, 3, DATEADD(DAY, -3, @e6_compDt)), NULL, 0, @now, @now),
    ('06080000-EEEE-4EEE-8EEE-000000000002', '06020000-EEEE-4EEE-8EEE-000000000001', 'OPENING', N'Opening & track draw', N'Teams pick tracks in turn; organizers draw topics per track', DATEADD(DAY, -1, @e6_compDt), DATEADD(HOUR, 3, DATEADD(DAY, -1, @e6_compDt)), NULL, 1, @now, @now),
    ('06080000-EEEE-4EEE-8EEE-000000000003', '06020000-EEEE-4EEE-8EEE-000000000001', 'TRACK_DRAW', N'Track selection draw', NULL, DATEADD(DAY, -1, @e6_compDt), DATEADD(HOUR, 2, DATEADD(DAY, -1, @e6_compDt)), NULL, 2, @now, @now),
    ('06080000-EEEE-4EEE-8EEE-000000000004', '06020000-EEEE-4EEE-8EEE-000000000001', 'MILESTONE', N'Milestone 1 - Idea & architecture completion', N'Design Agentic RAG architecture', @e6_prelimStart, DATEADD(HOUR, 3, @e6_prelimStart), 'SLIDE_SUBMISSION', 3, @now, @now),
    ('06080000-EEEE-4EEE-8EEE-000000000005', '06020000-EEEE-4EEE-8EEE-000000000001', 'MILESTONE', N'Milestone 2 - Pitching & product completion', N'Parallel pitching and coding', DATEADD(HOUR, 3, @e6_prelimStart), @e6_prelimSub, 'DEMO_SUBMISSION', 4, @now, @now),
    ('06080000-EEEE-4EEE-8EEE-000000000006', '06020000-EEEE-4EEE-8EEE-000000000001', 'SCORING', N'Preliminary scoring', N'5-minute presentation + 3-minute Q&A', @e6_prelimSub, @e6_prelimScore, NULL, 5, @now, @now),
    ('06080000-EEEE-4EEE-8EEE-000000000007', '06020000-EEEE-4EEE-8EEE-000000000001', 'FINAL', N'Finals', N'7-minute presentation + 3-minute Q&A - Top 6 teams', @e6_finalStart, @e6_finalEnd, NULL, 6, @now, @now),
    ('06080000-EEEE-4EEE-8EEE-000000000008', '06020000-EEEE-4EEE-8EEE-000000000001', 'CEREMONY', N'Awards & closing ceremony', NULL, @e6_finalEnd, DATEADD(HOUR, 1, @e6_finalEnd), NULL, 7, @now, @now);

INSERT INTO allowed_email_domains (id, event_id, domain, university_label, created_at, updated_at) VALUES
    ('06090000-EEEE-4EEE-8EEE-000000000001', '06020000-EEEE-4EEE-8EEE-000000000001', 'fpt.edu.vn', N'FPT University', @now, @now),
    ('06090000-EEEE-4EEE-8EEE-000000000002', '06020000-EEEE-4EEE-8EEE-000000000001', 'fe.edu.vn', N'FPT Education', @now, @now),
    ('06090000-EEEE-4EEE-8EEE-000000000003', '06020000-EEEE-4EEE-8EEE-000000000001', 'hcmut.edu.vn', N'Ho Chi Minh City University of Technology', @now, @now),
    ('06090000-EEEE-4EEE-8EEE-000000000004', '06020000-EEEE-4EEE-8EEE-000000000001', 'hcmus.edu.vn', N'Vietnam National University Ho Chi Minh City - University of Science', @now, @now),
    ('06090000-EEEE-4EEE-8EEE-000000000005', '06020000-EEEE-4EEE-8EEE-000000000001', 'student.hcmus.edu.vn', N'Vietnam National University Ho Chi Minh City - University of Science', @now, @now),
    ('06090000-EEEE-4EEE-8EEE-000000000006', '06020000-EEEE-4EEE-8EEE-000000000001', 'uit.edu.vn', N'University of Information Technology', @now, @now),
    ('06090000-EEEE-4EEE-8EEE-000000000007', '06020000-EEEE-4EEE-8EEE-000000000001', 'hcmute.edu.vn', N'Ho Chi Minh City University of Education and Technology', @now, @now),
    ('06090000-EEEE-4EEE-8EEE-000000000008', '06020000-EEEE-4EEE-8EEE-000000000001', 'ueh.edu.vn', N'University of Economics Ho Chi Minh City', @now, @now),
    ('06090000-EEEE-4EEE-8EEE-000000000009', '06020000-EEEE-4EEE-8EEE-000000000001', 'student.ueh.edu.vn', N'University of Economics Ho Chi Minh City', @now, @now),
    ('06090000-EEEE-4EEE-8EEE-00000000000A', '06020000-EEEE-4EEE-8EEE-000000000001', 'student.iuh.edu.vn', N'Industrial University of Ho Chi Minh City', @now, @now);

INSERT INTO event_enrollments (id, created_at, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public) VALUES
    ('060A0000-EEEE-4EEE-8EEE-000000000001', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-000000000001', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-000000000002', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-000000000002', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-000000000003', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-000000000003', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-000000000004', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-000000000004', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-000000000005', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-000000000005', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-000000000006', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-000000000006', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-000000000007', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-000000000007', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-000000000008', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-000000000008', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-000000000009', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-000000000009', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-00000000000A', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-00000000000B', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-00000000000B', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-00000000000C', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-00000000000C', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-00000000000D', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-00000000000D', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-00000000000E', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-00000000000E', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-00000000000F', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-00000000000F', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-000000000010', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-000000000010', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-000000000011', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-000000000011', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-000000000012', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-000000000012', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-000000000013', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-000000000013', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-000000000014', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-000000000014', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-000000000015', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-000000000015', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-000000000016', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-000000000016', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-000000000017', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-000000000017', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-000000000018', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-000000000018', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-000000000019', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-000000000019', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-00000000001A', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-00000000001A', 0, 0),
    ('060A0000-EEEE-4EEE-8EEE-00000000001B', @now, @now, '06020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '06010000-EEEE-4EEE-8EEE-00000000001B', 0, 0);

INSERT INTO teams (id, created_at, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, is_recruiting, recruitment_note, version) VALUES
    ('06050000-EEEE-4EEE-8EEE-000000000001', @now, '06020000-EEEE-4EEE-8EEE-000000000001', '06010000-EEEE-4EEE-8EEE-000000000001', N'EarlyAccess', 'CONFIRMED', '06040000-EEEE-4EEE-8EEE-000000000001', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Grounded Retrieval track.', 0),
    ('06050000-EEEE-4EEE-8EEE-000000000002', @now, '06020000-EEEE-4EEE-8EEE-000000000001', '06010000-EEEE-4EEE-8EEE-000000000004', N'PreviewBot', 'CONFIRMED', '06040000-EEEE-4EEE-8EEE-000000000001', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Grounded Retrieval track.', 0),
    ('06050000-EEEE-4EEE-8EEE-000000000003', @now, '06020000-EEEE-4EEE-8EEE-000000000001', '06010000-EEEE-4EEE-8EEE-000000000007', N'DeadlineDash', 'CONFIRMED', '06040000-EEEE-4EEE-8EEE-000000000001', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Grounded Retrieval track.', 0),
    ('06050000-EEEE-4EEE-8EEE-000000000004', @now, '06020000-EEEE-4EEE-8EEE-000000000001', '06010000-EEEE-4EEE-8EEE-00000000000A', N'AlertReady', 'CONFIRMED', '06040000-EEEE-4EEE-8EEE-000000000002', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Agent Orchestration track.', 0),
    ('06050000-EEEE-4EEE-8EEE-000000000005', @now, '06020000-EEEE-4EEE-8EEE-000000000001', '06010000-EEEE-4EEE-8EEE-00000000000D', N'RushRetrieve', 'CONFIRMED', '06040000-EEEE-4EEE-8EEE-000000000002', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Agent Orchestration track.', 0),
    ('06050000-EEEE-4EEE-8EEE-000000000006', @now, '06020000-EEEE-4EEE-8EEE-000000000001', '06010000-EEEE-4EEE-8EEE-000000000010', N'NightOwl RAG', 'CONFIRMED', '06040000-EEEE-4EEE-8EEE-000000000002', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Agent Orchestration track.', 0),
    ('06050000-EEEE-4EEE-8EEE-000000000007', @now, '06020000-EEEE-4EEE-8EEE-000000000001', '06010000-EEEE-4EEE-8EEE-000000000013', N'TickTock Agent', 'CONFIRMED', '06040000-EEEE-4EEE-8EEE-000000000003', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Enterprise Copilot track.', 0),
    ('06050000-EEEE-4EEE-8EEE-000000000008', @now, '06020000-EEEE-4EEE-8EEE-000000000001', '06010000-EEEE-4EEE-8EEE-000000000016', N'LastCall', 'CONFIRMED', '06040000-EEEE-4EEE-8EEE-000000000003', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Enterprise Copilot track.', 0),
    ('06050000-EEEE-4EEE-8EEE-000000000009', @now, '06020000-EEEE-4EEE-8EEE-000000000001', '06010000-EEEE-4EEE-8EEE-000000000019', N'HourGlass AI', 'CONFIRMED', '06040000-EEEE-4EEE-8EEE-000000000003', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Enterprise Copilot track.', 0);

INSERT INTO team_members (id, created_at, joined_at, role, user_id, team_id, event_id) VALUES
    ('060B0000-EEEE-4EEE-8EEE-000000000001', @now, @now, 'LEADER', '06010000-EEEE-4EEE-8EEE-000000000001', '06050000-EEEE-4EEE-8EEE-000000000001', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-000000000002', @now, @now, 'MEMBER', '06010000-EEEE-4EEE-8EEE-000000000002', '06050000-EEEE-4EEE-8EEE-000000000001', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-000000000003', @now, @now, 'MEMBER', '06010000-EEEE-4EEE-8EEE-000000000003', '06050000-EEEE-4EEE-8EEE-000000000001', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-000000000004', @now, @now, 'LEADER', '06010000-EEEE-4EEE-8EEE-000000000004', '06050000-EEEE-4EEE-8EEE-000000000002', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-000000000005', @now, @now, 'MEMBER', '06010000-EEEE-4EEE-8EEE-000000000005', '06050000-EEEE-4EEE-8EEE-000000000002', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-000000000006', @now, @now, 'MEMBER', '06010000-EEEE-4EEE-8EEE-000000000006', '06050000-EEEE-4EEE-8EEE-000000000002', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-000000000007', @now, @now, 'LEADER', '06010000-EEEE-4EEE-8EEE-000000000007', '06050000-EEEE-4EEE-8EEE-000000000003', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-000000000008', @now, @now, 'MEMBER', '06010000-EEEE-4EEE-8EEE-000000000008', '06050000-EEEE-4EEE-8EEE-000000000003', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-000000000009', @now, @now, 'MEMBER', '06010000-EEEE-4EEE-8EEE-000000000009', '06050000-EEEE-4EEE-8EEE-000000000003', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, 'LEADER', '06010000-EEEE-4EEE-8EEE-00000000000A', '06050000-EEEE-4EEE-8EEE-000000000004', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-00000000000B', @now, @now, 'MEMBER', '06010000-EEEE-4EEE-8EEE-00000000000B', '06050000-EEEE-4EEE-8EEE-000000000004', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-00000000000C', @now, @now, 'MEMBER', '06010000-EEEE-4EEE-8EEE-00000000000C', '06050000-EEEE-4EEE-8EEE-000000000004', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-00000000000D', @now, @now, 'LEADER', '06010000-EEEE-4EEE-8EEE-00000000000D', '06050000-EEEE-4EEE-8EEE-000000000005', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-00000000000E', @now, @now, 'MEMBER', '06010000-EEEE-4EEE-8EEE-00000000000E', '06050000-EEEE-4EEE-8EEE-000000000005', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-00000000000F', @now, @now, 'MEMBER', '06010000-EEEE-4EEE-8EEE-00000000000F', '06050000-EEEE-4EEE-8EEE-000000000005', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-000000000010', @now, @now, 'LEADER', '06010000-EEEE-4EEE-8EEE-000000000010', '06050000-EEEE-4EEE-8EEE-000000000006', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-000000000011', @now, @now, 'MEMBER', '06010000-EEEE-4EEE-8EEE-000000000011', '06050000-EEEE-4EEE-8EEE-000000000006', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-000000000012', @now, @now, 'MEMBER', '06010000-EEEE-4EEE-8EEE-000000000012', '06050000-EEEE-4EEE-8EEE-000000000006', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-000000000013', @now, @now, 'LEADER', '06010000-EEEE-4EEE-8EEE-000000000013', '06050000-EEEE-4EEE-8EEE-000000000007', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-000000000014', @now, @now, 'MEMBER', '06010000-EEEE-4EEE-8EEE-000000000014', '06050000-EEEE-4EEE-8EEE-000000000007', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-000000000015', @now, @now, 'MEMBER', '06010000-EEEE-4EEE-8EEE-000000000015', '06050000-EEEE-4EEE-8EEE-000000000007', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-000000000016', @now, @now, 'LEADER', '06010000-EEEE-4EEE-8EEE-000000000016', '06050000-EEEE-4EEE-8EEE-000000000008', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-000000000017', @now, @now, 'MEMBER', '06010000-EEEE-4EEE-8EEE-000000000017', '06050000-EEEE-4EEE-8EEE-000000000008', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-000000000018', @now, @now, 'MEMBER', '06010000-EEEE-4EEE-8EEE-000000000018', '06050000-EEEE-4EEE-8EEE-000000000008', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-000000000019', @now, @now, 'LEADER', '06010000-EEEE-4EEE-8EEE-000000000019', '06050000-EEEE-4EEE-8EEE-000000000009', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-00000000001A', @now, @now, 'MEMBER', '06010000-EEEE-4EEE-8EEE-00000000001A', '06050000-EEEE-4EEE-8EEE-000000000009', '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060B0000-EEEE-4EEE-8EEE-00000000001B', @now, @now, 'MEMBER', '06010000-EEEE-4EEE-8EEE-00000000001B', '06050000-EEEE-4EEE-8EEE-000000000009', '06020000-EEEE-4EEE-8EEE-000000000001');

INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id) VALUES
    ('060C0000-EEEE-4EEE-8EEE-000000000001', @now, @now, @judge1Id, '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060C0000-EEEE-4EEE-8EEE-000000000002', @now, @now, @judge2Id, '06020000-EEEE-4EEE-8EEE-000000000001'),
    ('060C0000-EEEE-4EEE-8EEE-000000000008', @now, @now, @judge3Id, '06020000-EEEE-4EEE-8EEE-000000000001');
INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active) VALUES
    ('060C0000-EEEE-4EEE-8EEE-000000000003', @now, @now, @judge1Id, '06030000-EEEE-4EEE-8EEE-000000000001', 'ROUND', 1),
    ('060C0000-EEEE-4EEE-8EEE-000000000004', @now, @now, @judge2Id, '06030000-EEEE-4EEE-8EEE-000000000001', 'ROUND', 1),
    ('060C0000-EEEE-4EEE-8EEE-000000000009', @now, @now, @judge3Id, '06030000-EEEE-4EEE-8EEE-000000000001', 'ROUND', 1),
    ('060C0000-EEEE-4EEE-8EEE-000000000005', @now, @now, @judge1Id, '06030000-EEEE-4EEE-8EEE-000000000002', 'ROUND', 1),
    ('060C0000-EEEE-4EEE-8EEE-000000000006', @now, @now, @judge2Id, '06030000-EEEE-4EEE-8EEE-000000000002', 'ROUND', 1),
    ('060C0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, @judge3Id, '06030000-EEEE-4EEE-8EEE-000000000002', 'ROUND', 1);
INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at) VALUES
    ('060C0000-EEEE-4EEE-8EEE-000000000007', '06020000-EEEE-4EEE-8EEE-000000000001', @mentor1Id, @now, @now),
    ('060C0000-EEEE-4EEE-8EEE-00000000000B', '06020000-EEEE-4EEE-8EEE-000000000001', @mentor2Id, @now, @now),
    ('060C0000-EEEE-4EEE-8EEE-00000000000C', '06020000-EEEE-4EEE-8EEE-000000000001', @mentor3Id, @now, @now);

INSERT INTO mentor_assignments (id, created_at, assigned_at, mentor_user_id, event_id, track_id) VALUES
    ('06160000-EEEE-4EEE-8EEE-000000000001', @now, @now, @mentor1Id, '06020000-EEEE-4EEE-8EEE-000000000001', '06040000-EEEE-4EEE-8EEE-000000000001'),
    ('06160000-EEEE-4EEE-8EEE-000000000002', @now, @now, @mentor2Id, '06020000-EEEE-4EEE-8EEE-000000000001', '06040000-EEEE-4EEE-8EEE-000000000002'),
    ('06160000-EEEE-4EEE-8EEE-000000000003', @now, @now, @mentor3Id, '06020000-EEEE-4EEE-8EEE-000000000001', '06040000-EEEE-4EEE-8EEE-000000000003');

INSERT INTO mentor_teams (id, created_at, assigned_at, mentor_user_id, team_id) VALUES
    ('06170000-EEEE-4EEE-8EEE-000000000001', @now, @now, @mentor1Id, '06050000-EEEE-4EEE-8EEE-000000000001'),
    ('06170000-EEEE-4EEE-8EEE-000000000002', @now, @now, @mentor1Id, '06050000-EEEE-4EEE-8EEE-000000000002'),
    ('06170000-EEEE-4EEE-8EEE-000000000003', @now, @now, @mentor1Id, '06050000-EEEE-4EEE-8EEE-000000000003'),
    ('06170000-EEEE-4EEE-8EEE-000000000004', @now, @now, @mentor2Id, '06050000-EEEE-4EEE-8EEE-000000000004'),
    ('06170000-EEEE-4EEE-8EEE-000000000005', @now, @now, @mentor2Id, '06050000-EEEE-4EEE-8EEE-000000000005'),
    ('06170000-EEEE-4EEE-8EEE-000000000006', @now, @now, @mentor2Id, '06050000-EEEE-4EEE-8EEE-000000000006'),
    ('06170000-EEEE-4EEE-8EEE-000000000007', @now, @now, @mentor3Id, '06050000-EEEE-4EEE-8EEE-000000000007'),
    ('06170000-EEEE-4EEE-8EEE-000000000008', @now, @now, @mentor3Id, '06050000-EEEE-4EEE-8EEE-000000000008'),
    ('06170000-EEEE-4EEE-8EEE-000000000009', @now, @now, @mentor3Id, '06050000-EEEE-4EEE-8EEE-000000000009');

INSERT INTO mentor_invitations (id, created_at, team_id, mentor_user_id, inviter_id, status, message) VALUES
    ('06180000-EEEE-4EEE-8EEE-000000000001', @now, '06050000-EEEE-4EEE-8EEE-000000000001', @mentor1Id, '06010000-EEEE-4EEE-8EEE-000000000001', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('06180000-EEEE-4EEE-8EEE-000000000002', @now, '06050000-EEEE-4EEE-8EEE-000000000002', @mentor1Id, '06010000-EEEE-4EEE-8EEE-000000000004', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('06180000-EEEE-4EEE-8EEE-000000000003', @now, '06050000-EEEE-4EEE-8EEE-000000000003', @mentor1Id, '06010000-EEEE-4EEE-8EEE-000000000007', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('06180000-EEEE-4EEE-8EEE-000000000004', @now, '06050000-EEEE-4EEE-8EEE-000000000004', @mentor2Id, '06010000-EEEE-4EEE-8EEE-00000000000A', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('06180000-EEEE-4EEE-8EEE-000000000005', @now, '06050000-EEEE-4EEE-8EEE-000000000005', @mentor2Id, '06010000-EEEE-4EEE-8EEE-00000000000D', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('06180000-EEEE-4EEE-8EEE-000000000006', @now, '06050000-EEEE-4EEE-8EEE-000000000006', @mentor2Id, '06010000-EEEE-4EEE-8EEE-000000000010', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('06180000-EEEE-4EEE-8EEE-000000000007', @now, '06050000-EEEE-4EEE-8EEE-000000000007', @mentor3Id, '06010000-EEEE-4EEE-8EEE-000000000013', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('06180000-EEEE-4EEE-8EEE-000000000008', @now, '06050000-EEEE-4EEE-8EEE-000000000008', @mentor3Id, '06010000-EEEE-4EEE-8EEE-000000000016', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('06180000-EEEE-4EEE-8EEE-000000000009', @now, '06050000-EEEE-4EEE-8EEE-000000000009', @mentor3Id, '06010000-EEEE-4EEE-8EEE-000000000019', 'ACCEPTED', N'Seeded mentor assignment for QA');

INSERT INTO team_progress_alerts (id, team_id, round_id, risk_level, reasons, last_alerted_at, created_at, updated_at) VALUES
    ('06150000-EEEE-4EEE-8EEE-000000000001', '06050000-EEEE-4EEE-8EEE-000000000001', '06030000-EEEE-4EEE-8EEE-000000000001', N'CRITICAL', N'NOT_STARTED', @now, @now, @now),
    ('06150000-EEEE-4EEE-8EEE-000000000002', '06050000-EEEE-4EEE-8EEE-000000000002', '06030000-EEEE-4EEE-8EEE-000000000001', N'CRITICAL', N'NOT_STARTED', @now, @now, @now),
    ('06150000-EEEE-4EEE-8EEE-000000000003', '06050000-EEEE-4EEE-8EEE-000000000003', '06030000-EEEE-4EEE-8EEE-000000000001', N'CRITICAL', N'NOT_STARTED', @now, @now, @now),
    ('06150000-EEEE-4EEE-8EEE-000000000004', '06050000-EEEE-4EEE-8EEE-000000000004', '06030000-EEEE-4EEE-8EEE-000000000001', N'CRITICAL', N'NOT_STARTED', @now, @now, @now),
    ('06150000-EEEE-4EEE-8EEE-000000000005', '06050000-EEEE-4EEE-8EEE-000000000005', '06030000-EEEE-4EEE-8EEE-000000000001', N'CRITICAL', N'NOT_STARTED', @now, @now, @now),
    ('06150000-EEEE-4EEE-8EEE-000000000006', '06050000-EEEE-4EEE-8EEE-000000000006', '06030000-EEEE-4EEE-8EEE-000000000001', N'CRITICAL', N'NOT_STARTED', @now, @now, @now),
    ('06150000-EEEE-4EEE-8EEE-000000000007', '06050000-EEEE-4EEE-8EEE-000000000007', '06030000-EEEE-4EEE-8EEE-000000000001', N'CRITICAL', N'NOT_STARTED', @now, @now, @now),
    ('06150000-EEEE-4EEE-8EEE-000000000008', '06050000-EEEE-4EEE-8EEE-000000000008', '06030000-EEEE-4EEE-8EEE-000000000001', N'CRITICAL', N'NOT_STARTED', @now, @now, @now),
    ('06150000-EEEE-4EEE-8EEE-000000000009', '06050000-EEEE-4EEE-8EEE-000000000009', '06030000-EEEE-4EEE-8EEE-000000000001', N'CRITICAL', N'NOT_STARTED', @now, @now, @now);

INSERT INTO notifications (id, created_at, message, reference_id, reference_type, title, type) VALUES
    ('06190000-EEEE-4EEE-8EEE-000000000001', @now, N'Team EarlyAccess has not started submission and the deadline is approaching (NOT_STARTED).', '06050000-EEEE-4EEE-8EEE-000000000001', N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT'),
    ('06190000-EEEE-4EEE-8EEE-000000000002', @now, N'Team PreviewBot has not started submission and the deadline is approaching (NOT_STARTED).', '06050000-EEEE-4EEE-8EEE-000000000002', N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT'),
    ('06190000-EEEE-4EEE-8EEE-000000000003', @now, N'Team DeadlineDash has not started submission and the deadline is approaching (NOT_STARTED).', '06050000-EEEE-4EEE-8EEE-000000000003', N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT'),
    ('06190000-EEEE-4EEE-8EEE-000000000004', @now, N'Team AlertReady has not started submission and the deadline is approaching (NOT_STARTED).', '06050000-EEEE-4EEE-8EEE-000000000004', N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT'),
    ('06190000-EEEE-4EEE-8EEE-000000000005', @now, N'Team RushRetrieve has not started submission and the deadline is approaching (NOT_STARTED).', '06050000-EEEE-4EEE-8EEE-000000000005', N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT'),
    ('06190000-EEEE-4EEE-8EEE-000000000006', @now, N'Team NightOwl RAG has not started submission and the deadline is approaching (NOT_STARTED).', '06050000-EEEE-4EEE-8EEE-000000000006', N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT'),
    ('06190000-EEEE-4EEE-8EEE-000000000007', @now, N'Team TickTock Agent has not started submission and the deadline is approaching (NOT_STARTED).', '06050000-EEEE-4EEE-8EEE-000000000007', N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT'),
    ('06190000-EEEE-4EEE-8EEE-000000000008', @now, N'Team LastCall has not started submission and the deadline is approaching (NOT_STARTED).', '06050000-EEEE-4EEE-8EEE-000000000008', N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT'),
    ('06190000-EEEE-4EEE-8EEE-000000000009', @now, N'Team HourGlass AI has not started submission and the deadline is approaching (NOT_STARTED).', '06050000-EEEE-4EEE-8EEE-000000000009', N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT');

INSERT INTO notification_recipients (id, created_at, channel, read_at, sent_at, user_id, notification_id) VALUES
    ('061A0000-EEEE-4EEE-8EEE-000000000001', @now, N'IN_APP', NULL, @now, '06010000-EEEE-4EEE-8EEE-000000000001', '06190000-EEEE-4EEE-8EEE-000000000001'),
    ('061A0000-EEEE-4EEE-8EEE-000000000002', @now, N'IN_APP', NULL, @now, @mentor1Id, '06190000-EEEE-4EEE-8EEE-000000000001'),
    ('061A0000-EEEE-4EEE-8EEE-000000000003', @now, N'IN_APP', NULL, @now, @coordId, '06190000-EEEE-4EEE-8EEE-000000000001'),
    ('061A0000-EEEE-4EEE-8EEE-000000000004', @now, N'IN_APP', NULL, @now, '06010000-EEEE-4EEE-8EEE-000000000004', '06190000-EEEE-4EEE-8EEE-000000000002'),
    ('061A0000-EEEE-4EEE-8EEE-000000000005', @now, N'IN_APP', NULL, @now, @mentor1Id, '06190000-EEEE-4EEE-8EEE-000000000002'),
    ('061A0000-EEEE-4EEE-8EEE-000000000006', @now, N'IN_APP', NULL, @now, @coordId, '06190000-EEEE-4EEE-8EEE-000000000002'),
    ('061A0000-EEEE-4EEE-8EEE-000000000007', @now, N'IN_APP', NULL, @now, '06010000-EEEE-4EEE-8EEE-000000000007', '06190000-EEEE-4EEE-8EEE-000000000003'),
    ('061A0000-EEEE-4EEE-8EEE-000000000008', @now, N'IN_APP', NULL, @now, @mentor1Id, '06190000-EEEE-4EEE-8EEE-000000000003'),
    ('061A0000-EEEE-4EEE-8EEE-000000000009', @now, N'IN_APP', NULL, @now, @coordId, '06190000-EEEE-4EEE-8EEE-000000000003'),
    ('061A0000-EEEE-4EEE-8EEE-00000000000A', @now, N'IN_APP', NULL, @now, '06010000-EEEE-4EEE-8EEE-00000000000A', '06190000-EEEE-4EEE-8EEE-000000000004'),
    ('061A0000-EEEE-4EEE-8EEE-00000000000B', @now, N'IN_APP', NULL, @now, @mentor2Id, '06190000-EEEE-4EEE-8EEE-000000000004'),
    ('061A0000-EEEE-4EEE-8EEE-00000000000C', @now, N'IN_APP', NULL, @now, @coordId, '06190000-EEEE-4EEE-8EEE-000000000004'),
    ('061A0000-EEEE-4EEE-8EEE-00000000000D', @now, N'IN_APP', NULL, @now, '06010000-EEEE-4EEE-8EEE-00000000000D', '06190000-EEEE-4EEE-8EEE-000000000005'),
    ('061A0000-EEEE-4EEE-8EEE-00000000000E', @now, N'IN_APP', NULL, @now, @mentor2Id, '06190000-EEEE-4EEE-8EEE-000000000005'),
    ('061A0000-EEEE-4EEE-8EEE-00000000000F', @now, N'IN_APP', NULL, @now, @coordId, '06190000-EEEE-4EEE-8EEE-000000000005'),
    ('061A0000-EEEE-4EEE-8EEE-000000000010', @now, N'IN_APP', NULL, @now, '06010000-EEEE-4EEE-8EEE-000000000010', '06190000-EEEE-4EEE-8EEE-000000000006'),
    ('061A0000-EEEE-4EEE-8EEE-000000000011', @now, N'IN_APP', NULL, @now, @mentor2Id, '06190000-EEEE-4EEE-8EEE-000000000006'),
    ('061A0000-EEEE-4EEE-8EEE-000000000012', @now, N'IN_APP', NULL, @now, @coordId, '06190000-EEEE-4EEE-8EEE-000000000006'),
    ('061A0000-EEEE-4EEE-8EEE-000000000013', @now, N'IN_APP', NULL, @now, '06010000-EEEE-4EEE-8EEE-000000000013', '06190000-EEEE-4EEE-8EEE-000000000007'),
    ('061A0000-EEEE-4EEE-8EEE-000000000014', @now, N'IN_APP', NULL, @now, @mentor3Id, '06190000-EEEE-4EEE-8EEE-000000000007'),
    ('061A0000-EEEE-4EEE-8EEE-000000000015', @now, N'IN_APP', NULL, @now, @coordId, '06190000-EEEE-4EEE-8EEE-000000000007'),
    ('061A0000-EEEE-4EEE-8EEE-000000000016', @now, N'IN_APP', NULL, @now, '06010000-EEEE-4EEE-8EEE-000000000016', '06190000-EEEE-4EEE-8EEE-000000000008'),
    ('061A0000-EEEE-4EEE-8EEE-000000000017', @now, N'IN_APP', NULL, @now, @mentor3Id, '06190000-EEEE-4EEE-8EEE-000000000008'),
    ('061A0000-EEEE-4EEE-8EEE-000000000018', @now, N'IN_APP', NULL, @now, @coordId, '06190000-EEEE-4EEE-8EEE-000000000008'),
    ('061A0000-EEEE-4EEE-8EEE-000000000019', @now, N'IN_APP', NULL, @now, '06010000-EEEE-4EEE-8EEE-000000000019', '06190000-EEEE-4EEE-8EEE-000000000009'),
    ('061A0000-EEEE-4EEE-8EEE-00000000001A', @now, N'IN_APP', NULL, @now, @mentor3Id, '06190000-EEEE-4EEE-8EEE-000000000009'),
    ('061A0000-EEEE-4EEE-8EEE-00000000001B', @now, N'IN_APP', NULL, @now, @coordId, '06190000-EEEE-4EEE-8EEE-000000000009');

-- ============================================================
-- === SEAL Hackathon Alumni Showcase 2026 - Agentic RAG Replay ===
-- QA phase: COMPLETED - ready for participant feedback (no feedback rows)
-- Login: nguyen.hoang.minh@fpt.edu.vn (confirmed team member) / Demo@123456
-- View: /student/feedback
-- ============================================================

DECLARE @e7_compDay DATE = '2026-06-20';
DECLARE @e7_endDay DATE = '2026-06-20';
DECLARE @e7_compDt DATETIME2 = CAST(@e7_compDay AS DATETIME2);
DECLARE @e7_regOpen DATE = '2026-03-01';
DECLARE @e7_regDeadline DATE = '2026-05-31';
DECLARE @e7_prelimStart DATETIME2 = DATEADD(HOUR, 7, @e7_compDt);
DECLARE @e7_prelimSub DATETIME2 = DATEADD(HOUR, 14, @e7_compDt);
DECLARE @e7_prelimScore DATETIME2 = DATEADD(MINUTE, 15*60+30, @e7_compDt);
DECLARE @e7_finalStart DATETIME2 = DATEADD(MINUTE, 15*60+30, @e7_compDt);
DECLARE @e7_finalSub DATETIME2 = DATEADD(MINUTE, 15*60+30, @e7_compDt);
DECLARE @e7_finalScore DATETIME2 = DATEADD(HOUR, 17, @e7_compDt);
DECLARE @e7_finalEnd DATETIME2 = DATEADD(HOUR, 17, @e7_compDt);

INSERT INTO hackathon_events (
    id, name, season, year, start_date, end_date,
    registration_open_date, registration_deadline,
    description, location, format, competition_format,
    min_team, max_team, semester_min, semester_max,
    scoring_template_id, status, leaderboard_public,
    owner_user_id, created_by, created_at, updated_at
) VALUES (
    '07020000-EEEE-4EEE-8EEE-000000000001',
    N'SEAL Hackathon Alumni Showcase 2026 - Agentic RAG Replay',
    N'Summer', 2026,
    @e7_compDay, @e7_endDay,
    @e7_regOpen, @e7_regDeadline,
    N'SEAL Hackathon Summer 2026 focuses on Agentic RAG systems: grounded retrieval, multi-step agent orchestration, and enterprise-ready copilots built by FPT University teams.',
    N'FPT University HCM', 'OFFLINE', 'SEAL_RAG_2026',
    3, 5, 4, 8,
    @templateId, 'COMPLETED', 1,
    @coordId, N'tran.thanh.ha@fpt.edu.vn', @now, @now
);

INSERT INTO tracks (id, event_id, name, description, max_teams, status, created_at, updated_at) VALUES
    ('07040000-EEEE-4EEE-8EEE-000000000001', '07020000-EEEE-4EEE-8EEE-000000000001', N'Grounded Retrieval', N'SEAL track: Grounded Retrieval', 8, 'OPEN', @now, @now),
    ('07040000-EEEE-4EEE-8EEE-000000000002', '07020000-EEEE-4EEE-8EEE-000000000001', N'Agent Orchestration', N'SEAL track: Agent Orchestration', 8, 'OPEN', @now, @now),
    ('07040000-EEEE-4EEE-8EEE-000000000003', '07020000-EEEE-4EEE-8EEE-000000000001', N'Enterprise Copilot', N'SEAL track: Enterprise Copilot', 8, 'OPEN', @now, @now);

INSERT INTO rounds (
    id, event_id, round_number, name, round_type,
    start_date, end_date, slide_deadline, submission_deadline, scoring_deadline,
    advancement_cutoff, advancement_rule, round_weight, created_at, updated_at
) VALUES
    ('07030000-EEEE-4EEE-8EEE-000000000001', '07020000-EEEE-4EEE-8EEE-000000000001', 1, N'Preliminary Round', 'PRELIMINARY',
     @e7_prelimStart, @e7_prelimScore, DATEADD(HOUR, -4, @e7_prelimSub),
     @e7_prelimSub, @e7_prelimScore,
     2, 'PER_TRACK_TOP_N', 40, @now, @now),
    ('07030000-EEEE-4EEE-8EEE-000000000002', '07020000-EEEE-4EEE-8EEE-000000000001', 2, N'Finals', 'FINAL',
     @e7_finalStart, @e7_finalEnd, NULL,
     @e7_finalSub, @e7_finalScore,
     6, 'FINALIST_POOL', 60, @now, @now);

INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at) VALUES
    ('07060000-EEEE-4EEE-8EEE-000000000001', '07030000-EEEE-4EEE-8EEE-000000000001', N'Accuracy and Domain Relevance', N'Accuracy and Domain Relevance', 30, 0, 1, 5, @now, @now),
    ('07060000-EEEE-4EEE-8EEE-000000000002', '07030000-EEEE-4EEE-8EEE-000000000001', N'Agentic RAG Architecture & Algorithm', N'Agentic RAG Architecture & Algorithm', 30, 1, 1, 5, @now, @now),
    ('07060000-EEEE-4EEE-8EEE-000000000003', '07030000-EEEE-4EEE-8EEE-000000000001', N'Ideas & Presentation', N'Ideas & Presentation', 15, 2, 1, 5, @now, @now),
    ('07060000-EEEE-4EEE-8EEE-000000000004', '07030000-EEEE-4EEE-8EEE-000000000001', N'Feasibility & Creativity', N'Feasibility & Creativity', 15, 3, 1, 5, @now, @now),
    ('07060000-EEEE-4EEE-8EEE-000000000005', '07030000-EEEE-4EEE-8EEE-000000000001', N'User Experience & Interactive Interface', N'User Experience & Interactive Interface', 10, 4, 1, 5, @now, @now),
    ('07060000-EEEE-4EEE-8EEE-00000000000B', '07030000-EEEE-4EEE-8EEE-000000000002', N'Data Processing & Retrieval Quality', N'Data Processing & Retrieval Quality', 30, 0, 1, 5, @now, @now),
    ('07060000-EEEE-4EEE-8EEE-00000000000C', '07030000-EEEE-4EEE-8EEE-000000000002', N'Reliability & Hallucination Resistance', N'Reliability & Hallucination Resistance', 20, 1, 1, 5, @now, @now),
    ('07060000-EEEE-4EEE-8EEE-00000000000D', '07030000-EEEE-4EEE-8EEE-000000000002', N'Agent Reasoning & Multi-hop Processing', N'Agent Reasoning & Multi-hop Processing', 20, 2, 1, 5, @now, @now),
    ('07060000-EEEE-4EEE-8EEE-00000000000E', '07030000-EEEE-4EEE-8EEE-000000000002', N'Practicality & Operational Optimization', N'Practicality & Operational Optimization', 20, 3, 1, 5, @now, @now),
    ('07060000-EEEE-4EEE-8EEE-00000000000F', '07030000-EEEE-4EEE-8EEE-000000000002', N'Scalability & Innovation', N'Scalability & Innovation', 10, 4, 1, 5, @now, @now);

INSERT INTO prizes (id, event_id, rank, value, quantity, label, created_at, updated_at) VALUES
    ('07070000-EEEE-4EEE-8EEE-000000000001', '07020000-EEEE-4EEE-8EEE-000000000001', 'FIRST', '7000000', 1, N'First Prize', @now, @now),
    ('07070000-EEEE-4EEE-8EEE-000000000002', '07020000-EEEE-4EEE-8EEE-000000000001', 'SECOND', '5000000', 1, N'Second Prize', @now, @now),
    ('07070000-EEEE-4EEE-8EEE-000000000003', '07020000-EEEE-4EEE-8EEE-000000000001', 'THIRD', '3000000', 1, N'Third Prize', @now, @now),
    ('07070000-EEEE-4EEE-8EEE-000000000004', '07020000-EEEE-4EEE-8EEE-000000000001', 'CONSOLATION', '1500000', 1, N'Consolation Prize', @now, @now);

INSERT INTO event_schedules (id, event_id, type, title, description, start_time, end_time, gate, sort_order, created_at, updated_at) VALUES
    ('07080000-EEEE-4EEE-8EEE-000000000001', '07020000-EEEE-4EEE-8EEE-000000000001', 'WORKSHOP', N'Workshop', NULL, DATEADD(DAY, -3, @e7_compDt), DATEADD(HOUR, 3, DATEADD(DAY, -3, @e7_compDt)), NULL, 0, @now, @now),
    ('07080000-EEEE-4EEE-8EEE-000000000002', '07020000-EEEE-4EEE-8EEE-000000000001', 'OPENING', N'Opening & track draw', N'Teams pick tracks in turn; organizers draw topics per track', DATEADD(DAY, -1, @e7_compDt), DATEADD(HOUR, 3, DATEADD(DAY, -1, @e7_compDt)), NULL, 1, @now, @now),
    ('07080000-EEEE-4EEE-8EEE-000000000003', '07020000-EEEE-4EEE-8EEE-000000000001', 'TRACK_DRAW', N'Track selection draw', NULL, DATEADD(DAY, -1, @e7_compDt), DATEADD(HOUR, 2, DATEADD(DAY, -1, @e7_compDt)), NULL, 2, @now, @now),
    ('07080000-EEEE-4EEE-8EEE-000000000004', '07020000-EEEE-4EEE-8EEE-000000000001', 'MILESTONE', N'Milestone 1 - Idea & architecture completion', N'Design Agentic RAG architecture', @e7_prelimStart, DATEADD(HOUR, 3, @e7_prelimStart), 'SLIDE_SUBMISSION', 3, @now, @now),
    ('07080000-EEEE-4EEE-8EEE-000000000005', '07020000-EEEE-4EEE-8EEE-000000000001', 'MILESTONE', N'Milestone 2 - Pitching & product completion', N'Parallel pitching and coding', DATEADD(HOUR, 3, @e7_prelimStart), @e7_prelimSub, 'DEMO_SUBMISSION', 4, @now, @now),
    ('07080000-EEEE-4EEE-8EEE-000000000006', '07020000-EEEE-4EEE-8EEE-000000000001', 'SCORING', N'Preliminary scoring', N'5-minute presentation + 3-minute Q&A', @e7_prelimSub, @e7_prelimScore, NULL, 5, @now, @now),
    ('07080000-EEEE-4EEE-8EEE-000000000007', '07020000-EEEE-4EEE-8EEE-000000000001', 'FINAL', N'Finals', N'7-minute presentation + 3-minute Q&A - Top 6 teams', @e7_finalStart, @e7_finalEnd, NULL, 6, @now, @now),
    ('07080000-EEEE-4EEE-8EEE-000000000008', '07020000-EEEE-4EEE-8EEE-000000000001', 'CEREMONY', N'Awards & closing ceremony', NULL, @e7_finalEnd, DATEADD(HOUR, 1, @e7_finalEnd), NULL, 7, @now, @now);

INSERT INTO allowed_email_domains (id, event_id, domain, university_label, created_at, updated_at) VALUES
    ('07090000-EEEE-4EEE-8EEE-000000000001', '07020000-EEEE-4EEE-8EEE-000000000001', 'fpt.edu.vn', N'FPT University', @now, @now),
    ('07090000-EEEE-4EEE-8EEE-000000000002', '07020000-EEEE-4EEE-8EEE-000000000001', 'fe.edu.vn', N'FPT Education', @now, @now),
    ('07090000-EEEE-4EEE-8EEE-000000000003', '07020000-EEEE-4EEE-8EEE-000000000001', 'hcmut.edu.vn', N'Ho Chi Minh City University of Technology', @now, @now),
    ('07090000-EEEE-4EEE-8EEE-000000000004', '07020000-EEEE-4EEE-8EEE-000000000001', 'hcmus.edu.vn', N'Vietnam National University Ho Chi Minh City - University of Science', @now, @now),
    ('07090000-EEEE-4EEE-8EEE-000000000005', '07020000-EEEE-4EEE-8EEE-000000000001', 'student.hcmus.edu.vn', N'Vietnam National University Ho Chi Minh City - University of Science', @now, @now),
    ('07090000-EEEE-4EEE-8EEE-000000000006', '07020000-EEEE-4EEE-8EEE-000000000001', 'uit.edu.vn', N'University of Information Technology', @now, @now),
    ('07090000-EEEE-4EEE-8EEE-000000000007', '07020000-EEEE-4EEE-8EEE-000000000001', 'hcmute.edu.vn', N'Ho Chi Minh City University of Education and Technology', @now, @now),
    ('07090000-EEEE-4EEE-8EEE-000000000008', '07020000-EEEE-4EEE-8EEE-000000000001', 'ueh.edu.vn', N'University of Economics Ho Chi Minh City', @now, @now),
    ('07090000-EEEE-4EEE-8EEE-000000000009', '07020000-EEEE-4EEE-8EEE-000000000001', 'student.ueh.edu.vn', N'University of Economics Ho Chi Minh City', @now, @now),
    ('07090000-EEEE-4EEE-8EEE-00000000000A', '07020000-EEEE-4EEE-8EEE-000000000001', 'student.iuh.edu.vn', N'Industrial University of Ho Chi Minh City', @now, @now);

INSERT INTO event_enrollments (id, created_at, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public) VALUES
    ('070A0000-EEEE-4EEE-8EEE-000000000001', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000001', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-000000000002', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000002', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-000000000003', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000003', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-000000000004', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000004', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-000000000005', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000005', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-000000000006', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000006', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-000000000007', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000007', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-000000000008', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000008', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-000000000009', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000009', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000000A', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-00000000000B', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000000B', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-00000000000C', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000000C', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-00000000000D', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000000D', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-00000000000E', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000000E', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-00000000000F', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000000F', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-000000000010', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000010', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-000000000011', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000011', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-000000000012', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000012', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-000000000013', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000013', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-000000000014', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000014', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-000000000015', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000015', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-000000000016', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000016', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-000000000017', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000017', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-000000000018', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000018', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-000000000019', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-000000000019', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-00000000001A', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000001A', 0, 0),
    ('070A0000-EEEE-4EEE-8EEE-00000000001B', @now, @now, '07020000-EEEE-4EEE-8EEE-000000000001', 'APPROVED', '01010000-EEEE-4EEE-8EEE-00000000001B', 0, 0);

INSERT INTO teams (id, created_at, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, is_recruiting, recruitment_note, version) VALUES
    ('07050000-EEEE-4EEE-8EEE-000000000001', @now, '07020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000001', N'AlumniRAG', 'CONFIRMED', '07040000-EEEE-4EEE-8EEE-000000000001', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Grounded Retrieval track.', 0),
    ('07050000-EEEE-4EEE-8EEE-000000000002', @now, '07020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000004', N'ReplayAgent', 'CONFIRMED', '07040000-EEEE-4EEE-8EEE-000000000001', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Grounded Retrieval track.', 0),
    ('07050000-EEEE-4EEE-8EEE-000000000003', @now, '07020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000007', N'Showcase Lab', 'CONFIRMED', '07040000-EEEE-4EEE-8EEE-000000000001', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Grounded Retrieval track.', 0),
    ('07050000-EEEE-4EEE-8EEE-000000000004', @now, '07020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-00000000000A', N'LegacyRetrieve', 'CONFIRMED', '07040000-EEEE-4EEE-8EEE-000000000002', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Agent Orchestration track.', 0),
    ('07050000-EEEE-4EEE-8EEE-000000000005', @now, '07020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-00000000000D', N'EchoPilot', 'CONFIRMED', '07040000-EEEE-4EEE-8EEE-000000000002', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Agent Orchestration track.', 0),
    ('07050000-EEEE-4EEE-8EEE-000000000006', @now, '07020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000010', N'ArchiveHop', 'CONFIRMED', '07040000-EEEE-4EEE-8EEE-000000000002', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Agent Orchestration track.', 0),
    ('07050000-EEEE-4EEE-8EEE-000000000007', @now, '07020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000013', N'MemoryForge', 'CONFIRMED', '07040000-EEEE-4EEE-8EEE-000000000003', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Enterprise Copilot track.', 0),
    ('07050000-EEEE-4EEE-8EEE-000000000008', @now, '07020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000016', N'ReunionBot', 'CONFIRMED', '07040000-EEEE-4EEE-8EEE-000000000003', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Enterprise Copilot track.', 0),
    ('07050000-EEEE-4EEE-8EEE-000000000009', @now, '07020000-EEEE-4EEE-8EEE-000000000001', '01010000-EEEE-4EEE-8EEE-000000000019', N'GoldClass RAG', 'CONFIRMED', '07040000-EEEE-4EEE-8EEE-000000000003', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the Enterprise Copilot track.', 0);

INSERT INTO team_members (id, created_at, joined_at, role, user_id, team_id, event_id) VALUES
    ('070B0000-EEEE-4EEE-8EEE-000000000001', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000001', '07050000-EEEE-4EEE-8EEE-000000000001', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-000000000002', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000002', '07050000-EEEE-4EEE-8EEE-000000000001', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-000000000003', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000003', '07050000-EEEE-4EEE-8EEE-000000000001', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-000000000004', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000004', '07050000-EEEE-4EEE-8EEE-000000000002', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-000000000005', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000005', '07050000-EEEE-4EEE-8EEE-000000000002', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-000000000006', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000006', '07050000-EEEE-4EEE-8EEE-000000000002', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-000000000007', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000007', '07050000-EEEE-4EEE-8EEE-000000000003', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-000000000008', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000008', '07050000-EEEE-4EEE-8EEE-000000000003', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-000000000009', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000009', '07050000-EEEE-4EEE-8EEE-000000000003', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-00000000000A', '07050000-EEEE-4EEE-8EEE-000000000004', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-00000000000B', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-00000000000B', '07050000-EEEE-4EEE-8EEE-000000000004', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-00000000000C', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-00000000000C', '07050000-EEEE-4EEE-8EEE-000000000004', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-00000000000D', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-00000000000D', '07050000-EEEE-4EEE-8EEE-000000000005', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-00000000000E', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-00000000000E', '07050000-EEEE-4EEE-8EEE-000000000005', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-00000000000F', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-00000000000F', '07050000-EEEE-4EEE-8EEE-000000000005', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-000000000010', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000010', '07050000-EEEE-4EEE-8EEE-000000000006', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-000000000011', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000011', '07050000-EEEE-4EEE-8EEE-000000000006', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-000000000012', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000012', '07050000-EEEE-4EEE-8EEE-000000000006', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-000000000013', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000013', '07050000-EEEE-4EEE-8EEE-000000000007', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-000000000014', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000014', '07050000-EEEE-4EEE-8EEE-000000000007', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-000000000015', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000015', '07050000-EEEE-4EEE-8EEE-000000000007', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-000000000016', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000016', '07050000-EEEE-4EEE-8EEE-000000000008', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-000000000017', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000017', '07050000-EEEE-4EEE-8EEE-000000000008', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-000000000018', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-000000000018', '07050000-EEEE-4EEE-8EEE-000000000008', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-000000000019', @now, @now, 'LEADER', '01010000-EEEE-4EEE-8EEE-000000000019', '07050000-EEEE-4EEE-8EEE-000000000009', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-00000000001A', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-00000000001A', '07050000-EEEE-4EEE-8EEE-000000000009', '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070B0000-EEEE-4EEE-8EEE-00000000001B', @now, @now, 'MEMBER', '01010000-EEEE-4EEE-8EEE-00000000001B', '07050000-EEEE-4EEE-8EEE-000000000009', '07020000-EEEE-4EEE-8EEE-000000000001');

INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id) VALUES
    ('070C0000-EEEE-4EEE-8EEE-000000000001', @now, @now, @judge1Id, '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070C0000-EEEE-4EEE-8EEE-000000000002', @now, @now, @judge2Id, '07020000-EEEE-4EEE-8EEE-000000000001'),
    ('070C0000-EEEE-4EEE-8EEE-000000000008', @now, @now, @judge3Id, '07020000-EEEE-4EEE-8EEE-000000000001');
INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active) VALUES
    ('070C0000-EEEE-4EEE-8EEE-000000000003', @now, @now, @judge1Id, '07030000-EEEE-4EEE-8EEE-000000000001', 'ROUND', 1),
    ('070C0000-EEEE-4EEE-8EEE-000000000004', @now, @now, @judge2Id, '07030000-EEEE-4EEE-8EEE-000000000001', 'ROUND', 1),
    ('070C0000-EEEE-4EEE-8EEE-000000000009', @now, @now, @judge3Id, '07030000-EEEE-4EEE-8EEE-000000000001', 'ROUND', 1),
    ('070C0000-EEEE-4EEE-8EEE-000000000005', @now, @now, @judge1Id, '07030000-EEEE-4EEE-8EEE-000000000002', 'ROUND', 1),
    ('070C0000-EEEE-4EEE-8EEE-000000000006', @now, @now, @judge2Id, '07030000-EEEE-4EEE-8EEE-000000000002', 'ROUND', 1),
    ('070C0000-EEEE-4EEE-8EEE-00000000000A', @now, @now, @judge3Id, '07030000-EEEE-4EEE-8EEE-000000000002', 'ROUND', 1);
INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at) VALUES
    ('070C0000-EEEE-4EEE-8EEE-000000000007', '07020000-EEEE-4EEE-8EEE-000000000001', @mentor1Id, @now, @now),
    ('070C0000-EEEE-4EEE-8EEE-00000000000B', '07020000-EEEE-4EEE-8EEE-000000000001', @mentor2Id, @now, @now),
    ('070C0000-EEEE-4EEE-8EEE-00000000000C', '07020000-EEEE-4EEE-8EEE-000000000001', @mentor3Id, @now, @now);

INSERT INTO mentor_assignments (id, created_at, assigned_at, mentor_user_id, event_id, track_id) VALUES
    ('07160000-EEEE-4EEE-8EEE-000000000001', @now, @now, @mentor1Id, '07020000-EEEE-4EEE-8EEE-000000000001', '07040000-EEEE-4EEE-8EEE-000000000001'),
    ('07160000-EEEE-4EEE-8EEE-000000000002', @now, @now, @mentor2Id, '07020000-EEEE-4EEE-8EEE-000000000001', '07040000-EEEE-4EEE-8EEE-000000000002'),
    ('07160000-EEEE-4EEE-8EEE-000000000003', @now, @now, @mentor3Id, '07020000-EEEE-4EEE-8EEE-000000000001', '07040000-EEEE-4EEE-8EEE-000000000003');

INSERT INTO mentor_teams (id, created_at, assigned_at, mentor_user_id, team_id) VALUES
    ('07170000-EEEE-4EEE-8EEE-000000000001', @now, @now, @mentor1Id, '07050000-EEEE-4EEE-8EEE-000000000001'),
    ('07170000-EEEE-4EEE-8EEE-000000000002', @now, @now, @mentor1Id, '07050000-EEEE-4EEE-8EEE-000000000002'),
    ('07170000-EEEE-4EEE-8EEE-000000000003', @now, @now, @mentor1Id, '07050000-EEEE-4EEE-8EEE-000000000003'),
    ('07170000-EEEE-4EEE-8EEE-000000000004', @now, @now, @mentor2Id, '07050000-EEEE-4EEE-8EEE-000000000004'),
    ('07170000-EEEE-4EEE-8EEE-000000000005', @now, @now, @mentor2Id, '07050000-EEEE-4EEE-8EEE-000000000005'),
    ('07170000-EEEE-4EEE-8EEE-000000000006', @now, @now, @mentor2Id, '07050000-EEEE-4EEE-8EEE-000000000006'),
    ('07170000-EEEE-4EEE-8EEE-000000000007', @now, @now, @mentor3Id, '07050000-EEEE-4EEE-8EEE-000000000007'),
    ('07170000-EEEE-4EEE-8EEE-000000000008', @now, @now, @mentor3Id, '07050000-EEEE-4EEE-8EEE-000000000008'),
    ('07170000-EEEE-4EEE-8EEE-000000000009', @now, @now, @mentor3Id, '07050000-EEEE-4EEE-8EEE-000000000009');

INSERT INTO mentor_invitations (id, created_at, team_id, mentor_user_id, inviter_id, status, message) VALUES
    ('07180000-EEEE-4EEE-8EEE-000000000001', @now, '07050000-EEEE-4EEE-8EEE-000000000001', @mentor1Id, '01010000-EEEE-4EEE-8EEE-000000000001', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('07180000-EEEE-4EEE-8EEE-000000000002', @now, '07050000-EEEE-4EEE-8EEE-000000000002', @mentor1Id, '01010000-EEEE-4EEE-8EEE-000000000004', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('07180000-EEEE-4EEE-8EEE-000000000003', @now, '07050000-EEEE-4EEE-8EEE-000000000003', @mentor1Id, '01010000-EEEE-4EEE-8EEE-000000000007', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('07180000-EEEE-4EEE-8EEE-000000000004', @now, '07050000-EEEE-4EEE-8EEE-000000000004', @mentor2Id, '01010000-EEEE-4EEE-8EEE-00000000000A', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('07180000-EEEE-4EEE-8EEE-000000000005', @now, '07050000-EEEE-4EEE-8EEE-000000000005', @mentor2Id, '01010000-EEEE-4EEE-8EEE-00000000000D', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('07180000-EEEE-4EEE-8EEE-000000000006', @now, '07050000-EEEE-4EEE-8EEE-000000000006', @mentor2Id, '01010000-EEEE-4EEE-8EEE-000000000010', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('07180000-EEEE-4EEE-8EEE-000000000007', @now, '07050000-EEEE-4EEE-8EEE-000000000007', @mentor3Id, '01010000-EEEE-4EEE-8EEE-000000000013', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('07180000-EEEE-4EEE-8EEE-000000000008', @now, '07050000-EEEE-4EEE-8EEE-000000000008', @mentor3Id, '01010000-EEEE-4EEE-8EEE-000000000016', 'ACCEPTED', N'Seeded mentor assignment for QA'),
    ('07180000-EEEE-4EEE-8EEE-000000000009', @now, '07050000-EEEE-4EEE-8EEE-000000000009', @mentor3Id, '01010000-EEEE-4EEE-8EEE-000000000019', 'ACCEPTED', N'Seeded mentor assignment for QA');

INSERT INTO submissions (id, created_at, current_version_id, round_id, status, submitted_by, team_id, opt_lock) VALUES
    ('070D0000-EEEE-4EEE-8EEE-000000000001', @now, NULL, '07030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000001', '07050000-EEEE-4EEE-8EEE-000000000001', 0),
    ('070D0000-EEEE-4EEE-8EEE-000000000002', @now, NULL, '07030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000004', '07050000-EEEE-4EEE-8EEE-000000000002', 0),
    ('070D0000-EEEE-4EEE-8EEE-000000000003', @now, NULL, '07030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000007', '07050000-EEEE-4EEE-8EEE-000000000003', 0),
    ('070D0000-EEEE-4EEE-8EEE-000000000004', @now, NULL, '07030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-00000000000A', '07050000-EEEE-4EEE-8EEE-000000000004', 0),
    ('070D0000-EEEE-4EEE-8EEE-000000000005', @now, NULL, '07030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-00000000000D', '07050000-EEEE-4EEE-8EEE-000000000005', 0),
    ('070D0000-EEEE-4EEE-8EEE-000000000006', @now, NULL, '07030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000010', '07050000-EEEE-4EEE-8EEE-000000000006', 0),
    ('070D0000-EEEE-4EEE-8EEE-000000000007', @now, NULL, '07030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000013', '07050000-EEEE-4EEE-8EEE-000000000007', 0),
    ('070D0000-EEEE-4EEE-8EEE-000000000008', @now, NULL, '07030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000016', '07050000-EEEE-4EEE-8EEE-000000000008', 0),
    ('070D0000-EEEE-4EEE-8EEE-000000000009', @now, NULL, '07030000-EEEE-4EEE-8EEE-000000000001', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000019', '07050000-EEEE-4EEE-8EEE-000000000009', 0),
    ('070D0000-EEEE-4EEE-8EEE-00000000000A', @now, NULL, '07030000-EEEE-4EEE-8EEE-000000000002', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000001', '07050000-EEEE-4EEE-8EEE-000000000001', 0),
    ('070D0000-EEEE-4EEE-8EEE-00000000000B', @now, NULL, '07030000-EEEE-4EEE-8EEE-000000000002', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000004', '07050000-EEEE-4EEE-8EEE-000000000002', 0),
    ('070D0000-EEEE-4EEE-8EEE-00000000000C', @now, NULL, '07030000-EEEE-4EEE-8EEE-000000000002', 'SCORED', '01010000-EEEE-4EEE-8EEE-00000000000A', '07050000-EEEE-4EEE-8EEE-000000000004', 0),
    ('070D0000-EEEE-4EEE-8EEE-00000000000D', @now, NULL, '07030000-EEEE-4EEE-8EEE-000000000002', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000010', '07050000-EEEE-4EEE-8EEE-000000000006', 0),
    ('070D0000-EEEE-4EEE-8EEE-00000000000E', @now, NULL, '07030000-EEEE-4EEE-8EEE-000000000002', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000016', '07050000-EEEE-4EEE-8EEE-000000000008', 0),
    ('070D0000-EEEE-4EEE-8EEE-00000000000F', @now, NULL, '07030000-EEEE-4EEE-8EEE-000000000002', 'SCORED', '01010000-EEEE-4EEE-8EEE-000000000013', '07050000-EEEE-4EEE-8EEE-000000000007', 0);

INSERT INTO submission_versions (id, created_at, demo_url, github_url, slide_url, submitted_at, version_number, submission_id) VALUES
    ('070E0000-EEEE-4EEE-8EEE-000000000001', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/alumnirag', N'https://docs.google.com/presentation/d/seal-7-0', DATEADD(MINUTE, -30, @e7_prelimSub), 1, '070D0000-EEEE-4EEE-8EEE-000000000001'),
    ('070E0000-EEEE-4EEE-8EEE-000000000002', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/replayagent', N'https://docs.google.com/presentation/d/seal-7-1', DATEADD(MINUTE, -31, @e7_prelimSub), 1, '070D0000-EEEE-4EEE-8EEE-000000000002'),
    ('070E0000-EEEE-4EEE-8EEE-000000000003', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/showcase-lab', N'https://docs.google.com/presentation/d/seal-7-2', DATEADD(MINUTE, -32, @e7_prelimSub), 1, '070D0000-EEEE-4EEE-8EEE-000000000003'),
    ('070E0000-EEEE-4EEE-8EEE-000000000004', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/legacyretrieve', N'https://docs.google.com/presentation/d/seal-7-3', DATEADD(MINUTE, -33, @e7_prelimSub), 1, '070D0000-EEEE-4EEE-8EEE-000000000004'),
    ('070E0000-EEEE-4EEE-8EEE-000000000005', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/echopilot', N'https://docs.google.com/presentation/d/seal-7-4', DATEADD(MINUTE, -34, @e7_prelimSub), 1, '070D0000-EEEE-4EEE-8EEE-000000000005'),
    ('070E0000-EEEE-4EEE-8EEE-000000000006', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/archivehop', N'https://docs.google.com/presentation/d/seal-7-5', DATEADD(MINUTE, -35, @e7_prelimSub), 1, '070D0000-EEEE-4EEE-8EEE-000000000006'),
    ('070E0000-EEEE-4EEE-8EEE-000000000007', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/memoryforge', N'https://docs.google.com/presentation/d/seal-7-6', DATEADD(MINUTE, -36, @e7_prelimSub), 1, '070D0000-EEEE-4EEE-8EEE-000000000007'),
    ('070E0000-EEEE-4EEE-8EEE-000000000008', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/reunionbot', N'https://docs.google.com/presentation/d/seal-7-7', DATEADD(MINUTE, -37, @e7_prelimSub), 1, '070D0000-EEEE-4EEE-8EEE-000000000008'),
    ('070E0000-EEEE-4EEE-8EEE-000000000009', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/goldclass-rag', N'https://docs.google.com/presentation/d/seal-7-8', DATEADD(MINUTE, -38, @e7_prelimSub), 1, '070D0000-EEEE-4EEE-8EEE-000000000009'),
    ('070E0000-EEEE-4EEE-8EEE-00000000000A', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/alumnirag', N'https://docs.google.com/presentation/d/seal-7-9', DATEADD(MINUTE, -39, @e7_prelimSub), 1, '070D0000-EEEE-4EEE-8EEE-00000000000A'),
    ('070E0000-EEEE-4EEE-8EEE-00000000000B', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/replayagent', N'https://docs.google.com/presentation/d/seal-7-10', DATEADD(MINUTE, -40, @e7_prelimSub), 1, '070D0000-EEEE-4EEE-8EEE-00000000000B'),
    ('070E0000-EEEE-4EEE-8EEE-00000000000C', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/legacyretrieve', N'https://docs.google.com/presentation/d/seal-7-11', DATEADD(MINUTE, -41, @e7_prelimSub), 1, '070D0000-EEEE-4EEE-8EEE-00000000000C'),
    ('070E0000-EEEE-4EEE-8EEE-00000000000D', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/archivehop', N'https://docs.google.com/presentation/d/seal-7-12', DATEADD(MINUTE, -42, @e7_prelimSub), 1, '070D0000-EEEE-4EEE-8EEE-00000000000D'),
    ('070E0000-EEEE-4EEE-8EEE-00000000000E', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/reunionbot', N'https://docs.google.com/presentation/d/seal-7-13', DATEADD(MINUTE, -43, @e7_prelimSub), 1, '070D0000-EEEE-4EEE-8EEE-00000000000E'),
    ('070E0000-EEEE-4EEE-8EEE-00000000000F', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/memoryforge', N'https://docs.google.com/presentation/d/seal-7-14', DATEADD(MINUTE, -44, @e7_prelimSub), 1, '070D0000-EEEE-4EEE-8EEE-00000000000F');

UPDATE submissions SET current_version_id = '070E0000-EEEE-4EEE-8EEE-000000000001' WHERE id = '070D0000-EEEE-4EEE-8EEE-000000000001';
UPDATE submissions SET current_version_id = '070E0000-EEEE-4EEE-8EEE-000000000002' WHERE id = '070D0000-EEEE-4EEE-8EEE-000000000002';
UPDATE submissions SET current_version_id = '070E0000-EEEE-4EEE-8EEE-000000000003' WHERE id = '070D0000-EEEE-4EEE-8EEE-000000000003';
UPDATE submissions SET current_version_id = '070E0000-EEEE-4EEE-8EEE-000000000004' WHERE id = '070D0000-EEEE-4EEE-8EEE-000000000004';
UPDATE submissions SET current_version_id = '070E0000-EEEE-4EEE-8EEE-000000000005' WHERE id = '070D0000-EEEE-4EEE-8EEE-000000000005';
UPDATE submissions SET current_version_id = '070E0000-EEEE-4EEE-8EEE-000000000006' WHERE id = '070D0000-EEEE-4EEE-8EEE-000000000006';
UPDATE submissions SET current_version_id = '070E0000-EEEE-4EEE-8EEE-000000000007' WHERE id = '070D0000-EEEE-4EEE-8EEE-000000000007';
UPDATE submissions SET current_version_id = '070E0000-EEEE-4EEE-8EEE-000000000008' WHERE id = '070D0000-EEEE-4EEE-8EEE-000000000008';
UPDATE submissions SET current_version_id = '070E0000-EEEE-4EEE-8EEE-000000000009' WHERE id = '070D0000-EEEE-4EEE-8EEE-000000000009';
UPDATE submissions SET current_version_id = '070E0000-EEEE-4EEE-8EEE-00000000000A' WHERE id = '070D0000-EEEE-4EEE-8EEE-00000000000A';
UPDATE submissions SET current_version_id = '070E0000-EEEE-4EEE-8EEE-00000000000B' WHERE id = '070D0000-EEEE-4EEE-8EEE-00000000000B';
UPDATE submissions SET current_version_id = '070E0000-EEEE-4EEE-8EEE-00000000000C' WHERE id = '070D0000-EEEE-4EEE-8EEE-00000000000C';
UPDATE submissions SET current_version_id = '070E0000-EEEE-4EEE-8EEE-00000000000D' WHERE id = '070D0000-EEEE-4EEE-8EEE-00000000000D';
UPDATE submissions SET current_version_id = '070E0000-EEEE-4EEE-8EEE-00000000000E' WHERE id = '070D0000-EEEE-4EEE-8EEE-00000000000E';
UPDATE submissions SET current_version_id = '070E0000-EEEE-4EEE-8EEE-00000000000F' WHERE id = '070D0000-EEEE-4EEE-8EEE-00000000000F';

INSERT INTO judge_scores (id, created_at, completed_at, judge_user_id, round_id, started_at, status, submission_id, version) VALUES
    ('070F0000-EEEE-4EEE-8EEE-000000000001', @now, @e7_prelimScore, @judge1Id, '07030000-EEEE-4EEE-8EEE-000000000001', @e7_prelimSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-000000000001', 0),
    ('070F0000-EEEE-4EEE-8EEE-000000000002', @now, @e7_prelimScore, @judge2Id, '07030000-EEEE-4EEE-8EEE-000000000001', @e7_prelimSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-000000000001', 0),
    ('070F0000-EEEE-4EEE-8EEE-000000000003', @now, @e7_prelimScore, @judge1Id, '07030000-EEEE-4EEE-8EEE-000000000001', @e7_prelimSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-000000000002', 0),
    ('070F0000-EEEE-4EEE-8EEE-000000000004', @now, @e7_prelimScore, @judge2Id, '07030000-EEEE-4EEE-8EEE-000000000001', @e7_prelimSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-000000000002', 0),
    ('070F0000-EEEE-4EEE-8EEE-000000000005', @now, @e7_prelimScore, @judge1Id, '07030000-EEEE-4EEE-8EEE-000000000001', @e7_prelimSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-000000000003', 0),
    ('070F0000-EEEE-4EEE-8EEE-000000000006', @now, @e7_prelimScore, @judge2Id, '07030000-EEEE-4EEE-8EEE-000000000001', @e7_prelimSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-000000000003', 0),
    ('070F0000-EEEE-4EEE-8EEE-000000000007', @now, @e7_prelimScore, @judge1Id, '07030000-EEEE-4EEE-8EEE-000000000001', @e7_prelimSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-000000000004', 0),
    ('070F0000-EEEE-4EEE-8EEE-000000000008', @now, @e7_prelimScore, @judge2Id, '07030000-EEEE-4EEE-8EEE-000000000001', @e7_prelimSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-000000000004', 0),
    ('070F0000-EEEE-4EEE-8EEE-000000000009', @now, @e7_prelimScore, @judge1Id, '07030000-EEEE-4EEE-8EEE-000000000001', @e7_prelimSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-000000000005', 0),
    ('070F0000-EEEE-4EEE-8EEE-00000000000A', @now, @e7_prelimScore, @judge2Id, '07030000-EEEE-4EEE-8EEE-000000000001', @e7_prelimSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-000000000005', 0),
    ('070F0000-EEEE-4EEE-8EEE-00000000000B', @now, @e7_prelimScore, @judge1Id, '07030000-EEEE-4EEE-8EEE-000000000001', @e7_prelimSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-000000000006', 0),
    ('070F0000-EEEE-4EEE-8EEE-00000000000C', @now, @e7_prelimScore, @judge2Id, '07030000-EEEE-4EEE-8EEE-000000000001', @e7_prelimSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-000000000006', 0),
    ('070F0000-EEEE-4EEE-8EEE-00000000000D', @now, @e7_prelimScore, @judge1Id, '07030000-EEEE-4EEE-8EEE-000000000001', @e7_prelimSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-000000000007', 0),
    ('070F0000-EEEE-4EEE-8EEE-00000000000E', @now, @e7_prelimScore, @judge2Id, '07030000-EEEE-4EEE-8EEE-000000000001', @e7_prelimSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-000000000007', 0),
    ('070F0000-EEEE-4EEE-8EEE-00000000000F', @now, @e7_prelimScore, @judge1Id, '07030000-EEEE-4EEE-8EEE-000000000001', @e7_prelimSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-000000000008', 0),
    ('070F0000-EEEE-4EEE-8EEE-000000000010', @now, @e7_prelimScore, @judge2Id, '07030000-EEEE-4EEE-8EEE-000000000001', @e7_prelimSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-000000000008', 0),
    ('070F0000-EEEE-4EEE-8EEE-000000000011', @now, @e7_prelimScore, @judge1Id, '07030000-EEEE-4EEE-8EEE-000000000001', @e7_prelimSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-000000000009', 0),
    ('070F0000-EEEE-4EEE-8EEE-000000000012', @now, @e7_prelimScore, @judge2Id, '07030000-EEEE-4EEE-8EEE-000000000001', @e7_prelimSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-000000000009', 0),
    ('070F0000-EEEE-4EEE-8EEE-000000000013', @now, @e7_finalScore, @judge1Id, '07030000-EEEE-4EEE-8EEE-000000000002', @e7_finalSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-00000000000A', 0),
    ('070F0000-EEEE-4EEE-8EEE-000000000014', @now, @e7_finalScore, @judge2Id, '07030000-EEEE-4EEE-8EEE-000000000002', @e7_finalSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-00000000000A', 0),
    ('070F0000-EEEE-4EEE-8EEE-000000000015', @now, @e7_finalScore, @judge1Id, '07030000-EEEE-4EEE-8EEE-000000000002', @e7_finalSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-00000000000B', 0),
    ('070F0000-EEEE-4EEE-8EEE-000000000016', @now, @e7_finalScore, @judge2Id, '07030000-EEEE-4EEE-8EEE-000000000002', @e7_finalSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-00000000000B', 0),
    ('070F0000-EEEE-4EEE-8EEE-000000000017', @now, @e7_finalScore, @judge1Id, '07030000-EEEE-4EEE-8EEE-000000000002', @e7_finalSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-00000000000C', 0),
    ('070F0000-EEEE-4EEE-8EEE-000000000018', @now, @e7_finalScore, @judge2Id, '07030000-EEEE-4EEE-8EEE-000000000002', @e7_finalSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-00000000000C', 0),
    ('070F0000-EEEE-4EEE-8EEE-000000000019', @now, @e7_finalScore, @judge1Id, '07030000-EEEE-4EEE-8EEE-000000000002', @e7_finalSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-00000000000D', 0),
    ('070F0000-EEEE-4EEE-8EEE-00000000001A', @now, @e7_finalScore, @judge2Id, '07030000-EEEE-4EEE-8EEE-000000000002', @e7_finalSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-00000000000D', 0),
    ('070F0000-EEEE-4EEE-8EEE-00000000001B', @now, @e7_finalScore, @judge1Id, '07030000-EEEE-4EEE-8EEE-000000000002', @e7_finalSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-00000000000E', 0),
    ('070F0000-EEEE-4EEE-8EEE-00000000001C', @now, @e7_finalScore, @judge2Id, '07030000-EEEE-4EEE-8EEE-000000000002', @e7_finalSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-00000000000E', 0),
    ('070F0000-EEEE-4EEE-8EEE-00000000001D', @now, @e7_finalScore, @judge1Id, '07030000-EEEE-4EEE-8EEE-000000000002', @e7_finalSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-00000000000F', 0),
    ('070F0000-EEEE-4EEE-8EEE-00000000001E', @now, @e7_finalScore, @judge2Id, '07030000-EEEE-4EEE-8EEE-000000000002', @e7_finalSub, 'COMPLETED', '070D0000-EEEE-4EEE-8EEE-00000000000F', 0);

INSERT INTO judge_score_details (id, created_at, criteria_id, score, judge_score_id) VALUES
    ('070E0000-EEEE-4EEE-8EEE-000000000001', @now, '07060000-EEEE-4EEE-8EEE-000000000001', 5, '070F0000-EEEE-4EEE-8EEE-000000000001'),
    ('070E0000-EEEE-4EEE-8EEE-000000000002', @now, '07060000-EEEE-4EEE-8EEE-000000000002', 5, '070F0000-EEEE-4EEE-8EEE-000000000001'),
    ('070E0000-EEEE-4EEE-8EEE-000000000003', @now, '07060000-EEEE-4EEE-8EEE-000000000003', 5, '070F0000-EEEE-4EEE-8EEE-000000000001'),
    ('070E0000-EEEE-4EEE-8EEE-000000000004', @now, '07060000-EEEE-4EEE-8EEE-000000000004', 4, '070F0000-EEEE-4EEE-8EEE-000000000001'),
    ('070E0000-EEEE-4EEE-8EEE-000000000005', @now, '07060000-EEEE-4EEE-8EEE-000000000005', 5, '070F0000-EEEE-4EEE-8EEE-000000000001'),
    ('070E0000-EEEE-4EEE-8EEE-000000000006', @now, '07060000-EEEE-4EEE-8EEE-000000000001', 4, '070F0000-EEEE-4EEE-8EEE-000000000002'),
    ('070E0000-EEEE-4EEE-8EEE-000000000007', @now, '07060000-EEEE-4EEE-8EEE-000000000002', 5, '070F0000-EEEE-4EEE-8EEE-000000000002'),
    ('070E0000-EEEE-4EEE-8EEE-000000000008', @now, '07060000-EEEE-4EEE-8EEE-000000000003', 4, '070F0000-EEEE-4EEE-8EEE-000000000002'),
    ('070E0000-EEEE-4EEE-8EEE-000000000009', @now, '07060000-EEEE-4EEE-8EEE-000000000004', 4, '070F0000-EEEE-4EEE-8EEE-000000000002'),
    ('070E0000-EEEE-4EEE-8EEE-00000000000A', @now, '07060000-EEEE-4EEE-8EEE-000000000005', 4, '070F0000-EEEE-4EEE-8EEE-000000000002'),
    ('070E0000-EEEE-4EEE-8EEE-00000000000B', @now, '07060000-EEEE-4EEE-8EEE-000000000001', 5, '070F0000-EEEE-4EEE-8EEE-000000000003'),
    ('070E0000-EEEE-4EEE-8EEE-00000000000C', @now, '07060000-EEEE-4EEE-8EEE-000000000002', 4, '070F0000-EEEE-4EEE-8EEE-000000000003'),
    ('070E0000-EEEE-4EEE-8EEE-00000000000D', @now, '07060000-EEEE-4EEE-8EEE-000000000003', 5, '070F0000-EEEE-4EEE-8EEE-000000000003'),
    ('070E0000-EEEE-4EEE-8EEE-00000000000E', @now, '07060000-EEEE-4EEE-8EEE-000000000004', 4, '070F0000-EEEE-4EEE-8EEE-000000000003'),
    ('070E0000-EEEE-4EEE-8EEE-00000000000F', @now, '07060000-EEEE-4EEE-8EEE-000000000005', 4, '070F0000-EEEE-4EEE-8EEE-000000000003'),
    ('070E0000-EEEE-4EEE-8EEE-000000000010', @now, '07060000-EEEE-4EEE-8EEE-000000000001', 5, '070F0000-EEEE-4EEE-8EEE-000000000004'),
    ('070E0000-EEEE-4EEE-8EEE-000000000011', @now, '07060000-EEEE-4EEE-8EEE-000000000002', 4, '070F0000-EEEE-4EEE-8EEE-000000000004'),
    ('070E0000-EEEE-4EEE-8EEE-000000000012', @now, '07060000-EEEE-4EEE-8EEE-000000000003', 5, '070F0000-EEEE-4EEE-8EEE-000000000004'),
    ('070E0000-EEEE-4EEE-8EEE-000000000013', @now, '07060000-EEEE-4EEE-8EEE-000000000004', 4, '070F0000-EEEE-4EEE-8EEE-000000000004'),
    ('070E0000-EEEE-4EEE-8EEE-000000000014', @now, '07060000-EEEE-4EEE-8EEE-000000000005', 4, '070F0000-EEEE-4EEE-8EEE-000000000004'),
    ('070E0000-EEEE-4EEE-8EEE-000000000015', @now, '07060000-EEEE-4EEE-8EEE-000000000001', 4, '070F0000-EEEE-4EEE-8EEE-000000000005'),
    ('070E0000-EEEE-4EEE-8EEE-000000000016', @now, '07060000-EEEE-4EEE-8EEE-000000000002', 5, '070F0000-EEEE-4EEE-8EEE-000000000005'),
    ('070E0000-EEEE-4EEE-8EEE-000000000017', @now, '07060000-EEEE-4EEE-8EEE-000000000003', 4, '070F0000-EEEE-4EEE-8EEE-000000000005'),
    ('070E0000-EEEE-4EEE-8EEE-000000000018', @now, '07060000-EEEE-4EEE-8EEE-000000000004', 4, '070F0000-EEEE-4EEE-8EEE-000000000005'),
    ('070E0000-EEEE-4EEE-8EEE-000000000019', @now, '07060000-EEEE-4EEE-8EEE-000000000005', 4, '070F0000-EEEE-4EEE-8EEE-000000000005'),
    ('070E0000-EEEE-4EEE-8EEE-00000000001A', @now, '07060000-EEEE-4EEE-8EEE-000000000001', 3, '070F0000-EEEE-4EEE-8EEE-000000000006'),
    ('070E0000-EEEE-4EEE-8EEE-00000000001B', @now, '07060000-EEEE-4EEE-8EEE-000000000002', 5, '070F0000-EEEE-4EEE-8EEE-000000000006'),
    ('070E0000-EEEE-4EEE-8EEE-00000000001C', @now, '07060000-EEEE-4EEE-8EEE-000000000003', 3, '070F0000-EEEE-4EEE-8EEE-000000000006'),
    ('070E0000-EEEE-4EEE-8EEE-00000000001D', @now, '07060000-EEEE-4EEE-8EEE-000000000004', 4, '070F0000-EEEE-4EEE-8EEE-000000000006'),
    ('070E0000-EEEE-4EEE-8EEE-00000000001E', @now, '07060000-EEEE-4EEE-8EEE-000000000005', 3, '070F0000-EEEE-4EEE-8EEE-000000000006'),
    ('070E0000-EEEE-4EEE-8EEE-00000000001F', @now, '07060000-EEEE-4EEE-8EEE-000000000001', 4, '070F0000-EEEE-4EEE-8EEE-000000000007'),
    ('070E0000-EEEE-4EEE-8EEE-000000000020', @now, '07060000-EEEE-4EEE-8EEE-000000000002', 4, '070F0000-EEEE-4EEE-8EEE-000000000007'),
    ('070E0000-EEEE-4EEE-8EEE-000000000021', @now, '07060000-EEEE-4EEE-8EEE-000000000003', 4, '070F0000-EEEE-4EEE-8EEE-000000000007'),
    ('070E0000-EEEE-4EEE-8EEE-000000000022', @now, '07060000-EEEE-4EEE-8EEE-000000000004', 5, '070F0000-EEEE-4EEE-8EEE-000000000007'),
    ('070E0000-EEEE-4EEE-8EEE-000000000023', @now, '07060000-EEEE-4EEE-8EEE-000000000005', 4, '070F0000-EEEE-4EEE-8EEE-000000000007'),
    ('070E0000-EEEE-4EEE-8EEE-000000000024', @now, '07060000-EEEE-4EEE-8EEE-000000000001', 4, '070F0000-EEEE-4EEE-8EEE-000000000008'),
    ('070E0000-EEEE-4EEE-8EEE-000000000025', @now, '07060000-EEEE-4EEE-8EEE-000000000002', 4, '070F0000-EEEE-4EEE-8EEE-000000000008'),
    ('070E0000-EEEE-4EEE-8EEE-000000000026', @now, '07060000-EEEE-4EEE-8EEE-000000000003', 4, '070F0000-EEEE-4EEE-8EEE-000000000008'),
    ('070E0000-EEEE-4EEE-8EEE-000000000027', @now, '07060000-EEEE-4EEE-8EEE-000000000004', 5, '070F0000-EEEE-4EEE-8EEE-000000000008'),
    ('070E0000-EEEE-4EEE-8EEE-000000000028', @now, '07060000-EEEE-4EEE-8EEE-000000000005', 4, '070F0000-EEEE-4EEE-8EEE-000000000008'),
    ('070E0000-EEEE-4EEE-8EEE-000000000029', @now, '07060000-EEEE-4EEE-8EEE-000000000001', 4, '070F0000-EEEE-4EEE-8EEE-000000000009'),
    ('070E0000-EEEE-4EEE-8EEE-00000000002A', @now, '07060000-EEEE-4EEE-8EEE-000000000002', 4, '070F0000-EEEE-4EEE-8EEE-000000000009'),
    ('070E0000-EEEE-4EEE-8EEE-00000000002B', @now, '07060000-EEEE-4EEE-8EEE-000000000003', 4, '070F0000-EEEE-4EEE-8EEE-000000000009'),
    ('070E0000-EEEE-4EEE-8EEE-00000000002C', @now, '07060000-EEEE-4EEE-8EEE-000000000004', 3, '070F0000-EEEE-4EEE-8EEE-000000000009'),
    ('070E0000-EEEE-4EEE-8EEE-00000000002D', @now, '07060000-EEEE-4EEE-8EEE-000000000005', 4, '070F0000-EEEE-4EEE-8EEE-000000000009'),
    ('070E0000-EEEE-4EEE-8EEE-00000000002E', @now, '07060000-EEEE-4EEE-8EEE-000000000001', 3, '070F0000-EEEE-4EEE-8EEE-00000000000A'),
    ('070E0000-EEEE-4EEE-8EEE-00000000002F', @now, '07060000-EEEE-4EEE-8EEE-000000000002', 4, '070F0000-EEEE-4EEE-8EEE-00000000000A'),
    ('070E0000-EEEE-4EEE-8EEE-000000000030', @now, '07060000-EEEE-4EEE-8EEE-000000000003', 3, '070F0000-EEEE-4EEE-8EEE-00000000000A'),
    ('070E0000-EEEE-4EEE-8EEE-000000000031', @now, '07060000-EEEE-4EEE-8EEE-000000000004', 3, '070F0000-EEEE-4EEE-8EEE-00000000000A'),
    ('070E0000-EEEE-4EEE-8EEE-000000000032', @now, '07060000-EEEE-4EEE-8EEE-000000000005', 3, '070F0000-EEEE-4EEE-8EEE-00000000000A'),
    ('070E0000-EEEE-4EEE-8EEE-000000000033', @now, '07060000-EEEE-4EEE-8EEE-000000000001', 4, '070F0000-EEEE-4EEE-8EEE-00000000000B'),
    ('070E0000-EEEE-4EEE-8EEE-000000000034', @now, '07060000-EEEE-4EEE-8EEE-000000000002', 3, '070F0000-EEEE-4EEE-8EEE-00000000000B'),
    ('070E0000-EEEE-4EEE-8EEE-000000000035', @now, '07060000-EEEE-4EEE-8EEE-000000000003', 4, '070F0000-EEEE-4EEE-8EEE-00000000000B'),
    ('070E0000-EEEE-4EEE-8EEE-000000000036', @now, '07060000-EEEE-4EEE-8EEE-000000000004', 4, '070F0000-EEEE-4EEE-8EEE-00000000000B'),
    ('070E0000-EEEE-4EEE-8EEE-000000000037', @now, '07060000-EEEE-4EEE-8EEE-000000000005', 3, '070F0000-EEEE-4EEE-8EEE-00000000000B'),
    ('070E0000-EEEE-4EEE-8EEE-000000000038', @now, '07060000-EEEE-4EEE-8EEE-000000000001', 4, '070F0000-EEEE-4EEE-8EEE-00000000000C'),
    ('070E0000-EEEE-4EEE-8EEE-000000000039', @now, '07060000-EEEE-4EEE-8EEE-000000000002', 3, '070F0000-EEEE-4EEE-8EEE-00000000000C'),
    ('070E0000-EEEE-4EEE-8EEE-00000000003A', @now, '07060000-EEEE-4EEE-8EEE-000000000003', 4, '070F0000-EEEE-4EEE-8EEE-00000000000C'),
    ('070E0000-EEEE-4EEE-8EEE-00000000003B', @now, '07060000-EEEE-4EEE-8EEE-000000000004', 4, '070F0000-EEEE-4EEE-8EEE-00000000000C'),
    ('070E0000-EEEE-4EEE-8EEE-00000000003C', @now, '07060000-EEEE-4EEE-8EEE-000000000005', 3, '070F0000-EEEE-4EEE-8EEE-00000000000C'),
    ('070E0000-EEEE-4EEE-8EEE-00000000003D', @now, '07060000-EEEE-4EEE-8EEE-000000000001', 3, '070F0000-EEEE-4EEE-8EEE-00000000000D'),
    ('070E0000-EEEE-4EEE-8EEE-00000000003E', @now, '07060000-EEEE-4EEE-8EEE-000000000002', 4, '070F0000-EEEE-4EEE-8EEE-00000000000D'),
    ('070E0000-EEEE-4EEE-8EEE-00000000003F', @now, '07060000-EEEE-4EEE-8EEE-000000000003', 3, '070F0000-EEEE-4EEE-8EEE-00000000000D'),
    ('070E0000-EEEE-4EEE-8EEE-000000000040', @now, '07060000-EEEE-4EEE-8EEE-000000000004', 3, '070F0000-EEEE-4EEE-8EEE-00000000000D'),
    ('070E0000-EEEE-4EEE-8EEE-000000000041', @now, '07060000-EEEE-4EEE-8EEE-000000000005', 4, '070F0000-EEEE-4EEE-8EEE-00000000000D'),
    ('070E0000-EEEE-4EEE-8EEE-000000000042', @now, '07060000-EEEE-4EEE-8EEE-000000000001', 2, '070F0000-EEEE-4EEE-8EEE-00000000000E'),
    ('070E0000-EEEE-4EEE-8EEE-000000000043', @now, '07060000-EEEE-4EEE-8EEE-000000000002', 4, '070F0000-EEEE-4EEE-8EEE-00000000000E'),
    ('070E0000-EEEE-4EEE-8EEE-000000000044', @now, '07060000-EEEE-4EEE-8EEE-000000000003', 2, '070F0000-EEEE-4EEE-8EEE-00000000000E'),
    ('070E0000-EEEE-4EEE-8EEE-000000000045', @now, '07060000-EEEE-4EEE-8EEE-000000000004', 3, '070F0000-EEEE-4EEE-8EEE-00000000000E'),
    ('070E0000-EEEE-4EEE-8EEE-000000000046', @now, '07060000-EEEE-4EEE-8EEE-000000000005', 3, '070F0000-EEEE-4EEE-8EEE-00000000000E'),
    ('070E0000-EEEE-4EEE-8EEE-000000000047', @now, '07060000-EEEE-4EEE-8EEE-000000000001', 3, '070F0000-EEEE-4EEE-8EEE-00000000000F'),
    ('070E0000-EEEE-4EEE-8EEE-000000000048', @now, '07060000-EEEE-4EEE-8EEE-000000000002', 3, '070F0000-EEEE-4EEE-8EEE-00000000000F'),
    ('070E0000-EEEE-4EEE-8EEE-000000000049', @now, '07060000-EEEE-4EEE-8EEE-000000000003', 3, '070F0000-EEEE-4EEE-8EEE-00000000000F'),
    ('070E0000-EEEE-4EEE-8EEE-00000000004A', @now, '07060000-EEEE-4EEE-8EEE-000000000004', 4, '070F0000-EEEE-4EEE-8EEE-00000000000F'),
    ('070E0000-EEEE-4EEE-8EEE-00000000004B', @now, '07060000-EEEE-4EEE-8EEE-000000000005', 3, '070F0000-EEEE-4EEE-8EEE-00000000000F'),
    ('070E0000-EEEE-4EEE-8EEE-00000000004C', @now, '07060000-EEEE-4EEE-8EEE-000000000001', 3, '070F0000-EEEE-4EEE-8EEE-000000000010'),
    ('070E0000-EEEE-4EEE-8EEE-00000000004D', @now, '07060000-EEEE-4EEE-8EEE-000000000002', 3, '070F0000-EEEE-4EEE-8EEE-000000000010'),
    ('070E0000-EEEE-4EEE-8EEE-00000000004E', @now, '07060000-EEEE-4EEE-8EEE-000000000003', 3, '070F0000-EEEE-4EEE-8EEE-000000000010'),
    ('070E0000-EEEE-4EEE-8EEE-00000000004F', @now, '07060000-EEEE-4EEE-8EEE-000000000004', 4, '070F0000-EEEE-4EEE-8EEE-000000000010'),
    ('070E0000-EEEE-4EEE-8EEE-000000000050', @now, '07060000-EEEE-4EEE-8EEE-000000000005', 3, '070F0000-EEEE-4EEE-8EEE-000000000010'),
    ('070E0000-EEEE-4EEE-8EEE-000000000051', @now, '07060000-EEEE-4EEE-8EEE-000000000001', 3, '070F0000-EEEE-4EEE-8EEE-000000000011'),
    ('070E0000-EEEE-4EEE-8EEE-000000000052', @now, '07060000-EEEE-4EEE-8EEE-000000000002', 3, '070F0000-EEEE-4EEE-8EEE-000000000011'),
    ('070E0000-EEEE-4EEE-8EEE-000000000053', @now, '07060000-EEEE-4EEE-8EEE-000000000003', 2, '070F0000-EEEE-4EEE-8EEE-000000000011'),
    ('070E0000-EEEE-4EEE-8EEE-000000000054', @now, '07060000-EEEE-4EEE-8EEE-000000000004', 3, '070F0000-EEEE-4EEE-8EEE-000000000011'),
    ('070E0000-EEEE-4EEE-8EEE-000000000055', @now, '07060000-EEEE-4EEE-8EEE-000000000005', 3, '070F0000-EEEE-4EEE-8EEE-000000000011'),
    ('070E0000-EEEE-4EEE-8EEE-000000000056', @now, '07060000-EEEE-4EEE-8EEE-000000000001', 2, '070F0000-EEEE-4EEE-8EEE-000000000012'),
    ('070E0000-EEEE-4EEE-8EEE-000000000057', @now, '07060000-EEEE-4EEE-8EEE-000000000002', 3, '070F0000-EEEE-4EEE-8EEE-000000000012'),
    ('070E0000-EEEE-4EEE-8EEE-000000000058', @now, '07060000-EEEE-4EEE-8EEE-000000000003', 1, '070F0000-EEEE-4EEE-8EEE-000000000012'),
    ('070E0000-EEEE-4EEE-8EEE-000000000059', @now, '07060000-EEEE-4EEE-8EEE-000000000004', 3, '070F0000-EEEE-4EEE-8EEE-000000000012'),
    ('070E0000-EEEE-4EEE-8EEE-00000000005A', @now, '07060000-EEEE-4EEE-8EEE-000000000005', 2, '070F0000-EEEE-4EEE-8EEE-000000000012'),
    ('070E0000-EEEE-4EEE-8EEE-00000000005B', @now, '07060000-EEEE-4EEE-8EEE-00000000000B', 5, '070F0000-EEEE-4EEE-8EEE-000000000013'),
    ('070E0000-EEEE-4EEE-8EEE-00000000005C', @now, '07060000-EEEE-4EEE-8EEE-00000000000C', 5, '070F0000-EEEE-4EEE-8EEE-000000000013'),
    ('070E0000-EEEE-4EEE-8EEE-00000000005D', @now, '07060000-EEEE-4EEE-8EEE-00000000000D', 5, '070F0000-EEEE-4EEE-8EEE-000000000013'),
    ('070E0000-EEEE-4EEE-8EEE-00000000005E', @now, '07060000-EEEE-4EEE-8EEE-00000000000E', 5, '070F0000-EEEE-4EEE-8EEE-000000000013'),
    ('070E0000-EEEE-4EEE-8EEE-00000000005F', @now, '07060000-EEEE-4EEE-8EEE-00000000000F', 4, '070F0000-EEEE-4EEE-8EEE-000000000013'),
    ('070E0000-EEEE-4EEE-8EEE-000000000060', @now, '07060000-EEEE-4EEE-8EEE-00000000000B', 5, '070F0000-EEEE-4EEE-8EEE-000000000014'),
    ('070E0000-EEEE-4EEE-8EEE-000000000061', @now, '07060000-EEEE-4EEE-8EEE-00000000000C', 5, '070F0000-EEEE-4EEE-8EEE-000000000014'),
    ('070E0000-EEEE-4EEE-8EEE-000000000062', @now, '07060000-EEEE-4EEE-8EEE-00000000000D', 5, '070F0000-EEEE-4EEE-8EEE-000000000014'),
    ('070E0000-EEEE-4EEE-8EEE-000000000063', @now, '07060000-EEEE-4EEE-8EEE-00000000000E', 5, '070F0000-EEEE-4EEE-8EEE-000000000014'),
    ('070E0000-EEEE-4EEE-8EEE-000000000064', @now, '07060000-EEEE-4EEE-8EEE-00000000000F', 4, '070F0000-EEEE-4EEE-8EEE-000000000014'),
    ('070E0000-EEEE-4EEE-8EEE-000000000065', @now, '07060000-EEEE-4EEE-8EEE-00000000000B', 5, '070F0000-EEEE-4EEE-8EEE-000000000015'),
    ('070E0000-EEEE-4EEE-8EEE-000000000066', @now, '07060000-EEEE-4EEE-8EEE-00000000000C', 4, '070F0000-EEEE-4EEE-8EEE-000000000015'),
    ('070E0000-EEEE-4EEE-8EEE-000000000067', @now, '07060000-EEEE-4EEE-8EEE-00000000000D', 5, '070F0000-EEEE-4EEE-8EEE-000000000015'),
    ('070E0000-EEEE-4EEE-8EEE-000000000068', @now, '07060000-EEEE-4EEE-8EEE-00000000000E', 4, '070F0000-EEEE-4EEE-8EEE-000000000015'),
    ('070E0000-EEEE-4EEE-8EEE-000000000069', @now, '07060000-EEEE-4EEE-8EEE-00000000000F', 5, '070F0000-EEEE-4EEE-8EEE-000000000015'),
    ('070E0000-EEEE-4EEE-8EEE-00000000006A', @now, '07060000-EEEE-4EEE-8EEE-00000000000B', 4, '070F0000-EEEE-4EEE-8EEE-000000000016'),
    ('070E0000-EEEE-4EEE-8EEE-00000000006B', @now, '07060000-EEEE-4EEE-8EEE-00000000000C', 4, '070F0000-EEEE-4EEE-8EEE-000000000016'),
    ('070E0000-EEEE-4EEE-8EEE-00000000006C', @now, '07060000-EEEE-4EEE-8EEE-00000000000D', 4, '070F0000-EEEE-4EEE-8EEE-000000000016'),
    ('070E0000-EEEE-4EEE-8EEE-00000000006D', @now, '07060000-EEEE-4EEE-8EEE-00000000000E', 4, '070F0000-EEEE-4EEE-8EEE-000000000016'),
    ('070E0000-EEEE-4EEE-8EEE-00000000006E', @now, '07060000-EEEE-4EEE-8EEE-00000000000F', 4, '070F0000-EEEE-4EEE-8EEE-000000000016'),
    ('070E0000-EEEE-4EEE-8EEE-00000000006F', @now, '07060000-EEEE-4EEE-8EEE-00000000000B', 4, '070F0000-EEEE-4EEE-8EEE-000000000017'),
    ('070E0000-EEEE-4EEE-8EEE-000000000070', @now, '07060000-EEEE-4EEE-8EEE-00000000000C', 5, '070F0000-EEEE-4EEE-8EEE-000000000017'),
    ('070E0000-EEEE-4EEE-8EEE-000000000071', @now, '07060000-EEEE-4EEE-8EEE-00000000000D', 4, '070F0000-EEEE-4EEE-8EEE-000000000017'),
    ('070E0000-EEEE-4EEE-8EEE-000000000072', @now, '07060000-EEEE-4EEE-8EEE-00000000000E', 5, '070F0000-EEEE-4EEE-8EEE-000000000017'),
    ('070E0000-EEEE-4EEE-8EEE-000000000073', @now, '07060000-EEEE-4EEE-8EEE-00000000000F', 4, '070F0000-EEEE-4EEE-8EEE-000000000017'),
    ('070E0000-EEEE-4EEE-8EEE-000000000074', @now, '07060000-EEEE-4EEE-8EEE-00000000000B', 4, '070F0000-EEEE-4EEE-8EEE-000000000018'),
    ('070E0000-EEEE-4EEE-8EEE-000000000075', @now, '07060000-EEEE-4EEE-8EEE-00000000000C', 5, '070F0000-EEEE-4EEE-8EEE-000000000018'),
    ('070E0000-EEEE-4EEE-8EEE-000000000076', @now, '07060000-EEEE-4EEE-8EEE-00000000000D', 4, '070F0000-EEEE-4EEE-8EEE-000000000018'),
    ('070E0000-EEEE-4EEE-8EEE-000000000077', @now, '07060000-EEEE-4EEE-8EEE-00000000000E', 5, '070F0000-EEEE-4EEE-8EEE-000000000018'),
    ('070E0000-EEEE-4EEE-8EEE-000000000078', @now, '07060000-EEEE-4EEE-8EEE-00000000000F', 4, '070F0000-EEEE-4EEE-8EEE-000000000018'),
    ('070E0000-EEEE-4EEE-8EEE-000000000079', @now, '07060000-EEEE-4EEE-8EEE-00000000000B', 4, '070F0000-EEEE-4EEE-8EEE-000000000019'),
    ('070E0000-EEEE-4EEE-8EEE-00000000007A', @now, '07060000-EEEE-4EEE-8EEE-00000000000C', 4, '070F0000-EEEE-4EEE-8EEE-000000000019'),
    ('070E0000-EEEE-4EEE-8EEE-00000000007B', @now, '07060000-EEEE-4EEE-8EEE-00000000000D', 5, '070F0000-EEEE-4EEE-8EEE-000000000019'),
    ('070E0000-EEEE-4EEE-8EEE-00000000007C', @now, '07060000-EEEE-4EEE-8EEE-00000000000E', 4, '070F0000-EEEE-4EEE-8EEE-000000000019'),
    ('070E0000-EEEE-4EEE-8EEE-00000000007D', @now, '07060000-EEEE-4EEE-8EEE-00000000000F', 4, '070F0000-EEEE-4EEE-8EEE-000000000019'),
    ('070E0000-EEEE-4EEE-8EEE-00000000007E', @now, '07060000-EEEE-4EEE-8EEE-00000000000B', 3, '070F0000-EEEE-4EEE-8EEE-00000000001A'),
    ('070E0000-EEEE-4EEE-8EEE-00000000007F', @now, '07060000-EEEE-4EEE-8EEE-00000000000C', 4, '070F0000-EEEE-4EEE-8EEE-00000000001A'),
    ('070E0000-EEEE-4EEE-8EEE-000000000080', @now, '07060000-EEEE-4EEE-8EEE-00000000000D', 4, '070F0000-EEEE-4EEE-8EEE-00000000001A'),
    ('070E0000-EEEE-4EEE-8EEE-000000000081', @now, '07060000-EEEE-4EEE-8EEE-00000000000E', 4, '070F0000-EEEE-4EEE-8EEE-00000000001A'),
    ('070E0000-EEEE-4EEE-8EEE-000000000082', @now, '07060000-EEEE-4EEE-8EEE-00000000000F', 3, '070F0000-EEEE-4EEE-8EEE-00000000001A'),
    ('070E0000-EEEE-4EEE-8EEE-000000000083', @now, '07060000-EEEE-4EEE-8EEE-00000000000B', 4, '070F0000-EEEE-4EEE-8EEE-00000000001B'),
    ('070E0000-EEEE-4EEE-8EEE-000000000084', @now, '07060000-EEEE-4EEE-8EEE-00000000000C', 4, '070F0000-EEEE-4EEE-8EEE-00000000001B'),
    ('070E0000-EEEE-4EEE-8EEE-000000000085', @now, '07060000-EEEE-4EEE-8EEE-00000000000D', 4, '070F0000-EEEE-4EEE-8EEE-00000000001B'),
    ('070E0000-EEEE-4EEE-8EEE-000000000086', @now, '07060000-EEEE-4EEE-8EEE-00000000000E', 4, '070F0000-EEEE-4EEE-8EEE-00000000001B'),
    ('070E0000-EEEE-4EEE-8EEE-000000000087', @now, '07060000-EEEE-4EEE-8EEE-00000000000F', 3, '070F0000-EEEE-4EEE-8EEE-00000000001B'),
    ('070E0000-EEEE-4EEE-8EEE-000000000088', @now, '07060000-EEEE-4EEE-8EEE-00000000000B', 4, '070F0000-EEEE-4EEE-8EEE-00000000001C'),
    ('070E0000-EEEE-4EEE-8EEE-000000000089', @now, '07060000-EEEE-4EEE-8EEE-00000000000C', 4, '070F0000-EEEE-4EEE-8EEE-00000000001C'),
    ('070E0000-EEEE-4EEE-8EEE-00000000008A', @now, '07060000-EEEE-4EEE-8EEE-00000000000D', 4, '070F0000-EEEE-4EEE-8EEE-00000000001C'),
    ('070E0000-EEEE-4EEE-8EEE-00000000008B', @now, '07060000-EEEE-4EEE-8EEE-00000000000E', 4, '070F0000-EEEE-4EEE-8EEE-00000000001C'),
    ('070E0000-EEEE-4EEE-8EEE-00000000008C', @now, '07060000-EEEE-4EEE-8EEE-00000000000F', 3, '070F0000-EEEE-4EEE-8EEE-00000000001C'),
    ('070E0000-EEEE-4EEE-8EEE-00000000008D', @now, '07060000-EEEE-4EEE-8EEE-00000000000B', 3, '070F0000-EEEE-4EEE-8EEE-00000000001D'),
    ('070E0000-EEEE-4EEE-8EEE-00000000008E', @now, '07060000-EEEE-4EEE-8EEE-00000000000C', 4, '070F0000-EEEE-4EEE-8EEE-00000000001D'),
    ('070E0000-EEEE-4EEE-8EEE-00000000008F', @now, '07060000-EEEE-4EEE-8EEE-00000000000D', 4, '070F0000-EEEE-4EEE-8EEE-00000000001D'),
    ('070E0000-EEEE-4EEE-8EEE-000000000090', @now, '07060000-EEEE-4EEE-8EEE-00000000000E', 4, '070F0000-EEEE-4EEE-8EEE-00000000001D'),
    ('070E0000-EEEE-4EEE-8EEE-000000000091', @now, '07060000-EEEE-4EEE-8EEE-00000000000F', 4, '070F0000-EEEE-4EEE-8EEE-00000000001D'),
    ('070E0000-EEEE-4EEE-8EEE-000000000092', @now, '07060000-EEEE-4EEE-8EEE-00000000000B', 2, '070F0000-EEEE-4EEE-8EEE-00000000001E'),
    ('070E0000-EEEE-4EEE-8EEE-000000000093', @now, '07060000-EEEE-4EEE-8EEE-00000000000C', 4, '070F0000-EEEE-4EEE-8EEE-00000000001E'),
    ('070E0000-EEEE-4EEE-8EEE-000000000094', @now, '07060000-EEEE-4EEE-8EEE-00000000000D', 3, '070F0000-EEEE-4EEE-8EEE-00000000001E'),
    ('070E0000-EEEE-4EEE-8EEE-000000000095', @now, '07060000-EEEE-4EEE-8EEE-00000000000E', 4, '070F0000-EEEE-4EEE-8EEE-00000000001E'),
    ('070E0000-EEEE-4EEE-8EEE-000000000096', @now, '07060000-EEEE-4EEE-8EEE-00000000000F', 3, '070F0000-EEEE-4EEE-8EEE-00000000001E');

INSERT INTO rankings (id, created_at, calculated_at, final_score, rank, round_id, team_id, version, lock_version) VALUES
    ('07100000-EEEE-4EEE-8EEE-000000000001', @now, @e7_prelimScore, 4.5750, 1, '07030000-EEEE-4EEE-8EEE-000000000001', '07050000-EEEE-4EEE-8EEE-000000000001', 1, 0),
    ('07100000-EEEE-4EEE-8EEE-000000000002', @now, @e7_prelimScore, 4.4400, 2, '07030000-EEEE-4EEE-8EEE-000000000001', '07050000-EEEE-4EEE-8EEE-000000000002', 1, 0),
    ('07100000-EEEE-4EEE-8EEE-000000000003', @now, @e7_prelimScore, 4.1300, 3, '07030000-EEEE-4EEE-8EEE-000000000001', '07050000-EEEE-4EEE-8EEE-000000000004', 1, 0),
    ('07100000-EEEE-4EEE-8EEE-000000000004', @now, @e7_prelimScore, 3.9950, 4, '07030000-EEEE-4EEE-8EEE-000000000001', '07050000-EEEE-4EEE-8EEE-000000000003', 1, 0),
    ('07100000-EEEE-4EEE-8EEE-000000000005', @now, @e7_prelimScore, 3.5600, 5, '07030000-EEEE-4EEE-8EEE-000000000001', '07050000-EEEE-4EEE-8EEE-000000000006', 1, 0),
    ('07100000-EEEE-4EEE-8EEE-000000000006', @now, @e7_prelimScore, 3.5250, 6, '07030000-EEEE-4EEE-8EEE-000000000001', '07050000-EEEE-4EEE-8EEE-000000000005', 1, 0),
    ('07100000-EEEE-4EEE-8EEE-000000000007', @now, @e7_prelimScore, 3.0900, 7, '07030000-EEEE-4EEE-8EEE-000000000001', '07050000-EEEE-4EEE-8EEE-000000000008', 1, 0),
    ('07100000-EEEE-4EEE-8EEE-000000000008', @now, @e7_prelimScore, 3.0550, 8, '07030000-EEEE-4EEE-8EEE-000000000001', '07050000-EEEE-4EEE-8EEE-000000000007', 1, 0),
    ('07100000-EEEE-4EEE-8EEE-000000000009', @now, @e7_prelimScore, 2.4950, 9, '07030000-EEEE-4EEE-8EEE-000000000001', '07050000-EEEE-4EEE-8EEE-000000000009', 1, 0);

INSERT INTO rankings (id, created_at, calculated_at, final_score, rank, round_id, team_id, version, lock_version) VALUES
    ('07110000-EEEE-4EEE-8EEE-000000000001', @now, @e7_finalScore, 4.9000, 1, '07030000-EEEE-4EEE-8EEE-000000000002', '07050000-EEEE-4EEE-8EEE-000000000001', 1, 0),
    ('07110000-EEEE-4EEE-8EEE-000000000002', @now, @e7_finalScore, 4.3900, 2, '07030000-EEEE-4EEE-8EEE-000000000002', '07050000-EEEE-4EEE-8EEE-000000000004', 1, 0),
    ('07110000-EEEE-4EEE-8EEE-000000000003', @now, @e7_finalScore, 4.2800, 3, '07030000-EEEE-4EEE-8EEE-000000000002', '07050000-EEEE-4EEE-8EEE-000000000002', 1, 0),
    ('07110000-EEEE-4EEE-8EEE-000000000004', @now, @e7_finalScore, 3.8700, 4, '07030000-EEEE-4EEE-8EEE-000000000002', '07050000-EEEE-4EEE-8EEE-000000000006', 1, 0),
    ('07110000-EEEE-4EEE-8EEE-000000000005', @now, @e7_finalScore, 3.8600, 5, '07030000-EEEE-4EEE-8EEE-000000000002', '07050000-EEEE-4EEE-8EEE-000000000008', 1, 0),
    ('07110000-EEEE-4EEE-8EEE-000000000006', @now, @e7_finalScore, 3.3500, 6, '07030000-EEEE-4EEE-8EEE-000000000002', '07050000-EEEE-4EEE-8EEE-000000000007', 1, 0);

INSERT INTO finalist_selections (id, event_id, team_id, track_id, preliminary_rank, selected_reason, selected_at, created_at, updated_at, selection_method, eligible) VALUES
    ('07120000-EEEE-4EEE-8EEE-000000000001', '07020000-EEEE-4EEE-8EEE-000000000001', '07050000-EEEE-4EEE-8EEE-000000000001', '07040000-EEEE-4EEE-8EEE-000000000001', 1, N'Top 1 in track', @e7_prelimScore, @now, @now, 'AUTO', 1),
    ('07120000-EEEE-4EEE-8EEE-000000000002', '07020000-EEEE-4EEE-8EEE-000000000001', '07050000-EEEE-4EEE-8EEE-000000000002', '07040000-EEEE-4EEE-8EEE-000000000001', 2, N'Top 2 in track', @e7_prelimScore, @now, @now, 'AUTO', 1),
    ('07120000-EEEE-4EEE-8EEE-000000000003', '07020000-EEEE-4EEE-8EEE-000000000001', '07050000-EEEE-4EEE-8EEE-000000000004', '07040000-EEEE-4EEE-8EEE-000000000002', 1, N'Top 1 in track', @e7_prelimScore, @now, @now, 'AUTO', 1),
    ('07120000-EEEE-4EEE-8EEE-000000000004', '07020000-EEEE-4EEE-8EEE-000000000001', '07050000-EEEE-4EEE-8EEE-000000000006', '07040000-EEEE-4EEE-8EEE-000000000002', 2, N'Top 2 in track', @e7_prelimScore, @now, @now, 'AUTO', 1),
    ('07120000-EEEE-4EEE-8EEE-000000000005', '07020000-EEEE-4EEE-8EEE-000000000001', '07050000-EEEE-4EEE-8EEE-000000000008', '07040000-EEEE-4EEE-8EEE-000000000003', 1, N'Top 1 in track', @e7_prelimScore, @now, @now, 'AUTO', 1),
    ('07120000-EEEE-4EEE-8EEE-000000000006', '07020000-EEEE-4EEE-8EEE-000000000001', '07050000-EEEE-4EEE-8EEE-000000000007', '07040000-EEEE-4EEE-8EEE-000000000003', 2, N'Top 2 in track', @e7_prelimScore, @now, @now, 'AUTO', 1);

INSERT INTO published_results (id, created_at, dispute_deadline, published_at, published_by, round_id) VALUES
    ('07130000-EEEE-4EEE-8EEE-000000000001', @now, DATEADD(DAY, 2, @e7_prelimScore), @e7_prelimScore, @coordId, '07030000-EEEE-4EEE-8EEE-000000000001'),
    ('07130000-EEEE-4EEE-8EEE-000000000002', @now, DATEADD(DAY, 2, @e7_finalScore), @e7_finalScore, @coordId, '07030000-EEEE-4EEE-8EEE-000000000002');

INSERT INTO team_awards (id, event_id, team_id, prize_id, awarded_at, created_at, updated_at) VALUES
    ('07140000-EEEE-4EEE-8EEE-000000000001', '07020000-EEEE-4EEE-8EEE-000000000001', '07050000-EEEE-4EEE-8EEE-000000000001', '07070000-EEEE-4EEE-8EEE-000000000001', @e7_finalEnd, @now, @now),
    ('07140000-EEEE-4EEE-8EEE-000000000002', '07020000-EEEE-4EEE-8EEE-000000000001', '07050000-EEEE-4EEE-8EEE-000000000004', '07070000-EEEE-4EEE-8EEE-000000000002', @e7_finalEnd, @now, @now),
    ('07140000-EEEE-4EEE-8EEE-000000000003', '07020000-EEEE-4EEE-8EEE-000000000001', '07050000-EEEE-4EEE-8EEE-000000000002', '07070000-EEEE-4EEE-8EEE-000000000003', @e7_finalEnd, @now, @now),
    ('07140000-EEEE-4EEE-8EEE-000000000004', '07020000-EEEE-4EEE-8EEE-000000000001', '07050000-EEEE-4EEE-8EEE-000000000006', '07070000-EEEE-4EEE-8EEE-000000000004', @e7_finalEnd, @now, @now);

-- Intentionally no participant_feedbacks rows (feedback UI should open for confirmed members).

COMMIT TRANSACTION;
PRINT 'seed_demo_events.sql complete: 7 SEAL seasons seeded (template 77F2A5A3-6538-4FCF-B85A-666066465E68 preserved).';
PRINT 'Demo password for all seeded accounts: Demo@123456';