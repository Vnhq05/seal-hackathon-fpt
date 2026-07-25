/**
 * Generate seed_as2_full_demo.sql — progress (9 teams) + livescore (9 teams) + completed published.
 * Run: node _gen_seed_as2_full_demo.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PWD = "$2a$10$3Ee4YwgqIw0MnDJeYtNDOOccbcr7G/t0mhmapneTSjuZTh9qa6AMq"; // 12345678

const uid = (kind, eventN, seq) => {
  const e = Number(eventN).toString(16).padStart(2, "0");
  const k = Number(kind).toString(16).padStart(2, "0");
  const s = Number(seq).toString(16).padStart(12, "0");
  return `${e}${k}0000-EEEE-4EEE-8EEE-${s}`.toUpperCase();
};

const TRACKS = ["Grounded Retrieval", "Agent Orchestration", "Enterprise Copilot"];
const TEAM_NAMES = {
  progress: ["AlphaPulse", "BetaForge", "GammaHop", "DeltaRAG", "EpsilonBot", "ZetaPilot", "EtaChain", "ThetaVault", "IotaLens"],
  live: ["LiveNova", "LiveOrbit", "LiveQuark", "LivePulse", "LiveVector", "LivePrism", "LiveNexus", "LiveSpark", "LiveAxiom"],
  done: ["DoneApex", "DoneBolt", "DoneCrest", "DoneDrift", "DoneEcho", "DoneFlux", "DoneGlow", "DoneHalo", "DoneIon"],
};

const PRELIM_W = [25, 30, 25, 20];
const FINAL_W = [25, 30, 25, 20];
const PRELIM_PROFILES = [
  [5, 5, 5, 4],
  [5, 4, 5, 4],
  [4, 5, 4, 4],
  [4, 4, 5, 4],
  [4, 4, 4, 3],
  [4, 3, 4, 4],
  [3, 4, 3, 4],
  [3, 3, 4, 3],
  [3, 3, 3, 3],
];
const FINAL_PROFILES = [
  [5, 5, 5, 5],
  [5, 5, 4, 5],
  [5, 4, 5, 4],
  [4, 5, 4, 5],
  [4, 4, 5, 4],
  [4, 4, 4, 4],
];

function weighted(scores, weights) {
  let s = 0;
  for (let i = 0; i < scores.length; i++) s += scores[i] * (weights[i] / 100);
  return Math.round(s * 10000) / 10000;
}
function nudge(scores, d) {
  return scores.map((s, i) => Math.min(5, Math.max(1, s + (i % 2 === 0 ? d : 0))));
}
function esc(s) {
  return String(s).replace(/'/g, "''");
}

const lines = [];
const L = (s = "") => lines.push(s);

L(`-- AS2 full demo seed: progress (9 teams) + livescore (9 teams) + completed published.`);
L(`-- Password for ALL accounts: 12345678`);
L(`-- Uses SYSDATETIME() (local) so progress rules match JVM LocalDateTime.`);
L(`-- Run: sqlcmd -S localhost -U sa -P <password> -d SEAL -I -i seed_as2_full_demo.sql`);
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

// Staff + students
const staff = [
  ["admin@seal.com", "System Admin", "SYSTEM_ADMIN", null, null],
  ["coordinator@seal.com", "Demo Coordinator", "EVENT_COORDINATOR", null, null],
  ["lecturer1@fpt.edu.vn", "Lecturer One", "LECTURER", null, null],
  ["lecturer2@fpt.edu.vn", "Lecturer Two", "LECTURER", null, null],
  ["lecturer3@fpt.edu.vn", "Lecturer Three", "LECTURER", null, null],
  ["mentor.lbtest@fpt.edu.vn", "Mentor LB Test", "LECTURER", null, null],
];
const students = [];
for (let i = 1; i <= 27; i++) {
  const n = String(i).padStart(2, "0");
  students.push([`as2.s${n}@fpt.edu.vn`, `AS2 Student ${n}`, "FPT_STUDENT", `SE29${String(100 + i)}`, 4 + (i % 5)]);
}

L(`-- Accounts`);
for (const [email, name, type, sid, sem] of [...staff, ...students]) {
  const sidSql = sid ? `N'${sid}'` : "NULL";
  const semSql = sem == null ? "NULL" : String(sem);
  L(`IF EXISTS (SELECT 1 FROM users WHERE email = N'${email}')`);
  L(`  UPDATE users SET password_hash=@pwd, full_name=N'${esc(name)}', user_type=N'${type}', status=N'ACTIVE',`);
  L(`    failed_login_attempts=0, locked_until=NULL, student_id=${sidSql}, university_name=N'FPT University',`);
  L(`    semester=${semSql}, student_standing=N'ENROLLED', temporary_account=0, updated_at=@now WHERE email=N'${email}';`);
  L(`ELSE`);
  L(`  INSERT INTO users (id,email,password_hash,full_name,phone,avatar_url,student_id,university_name,user_type,status,failed_login_attempts,locked_until,semester,student_standing,temporary_account,created_at,updated_at)`);
  L(`  VALUES (NEWID(),N'${email}',@pwd,N'${esc(name)}',NULL,NULL,${sidSql},N'FPT University',N'${type}',N'ACTIVE',0,NULL,${semSql},N'ENROLLED',0,@now,@now);`);
  L(``);
}

L(`DECLARE @coordId UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'coordinator@seal.com');`);
L(`DECLARE @mentorId UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'mentor.lbtest@fpt.edu.vn');`);
L(`DECLARE @j1 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'lecturer1@fpt.edu.vn');`);
L(`DECLARE @j2 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'lecturer2@fpt.edu.vn');`);
L(`DECLARE @j3 UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'lecturer3@fpt.edu.vn');`);
for (let i = 1; i <= 27; i++) {
  const n = String(i).padStart(2, "0");
  L(`DECLARE @s${n} UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email=N'as2.s${n}@fpt.edu.vn');`);
}
L(``);

const EVENT_IDS = {
  progress: "C1000001-EEEE-4EEE-8EEE-000000000001",
  live: "C1000002-EEEE-4EEE-8EEE-000000000001",
  done: "C1000003-EEEE-4EEE-8EEE-000000000001",
};

// Wipe prior AS2 full demo events
L(`DECLARE @wipe TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);`);
L(`INSERT INTO @wipe VALUES ('${EVENT_IDS.progress}'),('${EVENT_IDS.live}'),('${EVENT_IDS.done}');`);
L(`DECLARE @wTeams TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);`);
L(`INSERT INTO @wTeams SELECT id FROM teams WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DECLARE @wRounds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);`);
L(`INSERT INTO @wRounds SELECT id FROM rounds WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DECLARE @wSubs TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);`);
L(`INSERT INTO @wSubs SELECT id FROM submissions WHERE team_id IN (SELECT id FROM @wTeams);`);
L(`DELETE FROM notification_recipients WHERE notification_id IN (SELECT id FROM notifications WHERE type=N'TEAM_PROGRESS_ALERT' AND reference_id IN (SELECT id FROM @wTeams));`);
L(`DELETE FROM notifications WHERE type=N'TEAM_PROGRESS_ALERT' AND reference_id IN (SELECT id FROM @wTeams);`);
L(`DELETE FROM team_progress_alerts WHERE team_id IN (SELECT id FROM @wTeams);`);
L(`DELETE jc FROM judge_comments jc INNER JOIN judge_scores js ON js.id=jc.judge_score_id WHERE js.submission_id IN (SELECT id FROM @wSubs);`);
L(`DELETE jsd FROM judge_score_details jsd INNER JOIN judge_scores js ON js.id=jsd.judge_score_id WHERE js.submission_id IN (SELECT id FROM @wSubs);`);
L(`DELETE FROM judge_scores WHERE submission_id IN (SELECT id FROM @wSubs);`);
L(`DELETE sa FROM submission_attachments sa INNER JOIN submission_versions sv ON sv.id=sa.submission_version_id WHERE sv.submission_id IN (SELECT id FROM @wSubs);`);
L(`DELETE FROM submission_versions WHERE submission_id IN (SELECT id FROM @wSubs);`);
L(`DELETE FROM submissions WHERE id IN (SELECT id FROM @wSubs);`);
L(`DELETE FROM mentor_teams WHERE team_id IN (SELECT id FROM @wTeams);`);
L(`DELETE FROM team_members WHERE team_id IN (SELECT id FROM @wTeams);`);
L(`DELETE FROM teams WHERE id IN (SELECT id FROM @wTeams);`);
L(`DELETE FROM event_enrollments WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM team_awards WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM finalist_selections WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM rankings WHERE round_id IN (SELECT id FROM @wRounds);`);
L(`DELETE FROM published_results WHERE round_id IN (SELECT id FROM @wRounds);`);
L(`IF OBJECT_ID(N'advancements',N'U') IS NOT NULL DELETE FROM advancements WHERE round_id IN (SELECT id FROM @wRounds);`);
L(`DELETE FROM judge_assignments WHERE round_id IN (SELECT id FROM @wRounds);`);
L(`DELETE FROM criteria WHERE round_id IN (SELECT id FROM @wRounds);`);
L(`DELETE FROM rounds WHERE id IN (SELECT id FROM @wRounds);`);
L(`DELETE FROM event_judge_assignments WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM event_mentor_assignments WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM mentor_assignments WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM prizes WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM tracks WHERE event_id IN (SELECT id FROM @wipe);`);
L(`DELETE FROM hackathon_events WHERE id IN (SELECT id FROM @wipe);`);
L(``);

function emitEventShell(opts) {
  const { eventKey, eventId, name, status, leaderboard, season, year } = opts;
  const n = eventKey === "progress" ? 1 : eventKey === "live" ? 2 : 3;
  L(`-- === ${name} ===`);
  L(`INSERT INTO hackathon_events (`);
  L(`  id, name, season, year, start_date, end_date, registration_open_date, registration_deadline,`);
  L(`  description, location, format, competition_format, min_team, max_team, semester_min, semester_max,`);
  L(`  scoring_template_id, status, leaderboard_public, owner_user_id, created_by, created_at, updated_at`);
  L(`) VALUES (`);
  L(`  '${eventId}', N'${esc(name)}', N'${season}', ${year},`);
  if (eventKey === "progress") {
    L(`  CAST(DATEADD(DAY,-1,@now) AS DATE), CAST(DATEADD(DAY,3,@now) AS DATE),`);
    L(`  CAST(DATEADD(DAY,-20,@now) AS DATE), CAST(DATEADD(DAY,-1,@now) AS DATE),`);
  } else if (eventKey === "live") {
    L(`  CAST(DATEADD(DAY,-5,@now) AS DATE), CAST(DATEADD(DAY,10,@now) AS DATE),`);
    L(`  CAST(DATEADD(DAY,-40,@now) AS DATE), CAST(DATEADD(DAY,-10,@now) AS DATE),`);
  } else {
    L(`  '2026-04-12', '2026-04-12', '2026-01-10', '2026-03-20',`);
  }
  L(`  N'AS2 demo event', N'FPT University HCM', N'OFFLINE', N'GENERIC',`);
  L(`  1, 5, 1, 9, @templateId, N'${status}', ${leaderboard}, @coordId, N'coordinator@seal.com', @now, @now`);
  L(`);`);
  L(``);

  const tracks = TRACKS.map((tn, i) => ({ id: uid(4, n, i + 1), name: tn, idx: i }));
  L(`INSERT INTO tracks (id, event_id, name, description, max_teams, status, created_at, updated_at) VALUES`);
  L(
    tracks
      .map((t, i) => `  ('${t.id}', '${eventId}', N'${t.name}', N'Track ${t.name}', 8, N'OPEN', @now, @now)${i < 2 ? "," : ";"}`)
      .join("\n")
  );
  L(``);

  const prelimId = uid(3, n, 1);
  const finalId = uid(3, n, 2);
  L(`INSERT INTO rounds (id, event_id, round_number, name, round_type, start_date, end_date, slide_deadline, submission_deadline, scoring_deadline, advancement_cutoff, advancement_rule, round_weight, created_at, updated_at) VALUES`);
  if (eventKey === "progress") {
    L(`  ('${prelimId}', '${eventId}', 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(DAY,-1,@now), DATEADD(DAY,2,@now), DATEADD(HOUR,-5,@now), DATEADD(HOUR,3,@now), DATEADD(DAY,2,@now), 2, N'PER_TRACK_TOP_N', 40, @now, @now),`);
    L(`  ('${finalId}', '${eventId}', 2, N'Finals', N'FINAL', DATEADD(DAY,2,@now), DATEADD(DAY,3,@now), NULL, DATEADD(DAY,2,@now), DATEADD(DAY,3,@now), 6, N'FINALIST_POOL', 60, @now, @now);`);
  } else if (eventKey === "live") {
    L(`  ('${prelimId}', '${eventId}', 1, N'Preliminary Round', N'PRELIMINARY', DATEADD(DAY,-3,@now), DATEADD(DAY,5,@now), DATEADD(DAY,-2,@now), DATEADD(HOUR,-12,@now), DATEADD(DAY,5,@now), 2, N'PER_TRACK_TOP_N', 40, @now, @now),`);
    L(`  ('${finalId}', '${eventId}', 2, N'Finals', N'FINAL', DATEADD(DAY,5,@now), DATEADD(DAY,8,@now), NULL, DATEADD(DAY,6,@now), DATEADD(DAY,8,@now), 6, N'NONE', 60, @now, @now);`);
  } else {
    L(`  ('${prelimId}', '${eventId}', 1, N'Preliminary Round', N'PRELIMINARY', '2026-04-12T07:00:00', '2026-04-12T15:30:00', '2026-04-12T10:00:00', '2026-04-12T14:00:00', '2026-04-12T15:30:00', 2, N'PER_TRACK_TOP_N', 40, @now, @now),`);
    L(`  ('${finalId}', '${eventId}', 2, N'Finals', N'FINAL', '2026-04-12T15:30:00', '2026-04-12T17:00:00', NULL, '2026-04-12T15:30:00', '2026-04-12T17:00:00', 6, N'FINALIST_POOL', 60, @now, @now);`);
  }
  L(``);

  const critP = [1, 2, 3, 4].map((i) => uid(6, n, i));
  const critF = [11, 12, 13, 14].map((i) => uid(6, n, i));
  const critNames = ["Innovation", "Technical", "Business Value", "Presentation"];
  L(`INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at) VALUES`);
  const critRows = [];
  critP.forEach((id, i) => critRows.push(`  ('${id}', '${prelimId}', N'${critNames[i]}', N'${critNames[i]}', ${PRELIM_W[i]}, ${i}, 1, 5, @now, @now)`));
  critF.forEach((id, i) => critRows.push(`  ('${id}', '${finalId}', N'${critNames[i]}', N'${critNames[i]}', ${FINAL_W[i]}, ${i}, 1, 5, @now, @now)`));
  L(critRows.join(",\n") + ";");
  L(``);

  const prizes = [1, 2, 3, 4].map((i) => uid(7, n, i));
  L(`INSERT INTO prizes (id, event_id, rank, value, quantity, label, created_at, updated_at) VALUES`);
  L(`  ('${prizes[0]}', '${eventId}', N'FIRST', N'7000000', 1, N'First Prize', @now, @now),`);
  L(`  ('${prizes[1]}', '${eventId}', N'SECOND', N'5000000', 1, N'Second Prize', @now, @now),`);
  L(`  ('${prizes[2]}', '${eventId}', N'THIRD', N'3000000', 1, N'Third Prize', @now, @now),`);
  L(`  ('${prizes[3]}', '${eventId}', N'CONSOLATION', N'1500000', 1, N'Consolation Prize', @now, @now);`);
  L(``);

  return { n, eventId, prelimId, finalId, tracks, critP, critF, prizes };
}

function studentVar(globalIndex) {
  // 1-based index into as2.s01..s27
  return `@s${String(globalIndex).padStart(2, "0")}`;
}

function emitTeamsEnrollments(meta, names, studentOffset) {
  const { eventId, tracks, n } = meta;
  const teams = names.map((name, i) => ({
    id: uid(5, n, i + 1),
    name,
    trackIdx: Math.floor(i / 3),
    trackId: tracks[Math.floor(i / 3)].id,
    leaderVar: studentVar(studentOffset + i),
    profileIdx: i,
  }));

  L(`INSERT INTO event_enrollments (id, created_at, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public)`);
  L(`SELECT NEWID(), @now, @now, '${eventId}', N'APPROVED', u.id, 0, 0 FROM users u WHERE u.email IN (`);
  L(
    names
      .map((_, i) => {
        const idx = studentOffset + i;
        return `  N'as2.s${String(idx).padStart(2, "0")}@fpt.edu.vn'`;
      })
      .join(",\n")
  );
  L(`);`);
  L(``);

  L(`INSERT INTO teams (id, created_at, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, is_recruiting, recruitment_note, version) VALUES`);
  L(
    teams
      .map(
        (t, i) =>
          `  ('${t.id}', @now, '${eventId}', ${t.leaderVar}, N'${esc(t.name)}', N'CONFIRMED', '${t.trackId}', @now, N'MANUAL', 0, N'Demo team', 0)${i < 8 ? "," : ";"}`
      )
      .join("\n")
  );
  L(``);
  L(`INSERT INTO team_members (id, created_at, joined_at, role, user_id, team_id, event_id) VALUES`);
  L(
    teams
      .map((t, i) => `  (NEWID(), @now, @now, N'LEADER', ${t.leaderVar}, '${t.id}', '${eventId}')${i < 8 ? "," : ";"}`)
      .join("\n")
  );
  L(``);
  return teams;
}

function emitStaff(meta) {
  const { eventId, prelimId, finalId, tracks } = meta;
  L(`INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id) VALUES`);
  L(`  (NEWID(), @now, @now, @j1, '${eventId}'), (NEWID(), @now, @now, @j2, '${eventId}'), (NEWID(), @now, @now, @j3, '${eventId}');`);
  L(`INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active) VALUES`);
  L(`  (NEWID(), @now, @now, @j1, '${prelimId}', N'ROUND', 1), (NEWID(), @now, @now, @j2, '${prelimId}', N'ROUND', 1), (NEWID(), @now, @now, @j3, '${prelimId}', N'ROUND', 1),`);
  L(`  (NEWID(), @now, @now, @j1, '${finalId}', N'ROUND', 1), (NEWID(), @now, @now, @j2, '${finalId}', N'ROUND', 1), (NEWID(), @now, @now, @j3, '${finalId}', N'ROUND', 1);`);
  L(`INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at) VALUES (NEWID(), '${eventId}', @mentorId, @now, @now);`);
  L(`INSERT INTO mentor_assignments (id, created_at, assigned_at, mentor_user_id, event_id, track_id) VALUES`);
  L(
    tracks
      .map((t, i) => `  (NEWID(), @now, @now, @mentorId, '${eventId}', '${t.id}')${i < 2 ? "," : ";"}`)
      .join("\n")
  );
}

// -------- Progress event --------
{
  const meta = emitEventShell({
    eventKey: "progress",
    eventId: EVENT_IDS.progress,
    name: "AS2 Progress Demo - 9 Teams Submission Watch",
    status: "ACTIVE",
    leaderboard: 0,
    season: "Summer",
    year: 2026,
  });
  const teams = emitTeamsEnrollments(meta, TEAM_NAMES.progress, 1);
  emitStaff(meta);
  L(`INSERT INTO mentor_teams (id, created_at, assigned_at, mentor_user_id, team_id) VALUES`);
  L(teams.map((t, i) => `  (NEWID(), @now, @now, @mentorId, '${t.id}')${i < 8 ? "," : ";"}`).join("\n"));
  L(``);

  // kinds: 0-2 NOT_STARTED, 3-4 STALLED, 5-6 LAST_MINUTE, 7-8 OK
  const kinds = ["NOT_STARTED", "NOT_STARTED", "NOT_STARTED", "STALLED", "STALLED", "LAST_MINUTE", "LAST_MINUTE", "OK", "OK"];
  let subSeq = 1;
  let verSeq = 1;
  const subRows = [];
  const verRows = [];
  const attRows = [];
  const upd = [];
  const alertRows = [];
  const notifTeams = [];

  for (let i = 0; i < 9; i++) {
    const t = teams[i];
    const kind = kinds[i];
    if (kind === "NOT_STARTED") {
      alertRows.push(`  (NEWID(), '${t.id}', '${meta.prelimId}', N'CRITICAL', N'NOT_STARTED', @now, @now, @now)`);
      notifTeams.push({ t, msg: `Team ${esc(t.name)} has not started submission (NOT_STARTED).` });
      continue;
    }
    const subId = uid(0xd, meta.n, subSeq++);
    const verId = uid(0xe, meta.n, verSeq++);
    const slug = t.name.toLowerCase();
    subRows.push(`  ('${subId}', @now, NULL, '${meta.prelimId}', N'SUBMITTED', ${t.leaderVar}, '${t.id}', 0)`);
    if (kind === "STALLED") {
      verRows.push(`  ('${verId}', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/${slug}', N'https://docs.google.com/presentation/d/${slug}', DATEADD(HOUR,-30,@now), 1, '${subId}')`);
      attRows.push(`  (NEWID(), @now, N'pitch.pdf', 102400, N'/uploads/demo/${slug}.pdf', 2, '${verId}')`);
      alertRows.push(`  (NEWID(), '${t.id}', '${meta.prelimId}', N'AT_RISK', N'STALLED', @now, @now, @now)`);
      notifTeams.push({ t, msg: `Team ${esc(t.name)} stalled (STALLED).` });
      upd.push(`UPDATE submissions SET current_version_id='${verId}' WHERE id='${subId}';`);
    } else if (kind === "LAST_MINUTE") {
      verRows.push(`  ('${verId}', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/${slug}', N'https://docs.google.com/presentation/d/${slug}', DATEADD(MINUTE,-40,@now), 1, '${subId}')`);
      attRows.push(`  (NEWID(), @now, N'pitch.pdf', 102400, N'/uploads/demo/${slug}.pdf', 2, '${verId}')`);
      alertRows.push(`  (NEWID(), '${t.id}', '${meta.prelimId}', N'AT_RISK', N'SINGLE_VERSION_LAST_MINUTE', @now, @now, @now)`);
      notifTeams.push({ t, msg: `Team ${esc(t.name)} last-minute single version.` });
      upd.push(`UPDATE submissions SET current_version_id='${verId}' WHERE id='${subId}';`);
    } else {
      const ver2 = uid(0xe, meta.n, verSeq++);
      verRows.push(`  ('${verId}', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/${slug}', N'https://docs.google.com/presentation/d/${slug}-v1', DATEADD(HOUR,-40,@now), 1, '${subId}')`);
      verRows.push(`  ('${ver2}', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/${slug}', N'https://docs.google.com/presentation/d/${slug}-v2', DATEADD(HOUR,-2,@now), 2, '${subId}')`);
      attRows.push(`  (NEWID(), @now, N'pitch-v2.pdf', 204800, N'/uploads/demo/${slug}-v2.pdf', 2, '${ver2}')`);
      upd.push(`UPDATE submissions SET current_version_id='${ver2}' WHERE id='${subId}';`);
    }
  }

  if (subRows.length) {
    L(`INSERT INTO submissions (id, created_at, current_version_id, round_id, status, submitted_by, team_id, opt_lock) VALUES`);
    L(subRows.map((r, i) => `${r}${i < subRows.length - 1 ? "," : ";"}`).join("\n"));
    L(`INSERT INTO submission_versions (id, created_at, demo_url, github_url, slide_url, submitted_at, version_number, submission_id) VALUES`);
    L(verRows.map((r, i) => `${r}${i < verRows.length - 1 ? "," : ";"}`).join("\n"));
    L(`INSERT INTO submission_attachments (id, created_at, file_name, file_size, file_url, page_count, submission_version_id) VALUES`);
    L(attRows.map((r, i) => `${r}${i < attRows.length - 1 ? "," : ";"}`).join("\n"));
    upd.forEach((u) => L(u));
  }
  L(`INSERT INTO team_progress_alerts (id, team_id, round_id, risk_level, reasons, last_alerted_at, created_at, updated_at) VALUES`);
  L(alertRows.map((r, i) => `${r}${i < alertRows.length - 1 ? "," : ";"}`).join("\n"));
  L(``);
  const notifIds = notifTeams.map((_, i) => uid(0x19, meta.n, i + 1));
  L(`INSERT INTO notifications (id, created_at, message, reference_id, reference_type, title, type) VALUES`);
  L(
    notifTeams
      .map((x, i) => `  ('${notifIds[i]}', @now, N'${x.msg}', '${x.t.id}', N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT')${i < notifTeams.length - 1 ? "," : ";"}`)
      .join("\n")
  );
  const recip = [];
  notifTeams.forEach((x, i) => {
    recip.push(`  (NEWID(), @now, N'IN_APP', NULL, @now, ${x.t.leaderVar}, '${notifIds[i]}')`);
    recip.push(`  (NEWID(), @now, N'IN_APP', NULL, @now, @mentorId, '${notifIds[i]}')`);
    recip.push(`  (NEWID(), @now, N'IN_APP', NULL, @now, @coordId, '${notifIds[i]}')`);
  });
  L(`INSERT INTO notification_recipients (id, created_at, channel, read_at, sent_at, user_id, notification_id) VALUES`);
  L(recip.join(",\n") + ";");
  L(``);
}

function emitScoredEvent(
  eventKey,
  eventId,
  name,
  status,
  leaderboard,
  published,
  studentOffset,
  teamNames,
  partialScoring = false
) {
  const meta = emitEventShell({
    eventKey,
    eventId,
    name,
    status,
    leaderboard,
    season: eventKey === "done" ? "Spring" : "Summer",
    year: 2026,
  });
  const teams = emitTeamsEnrollments(meta, teamNames, studentOffset);
  emitStaff(meta);
  L(`INSERT INTO mentor_teams (id, created_at, assigned_at, mentor_user_id, team_id) VALUES`);
  L(teams.map((t, i) => `  (NEWID(), @now, @now, @mentorId, '${t.id}')${i < 8 ? "," : ";"}`).join("\n"));
  L(``);

  // Ranking preview
  const rankingPrelim = teams.map((t) => {
    const base = PRELIM_PROFILES[t.profileIdx];
    const j1 = base;
    const j2 = nudge(base, t.profileIdx % 2 === 0 ? -1 : 0);
    const j3 = nudge(base, t.profileIdx % 3 === 0 ? 0 : -1);
    const avg = Math.round(((weighted(j1, PRELIM_W) + weighted(j2, PRELIM_W) + weighted(j3, PRELIM_W)) / 3) * 10000) / 10000;
    return { team: t, score: avg, j1, j2, j3 };
  });
  rankingPrelim.sort((a, b) => b.score - a.score);
  const seen = new Set();
  rankingPrelim.forEach((r, i) => {
    let sc = Math.round((r.score - i * 0.01) * 10000) / 10000;
    while (seen.has(sc)) sc = Math.round((sc - 0.0001) * 10000) / 10000;
    seen.add(sc);
    r.score = sc;
    r.rank = i + 1;
  });

  const finalists = partialScoring
    ? []
    : [0, 1, 2].flatMap((tr) =>
        rankingPrelim
          .filter((r) => r.team.trackIdx === tr)
          .sort((a, b) => b.score - a.score)
          .slice(0, 2)
      );

  const rankedTeamIds = partialScoring ? new Set(teams.slice(0, 5).map((t) => t.id)) : null;
  const rankingsToInsert = partialScoring
    ? rankingPrelim
        .filter((r) => rankedTeamIds.has(r.team.id))
        .sort((a, b) => b.score - a.score)
        .map((r, i) => ({ ...r, rank: i + 1 }))
    : rankingPrelim;

  // Submissions prelim all + final for finalists
  let subSeq = 1;
  let verSeq = 1;
  const subMeta = [];
  for (const t of teams) {
    subMeta.push({
      team: t,
      round: "prelim",
      roundId: meta.prelimId,
      subId: uid(0xd, meta.n, subSeq++),
      verId: uid(0xe, meta.n, verSeq++),
      status: partialScoring ? "SUBMITTED" : "SCORED",
      teamIdx: teams.indexOf(t),
    });
  }
  finalists.forEach((f, fi) => {
    subMeta.push({
      team: f.team,
      round: "final",
      roundId: meta.finalId,
      subId: uid(0xd, meta.n, subSeq++),
      verId: uid(0xe, meta.n, verSeq++),
      status: "SCORED",
      fi,
    });
  });

  L(`INSERT INTO submissions (id, created_at, current_version_id, round_id, status, submitted_by, team_id, opt_lock) VALUES`);
  L(
    subMeta
      .map(
        (s, i) =>
          `  ('${s.subId}', @now, NULL, '${s.roundId}', N'${s.status}', ${s.team.leaderVar}, '${s.team.id}', 0)${i < subMeta.length - 1 ? "," : ";"}`
      )
      .join("\n")
  );
  L(`INSERT INTO submission_versions (id, created_at, demo_url, github_url, slide_url, submitted_at, version_number, submission_id) VALUES`);
  L(
    subMeta
      .map((s, i) => {
        const slug = s.team.name.toLowerCase();
        const when =
          eventKey === "done"
            ? `'2026-04-12T13:${String(30 + i).padStart(2, "0")}:00'`
            : `DATEADD(HOUR, -${14 + i}, @now)`;
        return `  ('${s.verId}', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/${slug}', N'https://docs.google.com/presentation/d/${slug}', ${when}, 1, '${s.subId}')${i < subMeta.length - 1 ? "," : ";"}`;
      })
      .join("\n")
  );
  subMeta.forEach((s) => L(`UPDATE submissions SET current_version_id='${s.verId}' WHERE id='${s.subId}';`));
  L(``);

  // Judge scores
  let jsSeq = 1;
  let jsdSeq = 1;
  const scoreRows = [];
  const detailRows = [];
  const prelimMap = new Map(rankingsToInsert.map((r) => [r.team.id, r]));
  const prelimSubs = subMeta.filter((x) => x.round === "prelim");
  for (let ti = 0; ti < prelimSubs.length; ti++) {
    const s = prelimSubs[ti];
    const pre = prelimMap.get(s.team.id) ?? rankingPrelim.find((r) => r.team.id === s.team.id);
    const judges = [
      ["@j1", pre.j1],
      ["@j2", pre.j2],
      ["@j3", pre.j3],
    ];
    let judgesToEmit = 3;
    if (partialScoring) {
      if (ti < 5) judgesToEmit = 3;
      else if (ti === 5) judgesToEmit = 2;
      else if (ti === 6) judgesToEmit = 1;
      else judgesToEmit = 0;
    }
    for (let ji = 0; ji < judgesToEmit; ji++) {
      const [jv, scores] = judges[ji];
      const jsId = uid(0xf, meta.n, jsSeq++);
      let st;
      if (published) st = "COMPLETED";
      else if (partialScoring) {
        if (ti < 5) st = "COMPLETED";
        else if (ti === 5 && ji === 1) st = "IN_PROGRESS";
        else st = "COMPLETED";
      } else st = "LOCKED";
      const completedAt = st === "IN_PROGRESS" ? "NULL" : "@now";
      scoreRows.push(
        `  ('${jsId}', @now, ${completedAt}, ${jv}, '${meta.prelimId}', DATEADD(HOUR,-2,@now), N'${st}', '${s.subId}', 0)`
      );
      const detailCount = st === "IN_PROGRESS" ? 2 : 4;
      meta.critP.slice(0, detailCount).forEach((cid, ci) => {
        detailRows.push(`  ('${uid(0x10, meta.n, jsdSeq++)}', @now, '${cid}', ${scores[ci]}, '${jsId}')`);
      });
    }
  }

  const rankingFinal = [];
  if (!partialScoring) {
  subMeta
    .filter((x) => x.round === "final")
    .forEach((s, fi) => {
      const base = FINAL_PROFILES[fi];
      const j1 = base;
      const j2 = nudge(base, fi % 2 === 0 ? 0 : -1);
      const j3 = nudge(base, fi % 3 === 0 ? -1 : 0);
      const avg = Math.round(((weighted(j1, FINAL_W) + weighted(j2, FINAL_W) + weighted(j3, FINAL_W)) / 3) * 10000) / 10000;
      rankingFinal.push({ team: s.team, score: avg, j1, j2, j3 });
      for (const [jv, scores] of [
        ["@j1", j1],
        ["@j2", j2],
        ["@j3", j3],
      ]) {
        const jsId = uid(0xf, meta.n, jsSeq++);
        const st = published ? "COMPLETED" : "LOCKED";
        scoreRows.push(
          `  ('${jsId}', @now, @now, ${jv}, '${meta.finalId}', DATEADD(HOUR,-1,@now), N'${st}', '${s.subId}', 0)`
        );
        meta.critF.forEach((cid, ci) => {
          detailRows.push(`  ('${uid(0x10, meta.n, jsdSeq++)}', @now, '${cid}', ${scores[ci]}, '${jsId}')`);
        });
      }
    });
  }

  L(`INSERT INTO judge_scores (id, created_at, completed_at, judge_user_id, round_id, started_at, status, submission_id, version) VALUES`);
  L(scoreRows.map((r, i) => `${r}${i < scoreRows.length - 1 ? "," : ";"}`).join("\n"));
  L(`INSERT INTO judge_score_details (id, created_at, criteria_id, score, judge_score_id) VALUES`);
  L(detailRows.map((r, i) => `${r}${i < detailRows.length - 1 ? "," : ";"}`).join("\n"));
  L(``);

  L(`INSERT INTO rankings (id, created_at, calculated_at, final_score, rank, round_id, team_id, version, lock_version) VALUES`);
  L(
    [...rankingsToInsert]
      .sort((a, b) => a.rank - b.rank)
      .map(
        (r, i, arr) =>
          `  ('${uid(0x16, meta.n, i + 1)}', @now, @now, ${r.score.toFixed(4)}, ${r.rank}, '${meta.prelimId}', '${r.team.id}', 1, 0)${i < arr.length - 1 ? "," : ";"}`
      )
      .join("\n")
  );
  L(``);

  if (!partialScoring) {
  rankingFinal.sort((a, b) => b.score - a.score);
  const seenF = new Set();
  rankingFinal.forEach((r, i) => {
    let sc = Math.round((r.score - i * 0.01) * 10000) / 10000;
    while (seenF.has(sc)) sc = Math.round((sc - 0.0001) * 10000) / 10000;
    seenF.add(sc);
    r.score = sc;
    r.rank = i + 1;
  });

  L(`INSERT INTO rankings (id, created_at, calculated_at, final_score, rank, round_id, team_id, version, lock_version) VALUES`);
  L(
    rankingFinal
      .map(
        (r, i) =>
          `  ('${uid(0x17, meta.n, i + 1)}', @now, @now, ${r.score.toFixed(4)}, ${r.rank}, '${meta.finalId}', '${r.team.id}', 1, 0)${i < rankingFinal.length - 1 ? "," : ";"}`
      )
      .join("\n")
  );
  L(``);
  }

  // Finalists
  if (!partialScoring) {
  L(`INSERT INTO finalist_selections (id, event_id, team_id, track_id, preliminary_rank, selected_reason, selected_at, created_at, updated_at, selection_method, eligible) VALUES`);
  const finRows = [];
  let finSeq = 1;
  [0, 1, 2].forEach((tr) => {
    rankingPrelim
      .filter((r) => r.team.trackIdx === tr)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .forEach((r, ri) => {
        finRows.push(
          `  ('${uid(0x18, meta.n, finSeq++)}', '${meta.eventId}', '${r.team.id}', '${r.team.trackId}', ${ri + 1}, N'Top ${ri + 1} in track', @now, @now, @now, N'AUTO', 1)`
        );
      });
  });
  L(finRows.map((r, i) => `${r}${i < finRows.length - 1 ? "," : ";"}`).join("\n"));
  L(``);
  }

  if (published) {
    L(`INSERT INTO published_results (id, created_at, dispute_deadline, published_at, published_by, round_id) VALUES`);
    L(`  ('${uid(0x19, meta.n, 1)}', @now, DATEADD(DAY,2,@now), @now, @coordId, '${meta.prelimId}'),`);
    L(`  ('${uid(0x19, meta.n, 2)}', @now, DATEADD(DAY,2,@now), @now, @coordId, '${meta.finalId}');`);
    const awardOrder = [...rankingFinal].sort((a, b) => a.rank - b.rank);
    L(`INSERT INTO team_awards (id, event_id, team_id, prize_id, awarded_at, created_at, updated_at) VALUES`);
    L(
      [0, 1, 2, 3]
        .map(
          (i) =>
            `  ('${uid(0x1a, meta.n, i + 1)}', '${meta.eventId}', '${awardOrder[i].team.id}', '${meta.prizes[i]}', @now, @now, @now)${i < 3 ? "," : ";"}`
        )
        .join("\n")
    );
    L(``);
  } else if (partialScoring) {
    L(`-- LiveScore demo: preliminary scoring in progress — 5 teams ranked, 4 still waiting.`);
    L(``);
  } else {
    L(`-- LiveScore demo: rankings ready, scores LOCKED, NOT published yet.`);
    L(``);
  }
}

emitScoredEvent(
  "live",
  EVENT_IDS.live,
  "AS2 LiveScore Demo - 9 Teams Arena",
  "SCORING",
  0,
  false,
  10,
  TEAM_NAMES.live,
  true
);

emitScoredEvent(
  "done",
  EVENT_IDS.done,
  "AS2 Completed Demo - Published Final Results",
  "COMPLETED",
  1,
  true,
  19,
  TEAM_NAMES.done
);

L(`COMMIT TRANSACTION;`);
L(`PRINT 'seed_as2_full_demo.sql complete. Password: 12345678';`);
L(`PRINT '1) Progress 9 teams: ${EVENT_IDS.progress}';`);
L(`PRINT '2) LiveScore 9 teams (not published): ${EVENT_IDS.live}';`);
L(`PRINT '3) Completed published: ${EVENT_IDS.done}';`);
L(`PRINT 'Login: coordinator@seal.com | mentor.lbtest@fpt.edu.vn | as2.s01@fpt.edu.vn | as2.s10@fpt.edu.vn | as2.s19@fpt.edu.vn';`);

const out = path.join(__dirname, "seed_as2_full_demo.sql");
fs.writeFileSync(out, lines.join("\n") + "\n", "utf8");
console.log(`Wrote ${out} lines=${lines.length}`);
