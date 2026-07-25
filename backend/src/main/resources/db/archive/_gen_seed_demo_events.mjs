/**
 * One-shot generator for seed_demo_events.sql. Run: node _gen_seed_demo_events.mjs
 * Not used at runtime — delete after generating if desired.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HASH = "$2a$10$7ZqT629/ciaVAXuzx7B0zO.wFlLuVz6NK3/tNioMOWFLb2gPkXeU2";
const TEMPLATE_ID = "77F2A5A3-6538-4FCF-B85A-666066465E68";
const COORD_EMAIL = "tran.thanh.ha@fpt.edu.vn";

const uuid = (prefix, n) => {
  const hex = n.toString(16).padStart(12, "0");
  return `${prefix}-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`.toUpperCase()
    .replace(
      /^([0-9A-F]{8})([0-9A-F]{4})([0-9A-F]{4})([0-9A-F]{4})([0-9A-F]{12})$/,
      "$1-$2-$3-$4-$5"
    );
};

// Fixed UUID: {event:2hex}{kind:2hex}0000-EEEE-4EEE-8EEE-{seq:12hex}
function uid(kind, eventN, seq) {
  const kindMap = { A: 10, B: 11, C: 12, D: 13, E: 14, F: 15 };
  const kNum = typeof kind === "string" && kindMap[kind] != null ? kindMap[kind] : Number(kind);
  if (!Number.isFinite(kNum) || kNum < 0 || kNum > 255) throw new Error(`uid kind out of range: ${kind}`);
  const e = Number(eventN).toString(16).padStart(2, "0");
  const k = Number(kNum).toString(16).padStart(2, "0");
  const s = Number(seq).toString(16).padStart(12, "0");
  return `${e}${k}0000-EEEE-4EEE-8EEE-${s}`.toUpperCase();
}

const STAFF = [
  { key: "coord", id: uid(0, 0, 1), email: COORD_EMAIL, name: "Trần Thanh Hà", type: "EVENT_COORDINATOR", sid: null },
  // Judges (scoring only — not mentors, avoids BR-34 conflict)
  { key: "judge1", id: uid(0, 0, 2), email: "nguyen.van.duc@fpt.edu.vn", name: "Nguyễn Văn Đức", type: "LECTURER", sid: null },
  { key: "judge2", id: uid(0, 0, 3), email: "le.thi.mai.anh@fpt.edu.vn", name: "Lê Thị Mai Anh", type: "LECTURER", sid: null },
  { key: "judge3", id: uid(0, 0, 5), email: "vo.thi.huong@fpt.edu.vn", name: "Võ Thị Hương", type: "LECTURER", sid: null },
  // Mentors (support only — teams split evenly 3 per mentor / 1 track)
  { key: "mentor1", id: uid(0, 0, 4), email: "pham.quoc.bao@fpt.edu.vn", name: "Phạm Quốc Bảo", type: "LECTURER", sid: null },
  { key: "mentor2", id: uid(0, 0, 6), email: "tran.minh.khang@fpt.edu.vn", name: "Trần Minh Khang", type: "LECTURER", sid: null },
  { key: "mentor3", id: uid(0, 0, 7), email: "nguyen.thi.lan@fpt.edu.vn", name: "Nguyễn Thị Lan", type: "LECTURER", sid: null },
];

const JUDGES = STAFF.filter((s) => s.key.startsWith("judge"));
const MENTORS = STAFF.filter((s) => s.key.startsWith("mentor"));

const HISTORY_NAMES = [
  ["Nguyễn Hoàng Minh", "nguyen.hoang.minh", "SE184201"],
  ["Trần Thu Hà", "tran.thu.ha", "SE184202"],
  ["Lê Quang Huy", "le.quang.huy", "SE184203"],
  ["Phạm Ngọc Anh", "pham.ngoc.anh", "SE184204"],
  ["Hoàng Đức Anh", "hoang.duc.anh", "SE184205"],
  ["Vũ Minh Châu", "vu.minh.chau", "SE184206"],
  ["Đặng Thanh Tùng", "dang.thanh.tung", "SE184207"],
  ["Bùi Thị Lan", "bui.thi.lan", "SE184208"],
  ["Ngô Văn Khoa", "ngo.van.khoa", "SE184209"],
  ["Đỗ Hải Yến", "do.hai.yen", "SE184210"],
  ["Lý Quốc Bảo", "ly.quoc.bao", "SE184211"],
  ["Mai Phương Thảo", "mai.phuong.thao", "SE184212"],
  ["Trịnh Nhật Nam", "trinh.nhat.nam", "SE184213"],
  ["Phan Gia Bảo", "phan.gia.bao", "SE184214"],
  ["Huỳnh Khánh Vy", "huynh.khanh.vy", "SE184215"],
  ["Võ Thanh Phong", "vo.thanh.phong", "SE184216"],
  ["Đinh Ngọc Mai", "dinh.ngoc.mai", "SE184217"],
  ["Cao Minh Tuấn", "cao.minh.tuan", "SE184218"],
  ["Lương Thị Hương", "luong.thi.huong", "SE184219"],
  ["Tạ Đức Long", "ta.duc.long", "SE184220"],
  ["Hồ Quang Vinh", "ho.quang.vinh", "SE184221"],
  ["Chu Thị Mỹ", "chu.thi.my", "SE184222"],
  ["Đoàn Anh Khoa", "doan.anh.khoa", "SE184223"],
  ["Lâm Thanh Trúc", "lam.thanh.truc", "SE184224"],
  ["Tống Minh Đức", "tong.minh.duc", "SE184225"],
  ["Nghiêm Hà My", "nghiem.ha.my", "SE184226"],
  ["Quách Nhật Hào", "quach.nhat.hao", "SE184227"],
];

function makePool(prefixSeq, names, startSid) {
  return names.map((n, i) => ({
    id: uid(1, prefixSeq, i + 1),
    email: `${n[1]}@fpt.edu.vn`,
    name: n[0],
    type: "FPT_STUDENT",
    sid: n[2].replace(/\d+$/, (d) => String(startSid + i)),
    semester: 4 + (i % 5),
  }));
}

// Distinct email bases for concurrent pools to avoid unique collisions
const E4_NAMES = HISTORY_NAMES.map(([name, base], i) => {
  const parts = ["summer", "build", "day"];
  return [name, `${base}.s26`, `SE185${String(100 + i).padStart(3, "0")}`];
});
const E5_NAMES = HISTORY_NAMES.map(([name, base], i) => {
  return [name, `${base}.sc26`, `SE186${String(100 + i).padStart(3, "0")}`];
});
const E6_NAMES = HISTORY_NAMES.map(([name, base], i) => {
  return [name, `${base}.fp26`, `SE187${String(100 + i).padStart(3, "0")}`];
});

// Fix: history uses SE184201+, e4 uses different emails
const poolHistory = HISTORY_NAMES.map((n, i) => ({
  id: uid(1, 1, i + 1),
  email: `${n[1]}@fpt.edu.vn`,
  name: n[0],
  type: "FPT_STUDENT",
  sid: n[2],
  semester: 4 + (i % 5),
}));
const poolE4 = HISTORY_NAMES.map((n, i) => ({
  id: uid(1, 4, i + 1),
  email: `${n[1]}.summer26@fpt.edu.vn`,
  name: n[0],
  type: "FPT_STUDENT",
  sid: `SE185${String(201 + i)}`,
  semester: 4 + (i % 5),
}));
const poolE5 = HISTORY_NAMES.map((n, i) => ({
  id: uid(1, 5, i + 1),
  email: `${n[1]}.closing26@fpt.edu.vn`,
  name: n[0],
  type: "FPT_STUDENT",
  sid: `SE186${String(201 + i)}`,
  semester: 4 + (i % 5),
}));
const poolE6 = HISTORY_NAMES.map((n, i) => ({
  id: uid(1, 6, i + 1),
  email: `${n[1]}.preview26@fpt.edu.vn`,
  name: n[0],
  type: "FPT_STUDENT",
  sid: `SE187${String(201 + i)}`,
  semester: 4 + (i % 5),
}));

const TRACK_NAMES = ["Grounded Retrieval", "Agent Orchestration", "Enterprise Copilot"];
const TEAM_NAMES_BY_EVENT = {
  1: ["NeuroRetrieve", "CiteGuard", "HopChain", "DocuPilot", "RAGForge", "ContextLens", "VaultAgent", "PolicyPilot", "GroundTruth"],
  2: ["MultiHop Lab", "PathFinder AI", "LinkWeaver", "ReasonStack", "ChainOfThought", "QueryRouter", "FactBridge", "HopScout", "AnswerTrail"],
  3: ["Enterprise Copilot X", "PolicyRAG", "KnowVault", "SecureRetrieve", "CorpAgent", "InsightDesk", "ComplianceBot", "DataSteward", "OpsPilot"],
  4: ["BuildFast RAG", "SprintAgent", "LiveRetrieve", "PitchCraft", "DemoForge", "RapidHop", "SeedPilot", "FlashContext", "WireAgent"],
  5: ["FinalPitch Pro", "StageReady", "JudgeMe", "ScoreBoard AI", "PitchVault", "ClosingAct", "HaloRetrieve", "SummitAgent", "LastMile RAG"],
  6: ["EarlyAccess", "PreviewBot", "DeadlineDash", "AlertReady", "RushRetrieve", "NightOwl RAG", "TickTock Agent", "LastCall", "HourGlass AI"],
  7: ["AlumniRAG", "ReplayAgent", "Showcase Lab", "LegacyRetrieve", "EchoPilot", "ArchiveHop", "MemoryForge", "ReunionBot", "GoldClass RAG"],
};

const PRELIM_CRITERIA = [
  ["Accuracy and Domain Relevance", 30],
  ["Agentic RAG Architecture & Algorithm", 30],
  ["Ideas & Presentation", 15],
  ["Feasibility & Creativity", 15],
  ["User Experience & Interactive Interface", 10],
];
const FINAL_CRITERIA = [
  ["Data Processing & Retrieval Quality", 30],
  ["Reliability & Hallucination Resistance", 20],
  ["Agent Reasoning & Multi-hop Processing", 20],
  ["Practicality & Operational Optimization", 20],
  ["Scalability & Innovation", 10],
];

// Distinct score profiles (5 criteria) — weighted mean differs clearly
// weights prelim: 30,30,15,15,10
function weighted(scores, weights) {
  let s = 0;
  for (let i = 0; i < scores.length; i++) s += scores[i] * (weights[i] / 100);
  return Math.round(s * 10000) / 10000;
}

const PRELIM_W = [30, 30, 15, 15, 10];
const FINAL_W = [30, 20, 20, 20, 10];

// 9 team score profiles for prelim (two judges averaged later — we store per-judge)
const PRELIM_PROFILES = [
  [5, 5, 5, 4, 5], // ~4.85
  [5, 4, 5, 4, 4], // ~4.45
  [4, 5, 4, 4, 4], // ~4.3
  [4, 4, 4, 5, 4], // ~4.15
  [4, 4, 4, 3, 4], // ~3.85
  [4, 3, 4, 4, 3], // ~3.55
  [3, 4, 3, 3, 4], // ~3.4
  [3, 3, 3, 4, 3], // ~3.15
  [3, 3, 2, 3, 3], // ~2.85
];
const FINAL_PROFILES = [
  [5, 5, 5, 5, 4],
  [5, 4, 5, 4, 5],
  [4, 5, 4, 5, 4],
  [4, 4, 5, 4, 4],
  [4, 4, 4, 4, 3],
  [3, 4, 4, 4, 4],
];

function nudge(scores, delta) {
  return scores.map((s, i) => Math.min(5, Math.max(1, s + (i % 2 === 0 ? delta : 0))));
}

const EVENTS = [
  {
    n: 1,
    name: "SEAL Hackathon Fall 2025 - Agentic RAG Foundations",
    season: "Fall",
    year: 2025,
    status: "COMPLETED",
    qa: "COMPLETED end-to-end (scores, rankings, awards, published)",
    login: "tran.thanh.ha@fpt.edu.vn (coordinator) or nguyen.hoang.minh@fpt.edu.vn (team leader)",
    view: "/hackathons/{eventId}/livescore",
    pool: "history",
    mode: "completed",
    // hard-coded competition day
    compDate: "2025-11-15",
    regOpen: "2025-08-01",
    regDeadline: "2025-10-31",
    leaderboard: 1,
  },
  {
    n: 2,
    name: "SEAL Hackathon Winter 2025 - Multi-hop RAG Agents",
    season: "Winter",
    year: 2025,
    status: "COMPLETED",
    qa: "COMPLETED end-to-end",
    login: "tran.thanh.ha@fpt.edu.vn or nguyen.hoang.minh@fpt.edu.vn",
    view: "/hackathons/{eventId}/livescore",
    pool: "history",
    mode: "completed",
    compDate: "2026-01-18",
    regOpen: "2025-10-01",
    regDeadline: "2025-12-20",
    leaderboard: 1,
  },
  {
    n: 3,
    name: "SEAL Hackathon Spring 2025 - Enterprise Knowledge Agents",
    season: "Spring",
    year: 2025,
    status: "COMPLETED",
    qa: "COMPLETED end-to-end",
    login: "tran.thanh.ha@fpt.edu.vn or nguyen.hoang.minh@fpt.edu.vn",
    view: "/hackathons/{eventId}/livescore",
    pool: "history",
    mode: "completed",
    compDate: "2025-04-12",
    regOpen: "2025-01-10",
    regDeadline: "2025-03-20",
    leaderboard: 1,
  },
  {
    n: 4,
    name: "SEAL Hackathon Summer 2026 - Agentic RAG Build Day",
    season: "Summer",
    year: 2026,
    status: "ACTIVE",
    qa: "ACTIVE submission window - some teams submitted, none scored",
    login: "vo.thanh.phong.summer26@fpt.edu.vn (leader, no submission yet)",
    view: "/student/submissions",
    pool: "e4",
    mode: "partial_submit",
    leaderboard: 0,
  },
  {
    n: 5,
    name: "SEAL Hackathon Summer Closing 2026 - Final Pitch Week",
    season: "Summer",
    year: 2026,
    status: "SCORING",
    qa: "SCORING - all submitted, partial judge scores",
    login: "nguyen.van.duc@fpt.edu.vn (judge with unfinished scores)",
    view: "/lecturer/scoring",
    pool: "e5",
    mode: "partial_score",
    leaderboard: 0,
  },
  {
    n: 6,
    name: "SEAL Hackathon Fall Preview 2026 - Early Access Build",
    season: "Fall",
    year: 2026,
    status: "ACTIVE",
    qa: "ACTIVE - deadline in ~3h, no submissions, progress alerts + mentor_teams + notifications seeded",
    login: "pham.quoc.bao@fpt.edu.vn (mentor track 1) or nguyen.hoang.minh.preview26@fpt.edu.vn (student leader)",
    view: "admin/lecturer dashboard Teams needing support · /student dashboard banner · notifications",
    pool: "e6",
    mode: "alert",
    leaderboard: 0,
  },
  {
    n: 7,
    name: "SEAL Hackathon Alumni Showcase 2026 - Agentic RAG Replay",
    season: "Summer",
    year: 2026,
    status: "COMPLETED",
    qa: "COMPLETED - ready for participant feedback (no feedback rows)",
    login: "nguyen.hoang.minh@fpt.edu.vn (confirmed team member)",
    view: "/student/feedback",
    pool: "history",
    mode: "completed_feedback",
    compDate: "2026-06-20",
    regOpen: "2026-03-01",
    regDeadline: "2026-05-31",
    leaderboard: 1,
  },
];

const DOMAINS = [
  ["fpt.edu.vn", "FPT University"],
  ["fe.edu.vn", "FPT Education"],
  ["hcmut.edu.vn", "Ho Chi Minh City University of Technology"],
  ["hcmus.edu.vn", "Vietnam National University Ho Chi Minh City - University of Science"],
  ["student.hcmus.edu.vn", "Vietnam National University Ho Chi Minh City - University of Science"],
  ["uit.edu.vn", "University of Information Technology"],
  ["hcmute.edu.vn", "Ho Chi Minh City University of Education and Technology"],
  ["ueh.edu.vn", "University of Economics Ho Chi Minh City"],
  ["student.ueh.edu.vn", "University of Economics Ho Chi Minh City"],
  ["student.iuh.edu.vn", "Industrial University of Ho Chi Minh City"],
];

function esc(s) {
  return String(s).replace(/'/g, "''");
}

function poolOf(key) {
  if (key === "history") return poolHistory;
  if (key === "e4") return poolE4;
  if (key === "e5") return poolE5;
  if (key === "e6") return poolE6;
  throw new Error(key);
}

const lines = [];
const L = (s = "") => lines.push(s);

L(`-- Seed 7 realistic SEAL Hackathon seasons for local/dev QA.`);
L(`-- Prerequisites:`);
L(`--   1. bootstrap_admin.sql`);
L(`--   2. Backend started once with profile dev (scoring_templates)`);
L(`--   3. Prefer reset_and_seed_template.sql first (keeps template ${TEMPLATE_ID})`);
L(`-- Run: sqlcmd -S localhost -U sa -P <password> -d SEAL -I -i seed_demo_events.sql`);
L(`-- Idempotent: deletes only the 7 demo event graphs below, never the Spring 2026 template.`);
L(`-- Shared demo password for all seeded accounts: Demo@123456`);
L(``);
L(`SET NOCOUNT ON;`);
L(`SET QUOTED_IDENTIFIER ON;`);
L(`SET ANSI_NULLS ON;`);
L(`SET XACT_ABORT ON;`);
L(`BEGIN TRANSACTION;`);
L(``);
L(`DECLARE @demoHash NVARCHAR(255) = N'${HASH}'; -- password: Demo@123456`);
L(`DECLARE @now DATETIME2 = SYSUTCDATETIME();`);
L(`DECLARE @templateId UNIQUEIDENTIFIER = (SELECT TOP 1 id FROM scoring_templates ORDER BY created_at);`);
L(``);
L(`IF @demoHash NOT LIKE '$2[aby]$%'`);
L(`BEGIN`);
L(`    RAISERROR('@demoHash does not look like a BCrypt hash.', 16, 1);`);
L(`    ROLLBACK TRANSACTION;`);
L(`    RETURN;`);
L(`END`);
L(``);
L(`IF @templateId IS NULL`);
L(`BEGIN`);
L(`    RAISERROR('No scoring template found. Start backend with dev profile first.', 16, 1);`);
L(`    ROLLBACK TRANSACTION;`);
L(`    RETURN;`);
L(`END`);
L(``);

// Demo event ids table
L(`DECLARE @demoEventIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);`);
for (const e of EVENTS) {
  L(`INSERT INTO @demoEventIds (id) VALUES ('${uid(2, e.n, 1)}');`);
}
L(``);
L(`-- Refuse to touch the Spring 2026 template`);
L(`IF EXISTS (SELECT 1 FROM @demoEventIds WHERE id = '${TEMPLATE_ID}')`);
L(`BEGIN`);
L(`    RAISERROR('Demo event id collided with template id.', 16, 1);`);
L(`    ROLLBACK TRANSACTION;`);
L(`    RETURN;`);
L(`END`);
L(``);

// Wipe
L(`DECLARE @teamIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);`);
L(`INSERT INTO @teamIds (id) SELECT t.id FROM teams t WHERE t.event_id IN (SELECT id FROM @demoEventIds);`);
L(`DECLARE @roundIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);`);
L(`INSERT INTO @roundIds (id) SELECT r.id FROM rounds r WHERE r.event_id IN (SELECT id FROM @demoEventIds);`);
L(`DECLARE @submissionIds TABLE (id UNIQUEIDENTIFIER PRIMARY KEY);`);
L(`INSERT INTO @submissionIds (id)`);
L(`SELECT s.id FROM submissions s INNER JOIN @teamIds t ON s.team_id = t.id;`);
L(``);
L(`DELETE jc FROM judge_comments jc`);
L(`INNER JOIN judge_scores js ON js.id = jc.judge_score_id`);
L(`WHERE js.submission_id IN (SELECT id FROM @submissionIds);`);
L(`DELETE jsd FROM judge_score_details jsd`);
L(`INNER JOIN judge_scores js ON js.id = jsd.judge_score_id`);
L(`WHERE js.submission_id IN (SELECT id FROM @submissionIds);`);
L(`DELETE FROM judge_scores WHERE submission_id IN (SELECT id FROM @submissionIds);`);
L(`DELETE sa FROM submission_attachments sa`);
L(`INNER JOIN submission_versions sv ON sv.id = sa.submission_version_id`);
L(`WHERE sv.submission_id IN (SELECT id FROM @submissionIds);`);
L(`DELETE FROM submission_versions WHERE submission_id IN (SELECT id FROM @submissionIds);`);
L(`DELETE FROM submissions WHERE id IN (SELECT id FROM @submissionIds);`);
L(`IF OBJECT_ID(N'mentor_chat_messages', N'U') IS NOT NULL`);
L(`    DELETE FROM mentor_chat_messages WHERE team_id IN (SELECT id FROM @teamIds);`);
L(`IF OBJECT_ID(N'mentor_feedbacks', N'U') IS NOT NULL`);
L(`    DELETE FROM mentor_feedbacks WHERE team_id IN (SELECT id FROM @teamIds);`);
L(`DELETE FROM mentor_teams WHERE team_id IN (SELECT id FROM @teamIds);`);
L(`DELETE FROM invitations WHERE team_id IN (SELECT id FROM @teamIds);`);
L(`DELETE FROM mentor_invitations WHERE team_id IN (SELECT id FROM @teamIds);`);
L(`-- Drop prior progress-alert notifications for demo teams`);
L(`DELETE FROM notification_recipients WHERE notification_id IN (`);
L(`    SELECT id FROM notifications`);
L(`    WHERE type = N'TEAM_PROGRESS_ALERT' AND reference_id IN (SELECT id FROM @teamIds));`);
L(`DELETE FROM notifications`);
L(`WHERE type = N'TEAM_PROGRESS_ALERT' AND reference_id IN (SELECT id FROM @teamIds);`);
L(`DELETE FROM team_join_requests WHERE team_id IN (SELECT id FROM @teamIds);`);
L(`DELETE FROM team_leave_requests WHERE team_id IN (SELECT id FROM @teamIds);`);
L(`DELETE FROM team_needed_roles WHERE team_id IN (SELECT id FROM @teamIds);`);
L(`IF OBJECT_ID(N'team_progress_alerts', N'U') IS NOT NULL`);
L(`    DELETE FROM team_progress_alerts WHERE team_id IN (SELECT id FROM @teamIds);`);
L(`DELETE FROM team_members WHERE team_id IN (SELECT id FROM @teamIds);`);
L(`DELETE FROM teams WHERE id IN (SELECT id FROM @teamIds);`);
L(`DELETE FROM event_enrollments WHERE event_id IN (SELECT id FROM @demoEventIds);`);
L(`DELETE FROM event_magic_tokens WHERE event_id IN (SELECT id FROM @demoEventIds);`);
L(`DELETE FROM participant_feedbacks WHERE event_id IN (SELECT id FROM @demoEventIds);`);
L(`DELETE FROM participation_certificates WHERE event_id IN (SELECT id FROM @demoEventIds);`);
L(`DELETE FROM score_review_requests WHERE event_id IN (SELECT id FROM @demoEventIds);`);
L(`DELETE FROM team_awards WHERE event_id IN (SELECT id FROM @demoEventIds);`);
L(`DELETE FROM finalist_contested_slot_teams WHERE contested_slot_id IN (`);
L(`    SELECT id FROM finalist_contested_slots WHERE event_id IN (SELECT id FROM @demoEventIds));`);
L(`DELETE FROM finalist_contested_slots WHERE event_id IN (SELECT id FROM @demoEventIds);`);
L(`DELETE FROM finalist_selections WHERE event_id IN (SELECT id FROM @demoEventIds);`);
L(`DELETE FROM track_draw_sessions WHERE event_id IN (SELECT id FROM @demoEventIds);`);
L(`IF OBJECT_ID(N'disputes', N'U') IS NOT NULL`);
L(`    DELETE FROM disputes WHERE round_id IN (SELECT id FROM @roundIds);`);
L(`IF OBJECT_ID(N'advancements', N'U') IS NOT NULL`);
L(`    DELETE FROM advancements WHERE round_id IN (SELECT id FROM @roundIds);`);
L(`DELETE FROM rankings WHERE round_id IN (SELECT id FROM @roundIds);`);
L(`DELETE FROM published_results WHERE round_id IN (SELECT id FROM @roundIds);`);
L(`DELETE FROM judge_assignments WHERE round_id IN (SELECT id FROM @roundIds);`);
L(`DELETE FROM criteria WHERE round_id IN (SELECT id FROM @roundIds);`);
L(`DELETE FROM rounds WHERE id IN (SELECT id FROM @roundIds);`);
L(`DELETE FROM event_judge_assignments WHERE event_id IN (SELECT id FROM @demoEventIds);`);
L(`DELETE FROM event_mentor_assignments WHERE event_id IN (SELECT id FROM @demoEventIds);`);
L(`DELETE FROM mentor_assignments WHERE event_id IN (SELECT id FROM @demoEventIds);`);
L(`DELETE FROM event_tiebreaker_criteria WHERE event_id IN (SELECT id FROM @demoEventIds);`);
L(`DELETE FROM honored_guests WHERE event_id IN (SELECT id FROM @demoEventIds);`);
L(`DELETE FROM prizes WHERE event_id IN (SELECT id FROM @demoEventIds);`);
L(`DELETE FROM event_schedules WHERE event_id IN (SELECT id FROM @demoEventIds);`);
L(`DELETE FROM allowed_email_domains WHERE event_id IN (SELECT id FROM @demoEventIds);`);
L(`IF OBJECT_ID(N'competition_groups', N'U') IS NOT NULL`);
L(`    DELETE cg FROM competition_groups cg`);
L(`    INNER JOIN tracks tr ON tr.id = cg.track_id`);
L(`    WHERE tr.event_id IN (SELECT id FROM @demoEventIds);`);
L(`DELETE FROM tracks WHERE event_id IN (SELECT id FROM @demoEventIds);`);
L(`DELETE FROM hackathon_events WHERE id IN (SELECT id FROM @demoEventIds);`);
L(``);

const allUsers = [...STAFF, ...poolHistory, ...poolE4, ...poolE5, ...poolE6];
L(`-- Remove prior demo accounts that reused emails with different ids (safe after event wipe)`);
L(`DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email IN (`);
L(allUsers.map((u, i) => `    N'${esc(u.email)}'${i < allUsers.length - 1 ? "," : ""}`).join("\n"));
L(`) AND id NOT IN (`);
L(allUsers.map((u, i) => `    '${u.id}'${i < allUsers.length - 1 ? "," : ""}`).join("\n"));
L(`));`);
L(`DELETE FROM password_reset_tokens WHERE user_id IN (SELECT id FROM users WHERE email IN (`);
L(allUsers.map((u, i) => `    N'${esc(u.email)}'${i < allUsers.length - 1 ? "," : ""}`).join("\n"));
L(`) AND id NOT IN (`);
L(allUsers.map((u, i) => `    '${u.id}'${i < allUsers.length - 1 ? "," : ""}`).join("\n"));
L(`));`);
L(`DELETE FROM email_otp_tokens WHERE user_id IN (SELECT id FROM users WHERE email IN (`);
L(allUsers.map((u, i) => `    N'${esc(u.email)}'${i < allUsers.length - 1 ? "," : ""}`).join("\n"));
L(`) AND id NOT IN (`);
L(allUsers.map((u, i) => `    '${u.id}'${i < allUsers.length - 1 ? "," : ""}`).join("\n"));
L(`));`);
L(`DELETE FROM notification_recipients WHERE user_id IN (SELECT id FROM users WHERE email IN (`);
L(allUsers.map((u, i) => `    N'${esc(u.email)}'${i < allUsers.length - 1 ? "," : ""}`).join("\n"));
L(`) AND id NOT IN (`);
L(allUsers.map((u, i) => `    '${u.id}'${i < allUsers.length - 1 ? "," : ""}`).join("\n"));
L(`));`);
L(`DELETE FROM users WHERE email IN (`);
L(allUsers.map((u, i) => `    N'${esc(u.email)}'${i < allUsers.length - 1 ? "," : ""}`).join("\n"));
L(`) AND id NOT IN (`);
L(allUsers.map((u, i) => `    '${u.id}'${i < allUsers.length - 1 ? "," : ""}`).join("\n"));
L(`);`);
L(``);
L(`-- Upsert staff + student pools by fixed id`);
for (const u of allUsers) {
  L(`IF EXISTS (SELECT 1 FROM users WHERE id = '${u.id}')`);
  L(`BEGIN`);
  L(`    UPDATE users SET email = N'${esc(u.email)}', password_hash = @demoHash, full_name = N'${esc(u.name)}', user_type = '${u.type}',`);
  L(`        status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL,`);
  L(`        student_id = ${u.sid ? `N'${u.sid}'` : "NULL"}, university_name = ${u.sid ? `N'FPT University'` : "NULL"},`);
  L(`        semester = ${u.semester ?? "NULL"}, student_standing = 'ENROLLED', temporary_account = 0,`);
  L(`        updated_at = @now, updated_by = N'${COORD_EMAIL}'`);
  L(`    WHERE id = '${u.id}';`);
  L(`END`);
  L(`ELSE`);
  L(`BEGIN`);
  L(`    INSERT INTO users (id, email, password_hash, full_name, phone, avatar_url, student_id, university_name,`);
  L(`        user_type, status, failed_login_attempts, locked_until, semester, student_standing, temporary_account,`);
  L(`        created_at, updated_at, created_by, updated_by)`);
  L(`    VALUES ('${u.id}', N'${esc(u.email)}', @demoHash, N'${esc(u.name)}', NULL, NULL,`);
  L(`        ${u.sid ? `N'${u.sid}'` : "NULL"}, ${u.sid ? `N'FPT University'` : "NULL"},`);
  L(`        '${u.type}', 'ACTIVE', 0, NULL, ${u.semester ?? "NULL"}, 'ENROLLED', 0,`);
  L(`        @now, @now, N'${COORD_EMAIL}', N'${COORD_EMAIL}');`);
  L(`END`);
  L(``);
}

L(`DECLARE @coordId UNIQUEIDENTIFIER = '${STAFF[0].id}';`);
L(`DECLARE @judge1Id UNIQUEIDENTIFIER = '${JUDGES[0].id}';`);
L(`DECLARE @judge2Id UNIQUEIDENTIFIER = '${JUDGES[1].id}';`);
L(`DECLARE @judge3Id UNIQUEIDENTIFIER = '${JUDGES[2].id}';`);
L(`DECLARE @mentor1Id UNIQUEIDENTIFIER = '${MENTORS[0].id}';`);
L(`DECLARE @mentor2Id UNIQUEIDENTIFIER = '${MENTORS[1].id}';`);
L(`DECLARE @mentor3Id UNIQUEIDENTIFIER = '${MENTORS[2].id}';`);
L(``);

function emitEvent(ev) {
  const eventId = uid(2, ev.n, 1);
  const prelimId = uid(3, ev.n, 1);
  const finalId = uid(3, ev.n, 2);
  const tracks = [1, 2, 3].map((t) => uid(4, ev.n, t));
  const pool = poolOf(ev.pool);
  const teamNames = TEAM_NAMES_BY_EVENT[ev.n];
  const teams = [];
  for (let t = 0; t < 9; t++) {
    const members = [pool[t * 3], pool[t * 3 + 1], pool[t * 3 + 2]];
    teams.push({
      id: uid(5, ev.n, t + 1),
      name: teamNames[t],
      trackId: tracks[Math.floor(t / 3)],
      trackIdx: Math.floor(t / 3),
      leader: members[0],
      members,
      profileIdx: t,
    });
  }

  L(`-- ============================================================`);
  L(`-- === ${esc(ev.name)} ===`);
  L(`-- QA phase: ${ev.qa}`);
  L(`-- Login: ${ev.login} / Demo@123456`);
  L(`-- View: ${ev.view.replace("{eventId}", eventId)}`);
  L(`-- ============================================================`);
  L(``);

  // Dates
  // EventStatusResolver: ACTIVE is NOT a hard override. If today < start_date but
  // registration is open → resolves to OPEN. Live ACTIVE demos must have
  // start_date <= today <= end_date.
  if (ev.mode === "partial_submit") {
    L(`DECLARE @e${ev.n}_compDay DATE = CAST(DATEADD(DAY, -1, @now) AS DATE);`);
    L(`DECLARE @e${ev.n}_endDay DATE = CAST(DATEADD(DAY, 6, @now) AS DATE);`);
    L(`DECLARE @e${ev.n}_compDt DATETIME2 = CAST(@e${ev.n}_compDay AS DATETIME2);`);
    L(`DECLARE @e${ev.n}_regOpen DATE = CAST(DATEADD(DAY, -20, @now) AS DATE);`);
    L(`DECLARE @e${ev.n}_regDeadline DATE = CAST(DATEADD(DAY, -2, @now) AS DATE);`);
    L(`DECLARE @e${ev.n}_prelimStart DATETIME2 = DATEADD(DAY, -1, @now);`);
    L(`DECLARE @e${ev.n}_prelimSub DATETIME2 = DATEADD(DAY, 3, @now);`);
    L(`DECLARE @e${ev.n}_prelimScore DATETIME2 = DATEADD(DAY, 5, @now);`);
    L(`DECLARE @e${ev.n}_finalStart DATETIME2 = DATEADD(DAY, 5, @now);`);
    L(`DECLARE @e${ev.n}_finalSub DATETIME2 = DATEADD(DAY, 5, @now);`);
    L(`DECLARE @e${ev.n}_finalScore DATETIME2 = DATEADD(DAY, 6, @now);`);
    L(`DECLARE @e${ev.n}_finalEnd DATETIME2 = DATEADD(DAY, 6, @now);`);
  } else if (ev.mode === "partial_score") {
    L(`DECLARE @e${ev.n}_compDay DATE = CAST(DATEADD(DAY, -1, @now) AS DATE);`);
    L(`DECLARE @e${ev.n}_endDay DATE = CAST(DATEADD(DAY, 3, @now) AS DATE);`);
    L(`DECLARE @e${ev.n}_compDt DATETIME2 = CAST(@e${ev.n}_compDay AS DATETIME2);`);
    L(`DECLARE @e${ev.n}_regOpen DATE = CAST(DATEADD(DAY, -40, @now) AS DATE);`);
    L(`DECLARE @e${ev.n}_regDeadline DATE = CAST(DATEADD(DAY, -10, @now) AS DATE);`);
    L(`DECLARE @e${ev.n}_prelimStart DATETIME2 = DATEADD(DAY, -3, @now);`);
    L(`DECLARE @e${ev.n}_prelimSub DATETIME2 = DATEADD(HOUR, -12, @now);`);
    L(`DECLARE @e${ev.n}_prelimScore DATETIME2 = DATEADD(DAY, 2, @now);`);
    L(`DECLARE @e${ev.n}_finalStart DATETIME2 = DATEADD(DAY, 2, @now);`);
    L(`DECLARE @e${ev.n}_finalSub DATETIME2 = DATEADD(DAY, 2, @now);`);
    L(`DECLARE @e${ev.n}_finalScore DATETIME2 = DATEADD(DAY, 3, @now);`);
    L(`DECLARE @e${ev.n}_finalEnd DATETIME2 = DATEADD(DAY, 3, @now);`);
  } else if (ev.mode === "alert") {
    // Deadline within app.progress.alert-lead-time-hours (default 6h) so NOT_STARTED fires live.
    L(`DECLARE @e${ev.n}_compDay DATE = CAST(@now AS DATE);`);
    L(`DECLARE @e${ev.n}_endDay DATE = CAST(DATEADD(DAY, 3, @now) AS DATE);`);
    L(`DECLARE @e${ev.n}_compDt DATETIME2 = CAST(@e${ev.n}_compDay AS DATETIME2);`);
    L(`DECLARE @e${ev.n}_regOpen DATE = CAST(DATEADD(DAY, -15, @now) AS DATE);`);
    L(`DECLARE @e${ev.n}_regDeadline DATE = CAST(DATEADD(DAY, -1, @now) AS DATE);`);
    L(`DECLARE @e${ev.n}_prelimStart DATETIME2 = DATEADD(DAY, -1, @now);`);
    L(`DECLARE @e${ev.n}_prelimSub DATETIME2 = DATEADD(HOUR, 3, @now);`);
    L(`DECLARE @e${ev.n}_prelimScore DATETIME2 = DATEADD(DAY, 2, @now);`);
    L(`DECLARE @e${ev.n}_finalStart DATETIME2 = DATEADD(DAY, 2, @now);`);
    L(`DECLARE @e${ev.n}_finalSub DATETIME2 = DATEADD(DAY, 2, @now);`);
    L(`DECLARE @e${ev.n}_finalScore DATETIME2 = DATEADD(DAY, 3, @now);`);
    L(`DECLARE @e${ev.n}_finalEnd DATETIME2 = DATEADD(DAY, 3, @now);`);
  } else {
    // completed hard dates
    L(`DECLARE @e${ev.n}_compDay DATE = '${ev.compDate}';`);
    L(`DECLARE @e${ev.n}_endDay DATE = '${ev.compDate}';`);
    L(`DECLARE @e${ev.n}_compDt DATETIME2 = CAST(@e${ev.n}_compDay AS DATETIME2);`);
    L(`DECLARE @e${ev.n}_regOpen DATE = '${ev.regOpen}';`);
    L(`DECLARE @e${ev.n}_regDeadline DATE = '${ev.regDeadline}';`);
    L(`DECLARE @e${ev.n}_prelimStart DATETIME2 = DATEADD(HOUR, 7, @e${ev.n}_compDt);`);
    L(`DECLARE @e${ev.n}_prelimSub DATETIME2 = DATEADD(HOUR, 14, @e${ev.n}_compDt);`);
    L(`DECLARE @e${ev.n}_prelimScore DATETIME2 = DATEADD(MINUTE, 15*60+30, @e${ev.n}_compDt);`);
    L(`DECLARE @e${ev.n}_finalStart DATETIME2 = DATEADD(MINUTE, 15*60+30, @e${ev.n}_compDt);`);
    L(`DECLARE @e${ev.n}_finalSub DATETIME2 = DATEADD(MINUTE, 15*60+30, @e${ev.n}_compDt);`);
    L(`DECLARE @e${ev.n}_finalScore DATETIME2 = DATEADD(HOUR, 17, @e${ev.n}_compDt);`);
    L(`DECLARE @e${ev.n}_finalEnd DATETIME2 = DATEADD(HOUR, 17, @e${ev.n}_compDt);`);
  }
  L(``);

  L(`INSERT INTO hackathon_events (`);
  L(`    id, name, season, year, start_date, end_date,`);
  L(`    registration_open_date, registration_deadline,`);
  L(`    description, location, format, competition_format,`);
  L(`    min_team, max_team, semester_min, semester_max,`);
  L(`    scoring_template_id, status, leaderboard_public,`);
  L(`    owner_user_id, created_by, created_at, updated_at`);
  L(`) VALUES (`);
  L(`    '${eventId}',`);
  L(`    N'${esc(ev.name)}',`);
  L(`    N'${ev.season}', ${ev.year},`);
  L(`    @e${ev.n}_compDay, @e${ev.n}_endDay,`);
  L(`    @e${ev.n}_regOpen, @e${ev.n}_regDeadline,`);
  L(`    N'SEAL Hackathon ${esc(ev.season)} ${ev.year} focuses on Agentic RAG systems: grounded retrieval, multi-step agent orchestration, and enterprise-ready copilots built by FPT University teams.',`);
  L(`    N'FPT University HCM', 'OFFLINE', 'SEAL_RAG_2026',`);
  L(`    3, 5, 4, 8,`);
  L(`    @templateId, '${ev.status}', ${ev.leaderboard},`);
  L(`    @coordId, N'${COORD_EMAIL}', @now, @now`);
  L(`);`);
  L(``);

  L(`INSERT INTO tracks (id, event_id, name, description, max_teams, status, created_at, updated_at) VALUES`);
  TRACK_NAMES.forEach((tn, i) => {
    const comma = i < 2 ? "," : ";";
    L(`    ('${tracks[i]}', '${eventId}', N'${tn}', N'SEAL track: ${tn}', 8, 'OPEN', @now, @now)${comma}`);
  });
  L(``);

  L(`INSERT INTO rounds (`);
  L(`    id, event_id, round_number, name, round_type,`);
  L(`    start_date, end_date, slide_deadline, submission_deadline, scoring_deadline,`);
  L(`    advancement_cutoff, advancement_rule, round_weight, created_at, updated_at`);
  L(`) VALUES`);
  L(`    ('${prelimId}', '${eventId}', 1, N'Preliminary Round', 'PRELIMINARY',`);
  L(`     @e${ev.n}_prelimStart, @e${ev.n}_prelimScore, DATEADD(HOUR, -4, @e${ev.n}_prelimSub),`);
  L(`     @e${ev.n}_prelimSub, @e${ev.n}_prelimScore,`);
  L(`     2, 'PER_TRACK_TOP_N', 40, @now, @now),`);
  L(`    ('${finalId}', '${eventId}', 2, N'Finals', 'FINAL',`);
  L(`     @e${ev.n}_finalStart, @e${ev.n}_finalEnd, NULL,`);
  L(`     @e${ev.n}_finalSub, @e${ev.n}_finalScore,`);
  L(`     6, 'FINALIST_POOL', 60, @now, @now);`);
  L(``);

  // Criteria with fixed ids
  const prelimCrit = PRELIM_CRITERIA.map((c, i) => ({ id: uid(6, ev.n, i + 1), name: c[0], w: c[1], order: i }));
  const finalCrit = FINAL_CRITERIA.map((c, i) => ({ id: uid(6, ev.n, 10 + i + 1), name: c[0], w: c[1], order: i }));
  L(`INSERT INTO criteria (id, round_id, name, description, weight, sort_order, min_score, max_score, created_at, updated_at) VALUES`);
  const allCrit = [
    ...prelimCrit.map((c) => `    ('${c.id}', '${prelimId}', N'${esc(c.name)}', N'${esc(c.name)}', ${c.w}, ${c.order}, 1, 5, @now, @now)`),
    ...finalCrit.map((c) => `    ('${c.id}', '${finalId}', N'${esc(c.name)}', N'${esc(c.name)}', ${c.w}, ${c.order}, 1, 5, @now, @now)`),
  ];
  L(allCrit.join(",\n") + ";");
  L(``);

  const prizes = ["FIRST", "SECOND", "THIRD", "CONSOLATION"].map((r, i) => ({
    id: uid(7, ev.n, i + 1),
    rank: r,
    value: ["7000000", "5000000", "3000000", "1500000"][i],
    label: ["First Prize", "Second Prize", "Third Prize", "Consolation Prize"][i],
  }));
  L(`INSERT INTO prizes (id, event_id, rank, value, quantity, label, created_at, updated_at) VALUES`);
  L(
    prizes
      .map((p, i) => `    ('${p.id}', '${eventId}', '${p.rank}', '${p.value}', 1, N'${p.label}', @now, @now)${i < 3 ? "," : ";"}`)
      .join("\n")
  );
  L(``);

  L(`INSERT INTO event_schedules (id, event_id, type, title, description, start_time, end_time, gate, sort_order, created_at, updated_at) VALUES`);
  L(`    ('${uid(8, ev.n, 1)}', '${eventId}', 'WORKSHOP', N'Workshop', NULL, DATEADD(DAY, -3, @e${ev.n}_compDt), DATEADD(HOUR, 3, DATEADD(DAY, -3, @e${ev.n}_compDt)), NULL, 0, @now, @now),`);
  L(`    ('${uid(8, ev.n, 2)}', '${eventId}', 'OPENING', N'Opening & track draw', N'Teams pick tracks in turn; organizers draw topics per track', DATEADD(DAY, -1, @e${ev.n}_compDt), DATEADD(HOUR, 3, DATEADD(DAY, -1, @e${ev.n}_compDt)), NULL, 1, @now, @now),`);
  L(`    ('${uid(8, ev.n, 3)}', '${eventId}', 'TRACK_DRAW', N'Track selection draw', NULL, DATEADD(DAY, -1, @e${ev.n}_compDt), DATEADD(HOUR, 2, DATEADD(DAY, -1, @e${ev.n}_compDt)), NULL, 2, @now, @now),`);
  L(`    ('${uid(8, ev.n, 4)}', '${eventId}', 'MILESTONE', N'Milestone 1 - Idea & architecture completion', N'Design Agentic RAG architecture', @e${ev.n}_prelimStart, DATEADD(HOUR, 3, @e${ev.n}_prelimStart), 'SLIDE_SUBMISSION', 3, @now, @now),`);
  L(`    ('${uid(8, ev.n, 5)}', '${eventId}', 'MILESTONE', N'Milestone 2 - Pitching & product completion', N'Parallel pitching and coding', DATEADD(HOUR, 3, @e${ev.n}_prelimStart), @e${ev.n}_prelimSub, 'DEMO_SUBMISSION', 4, @now, @now),`);
  L(`    ('${uid(8, ev.n, 6)}', '${eventId}', 'SCORING', N'Preliminary scoring', N'5-minute presentation + 3-minute Q&A', @e${ev.n}_prelimSub, @e${ev.n}_prelimScore, NULL, 5, @now, @now),`);
  L(`    ('${uid(8, ev.n, 7)}', '${eventId}', 'FINAL', N'Finals', N'7-minute presentation + 3-minute Q&A - Top 6 teams', @e${ev.n}_finalStart, @e${ev.n}_finalEnd, NULL, 6, @now, @now),`);
  L(`    ('${uid(8, ev.n, 8)}', '${eventId}', 'CEREMONY', N'Awards & closing ceremony', NULL, @e${ev.n}_finalEnd, DATEADD(HOUR, 1, @e${ev.n}_finalEnd), NULL, 7, @now, @now);`);
  L(``);

  L(`INSERT INTO allowed_email_domains (id, event_id, domain, university_label, created_at, updated_at) VALUES`);
  L(
    DOMAINS.map(
      (d, i) =>
        `    ('${uid(9, ev.n, i + 1)}', '${eventId}', '${d[0]}', N'${esc(d[1])}', @now, @now)${i < DOMAINS.length - 1 ? "," : ";"}`
    ).join("\n")
  );
  L(``);

  // Use fixed student UUIDs from pool (upserted above) — avoid re-DECLARE across events
  // Enrollments
  L(`INSERT INTO event_enrollments (id, created_at, enrolled_at, event_id, status, user_id, is_looking_for_team, is_profile_public) VALUES`);
  const enrollRows = [];
  let enSeq = 1;
  for (const t of teams) {
    for (const m of t.members) {
      enrollRows.push(
        `    ('${uid("A", ev.n, enSeq++)}', @now, @now, '${eventId}', 'APPROVED', '${m.id}', 0, 0)`
      );
    }
  }
  L(enrollRows.join(",\n") + ";");
  L(``);

  // Teams
  L(`INSERT INTO teams (id, created_at, event_id, leader_id, name, status, track_id, track_assigned_at, track_assignment_method, is_recruiting, recruitment_note, version) VALUES`);
  L(
    teams
      .map(
        (t, i) =>
          `    ('${t.id}', @now, '${eventId}', '${t.leader.id}', N'${esc(t.name)}', 'CONFIRMED', '${t.trackId}', @now, 'MANUAL', 0, N'Building an Agentic RAG solution for the ${TRACK_NAMES[t.trackIdx]} track.', 0)${i < 8 ? "," : ";"}`
      )
      .join("\n")
  );
  L(``);

  // Members
  L(`INSERT INTO team_members (id, created_at, joined_at, role, user_id, team_id, event_id) VALUES`);
  const memRows = [];
  let memSeq = 1;
  for (const t of teams) {
    t.members.forEach((m, mi) => {
      memRows.push(
        `    ('${uid("B", ev.n, memSeq++)}', @now, @now, '${mi === 0 ? "LEADER" : "MEMBER"}', '${m.id}', '${t.id}', '${eventId}')`
      );
    });
  }
  L(memRows.join(",\n") + ";");
  L(``);

  // Judges + mentors are separate lecturers (BR-34: mentor cannot score own teams).
  // 3 judges event-wide; 3 mentors — one per track, 3 teams each (even split).
  L(`INSERT INTO event_judge_assignments (id, created_at, assigned_at, judge_user_id, event_id) VALUES`);
  L(`    ('${uid("C", ev.n, 1)}', @now, @now, @judge1Id, '${eventId}'),`);
  L(`    ('${uid("C", ev.n, 2)}', @now, @now, @judge2Id, '${eventId}'),`);
  L(`    ('${uid("C", ev.n, 8)}', @now, @now, @judge3Id, '${eventId}');`);
  L(`INSERT INTO judge_assignments (id, created_at, assigned_at, judge_user_id, round_id, scope, active) VALUES`);
  L(`    ('${uid("C", ev.n, 3)}', @now, @now, @judge1Id, '${prelimId}', 'ROUND', 1),`);
  L(`    ('${uid("C", ev.n, 4)}', @now, @now, @judge2Id, '${prelimId}', 'ROUND', 1),`);
  L(`    ('${uid("C", ev.n, 9)}', @now, @now, @judge3Id, '${prelimId}', 'ROUND', 1),`);
  L(`    ('${uid("C", ev.n, 5)}', @now, @now, @judge1Id, '${finalId}', 'ROUND', 1),`);
  L(`    ('${uid("C", ev.n, 6)}', @now, @now, @judge2Id, '${finalId}', 'ROUND', 1),`);
  L(`    ('${uid("C", ev.n, 10)}', @now, @now, @judge3Id, '${finalId}', 'ROUND', 1);`);
  L(`INSERT INTO event_mentor_assignments (id, event_id, mentor_user_id, assigned_at, created_at) VALUES`);
  L(`    ('${uid("C", ev.n, 7)}', '${eventId}', @mentor1Id, @now, @now),`);
  L(`    ('${uid("C", ev.n, 11)}', '${eventId}', @mentor2Id, @now, @now),`);
  L(`    ('${uid("C", ev.n, 12)}', '${eventId}', @mentor3Id, @now, @now);`);
  L(``);
  const mentorVars = ["@mentor1Id", "@mentor2Id", "@mentor3Id"];
  L(`INSERT INTO mentor_assignments (id, created_at, assigned_at, mentor_user_id, event_id, track_id) VALUES`);
  L(
    tracks
      .map(
        (trackId, i) =>
          `    ('${uid(22, ev.n, i + 1)}', @now, @now, ${mentorVars[i]}, '${eventId}', '${trackId}')${i < tracks.length - 1 ? "," : ";"}`
      )
      .join("\n")
  );
  L(``);
  L(`INSERT INTO mentor_teams (id, created_at, assigned_at, mentor_user_id, team_id) VALUES`);
  L(
    teams
      .map(
        (t, i) =>
          `    ('${uid(23, ev.n, i + 1)}', @now, @now, ${mentorVars[t.trackIdx]}, '${t.id}')${i < teams.length - 1 ? "," : ";"}`
      )
      .join("\n")
  );
  L(``);
  L(`INSERT INTO mentor_invitations (id, created_at, team_id, mentor_user_id, inviter_id, status, message) VALUES`);
  L(
    teams
      .map(
        (t, i) =>
          `    ('${uid(24, ev.n, i + 1)}', @now, '${t.id}', ${mentorVars[t.trackIdx]}, '${t.leader.id}', 'ACCEPTED', N'Seeded mentor assignment for QA')${i < teams.length - 1 ? "," : ";"}`
      )
      .join("\n")
  );
  L(``);

  const needCompleted = ev.mode === "completed" || ev.mode === "completed_feedback";
  const needPartialSubmit = ev.mode === "partial_submit";
  const needPartialScore = ev.mode === "partial_score";
  const needAlert = ev.mode === "alert";

  // Submissions
  if (needCompleted || needPartialScore || needPartialSubmit) {
    const submitTeams = needPartialSubmit ? teams.filter((_, i) => i % 2 === 0) : teams;

    let subSeq = 1;
    let verSeq = 1;
    const subMeta = [];

    // Prelim submissions
    for (const t of submitTeams) {
      const subId = uid("D", ev.n, subSeq++);
      const verId = uid("E", ev.n, verSeq++);
      const status = needCompleted ? "SCORED" : "SUBMITTED";
      subMeta.push({ team: t, roundId: prelimId, subId, verId, status, round: "prelim" });
    }

    // For completed: compute prelim averages in JS, pick top-2/track, then add final submissions
    let rankingPrelimPreview = [];
    if (needCompleted) {
      rankingPrelimPreview = teams.map((t) => {
        const base = PRELIM_PROFILES[t.profileIdx];
        const j1 = base;
        const j2 = nudge(base, t.profileIdx % 2 === 0 ? -1 : 0);
        const avg = Math.round(((weighted(j1, PRELIM_W) + weighted(j2, PRELIM_W)) / 2) * 10000) / 10000;
        return { team: t, score: avg, j1, j2 };
      });
      // unique-ify scores early (same rule as SQL rankings)
      rankingPrelimPreview.sort((a, b) => b.score - a.score);
      const seen = new Set();
      rankingPrelimPreview.forEach((r, i) => {
        let sc = Math.round((r.score - i * 0.01) * 10000) / 10000;
        while (seen.has(sc)) sc = Math.round((sc - 0.0001) * 10000) / 10000;
        seen.add(sc);
        r.score = sc;
        r.rank = i + 1;
      });
      const finalists = [0, 1, 2].flatMap((tr) =>
        rankingPrelimPreview
          .filter((r) => r.team.trackIdx === tr)
          .sort((a, b) => b.score - a.score)
          .slice(0, 2)
      );
      finalists.forEach((f, fi) => {
        const subId = uid("D", ev.n, subSeq++);
        const verId = uid("E", ev.n, verSeq++);
        subMeta.push({
          team: f.team,
          roundId: finalId,
          subId,
          verId,
          status: "SCORED",
          round: "final",
          finalistRank: fi + 1,
        });
      });
    }

    L(`INSERT INTO submissions (id, created_at, current_version_id, round_id, status, submitted_by, team_id, opt_lock) VALUES`);
    L(
      subMeta
        .map(
          (s, i) =>
            `    ('${s.subId}', @now, NULL, '${s.roundId}', '${s.status}', '${s.team.leader.id}', '${s.team.id}', 0)${i < subMeta.length - 1 ? "," : ";"}`
        )
        .join("\n")
    );
    L(``);
    L(`INSERT INTO submission_versions (id, created_at, demo_url, github_url, slide_url, submitted_at, version_number, submission_id) VALUES`);
    L(
      subMeta
        .map((s, i) => {
          const slug = s.team.name.toLowerCase().replace(/\s+/g, "-");
          return `    ('${s.verId}', @now, N'https://www.youtube.com/watch?v=dQw4w9WgXcQ', N'https://github.com/seal-fpt/${esc(slug)}', N'https://docs.google.com/presentation/d/seal-${ev.n}-${i}', DATEADD(MINUTE, -${30 + i}, @e${ev.n}_prelimSub), 1, '${s.subId}')${i < subMeta.length - 1 ? "," : ";"}`;
        })
        .join("\n")
    );
    L(``);
    for (const s of subMeta) {
      L(`UPDATE submissions SET current_version_id = '${s.verId}' WHERE id = '${s.subId}';`);
    }
    L(``);

    if (needCompleted) {
      let jsSeq = 1;
      let jsdSeq = 1;
      const scoreRows = [];
      const detailRows = [];

      const prelimByTeam = new Map(rankingPrelimPreview.map((r) => [r.team.id, r]));
      for (const s of subMeta.filter((x) => x.round === "prelim")) {
        const pre = prelimByTeam.get(s.team.id);
        for (const [judgeVar, scores] of [
          ["@judge1Id", pre.j1],
          ["@judge2Id", pre.j2],
        ]) {
          const jsId = uid("F", ev.n, jsSeq++);
          scoreRows.push(
            `    ('${jsId}', @now, @e${ev.n}_prelimScore, ${judgeVar}, '${prelimId}', @e${ev.n}_prelimSub, 'COMPLETED', '${s.subId}', 0)`
          );
          prelimCrit.forEach((c, ci) => {
            detailRows.push(`    ('${uid(0xE, ev.n, jsdSeq++)}', @now, '${c.id}', ${scores[ci]}, '${jsId}')`);
          });
        }
      }

      const rankingFinal = [];
      subMeta
        .filter((x) => x.round === "final")
        .forEach((s, fi) => {
          const base = FINAL_PROFILES[fi];
          const j1 = base;
          const j2 = nudge(base, fi % 2 === 0 ? 0 : -1);
          const avg = Math.round(((weighted(j1, FINAL_W) + weighted(j2, FINAL_W)) / 2) * 10000) / 10000;
          rankingFinal.push({ team: s.team, score: avg, sub: s, fi, j1, j2 });
          for (const [judgeVar, scores] of [
            ["@judge1Id", j1],
            ["@judge2Id", j2],
          ]) {
            const jsId = uid("F", ev.n, jsSeq++);
            scoreRows.push(
              `    ('${jsId}', @now, @e${ev.n}_finalScore, ${judgeVar}, '${finalId}', @e${ev.n}_finalSub, 'COMPLETED', '${s.subId}', 0)`
            );
            finalCrit.forEach((c, ci) => {
              detailRows.push(`    ('${uid(0xE, ev.n, jsdSeq++)}', @now, '${c.id}', ${scores[ci]}, '${jsId}')`);
            });
          }
        });

      L(`INSERT INTO judge_scores (id, created_at, completed_at, judge_user_id, round_id, started_at, status, submission_id, version) VALUES`);
      L(scoreRows.map((r, i) => `${r}${i < scoreRows.length - 1 ? "," : ";"}`).join("\n"));
      L(``);
      L(`INSERT INTO judge_score_details (id, created_at, criteria_id, score, judge_score_id) VALUES`);
      L(detailRows.map((r, i) => `${r}${i < detailRows.length - 1 ? "," : ";"}`).join("\n"));
      L(``);

      const rankingPrelim = [...rankingPrelimPreview].sort((a, b) => a.rank - b.rank);

      L(`INSERT INTO rankings (id, created_at, calculated_at, final_score, rank, round_id, team_id, version, lock_version) VALUES`);
      L(
        rankingPrelim
          .map(
            (r, i) =>
              `    ('${uid(16, ev.n, i + 1)}', @now, @e${ev.n}_prelimScore, ${r.score.toFixed(4)}, ${r.rank}, '${prelimId}', '${r.team.id}', 1, 0)${i < rankingPrelim.length - 1 ? "," : ";"}`
          )
          .join("\n")
      );
      L(``);

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
              `    ('${uid(17, ev.n, i + 1)}', @now, @e${ev.n}_finalScore, ${r.score.toFixed(4)}, ${r.rank}, '${finalId}', '${r.team.id}', 1, 0)${i < rankingFinal.length - 1 ? "," : ";"}`
          )
          .join("\n")
      );
      L(``);

      const byTrack = [0, 1, 2].map((tr) =>
        rankingPrelimPreview
          .filter((r) => r.team.trackIdx === tr)
          .sort((a, b) => b.score - a.score)
          .slice(0, 2)
      );
      L(`INSERT INTO finalist_selections (id, event_id, team_id, track_id, preliminary_rank, selected_reason, selected_at, created_at, updated_at, selection_method, eligible) VALUES`);
      const finRows = [];
      let finSeq = 1;
      byTrack.forEach((pair) => {
        pair.forEach((r, ri) => {
          finRows.push(
            `    ('${uid(18, ev.n, finSeq++)}', '${eventId}', '${r.team.id}', '${r.team.trackId}', ${ri + 1}, N'Top ${ri + 1} in track', @e${ev.n}_prelimScore, @now, @now, 'AUTO', 1)`
          );
        });
      });
      L(finRows.map((r, i) => `${r}${i < finRows.length - 1 ? "," : ";"}`).join("\n"));
      L(``);

      L(`INSERT INTO published_results (id, created_at, dispute_deadline, published_at, published_by, round_id) VALUES`);
      L(`    ('${uid(19, ev.n, 1)}', @now, DATEADD(DAY, 2, @e${ev.n}_prelimScore), @e${ev.n}_prelimScore, @coordId, '${prelimId}'),`);
      L(`    ('${uid(19, ev.n, 2)}', @now, DATEADD(DAY, 2, @e${ev.n}_finalScore), @e${ev.n}_finalScore, @coordId, '${finalId}');`);
      L(``);

      const awardOrder = [...rankingFinal].sort((a, b) => a.rank - b.rank);
      L(`INSERT INTO team_awards (id, event_id, team_id, prize_id, awarded_at, created_at, updated_at) VALUES`);
      L(
        [0, 1, 2, 3]
          .map(
            (i) =>
              `    ('${uid(20, ev.n, i + 1)}', '${eventId}', '${awardOrder[i].team.id}', '${prizes[i].id}', @e${ev.n}_finalEnd, @now, @now)${i < 3 ? "," : ";"}`
          )
          .join("\n")
      );
      L(``);
    }

    if (needPartialScore) {
      let jsSeq = 1;
      let jsdSeq = 1;
      const scoreRows = [];
      const detailRows = [];
      teams.forEach((t, ti) => {
        const sub = subMeta.find((s) => s.team.id === t.id && s.round === "prelim");
        if (!sub) return;
        const base = PRELIM_PROFILES[ti];
        const js1 = uid("F", ev.n, jsSeq++);
        if (ti < 5) {
          scoreRows.push(
            `    ('${js1}', @now, @now, @judge1Id, '${prelimId}', DATEADD(HOUR, -2, @now), 'COMPLETED', '${sub.subId}', 0)`
          );
          prelimCrit.forEach((c, ci) => {
            detailRows.push(`    ('${uid(0xE, ev.n, jsdSeq++)}', @now, '${c.id}', ${base[ci]}, '${js1}')`);
          });
        } else {
          scoreRows.push(
            `    ('${js1}', @now, NULL, @judge1Id, '${prelimId}', DATEADD(HOUR, -1, @now), 'IN_PROGRESS', '${sub.subId}', 0)`
          );
        }
        if (ti < 3) {
          const js2 = uid("F", ev.n, jsSeq++);
          const j2 = nudge(base, -1);
          scoreRows.push(
            `    ('${js2}', @now, @now, @judge2Id, '${prelimId}', DATEADD(HOUR, -2, @now), 'COMPLETED', '${sub.subId}', 0)`
          );
          prelimCrit.forEach((c, ci) => {
            detailRows.push(`    ('${uid(0xE, ev.n, jsdSeq++)}', @now, '${c.id}', ${j2[ci]}, '${js2}')`);
          });
        }
      });
      L(`INSERT INTO judge_scores (id, created_at, completed_at, judge_user_id, round_id, started_at, status, submission_id, version) VALUES`);
      L(scoreRows.map((r, i) => `${r}${i < scoreRows.length - 1 ? "," : ";"}`).join("\n"));
      L(``);
      if (detailRows.length) {
        L(`INSERT INTO judge_score_details (id, created_at, criteria_id, score, judge_score_id) VALUES`);
        L(detailRows.map((r, i) => `${r}${i < detailRows.length - 1 ? "," : ";"}`).join("\n"));
        L(``);
      }
      L(`UPDATE submissions SET status = 'SUBMITTED' WHERE round_id = '${prelimId}';`);
      L(``);
    }
  }

  if (needAlert) {
    L(`INSERT INTO team_progress_alerts (id, team_id, round_id, risk_level, reasons, last_alerted_at, created_at, updated_at) VALUES`);
    L(
      teams
        .map(
          (t, i) =>
            `    ('${uid(21, ev.n, i + 1)}', '${t.id}', '${prelimId}', N'CRITICAL', N'NOT_STARTED', @now, @now, @now)${i < 8 ? "," : ";"}`
        )
        .join("\n")
    );
    L(``);
    // In-app notifications so student/mentor/coord see the alert without waiting for the scheduler.
    L(`INSERT INTO notifications (id, created_at, message, reference_id, reference_type, title, type) VALUES`);
    L(
      teams
        .map(
          (t, i) =>
            `    ('${uid(25, ev.n, i + 1)}', @now, N'Team ${esc(t.name)} has not started submission and the deadline is approaching (NOT_STARTED).', '${t.id}', N'Team', N'Team progress alert', N'TEAM_PROGRESS_ALERT')${i < teams.length - 1 ? "," : ";"}`
        )
        .join("\n")
    );
    L(``);
    const recipRows = [];
    let recipSeq = 1;
    for (let i = 0; i < teams.length; i++) {
      const t = teams[i];
      const notifId = uid(25, ev.n, i + 1);
      // leader (fixed uuid) + mentor + coordinator
      recipRows.push(
        `    ('${uid(26, ev.n, recipSeq++)}', @now, N'IN_APP', NULL, @now, '${t.leader.id}', '${notifId}')`
      );
      recipRows.push(
        `    ('${uid(26, ev.n, recipSeq++)}', @now, N'IN_APP', NULL, @now, ${mentorVars[t.trackIdx]}, '${notifId}')`
      );
      recipRows.push(
        `    ('${uid(26, ev.n, recipSeq++)}', @now, N'IN_APP', NULL, @now, @coordId, '${notifId}')`
      );
    }
    L(`INSERT INTO notification_recipients (id, created_at, channel, read_at, sent_at, user_id, notification_id) VALUES`);
    L(recipRows.join(",\n") + ";");
    L(``);
  }

  if (ev.mode === "completed_feedback") {
    L(`-- Intentionally no participant_feedbacks rows (feedback UI should open for confirmed members).`);
    L(``);
  }
}

for (const ev of EVENTS) {
  emitEvent(ev);
}

L(`COMMIT TRANSACTION;`);
L(`PRINT 'seed_demo_events.sql complete: 7 SEAL seasons seeded (template ${TEMPLATE_ID} preserved).';`);
L(`PRINT 'Demo password for all seeded accounts: Demo@123456';`);

const out = path.join(__dirname, "seed_demo_events.sql");
fs.writeFileSync(out, lines.join("\n"), "utf8");
console.log("Wrote", out, "lines:", lines.length);
