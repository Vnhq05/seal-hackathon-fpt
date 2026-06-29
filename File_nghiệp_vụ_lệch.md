# BUSINESS LOGIC MISALIGNMENT ANALYSIS — SEAL HACKATHON

> This file documents the **actual gaps** between the current system implementation and the SEAL Hackathon Spring 2026 competition requirements.
> Based on: (1) reading actual source code under `frontend/src/`, `docs/api/`, and (2) the official competition document "THÔNG TIN VỀ CUỘC THI.docx".

---

## 1. Overall: System Format Is Mostly Aligned, But Key Flow Details Are Missing

### Current State (actual code)

The system has been built around the SEAL Spring 2026 format. Core entities exist:
- `CompetitionFormat: "GENERIC" | "SEAL_RAG_2026"` (`types.ts`)
- `RoundType: "PRELIMINARY" | "FINAL"` (`types.ts`)
- `finalistApi` — selects Top-2-per-track (`finalist.api.ts`)
- `awardApi` — assigns prizes after final (`award.api.ts`)
- `TrackResponse` with `topic`, `maxTeams` (`track.api.ts`)

### What Is Still Misaligned

The **end-to-end flow** specific to Spring 2026 has gaps in several stages:

```text
✓ Create event (SEAL_RAG_2026 format)
✓ Team registration
⚠ Day 1: Track draw session (API spec done, frontend not wired)
✓ Day 2: Competition
⚠ Milestone 1 gate (slide deadline 10:00 — API spec done, frontend not enforced)
⚠ Milestone 2 gate (demo deadline 14:00 — API spec done, frontend not enforced)
✓ Preliminary scoring
✓ Finalist selection (top-2-per-track → 6 teams)
✓ Final round scoring
✓ Award assignment
```

---

## 2. Misalignment in User Roles

### Current State (actual code — `types.ts`)

```typescript
export type UserType =
  | "FPT_STUDENT"
  | "EXTERNAL_STUDENT"
  | "LECTURER"
  | "EVENT_COORDINATOR"
  | "SYSTEM_ADMIN";
```

Frontend portals (from route structure):
```text
(student)/student/...      — for FPT_STUDENT, EXTERNAL_STUDENT
(lecturer)/lecturer/...    — for LECTURER (handles both judging and mentoring)
(coordinator)/coordinator/ — for EVENT_COORDINATOR
(admin)/admin/...          — for SYSTEM_ADMIN
```

No separate `JUDGE` role or `MENTOR` role exists. Both are handled by `LECTURER`.

### Original Business Requirements

Core actors in the competition document:
```text
Admin / Organizing Committee (OC)
Coordinator
Student / Participant
Team Leader (flag, not a role)
Judge / BGK
Public User
```

### Misaligned Parts

| Current | Issue |
|---|---|
| `LECTURER` covers both judge and mentor | Makes conflict-of-interest detection harder — need to know if a LECTURER is acting as a judge or mentor for a given team |
| No distinction between "judge" LECTURER and "mentor" LECTURER | Assignment tables (`JudgeAssignment`, `MentorAssignment`) handle this, but the role itself is ambiguous |
| `EXTERNAL_STUDENT` verification | Domain whitelist not enforced at registration — any email domain is accepted |
| No graduated-student block | Competition rules: graduated students cannot participate; no enforcement in `RegisterRequest` |

### What Is Already Correct

```text
✓ Team Leader = TeamMember.isLeader (not a separate role)
✓ Student split: FPT_STUDENT vs EXTERNAL_STUDENT
✓ No bloated role list — down from 9 to 5 UserTypes
✓ 4 clear portals matching 4 role groups
```

### Remaining Gaps

```text
1. LECTURER acting as judge vs. mentor is determined only at assignment time,
   not at the role level. Conflict detection (judge must not score a team they mentor)
   must cross-check JudgeAssignment against MentorAssignment for the same team.

2. EXTERNAL_STUDENT: no domain whitelist enforced.
   Vietnamese university domains vary: @fpt.edu.vn, @hcmut.edu.vn, @uit.edu.vn, etc.
   A simple AllowedEmailDomain table per event is needed.

3. No rule blocking graduated students from registering.
```

---

## 3. Misalignment in Event Status

### Current State (actual code — `types.ts`)

```typescript
export type EventStatus =
  | "UPCOMING"
  | "OPEN"
  | "CLOSED_REGISTRATION"
  | "ACTIVE"
  | "SCORING"
  | "COMPLETED"
  | "CANCELLED";
```

