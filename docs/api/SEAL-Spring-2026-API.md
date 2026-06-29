# SEAL Hackathon Spring 2026 — API Reference

> Base URL: `/api`  
> Auth: Bearer JWT (trừ `/api/public/*`)  
> Track assignment (§4): [`SEAL-Spring-2026-Track-Assignment-API.md`](./SEAL-Spring-2026-Track-Assignment-API.md)

---

## Enums

| Enum | Values |
|---|---|
| `CompetitionFormat` | `GENERIC`, `SEAL_RAG_2026` |
| `RoundType` | `PRELIMINARY`, `FINAL` |
| `EventStatus` | `UPCOMING`, `OPEN`, `CLOSED_REGISTRATION`, `ACTIVE`, `SCORING`, `COMPLETED`, `CANCELLED` |
| `TrackAssignmentMethod` | `MANUAL`, `RANDOM`, `SELF_DRAW` |
| `TrackStatus` | `OPEN`, `LOCKED` |
| `DrawSessionStatus` | `OPEN`, `CLOSED` |
| `ScheduleType` | `WORKSHOP`, `OPENING`, `TRACK_DRAW`, `MILESTONE`, `SCORING`, `FINAL`, `CEREMONY` |
| `ScheduleGate` | `SLIDE_SUBMISSION`, `DEMO_SUBMISSION` |

**Migration:** [`backend/src/main/resources/db/seal_spring_2026_migration.sql`](../backend/src/main/resources/db/seal_spring_2026_migration.sql)

---

## Phase 1: Create SEAL Event

### POST `/api/events`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Request:**
```json
{
  "name": "SEAL Hackathon Spring 2026",
  "season": "SPRING",
  "year": 2026,
  "startDate": "2026-04-12",
  "endDate": "2026-04-12",
  "registrationOpenDate": "2026-03-15",
  "registrationDeadline": "2026-03-25",
  "competitionFormat": "SEAL_RAG_2026",
  "description": "Mastering Domain-Specific AI RAG Systems",
  "location": "FPT HCM"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "SEAL Hackathon Spring 2026",
    "competitionFormat": "SEAL_RAG_2026",
    "status": "UPCOMING",
    "trackCount": 3,
    "roundCount": 2,
    "tracks": [
      { "id": "uuid", "name": "Bảng A", "topic": null, "maxTeams": 8, "status": "OPEN" },
      { "id": "uuid", "name": "Bảng B", "topic": null, "maxTeams": 8, "status": "OPEN" },
      { "id": "uuid", "name": "Bảng C", "topic": null, "maxTeams": 8, "status": "OPEN" }
    ],
    "rounds": [
      {
        "roundType": "PRELIMINARY",
        "slideDeadline": "2026-04-12T10:00:00",
        "submissionDeadline": "2026-04-12T14:00:00",
        "scoringDeadline": "2026-04-12T15:30:00"
      },
      { "roundType": "FINAL" }
    ],
    "prizes": [
      { "rank": "FIRST", "label": "Giải Nhất", "value": "7000000" }
    ]
  }
}
```

**Business rules:** Auto-seed 3 tracks (max 8, topic null — OC gán sau), 2 rounds, rubrics Spring 2026, prizes, event schedule.

---

### GET `/api/events/{eventId}/schedule`

