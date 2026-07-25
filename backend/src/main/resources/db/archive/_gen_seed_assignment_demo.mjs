/**
 * Generate seed_assignment_demo.sql
 * One event at CLOSED_REGISTRATION with 10 CONFIRMED teams (no track / judge / mentor yet).
 * Run: node _gen_seed_assignment_demo.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PWD = "$2a$10$3Ee4YwgqIw0MnDJeYtNDOOccbcr7G/t0mhmapneTSjuZTh9qa6AMq"; // 12345678
const EVENT_N = 13; // 0x0D — avoids collision with demo seasons 1–7 and AS2 C1–C3
const EVENT_ID = "0D010000-EEEE-4EEE-8EEE-000000000001";

const uid = (kind, seq) => {
  const e = Number(EVENT_N).toString(16).padStart(2, "0");
  const k = Number(kind).toString(16).padStart(2, "0");
  const s = Number(seq).toString(16).padStart(12, "0");
  return `${e}${k}0000-EEEE-4EEE-8EEE-${s}`.toUpperCase();
};

const TRACKS = ["Grounded Retrieval", "Agent Orchestration", "Enterprise Copilot"];
const TEAM_NAMES = [
  "Assign Alpha",
  "Assign Beta",
  "Assign Gamma",
  "Assign Delta",
  "Assign Epsilon",
  "Assign Zeta",
  "Assign Eta",
  "Assign Theta",
  "Assign Iota",
  "Assign Kappa",
];

const lines = [];
const L = (s = "") => lines.push(s);
const esc = (s) => String(s).replace(/'/g, "''");

const staff = [
  { email: "assign.coord@fpt.edu.vn", name: "Assign Demo Coordinator", type: "EVENT_COORDINATOR", sid: null, id: uid(0, 1) },
  { email: "assign.judge1@fpt.edu.vn", name: "Assign Judge One", type: "LECTURER", sid: null, id: uid(0, 2) },
  { email: "assign.judge2@fpt.edu.vn", name: "Assign Judge Two", type: "LECTURER", sid: null, id: uid(0, 3) },
  { email: "assign.judge3@fpt.edu.vn", name: "Assign Judge Three", type: "LECTURER", sid: null, id: uid(0, 4) },
  { email: "assign.mentor1@fpt.edu.vn", name: "Assign Mentor One", type: "LECTURER", sid: null, id: uid(0, 5) },
  { email: "assign.mentor2@fpt.edu.vn", name: "Assign Mentor Two", type: "LECTURER", sid: null, id: uid(0, 6) },
  { email: "assign.mentor3@fpt.edu.vn", name: "Assign Mentor Three", type: "LECTURER", sid: null, id: uid(0, 7) },
];

const students = [];
for (let i = 1; i <= 30; i++) {
  const n = String(i).padStart(2, "0");
  students.push({
    email: `assign.s${n}@fpt.edu.vn`,
    name: `Assign Student ${n}`,
    type: "FPT_STUDENT",
    sid: `SE29${String(200 + i)}`,
    semester: 4 + ((i - 1) % 5),
    id: uid(1, i),
  });
}

const allUsers = [...staff, ...students];

L(`-- Assignment-stage demo: CLOSED_REGISTRATION + 10 CONFIRMED teams (no track/judge/mentor yet).`);
L(`-- Password for ALL accounts: 12345678`);
L(`-- Regenerate: node _gen_seed_assignment_demo.mjs`);
L(`-- Run: sqlcmd -S localhost,1433 -U sa -P <pwd> -C -d SEAL -f 65001 -I -i seed_assignment_demo.sql`);
L(``);
L(`SET NOCOUNT ON;`);
L(`SET QUOTED_IDENTIFIER ON;`);
L(`SET ANSI_NULLS ON;`);
L(`SET XACT_ABORT ON;`);
L(`BEGIN TRANSACTION;`);
L(``);
L(`DECLARE @now DATETIME2 = SYSDATETIME();`);
L(`DECLARE @pwd NVARCHAR(255) = N'${PWD}';`);
L(`DECLARE @templateId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM scoring_templates WHERE name = N'Standard Hackathon' ORDER BY created_at);`);
L(`IF @templateId IS NULL SET @templateId = (SELECT TOP 1 id FROM scoring_templates ORDER BY created_at);`);
L(`IF @templateId IS NULL BEGIN RAISERROR('No scoring template. Start backend with profile dev first.', 16, 1); ROLLBACK TRANSACTION; RETURN; END`);
L(``);

// Upsert accounts
for (const u of allUsers) {
  const sidLit = u.sid == null ? "NULL" : `N'${esc(u.sid)}'`;
  const semLit = u.semester == null ? "NULL" : String(u.semester);
  L(`IF EXISTS (SELECT 1 FROM users WHERE email = N'${esc(u.email)}')`);
  L(`  UPDATE users SET password_hash=@pwd, full_name=N'${esc(u.name)}', user_type=N'${u.type}', status=N'ACTIVE',`);
  L(`    failed_login_attempts=0, locked_until=NULL, student_id=${sidLit}, university_name=N'FPT University',`);
  L(`    semester=${semLit}, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'${esc(u.email)}';`);
  L(`ELSE`);
  L(`  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)`);
  L(`  VALUES ('${u.id}',N'${esc(u.email)}',@pwd,N'${esc(u.name)}',NULL,NULL,${sidLit},N'FPT University',N'${u.type}',N'ACTIVE',0,NULL,${semLit},N'ENROLLED',0,@now,@now);`);
  L(``);
}

L(`DECLARE @coordId UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.coord@fpt.edu.vn');`);
for (let i = 1; i <= 30; i++) {
  const n = String(i).padStart(2, "0");
  L(`DECLARE @s${n} UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'assign.s${n}@fpt.edu.vn');`);
}
L(``);

// Wipe prior assignment demo event
L(`DECLARE @wipe TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);`);
L(`INSERT INTO @wipe VALUES ('${EVENT_ID}');`);
L(`DECLARE @wTeams TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);`);
L(`INSERT INTO @wTeams SELECT id FROM teams WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DECLARE @wRounds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);`);
L(`INSERT INTO @wRounds SELECT id FROM rounds WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DECLARE @wSubs TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);`);
L(`INSERT INTO @wSubs SELECT id FROM submissions WHERE team_id IN (SELECT id FROM @wTeams);`);
L(`DELETE jc FROM judge_comments jc INNER JOIN judge_scores js ON js.id=jc.judge_score_id WHERE js.submission_id IN (SELECT id FROM @wSubs);`);
L(`DELETE jsd FROM judge_score_details jsd INNER JOIN judge_scores js ON js.id=jsd.judge_score_id WHERE js.submission_id IN (SELECT id FROM @wSubs);`);
L(`DELETE FROM judge_scores WHERE submission_id IN (SELECT id FROM @wSubs);`);
L(`DELETE sa FROM submission_attachments sa INNER JOIN submission_versions sv ON sv.id=sa.submission_version_id WHERE sv.submission_id IN (SELECT id FROM @wSubs);`);
L(`DELETE FROM submission_versions WHERE submission_id IN (SELECT id FROM @wSubs);`);
L(`DELETE FROM submissions WHERE id IN (SELECT id FROM @wSubs);`);
L(`IF OBJECT_ID(N'mentor_chat_messages', N'U') IS NOT NULL DELETE FROM mentor_chat_messages WHERE team_id IN (SELECT id FROM @wTeams);`);
L(`IF OBJECT_ID(N'mentor_feedbacks', N'U') IS NOT NULL DELETE FROM mentor_feedbacks WHERE team_id IN (SELECT id FROM @wTeams);`);
L(`DELETE FROM mentor_teams WHERE team_id IN (SELECT id FROM @wTeams);`);
L(`DELETE FROM invitations WHERE team_id IN (SELECT id FROM @wTeams);`);
L(`DELETE FROM mentor_invitations WHERE team_id IN (SELECT id FROM @wTeams);`);
L(`DELETE FROM team_join_requests WHERE team_id IN (SELECT id FROM @wTeams);`);
L(`DELETE FROM team_leave_requests WHERE team_id IN (SELECT id FROM @wTeams);`);
L(`DELETE FROM team_needed_roles WHERE team_id IN (SELECT id FROM @wTeams);`);
L(`IF OBJECT_ID(N'team_progress_alerts', N'U') IS NOT NULL DELETE FROM team_progress_alerts WHERE team_id IN (SELECT id FROM @wTeams);`);
L(`DELETE FROM team_members WHERE team_id IN (SELECT id FROM @wTeams);`);
L(`DELETE FROM teams WHERE id IN (SELECT id FROM @wTeams);`);
L(`DELETE FROM event_enrollments WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM event_magic_tokens WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM participant_feedbacks WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM participation_certificates WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM score_review_requests WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM team_awards WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM finalist_contested_slot_teams WHERE contested_slot_id IN (SELECT id FROM finalist_contested_slots WHERE event_id IN (SELECT id FROM @wipe));`);
L(`DELETE FROM finalist_contested_slots WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM finalist_selections WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM track_draw_sessions WHERE event_id IN (SELECT id FROM @wipe);`);
L(`IF OBJECT_ID(N'disputes', N'U') IS NOT NULL DELETE FROM disputes WHERE round_id IN (SELECT id FROM @wRounds);`);
L(`IF OBJECT_ID(N'advancements', N'U') IS NOT NULL DELETE FROM advancements WHERE round_id IN (SELECT id FROM @wRounds);`);
L(`DELETE FROM rankings WHERE round_id IN (SELECT id FROM @wRounds);`);
L(`DELETE FROM published_results WHERE round_id IN (SELECT id FROM @wRounds);`);
L(`DELETE FROM judge_assignments WHERE round_id IN (SELECT id FROM @wRounds);`);
L(`DELETE FROM criteria WHERE round_id IN (SELECT id FROM @wRounds);`);
L(`DELETE FROM rounds WHERE id IN (SELECT id FROM @wRounds);`);
L(`DELETE FROM event_judge_assignments WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM event_mentor_assignments WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM mentor_assignments WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM event_tiebreaker_criteria WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM honored_guests WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM prizes WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM event_schedules WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM allowed_email_domains WHERE event_id IN (SELECT id FROM @wipe);`);
L(`IF OBJECT_ID(N'competition_groups', N'U') IS NOT NULL`);
L(`  DELETE cg FROM competition_groups cg INNER JOIN tracks tr ON tr.id = cg.track_id WHERE tr.event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM tracks WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM hackathon_events WHERE id IN (SELECT id FROM @wipe);`);
L(``);

const trackIds = TRACKS.map((_, i) => uid(4, i + 1));
const prelimId = uid(3, 1);
const finalId = uid(3, 2);

L(`-- Event: registration closed, competition not started yet`);
L(`INSERT INTO hackathon_events (`);
L(`  id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,`);
L(`  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,`);
L(`  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at`);
L(`) VALUES (`);
L(`  '${EVENT_ID}',`);
L(`  N'Assignment Demo - Closed Registration 10 Teams',`);
L(`  N'Summer', 2026,`);
L(`  CAST(DATEADD(DAY, 7, @now) AS DATE), CAST(DATEADD(DAY, 8, @now) AS DATE),`);
L(`  CAST(DATEADD(DAY, -30, @now) AS DATE), CAST(DATEADD(DAY, -1, @now) AS DATE),`);
L(`  N'Demo event for Assignment QA: registration closed with 10 confirmed teams. Tracks/judges/mentors are intentionally unassigned so coordinators can test the full assignment flow.',`);
L(`  N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',`);
L(`  3, 5, 4, 8,`);
L(`  @templateId, N'CLOSED_REGISTRATION', 0, @coordId, N'assign.coord@fpt.edu.vn', @now, @now`);
L(`);`);
L(``);

L(`INSERT INTO tracks (id, event_id, name, description, max_teams, status, created_at, updated_at) VALUES`);
L(
  TRACKS.map(
    (tn, i) =>
      `  ('${trackIds[i]}', '${EVENT_ID}', N'${esc(tn)}', N'SEAL track: ${esc(tn)}', 8, N'OPEN', @now, @now)${i < 2 ? "," : ";"}`
  ).join("\n")
);
L(``);

L(`DECLARE @compDt DATETIME2 = DATEADD(HOUR, 7, CAST(CAST(DATEADD(DAY, 7, @now) AS DATE) AS DATETIME2));`);
L(`DECLARE @prelimSub DATETIME2 = DATEADD(HOUR, 14, @compDt);`);
L(`DECLARE @prelimScore DATETIME2 = DATEADD(MINUTE, 15 * 60 + 30, @compDt);`);
L(`DECLARE @finalEnd DATETIME2 = DATEADD(HOUR, 17, @compDt);`);
L(`INSERT INTO rounds (`);
L(`  id, event_id, round_number, name, round_type,`);
L(`  start_date, end_date, slide_deadline, submission_deadline, scoring_deadline,`);
L(`  advancement_cutoff, advancement_rule, round_weight, created_at, updated_at`);
L(`) VALUES`);
L(`  ('${prelimId}', '${EVENT_ID}', 1, N'Preliminary Round', N'PRELIMINARY',`);
L(`   @compDt, @prelimScore, DATEADD(HOUR, 10, @compDt), @prelimSub, @prelimScore,`);
L(`   2, N'PER_TRACK_TOP_N', 40, @now, @now),`);
L(`  ('${finalId}', '${EVENT_ID}', 2, N'Finals', N'FINAL',`);
L(`   @prelimScore, @finalEnd, NULL, @prelimScore, @finalEnd,`);
L(`   6, N'FINALIST_POOL', 60, @now, @now);`);
L(``);

const critNames = ["Innovation", "Technical", "Business Value", "Presentation"];
const critW = [25, 30, 25, 20];
L(`INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at) VALUES`);
const critRows = [];
critNames.forEach((n, i) => critRows.push(`  ('${uid(6, i + 1)}', '${prelimId}', N'${n}', N'${n}', ${critW[i]}, ${i}, 1, 5, @now, @now)`));
critNames.forEach((n, i) => critRows.push(`  ('${uid(6, 11 + i)}', '${finalId}', N'${n}', N'${n}', ${critW[i]}, ${i}, 1, 5, @now, @now)`));
L(critRows.join(",\n") + ";");
L(``);

L(`INSERT INTO prizes (id, event_id, rank, value, quantity, label, created_at, updated_at) VALUES`);
L(`  ('${uid(7, 1)}', '${EVENT_ID}', N'FIRST', N'7000000', 1, N'First Prize', @now, @now),`);
L(`  ('${uid(7, 2)}', '${EVENT_ID}', N'SECOND', N'5000000', 1, N'Second Prize', @now, @now),`);
L(`  ('${uid(7, 3)}', '${EVENT_ID}', N'THIRD', N'3000000', 1, N'Third Prize', @now, @now),`);
L(`  ('${uid(7, 4)}', '${EVENT_ID}', N'CONSOLATION', N'1500000', 1, N'Consolation Prize', @now, @now);`);
L(``);

L(`INSERT INTO event_schedules (id, event_id, type, title, description, start_time, end_time, gate, sort_order, created_at, updated_at) VALUES`);
L(`  ('${uid(8, 1)}', '${EVENT_ID}', N'WORKSHOP', N'Workshop', NULL, DATEADD(DAY, 4, @now), DATEADD(HOUR, 3, DATEADD(DAY, 4, @now)), NULL, 0, @now, @now),`);
L(`  ('${uid(8, 2)}', '${EVENT_ID}', N'OPENING', N'Opening & track draw', N'Teams pick tracks; organizers assign judges/mentors', DATEADD(DAY, 6, @now), DATEADD(HOUR, 3, DATEADD(DAY, 6, @now)), NULL, 1, @now, @now),`);
L(`  ('${uid(8, 3)}', '${EVENT_ID}', N'TRACK_DRAW', N'Track selection draw', NULL, DATEADD(DAY, 6, @now), DATEADD(HOUR, 2, DATEADD(DAY, 6, @now)), NULL, 2, @now, @now),`);
L(`  ('${uid(8, 4)}', '${EVENT_ID}', N'MILESTONE', N'Milestone 1 - Idea & architecture', NULL, @compDt, DATEADD(HOUR, 10, @compDt), N'SLIDE_SUBMISSION', 3, @now, @now),`);
L(`  ('${uid(8, 5)}', '${EVENT_ID}', N'MILESTONE', N'Milestone 2 - Demo', NULL, DATEADD(HOUR, 10, @compDt), @prelimSub, N'DEMO_SUBMISSION', 4, @now, @now),`);
L(`  ('${uid(8, 6)}', '${EVENT_ID}', N'SCORING', N'Preliminary scoring', NULL, @prelimSub, @prelimScore, NULL, 5, @now, @now),`);
L(`  ('${uid(8, 7)}', '${EVENT_ID}', N'FINAL', N'Finals', NULL, @prelimScore, @finalEnd, NULL, 6, @now, @now),`);
L(`  ('${uid(8, 8)}', '${EVENT_ID}', N'CEREMONY', N'Awards & closing', NULL, @finalEnd, DATEADD(HOUR, 1, @finalEnd), NULL, 7, @now, @now);`);
L(``);

L(`INSERT INTO allowed_email_domains (id, event_id, domain, university_label, created_at, updated_at) VALUES`);
L(`  ('${uid(9, 1)}', '${EVENT_ID}', N'fpt.edu.vn', N'FPT University', @now, @now);`);
L(``);

// Enrollments + teams (no track)
const enrollRows = [];
let enSeq = 1;
for (let t = 0; t < 10; t++) {
  for (let m = 0; m < 3; m++) {
    const sIdx = t * 3 + m + 1;
    const sn = String(sIdx).padStart(2, "0");
    enrollRows.push(
      `  ('${uid(10, enSeq++)}', @now, @now, '${EVENT_ID}', N'APPROVED', @s${sn}, 0, 0)`
    );
  }
}
L(`INSERT INTO event_enrollments (id, created_at, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public) VALUES`);
L(enrollRows.join(",\n") + ";");
L(``);

const teamRows = [];
for (let t = 0; t < 10; t++) {
  const leaderIdx = t * 3 + 1;
  const leaderVar = `@s${String(leaderIdx).padStart(2, "0")}`;
  const teamId = uid(5, t + 1);
  teamRows.push(
    `  ('${teamId}', @now, '${EVENT_ID}', ${leaderVar}, N'${esc(TEAM_NAMES[t])}', N'CONFIRMED', NULL, NULL, NULL, 0, N'Ready for track/judge/mentor assignment.', 0)${t < 9 ? "," : ";"}`
  );
}
L(`-- Teams intentionally have track_id NULL so Assignment UI can assign/draw tracks`);
L(`INSERT INTO teams (id, created_at, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, is_recruiting, recruitment_note, version) VALUES`);
L(teamRows.join("\n"));
L(``);

const memRows = [];
let memSeq = 1;
for (let t = 0; t < 10; t++) {
  const teamId = uid(5, t + 1);
  for (let m = 0; m < 3; m++) {
    const sIdx = t * 3 + m + 1;
    const sn = String(sIdx).padStart(2, "0");
    const role = m === 0 ? "LEADER" : "MEMBER";
    memRows.push(
      `  ('${uid(11, memSeq++)}', @now, @now, N'${role}', @s${sn}, '${teamId}', '${EVENT_ID}')`
    );
  }
}
L(`INSERT INTO team_members (id, created_at, joined_at, role, user_id, team_id, event_id) VALUES`);
L(memRows.join(",\n") + ";");
L(``);

L(`-- Intentionally NO event_judge_assignments / mentor_assignments / competition_groups`);
L(`-- so Assignment pages start from a clean post-registration state.`);
L(``);
L(`COMMIT TRANSACTION;`);
L(`PRINT 'Assignment demo ready: CLOSED_REGISTRATION + 10 CONFIRMED teams (no track/judge/mentor).';`);
L(`PRINT 'EventId=${EVENT_ID}';`);
L(`PRINT 'Login coordinator: assign.coord@fpt.edu.vn / 12345678';`);
L(`PRINT 'Judge pool: assign.judge1..3@fpt.edu.vn | Mentor pool: assign.mentor1..3@fpt.edu.vn';`);
L(`PRINT 'Sample leader: assign.s01@fpt.edu.vn / 12345678';`);
L(`PRINT 'UI: /coordinator/assignments/teams  (select Assignment Demo event)';`);

const out = path.join(__dirname, "seed_assignment_demo.sql");
fs.writeFileSync(out, lines.join("\n") + "\n", "utf8");
console.log(`Wrote ${out} (${lines.length} lines)`);