Transition rules defined in `SEAL-Spring-2026-API.md`:
```text
UPCOMING → OPEN | CLOSED_REGISTRATION
OPEN → CLOSED_REGISTRATION | ACTIVE
CLOSED_REGISTRATION → ACTIVE
ACTIVE → SCORING | COMPLETED
SCORING → COMPLETED
```

### Original Business Requirements

Competition phases map to:
```text
Before event    → UPCOMING
Registration    → OPEN
Locked          → CLOSED_REGISTRATION
Competition day → ACTIVE
Scoring         → SCORING
Done            → COMPLETED
```

### Misaligned Parts

The enum is **mostly aligned**. Minor naming divergence from ideal:

| Current | Ideal | Gap |
|---|---|---|
| `UPCOMING` | `DRAFT` | Semantically different: UPCOMING implies a date is set; DRAFT implies not yet configured |
| `OPEN` | `OPEN_REGISTRATION` | Minor — OPEN is ambiguous (open to what?) |
| `ACTIVE` | `RUNNING` | Minor — ACTIVE could mean anything |
| `COMPLETED` | `FINISHED` | Minor naming only |

The status gates business permissions correctly:

| Status | Enforced Permission |
|---|---|
| `OPEN` | Allow team creation, member invitations |
| `CLOSED_REGISTRATION` | Block member changes |
| `ACTIVE` | Allow submission |
| `SCORING` | Allow judge scoring |
| `COMPLETED` | Results published |

**The status model is functionally correct.** The naming divergence is low priority.

---

## 4. Misalignment in Track / Group Assignment

> **Status: RESOLVED (2026-06)** — Backend, frontend API, UI, integration tests, and API doc implemented.  
> Full spec: [`docs/api/SEAL-Spring-2026-Track-Assignment-API.md`](docs/api/SEAL-Spring-2026-Track-Assignment-API.md)

### Current State (actual code)

`TrackResponse` (`track.api.ts`):
```typescript
export interface TrackResponse {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  topic: string | null;
  maxTeams: number;
  scoringTemplateId: string | null;
  status: TrackStatus;           // ✓ OPEN | LOCKED
  assignedTeamCount: number;     // ✓ live count
}
```

`TrackAssignmentMethod` (`track-assignment.api.ts`):
```typescript
export type TrackAssignmentMethod = "RANDOM" | "MANUAL" | "SELF_DRAW";
```

Draw session + lock wired in `track-assignment.api.ts` and `teamApi.selfDrawTrack()`:
- `POST /events/{eventId}/tracks/draw-session/open` — `trackAssignmentApi.openDrawSession()`
- `GET /events/{eventId}/tracks/draw-session` — `trackAssignmentApi.getDrawSession()`
- `POST /events/{eventId}/teams/{teamId}/track/draw` — `teamApi.selfDrawTrack()`
- `PUT /events/{eventId}/tracks/{trackId}/topic` — `trackApi.assignTopic()`
- `POST /events/{eventId}/tracks/lock` — `trackAssignmentApi.lockTracks()`

SEAL format blocks direct track pick: `PUT /teams/{teamId}/track` → 403; UI redirects to `/student/tracks/draw`.

Legacy `TrackRegistrationRequest` (direct team pick) **removed** from frontend types.

### Original Business Requirements (Spring 2026)

```text
1 Event → up to 3 Tracks
1 Track = 1 group (bảng)
1 Track → max 8 teams
Each Track → 1 topic (drawn by OC after teams self-select)

Process (Day 1, 11/4, 14:00–17:00):
  1. Teams take turns drawing lots to SELF-SELECT their Track
  2. After all teams have chosen, OC draws topic for each Track
  3. Tracks are locked — no changes after Day 1
```

### Resolution Summary

| Requirement | Status |
|---|---|
| `SELF_DRAW` assignment method | ✅ Implemented |
| Draw session open / poll / self-draw | ✅ Backend + frontend UI |
| `TrackResponse.status` OPEN / LOCKED | ✅ Types + API |
| `PUT /tracks/{trackId}/topic` | ✅ Coordinator UI |
| `POST /tracks/lock` | ✅ Coordinator UI |
| Block direct pick for SEAL | ✅ FormatRuleEngine + team detail panel |
| Integration tests | ✅ `TrackDrawSessionIntegrationTest` |
| API documentation | ✅ `SEAL-Spring-2026-Track-Assignment-API.md` |

### Remaining (non-blocking)

