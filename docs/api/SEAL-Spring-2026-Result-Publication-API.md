# SEAL Spring 2026 — Result Publication Flow API

> **PROMPT 5** — APIs consumed by Publish Flow UI (coordinator) and Results & Awards page (student)  
> Base URL: `/api` · Auth: Bearer JWT (unless noted)  
> **No new endpoints** were created for this feature — this document consolidates existing APIs used by the frontend.

Related docs:
- [`SEAL-Spring-2026-Leaderboard-API.md`](./SEAL-Spring-2026-Leaderboard-API.md)
- [`SEAL-Spring-2026-Rounds-Finalists-API.md`](./SEAL-Spring-2026-Rounds-Finalists-API.md)
- [`SEAL-Spring-2026-Awards-API.md`](./SEAL-Spring-2026-Awards-API.md)

---

## 1. Endpoint summary

| Endpoint | Method | Request Body / Params | Response |
|---|---|---|---|
| `/events/{id}/leaderboard` | GET | `?trackId`, `roundId`, `roundType` | `LiveScoreBoard` |
| `/events/{id}/leaderboard/lock` | POST | `?roundId` | `LiveScoreBoard` |
| `/events/{id}/leaderboard/publish` | POST | `?roundId` | `LiveScoreBoard` |
| `/events/{id}/leaderboard/public` | POST | `?enabled` | `LiveScoreBoard` |
| `/rounds/{id}/rankings/recalculate` | POST | — | `RankingResponse[]` |
| `/events/{id}/finalists/select` | POST | — | `FinalistSelectResultResponse` |
| `/events/{id}/finalists` | GET | — | `FinalistResponse[]` |
| `/events/{id}/finalists/contested` | GET | — | `ContestedSlotResponse[]` |
| `/events/{id}/awards/assign` | POST | — | `AwardAssignmentResultResponse` |
| `/events/{id}/awards` | GET | — | `TeamAwardResponse[]` |
| `/public/events/{id}/awards` | GET | — | `TeamAwardResponse[]` |
| `/events/{id}/awards/participation/me` | GET | — | `ParticipationCertificateResponse` |
| `/public/events/{id}/awards/participation` | GET | — | `ParticipationCertificateSummaryResponse` |

**WebSocket (Live Updates sidebar):** `STOMP /topic/events/{eventId}/ranking-events` → `RankingEvent` payloads (not REST).

---

## 2. Frontend hook mapping

| Hook | API client | UI |
|---|---|---|
| `useLiveScoreBoard` | `livescoreApi.getLeaderboard` | LiveScore Arena rankings table |
| `useLockScores` | `livescoreApi.lockScores` | Publish Flow Step 1 |
| `usePublishResults` | `livescoreApi.publishResults` | Publish Flow — Publish Results |
| `useToggleLeaderboardPublic` | `livescoreApi.setLeaderboardPublic` | Publish Flow — public toggle |
| `useRecalculateRankings` | `rankingApi.recalculate` | Publish Flow Step 1 |
| `useSelectFinalists` | `finalistApi.select` | FinalistsPanel |
| `useFinalists` | `finalistApi.list` | FinalistsPanel |
| `useContestedFinalistSlots` | `finalistApi.listContested` | FinalistsPanel warning |
| `useAssignAwards` | `awardApi.assign` | AwardsPanel |
| `useTeamAwards` | `awardApi.list` | AwardsPanel (coordinator) |
| `usePublicAwards` | `awardApi.listPublic` | Student Results page |
| `useMyParticipationCertificate` | `awardApi.getMyParticipation` | Student certificate card |
| `useParticipationSummary` | `awardApi.listParticipationPublic` | Student issued count |

---

## 3. Shared response types

### 3.1 LiveScoreStatus

```
NOT_SUBMITTED | WAITING_FOR_SCORE | PARTIALLY_SCORED | FULLY_SCORED | LOCKED | PUBLISHED
```

### 3.2 LiveScoreEntry

```json
{
  "teamId": "uuid",
  "teamName": "Team Alpha",
  "trackName": "Bảng A",
  "trackId": "uuid",
  "finalScore": 87.5,
  "rank": 1,
  "previousRank": 2,
  "scoreStatus": "FULLY_SCORED",
  "judgesScored": 3,
  "judgesAssigned": 3,
  "calculatedAt": "2026-04-12T15:30:00"
}
```

### 3.3 LiveScoreBoard