**Auth:** Authenticated

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "eventId": "uuid",
      "type": "OPENING",
      "title": "Khai mạc & bốc thăm bảng",
      "description": "Đội tự chọn bảng theo lượt; BTC bốc thăm topic cho từng bảng",
      "startTime": "2026-04-11T14:00:00",
      "endTime": "2026-04-11T17:00:00",
      "gate": null,
      "sortOrder": 1
    },
    {
      "type": "MILESTONE",
      "title": "Milestone 1 — Hoàn thiện ý tưởng & kiến trúc",
      "startTime": "2026-04-12T07:00:00",
      "endTime": "2026-04-12T10:00:00",
      "gate": "SLIDE_SUBMISSION",
      "sortOrder": 3
    },
    {
      "type": "MILESTONE",
      "title": "Milestone 2 — Pitching & hoàn thiện sản phẩm",
      "startTime": "2026-04-12T10:00:00",
      "endTime": "2026-04-12T14:00:00",
      "gate": "DEMO_SUBMISSION",
      "sortOrder": 4
    }
  ]
}
```

---

### PATCH `/api/events/{eventId}/status`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Request:**
```json
{ "status": "CLOSED_REGISTRATION" }
```

**Allowed transitions:**
```text
UPCOMING → OPEN | CLOSED_REGISTRATION
OPEN → CLOSED_REGISTRATION | ACTIVE
CLOSED_REGISTRATION → ACTIVE
ACTIVE → SCORING | COMPLETED
SCORING → COMPLETED
```

**Response 200:** `EventResponse` với status mới.

**Errors:**
- `400` — Transition không hợp lệ
- `400` — Dùng `/cancel` để hủy event

---

## Phase 2: Track Assignment (Day 1)

### POST `/api/events/{eventId}/tracks/draw-session/open`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`  
**SEAL format only**

**Request:**
```json
{
  "scheduledAt": "2026-04-11T14:00:00",
  "drawOrder": ["team-uuid-1", "team-uuid-2"]
}
```

`drawOrder` optional — mặc định theo thời gian tạo team.

**Response 200:**
```json
{
  "success": true,
  "message": "Track draw session opened",
  "data": {
    "sessionId": "uuid",
    "eventId": "uuid",
    "status": "OPEN",
    "currentTeamId": "team-uuid-1",
    "currentTeamName": "Team Alpha",
    "currentIndex": 0,
    "totalTeams": 12,
    "scheduledAt": "2026-04-11T14:00:00",
    "openedAt": "2026-04-11T14:00:05",
    "availableTracks": [
      { "trackId": "uuid", "name": "Bảng A", "status": "OPEN", "remainingSlots": 8 },
      { "trackId": "uuid", "name": "Bảng B", "status": "OPEN", "remainingSlots": 8 }
    ]
  }
}
```

**Errors:**
- `409` — Session đang mở
- `400` — Tất cả đội đã có bảng

---

### GET `/api/events/{eventId}/tracks/draw-session`

**Auth:** Authenticated

**Response 200:** Cùng shape `data` như open session.

---

### POST `/api/events/{eventId}/teams/{teamId}/track/draw`

**Auth:** Team leader (đúng lượt trong session)

**Request:**
```json
{ "trackId": "track-uuid-c" }
```

**Response 200:**
```json
{
  "success": true,
  "message": "Track selected via draw",
  "data": {
    "teamId": "team-uuid-1",
    "trackId": "track-uuid-c",
    "trackName": "Bảng C",
    "method": "SELF_DRAW"
  }
}
```

**Errors:**
- `403` — Không phải leader / chưa đến lượt
- `409` — Bảng đầy hoặc đội đã có bảng
- `409` — Track locked

---

### POST `/api/events/{eventId}/tracks/assign`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Request:**
```json
{
  "assignments": [
    { "teamId": "uuid", "trackId": "uuid" }
  ]
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Tracks assigned",
  "data": [
    { "teamId": "uuid", "trackId": "uuid", "trackName": "Bảng A", "method": "MANUAL" }
  ]
}
```

---

### POST `/api/events/{eventId}/tracks/draw`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`  
Coordinator random gán (legacy/fallback).

**Request:** `{ "method": "RANDOM" }`

**Response 200:**
```json
{
  "success": true,
  "message": "Track draw completed",
  "data": {
    "assignments": [{ "teamId": "uuid", "trackId": "uuid", "trackName": "Bảng B", "method": "RANDOM" }],
    "unassignedCount": 0
  }
}
```

---

### PUT `/api/events/{eventId}/tracks/{trackId}/topic`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`  
OC bốc thăm/gán topic sau khi đội chọn bảng.