```text
- Schedule time gating (14:00–16:00) not enforced at API — BTC opens session manually (by design)
- Coordinator MANUAL assign UI not built (SEAL flow uses SELF_DRAW)
- Multi-SEAL-event selector on student draw page (edge case)
```

### What Is Already Correct

```text
✓ Track has topic field
✓ Track has maxTeams (8 for Spring 2026)
✓ Track is a core entity — not just a UI extension
✓ 3 tracks auto-seeded when SEAL_RAG_2026 format selected (per API spec)
✓ Track is connected to teams, scoring, and ranking
```

---

## 5. Misalignment in Preliminary and Final Rounds

### Current State (actual code)

`RoundType` exists:
```typescript
export type RoundType = "PRELIMINARY" | "FINAL"; // types.ts ✓
```

`RoundResponse` has `roundType` but it is optional:
```typescript
roundType?: RoundType | null;  // round.api.ts — should be required
```

`finalistApi` exists (`finalist.api.ts`):
```typescript
finalistApi.select(eventId)  // POST /events/{eventId}/finalists/select
// Business rule: Top-2 per track → 6 finalists
```

`advancementCutoff` in `RoundResponse`:
```typescript
advancementCutoff: number;  // generic number — not SEAL-specific Top-2-per-track logic
```

### Original Business Requirements

```text
Preliminary round (14:00–15:30):
- Judges visit each table — score Demo + product directly
- Each team: 5 min presentation + 3 min Q&A
- Top 2 per track advance → 6 total finalists (3 tracks × 2)

Final round (15:30–17:00):
- Each team: 7 min presentation + 3 min Q&A
- Final scores determine awards

Tie-break (if < 6 teams qualify cleanly):
  → Compare by earliest submission time
  → Still tied → OC applies penalty evaluation (max 10 min Q&A or mini test)
```

> ⚠️ **Document discrepancy:** General Rulebook says 08 finalists; Spring 2026 Competition Structure says 06 finalists. Follow Spring 2026: **06 finalists**.

### Misaligned Parts

| Current Code | Required |
|---|---|
| `roundType?: RoundType \| null` (optional) | Should be required for SEAL format rounds |
| `advancementCutoff: number` (generic) | For SEAL: logic is Top-2 per track, not a simple number cutoff |
| No presentation time enforcement | 5+3 min prelim, 7+3 min final are scheduling constraints (not system-enforced, but should be documented in EventSchedule) |
| `finalistApi.select()` business rule | Must enforce Top-2-per-track → 6 finalists. Tie-break by submission time, then penalty evaluation flag |

### What Is Already Correct

```text
✓ RoundType PRELIMINARY / FINAL exists
✓ FinalistApi exists with select() and list()
✓ FinalistResponse has trackId, trackName, preliminaryRank, selectedReason
✓ 2 rounds auto-seeded when SEAL_RAG_2026 format selected
```

---

## 6. Misalignment in Scoring Rubric

### Current State (actual code)

Criteria are attached to rounds in `RoundResponse`:
```typescript
criteria: CriteriaResponse[];  // per-round criteria
```

`ScoringCriterion` in `judge.types.ts`:
```typescript
export interface ScoringCriterion {
  id: string;
  name: string;
  weight: number;
  description: string;
  maxScore: number;   // ✓ maxScore exists
}
```

Scoring template API exists (`scoring-template.api.ts`) — rubric templates can be defined.

### Original Business Requirements

> ⚠️ **Document discrepancy:** General Rulebook has a different preliminary rubric (5 criteria × 20%) vs. Spring 2026 Competition Structure (30/30/15/15/10). **Follow Spring 2026 Competition Structure.**

**Preliminary rubric (Spring 2026):**

| Criterion | Weight |
|---|---:|
| Accuracy and Domain Relevance | 30% |
| Agentic RAG Architecture & Algorithm | 30% |
| Ideas & Presentation | 15% |
| Feasibility & Creativity | 15% |
| User Experience & Interactive Interface | 10% |

**Final rubric (consistent across both documents):**

| Criterion | Weight |
|---|---:|
| Data Processing & Retrieval Quality | 30% |
| Reliability & Hallucination Resistance | 20% |
| Agent Reasoning & Multi-hop Processing | 20% |
| Practicality & Operational Optimization | 20% |
| Scalability & Innovation | 10% |

**Scoring scale:** 1 (Poor) → 2 (Below expectations) → 3 (Meets) → 4 (Good) → 5 (Excellent)

### Misaligned Parts

