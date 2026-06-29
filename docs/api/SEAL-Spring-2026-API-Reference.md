# SEAL Spring 2026 — API Reference

> Base URL: `/api` · Auth: Bearer JWT (trừ `/api/public/*`)  
> Phân chia theo [`File_nghiệp_vụ_lệch.md`](../../File_nghiệp_vụ_lệch.md)  
> Full spec: [`SEAL-Spring-2026-API.md`](./SEAL-Spring-2026-API.md)

---

## Mục lục

| # | Đề mục (`File_nghiệp_vụ_lệch.md`) | Trạng thái API doc |
|---:|---|---|
| **1** | Overall — Key Flow | ✅ **Đã implement & wire frontend (sprint này)** |
| 2 | User Roles | ⏳ Chưa có API mới |
| 3 | Event Status | ✅ **[SEAL-Spring-2026-Event-Status-API.md](./SEAL-Spring-2026-Event-Status-API.md)** — wired frontend |
| 4 | Track / Group Assignment | ✅ **[SEAL-Spring-2026-Track-Assignment-API.md](./SEAL-Spring-2026-Track-Assignment-API.md)** — wired frontend |
| 5 | Preliminary and Final Rounds | 📎 Tham chiếu (đã có sẵn) |
| 6 | Scoring Rubric | ✅ **[SEAL-Spring-2026-Scoring-Rubric-API.md](./SEAL-Spring-2026-Scoring-Rubric-API.md)** — wired frontend |
| 7 | Submission | ↩ Chi tiết trong **§1.3** |
| 8 | Schedule and Milestones | ↩ Chi tiết trong **§1.4** |
| 9 | Mentor / Judge Assignment | ⏳ Chưa implement |
| 10 | Scoring | ✅ **[SEAL-Spring-2026-Scoring-API.md](./SEAL-Spring-2026-Scoring-API.md)** — wired frontend |
| 11 | Score Deviation Review | ✅ **[SEAL-Spring-2026-Score-Review-API.md](./SEAL-Spring-2026-Score-Review-API.md)** — wired frontend |
| 12 | Leaderboard | ✅ **[SEAL-Spring-2026-Leaderboard-API.md](./SEAL-Spring-2026-Leaderboard-API.md)** — wired frontend (`/ranking`) |
| 13 | Team Matching | ✅ **[SEAL-Spring-2026-Team-Matching-API.md](./SEAL-Spring-2026-Team-Matching-API.md)** — wired frontend |
| 14 | External Student Verification | ✅ **[SEAL-Spring-2026-External-Student-Verification-API.md](./SEAL-Spring-2026-External-Student-Verification-API.md)** — wired frontend |
| 15 | Business Rules Enforcement | ⏳ Một phần (milestone gates → §1.3) |
| 16 | Awards | 📎 Tham chiếu (đã có sẵn) |
| 17 | Feedback / Post-event | ✅ **[SEAL-Spring-2026-Participant-Feedback-API.md](./SEAL-Spring-2026-Participant-Feedback-API.md)** — wired frontend |

---

## 3. Event Status (phase transitions)

> Ref: `File_nghiệp_vụ_lệch.md` **§3**  
> Full spec: [`SEAL-Spring-2026-Event-Status-API.md`](./SEAL-Spring-2026-Event-Status-API.md)

### 3.1 Frontend integration status

| Endpoint | Client | UI |
|---|---|---|
| `PATCH /events/{eventId}/status` | `eventApi.updateStatus()` | `EventPhasePanel` — coordinator tracks + admin edit |
| `POST /events/{eventId}/cancel` | `eventApi.cancel()` | Admin hackathon list (existing) |
| `POST /events/{eventId}/activate` | `eventApi.activate()` | Publish flow (existing) |
| `GET /events/{eventId}` | `eventApi.getById()` | Status badge + phase panel input |

### 3.2 Quick reference — PATCH status

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

**Response:** `ApiResponse<EventResponse>` — `data.status` is the resolved effective phase.

---

## 1. Overall: Key Flow (SEAL Spring 2026)

> Ref: `File_nghiệp_vụ_lệch.md` **§1**  
> **Sprint này:** wire frontend cho Day 1 track draw session + Milestone 1/2 gates.