**Request:**
```json
{ "topic": "Domain-Specific RAG for Healthcare" }
```

**Response 200:**
```json
{
  "success": true,
  "message": "Track topic assigned",
  "data": {
    "id": "uuid",
    "name": "Bảng A",
    "topic": "Domain-Specific RAG for Healthcare",
    "maxTeams": 8,
    "status": "OPEN",
    "assignedTeamCount": 6
  }
}
```

**Errors:**
- `409` — Track đã locked

---

### POST `/api/events/{eventId}/tracks/lock`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`  
Khóa tất cả bảng sau Day 1.

**Response 200:**
```json
{
  "success": true,
  "message": "All tracks locked",
  "data": { "lockedTrackCount": 3 }
}
```

---

### PUT `/api/events/{eventId}/teams/{teamId}/track` — *(Blocked for SEAL)*

**Error 403:**
```json
{
  "success": false,
  "message": "Track assignment for SEAL events is managed by coordinators. Contact BTC."
}
```

---

## Phase 3: Finalist Selection

> **Chi tiết đầy đủ:** [`SEAL-Spring-2026-Rounds-Finalists-API.md`](./SEAL-Spring-2026-Rounds-Finalists-API.md)

### POST `/api/events/{eventId}/finalists/select`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Response 200:**
```json
{
  "success": true,
  "message": "Finalists selected",
  "data": {
    "finalists": [
      {
        "id": "uuid",
        "teamId": "uuid",
        "teamName": "Team Alpha",
        "trackId": "uuid",
        "trackName": "Bảng A",
        "preliminaryRank": 1,
        "selectedReason": "Top 2 in track",
        "selectedAt": "2026-04-12T15:30:00",
        "selectionMethod": "TOP_PER_TRACK",
        "needsPenaltyEvaluation": false
      }
    ],
    "contestedSlots": [],
    "summary": {
      "selectedCount": 6,
      "targetCount": 6,
      "penaltyEvaluationRequired": false
    }
  }
}
```

**Business rules:** Top 2/bảng → 6 đội; tie-break theo submit sớm hơn; hòa sau submit → `contestedSlots` + OC penalty evaluation.

### GET `/api/events/{eventId}/finalists/contested` *(mới)*

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR` — Danh sách vị trí tranh chấp chưa resolve.

---

### GET `/api/events/{eventId}/finalists`

**Response 200:** Cùng `data[]` như trên.

---

## Phase 4: Submission (Milestone gates)

> **Chi tiết đầy đủ:** [`SEAL-Spring-2026-Submission-API.md`](./SEAL-Spring-2026-Submission-API.md)

### POST `/api/rounds/{roundId}/submissions`

**Auth:** Team leader  
**Content-Type:** `multipart/form-data` — field `submission` (JSON) + optional `pdf`

#### Milestone 1 — trước 10:00 (slide only)

**Request JSON:**
```json
{ "slideUrl": "https://docs.google.com/presentation/d/xxx" }
```

#### Milestone 2 — trước 14:00 (full submission)

**Request JSON:**
```json
{
  "sourceCodeUrl": "https://github.com/org/repo",
  "slideUrl": "https://docs.google.com/presentation/d/xxx",
  "demoUrl": "https://youtube.com/watch?v=xxx"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Submission successful",
  "data": {
    "id": "uuid",
    "teamId": "uuid",
    "roundId": "uuid",
    "status": "SUBMITTED",
    "latestVersion": {
      "versionNumber": 1,
      "githubUrl": "https://github.com/org/repo",
      "sourceCodeUrl": "https://github.com/org/repo",
      "slideUrl": "https://docs.google.com/presentation/d/xxx",
      "demoUrl": "https://youtube.com/watch?v=xxx",
      "submittedAt": "2026-04-12T09:45:00"
    }
  }
}
```

**Errors:**
- `400` — Slide gate đóng sau 10:00
- `400` — Demo deadline 14:00
- `403` — Không phải leader / không phải finalist (FINAL round)
- `400` — Google Drive blocked cho source code

---

## Phase 5: Leaderboard

### GET `/api/events/{eventId}/leaderboard`

**Query:** `trackId`, `roundId`, `roundType` (`PRELIMINARY` | `FINAL`)

**Example:** `GET /api/events/{eventId}/leaderboard?roundType=PRELIMINARY&trackId={trackId}`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "eventId": "uuid",
    "roundId": "uuid",
    "roundName": "Vòng bảng",
    "rankings": [
      {
        "rank": 1,
        "teamId": "uuid",
        "teamName": "Team Alpha",
        "trackId": "uuid",
        "trackName": "Bảng A",
        "finalScore": 87.5
      }
    ],
    "scoresLocked": false,
    "resultsPublished": false,
    "leaderboardPublic": false
  }
}
```