```json
{
  "eventId": "uuid",
  "eventName": "SEAL Spring 2026",
  "season": "SPRING",
  "year": 2026,
  "roundId": "uuid",
  "roundName": "Vòng bảng",
  "roundType": "PRELIMINARY",
  "tracks": [{ "id": "uuid", "name": "Bảng A" }],
  "rankings": ["LiveScoreEntry[]"],
  "scoresLocked": false,
  "resultsPublished": false,
  "leaderboardPublic": false,
  "canManageLeaderboard": true,
  "maxScore": 100
}
```

### 3.4 RankingResponse

```json
{
  "id": "uuid",
  "teamId": "uuid",
  "teamName": "Team Alpha",
  "roundId": "uuid",
  "roundName": "Chung kết",
  "trackId": "uuid",
  "trackName": "Bảng A",
  "finalScore": 92.5,
  "rank": 1,
  "version": 3,
  "calculatedAt": "2026-04-12T17:00:00"
}
```

### 3.5 FinalistResponse

```json
{
  "id": "uuid",
  "eventId": "uuid",
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
```

`selectionMethod`: `TOP_PER_TRACK` | `OVERFLOW_FILL` | `PENALTY_PENDING`

### 3.6 ContestedSlotResponse

```json
{
  "id": "uuid",
  "trackId": "uuid",
  "trackName": "Bảng B",
  "slotType": "PER_TRACK_CUTOFF",
  "slotIndex": 2,
  "needsPenaltyEvaluation": true,
  "teams": [
    {
      "teamId": "uuid",
      "teamName": "Team Beta",
      "finalScore": 85.5,
      "submittedAt": "2026-04-12T13:45:00"
    },
    {
      "teamId": "uuid",
      "teamName": "Team Gamma",
      "finalScore": 85.5,
      "submittedAt": "2026-04-12T13:45:00"
    }
  ]
}
```

`slotType`: `PER_TRACK_CUTOFF` | `OVERFLOW_FILL`

### 3.7 FinalistSelectResultResponse

```json
{
  "finalists": ["FinalistResponse[]"],
  "contestedSlots": ["ContestedSlotResponse[]"],
  "summary": {
    "selectedCount": 5,
    "targetCount": 6,
    "penaltyEvaluationRequired": true
  }
}
```

### 3.8 TeamAwardResponse

```json
{
  "id": "uuid",
  "eventId": "uuid",
  "teamId": "uuid",
  "teamName": "Team Alpha",
  "prizeId": "uuid",
  "prizeRank": "FIRST",
  "prizeLabel": "Giải Nhất",
  "prizeValue": "7000000",
  "awardedAt": "2026-04-12T17:00:00"
}
```

`prizeRank`: `FIRST` | `SECOND` | `THIRD` | `CONSOLATION`

### 3.9 ParticipationCertificateResponse

```json
{
  "id": "uuid",
  "eventId": "uuid",
  "userId": "uuid",
  "teamId": "uuid",
  "userFullName": "Nguyen Van A",
  "teamName": "Team Alpha",
  "issuedAt": "2026-04-12T17:00:00"
}
```

### 3.10 ParticipationCertificateSummaryResponse

```json
{
  "eventId": "uuid",
  "issuedCount": 42
}
```

### 3.11 AwardAssignmentResultResponse

```json
{
  "teamAwards": ["TeamAwardResponse[]"],
  "participationCertificatesIssued": 42,
  "participationCertificates": ["ParticipationCertificateResponse[]"]
}
```

### 3.12 RankingEvent (WebSocket)

```json
{
  "type": "RANK_CHANGED",
  "eventId": "uuid",
  "roundId": "uuid",
  "teamId": "uuid",
  "teamName": "Team Alpha",
  "newRank": 1,
  "oldRank": 2,
  "timestamp": "2026-04-12T15:30:00"
}
```

`type`: `LEADERBOARD_UPDATED` | `RANK_CHANGED` | `NEW_LEADER` | `FINAL_RESULTS_PUBLISHED`

---

## 4. Endpoint details

### 4.1 GET `/api/events/{eventId}/leaderboard`

**Auth:** `permitAll` at HTTP layer; service enforces publish/public rules for students

**Path params:** `eventId` (UUID, required)

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `trackId` | UUID | no | Filter teams; per-track re-rank when `roundType=PRELIMINARY` |
| `roundId` | UUID | no | Explicit round (overrides `roundType`) |
| `roundType` | `PRELIMINARY` \| `FINAL` | no | Resolve round by type |

**Request body:** None