### 1.0 Trạng thái end-to-end flow

```text
✓ Create event (SEAL_RAG_2026)          — POST /events
✓ Team registration                     — POST /events/{id}/teams
✓ Day 1: Track draw session             — §1.2 (frontend wired)
✓ Day 2: Competition
✓ Milestone 1 gate (slide 10:00)        — §1.3 (frontend wired)
✓ Milestone 2 gate (demo 14:00)         — §1.3 (frontend wired)
✓ Preliminary scoring                   — judging API (sẵn có)
✓ Finalist selection (Top-2/track → 6)  — §1.5
✓ Final round scoring                   — judging API (sẵn có)
✓ Award assignment                      — §1.5
```

### 1.1 Frontend Integration Status (sprint Mục 1)

| Endpoint | Client | UI |
|---|---|---|
| `GET /events/{id}/schedule` | `scheduleApi.list()` | Dashboard, `/student/submissions`, event detail dialog, public landing |
| `POST /tracks/draw-session/open` | `trackAssignmentApi.openDrawSession()` | `/coordinator/tracks` |
| `GET /tracks/draw-session` | `trackAssignmentApi.getDrawSession()` | Coordinator + `/student/tracks/draw` |
| `POST /teams/{id}/track/draw` | `teamApi.selfDrawTrack()` | `/student/tracks/draw` |
| `PUT /tracks/{id}/topic` | `trackApi.assignTopic()` | `/coordinator/tracks` |
| `POST /tracks/lock` | `trackAssignmentApi.lockTracks()` | `/coordinator/tracks` |
| `POST /rounds/{id}/submissions` | `submissionApi.submit()` | `/student/submissions` (milestone-aware) |
| `PUT /teams/{id}/track` | `teamApi.selectTrack()` | Blocked SEAL → redirect draw page |
| `RoundResponse.slideDeadline` | `round.api.ts` | Phase detection Milestone 1/2 |

### 1.2 Day 1 — Track draw session

> Liên quan: `File_nghiệp_vụ_lệch.md` **§4** (Track / Group Assignment)  
> Full spec: [`SEAL-Spring-2026-Track-Assignment-API.md`](./SEAL-Spring-2026-Track-Assignment-API.md)

#### POST `/api/events/{eventId}/tracks/draw-session/open`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR` · **Format:** `SEAL_RAG_2026` only

**Request:**
```json
{
  "scheduledAt": "2026-04-11T14:00:00",
  "drawOrder": ["team-uuid-1", "team-uuid-2", "team-uuid-3"]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `scheduledAt` | ISO datetime | No | Thời điểm dự kiến mở phiên |
| `drawOrder` | UUID[] | No | Mặc định: thứ tự tạo team |

**Response 200:**
```json
{
  "success": true,
  "message": "Track draw session opened",
  "data": {
    "sessionId": "d4e5f6a7-b8c9-0123-def0-234567890123",
    "eventId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "OPEN",
    "currentTeamId": "team-uuid-1",
    "currentTeamName": "Team Alpha",
    "currentIndex": 0,
    "totalTeams": 12,
    "scheduledAt": "2026-04-11T14:00:00",
    "openedAt": "2026-04-11T14:00:05",
    "availableTracks": [
      { "trackId": "track-uuid-a", "name": "Bảng A", "status": "OPEN", "remainingSlots": 8 },
      { "trackId": "track-uuid-b", "name": "Bảng B", "status": "OPEN", "remainingSlots": 8 },
      { "trackId": "track-uuid-c", "name": "Bảng C", "status": "OPEN", "remainingSlots": 8 }
    ]
  }
}
```

**Errors:** `409` session đang OPEN · `400` tất cả đội đã có bảng · `403` không phải coordinator

---

#### GET `/api/events/{eventId}/tracks/draw-session`

**Auth:** Authenticated · **Request:** None

**Response 200:** Cùng shape `data` như `open`.

**Errors:** `404` chưa có session

---

#### POST `/api/events/{eventId}/teams/{teamId}/track/draw`

**Auth:** Team leader (đúng lượt, session OPEN)

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

**Errors:** `403` không phải leader / chưa đến lượt · `409` bảng đầy / đội đã có bảng / track locked

---

#### PUT `/api/events/{eventId}/tracks/{trackId}/topic`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

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
    "id": "track-uuid-a",
    "eventId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Bảng A",
    "topic": "Domain-Specific RAG for Healthcare",
    "maxTeams": 8,
    "status": "OPEN",
    "assignedTeamCount": 6
  }
}
```