### POST `/api/events/{eventId}/leaderboard/publish?roundId={uuid}`

### POST `/api/events/{eventId}/leaderboard/lock?roundId={uuid}`

---

## Phase 6: Awards

> **Doc chi tiết:** [`SEAL-Spring-2026-Awards-API.md`](./SEAL-Spring-2026-Awards-API.md)

### POST `/api/events/{eventId}/awards/assign`

Assigns team prizes **and** participation certificates (CONFIRMED team members).

**Response 200:**

```json
{
  "success": true,
  "message": "Awards assigned",
  "data": {
    "teamAwards": [
      {
        "teamId": "uuid",
        "teamName": "Team Alpha",
        "prizeRank": "FIRST",
        "prizeLabel": "Giải Nhất",
        "prizeValue": "7000000",
        "awardedAt": "2026-04-12T18:00:00"
      }
    ],
    "participationCertificatesIssued": 42,
    "participationCertificates": []
  }
}
```

### GET `/api/events/{eventId}/awards`

### GET `/api/public/events/{eventId}/awards`

### GET `/api/events/{eventId}/awards/participation`

### GET `/api/events/{eventId}/awards/participation/me`

### GET `/api/public/events/{eventId}/awards/participation`

---

## End-to-end flow (SEAL Spring 2026)

```text
POST /events (SEAL_RAG_2026)
→ Teams register
→ PATCH /events/{id}/status → CLOSED_REGISTRATION
→ POST /tracks/draw-session/open
→ POST /teams/{teamId}/track/draw (each team, in order)
→ PUT /tracks/{trackId}/topic (OC assigns per track)
→ POST /tracks/lock
→ PATCH /events/{id}/status → ACTIVE
→ POST /rounds/{prelimId}/submissions (slide before 10:00)
→ POST /rounds/{prelimId}/submissions (full before 14:00)
→ Judges score → POST /finalists/select
→ Final round scoring → POST /awards/assign
→ GET /public/events/{id}/awards
→ GET /public/events/{id}/awards/participation
```

---

## Modified endpoints summary

| Method | Path | Change |
|---|---|---|
| POST | `/api/events` | + schedule seed, tracks without preset topic |
| GET | `/api/events/{id}` | + `competitionFormat`, `tracks[].status`, `rounds[].slideDeadline` |
| PATCH | `/api/events/{eventId}/status` | **NEW** — phase transitions |
| GET | `/api/events/{eventId}/schedule` | **NEW** |
| POST | `/api/events/{eventId}/tracks/draw-session/open` | **NEW** |
| GET | `/api/events/{eventId}/tracks/draw-session` | **NEW** |
| POST | `/api/events/{eventId}/teams/{teamId}/track/draw` | **NEW** — SELF_DRAW |
| PUT | `/api/events/{eventId}/tracks/{trackId}/topic` | **NEW** |
| POST | `/api/events/{eventId}/tracks/lock` | **NEW** |
| PUT | `/api/events/{eventId}/teams/{teamId}/track` | Blocked for SEAL |
| POST | `/api/rounds/{roundId}/submissions` | Milestone gates (slide 10:00, demo 14:00) |
| GET | `/api/events/{eventId}/leaderboard` | + `roundType` query |
