/**
 * Generate seed_feature_demo_pack.sql — 7 demo events for feature QA.
 * Password (all accounts): Demo@123456
 *
 *   node _gen_seed_feature_demo_pack.mjs
 *   sqlcmd -S localhost -U sa -P <pwd> -C -d SEAL -f 65001 -I -i seed_feature_demo_pack.sql
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PWD = "$2a$10$7ZqT629/ciaVAXuzx7B0zO.wFlLuVz6NK3/tNioMOWFLb2gPkXeU2"; // Demo@123456

/** event 1..7 (or 0=staff), kind 0..FF, seq */
const uid = (event, kind, seq) => {
  const e = Number(event).toString(16).padStart(2, "0");
  const k = Number(kind).toString(16).padStart(2, "0");
  const s = Number(seq).toString(16).padStart(12, "0");
  return `FE${e}${k}00-EEEE-4EEE-8EEE-${s}`.toUpperCase();
};

const lines = [];
const L = (s = "") => lines.push(s);
const esc = (s) => String(s).replace(/'/g, "''");

const upsertUser = (id, email, name, type, studentId, semester) => {
  const sid = studentId ? `N'${esc(studentId)}'` : "NULL";
  const sem = semester == null ? "NULL" : String(semester);
  L(`IF EXISTS (SELECT 1 FROM users WHERE email = N'${esc(email)}')`);
  L(`  UPDATE users SET id='${id}', password_hash=@pwd, full_name=N'${esc(name)}', user_type=N'${type}', status=N'ACTIVE',`);
  L(`    failed_login_attempts=0, locked_until=NULL, student_id=${sid}, university_name=N'FPT University',`);
  L(`    semester=${sem}, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail`);
  L(`  WHERE email=N'${esc(email)}';`);
  L(`ELSE`);
  L(`  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,`);
  L(`    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,`);
  L(`    created_at,updated_at,created_by,updated_by)`);
  L(`  VALUES ('${id}',N'${esc(email)}',@pwd,N'${esc(name)}',NULL,NULL,${sid},N'FPT University',`);
  L(`    N'${type}',N'ACTIVE',0,NULL,${sem},N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);`);
  L(``);
};

// Avoid updating PK if email exists with different id — safer pattern
const upsertUserSafe = (id, email, name, type, studentId, semester) => {
  const sid = studentId ? `N'${esc(studentId)}'` : "NULL";
  const sem = semester == null ? "NULL" : String(semester);
  L(`IF EXISTS (SELECT 1 FROM users WHERE email = N'${esc(email)}')`);
  L(`  UPDATE users SET password_hash=@pwd, full_name=N'${esc(name)}', user_type=N'${type}', status=N'ACTIVE',`);
  L(`    failed_login_attempts=0, locked_until=NULL, student_id=${sid}, university_name=N'FPT University',`);
  L(`    semester=${sem}, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail`);
  L(`  WHERE email=N'${esc(email)}';`);
  L(`ELSE`);
  L(`  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,`);
  L(`    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,`);
  L(`    created_at,updated_at,created_by,updated_by)`);
  L(`  VALUES ('${id}',N'${esc(email)}',@pwd,N'${esc(name)}',NULL,NULL,${sid},N'FPT University',`);
  L(`    N'${type}',N'ACTIVE',0,NULL,${sem},N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);`);
  L(``);
};

L(`-- Feature demo pack: 7 events (registration → assignment → submission → scoring → final → feedback).`);
L(`-- Password for ALL accounts: Demo@123456`);
L(`-- Regenerate: node _gen_seed_feature_demo_pack.mjs`);
L(`-- Run: sqlcmd -S localhost -U sa -P <pwd> -C -d SEAL -f 65001 -I -i seed_feature_demo_pack.sql`);
L(``);
L(`SET NOCOUNT ON; SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON; SET XACT_ABORT ON;`);
L(`BEGIN TRANSACTION;`);
L(``);
L(`DECLARE @pwd NVARCHAR(255) = N'${PWD}';`);
L(`DECLARE @now DATETIME2 = SYSUTCDATETIME();`);
L(`DECLARE @today DATE = CAST(@now AS DATE);`);
L(`DECLARE @templateId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM scoring_templates ORDER BY created_at);`);
L(`DECLARE @ownerUserId UNIQUEIDENTIFIER = (`);
L(`  SELECT TOP 1 id FROM users WHERE email IN (N'admin@seal.com', N'coordinator@seal.com')`);
L(`  ORDER BY CASE email WHEN N'admin@seal.com' THEN 0 ELSE 1 END);`);
L(`DECLARE @ownerEmail NVARCHAR(255) = (SELECT email FROM users WHERE id = @ownerUserId);`);
L(`IF @templateId IS NULL BEGIN RAISERROR('No scoring template. Start backend with profile=dev first.', 16, 1); ROLLBACK; RETURN; END`);
L(`IF @ownerUserId IS NULL BEGIN RAISERROR('Need admin@seal.com or coordinator@seal.com.', 16, 1); ROLLBACK; RETURN; END`);
L(``);
L(`-- Allow 0–100 scores (legacy DBs may still enforce <=10)`);
L(`DECLARE @jsdCk NVARCHAR(256) = (`);
L(`  SELECT TOP 1 cc.name FROM sys.check_constraints cc`);
L(`  WHERE cc.parent_object_id = OBJECT_ID(N'dbo.judge_score_details') AND cc.definition LIKE N'%score%'`);
L(`);`);
L(`IF @jsdCk IS NOT NULL EXEC(N'ALTER TABLE dbo.judge_score_details DROP CONSTRAINT [' + @jsdCk + N']');`);
L(`IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_judge_score_details_score_0_100')`);
L(`  ALTER TABLE dbo.judge_score_details ADD CONSTRAINT CK_judge_score_details_score_0_100 CHECK ([score]>=(0) AND [score]<=(100));`);
L(``);

L(`DECLARE @packEvents TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);`);
for (let e = 1; e <= 7; e++) L(`INSERT INTO @packEvents VALUES ('${uid(e, 1, 1)}');`);
L(`DECLARE @packTeams TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);`);
L(`INSERT INTO @packTeams SELECT id FROM teams WHERE event_id IN (SELECT id FROM @packEvents);`);
L(`DECLARE @packRounds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);`);
L(`INSERT INTO @packRounds SELECT id FROM rounds WHERE event_id IN (SELECT id FROM @packEvents);`);
L(`DECLARE @packSubs TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);`);
L(`INSERT INTO @packSubs SELECT s.id FROM submissions s WHERE s.round_id IN (SELECT id FROM @packRounds);`);
L(``);
L(`DELETE jc FROM judge_comments jc INNER JOIN judge_scores js ON js.id = jc.judge_score_id WHERE js.submission_id IN (SELECT id FROM @packSubs);`);
L(`DELETE jsd FROM judge_score_details jsd INNER JOIN judge_scores js ON js.id = jsd.judge_score_id WHERE js.submission_id IN (SELECT id FROM @packSubs);`);
L(`DELETE FROM judge_scores WHERE submission_id IN (SELECT id FROM @packSubs);`);
L(`IF OBJECT_ID(N'dbo.score_review_requests', N'U') IS NOT NULL DELETE FROM score_review_requests WHERE submission_id IN (SELECT id FROM @packSubs);`);
L(`IF OBJECT_ID(N'dbo.submission_attachments', N'U') IS NOT NULL`);
L(`  DELETE sa FROM submission_attachments sa INNER JOIN submission_versions sv ON sv.id = sa.submission_version_id WHERE sv.submission_id IN (SELECT id FROM @packSubs);`);
L(`UPDATE submissions SET current_version_id = NULL WHERE id IN (SELECT id FROM @packSubs);`);
L(`DELETE FROM submission_versions WHERE submission_id IN (SELECT id FROM @packSubs);`);
L(`DELETE FROM submissions WHERE id IN (SELECT id FROM @packSubs);`);
L(`IF OBJECT_ID(N'dbo.published_results', N'U') IS NOT NULL DELETE FROM published_results WHERE round_id IN (SELECT id FROM @packRounds);`);
L(`IF OBJECT_ID(N'dbo.rankings', N'U') IS NOT NULL DELETE FROM rankings WHERE round_id IN (SELECT id FROM @packRounds);`);
L(`IF OBJECT_ID(N'dbo.finalist_selections', N'U') IS NOT NULL DELETE FROM finalist_selections WHERE event_id IN (SELECT id FROM @packEvents);`);
L(`IF OBJECT_ID(N'dbo.team_awards', N'U') IS NOT NULL DELETE FROM team_awards WHERE event_id IN (SELECT id FROM @packEvents);`);
L(`IF OBJECT_ID(N'dbo.participation_certificates', N'U') IS NOT NULL DELETE FROM participation_certificates WHERE event_id IN (SELECT id FROM @packEvents);`);
L(`IF OBJECT_ID(N'dbo.participant_feedbacks', N'U') IS NOT NULL DELETE FROM participant_feedbacks WHERE event_id IN (SELECT id FROM @packEvents);`);
L(`IF OBJECT_ID(N'dbo.mentor_chat_messages', N'U') IS NOT NULL DELETE FROM mentor_chat_messages WHERE team_id IN (SELECT id FROM @packTeams);`);
L(`IF OBJECT_ID(N'dbo.mentor_feedbacks', N'U') IS NOT NULL DELETE FROM mentor_feedbacks WHERE team_id IN (SELECT id FROM @packTeams);`);
L(`DELETE FROM mentor_teams WHERE team_id IN (SELECT id FROM @packTeams);`);
L(`DELETE FROM mentor_assignments WHERE event_id IN (SELECT id FROM @packEvents);`);
L(`DELETE FROM event_mentor_assignments WHERE event_id IN (SELECT id FROM @packEvents);`);
L(`DELETE FROM judge_assignments WHERE round_id IN (SELECT id FROM @packRounds);`);
L(`DELETE FROM event_judge_assignments WHERE event_id IN (SELECT id FROM @packEvents);`);
L(`DELETE FROM invitations WHERE team_id IN (SELECT id FROM @packTeams);`);
L(`DELETE FROM mentor_invitations WHERE team_id IN (SELECT id FROM @packTeams);`);
L(`DELETE FROM team_join_requests WHERE team_id IN (SELECT id FROM @packTeams);`);
L(`DELETE FROM team_leave_requests WHERE team_id IN (SELECT id FROM @packTeams);`);
L(`DELETE FROM team_needed_roles WHERE team_id IN (SELECT id FROM @packTeams);`);
L(`IF OBJECT_ID(N'dbo.team_progress_alerts', N'U') IS NOT NULL DELETE FROM team_progress_alerts WHERE team_id IN (SELECT id FROM @packTeams);`);
L(`DELETE FROM team_members WHERE team_id IN (SELECT id FROM @packTeams);`);
L(`DELETE FROM teams WHERE id IN (SELECT id FROM @packTeams);`);
L(`DELETE FROM criteria WHERE round_id IN (SELECT id FROM @packRounds);`);
L(`DELETE FROM rounds WHERE id IN (SELECT id FROM @packRounds);`);
L(`DELETE FROM competition_groups WHERE track_id IN (SELECT id FROM tracks WHERE event_id IN (SELECT id FROM @packEvents));`);
L(`DELETE FROM tracks WHERE event_id IN (SELECT id FROM @packEvents);`);
L(`DELETE FROM prizes WHERE event_id IN (SELECT id FROM @packEvents);`);
L(`DELETE FROM event_schedules WHERE event_id IN (SELECT id FROM @packEvents);`);
L(`DELETE FROM allowed_email_domains WHERE event_id IN (SELECT id FROM @packEvents);`);
L(`DELETE FROM event_enrollments WHERE event_id IN (SELECT id FROM @packEvents);`);
L(`DELETE FROM hackathon_events WHERE id IN (SELECT id FROM @packEvents);`);
L(``);

// Staff
upsertUserSafe(uid(0, 0, 1), "demo.coord@fpt.edu.vn", "Demo Pack Coordinator", "EVENT_COORDINATOR", null, null);
upsertUserSafe(uid(0, 0, 2), "demo.mentor1@fpt.edu.vn", "Demo Mentor One", "LECTURER", null, null);
upsertUserSafe(uid(0, 0, 3), "demo.judge1@fpt.edu.vn", "Demo Judge One", "LECTURER", null, null);
upsertUserSafe(uid(0, 0, 4), "demo.judge2@fpt.edu.vn", "Demo Judge Two", "LECTURER", null, null);
upsertUserSafe(uid(0, 0, 5), "demo.judge3@fpt.edu.vn", "Demo Judge Three (Pending)", "LECTURER", null, null);
upsertUserSafe(uid(0, 0, 6), "demo.final.judge1@fpt.edu.vn", "Demo Final Judge One", "LECTURER", null, null);
upsertUserSafe(uid(0, 0, 7), "demo.final.judge2@fpt.edu.vn", "Demo Final Judge Two", "LECTURER", null, null);

// Students for events 2–7
for (let i = 1; i <= 5; i++) {
  upsertUserSafe(uid(2, 9, i), `demo.open.s${String(i).padStart(2, "0")}@fpt.edu.vn`, `Open Demo Student ${String(i).padStart(2, "0")}`, "FPT_STUDENT", `OP${2000 + i}`, 5);
}
for (let i = 1; i <= 30; i++) {
  upsertUserSafe(uid(3, 9, i), `demo.assign.s${String(i).padStart(2, "0")}@fpt.edu.vn`, `Assign Demo Student ${String(i).padStart(2, "0")}`, "FPT_STUDENT", `AS${2000 + i}`, 4 + ((i - 1) % 5));
}
for (let i = 1; i <= 6; i++) {
  upsertUserSafe(uid(4, 9, i), `demo.sub.s${String(i).padStart(2, "0")}@fpt.edu.vn`, `Submit Demo Student ${String(i).padStart(2, "0")}`, "FPT_STUDENT", `SB${2000 + i}`, 5);
}
for (let i = 1; i <= 9; i++) {
  upsertUserSafe(uid(5, 9, i), `demo.score.s${String(i).padStart(2, "0")}@fpt.edu.vn`, `Score Demo Student ${String(i).padStart(2, "0")}`, "FPT_STUDENT", `SC${2000 + i}`, 5);
}
for (let i = 1; i <= 12; i++) {
  upsertUserSafe(uid(6, 9, i), `demo.final.s${String(i).padStart(2, "0")}@fpt.edu.vn`, `Final Demo Student ${String(i).padStart(2, "0")}`, "FPT_STUDENT", `FN${2000 + i}`, 5);
}
for (let i = 1; i <= 3; i++) {
  upsertUserSafe(uid(7, 9, i), `demo.fb.s${String(i).padStart(2, "0")}@fpt.edu.vn`, `Feedback Demo Student ${String(i).padStart(2, "0")}`, "FPT_STUDENT", `FB${2000 + i}`, 5);
}

L(`DECLARE @coordId UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.coord@fpt.edu.vn');`);
L(`DECLARE @mentor1Id UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.mentor1@fpt.edu.vn');`);
L(`DECLARE @j1 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.judge1@fpt.edu.vn');`);
L(`DECLARE @j2 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.judge2@fpt.edu.vn');`);
L(`DECLARE @j3 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.judge3@fpt.edu.vn');`);
L(`DECLARE @fj1 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.final.judge1@fpt.edu.vn');`);
L(`DECLARE @fj2 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'demo.final.judge2@fpt.edu.vn');`);
L(``);
L(`IF NOT EXISTS (SELECT 1 FROM allowed_email_domains WHERE domain = N'fpt.edu.vn')`);
L(`  INSERT INTO allowed_email_domains (id, event_id, domain, university_label, organization_name, organization_type, active, created_at, updated_at)`);
L(`  VALUES (NEWID(), NULL, N'fpt.edu.vn', N'FPT University', N'FPT University', N'UNIVERSITY', 1, @now, @now);`);
L(``);

const eventCols = `id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at,
  avatar_url, require_awards_before_complete, score_scale_max`;

const addEvent = (id, name, status, s, e, ro, rd, desc, lb = 0) => {
  L(`INSERT INTO hackathon_events (${eventCols}) VALUES (`);
  L(`  '${id}', N'${esc(name)}', N'Summer', 2026,`);
  L(`  DATEADD(DAY, ${s}, @today), DATEADD(DAY, ${e}, @today),`);
  L(`  DATEADD(DAY, ${ro}, @today), DATEADD(DAY, ${rd}, @today),`);
  L(`  N'${esc(desc)}', N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',`);
  L(`  3, 5, 4, 8, @templateId, N'${status}', ${lb}, @coordId, N'demo.coord@fpt.edu.vn', @now, @now, NULL, 0, 100);`);
  L(`-- Domains: skipped per-event (DB has global UNIQUE on domain); ensure platform fpt.edu.vn once below.`);
};

const addTrack = (id, eventId, name) => {
  L(`INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, auto_generate_groups, created_at, updated_at, created_by)`);
  L(`VALUES ('${id}', '${eventId}', N'${esc(name)}', N'Demo track', NULL, N'OPEN', NULL, 0, @now, @now, N'demo.coord@fpt.edu.vn');`);
};

const addRounds = (eventId, prelimId, finalId, pStart, pSub, pScore, fStart, fSub, fScore, cutoff = 2) => {
  L(`INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, min_judges_per_round, created_at, updated_at, created_by) VALUES`);
  L(`  ('${prelimId}', '${eventId}', 1, N'Preliminary Round', N'PRELIMINARY', ${pStart}, ${pScore}, DATEADD(HOUR,-2,${pSub}), ${pSub}, ${pScore}, ${cutoff}, N'PER_TRACK_TOP_N', 40, 2, @now, @now, N'demo.coord@fpt.edu.vn'),`);
  L(`  ('${finalId}', '${eventId}', 2, N'Finals', N'FINAL', ${fStart}, ${fScore}, NULL, ${fSub}, ${fScore}, 4, N'FINALIST_POOL', 60, 2, @now, @now, N'demo.coord@fpt.edu.vn');`);
};

const addCriteria3 = (c1, c2, c3, roundId) => {
  L(`INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES`);
  L(`  ('${c1}', '${roundId}', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),`);
  L(`  ('${c2}', '${roundId}', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn'),`);
  L(`  ('${c3}', '${roundId}', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'demo.coord@fpt.edu.vn');`);
};

const enroll = (eventId, emailLike) => {
  L(`INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)`);
  L(`SELECT NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, '${eventId}', N'APPROVED', u.id, 1, 1`);
  L(`FROM users u WHERE u.email LIKE N'${esc(emailLike)}';`);
};

const team3 = (teamId, eventId, trackId, name, emails, assignTrack) => {
  const [lead, m2, m3] = emails;
  L(`DECLARE @L_${teamId.replace(/-/g, "")} UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'${lead}');`);
  L(`DECLARE @M2_${teamId.replace(/-/g, "")} UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'${m2}');`);
  L(`DECLARE @M3_${teamId.replace(/-/g, "")} UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'${m3}');`);
  if (assignTrack) {
    L(`INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)`);
    L(`VALUES ('${teamId}', @now, N'demo.coord@fpt.edu.vn', '${eventId}', @L_${teamId.replace(/-/g, "")}, N'${esc(name)}', N'CONFIRMED', '${trackId}', @now, N'MANUAL', @coordId, 0, N'Demo team.', 0);`);
  } else {
    L(`INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)`);
    L(`VALUES ('${teamId}', @now, N'demo.coord@fpt.edu.vn', '${eventId}', @L_${teamId.replace(/-/g, "")}, N'${esc(name)}', N'CONFIRMED', NULL, 0, N'Demo team.', 0);`);
  }
  L(`INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES`);
  L(`  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_${teamId.replace(/-/g, "")}, '${teamId}', '${eventId}'),`);
  L(`  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_${teamId.replace(/-/g, "")}, '${teamId}', '${eventId}'),`);
  L(`  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_${teamId.replace(/-/g, "")}, '${teamId}', '${eventId}');`);
};

// ── 1 OPEN empty ──
L(`-- ========== 1) OPEN empty ==========`);
addEvent(uid(1, 1, 1), "Demo 1 - Open Registration (Join Me)", "OPEN", 14, 21, -2, 10, "Empty OPEN event — enroll and create teams.");
addTrack(uid(1, 4, 1), uid(1, 1, 1), "Open Track");
addRounds(uid(1, 1, 1), uid(1, 3, 1), uid(1, 3, 2), "DATEADD(DAY,14,@now)", "DATEADD(DAY,14,@now)", "DATEADD(DAY,15,@now)", "DATEADD(DAY,16,@now)", "DATEADD(DAY,16,@now)", "DATEADD(DAY,17,@now)");
addCriteria3(uid(1, 6, 1), uid(1, 6, 2), uid(1, 6, 3), uid(1, 3, 1));
addCriteria3(uid(1, 6, 4), uid(1, 6, 5), uid(1, 6, 6), uid(1, 3, 2));
L(``);

// ── 2 OPEN + 5 students enrolled ──
L(`-- ========== 2) OPEN + 5 students ==========`);
addEvent(uid(2, 1, 1), "Demo 2 - Open Registration (5 Students)", "OPEN", 14, 21, -3, 7, "OPEN with 5 enrolled students looking for teams.");
addTrack(uid(2, 4, 1), uid(2, 1, 1), "Open Track");
addRounds(uid(2, 1, 1), uid(2, 3, 1), uid(2, 3, 2), "DATEADD(DAY,14,@now)", "DATEADD(DAY,14,@now)", "DATEADD(DAY,15,@now)", "DATEADD(DAY,16,@now)", "DATEADD(DAY,16,@now)", "DATEADD(DAY,17,@now)");
addCriteria3(uid(2, 6, 1), uid(2, 6, 2), uid(2, 6, 3), uid(2, 3, 1));
addCriteria3(uid(2, 6, 4), uid(2, 6, 5), uid(2, 6, 6), uid(2, 3, 2));
enroll(uid(2, 1, 1), "demo.open.s%@fpt.edu.vn");
L(``);

// ── 3 CLOSED_REGISTRATION 10 teams + mentor for MentorHub ──
L(`-- ========== 3) Assignment + MentorHub ==========`);
addEvent(uid(3, 1, 1), "Demo 3 - Assignment (10 Teams Closed Reg)", "CLOSED_REGISTRATION", 7, 8, -30, -1, "10 CONFIRMED teams. Most unassigned for Assignment QA; Team 01 pre-linked to mentor for MentorHub.");
addTrack(uid(3, 4, 1), uid(3, 1, 1), "Grounded Retrieval");
addTrack(uid(3, 4, 2), uid(3, 1, 1), "Agent Orchestration");
addRounds(uid(3, 1, 1), uid(3, 3, 1), uid(3, 3, 2), "DATEADD(DAY,7,@now)", "DATEADD(DAY,7,@now)", "DATEADD(DAY,8,@now)", "DATEADD(DAY,8,@now)", "DATEADD(DAY,8,@now)", "DATEADD(DAY,9,@now)");
addCriteria3(uid(3, 6, 1), uid(3, 6, 2), uid(3, 6, 3), uid(3, 3, 1));
addCriteria3(uid(3, 6, 4), uid(3, 6, 5), uid(3, 6, 6), uid(3, 3, 2));
L(`INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at, created_by)`);
L(`VALUES (NEWID(), '${uid(3, 1, 1)}', @mentor1Id, @now, @now, N'demo.coord@fpt.edu.vn');`);
L(`INSERT INTO mentor_assignments (id, created_at, created_by, assigned_at, mentor_user_id, track_id, event_id, team_id, active)`);
L(`VALUES (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, @mentor1Id, '${uid(3, 4, 1)}', '${uid(3, 1, 1)}', NULL, 1);`);
enroll(uid(3, 1, 1), "demo.assign.s%@fpt.edu.vn");
const teamNames = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa"];
for (let i = 0; i < 10; i++) {
  const a = i * 3 + 1;
  const emails = [a, a + 1, a + 2].map((n) => `demo.assign.s${String(n).padStart(2, "0")}@fpt.edu.vn`);
  // Team 1 assigned to track + mentor; rest unassigned for Assignment testing
  team3(uid(3, 2, i + 1), uid(3, 1, 1), uid(3, 4, 1), `Assign ${teamNames[i]}`, emails, i === 0);
}
L(`INSERT INTO mentor_teams (id, created_at, created_by, assigned_at, mentor_user_id, team_id)`);
L(`VALUES (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, @mentor1Id, '${uid(3, 2, 1)}');`);
L(``);

// ── 4 ACTIVE submission ──
L(`-- ========== 4) Submission phase ==========`);
addEvent(uid(4, 1, 1), "Demo 4 - Submission Phase (Prelim Open)", "ACTIVE", -1, 14, -40, -5, "ACTIVE with 2 rounds; Preliminary open for submission.");
addTrack(uid(4, 4, 1), uid(4, 1, 1), "Submission Track");
addRounds(
  uid(4, 1, 1),
  uid(4, 3, 1),
  uid(4, 3, 2),
  "DATEADD(HOUR,-6,@now)",
  "DATEADD(DAY,3,@now)",
  "DATEADD(DAY,5,@now)",
  "DATEADD(DAY,6,@now)",
  "DATEADD(DAY,6,@now)",
  "DATEADD(DAY,8,@now)",
);
addCriteria3(uid(4, 6, 1), uid(4, 6, 2), uid(4, 6, 3), uid(4, 3, 1));
addCriteria3(uid(4, 6, 4), uid(4, 6, 5), uid(4, 6, 6), uid(4, 3, 2));
enroll(uid(4, 1, 1), "demo.sub.s%@fpt.edu.vn");
team3(uid(4, 2, 1), uid(4, 1, 1), uid(4, 4, 1), "Submit Team Alpha", ["demo.sub.s01@fpt.edu.vn", "demo.sub.s02@fpt.edu.vn", "demo.sub.s03@fpt.edu.vn"], true);
team3(uid(4, 2, 2), uid(4, 1, 1), uid(4, 4, 1), "Submit Team Beta", ["demo.sub.s04@fpt.edu.vn", "demo.sub.s05@fpt.edu.vn", "demo.sub.s06@fpt.edu.vn"], true);
L(`INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at, created_by)`);
L(`VALUES (NEWID(), '${uid(4, 1, 1)}', @mentor1Id, @now, @now, N'demo.coord@fpt.edu.vn');`);
L(``);

// ── 5 SCORING deviation ──
L(`-- ========== 5) Scoring + deviation ==========`);
addEvent(uid(5, 1, 1), "Demo 5 - Scoring (1 Judge Pending / High Deviation)", "SCORING", -5, 21, -40, -10, "3 judges on prelim. Judge1+2 scored HIGH; Judge3 pending — score low to trigger deviation review.");
addTrack(uid(5, 4, 1), uid(5, 1, 1), "Scoring Track");
addRounds(
  uid(5, 1, 1),
  uid(5, 3, 1),
  uid(5, 3, 2),
  "DATEADD(DAY,-3,@now)",
  "DATEADD(DAY,-1,@now)",
  "DATEADD(DAY,10,@now)",
  "DATEADD(DAY,11,@now)",
  "DATEADD(DAY,11,@now)",
  "DATEADD(DAY,14,@now)",
);
addCriteria3(uid(5, 6, 1), uid(5, 6, 2), uid(5, 6, 3), uid(5, 3, 1));
addCriteria3(uid(5, 6, 4), uid(5, 6, 5), uid(5, 6, 6), uid(5, 3, 2));
L(`INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id, created_by) VALUES`);
L(`  (NEWID(), @now, @now, @j1, '${uid(5, 1, 1)}', N'demo.coord@fpt.edu.vn'),`);
L(`  (NEWID(), @now, @now, @j2, '${uid(5, 1, 1)}', N'demo.coord@fpt.edu.vn'),`);
L(`  (NEWID(), @now, @now, @j3, '${uid(5, 1, 1)}', N'demo.coord@fpt.edu.vn');`);
L(`INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active, created_by) VALUES`);
L(`  (NEWID(), @now, @now, @j1, '${uid(5, 3, 1)}', N'ROUND', 1, N'demo.coord@fpt.edu.vn'),`);
L(`  (NEWID(), @now, @now, @j2, '${uid(5, 3, 1)}', N'ROUND', 1, N'demo.coord@fpt.edu.vn'),`);
L(`  (NEWID(), @now, @now, @j3, '${uid(5, 3, 1)}', N'ROUND', 1, N'demo.coord@fpt.edu.vn');`);
enroll(uid(5, 1, 1), "demo.score.s%@fpt.edu.vn");
for (let t = 1; t <= 3; t++) {
  const a = (t - 1) * 3 + 1;
  const emails = [a, a + 1, a + 2].map((n) => `demo.score.s${String(n).padStart(2, "0")}@fpt.edu.vn`);
  const teamId = uid(5, 2, t);
  const subId = uid(5, 5, t);
  const verId = uid(5, 7, t);
  team3(teamId, uid(5, 1, 1), uid(5, 4, 1), `Score Team ${String(t).padStart(2, "0")}`, emails, true);
  L(`INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)`);
  L(`VALUES ('${subId}', @now, N'demo.coord@fpt.edu.vn', NULL, '${uid(5, 3, 1)}', N'SUBMITTED', (SELECT id FROM users WHERE email=N'${emails[0]}'), '${teamId}', 0);`);
  L(`INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)`);
  L(`VALUES ('${verId}', @now, N'demo.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/score-${t}', N'https://docs.google.com/presentation/d/score-${t}', NULL, DATEADD(HOUR,-12,@now), 1, '${subId}');`);
  L(`UPDATE submissions SET current_version_id='${verId}' WHERE id='${subId}';`);
  // Judge1 + Judge2 HIGH scores (~95–100 on 1–100 scale) so judge3 scoring low triggers deviation
  for (const [ji, jvar] of [
    [1, "@j1"],
    [2, "@j2"],
  ]) {
    const scoreId = uid(5, 8, t * 10 + ji);
    L(`INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)`);
    L(`VALUES ('${scoreId}', @now, N'demo.coord@fpt.edu.vn', DATEADD(HOUR,-2,@now), ${jvar}, '${uid(5, 3, 1)}', DATEADD(HOUR,-3,@now), N'COMPLETED', '${subId}', 0);`);
    L(`INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES`);
    L(`  (NEWID(), @now, N'demo.coord@fpt.edu.vn', '${uid(5, 6, 1)}', 95, '${scoreId}'),`);
    L(`  (NEWID(), @now, N'demo.coord@fpt.edu.vn', '${uid(5, 6, 2)}', 98, '${scoreId}'),`);
    L(`  (NEWID(), @now, N'demo.coord@fpt.edu.vn', '${uid(5, 6, 3)}', 100, '${scoreId}');`);
  }
}
L(``);

// ── 6 Final advancement ──
L(`-- ========== 6) Final advancement / LiveScore ==========`);
addEvent(uid(6, 1, 1), "Demo 6 - Final Advancement (Prelim Done)", "SCORING", -5, 30, -40, -10, "Prelim fully scored+ranked. Select Finalists then score Final with guest judges.");
addTrack(uid(6, 4, 1), uid(6, 1, 1), "Final Track");
L(`IF COL_LENGTH('dbo.competition_groups','event_id') IS NOT NULL AND COL_LENGTH('dbo.competition_groups','sort_order') IS NOT NULL`);
L(`  INSERT INTO competition_groups (id, track_id, event_id, name, max_teams, sort_order, created_at, updated_at, created_by)`);
L(`  VALUES ('${uid(6, 10, 1)}', '${uid(6, 4, 1)}', '${uid(6, 1, 1)}', N'Group A', 10, 0, @now, @now, N'demo.coord@fpt.edu.vn'),`);
L(`         ('${uid(6, 10, 2)}', '${uid(6, 4, 1)}', '${uid(6, 1, 1)}', N'Group B', 10, 1, @now, @now, N'demo.coord@fpt.edu.vn');`);
L(`ELSE`);
L(`  INSERT INTO competition_groups (id, track_id, name, created_at, updated_at, created_by)`);
L(`  VALUES ('${uid(6, 10, 1)}', '${uid(6, 4, 1)}', N'Group A', @now, @now, N'demo.coord@fpt.edu.vn'),`);
L(`         ('${uid(6, 10, 2)}', '${uid(6, 4, 1)}', N'Group B', @now, @now, N'demo.coord@fpt.edu.vn');`);
addRounds(
  uid(6, 1, 1),
  uid(6, 3, 1),
  uid(6, 3, 2),
  "DATEADD(DAY,-5,@now)",
  "DATEADD(DAY,-3,@now)",
  "DATEADD(HOUR,-6,@now)",
  "DATEADD(HOUR,-1,@now)",
  "DATEADD(HOUR,-1,@now)",
  "DATEADD(DAY,14,@now)",
  1,
);
addCriteria3(uid(6, 6, 1), uid(6, 6, 2), uid(6, 6, 3), uid(6, 3, 1));
addCriteria3(uid(6, 6, 4), uid(6, 6, 5), uid(6, 6, 6), uid(6, 3, 2));
L(`INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id, created_by) VALUES`);
L(`  (NEWID(), @now, @now, @j1, '${uid(6, 1, 1)}', N'demo.coord@fpt.edu.vn'),`);
L(`  (NEWID(), @now, @now, @j2, '${uid(6, 1, 1)}', N'demo.coord@fpt.edu.vn'),`);
L(`  (NEWID(), @now, @now, @fj1, '${uid(6, 1, 1)}', N'demo.coord@fpt.edu.vn'),`);
L(`  (NEWID(), @now, @now, @fj2, '${uid(6, 1, 1)}', N'demo.coord@fpt.edu.vn');`);
L(`INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active, created_by) VALUES`);
L(`  (NEWID(), @now, @now, @j1, '${uid(6, 3, 1)}', N'ROUND', 1, N'demo.coord@fpt.edu.vn'),`);
L(`  (NEWID(), @now, @now, @j2, '${uid(6, 3, 1)}', N'ROUND', 1, N'demo.coord@fpt.edu.vn'),`);
L(`  (NEWID(), @now, @now, @fj1, '${uid(6, 3, 2)}', N'ROUND', 1, N'demo.coord@fpt.edu.vn'),`);
L(`  (NEWID(), @now, @now, @fj2, '${uid(6, 3, 2)}', N'ROUND', 1, N'demo.coord@fpt.edu.vn');`);
enroll(uid(6, 1, 1), "demo.final.s%@fpt.edu.vn");
for (let t = 1; t <= 4; t++) {
  const a = (t - 1) * 3 + 1;
  const emails = [a, a + 1, a + 2].map((n) => `demo.final.s${String(n).padStart(2, "0")}@fpt.edu.vn`);
  const teamId = uid(6, 2, t);
  const groupId = t <= 2 ? uid(6, 10, 1) : uid(6, 10, 2);
  const subId = uid(6, 5, t);
  const verId = uid(6, 7, t);
  const tag = teamId.replace(/-/g, "");
  L(`DECLARE @L_${tag} UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'${emails[0]}');`);
  L(`DECLARE @M2_${tag} UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'${emails[1]}');`);
  L(`DECLARE @M3_${tag} UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'${emails[2]}');`);
  L(`INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)`);
  L(`VALUES ('${teamId}', @now, N'demo.coord@fpt.edu.vn', '${uid(6, 1, 1)}', @L_${tag}, N'Final Team ${String(t).padStart(2, "0")}', N'CONFIRMED', '${uid(6, 4, 1)}', '${groupId}', @now, N'MANUAL', @coordId, 0, N'Demo.', 0);`);
  L(`INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES`);
  L(`  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'LEADER', @L_${tag}, '${teamId}', '${uid(6, 1, 1)}'),`);
  L(`  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M2_${tag}, '${teamId}', '${uid(6, 1, 1)}'),`);
  L(`  (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, N'MEMBER', @M3_${tag}, '${teamId}', '${uid(6, 1, 1)}');`);
  L(`INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)`);
  L(`VALUES ('${subId}', @now, N'demo.coord@fpt.edu.vn', NULL, '${uid(6, 3, 1)}', N'SCORED', @L_${tag}, '${teamId}', 0);`);
  L(`INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)`);
  L(`VALUES ('${verId}', @now, N'demo.coord@fpt.edu.vn', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/final-${t}', N'https://docs.google.com/presentation/d/final-${t}', NULL, DATEADD(DAY,-3,@now), 1, '${subId}');`);
  L(`UPDATE submissions SET current_version_id='${verId}' WHERE id='${subId}';`);
  // Both prelim judges score with descending totals on 1–100 scale so ranking is clear
  for (const [ji, jvar] of [
    [1, "@j1"],
    [2, "@j2"],
  ]) {
    const scoreId = uid(6, 8, t * 10 + ji);
    const base = 95 - (t - 1) * 15; // team1=95, team2=80, team3=65, team4=50
    L(`INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)`);
    L(`VALUES ('${scoreId}', @now, N'demo.coord@fpt.edu.vn', DATEADD(HOUR,-8,@now), ${jvar}, '${uid(6, 3, 1)}', DATEADD(HOUR,-10,@now), N'COMPLETED', '${subId}', 0);`);
    L(`INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES`);
    L(`  (NEWID(), @now, N'demo.coord@fpt.edu.vn', '${uid(6, 6, 1)}', ${base}, '${scoreId}'),`);
    L(`  (NEWID(), @now, N'demo.coord@fpt.edu.vn', '${uid(6, 6, 2)}', ${base}, '${scoreId}'),`);
    L(`  (NEWID(), @now, N'demo.coord@fpt.edu.vn', '${uid(6, 6, 3)}', ${Math.max(1, base - 5)}, '${scoreId}');`);
  }
  // Rankings for LiveScore (columns: final_score, rank)
  L(`INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)`);
  L(`VALUES (NEWID(), @now, N'demo.coord@fpt.edu.vn', @now, ${90 - t * 10}.00, ${t}, '${uid(6, 3, 1)}', '${teamId}', 1, 0, @now);`);
}
L(``);

// ── 7 COMPLETED feedback ──
L(`-- ========== 7) Completed + feedback ==========`);
addEvent(uid(7, 1, 1), "Demo 7 - Completed (Feedback Ready)", "COMPLETED", -60, -30, -90, -70, "COMPLETED event — participants can submit post-event feedback.", 1);
addTrack(uid(7, 4, 1), uid(7, 1, 1), "Feedback Track");
addRounds(
  uid(7, 1, 1),
  uid(7, 3, 1),
  uid(7, 3, 2),
  "DATEADD(DAY,-55,@now)",
  "DATEADD(DAY,-50,@now)",
  "DATEADD(DAY,-45,@now)",
  "DATEADD(DAY,-40,@now)",
  "DATEADD(DAY,-38,@now)",
  "DATEADD(DAY,-35,@now)",
);
addCriteria3(uid(7, 6, 1), uid(7, 6, 2), uid(7, 6, 3), uid(7, 3, 1));
addCriteria3(uid(7, 6, 4), uid(7, 6, 5), uid(7, 6, 6), uid(7, 3, 2));
enroll(uid(7, 1, 1), "demo.fb.s%@fpt.edu.vn");
team3(uid(7, 2, 1), uid(7, 1, 1), uid(7, 4, 1), "Feedback Team", ["demo.fb.s01@fpt.edu.vn", "demo.fb.s02@fpt.edu.vn", "demo.fb.s03@fpt.edu.vn"], true);
L(`IF OBJECT_ID(N'dbo.participation_certificates', N'U') IS NOT NULL`);
L(`BEGIN`);
L(`  INSERT INTO participation_certificates (id, created_at, created_by, event_id, user_id, team_id, issued_at)`);
L(`  SELECT NEWID(), @now, N'demo.coord@fpt.edu.vn', '${uid(7, 1, 1)}', u.id, '${uid(7, 2, 1)}', @now`);
L(`  FROM users u WHERE u.email LIKE N'demo.fb.s%@fpt.edu.vn';`);
L(`END`);
L(``);

L(`COMMIT TRANSACTION;`);
L(``);
L(`PRINT '=== Feature demo pack ready (password Demo@123456) ===';`);
L(`PRINT '1 OPEN empty:     Demo 1 - Open Registration (Join Me)';`);
L(`PRINT '2 OPEN 5 students: demo.open.s01..s05@fpt.edu.vn';`);
L(`PRINT '3 Assignment:     demo.assign.s01 (leader Alpha) | mentor demo.mentor1@fpt.edu.vn';`);
L(`PRINT '4 Submission:     demo.sub.s01@fpt.edu.vn (leader Submit Team Alpha)';`);
L(`PRINT '5 Scoring:        demo.judge3 PENDING | demo.judge1/2 HIGH done';`);
L(`PRINT '6 Final:          demo.final.judge1/2@fpt.edu.vn | Select Finalists first';`);
L(`PRINT '7 Feedback:       demo.fb.s01@fpt.edu.vn';`);

const out = path.join(__dirname, "seed_feature_demo_pack.sql");
fs.writeFileSync(out, lines.join("\n") + "\n", "utf8");
try {
  fs.unlinkSync(path.join(__dirname, "_tmp_check.txt"));
} catch {}
console.log(`Wrote ${out} (${lines.length} lines)`);