**Errors:** `409` track LOCKED · `400` topic trống

---

#### POST `/api/events/{eventId}/tracks/lock`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR` · **Request:** None

**Response 200:**
```json
{
  "success": true,
  "message": "All tracks locked",
  "data": { "lockedTrackCount": 3 }
}
```

**Side effects:** tracks → `LOCKED`; draw session OPEN → `CLOSED`.

---

#### PUT `/api/events/{eventId}/teams/{teamId}/track` — Blocked for SEAL

**Auth:** Team leader (**GENERIC** only)

**Request:** `{ "trackId": "track-uuid-a" }`

**Error 403 (SEAL):**
```json
{
  "success": false,
  "message": "Track assignment for SEAL events is managed by coordinators. Contact BTC."
}
```

---

#### GET `/api/events/{eventId}/tracks` — `TrackResponse` (fields mới)

```json
{
  "id": "track-uuid-a",
  "name": "Bảng A",
  "topic": "Domain-Specific RAG for Healthcare",
  "maxTeams": 8,
  "status": "OPEN",
  "assignedTeamCount": 6
}
```

---

### 1.3 Day 2 — Milestone submission gates

> Liên quan: `File_nghiệp_vụ_lệch.md` **§7** (Submission), **§15** (Business Rules)

Enforcement: `Round.slideDeadline` (10:00) + `Round.submissionDeadline` (14:00) cho `PRELIMINARY` + `SEAL_RAG_2026`.

#### POST `/api/rounds/{roundId}/submissions`

**Auth:** Team leader · **Content-Type:** `multipart/form-data`

| Part | Type | Required |
|---|---|---|
| `submission` | JSON Blob | Yes |
| `pdf` | File | No (SEAL không bắt buộc) |

**Milestone 1 — trước 10:00 (slide only):**
```json
{ "slideUrl": "https://docs.google.com/presentation/d/abc123/edit" }
```

**Response 201:**
```json
{
  "success": true,
  "message": "Submission successful",
  "data": {
    "id": "sub-uuid-1",
    "teamId": "team-uuid-1",
    "roundId": "round-prelim-uuid",
    "status": "SUBMITTED",
    "currentVersion": 1,
    "latestVersion": {
      "versionNumber": 1,
      "slideUrl": "https://docs.google.com/presentation/d/abc123/edit",
      "demoUrl": null,
      "submittedAt": "2026-04-12T09:30:00"
    }
  }
}
```

**Milestone 2 — 10:00–14:00 (full submission):**
```json
{
  "sourceCodeUrl": "https://github.com/org/seal-rag-project",
  "slideUrl": "https://docs.google.com/presentation/d/abc123/edit",
  "demoUrl": "https://youtube.com/watch?v=xxx"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "currentVersion": 2,
    "latestVersion": {
      "versionNumber": 2,
      "sourceCodeUrl": "https://github.com/org/seal-rag-project",
      "slideUrl": "https://docs.google.com/presentation/d/abc123/edit",
      "demoUrl": "https://youtube.com/watch?v=xxx",
      "submittedAt": "2026-04-12T11:15:00"
    }
  }
}
```

**Errors:**

| Code | Condition |
|---|---|
| `400` | Slide gate đóng sau 10:00 |
| `400` | Demo deadline 14:00 |
| `400` | Google Drive blocked cho source |
| `400` | Thiếu demo trong Milestone 2 |
| `403` | Không phải leader |

---

#### GET `/api/events/{eventId}/rounds` — `RoundResponse` (field mới)

```json
{
  "roundType": "PRELIMINARY",
  "slideDeadline": "2026-04-12T10:00:00",
  "submissionDeadline": "2026-04-12T14:00:00",
  "scoringDeadline": "2026-04-12T15:30:00"
}
```