| Current Code | Required |
|---|---|
| Criteria are attached to rounds (correct structure) | Spring 2026 rubric weights must be seeded correctly — wrong seed = wrong scoring |
| `maxScore` exists in `ScoringCriterion` | Must be set to 5 (scale 1–5) per Spring 2026 format |
| No enforcement that PRELIMINARY ≠ FINAL rubric | Must ensure each round has its own distinct criteria seeded |

### What Is Already Correct

```text
✓ Criteria are per-round — correct structure for having different rubrics per round
✓ maxScore field exists on ScoringCriterion
✓ Scoring template system exists for reusable rubrics
```

---

## 7. Misalignment in Submission

### Current State (actual code — `submission.api.ts`)

```typescript
export interface CreateSubmissionRequest {
  githubUrl?: string;       // still present
  sourceCodeUrl?: string;   // ✓ exists
  slideUrl?: string;        // ✓ exists
  demoUrl: string;          // ✓ exists
  pdfPageCount?: number;    // ✓ kept for all formats
}

// submissionApi.submit() accepts pdfFile?: File | null
// → PDF upload supported across all competition formats
```

`SubmissionVersionResponse`:
```typescript
githubUrl: string;          // still a field
sourceCodeUrl?: string;     // also present
slideUrl?: string | null;   // ✓ exists
demoUrl: string;
attachments: AttachmentResponse[];  // PDF attachments kept
```

`SubmitProjectRequest` (frontend form type — `submit-project.types.ts`):
```typescript
export interface SubmitProjectRequest {
  repositoryUrl: string;      // maps to githubUrl — still primary
  demoUrl: string;
  documentationUrl: string;
  slideUrl: string;
  isDraft: boolean;
}
```

No milestone gating in frontend: no check for "slide must be submitted before 10:00" in `submission.api.ts`.

### Original Business Requirements

```text
Submission artifacts:
  - Slide (primary — gate closes at 10:00 Day 2; OC locks after 10:00)
  - Source code URL: GitHub / Jira / Confluence / Notion (NOT Google Drive)
  - Demo URL: product link or video

Rules:
  - Only team leader can submit officially
  - Milestone 1 gate: slide URL must be submitted before 10:00
  - Milestone 2 gate: full submission (sourceCodeUrl + demoUrl) before 14:00
  - Google Drive blocked for source code
  - PDF is optional — kept for all formats, not required for SEAL_RAG_2026
```

### Misaligned Parts

| Current Code | Required |
|---|---|
| `repositoryUrl` is still the primary field name in `SubmitProjectRequest` | Should be `sourceCodeUrl` as the canonical name |
| `githubUrl` separate from `sourceCodeUrl` | Confusing duplication — source code field should be one field accepting GitHub, Jira, Notion, etc. |
| No milestone gate enforcement in frontend | Need gate: slide-only before 10:00; full submission before 14:00 |
| No Google Drive validation | Source code URL should reject drive.google.com domain |
| `isDraft: boolean` in frontend form | Submission lifecycle (draft vs submitted) is modeled but milestone gates are not wired |

### What Is Already Correct

```text
✓ slideUrl field exists in CreateSubmissionRequest
✓ sourceCodeUrl field exists (alongside githubUrl)
✓ demoUrl field exists
✓ submittedBy tracked (leader check)
✓ Submission is per round (preliminary vs final)
```

---

## 8. Misalignment in Schedule and Milestones

> **Status: RESOLVED** (2026-06-29)  
> Doc: [`docs/api/SEAL-Spring-2026-Schedule-API.md`](docs/api/SEAL-Spring-2026-Schedule-API.md)

### Resolution summary

| Gap (before) | Fix |
|---|---|
| No `scheduleApi` in frontend | Added `schedule.api.ts` with `list()` + client-side `getById()` |
| No `ScheduleType` / `ScheduleGate` enums | Types in `schedule.api.ts`, exported via `index.ts` |
| Milestones not visible in student portal | Dashboard card + full timeline on `/student/submissions` |
| Landing page skipped MILESTONE blocks | `EventScheduleTimeline` shows all schedule types |

### Current State (actual code)

```typescript
// frontend/src/lib/api/schedule.api.ts
scheduleApi.list(eventId)           // GET /events/{eventId}/schedule
scheduleApi.getById(eventId, id)    // client-side from list

// Types: ScheduleType, ScheduleGate, EventScheduleResponse
// Hook: useEventSchedule(eventId)
// UI: EventScheduleTimeline (compact | full)
```