**Response 200:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "eventId": "e1111111-1111-1111-1111-111111111111",
    "eventName": "SEAL Spring 2026",
    "season": "SPRING",
    "year": 2026,
    "roundId": "r1111111-1111-1111-1111-111111111111",
    "roundName": "Vòng bảng",
    "roundType": "PRELIMINARY",
    "tracks": [{ "id": "t1111111-1111-1111-1111-111111111111", "name": "Bảng A" }],
    "rankings": [
      {
        "teamId": "tm111111-1111-1111-1111-111111111111",
        "teamName": "Team Alpha",
        "trackName": "Bảng A",
        "trackId": "t1111111-1111-1111-1111-111111111111",
        "finalScore": 87.5,
        "rank": 1,
        "previousRank": 2,
        "scoreStatus": "FULLY_SCORED",
        "judgesScored": 3,
        "judgesAssigned": 3,
        "calculatedAt": "2026-04-12T15:30:00"
      }
    ],
    "scoresLocked": false,
    "resultsPublished": false,
    "leaderboardPublic": false,
    "canManageLeaderboard": true,
    "maxScore": 100
  }
}
```

---

### 4.2 POST `/api/events/{eventId}/leaderboard/lock`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Query params:** `roundId` (UUID, required)

**Request body:** None

**Response 200:**

```json
{
  "success": true,
  "message": "Scores locked",
  "data": { "/* LiveScoreBoard with scoresLocked: true */" }
}
```

---

### 4.3 POST `/api/events/{eventId}/leaderboard/publish`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Query params:** `roundId` (UUID, required)

**Request body:** None

Publishes results for one round, runs advancement determination, sets 24h dispute window.

**Response 200:**

```json
{
  "success": true,
  "message": "Results published",
  "data": { "/* LiveScoreBoard with resultsPublished: true */" }
}
```

**Errors:** `409` already published · `400` no rankings to publish

---

### 4.4 POST `/api/events/{eventId}/leaderboard/public`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Query params:** `enabled` (boolean, required)

**Request body:** None

**Response 200:**

```json
{
  "success": true,
  "message": "Public leaderboard enabled",
  "data": { "/* LiveScoreBoard with leaderboardPublic updated */" }
}
```

---

### 4.5 POST `/api/rounds/{roundId}/rankings/recalculate`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Path params:** `roundId` (UUID, required)

**Request body:** None

**Response 200:**

```json
{
  "success": true,
  "message": "Rankings recalculated",
  "data": [
    {
      "id": "uuid",
      "teamId": "uuid",
      "teamName": "Team Alpha",
      "roundId": "uuid",
      "roundName": "Vòng bảng",
      "trackId": "uuid",
      "trackName": "Bảng A",
      "finalScore": 87.5,
      "rank": 1,
      "version": 4,
      "calculatedAt": "2026-04-12T15:30:00"
    }
  ]
}
```

---

### 4.6 POST `/api/events/{eventId}/finalists/select`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Path params:** `eventId` (UUID, required)

**Request body:** None

**Business rules:** Top 2 per track → 6 finalists; overflow fill; contested slots on ties.

**Response 200:**

```json
{
  "success": true,
  "message": "Finalists selected",
  "data": {
    "finalists": [
      {
        "id": "uuid",
        "eventId": "uuid",
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

**Errors:** `400` no preliminary round · `400` rankings not calculated · `400` invalid event status

---

### 4.7 GET `/api/events/{eventId}/finalists`

**Auth:** Authenticated

**Path params:** `eventId` (UUID, required)

**Request body:** None

**Response 200:**

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "eventId": "uuid",
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
  ]
}
```

---

### 4.8 GET `/api/events/{eventId}/finalists/contested`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Path params:** `eventId` (UUID, required)

**Request body:** None

**Response 200:**

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "trackId": "uuid",
      "trackName": "Bảng B",
      "slotType": "PER_TRACK_CUTOFF",
      "slotIndex": 2,
      "needsPenaltyEvaluation": true,
      "teams": [
        {
          "teamId": "uuid",
          "teamName": "Team Beta",
          "finalScore": 85.5,
          "submittedAt": "2026-04-12T13:45:00"
        },
        {
          "teamId": "uuid",
          "teamName": "Team Gamma",
          "finalScore": 85.5,
          "submittedAt": "2026-04-12T13:45:00"
        }
      ]
    }
  ]
}
```

---

### 4.9 POST `/api/events/{eventId}/awards/assign`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Path params:** `eventId` (UUID, required)

**Request body:** None

Assigns top-4 final rankings to prizes and issues participation certificates.

**Response 200:**

```json
{
  "success": true,
  "message": "Awards assigned",
  "data": {
    "teamAwards": [
      {
        "id": "a1111111-1111-1111-1111-111111111111",
        "eventId": "e1111111-1111-1111-1111-111111111111",
        "teamId": "t1111111-1111-1111-1111-111111111111",
        "teamName": "Team Alpha",
        "prizeId": "p1111111-1111-1111-1111-111111111111",
        "prizeRank": "FIRST",
        "prizeLabel": "Giải Nhất",
        "prizeValue": "7000000",
        "awardedAt": "2026-04-12T17:00:00"
      }
    ],
    "participationCertificatesIssued": 42,
    "participationCertificates": [
      {
        "id": "c1111111-1111-1111-1111-111111111111",
        "eventId": "e1111111-1111-1111-1111-111111111111",
        "userId": "u1111111-1111-1111-1111-111111111111",
        "teamId": "t1111111-1111-1111-1111-111111111111",
        "userFullName": "Nguyen Van A",
        "teamName": "Team Alpha",
        "issuedAt": "2026-04-12T17:00:00"
      }
    ]
  }
}
```

**Errors:** `400` final rankings not calculated · `404` event not found

---

### 4.10 GET `/api/events/{eventId}/awards`

**Auth:** Authenticated

**Path params:** `eventId` (UUID, required)

**Request body:** None

**Response 200:**

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "eventId": "uuid",
      "teamId": "uuid",
      "teamName": "Team Alpha",
      "prizeId": "uuid",
      "prizeRank": "FIRST",
      "prizeLabel": "Giải Nhất",
      "prizeValue": "7000000",
      "awardedAt": "2026-04-12T17:00:00"
    }
  ]
}
```

---

### 4.11 GET `/api/public/events/{eventId}/awards`

**Auth:** None (public)

**Path params:** `eventId` (UUID, required)

**Request body:** None

**Response 200:** Same shape as §4.10 (`TeamAwardResponse[]` in `data`).

---

### 4.12 GET `/api/events/{eventId}/awards/participation/me`

**Auth:** Authenticated (current user)

**Path params:** `eventId` (UUID, required)

**Request body:** None

**Response 200:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "uuid",
    "eventId": "uuid",
    "userId": "uuid",
    "teamId": "uuid",
    "userFullName": "Nguyen Van A",
    "teamName": "Team Alpha",
    "issuedAt": "2026-04-12T17:00:00"
  }
}
```

