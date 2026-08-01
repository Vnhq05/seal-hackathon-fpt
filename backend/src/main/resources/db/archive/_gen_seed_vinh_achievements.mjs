/**
 * Generate seed_vinh_achievements.sql — full COMPLETED graph for 3 Vinh Showcase events.
 * Password: Demo@123456
 *   node _gen_seed_vinh_achievements.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PWD = "$2a$10$7ZqT629/ciaVAXuzx7B0zO.wFlLuVz6NK3/tNioMOWFLb2gPkXeU2";

/** event 0=staff, 1..3 showcase; kind; seq — prefix B1 */
const uid = (event, kind, seq) => {
  const e = Number(event).toString(16).padStart(2, "0");
  const k = Number(kind).toString(16).padStart(2, "0");
  const s = Number(seq).toString(16).padStart(12, "0");
  return `B1${e}${k}00-EEEE-4EEE-8EEE-${s}`.toUpperCase();
};

const lines = [];
const L = (s = "") => lines.push(s);
const esc = (s) => String(s).replace(/'/g, "''");

const upsert = (id, email, name, type, sid, sem) => {
  const sidSql = sid ? `N'${esc(sid)}'` : "NULL";
  const semSql = sem == null ? "NULL" : String(sem);
  L(`IF EXISTS (SELECT 1 FROM users WHERE email = N'${esc(email)}')`);
  L(`  UPDATE users SET password_hash=@pwd, full_name=N'${esc(name)}', user_type=N'${type}', status=N'ACTIVE',`);
  L(`    failed_login_attempts=0, locked_until=NULL, student_id=${sidSql}, university_name=N'${type === "EXTERNAL_STUDENT" ? "External" : "FPT University"}',`);
  L(`    semester=${semSql}, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now, updated_by=@ownerEmail`);
  L(`  WHERE email=N'${esc(email)}';`);
  L(`ELSE`);
  L(`  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,`);
  L(`    user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,`);
  L(`    created_at,updated_at,created_by,updated_by)`);
  L(`  VALUES ('${id}',N'${esc(email)}',@pwd,N'${esc(name)}',NULL,NULL,${sidSql},N'${type === "EXTERNAL_STUDENT" ? "External" : "FPT University"}',`);
  L(`    N'${type}',N'ACTIVE',0,NULL,${semSql},N'ENROLLED',0,@now,@now,@ownerEmail,@ownerEmail);`);
  L(``);
};

L(`-- Full COMPLETED Vinh Showcase pack (3 events) + achievements for nguyentruongvinh05@gmail.com`);
L(`-- Password: Demo@123456`);
L(`-- Regenerate: node _gen_seed_vinh_achievements.mjs`);
L(`-- Run: sqlcmd -S localhost,1433 -U sa -P <pwd> -C -d SEAL -f 65001 -I -i seed_vinh_achievements.sql`);
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
L(`  SELECT TOP 1 id FROM users WHERE email IN (N'admin@seal.com', N'test.coord@fpt.edu.vn')`);
L(`  ORDER BY CASE email WHEN N'admin@seal.com' THEN 0 ELSE 1 END);`);
L(`DECLARE @ownerEmail NVARCHAR(255) = (SELECT email FROM users WHERE id = @ownerUserId);`);
L(`IF @templateId IS NULL BEGIN RAISERROR('No scoring template.', 16, 1); ROLLBACK; RETURN; END`);
L(`IF @ownerUserId IS NULL BEGIN RAISERROR('Need admin@seal.com.', 16, 1); ROLLBACK; RETURN; END`);
L(``);

// Wipe
L(`DECLARE @packEvents TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);`);
for (let e = 1; e <= 3; e++) L(`INSERT INTO @packEvents VALUES ('${uid(e, 1, 1)}');`);
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
L(`IF OBJECT_ID(N'dbo.submission_attachments', N'U') IS NOT NULL`);
L(`  DELETE sa FROM submission_attachments sa INNER JOIN submission_versions sv ON sv.id = sa.submission_version_id WHERE sv.submission_id IN (SELECT id FROM @packSubs);`);
L(`UPDATE submissions SET current_version_id = NULL WHERE id IN (SELECT id FROM @packSubs);`);
L(`DELETE FROM submission_versions WHERE submission_id IN (SELECT id FROM @packSubs);`);
L(`DELETE FROM submissions WHERE id IN (SELECT id FROM @packSubs);`);
L(`IF OBJECT_ID(N'dbo.published_results', N'U') IS NOT NULL DELETE FROM published_results WHERE round_id IN (SELECT id FROM @packRounds);`);
L(`IF OBJECT_ID(N'dbo.rankings', N'U') IS NOT NULL DELETE FROM rankings WHERE round_id IN (SELECT id FROM @packRounds);`);
L(`IF OBJECT_ID(N'dbo.finalist_selections', N'U') IS NOT NULL DELETE FROM finalist_selections WHERE event_id IN (SELECT id FROM @packEvents);`);
L(`DELETE FROM team_awards WHERE event_id IN (SELECT id FROM @packEvents);`);
L(`DELETE FROM participation_certificates WHERE event_id IN (SELECT id FROM @packEvents);`);
L(`IF OBJECT_ID(N'dbo.participant_feedbacks', N'U') IS NOT NULL DELETE FROM participant_feedbacks WHERE event_id IN (SELECT id FROM @packEvents);`);
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

upsert(uid(0, 0, 1), "nguyentruongvinh05@gmail.com", "Nguyen Truong Vinh", "EXTERNAL_STUDENT", null, null);
upsert(uid(0, 0, 2), "vinh.mate1@fpt.edu.vn", "Vinh Mate One", "FPT_STUDENT", "VM2001", 5);
upsert(uid(0, 0, 3), "vinh.mate2@fpt.edu.vn", "Vinh Mate Two", "FPT_STUDENT", "VM2002", 5);
// 9 rival teams × 3 members = 27 users
for (let i = 1; i <= 27; i++) {
  upsert(uid(0, 9, i), `vinh.r${String(i).padStart(2, "0")}@fpt.edu.vn`, `Vinh Rival ${String(i).padStart(2, "0")}`, "FPT_STUDENT", `VR${2000 + i}`, 5);
}

L(`DECLARE @vinhId UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'nguyentruongvinh05@gmail.com');`);
L(`DECLARE @mate1Id UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.mate1@fpt.edu.vn');`);
L(`DECLARE @mate2Id UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.mate2@fpt.edu.vn');`);
for (let i = 1; i <= 27; i++) {
  L(`DECLARE @r${i} UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'vinh.r${String(i).padStart(2, "0")}@fpt.edu.vn');`);
}
L(`DECLARE @coordId UNIQUEIDENTIFIER = COALESCE((SELECT id FROM users WHERE email=N'test.coord@fpt.edu.vn'), @ownerUserId);`);
L(`DECLARE @j1 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.judge1@fpt.edu.vn');`);
L(`DECLARE @j2 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'test.judge2@fpt.edu.vn');`);
L(`IF @j1 IS NULL OR @j2 IS NULL BEGIN RAISERROR('Need test.judge1/2 — run seed_feature_demo_pack.sql first.', 16, 1); ROLLBACK; RETURN; END`);
L(``);

const TEAM_COUNT = 10;
const FINALIST_COUNT = 4;
const RIVAL_NAMES = ["Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa"];

const EVENTS = [
  {
    n: 1,
    name: "Vinh Showcase 1 - RAG Champions",
    season: "Summer",
    year: 2025,
    track: "Champion Track",
    offsetStart: -120,
    offsetEnd: -90,
    // prize order by team index 0=Vinh,1=Beta,2=Gamma
    prizeRanks: ["FIRST", "SECOND", "THIRD"],
    vinhTeamIdx: 0,
  },
  {
    n: 2,
    name: "Vinh Showcase 2 - Multi-hop Arena",
    season: "Fall",
    year: 2025,
    track: "Arena Track",
    offsetStart: -80,
    offsetEnd: -50,
    prizeRanks: ["SECOND", "FIRST", "THIRD"], // Vinh second
    vinhTeamIdx: 0,
  },
  {
    n: 3,
    name: "Vinh Showcase 3 - Alumni Build Day",
    season: "Spring",
    year: 2026,
    track: "Alumni Track",
    offsetStart: -40,
    offsetEnd: -10,
    prizeRanks: ["THIRD", "FIRST", "SECOND"], // Vinh third
    vinhTeamIdx: 0,
  },
];

const teamDefs = [
  { leaders: ["@vinhId", "@mate1Id", "@mate2Id"], leadVar: "@vinhId" },
  ...Array.from({ length: 9 }, (_, i) => {
    const a = i * 3 + 1;
    return { leaders: [`@r${a}`, `@r${a + 1}`, `@r${a + 2}`], leadVar: `@r${a}` };
  }),
];

for (const ev of EVENTS) {
  const e = ev.n;
  const eventId = uid(e, 1, 1);
  const trackId = uid(e, 4, 1);
  const groupId = uid(e, 10, 1);
  const prelimId = uid(e, 3, 1);
  const finalId = uid(e, 3, 2);
  const s = ev.offsetStart;
  const end = ev.offsetEnd;

  L(`-- ========== ${esc(ev.name)} ==========`);
  L(`INSERT INTO hackathon_events (`);
  L(`  id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,`);
  L(`  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,`);
  L(`  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at,`);
  L(`  avatar_url, score_scale_max`);
  L(`) VALUES (`);
  L(`  '${eventId}', N'${esc(ev.name)}', N'${ev.season}', ${ev.year},`);
  L(`  DATEADD(DAY,${s},@today), DATEADD(DAY,${end},@today),`);
  L(`  DATEADD(DAY,${s - 30},@today), DATEADD(DAY,${s - 10},@today),`);
  L(`  N'Full COMPLETED showcase for achievements QA.', N'FPT University HCM', N'OFFLINE', N'SEAL_RAG_2026',`);
  L(`  3, 5, 4, 8, @templateId, N'COMPLETED', 1, @coordId, @ownerEmail, @now, @now, NULL, 100);`);

  L(`INSERT INTO tracks (id, event_id, name, description, max_teams, status, topic, created_at, updated_at, created_by)`);
  L(`VALUES ('${trackId}', '${eventId}', N'${esc(ev.track)}', N'Showcase track', 15, N'OPEN', NULL, @now, @now, @ownerEmail);`);

  L(`INSERT INTO competition_groups (id, track_id, event_id, name, max_teams, sort_order, created_at, updated_at, created_by)`);
  L(`VALUES ('${groupId}', '${trackId}', '${eventId}', N'Group A', 15, 0, @now, @now, @ownerEmail);`);

  L(`INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, min_judges_per_round, created_at, updated_at, created_by) VALUES`);
  L(`  ('${prelimId}', '${eventId}', 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(DAY,${s + 5},@now), DATEADD(DAY,${s + 20},@now), DATEADD(DAY,${s + 15},@now), DATEADD(DAY,${s + 15},@now), DATEADD(DAY,${s + 20},@now), ${FINALIST_COUNT}, N'PER_TRACK_TOP_N', 40, 2, @now, @now, @ownerEmail),`);
  L(`  ('${finalId}', '${eventId}', 2, N'Finals', N'FINAL', DATEADD(DAY,${end - 10},@now), DATEADD(DAY,${end},@now), NULL, DATEADD(DAY,${end - 5},@now), DATEADD(DAY,${end},@now), 4, N'FINALIST_POOL', 60, 2, @now, @now, @ownerEmail);`);

  // criteria both rounds
  for (const [roundId, base] of [
    [prelimId, 1],
    [finalId, 4],
  ]) {
    L(`INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at, created_by) VALUES`);
    L(`  ('${uid(e, 6, base)}', '${roundId}', N'Technical', N'Technical', 40, 0, 1, 100, @now, @now, @ownerEmail),`);
    L(`  ('${uid(e, 6, base + 1)}', '${roundId}', N'Innovation', N'Innovation', 30, 1, 1, 100, @now, @now, @ownerEmail),`);
    L(`  ('${uid(e, 6, base + 2)}', '${roundId}', N'Presentation', N'Presentation', 30, 2, 1, 100, @now, @now, @ownerEmail);`);
  }

  L(`INSERT INTO event_schedules (id, event_id, type, title, description, start_time, end_time, gate, sort_order, created_at, updated_at) VALUES`);
  L(`  ('${uid(e, 8, 1)}', '${eventId}', N'WORKSHOP', N'Workshop', NULL, DATEADD(DAY,${s + 2},@now), DATEADD(HOUR,3,DATEADD(DAY,${s + 2},@now)), NULL, 0, @now, @now),`);
  L(`  ('${uid(e, 8, 2)}', '${eventId}', N'OPENING', N'Opening', N'Kickoff', DATEADD(DAY,${s + 4},@now), DATEADD(HOUR,2,DATEADD(DAY,${s + 4},@now)), NULL, 1, @now, @now),`);
  L(`  ('${uid(e, 8, 3)}', '${eventId}', N'SCORING', N'Final scoring', NULL, DATEADD(DAY,${end - 3},@now), DATEADD(DAY,${end},@now), NULL, 2, @now, @now);`);

  // prizes
  const prizeIds = [uid(e, 7, 1), uid(e, 7, 2), uid(e, 7, 3)];
  const ranks = ["FIRST", "SECOND", "THIRD"];
  const values = ["10,000,000 VND + Trophy", "5,000,000 VND", "2,000,000 VND"];
  L(`INSERT INTO prizes (id, created_at, created_by, quantity, [rank], value, event_id, label, track_id) VALUES`);
  L(
    ranks
      .map(
        (r, i) =>
          `  ('${prizeIds[i]}', @now, @ownerEmail, 1, N'${r}', N'${values[i]}', '${eventId}', N'${r === "FIRST" ? "First" : r === "SECOND" ? "Second" : "Third"} Prize', NULL)${i < 2 ? "," : ";"}`
      )
      .join("\n")
  );

  // enroll all showcase participants
  L(`INSERT INTO event_enrollments (id, created_at, created_by, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)`);
  L(`SELECT NEWID(), @now, @ownerEmail, DATEADD(DAY,${s - 5},@now), '${eventId}', N'APPROVED', u.id, 0, 1`);
  L(`FROM users u WHERE u.email IN (`);
  L(`  N'nguyentruongvinh05@gmail.com', N'vinh.mate1@fpt.edu.vn', N'vinh.mate2@fpt.edu.vn',`);
  const rivalEmails = Array.from({ length: 27 }, (_, i) => `N'vinh.r${String(i + 1).padStart(2, "0")}@fpt.edu.vn'`);
  for (let i = 0; i < rivalEmails.length; i += 6) {
    const chunk = rivalEmails.slice(i, i + 6).join(", ");
    L(`  ${chunk}${i + 6 < rivalEmails.length ? "," : ");"}`);
  }

  // judges
  L(`INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id, created_by) VALUES`);
  L(`  (NEWID(), @now, @now, @j1, '${eventId}', @ownerEmail),`);
  L(`  (NEWID(), @now, @now, @j2, '${eventId}', @ownerEmail);`);
  L(`INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active, created_by) VALUES`);
  L(`  (NEWID(), @now, @now, @j1, '${prelimId}', N'ROUND', 1, @ownerEmail),`);
  L(`  (NEWID(), @now, @now, @j2, '${prelimId}', N'ROUND', 1, @ownerEmail),`);
  L(`  (NEWID(), @now, @now, @j1, '${finalId}', N'ROUND', 1, @ownerEmail),`);
  L(`  (NEWID(), @now, @now, @j2, '${finalId}', N'ROUND', 1, @ownerEmail);`);

  const teamIds = Array.from({ length: TEAM_COUNT }, (_, t) => uid(e, 2, t + 1));
  const vinhName = e === 1 ? "Team Vinh Champions" : e === 2 ? "Team Vinh Silver" : "Team Vinh Bronze";
  const names = [vinhName, ...RIVAL_NAMES.map((n) => `Team Rival ${n}`)];

  // Map prize rank string to prize id
  const rankToPrize = { FIRST: prizeIds[0], SECOND: prizeIds[1], THIRD: prizeIds[2] };

  // Prelim scores descending: team0 highest … team9 lowest; awards still follow prizeRanks for top 3
  const prelimBases = Array.from({ length: TEAM_COUNT }, (_, t) => 95 - t * 3);
  const finalBases = Array.from({ length: FINALIST_COUNT }, (_, t) => 92 - t * 6);

  for (let t = 0; t < TEAM_COUNT; t++) {
    const teamId = teamIds[t];
    const members = teamDefs[t].leaders;
    const lead = teamDefs[t].leadVar;
    L(`INSERT INTO teams (id, created_at, created_by, event_id, leader_id, name, status, track_id, group_id, track_assigned_at, track_assignment_method, track_assigned_by, is_recruiting, recruitment_note, version)`);
    L(`VALUES ('${teamId}', @now, @ownerEmail, '${eventId}', ${lead}, N'${esc(names[t])}', N'CONFIRMED', '${trackId}', '${groupId}', @now, N'MANUAL', @coordId, 0, N'Showcase', 0);`);
    L(`INSERT INTO team_members (id, created_at, created_by, joined_at, role, user_id, team_id, event_id) VALUES`);
    L(`  (NEWID(), @now, @ownerEmail, DATEADD(DAY,${s - 5},@now), N'LEADER', ${members[0]}, '${teamId}', '${eventId}'),`);
    L(`  (NEWID(), @now, @ownerEmail, DATEADD(DAY,${s - 5},@now), N'MEMBER', ${members[1]}, '${teamId}', '${eventId}'),`);
    L(`  (NEWID(), @now, @ownerEmail, DATEADD(DAY,${s - 5},@now), N'MEMBER', ${members[2]}, '${teamId}', '${eventId}');`);

    // Prelim submission
    const subP = uid(e, 5, t + 1);
    const verP = uid(e, 11, t + 1);
    L(`INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)`);
    L(`VALUES ('${subP}', @now, @ownerEmail, NULL, '${prelimId}', N'SCORED', ${lead}, '${teamId}', 0);`);
    L(`INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)`);
    L(`VALUES ('${verP}', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e${e}-t${t + 1}', N'https://docs.google.com/presentation/d/vinh-e${e}-t${t + 1}', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,${s + 14},@now), 1, '${subP}');`);
    L(`UPDATE submissions SET current_version_id='${verP}' WHERE id='${subP}';`);

    for (const [ji, jvar] of [
      [1, "@j1"],
      [2, "@j2"],
    ]) {
      const scoreId = uid(e, 12, t * 10 + ji);
      const base = prelimBases[t];
      L(`INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)`);
      L(`VALUES ('${scoreId}', @now, @ownerEmail, DATEADD(DAY,${s + 18},@now), ${jvar}, '${prelimId}', DATEADD(DAY,${s + 17},@now), N'COMPLETED', '${subP}', 0);`);
      L(`INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES`);
      L(`  (NEWID(), @now, @ownerEmail, '${uid(e, 6, 1)}', ${base}, '${scoreId}'),`);
      L(`  (NEWID(), @now, @ownerEmail, '${uid(e, 6, 2)}', ${base}, '${scoreId}'),`);
      L(`  (NEWID(), @now, @ownerEmail, '${uid(e, 6, 3)}', ${Math.max(1, base - 5)}, '${scoreId}');`);
    }

    L(`INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)`);
    L(`VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,${s + 20},@now), ${prelimBases[t]}.00, ${t + 1}, '${prelimId}', '${teamId}', 1, 0, @now);`);
  }

  // Finalists: top N by prelim rank
  L(`INSERT INTO finalist_selections (id, event_id, team_id, track_id, preliminary_rank, selected_reason, selected_at, created_at, updated_at, selection_method, eligible) VALUES`);
  for (let t = 0; t < FINALIST_COUNT; t++) {
    L(`  ('${uid(e, 13, t + 1)}', '${eventId}', '${teamIds[t]}', '${trackId}', ${t + 1}, N'Top ${t + 1}', DATEADD(DAY,${s + 21},@now), @now, @now, N'AUTO', 1)${t < FINALIST_COUNT - 1 ? "," : ";"}`);
  }

  // Final submissions for finalists
  for (let t = 0; t < FINALIST_COUNT; t++) {
    const teamId = teamIds[t];
    const lead = teamDefs[t].leadVar;
    const subF = uid(e, 5, 20 + t);
    const verF = uid(e, 11, 20 + t);
    L(`INSERT INTO submissions (id, created_at, created_by, current_version_id, round_id, status, submitted_by, team_id, opt_lock)`);
    L(`VALUES ('${subF}', @now, @ownerEmail, NULL, '${finalId}', N'SCORED', ${lead}, '${teamId}', 0);`);
    L(`INSERT INTO submission_versions (id, created_at, created_by, demo_url, github_url, slide_url, other_url, submitted_at, version_number, submission_id)`);
    L(`VALUES ('${verF}', @now, @ownerEmail, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/vinh-e${e}-final-t${t + 1}', N'https://docs.google.com/presentation/d/vinh-e${e}-final-t${t + 1}', N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', DATEADD(DAY,${end - 6},@now), 1, '${subF}');`);
    L(`UPDATE submissions SET current_version_id='${verF}' WHERE id='${subF}';`);
    for (const [ji, jvar] of [
      [1, "@j1"],
      [2, "@j2"],
    ]) {
      const scoreId = uid(e, 12, 100 + t * 10 + ji);
      const base = finalBases[t];
      L(`INSERT INTO judge_scores (id, created_at, created_by, completed_at, judge_user_id, round_id, started_at, status, submission_id, version)`);
      L(`VALUES ('${scoreId}', @now, @ownerEmail, DATEADD(DAY,${end - 2},@now), ${jvar}, '${finalId}', DATEADD(DAY,${end - 3},@now), N'COMPLETED', '${subF}', 0);`);
      L(`INSERT INTO judge_score_details (id, created_at, created_by, criteria_id, score, judge_score_id) VALUES`);
      L(`  (NEWID(), @now, @ownerEmail, '${uid(e, 6, 4)}', ${base}, '${scoreId}'),`);
      L(`  (NEWID(), @now, @ownerEmail, '${uid(e, 6, 5)}', ${base}, '${scoreId}'),`);
      L(`  (NEWID(), @now, @ownerEmail, '${uid(e, 6, 6)}', ${Math.max(1, base - 4)}, '${scoreId}');`);
    }
    L(`INSERT INTO rankings (id, created_at, created_by, calculated_at, final_score, rank, round_id, team_id, version, lock_version, updated_at)`);
    L(`VALUES (NEWID(), @now, @ownerEmail, DATEADD(DAY,${end},@now), ${finalBases[t]}.00, ${t + 1}, '${finalId}', '${teamId}', 1, 0, @now);`);
  }

  L(`INSERT INTO published_results (id, created_at, dispute_deadline, published_at, published_by, round_id) VALUES`);
  L(`  ('${uid(e, 14, 1)}', @now, DATEADD(DAY,2,DATEADD(DAY,${s + 20},@now)), DATEADD(DAY,${s + 20},@now), @coordId, '${prelimId}'),`);
  L(`  ('${uid(e, 14, 2)}', @now, DATEADD(DAY,2,DATEADD(DAY,${end},@now)), DATEADD(DAY,${end},@now), @coordId, '${finalId}');`);

  // Awards: prizeRanks[t] for team t (top 3 podium only)
  L(`INSERT INTO team_awards (id, event_id, team_id, prize_id, awarded_at, created_at, updated_at, created_by) VALUES`);
  for (let t = 0; t < 3; t++) {
    const pr = ev.prizeRanks[t];
    L(`  ('${uid(e, 15, t + 1)}', '${eventId}', '${teamIds[t]}', '${rankToPrize[pr]}', DATEADD(DAY,${end},@now), @now, @now, @ownerEmail)${t < 2 ? "," : ";"}`);
  }

  // Certificates for all members
  L(`INSERT INTO participation_certificates (id, created_at, created_by, event_id, user_id, team_id, issued_at)`);
  L(`SELECT NEWID(), @now, @ownerEmail, '${eventId}', tm.user_id, tm.team_id, DATEADD(DAY,${end},@now)`);
  L(`FROM team_members tm WHERE tm.event_id = '${eventId}';`);

  // Feedback from Vinh
  L(`INSERT INTO participant_feedbacks (id, created_at, created_by, comment, event_id, overall_rating, submitted_at, team_id, user_id)`);
  L(`VALUES ('${uid(e, 16, 1)}', @now, @ownerEmail, N'Great event — clear rounds and fair judging.', '${eventId}', 5, DATEADD(DAY,${end + 1},@now), '${teamIds[0]}', @vinhId);`);
  L(``);
}

L(`COMMIT TRANSACTION;`);
L(`PRINT 'seed_vinh_achievements.sql complete (full COMPLETED graph)';`);
L(`PRINT 'Login: nguyentruongvinh05@gmail.com / Demo@123456';`);
L(`PRINT 'Awards: Showcase1 FIRST, Showcase2 SECOND, Showcase3 THIRD + certificates';`);

fs.writeFileSync(path.join(__dirname, "seed_vinh_achievements.sql"), lines.join("\n") + "\n", "utf8");
console.log(`Wrote seed_vinh_achievements.sql (${lines.length} lines)`);