Round model still stores enforceable deadlines:
```typescript
slideDeadline?: string | null;      // Milestone 1 gate (10:00)
submissionDeadline: string;         // Milestone 2 gate (14:00)
scoringDeadline: string;
```

Gates are **enforced** via round deadlines; `EventSchedule.gate` is display metadata cross-referenced on UI.

### Original Business Requirements

**Day 1 (11/04/2026):**

| Phase | Time |
|---|---|
| Opening, teams draw Track, OC draws topics, group assignment, setup | 14:00–17:00 |

**Day 2 (12/04/2026):**

| Phase | Time | Gate |
|---|---|---|
| Milestone 1: Architecture & Idea Development | 07:00–10:00 | `SLIDE_SUBMISSION` closes at 10:00 |
| **Slide Deadline** | **10:00** | OC locks slide gate |
| Milestone 2: Pitching + Product Completion | 10:00–14:00 | Pitching concurrent with coding |
| Preliminary Scoring (Technical Review) | 14:00–15:30 | Judges visit each table |
| Final Round | 15:30–17:00 | Top 6 teams present |
| Award Ceremony & Closing | 17:00–18:00 | |

### What Is Correct

```text
✓ EventSchedule seeded on SEAL_RAG_2026 event creation (8 items)
✓ GET /api/events/{eventId}/schedule + public variant
✓ scheduleApi + ScheduleType/ScheduleGate in frontend
✓ Student dashboard + submission page show Milestone 1 & 2
✓ Round submission/scoring deadlines tracked in RoundResponse
```

---

## 9. Misalignment in Mentor / Judge Assignment

### Current State (actual code — `assignment.api.ts`)

```typescript
// Judge: assigned PER ROUND
assignJudge(eventId, roundId, body)   // POST /events/{eventId}/rounds/{roundId}/judges
listJudges(eventId, roundId)
removeJudge(eventId, roundId, assignmentId)

// Mentor: assigned PER EVENT (not per track)
assignMentor(eventId, body)           // POST /events/{eventId}/mentors
listMentors(eventId)
removeMentor(eventId, assignmentId)
```

`MentorAssignmentResponse`:
```typescript
{
  id, eventId, mentorUserId, mentorFullName, mentorEmail, assignedAt
  // NO trackId field
}
```

`JudgeAssignmentResponse`:
```typescript
{
  id, roundId, judgeUserId, judgeFullName, judgeEmail, assignedAt
  // NO trackId field
}
```

Team-judge assignment (`team-judge-assignment.api.ts`) does have `trackId` in the overview:
```typescript
export interface TeamAssignmentOverview {
  teamId, teamName, trackId, trackName, ...
  judges: TeamJudgeAssignmentResponse[];
}
```

### Original Business Requirements

```text
Mentor → assigned per TRACK
  (mentors support teams in their track)

Judge → assigned per TRACK + per ROUND
  (preliminary judges scored within their track;
   final round judges cover all 6 finalists)

Conflict rule: A judge must not score a team they mentored.
```

### Misaligned Parts

| Current Code | Required |
|---|---|
| `MentorAssignment` has no `trackId` | Need `trackId` on `MentorAssignment` — mentor is per track |
| `JudgeAssignment` has no `trackId` | Need `trackId` for preliminary; `trackId = null` for final round |
| `/events/{eventId}/mentors` is event-wide | Should become `/events/{eventId}/tracks/{trackId}/mentors` |
| `/events/{eventId}/rounds/{roundId}/judges` has no track filter | Need track filter for preliminary judges |
| Conflict detection (judge vs mentor for same team) | Must cross-check: judge's assigned teams vs mentor's assigned teams before allowing scoring |

### What Is Already Correct

```text
✓ Judge assignment per round exists (preliminary vs final already separated by roundId)
✓ TeamJudgeAssignment (assigning specific teams to judges) exists
✓ TeamAssignmentOverview exposes trackId/trackName for context
✓ Separate pages for judge assignment and mentor assignment already exist in admin portal
```

---

## 10. Misalignment in Scoring

### Current State (actual code — `judge.types.ts`)

```typescript
export interface SubmissionForScoring {
  trackName: string | null;   // ✓ track info visible to judge
  criteria: ScoringCriterion[];
  existingScores: CriterionScore[] | null;
  scoreStatus: string | null;
  isDraft: boolean;
  isLocked: boolean;
  isCompleted: boolean;
}
```

Score submission:
```typescript
export interface SubmitScoresPayload {
  submissionId: string;
  scores: CriterionScore[];  // criterionId + score + feedback
}
```