**Response 404:** Certificate not issued for this user/event.

---

### 4.13 GET `/api/public/events/{eventId}/awards/participation`

**Auth:** None (public)

**Path params:** `eventId` (UUID, required)

**Request body:** None

**Response 200:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "eventId": "e1111111-1111-1111-1111-111111111111",
    "issuedCount": 42
  }
}
```

---

## 5. Coordinator publish flow (end-to-end)

```text
PRELIMINARY:
  POST /rounds/{roundId}/rankings/recalculate
  POST /events/{eventId}/leaderboard/lock?roundId={roundId}
  POST /events/{eventId}/finalists/select
  POST /events/{eventId}/leaderboard/publish?roundId={roundId}
  POST /events/{eventId}/leaderboard/public?enabled=true|false

FINAL:
  POST /rounds/{roundId}/rankings/recalculate
  POST /events/{eventId}/leaderboard/lock?roundId={roundId}
  POST /events/{eventId}/leaderboard/publish?roundId={roundId}
  POST /events/{eventId}/awards/assign
```

---

## 6. Student results page

```text
GET /public/events/{eventId}/awards              → prize board
GET /public/events/{eventId}/awards/participation → issued count
GET /events/{eventId}/awards/participation/me   → own certificate (auth)
```

Route: `/student/results` · Legacy `/student/awards` redirects here.

---

## 7. Prize configuration (SEAL Spring 2026)

| Rank position | Label (UI preview) | Value (VND) |
|---|---|---:|
| 1 | First Place / Giải Nhất | 7,000,000 |
| 2 | Second Place / Giải Nhì | 5,000,000 |
| 3 | Third Place / Giải Ba | 3,000,000 |
| 4 | Encouragement / Khuyến khích | 1,500,000 |

Prizes are seeded on event creation (`competitionFormat = SEAL_RAG_2026`). `POST /awards/assign` maps final-round ranks 1–4 to `FIRST` → `CONSOLATION`.