---

### 1.4 Schedule timeline

> Liên quan: `File_nghiệp_vụ_lệch.md` **§8** (Schedule and Milestones)  
> Full spec: [`SEAL-Spring-2026-Schedule-API.md`](./SEAL-Spring-2026-Schedule-API.md)

#### GET `/api/events/{eventId}/schedule`

**Auth:** Authenticated · **Request:** None

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "type": "OPENING",
      "title": "Khai mạc & bốc thăm bảng",
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

**Enums:** `ScheduleType` · `ScheduleGate` (`SLIDE_SUBMISSION`, `DEMO_SUBMISSION`)

---

### 1.5 Finalist & Awards

> Liên quan: `File_nghiệp_vụ_lệch.md` **§5**, **§16**  
> **Doc chi tiết:** [`SEAL-Spring-2026-Rounds-Finalists-API.md`](./SEAL-Spring-2026-Rounds-Finalists-API.md) · [`SEAL-Spring-2026-Awards-API.md`](./SEAL-Spring-2026-Awards-API.md)

| Method | Path | Client |
|---|---|---|
| POST | `/api/events/{eventId}/finalists/select` | `finalistApi.select()` → `FinalistSelectResultResponse` |
| GET | `/api/events/{eventId}/finalists` | `finalistApi.list()` |
| GET | `/api/events/{eventId}/finalists/contested` | `finalistApi.listContested()` |
| POST | `/api/events/{eventId}/awards/assign` | `awardApi.assign()` → `AwardAssignmentResultResponse` |
| GET | `/api/events/{eventId}/awards` | `awardApi.list()` |
| GET | `/api/public/events/{eventId}/awards` | `awardApi.listPublic()` |
| GET | `/api/events/{eventId}/awards/participation` | `awardApi.listParticipation()` |
| GET | `/api/events/{eventId}/awards/participation/me` | `awardApi.getMyParticipation()` |
| GET | `/api/public/events/{eventId}/awards/participation` | `awardApi.listParticipationPublic()` |

Chi tiết request/response giải đội: [`SEAL-Spring-2026-Rounds-Finalists-API.md`](./SEAL-Spring-2026-Rounds-Finalists-API.md).  
Chi tiết participation certificates: [`SEAL-Spring-2026-Awards-API.md`](./SEAL-Spring-2026-Awards-API.md).

---

### 1.6 End-to-end flow

```text
POST /events (SEAL_RAG_2026)
  → Teams register
  → PATCH /events/{id}/status → CLOSED_REGISTRATION     [§3]
  → POST /tracks/draw-session/open                        [§1.2 — Coordinator]
  → GET  /tracks/draw-session (poll)                      [§1.2]
  → POST /teams/{teamId}/track/draw                       [§1.2 — Student leader]
  → PUT  /tracks/{trackId}/topic                          [§1.2 — Coordinator]
  → POST /tracks/lock                                     [§1.2 — Coordinator]
  → PATCH /events/{id}/status → ACTIVE                    [§3]
  → GET  /events/{id}/schedule                            [§1.4]
  → POST /rounds/{prelimId}/submissions (slide, < 10:00)  [§1.3]
  → POST /rounds/{prelimId}/submissions (full, < 14:00)   [§1.3]
  → Judges score                                          [§10]
  → POST /finalists/select                                [§1.5]
  → Final scoring → POST /awards/assign                   [§1.5]
  → GET /public/events/{id}/awards                        [§1.5]
  → GET /public/events/{id}/awards/participation          [§1.5]
  → GET /events/{id}/awards/participation/me              [§1.5 — student]
```

### 1.7 Frontend TypeScript mapping

```typescript
eventApi.getSchedule(eventId)
trackAssignmentApi.openDrawSession(eventId, body?)
trackAssignmentApi.getDrawSession(eventId)
trackAssignmentApi.lockTracks(eventId)
teamApi.selfDrawTrack(eventId, teamId, { trackId })
trackApi.assignTopic(eventId, trackId, { topic })
submissionApi.submit(roundId, { slideUrl })                              // M1
submissionApi.submit(roundId, { sourceCodeUrl, slideUrl, demoUrl })      // M2
```

---