No `trackId` or `roundType` in the score payload itself.

### Original Business Requirements

```text
Judge scores per: team × round × rubric
Rubric is tied to round (preliminary rubric ≠ final rubric)
Judge only sees teams assigned to them
Judge must not score a team they mentored
Score scale: 1–5 per criterion
```

### Misaligned Parts

| Current Code | Required |
|---|---|
| Judge can potentially see submissions beyond their assigned teams | Must filter: judge only sees teams they are assigned to |
| Conflict check (mentor-team) not visible in frontend | Before rendering scoring form, check if this judge mentors this team |
| No score deviation / review request flow | If max(judge scores) − min(judge scores) ≥ 25 → flag for review |

### What Is Already Correct

```text
✓ Scoring is per criterion with weight and maxScore
✓ isDraft / isLocked scoring lifecycle
✓ trackName shown in SubmissionForScoring
✓ Score history per judge (ScoreHistoryEntry)
✓ Criteria breakdown per submission
```

---

## 11. Score Deviation Review

> Full spec: [`SEAL-Spring-2026-Score-Review-API.md`](./SEAL-Spring-2026-Score-Review-API.md)

### Current State (implemented)

```text
✓ Backend: ScoreReviewRequest entity + score_review_requests table
✓ Auto-create when all judges complete and deviation ≥ 25 (0–100 scale)
✓ API: GET list, GET detail (coordinator + assigned judge read-only), PATCH resolve
✓ Audit: SCORE_REVIEW_CREATED, SCORE_REVIEW_RESOLVED
✓ Frontend: score-review.api.ts (ScoreReviewResponse), hooks, JudgeVariancePage
✓ Judge: hasOpenScoreReview + openScoreReviewId on my-assignments; read-only modal
✓ Dispute (team-initiated) remains separate in ranking.api.ts
```

### Original Business Requirements

```text
1. All judges finish scoring a team
2. System calculates: deviation = max(scores) − min(scores)
3. If deviation ≥ threshold (e.g., 25 points) → create ScoreReviewRequest
4. Coordinator / judge reviews the flag
5. Judge may keep or revise their score
6. System logs audit entry
```

### Previously misaligned (now fixed)

```text
✓ ScoreReviewResponse in frontend (score-review.api.ts)
✓ API endpoints for system-generated deviation alerts
✓ DisputeResponse unchanged — team-initiated only
```

### Model

```text
ScoreReviewRequest
- id, eventId, teamId, roundId, roundType, submissionId
- deviationValue, minJudgeScore, maxJudgeScore
- status: OPEN / RESOLVED / IGNORED
- createdAt, resolvedAt, resolutionNote

Threshold: maxJudgeScore − minJudgeScore ≥ 25 → auto-create request
```

---

## 12. Misalignment in Leaderboard

### Current State (actual code — `ranking.api.ts`)

```typescript
getSeasonRankings(params?: { season?, year?, trackId? })  // ✓ trackId filter exists

RankingResponse {
  teamId, teamName, roundId, roundName,
  trackId, trackName,  // ✓ track fields exist
  finalScore, rank, calculatedAt
}

PublishedResultResponse {
  roundId, publishedBy, publishedAt, disputeDeadline,
  rankings: RankingResponse[],
  advancements: AdvancementResponse[]
}
```

Frontend leaderboard types (`leaderboard.types.ts`):
```typescript
LeaderboardTeam {
  round1Score, round2Score, totalScore  // ← hard-coded to 2 rounds
  status: "promoted" | "active" | "at_risk" | "eliminated"
}
```

### Original Business Requirements

```text
Preliminary leaderboard: per track, shows ranking within that track
Final leaderboard: overall, shows Top 6 finalists ranked
Public access: only when published = true
Progress board: show where the event is in the competition flow
```

### Misaligned Parts

| Current Code | Required |
|---|---|
| `LeaderboardTeam` hard-codes `round1Score`, `round2Score` | Should derive from `RankingResponse` per `roundType`, not hard-coded |
| `LeaderboardParams { track?: string }` — filter by track name string | Should filter by `trackId` (UUID) and `roundType` |
| Status labels: "promoted", "at_risk", "eliminated" | For SEAL: simplified — "finalist" or "eliminated" after preliminary |
| No explicit PRELIMINARY / FINAL leaderboard split in frontend | Need `roundType` param in leaderboard query |
| `disputeDeadline` in PublishedResultResponse | Disputes are team-filed; still relevant but low priority for SEAL |

### What Is Already Correct

