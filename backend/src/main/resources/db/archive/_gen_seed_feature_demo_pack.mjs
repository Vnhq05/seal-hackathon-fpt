/**
 * Generate seed_feature_demo_pack.sql — 8 demo events for feature QA.
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
const COORD = "test.coord@fpt.edu.vn";

/** event 1..8 (or 0=staff), kind 0..FF, seq */
const uid = (event, kind, seq) => {
  const e = Number(event).toString(16).padStart(2, "0");
  const k = Number(kind).toString(16).padStart(2, "0");
  const s = Number(seq).toString(16).padStart(12, "0");
  return `FE${e}${k}00-EEEE-4EEE-8EEE-${s}`.toUpperCase();
};

const lines = [];
const L = (s = "") => lines.push(s);
const esc = (s) => String(s).replace(/'/g, "''");

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

L(`-- Feature demo pack: 8 events (registration → assignment → submission → deadline alert → scoring → final → feedback).`);
L(`-- Password for ALL accounts: Demo@123456`);
L(`-- Regenerate: node _gen_seed_feature_demo_pack.mjs`);
L(`-- Run: sqlcmd -S localhost -U sa -P <pwd> -C -d SEAL -f 65001 -I -i seed_feature_demo_pack.sql`);
L(``);
L(`SET NOCOUNT ON; SET QUOTED_IDENTIFIER ON; SET ANSI_NULLS ON; SET XACT_ABORT ON;`);
L(`BEGIN TRANSACTION;`);
L(``);
L(`DECLARE @pwd NVARCHAR(255) = N'${PWD}';`);
// App compares stored LocalDateTime against server-local now, so seed relative to SYSDATETIME().
L(`DECLARE @now DATETIME2 = SYSDATETIME();`);
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
for (let e = 1; e <= 8; e++) L(`INSERT INTO @packEvents VALUES ('${uid(e, 1, 1)}');`);
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
L(`-- Progress-alert notifications for pack teams`);
L(`DELETE FROM notification_recipients WHERE notification_id IN (`);
L(`  SELECT id FROM notifications WHERE type = N'TEAM_PROGRESS_ALERT' AND reference_id IN (SELECT id FROM @packTeams));`);
L(`DELETE FROM notifications WHERE type = N'TEAM_PROGRESS_ALERT' AND reference_id IN (SELECT id FROM @packTeams);`);
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

// Staff — default Add Lecture pool: 7 mentors + 7 judges (+ 2 final-only judges)
upsertUserSafe(uid(0, 0, 1), COORD, "Test Coord", "EVENT_COORDINATOR", null, null);
const MENTOR_ORDINALS = ["One", "Two", "Three", "Four", "Five", "Six", "Seven"];
const JUDGE_ORDINALS = ["One", "Two", "Three (Pending)", "Four", "Five", "Six", "Seven"];
// Stable demo UUIDs (seq): mentors 2,8-13 | judges 3-5,14-17 | final judges 6-7
const MENTOR_SEQS = [2, 8, 9, 10, 11, 12, 13];
const JUDGE_SEQS = [3, 4, 5, 14, 15, 16, 17];
for (let i = 0; i < 7; i++) {
  upsertUserSafe(
    uid(0, 0, MENTOR_SEQS[i]),
    `test.mentor${i + 1}@fpt.edu.vn`,
    `Test Mentor ${MENTOR_ORDINALS[i]}`,
    "LECTURER",
    null,
    null,
  );
}
for (let i = 0; i < 7; i++) {
  upsertUserSafe(
    uid(0, 0, JUDGE_SEQS[i]),
    `test.judge${i + 1}@fpt.edu.vn`,
    `Test Judge ${JUDGE_ORDINALS[i]}`,
    "LECTURER",
    null,
    null,
  );
}
upsertUserSafe(uid(0, 0, 6), "test.final.judge1@fpt.edu.vn", "Test Final Judge One", "LECTURER", null, null);
upsertUserSafe(uid(0, 0, 7), "test.final.judge2@fpt.edu.vn", "Test Final Judge Two", "LECTURER", null, null);

// Students — 30 per event that needs 10 teams (3 members each); Test 1 empty; Test 2 has 5 looking-for-team
for (let i = 1; i <= 5; i++) {
  upsertUserSafe(uid(2, 9, i), `test.open.s${String(i).padStart(2, "0")}@fpt.edu.vn`, `Test Open Student ${String(i).padStart(2, "0")}`, "FPT_STUDENT", `OP${2000 + i}`, 5);
}
for (let i = 1; i <= 30; i++) {
  upsertUserSafe(uid(3, 9, i), `test.assign.s${String(i).padStart(2, "0")}@fpt.edu.vn`, `Test Assign Student ${String(i).padStart(2, "0")}`, "FPT_STUDENT", `AS${2000 + i}`, 4 + ((i - 1) % 5));
}
for (let i = 1; i <= 30; i++) {
  upsertUserSafe(uid(4, 9, i), `test.sub.s${String(i).padStart(2, "0")}@fpt.edu.vn`, `Test Sub Student ${String(i).padStart(2, "0")}`, "FPT_STUDENT", `SB${2000 + i}`, 5);
}
for (let i = 1; i <= 30; i++) {
  upsertUserSafe(uid(5, 9, i), `test.alert.s${String(i).padStart(2, "0")}@fpt.edu.vn`, `Test Alert Student ${String(i).padStart(2, "0")}`, "FPT_STUDENT", `AL${2000 + i}`, 5);
}
for (let i = 1; i <= 30; i++) {
  upsertUserSafe(uid(6, 9, i), `test.score.s${String(i).padStart(2, "0")}@fpt.edu.vn`, `Test Score Student ${String(i).padStart(2, "0")}`, "FPT_STUDENT", `SC${2000 + i}`, 5);
}
for (let i = 1; i <= 30; i++) {
  upsertUserSafe(uid(7, 9, i), `test.final.s${String(i).padStart(2, "0")}@fpt.edu.vn`, `Test Final Student ${String(i).padStart(2, "0")}`, "FPT_STUDENT", `FN${2000 + i}`, 5);
}
for (let i = 1; i <= 30; i++) {
  upsertUserSafe(uid(8, 9, i), `test.fb.s${String(i).padStart(2, "0")}@fpt.edu.vn`, `Test Feedback Student ${String(i).padStart(2, "0")}`, "FPT_STUDENT", `FB${2000 + i}`, 5);
}

L(`DECLARE @coordId UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'${COORD}');`);
L(`DECLARE @mentor1Id UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.mentor1@fpt.edu.vn');`);
L(`DECLARE @j1 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.judge1@fpt.edu.vn');`);
L(`DECLARE @j2 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.judge2@fpt.edu.vn');`);
L(`DECLARE @j3 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.judge3@fpt.edu.vn');`);
L(`DECLARE @fj1 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.judge1@fpt.edu.vn');`);
L(`DECLARE @fj2 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.final.judge2@fpt.edu.vn');`);
L(``);

/** Default Add Lecture roster — 7 judges + 7 mentors (idempotent). */
const addLecturePool = (eventId) => {
  L(`INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id, created_by)`);
  L(`SELECT NEWID(), @now, @now, j.id, '${eventId}', N'${COORD}'`);
  L(`FROM (VALUES`);
  for (let i = 1; i <= 7; i++) {
    L(`  (N'test.judge${i}@fpt.edu.vn')${i < 7 ? "," : ""}`);
  }
  L(`) v(email) INNER JOIN users j ON j.email = v.email`);
  L(`WHERE NOT EXISTS (SELECT 1 FROM event_judge_assignments x WHERE x.event_id = '${eventId}' AND x.judge_user_id = j.id);`);
  L(`INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at, created_by)`);
  L(`SELECT NEWID(), '${eventId}', m.id, @now, @now, N'${COORD}'`);
  L(`FROM (VALUES`);
  for (let i = 1; i <= 7; i++) {
    L(`  (N'test.mentor${i}@fpt.edu.vn')${i < 7 ? "," : ""}`);
  }
  L(`) v(email) INNER JOIN users m ON m.email = v.email`);
  L(`WHERE NOT EXISTS (SELECT 1 FROM event_mentor_assignments x WHERE x.event_id = '${eventId}' AND x.mentor_user_id = m.id);`);
};
L(`IF NOT EXISTS (SELECT 1 FROM allowed_email_domains WHERE domain = N'fpt.edu.vn')`);
L(`  INSERT INTO allowed_email_domains (id, event_id, domain, university_label, created_at, updated_at)`);
L(`  VALUES (NEWID(), NULL, N'fpt.edu.vn', N'FPT University', @now, @now);`);
L(``);

const eventCols = `id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,
  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,
  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at,
  avatar_url, score_scale_max`;

const addEvent = (id, name, status, s, e, ro, rd, desc, lb = 0) => {
  L(`INSERT INTO hackathon_events (${eventCols}) VALUES (`);
  L(`  '${id}', N'${esc(name)}', N'Summer', 2026,`);
  L(`  DATEADD(DAY, ${s}, @today), DATEADD(DAY, ${e}, @today),`);
  L(`  DATEADD(DAY, ${ro}, @today), DATEADD(DAY, ${rd}, @today),`);
  L(`  N'${esc(desc)}', N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',`);
  L(`  3, 5, 4, 8, @templateId, N'${status}', ${lb}, @coordId, N'${COORD}', @now, @now, NULL, 100);`);
};

const addTrack = (id, eventId, name) => {
  L(`INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, created_at, updated_at, created_by)`);
  L(`VALUES ('${id}', '${eventId}', N'${esc(name)}', N'Test track', NULL, N'OPEN', NULL, @now, @now, N'${COORD}');`);
};

const addRounds = (eventId, prelimId, finalId, pStart, pSub, pScore, fStart, fSub, fScore, cutoff = 2) => {
  L(`INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, min_judges_per_round, created_at, updated_at, created_by) VALUES`);
  L(`  ('${prelimId}', '${eventId}', 1, N'Preliminary Round', N'PRELIMINARY', ${pStart}, ${pScore}, DATEADD(HOUR,-2,${pSub}), ${pSub}, ${pScore}, ${cutoff}, N'PER_TRACK_TOP_N', 40, 2, @now, @now, N'${COORD}'),`);
  L(`  ('${finalId}', '${eventId}', 2, N'Finals', N'FINAL', ${fStart}, ${fScore}, NULL, ${fSub}, ${fScore}, 4, N'FINALIST_POOL', 60, 2, @now, @now, N'${COORD}');`);
};

const addCriteria3 = (c1, c2, c3, roundId) => {
  L(`INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES`);
  L(`  ('${c1}', '${roundId}', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, N'${COORD}'),`);
  L(`  ('${c2}', '${roundId}', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, N'${COORD}'),`);
  L(`  ('${c3}', '${roundId}', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, N'${COORD}');`);
};

const enroll = (eventId, emailLike) => {
  L(`INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)`);
  L(`SELECT NEWID(), @now, N'${COORD}', @now, '${eventId}', N'APPROVED', u.id, 1, 1`);
  L(`FROM users u WHERE u.email LIKE N'${esc(emailLike)}';`);
};

const team3 = (teamId, eventId, trackId, name, emails, assignTrack) => {
  const [lead, m2, m3] = emails;
  L(`DECLARE @L_${teamId.replace(/-/g, "")} UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'${lead}');`);
  L(`DECLARE @M2_${teamId.replace(/-/g, "")} UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'${m2}');`);
  L(`DECLARE @M3_${teamId.replace(/-/g, "")} UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'${m3}');`);
  if (assignTrack) {
    L(`INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)`);
    L(`VALUES ('${teamId}', @now, N'${COORD}', '${eventId}', @L_${teamId.replace(/-/g, "")}, N'${esc(name)}', N'CONFIRMED', '${trackId}', @now, N'MANUAL', @coordId, 0, N'Test team.', 0);`);
  } else {
    L(`INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, is_recruiting, recruitment_note, version)`);
    L(`VALUES ('${teamId}', @now, N'${COORD}', '${eventId}', @L_${teamId.replace(/-/g, "")}, N'${esc(name)}', N'CONFIRMED', NULL, 0, N'Test team.', 0);`);
  }
  L(`INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES`);
  L(`  (NEWID(), @now, N'${COORD}', @now, N'LEADER', @L_${teamId.replace(/-/g, "")}, '${teamId}', '${eventId}'),`);
  L(`  (NEWID(), @now, N'${COORD}', @now, N'MEMBER', @M2_${teamId.replace(/-/g, "")}, '${teamId}', '${eventId}'),`);
  L(`  (NEWID(), @now, N'${COORD}', @now, N'MEMBER', @M3_${teamId.replace(/-/g, "")}, '${teamId}', '${eventId}');`);
};

const TEAM_NAMES = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa"];

/** Shared full submission artifacts for Test 4/5 (6 teams) and Test 6 (all 10). */
const SUBMITTED_TEAMS = 6;
const SEED_SLIDE_URL =
  "https://docs.google.com/document/d/1lrOba5QRuUMF5JogHsgUnx7rTOawC9obxPZghtgN08U/edit?pli=1&tab=t.0";
const SEED_SOURCE_URL = "https://github.com/QuynhPM2706/SEAL_HACKATHON_FPT";
const SEED_OTHER_URL =
  "https://www.youtube.com/watch?v=yh2h_YwILII&list=RDyh2h_YwILII&start_radio=1";
const SEED_FILE_NAME = "Blue Modern Artificial Intelligence Presentation.pdf";
const SEED_FILE_SAFE = "Blue_Modern_Artificial_Intelligence_Presentation.pdf";
const SEED_FILE_URL = `/api/files/submissions/seed/${SEED_FILE_SAFE}`;
const SEED_FILE_SOURCE = "C:\\Users\\Admin\\Downloads\\Blue Modern Artificial Intelligence Presentation.pdf";
let SEED_FILE_SIZE = 1444161;
try {
  SEED_FILE_SIZE = fs.statSync(SEED_FILE_SOURCE).size;
} catch {
  // keep default if generator runs without the local PDF
}

// ── 1 OPEN empty ──
L(`-- ========== 1) OPEN empty ==========`);
addEvent(uid(1, 1, 1), "Test 1 - Open Registration (Join Me)", "OPEN", 14, 21, -2, 10, "Empty OPEN event — enroll and create teams.");
addTrack(uid(1, 4, 1), uid(1, 1, 1), "Open Track");
addRounds(uid(1, 1, 1), uid(1, 3, 1), uid(1, 3, 2), "DATEADD(DAY,14,@now)", "DATEADD(DAY,14,@now)", "DATEADD(DAY,15,@now)", "DATEADD(DAY,16,@now)", "DATEADD(DAY,16,@now)", "DATEADD(DAY,17,@now)");
addCriteria3(uid(1, 6, 1), uid(1, 6, 2), uid(1, 6, 3), uid(1, 3, 1));
addCriteria3(uid(1, 6, 4), uid(1, 6, 5), uid(1, 6, 6), uid(1, 3, 2));
L(``);

// ── 2 OPEN + 5 students enrolled ──
L(`-- ========== 2) OPEN + 5 students ==========`);
addEvent(uid(2, 1, 1), "Test 2 - Open Registration (5 Students)", "OPEN", 14, 21, -3, 7, "OPEN with 5 enrolled students looking for teams.");
addTrack(uid(2, 4, 1), uid(2, 1, 1), "Open Track");
addRounds(uid(2, 1, 1), uid(2, 3, 1), uid(2, 3, 2), "DATEADD(DAY,14,@now)", "DATEADD(DAY,14,@now)", "DATEADD(DAY,15,@now)", "DATEADD(DAY,16,@now)", "DATEADD(DAY,16,@now)", "DATEADD(DAY,17,@now)");
addCriteria3(uid(2, 6, 1), uid(2, 6, 2), uid(2, 6, 3), uid(2, 3, 1));
addCriteria3(uid(2, 6, 4), uid(2, 6, 5), uid(2, 6, 6), uid(2, 3, 2));
L(`INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)`);
L(`SELECT NEWID(), @now, N'${COORD}', @now, '${uid(2, 1, 1)}', N'APPROVED', u.id, 1, 1`);
L(`FROM users u WHERE u.email IN (`);
L(`  N'test.open.s01@fpt.edu.vn', N'test.open.s02@fpt.edu.vn', N'test.open.s03@fpt.edu.vn',`);
L(`  N'test.open.s04@fpt.edu.vn', N'test.open.s05@fpt.edu.vn');`);
L(`DELETE FROM users WHERE email LIKE N'test.open.s%@fpt.edu.vn'`);
L(`  AND email NOT IN (N'test.open.s01@fpt.edu.vn', N'test.open.s02@fpt.edu.vn', N'test.open.s03@fpt.edu.vn', N'test.open.s04@fpt.edu.vn', N'test.open.s05@fpt.edu.vn');`);
L(`DELETE FROM users WHERE email LIKE N'test.t1.s%@fpt.edu.vn';`);
L(``);

// ── 3 CLOSED_REGISTRATION 10 teams + mentor for MentorHub ──
L(`-- ========== 3) Assignment + MentorHub ==========`);
addEvent(uid(3, 1, 1), "Test 3 - Assignment (10 Teams Closed Reg)", "CLOSED_REGISTRATION", 7, 8, -30, -1, "10 CONFIRMED teams. Most unassigned for Assignment QA; Team 01 pre-linked to mentor for MentorHub.");
addTrack(uid(3, 4, 1), uid(3, 1, 1), "Grounded Retrieval");
addTrack(uid(3, 4, 2), uid(3, 1, 1), "Agent Orchestration");
addRounds(uid(3, 1, 1), uid(3, 3, 1), uid(3, 3, 2), "DATEADD(DAY,7,@now)", "DATEADD(DAY,7,@now)", "DATEADD(DAY,8,@now)", "DATEADD(DAY,8,@now)", "DATEADD(DAY,8,@now)", "DATEADD(DAY,9,@now)");
addCriteria3(uid(3, 6, 1), uid(3, 6, 2), uid(3, 6, 3), uid(3, 3, 1));
addCriteria3(uid(3, 6, 4), uid(3, 6, 5), uid(3, 6, 6), uid(3, 3, 2));
L(`INSERT INTO mentor_assignments (id, created_at, created_by, assigned_at, mentor_user_id, track_id, event_id)`);
L(`VALUES (NEWID(), @now, N'${COORD}', @now, @mentor1Id, '${uid(3, 4, 1)}', '${uid(3, 1, 1)}');`);
enroll(uid(3, 1, 1), "test.assign.s%@fpt.edu.vn");
for (let i = 0; i < 10; i++) {
  const a = i * 3 + 1;
  const emails = [a, a + 1, a + 2].map((n) => `test.assign.s${String(n).padStart(2, "0")}@fpt.edu.vn`);
  team3(uid(3, 2, i + 1), uid(3, 1, 1), uid(3, 4, 1), `Assign ${TEAM_NAMES[i]}`, emails, i === 0);
}
L(`INSERT INTO mentor_teams (id, created_at, created_by, assigned_at, mentor_user_id, team_id)`);
L(`VALUES (NEWID(), @now, N'${COORD}', @now, @mentor1Id, '${uid(3, 2, 1)}');`);
L(``);

// ── 4 ACTIVE submission ──
L(`-- ========== 4) Submission phase ==========`);
addEvent(uid(4, 1, 1), "Test 4 - Submission Phase (Prelim Open)", "ACTIVE", -1, 14, -40, -5, "ACTIVE with 10 teams; 6 teams fully submitted (Slide+GitHub+Other link+file); 4 teams not started.");
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
enroll(uid(4, 1, 1), "test.sub.s%@fpt.edu.vn");
for (let i = 0; i < 10; i++) {
  const a = i * 3 + 1;
  const emails = [a, a + 1, a + 2].map((n) => `test.sub.s${String(n).padStart(2, "0")}@fpt.edu.vn`);
  team3(uid(4, 2, i + 1), uid(4, 1, 1), uid(4, 4, 1), `Submit ${TEAM_NAMES[i]}`, emails, true);
}
for (let t = 1; t <= SUBMITTED_TEAMS; t++) {
  const emails = [(t - 1) * 3 + 1, (t - 1) * 3 + 2, (t - 1) * 3 + 3].map(
    (n) => `test.sub.s${String(n).padStart(2, "0")}@fpt.edu.vn`,
  );
  const teamId = uid(4, 2, t);
  const subId = uid(4, 5, t);
  const verId = uid(4, 7, t);
  const attId = uid(4, 9, t);
  L(`INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)`);
  L(`VALUES ('${subId}', @now, N'${COORD}', NULL, '${uid(4, 3, 1)}', N'SUBMITTED', (SELECT id FROM users WHERE email=N'${emails[0]}'), '${teamId}', 0);`);
  L(`INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)`);
  L(`VALUES ('${verId}', @now, N'${COORD}', N'${esc(SEED_OTHER_URL)}', N'${esc(SEED_SOURCE_URL)}', N'${esc(SEED_SLIDE_URL)}', N'${esc(SEED_OTHER_URL)}', DATEADD(HOUR,-${t},@now), 1, '${subId}');`);
  L(`UPDATE submissions SET current_version_id='${verId}' WHERE id='${subId}';`);
  L(`INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)`);
  L(`VALUES ('${attId}', @now, N'${COORD}', N'${esc(SEED_FILE_NAME)}', ${SEED_FILE_SIZE}, N'${esc(SEED_FILE_URL)}', NULL, N'application/pdf', '${verId}');`);
}
L(``);

// ── 5 Near deadline alert (within 6h lead-time) ──
L(`-- ========== 5) Near deadline alert ==========`);
addEvent(uid(5, 1, 1), "Test 5 - Near Deadline Alert (Not Submitted)", "ACTIVE", -1, 3, -20, -2, "ACTIVE prelim; 10 teams; 6 submitted full; 4 not started; deadline ~3h; alert on Eta (not submitted).");
addTrack(uid(5, 4, 1), uid(5, 1, 1), "Alert Track");
addRounds(
  uid(5, 1, 1),
  uid(5, 3, 1),
  uid(5, 3, 2),
  "DATEADD(HOUR,-2,@now)",
  "DATEADD(HOUR,3,@now)",
  "DATEADD(DAY,2,@now)",
  "DATEADD(DAY,3,@now)",
  "DATEADD(DAY,3,@now)",
  "DATEADD(DAY,5,@now)",
);
addCriteria3(uid(5, 6, 1), uid(5, 6, 2), uid(5, 6, 3), uid(5, 3, 1));
addCriteria3(uid(5, 6, 4), uid(5, 6, 5), uid(5, 6, 6), uid(5, 3, 2));
enroll(uid(5, 1, 1), "test.alert.s%@fpt.edu.vn");
for (let i = 0; i < 10; i++) {
  const a = i * 3 + 1;
  const emails = [a, a + 1, a + 2].map((n) => `test.alert.s${String(n).padStart(2, "0")}@fpt.edu.vn`);
  team3(uid(5, 2, i + 1), uid(5, 1, 1), uid(5, 4, 1), `Alert ${TEAM_NAMES[i]}`, emails, true);
}
L(`INSERT INTO mentor_teams (id, created_at, created_by, assigned_at, mentor_user_id, team_id)`);
L(`VALUES (NEWID(), @now, N'${COORD}', @now, @mentor1Id, '${uid(5, 2, 7)}');`); // Alert Eta (not submitted + alert)
for (let t = 1; t <= SUBMITTED_TEAMS; t++) {
  const emails = [(t - 1) * 3 + 1, (t - 1) * 3 + 2, (t - 1) * 3 + 3].map(
    (n) => `test.alert.s${String(n).padStart(2, "0")}@fpt.edu.vn`,
  );
  const teamId = uid(5, 2, t);
  const subId = uid(5, 5, t);
  const verId = uid(5, 7, t);
  const attId = uid(5, 9, t);
  L(`INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)`);
  L(`VALUES ('${subId}', @now, N'${COORD}', NULL, '${uid(5, 3, 1)}', N'SUBMITTED', (SELECT id FROM users WHERE email=N'${emails[0]}'), '${teamId}', 0);`);
  L(`INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)`);
  L(`VALUES ('${verId}', @now, N'${COORD}', N'${esc(SEED_OTHER_URL)}', N'${esc(SEED_SOURCE_URL)}', N'${esc(SEED_SLIDE_URL)}', N'${esc(SEED_OTHER_URL)}', DATEADD(HOUR,-${t},@now), 1, '${subId}');`);
  L(`UPDATE submissions SET current_version_id='${verId}' WHERE id='${subId}';`);
  L(`INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)`);
  L(`VALUES ('${attId}', @now, N'${COORD}', N'${esc(SEED_FILE_NAME)}', ${SEED_FILE_SIZE}, N'${esc(SEED_FILE_URL)}', NULL, N'application/pdf', '${verId}');`);
}
// Alert on team 7 (Eta) — still not submitted, within 6h window
L(`IF OBJECT_ID(N'dbo.team_progress_alerts', N'U') IS NOT NULL`);
L(`INSERT INTO team_progress_alerts (id, team_id, round_id, risk_level, reasons, last_alerted_at, created_at, updated_at)`);
L(`VALUES ('${uid(5, 21, 1)}', '${uid(5, 2, 7)}', '${uid(5, 3, 1)}', N'CRITICAL', N'NOT_STARTED', @now, @now, @now);`);
L(`INSERT INTO notifications (id, created_at, message, reference_id, reference_type, title, type)`);
L(`VALUES ('${uid(5, 25, 1)}', @now, N'Team Alert Eta has not started submission and the deadline is approaching (NOT_STARTED).', '${uid(5, 2, 7)}', N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT');`);
L(`INSERT INTO notification_recipients (id, created_at, channel, read_at, sent_at, user_id, notification_id) VALUES`);
L(`  ('${uid(5, 26, 1)}', @now, N'IN_APP', NULL, @now, (SELECT id FROM users WHERE email=N'test.alert.s19@fpt.edu.vn'), '${uid(5, 25, 1)}'),`);
L(`  ('${uid(5, 26, 2)}', @now, N'IN_APP', NULL, @now, @mentor1Id, '${uid(5, 25, 1)}'),`);
L(`  ('${uid(5, 26, 3)}', @now, N'IN_APP', NULL, @now, @coordId, '${uid(5, 25, 1)}');`);
L(``);

// ── 6 SCORING deviation ──
L(`-- ========== 6) Scoring + deviation ==========`);
addEvent(uid(6, 1, 1), "Test 6 - Scoring (1 Judge Pending / High Deviation)", "SCORING", -5, 21, -40, -10, "10 teams. Judge1+2 scored HIGH; Judge3 pending — score low to trigger deviation review.");
addTrack(uid(6, 4, 1), uid(6, 1, 1), "Scoring Track");
addRounds(
  uid(6, 1, 1),
  uid(6, 3, 1),
  uid(6, 3, 2),
  "DATEADD(DAY,-3,@now)",
  "DATEADD(DAY,-1,@now)",
  "DATEADD(DAY,10,@now)",
  "DATEADD(DAY,11,@now)",
  "DATEADD(DAY,11,@now)",
  "DATEADD(DAY,14,@now)",
);
addCriteria3(uid(6, 6, 1), uid(6, 6, 2), uid(6, 6, 3), uid(6, 3, 1));
addCriteria3(uid(6, 6, 4), uid(6, 6, 5), uid(6, 6, 6), uid(6, 3, 2));
L(`INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active, created_by) VALUES`);
L(`  (NEWID(), @now, @now, @j1, '${uid(6, 3, 1)}', N'ROUND', 1, N'${COORD}'),`);
L(`  (NEWID(), @now, @now, @j2, '${uid(6, 3, 1)}', N'ROUND', 1, N'${COORD}'),`);
L(`  (NEWID(), @now, @now, @j3, '${uid(6, 3, 1)}', N'ROUND', 1, N'${COORD}');`);
enroll(uid(6, 1, 1), "test.score.s%@fpt.edu.vn");
for (let t = 1; t <= 10; t++) {
  const a = (t - 1) * 3 + 1;
  const emails = [a, a + 1, a + 2].map((n) => `test.score.s${String(n).padStart(2, "0")}@fpt.edu.vn`);
  const teamId = uid(6, 2, t);
  const subId = uid(6, 5, t);
  const verId = uid(6, 7, t);
  const attId = uid(6, 9, t);
  team3(teamId, uid(6, 1, 1), uid(6, 4, 1), `Score ${TEAM_NAMES[t - 1]}`, emails, true);
  L(`INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)`);
  L(`VALUES ('${subId}', @now, N'${COORD}', NULL, '${uid(6, 3, 1)}', N'SUBMITTED', (SELECT id FROM users WHERE email=N'${emails[0]}'), '${teamId}', 0);`);
  L(`INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)`);
  L(`VALUES ('${verId}', @now, N'${COORD}', N'${esc(SEED_OTHER_URL)}', N'${esc(SEED_SOURCE_URL)}', N'${esc(SEED_SLIDE_URL)}', N'${esc(SEED_OTHER_URL)}', DATEADD(HOUR,-12,@now), 1, '${subId}');`);
  L(`UPDATE submissions SET current_version_id='${verId}' WHERE id='${subId}';`);
  L(`INSERT INTO submission_attachments (id, created_at, created_by, file_name, file_size, file_url, page_count, content_type, submission_version_id)`);
  L(`VALUES ('${attId}', @now, N'${COORD}', N'${esc(SEED_FILE_NAME)}', ${SEED_FILE_SIZE}, N'${esc(SEED_FILE_URL)}', NULL, N'application/pdf', '${verId}');`);
  for (const [ji, jvar] of [
    [1, "@j1"],
    [2, "@j2"],
  ]) {
    const scoreId = uid(6, 8, t * 10 + ji);
    L(`INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)`);
    L(`VALUES ('${scoreId}', @now, N'${COORD}', DATEADD(HOUR,-2,@now), ${jvar}, '${uid(6, 3, 1)}', DATEADD(HOUR,-3,@now), N'COMPLETED', '${subId}', 0);`);
    L(`INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES`);
    L(`  (NEWID(), @now, N'${COORD}', '${uid(6, 6, 1)}', 95, '${scoreId}'),`);
    L(`  (NEWID(), @now, N'${COORD}', '${uid(6, 6, 2)}', 98, '${scoreId}'),`);
    L(`  (NEWID(), @now, N'${COORD}', '${uid(6, 6, 3)}', 100, '${scoreId}');`);
  }
}
L(``);

// ── 7 Final advancement ──
L(`-- ========== 7) Final advancement / LiveScore ==========`);
addEvent(uid(7, 1, 1), "Test 7 - Final Advancement (Prelim Done)", "SCORING", -5, 30, -40, -10, "10 teams prelim fully scored+ranked. Select Finalists then score Final with guest judges.");
addTrack(uid(7, 4, 1), uid(7, 1, 1), "Final Track");
L(`INSERT INTO competition_groups (id, track_id, event_id, name, max_teams, sort_order, created_at, updated_at, created_by)`);
L(`VALUES ('${uid(7, 10, 1)}', '${uid(7, 4, 1)}', '${uid(7, 1, 1)}', N'Group A', 10, 0, @now, @now, N'${COORD}'),`);
L(`       ('${uid(7, 10, 2)}', '${uid(7, 4, 1)}', '${uid(7, 1, 1)}', N'Group B', 10, 1, @now, @now, N'${COORD}');`);
addRounds(
  uid(7, 1, 1),
  uid(7, 3, 1),
  uid(7, 3, 2),
  "DATEADD(DAY,-5,@now)",
  "DATEADD(DAY,-3,@now)",
  "DATEADD(HOUR,-6,@now)",
  "DATEADD(HOUR,-1,@now)",
  "DATEADD(HOUR,-1,@now)",
  "DATEADD(DAY,14,@now)",
  4,
);
addCriteria3(uid(7, 6, 1), uid(7, 6, 2), uid(7, 6, 3), uid(7, 3, 1));
addCriteria3(uid(7, 6, 4), uid(7, 6, 5), uid(7, 6, 6), uid(7, 3, 2));
L(`INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active, created_by) VALUES`);
L(`  (NEWID(), @now, @now, @j1, '${uid(7, 3, 1)}', N'ROUND', 1, N'${COORD}'),`);
L(`  (NEWID(), @now, @now, @j2, '${uid(7, 3, 1)}', N'ROUND', 1, N'${COORD}'),`);
L(`  (NEWID(), @now, @now, @fj1, '${uid(7, 3, 2)}', N'ROUND', 1, N'${COORD}'),`);
L(`  (NEWID(), @now, @now, @fj2, '${uid(7, 3, 2)}', N'ROUND', 1, N'${COORD}');`);
enroll(uid(7, 1, 1), "test.final.s%@fpt.edu.vn");
for (let t = 1; t <= 10; t++) {
  const a = (t - 1) * 3 + 1;
  const emails = [a, a + 1, a + 2].map((n) => `test.final.s${String(n).padStart(2, "0")}@fpt.edu.vn`);
  const teamId = uid(7, 2, t);
  const groupId = t <= 5 ? uid(7, 10, 1) : uid(7, 10, 2);
  const subId = uid(7, 5, t);
  const verId = uid(7, 7, t);
  const tag = teamId.replace(/-/g, "");
  const base = 95 - (t - 1) * 3;
  L(`DECLARE @L_${tag} UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'${emails[0]}');`);
  L(`DECLARE @M2_${tag} UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'${emails[1]}');`);
  L(`DECLARE @M3_${tag} UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'${emails[2]}');`);
  L(`INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)`);
  L(`VALUES ('${teamId}', @now, N'${COORD}', '${uid(7, 1, 1)}', @L_${tag}, N'Final ${TEAM_NAMES[t - 1]}', N'CONFIRMED', '${uid(7, 4, 1)}', '${groupId}', @now, N'MANUAL', @coordId, 0, N'Test.', 0);`);
  L(`INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES`);
  L(`  (NEWID(), @now, N'${COORD}', @now, N'LEADER', @L_${tag}, '${teamId}', '${uid(7, 1, 1)}'),`);
  L(`  (NEWID(), @now, N'${COORD}', @now, N'MEMBER', @M2_${tag}, '${teamId}', '${uid(7, 1, 1)}'),`);
  L(`  (NEWID(), @now, N'${COORD}', @now, N'MEMBER', @M3_${tag}, '${teamId}', '${uid(7, 1, 1)}');`);
  L(`INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)`);
  L(`VALUES ('${subId}', @now, N'${COORD}', NULL, '${uid(7, 3, 1)}', N'SCORED', @L_${tag}, '${teamId}', 0);`);
  L(`INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)`);
  L(`VALUES ('${verId}', @now, N'${COORD}', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/final-${t}', N'https://docs.google.com/presentation/d/final-${t}', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-3,@now), 1, '${subId}');`);
  L(`UPDATE submissions SET current_version_id='${verId}' WHERE id='${subId}';`);
  for (const [ji, jvar] of [
    [1, "@j1"],
    [2, "@j2"],
  ]) {
    const scoreId = uid(7, 8, t * 10 + ji);
    L(`INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)`);
    L(`VALUES ('${scoreId}', @now, N'${COORD}', DATEADD(HOUR,-8,@now), ${jvar}, '${uid(7, 3, 1)}', DATEADD(HOUR,-10,@now), N'COMPLETED', '${subId}', 0);`);
    L(`INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES`);
    L(`  (NEWID(), @now, N'${COORD}', '${uid(7, 6, 1)}', ${base}, '${scoreId}'),`);
    L(`  (NEWID(), @now, N'${COORD}', '${uid(7, 6, 2)}', ${base}, '${scoreId}'),`);
    L(`  (NEWID(), @now, N'${COORD}', '${uid(7, 6, 3)}', ${Math.max(1, base - 5)}, '${scoreId}');`);
  }
  L(`INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)`);
  L(`VALUES (NEWID(), @now, N'${COORD}', @now, ${base}.00, ${t}, '${uid(7, 3, 1)}', '${teamId}', 1, 0, @now);`);
}
L(``);

// ── 8 COMPLETED full graph (feedback + results + awards) ──
L(`-- ========== 8) Completed full graph (feedback / livescore / results) ==========`);
addEvent(uid(8, 1, 1), "Test 8 - Completed (Feedback Ready)", "COMPLETED", -60, -30, -90, -70, "COMPLETED full graph — submissions, scores, rankings, publish, awards, feedback.", 1);
addTrack(uid(8, 4, 1), uid(8, 1, 1), "Feedback Track");
L(`INSERT INTO competition_groups (id, track_id, event_id, name, max_teams, sort_order, created_at, updated_at, created_by)`);
L(`VALUES ('${uid(8, 10, 1)}', '${uid(8, 4, 1)}', '${uid(8, 1, 1)}', N'Group A', 15, 0, @now, @now, N'${COORD}');`);
addRounds(
  uid(8, 1, 1),
  uid(8, 3, 1),
  uid(8, 3, 2),
  "DATEADD(DAY,-55,@now)",
  "DATEADD(DAY,-50,@now)",
  "DATEADD(DAY,-45,@now)",
  "DATEADD(DAY,-40,@now)",
  "DATEADD(DAY,-38,@now)",
  "DATEADD(DAY,-35,@now)",
  4,
);
addCriteria3(uid(8, 6, 1), uid(8, 6, 2), uid(8, 6, 3), uid(8, 3, 1));
addCriteria3(uid(8, 6, 4), uid(8, 6, 5), uid(8, 6, 6), uid(8, 3, 2));
L(`INSERT INTO event_schedules (id, event_id, type, title, description, start_time, end_time, gate, sort_order, created_at, updated_at) VALUES`);
L(`  ('${uid(8, 20, 1)}', '${uid(8, 1, 1)}', N'WORKSHOP', N'Kickoff workshop', NULL, DATEADD(DAY,-58,@now), DATEADD(HOUR,3,DATEADD(DAY,-58,@now)), NULL, 0, @now, @now),`);
L(`  ('${uid(8, 20, 2)}', '${uid(8, 1, 1)}', N'OPENING', N'Opening ceremony', N'Event open', DATEADD(DAY,-56,@now), DATEADD(HOUR,2,DATEADD(DAY,-56,@now)), NULL, 1, @now, @now),`);
L(`  ('${uid(8, 20, 3)}', '${uid(8, 1, 1)}', N'SCORING', N'Final scoring window', NULL, DATEADD(DAY,-38,@now), DATEADD(DAY,-35,@now), NULL, 2, @now, @now);`);
L(`INSERT INTO prizes (id, created_at, created_by, quantity, [rank], value, event_id, label, track_id) VALUES`);
L(`  ('${uid(8, 7, 1)}', @now, N'${COORD}', 1, N'FIRST', N'10,000,000 VND + Trophy', '${uid(8, 1, 1)}', N'First Prize', NULL),`);
L(`  ('${uid(8, 7, 2)}', @now, N'${COORD}', 1, N'SECOND', N'5,000,000 VND', '${uid(8, 1, 1)}', N'Second Prize', NULL),`);
L(`  ('${uid(8, 7, 3)}', @now, N'${COORD}', 1, N'THIRD', N'2,000,000 VND', '${uid(8, 1, 1)}', N'Third Prize', NULL);`);
L(`INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active, created_by) VALUES`);
L(`  (NEWID(), @now, @now, @j1, '${uid(8, 3, 1)}', N'ROUND', 1, N'${COORD}'),`);
L(`  (NEWID(), @now, @now, @j2, '${uid(8, 3, 1)}', N'ROUND', 1, N'${COORD}'),`);
L(`  (NEWID(), @now, @now, @j1, '${uid(8, 3, 2)}', N'ROUND', 1, N'${COORD}'),`);
L(`  (NEWID(), @now, @now, @j2, '${uid(8, 3, 2)}', N'ROUND', 1, N'${COORD}');`);
enroll(uid(8, 1, 1), "test.fb.s%@fpt.edu.vn");

const fbTeamNames = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa"];
const fbPrelimBases = Array.from({ length: 10 }, (_, i) => 95 - i * 3);
const fbFinalBases = [92, 86, 80, 74];
const FB_FINALISTS = 4;
for (let t = 1; t <= 10; t++) {
  const a = (t - 1) * 3 + 1;
  const emails = [a, a + 1, a + 2].map((n) => `test.fb.s${String(n).padStart(2, "0")}@fpt.edu.vn`);
  const teamId = uid(8, 2, t);
  const tag = teamId.replace(/-/g, "");
  L(`DECLARE @L_${tag} UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'${emails[0]}');`);
  L(`DECLARE @M2_${tag} UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'${emails[1]}');`);
  L(`DECLARE @M3_${tag} UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'${emails[2]}');`);
  L(`INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)`);
  L(`VALUES ('${teamId}', @now, N'${COORD}', '${uid(8, 1, 1)}', @L_${tag}, N'Feedback Team ${fbTeamNames[t - 1]}', N'CONFIRMED', '${uid(8, 4, 1)}', '${uid(8, 10, 1)}', @now, N'MANUAL', @coordId, 0, N'Test.', 0);`);
  L(`INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES`);
  L(`  (NEWID(), @now, N'${COORD}', @now, N'LEADER', @L_${tag}, '${teamId}', '${uid(8, 1, 1)}'),`);
  L(`  (NEWID(), @now, N'${COORD}', @now, N'MEMBER', @M2_${tag}, '${teamId}', '${uid(8, 1, 1)}'),`);
  L(`  (NEWID(), @now, N'${COORD}', @now, N'MEMBER', @M3_${tag}, '${teamId}', '${uid(8, 1, 1)}');`);

  const subP = uid(8, 5, t);
  const verP = uid(8, 11, t);
  L(`INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)`);
  L(`VALUES ('${subP}', @now, N'${COORD}', NULL, '${uid(8, 3, 1)}', N'SCORED', @L_${tag}, '${teamId}', 0);`);
  L(`INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)`);
  L(`VALUES ('${verP}', @now, N'${COORD}', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/fb-prelim-${t}', N'https://docs.google.com/presentation/d/fb-prelim-${t}', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-51,@now), 1, '${subP}');`);
  L(`UPDATE submissions SET current_version_id='${verP}' WHERE id='${subP}';`);
  for (const [ji, jvar] of [
    [1, "@j1"],
    [2, "@j2"],
  ]) {
    const scoreId = uid(8, 12, t * 10 + ji);
    const base = fbPrelimBases[t - 1];
    L(`INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)`);
    L(`VALUES ('${scoreId}', @now, N'${COORD}', DATEADD(DAY,-46,@now), ${jvar}, '${uid(8, 3, 1)}', DATEADD(DAY,-47,@now), N'COMPLETED', '${subP}', 0);`);
    L(`INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES`);
    L(`  (NEWID(), @now, N'${COORD}', '${uid(8, 6, 1)}', ${base}, '${scoreId}'),`);
    L(`  (NEWID(), @now, N'${COORD}', '${uid(8, 6, 2)}', ${base}, '${scoreId}'),`);
    L(`  (NEWID(), @now, N'${COORD}', '${uid(8, 6, 3)}', ${Math.max(1, base - 5)}, '${scoreId}');`);
  }
  L(`INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)`);
  L(`VALUES (NEWID(), @now, N'${COORD}', DATEADD(DAY,-45,@now), ${fbPrelimBases[t - 1]}.00, ${t}, '${uid(8, 3, 1)}', '${teamId}', 1, 0, @now);`);
}

L(`INSERT INTO finalist_selections (id, event_id, team_id, track_id, preliminary_rank, selected_reason, selected_at, created_at, updated_at, selection_method, eligible) VALUES`);
for (let t = 1; t <= FB_FINALISTS; t++) {
  L(`  ('${uid(8, 13, t)}', '${uid(8, 1, 1)}', '${uid(8, 2, t)}', '${uid(8, 4, 1)}', ${t}, N'Top ${t}', DATEADD(DAY,-44,@now), @now, @now, N'AUTO', 1)${t < FB_FINALISTS ? "," : ";"}`);
}

for (let t = 1; t <= FB_FINALISTS; t++) {
  const teamId = uid(8, 2, t);
  const tag = teamId.replace(/-/g, "");
  const subF = uid(8, 5, 20 + t);
  const verF = uid(8, 11, 20 + t);
  L(`INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)`);
  L(`VALUES ('${subF}', @now, N'${COORD}', NULL, '${uid(8, 3, 2)}', N'SCORED', @L_${tag}, '${teamId}', 0);`);
  L(`INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)`);
  L(`VALUES ('${verF}', @now, N'${COORD}', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/fb-final-${t}', N'https://docs.google.com/presentation/d/fb-final-${t}', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,-39,@now), 1, '${subF}');`);
  L(`UPDATE submissions SET current_version_id='${verF}' WHERE id='${subF}';`);
  for (const [ji, jvar] of [
    [1, "@j1"],
    [2, "@j2"],
  ]) {
    const scoreId = uid(8, 12, 100 + t * 10 + ji);
    const base = fbFinalBases[t - 1];
    L(`INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)`);
    L(`VALUES ('${scoreId}', @now, N'${COORD}', DATEADD(DAY,-36,@now), ${jvar}, '${uid(8, 3, 2)}', DATEADD(DAY,-37,@now), N'COMPLETED', '${subF}', 0);`);
    L(`INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES`);
    L(`  (NEWID(), @now, N'${COORD}', '${uid(8, 6, 4)}', ${base}, '${scoreId}'),`);
    L(`  (NEWID(), @now, N'${COORD}', '${uid(8, 6, 5)}', ${base}, '${scoreId}'),`);
    L(`  (NEWID(), @now, N'${COORD}', '${uid(8, 6, 6)}', ${Math.max(1, base - 4)}, '${scoreId}');`);
  }
  L(`INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)`);
  L(`VALUES (NEWID(), @now, N'${COORD}', DATEADD(DAY,-35,@now), ${fbFinalBases[t - 1]}.00, ${t}, '${uid(8, 3, 2)}', '${teamId}', 1, 0, @now);`);
}

L(`INSERT INTO published_results (id, created_at, dispute_deadline, published_at, published_by, round_id) VALUES`);
L(`  ('${uid(8, 14, 1)}', @now, DATEADD(DAY,-43,@now), DATEADD(DAY,-45,@now), @coordId, '${uid(8, 3, 1)}'),`);
L(`  ('${uid(8, 14, 2)}', @now, DATEADD(DAY,-33,@now), DATEADD(DAY,-35,@now), @coordId, '${uid(8, 3, 2)}');`);
L(`INSERT INTO team_awards (id, event_id, team_id, prize_id, awarded_at, created_at, updated_at, created_by) VALUES`);
L(`  ('${uid(8, 15, 1)}', '${uid(8, 1, 1)}', '${uid(8, 2, 1)}', '${uid(8, 7, 1)}', DATEADD(DAY,-34,@now), @now, @now, N'${COORD}'),`);
L(`  ('${uid(8, 15, 2)}', '${uid(8, 1, 1)}', '${uid(8, 2, 2)}', '${uid(8, 7, 2)}', DATEADD(DAY,-34,@now), @now, @now, N'${COORD}'),`);
L(`  ('${uid(8, 15, 3)}', '${uid(8, 1, 1)}', '${uid(8, 2, 3)}', '${uid(8, 7, 3)}', DATEADD(DAY,-34,@now), @now, @now, N'${COORD}');`);
L(`IF OBJECT_ID(N'dbo.participation_certificates', N'U') IS NOT NULL`);
L(`BEGIN`);
L(`  INSERT INTO participation_certificates (id, created_at, created_by, event_id, user_id, team_id, issued_at)`);
L(`  SELECT NEWID(), @now, N'${COORD}', '${uid(8, 1, 1)}', tm.user_id, tm.team_id, DATEADD(DAY,-34,@now)`);
L(`  FROM team_members tm WHERE tm.event_id = '${uid(8, 1, 1)}';`);
L(`END`);
L(`INSERT INTO participant_feedbacks (id, created_at, created_by, comment, event_id, overall_rating, submitted_at, team_id, user_id)`);
L(`VALUES ('${uid(8, 16, 1)}', @now, N'${COORD}', N'Clear rounds and fair judging — great for feedback QA.', '${uid(8, 1, 1)}', 5, DATEADD(DAY,-32,@now), '${uid(8, 2, 1)}', (SELECT id FROM users WHERE email=N'test.fb.s01@fpt.edu.vn'));`);
L(``);

L(`-- ========== Default Add Lecture pools (7 judges + 7 mentors on every pack event) ==========`);
for (let e = 1; e <= 8; e++) {
  addLecturePool(uid(e, 1, 1));
}
// Final guest judges stay available on Test 7 for Final round assignment
L(`INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id, created_by)`);
L(`SELECT NEWID(), @now, @now, j.id, '${uid(7, 1, 1)}', N'${COORD}'`);
L(`FROM (VALUES (N'test.final.judge1@fpt.edu.vn'), (N'test.final.judge2@fpt.edu.vn')) v(email)`);
L(`INNER JOIN users j ON j.email = v.email`);
L(`WHERE NOT EXISTS (SELECT 1 FROM event_judge_assignments x WHERE x.event_id = '${uid(7, 1, 1)}' AND x.judge_user_id = j.id);`);
L(``);

L(`COMMIT TRANSACTION;`);
L(``);
L(`PRINT '=== Feature demo pack ready (password Demo@123456) ===';`);
L(`PRINT 'Admin:           admin@seal.com';`);
L(`PRINT 'Coordinator:     test.coord@fpt.edu.vn';`);
L(`PRINT 'Lecture pool:    test.judge1..7 + test.mentor1..7 on every Test event (Add Lecture default)';`);
L(`PRINT '1 OPEN empty:    Test 1 - Open Registration (Join Me)';`);
L(`PRINT '2 OPEN 5 students: test.open.s01..s05@fpt.edu.vn';`);
L(`PRINT '3 Assignment:    test.assign.s01 (leader Alpha) | mentor1 pre-linked to Team 01';`);
L(`PRINT '4 Submission:    test.sub.s01@fpt.edu.vn (leader Submit Alpha) | 6/10 teams submitted';`);
L(`PRINT '5 Near deadline: test.alert.s01@fpt.edu.vn | 6/10 submitted; alert on Eta';`);
L(`PRINT '6 Scoring:       test.judge3 PENDING | test.judge1/2 HIGH done | 10 teams';`);
L(`PRINT '7 Final:         test.final.judge1/2@fpt.edu.vn | 10 teams prelim ranked';`);
L(`PRINT '8 Feedback:      test.fb.s01@fpt.edu.vn (Alpha FIRST) | 10 teams full COMPLETED graph';`);

const out = path.join(__dirname, "seed_feature_demo_pack.sql");
fs.writeFileSync(out, lines.join("\n") + "\n", "utf8");
console.log(`Wrote ${out} (${lines.length} lines)`);
