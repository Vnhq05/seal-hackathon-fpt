# SEAL Hackathon Spring 2026 — API Changes

> Generated from backend implementation. Base URL: `/api`

---

## Phase 0: Schema & Enums

New enums exposed in responses:
- `CompetitionFormat`: `GENERIC` | `SEAL_RAG_2026`
- `RoundType`: `PRELIMINARY` | `FINAL`
- `EventStatus` (extended): `CLOSED_REGISTRATION`, `SCORING`

**Migration:** [`backend/src/main/resources/db/seal_spring_2026_migration.sql`](../backend/src/main/resources/db/seal_spring_2026_migration.sql)

---

## Phase 1: Create SEAL Event

### POST /api/events

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Request Body (SEAL format):**
```json
{
  "name": "SEAL Hackathon Spring 2026",
  "season": "SPRING",
  "year": 2026,
  "startDate": "2026-04-12",
  "endDate": "2026-04-12",
  "registrationDeadline": "2026-03-25",
  "registrationOpenDate": "2026-03-15",
  "competitionFormat": "SEAL_RAG_2026",
  "description": "Mastering Domain-Specific AI RAG Systems",
  "location": "FPT HCM"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "SEAL Hackathon Spring 2026",
    "competitionFormat": "SEAL_RAG_2026",
    "status": "UPCOMING",
    "trackCount": 3,
    "roundCount": 2,
    "tracks": [
      {
        "id": "uuid",
        "name": "Bảng A",
        "topic": "Domain-Specific RAG for Healthcare",
        "maxTeams": 8
      }
    ],
    "prizes": [
      { "rank": "FIRST", "value": "7000000", "label": "Giải Nhất" }
    ]
  }
}
```

**Business Rules:** Auto-seeds 3 tracks (max 8 teams), 2 rounds (PRELIMINARY 40%, FINAL 60%), rubrics, prizes.

---

## Phase 2: Track Assignment

### POST /api/events/{eventId}/tracks/assign

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Request Body:**
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
    {
      "teamId": "uuid",
      "trackId": "uuid",
      "trackName": "Bảng A",
      "method": "MANUAL"
    }
  ]
}
```

**Errors:** 409 if track full (max 8 teams)

---

### POST /api/events/{eventId}/tracks/draw

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Request Body:**
```json
{ "method": "RANDOM" }
```

**Response 200:**
```json
{
  "success": true,
  "message": "Track draw completed",
  "data": {
    "assignments": [
      {
        "teamId": "uuid",
        "trackId": "uuid",
        "trackName": "Bảng B",
        "method": "RANDOM"
      }
    ],
    "unassignedCount": 0
  }
}
```

---

## Phase 3: Finalist Selection

### POST /api/events/{eventId}/finalists/select

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Response 200:**
```json
{
  "success": true,
  "message": "Finalists selected",
  "data": [
    {
      "id": "uuid",
      "eventId": "uuid",
      "teamId": "uuid",
      "teamName": "Team Alpha",
      "trackId": "uuid",
      "trackName": "Bảng A",
      "preliminaryRank": 1,
      "selectedReason": "SEAL Top-2-per-track selection",
      "selectedAt": "2026-04-12T15:30:00"
    }
  ]
}
```

**Business Rules:** Top 2 per track → 6 teams; tie-break by earlier submission.

---

### GET /api/events/{eventId}/finalists

**Auth:** Authenticated

**Response 200:** Same array as above in `data`.

---

## Phase 4: Submission Updates

### POST /api/rounds/{roundId}/submissions

**Auth:** Team leader

**Request (multipart/form-data):**
| Field | Type | Required |
|---|---|---|
| `sourceCodeUrl` | string | Yes (or `githubUrl`) |
| `slideUrl` | string | Recommended |
| `demoUrl` | string | Yes |
| `pdfFile` | file | Optional |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "teamId": "uuid",
    "roundId": "uuid",
    "latestVersion": {
      "githubUrl": "https://github.com/org/repo",
      "sourceCodeUrl": "https://github.com/org/repo",
      "slideUrl": "https://docs.google.com/presentation/...",
      "demoUrl": "https://youtube.com/watch?v=..."
    }
  }
}
```

**Errors:**
- 403: Not finalist (FINAL round)
- 403: Leader-only
- 400: Google Drive blocked for source code

---

## Phase 5: Leaderboard by Track/Round

### GET /api/events/{eventId}/leaderboard

**Query params:**
| Param | Description |
|---|---|
| `trackId` | Filter by track |
| `roundId` | Specific round |
| `roundType` | `PRELIMINARY` or `FINAL` |

**Example:** `GET /api/events/{eventId}/leaderboard?roundType=PRELIMINARY&trackId={trackId}`

**Response 200:** Existing `LiveScoreBoard` shape with filtered rankings.

---

## Phase 6: Awards

### POST /api/events/{eventId}/awards/assign

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Response 200:**
```json
{
  "success": true,
  "message": "Awards assigned",
  "data": [
    {
      "id": "uuid",
      "teamId": "uuid",
      "teamName": "Team Alpha",
      "prizeRank": "FIRST",
      "prizeLabel": "Giải Nhất",
      "prizeValue": "7000000",
      "awardedAt": "2026-04-12T18:00:00"
    }
  ]
}
```

---

### GET /api/events/{eventId}/awards

### GET /api/public/events/{eventId}/awards

**Response 200:** Same `data` array as assign response.

---

## Modified Endpoints Summary

| Method | Path | Change |
|---|---|---|
| POST | `/api/events` | + `competitionFormat` field |
| GET | `/api/events/{id}` | Response + `competitionFormat`, tracks + `topic`, rounds + `roundType` |
| PUT | `/api/events/{eventId}/teams/{teamId}/track` | Blocked for leaders on SEAL format |
| GET | `/api/events/{eventId}/leaderboard` | + `roundType` query param |
| POST | `/api/rounds/{roundId}/submissions` | + `slideUrl`, `sourceCodeUrl` |