```text
✓ trackId present in RankingResponse
✓ publish flow: getPublishedResults() exists
✓ advancementStatus: ADVANCED / ELIMINATED
✓ Rankings are per-round (roundId filter)
✓ Public award endpoint: GET /public/events/{id}/awards
```

---

## 13. Misalignment in Team Matching

### Current State

`Team` type (`team.types.ts`):
```typescript
export interface Team {
  id, name, description, hackathonId, hackathonName,
  memberCount, maxMembers, trackName, status: "open" | "full",
  members: TeamMember[]
}
```

No `recruitmentNote`, `neededRoles`, or `isRecruiting` fields.

### Original Business Requirements

Teams short on members should be able to advertise needed roles. Participants without a team should see open teams without seeing private member details.

### Misaligned Parts

```text
✓ recruitmentNote, neededRoles, isRecruiting on Team (+ PUT /recruitment)
✓ preferredRole / isLookingForTeam on EventEnrollment (+ PUT /matching-profile)
✓ Joinable/browse views hide member & leader emails
✓ API doc: docs/api/SEAL-Spring-2026-Team-Matching-API.md
```

---

## 14. Misalignment in External Student Verification

> **Status: FIXED** — API doc: [`docs/api/SEAL-Spring-2026-External-Student-Verification-API.md`](docs/api/SEAL-Spring-2026-External-Student-Verification-API.md)

### Current State (`auth.api.ts`)

```typescript
export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  studentId?: string;
  universityName?: string; // EXTERNAL_STUDENT: select from whitelist label
  userType: Extract<UserType, "FPT_STUDENT" | "EXTERNAL_STUDENT">;
  studentStanding: Extract<StudentStanding, "ENROLLED">; // GRADUATED rejected server-side
  semester?: number;
}
```

### Original Business Requirements

```text
Eligible: students from FPT HCM or other HCM universities (by OC invitation)
Not eligible: graduated students
External student verification: must use a university/organization email domain
```

### Misaligned Parts (resolved)

```text
✓ Email domain whitelist enforced at registration (default SEAL 2026 list) and per-event enroll
✓ Graduated-student restriction via studentStanding (register + enroll + logged-in enroll)
✓ universityName validated against AllowedEmailDomain.universityLabel (dropdown, not free text)
✓ Admin/Coordinator UI: AllowedEmailDomainsPanel on event edit + /coordinator/allowed-domains
```

Vietnamese university domains supported (default template):
```text
@fpt.edu.vn, @fe.edu.vn, @hcmut.edu.vn, @student.hcmus.edu.vn, @uit.edu.vn, etc.
```

---

## 15. Misalignment in Business Rules Enforcement

### Status: ✅ Done (2026-06-29)

Doc: [`docs/api/SEAL-Spring-2026-Business-Rules-Enforcement-API.md`](docs/api/SEAL-Spring-2026-Business-Rules-Enforcement-API.md)

### Implemented

```text
✓ Registration deadline unified with member mutations (BE + FE gate hook)
✓ Semester min/max enforced at enroll (BE + FE profile gate)
✓ Graduated block at register/enroll (BE); FE uses studentStanding from profile
✓ tiebreakerCriterionIds structured field + ranking/finalist tie-break
✓ SEAL slide/demo gates in student-submission-page + round.utils submissionDeadline
✓ Judge–mentor conflict — already enforced (BE + FE); documented
✓ One team per event — BE enforced; FE join/invite gated by registration
✓ transferLeadership guarded after registration deadline
```

### Event fields (`event.api.ts`)

```typescript
minTeam / maxTeam          // BE + FE (resolveEventTeamSize)
semesterMin / semesterMax  // BE enroll + FE eligibility gate
tiebreakerCriterionIds     // machine-readable tie-break (ScoringTemplateCriterion IDs)
tiebreakerCriteria         // display label only (deprecated for logic)
registrationDeadline       // unified member mutation gate
```

---

## 16. Awards

### Current State (actual code — `award.api.ts`)

```typescript
awardApi.assign(eventId)         // auto-assign from final scores
awardApi.list(eventId)           // admin view
awardApi.listPublic(eventId)     // public view

TeamAwardResponse {
  prizeRank: "FIRST" | "SECOND" | "THIRD" | "CONSOLATION",
  prizeLabel, prizeValue, awardedAt
}
```

### Original Business Requirements

| Prize | Quantity | Value |
|---|---|---:|
| 1st Place | 01 | 7,000,000 VND + certificate |
| 2nd Place | 01 | 5,000,000 VND + certificate |
| 3rd Place | 01 | 3,000,000 VND + certificate |
| Honorable Mention | 01 | 1,500,000 VND + certificate |
| Certificate of Participation | All participants | — |

### Status

**Awards module is complete.** Prize ranks (FIRST/SECOND/THIRD/CONSOLATION) map correctly. Prizes are seeded when `SEAL_RAG_2026` format is selected. Certificate of Participation is issued automatically on `POST /awards/assign` for members of CONFIRMED teams.

```text
✓ Certificate of Participation — ParticipationCertificate entity + API
  Doc: docs/api/SEAL-Spring-2026-Awards-API.md
```

---

## 17. Feedback / Post-event Review

### Current State

`ParticipantFeedback` entity + REST API + frontend student/coordinator pages.

### Status

**Implemented (AS2).** Post-event survey: `overallRating` 1–5 + optional comment. Eligibility: team `CONFIRMED`, event `COMPLETED`, one submission per user per event.

```text
✓ ParticipantFeedback — entity + API + frontend
  Doc: docs/api/SEAL-Spring-2026-Participant-Feedback-API.md
  Student: /student/feedback
  Coordinator: /coordinator/feedback
```

---

# Summary of Actual Misalignments

| # | What Is Wrong in Code | Severity | Status |
|---:|---|---|---|
| 1 | SELF_DRAW method missing from `track-assignment.api.ts` | Very High | ✅ Done |
| 2 | Draw session endpoints not in frontend API layer | Very High | ✅ Done |
| 3 | `TrackResponse` missing `status: OPEN / LOCKED` field | High | ✅ Done |
| 4 | `PUT /tracks/{trackId}/topic` not in `track.api.ts` | High | ✅ Done |
| 5 | `POST /tracks/lock` not in `track.api.ts` | High | ✅ Done |
| 6 | Mentor assignment has no `trackId` — event-wide instead of per-track | Very High | Data model gap |
| 7 | Judge assignment has no `trackId` — round-wide instead of per-track | Very High | Data model gap |
| 8 | Judge-mentor conflict not checked before scoring | Very High | ✅ Done — see Business-Rules-Enforcement API |
| 9 | Milestone gates (10:00 slide, 14:00 demo) not enforced in frontend submission | High | ✅ Done — seal-submission.utils + round.utils |
| 10 | `EventSchedule` entity not in frontend API layer | High | API spec done, frontend missing |
| 11 | `repositoryUrl` / `githubUrl` still primary in submission form — should be `sourceCodeUrl` | Medium | Naming inconsistency |
| 12 | PDF still in submission model (`pdfPageCount`, `pdfFile`) | Medium | Should be removed |
| 13 | `LeaderboardTeam` hard-codes `round1Score / round2Score` | Medium | Should derive from RoundType |
| 14 | No `ScoreReviewRequest` for score deviation detection | Medium | ✅ Done — see SEAL-Spring-2026-Score-Review-API.md |
| 15 | `EXTERNAL_STUDENT` domain not validated | Medium | No whitelist |
| 16 | Graduated student block missing at registration | Medium | ✅ Done — see Business-Rules-Enforcement API |
| 17 | `roundType` is optional on `RoundResponse` — should be required for SEAL rounds | Low | Optional vs required |
| 18 | Certificate of participation not modeled | Low | ✅ Done — see SEAL-Spring-2026-Awards-API.md |

---

# Priority Fix Order

```text
Phase A — Track draw (Day 1 flow): ✅ COMPLETE
  Doc: docs/api/SEAL-Spring-2026-Track-Assignment-API.md
  Tests: TrackDrawSessionIntegrationTest

Phase B — Assignment accuracy:
  6. Add trackId to MentorAssignmentResponse
  7. Add trackId to JudgeAssignmentResponse
  8. Enforce judge-mentor conflict check before scoring

Phase C — Submission gates:
  9. Add milestone gate enforcement to submission.api.ts (slide ≤ 10:00, demo ≤ 14:00)
  10. Rename repositoryUrl → sourceCodeUrl as primary field
  11. Remove PDF from submission (or mark clearly as legacy)

Phase D — Schedule visibility:
  12. Add EventSchedule to frontend API layer (scheduleApi)
  13. Wire ScheduleType and ScheduleGate enums in types.ts

Phase E — Leaderboard cleanup:
  14. Remove hard-coded round1Score/round2Score from LeaderboardTeam
  15. Add roundType filter to leaderboard query
```
