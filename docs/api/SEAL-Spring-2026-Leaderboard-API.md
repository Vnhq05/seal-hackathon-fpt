# SEAL Spring 2026 — Leaderboard API

> Ref: `File_nghiệp_vụ_lệch.md` **§12**  
> Base URL: `/api` · Auth: Bearer JWT (unless noted)  
> Related: [`SEAL-Spring-2026-API.md`](./SEAL-Spring-2026-API.md) · [`SEAL-Spring-2026-Rounds-Finalists-API.md`](./SEAL-Spring-2026-Rounds-Finalists-API.md)

---

## 1. Business rules (SEAL)

| View | Scope | Filter |
|---|---|---|
| Preliminary leaderboard | Per track | `roundType=PRELIMINARY` + optional `trackId` |
| Final leaderboard | Overall (Top 6 finalists) | `roundType=FINAL` |
| Public access | Student / anonymous | Only when `resultsPublished=true` **or** `event.leaderboardPublic=true` |
| Advancement status | After publish | `ADVANCED` → finalist, `ELIMINATED` → eliminated |

**Per-track rank semantics:** Stored rankings are global within a round. When `trackId` is provided and the round is `PRELIMINARY`, the API re-ranks teams **within that track** (rank 1..N) before returning.

---

## 2. Shared types

### RankingResponse

```json
{
  "id": "uuid",
  "teamId": "uuid",
  "teamName": "Team Alpha",
  "roundId": "uuid",
  "roundName": "Vòng bảng",
  "trackId": "uuid",
  "trackName": "Bảng A",
  "finalScore": 87.5000,
  "rank": 1,
  "version": 3,
  "calculatedAt": "2026-04-12T15:30:00"
}
```

### AdvancementResponse

```json
{
  "id": "uuid",
  "teamId": "uuid",
  "teamName": "Team Alpha",
  "roundId": "uuid",
  "status": "ADVANCED",
  "rank": 1,
  "finalScore": 87.5000
}
```

| `status` | Meaning |
|---|---|
| `ADVANCED` | Finalist (SEAL: Top 2 per track after preliminary) |
| `ELIMINATED` | Did not advance |

### PublishedResultResponse

```json
{
  "id": "uuid",
  "roundId": "uuid",
  "publishedBy": "uuid",
  "publishedAt": "2026-04-12T15:35:00",
  "disputeDeadline": "2026-04-13T15:35:00",
  "rankings": [ "RankingResponse[]" ],
  "advancements": [ "AdvancementResponse[]" ]
}
```

### EventRankingBoard

```json
{
  "eventId": "uuid",
  "eventName": "SEAL Spring 2026",
  "season": "SPRING",
  "year": 2026,
  "roundId": "uuid",
  "roundName": "Vòng bảng",
  "roundType": "PRELIMINARY",
  "tracks": [
    {
      "id": "uuid",
      "eventId": "uuid",
      "name": "Bảng A",
      "description": null,
      "maxTeams": 8,
      "scoringTemplateId": "uuid"
    }
  ],
  "rankings": [ "RankingResponse[]" ]
}
```

### LiveScoreBoard

```json
{
  "eventId": "uuid",
  "eventName": "SEAL Spring 2026",
  "season": "SPRING",
  "year": 2026,
  "roundId": "uuid",
  "roundName": "Vòng bảng",
  "roundType": "PRELIMINARY",
  "tracks": [
    { "id": "uuid", "name": "Bảng A" }
  ],
  "rankings": [
    {
      "teamId": "uuid",
      "teamName": "Team Alpha",
      "trackName": "Bảng A",
      "trackId": "uuid",
      "finalScore": 87.5000,
      "rank": 1,
      "previousRank": 2,
      "scoreStatus": "PUBLISHED",
      "judgesScored": 3,
      "judgesAssigned": 3,
      "calculatedAt": "2026-04-12T15:30:00"
    }
  ],
  "scoresLocked": true,
  "resultsPublished": true,
  "leaderboardPublic": false,
  "canManageLeaderboard": false
}
```

---

## 3. Season rankings (student main page)

### GET `/api/ranking`

**Auth:** Bearer JWT  
**Role access:**
- `SYSTEM_ADMIN`, `EVENT_COORDINATOR`: all active/completed events with rankings
- Students / others: only boards where selected round is published **or** `leaderboardPublic=true`

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `season` | string | no | e.g. `SPRING` |
| `year` | integer | no | e.g. `2026` |
| `trackId` | UUID | no | Filter teams in one track; re-ranks within track when `roundType=PRELIMINARY` |
| `roundType` | `PRELIMINARY` \| `FINAL` | no | Select round by type; default = latest `roundNumber` |

**Example:**

```http
GET /api/ranking?season=SPRING&year=2026&roundType=PRELIMINARY&trackId={trackId}
Authorization: Bearer {token}
```

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "eventId": "uuid",
      "eventName": "SEAL Spring 2026",
      "season": "SPRING",
      "year": 2026,
      "roundId": "uuid",
      "roundName": "Vòng bảng",
      "roundType": "PRELIMINARY",
      "tracks": [ { "id": "uuid", "name": "Bảng A", "maxTeams": 8, "eventId": "uuid" } ],
      "rankings": [
        {
          "id": "uuid",
          "teamId": "uuid",
          "teamName": "Team Alpha",
          "roundId": "uuid",
          "roundName": "Vòng bảng",
          "trackId": "uuid",
          "trackName": "Bảng A",
          "finalScore": 87.5000,
          "rank": 1,
          "version": 3,
          "calculatedAt": "2026-04-12T15:30:00"
        }
      ]
    }
  ]
}
```

**Errors:** Empty `data[]` when no published rankings match filters (not an error).

**Frontend:** `rankingApi.getSeasonRankings()` → `/ranking` page

---

## 4. Round-scoped rankings

### GET `/api/rounds/{roundId}/rankings`

**Auth:** Bearer JWT

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `trackId` | UUID | no | Filter by team track; re-ranks within track for `PRELIMINARY` rounds |

**Response 200:**

```json
{
  "success": true,
  "data": [ "RankingResponse[]" ]
}
```

---

### GET `/api/rounds/{roundId}/rankings/team/{teamId}`

**Auth:** Bearer JWT

**Response 200:** `ApiResponse<RankingResponse>`

---

### GET `/api/rounds/{roundId}/rankings/advancements`

**Auth:** Bearer JWT  
**Used for:** finalist / eliminated status badges after publish

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "teamId": "uuid",
      "teamName": "Team Alpha",
      "roundId": "uuid",
      "status": "ADVANCED",
      "rank": 1,
      "finalScore": 87.5000
    },
    {
      "id": "uuid",
      "teamId": "uuid",
      "teamName": "Team Beta",
      "roundId": "uuid",
      "status": "ELIMINATED",
      "rank": 5,
      "finalScore": 72.0000
    }
  ]
}
```

**Frontend:** `rankingApi.getAdvancements(roundId)`

---

### POST `/api/rounds/{roundId}/rankings/recalculate`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Response 200:**

```json
{
  "success": true,
  "message": "Rankings recalculated",
  "data": [ "RankingResponse[]" ]
}
```

---

## 5. Published results

### GET `/api/rounds/{roundId}/results`

**Auth:** Bearer JWT  
**Requires:** Round results previously published via `POST .../leaderboard/publish`

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "roundId": "uuid",
    "publishedBy": "uuid",
    "publishedAt": "2026-04-12T15:35:00",
    "disputeDeadline": "2026-04-13T15:35:00",
    "rankings": [ "RankingResponse[]" ],
    "advancements": [ "AdvancementResponse[]" ]
  }
}
```

**Errors:**
- `404` — Results not published for this round

**Frontend:** `rankingApi.getPublishedResults(roundId)`

---

## 6. Event live leaderboard

### GET `/api/events/{eventId}/leaderboard`

**Auth:** `permitAll` at HTTP layer; service enforces publish/public rules for students

**Query params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `trackId` | UUID | no | Filter teams; per-track re-rank when round is `PRELIMINARY` |
| `roundId` | UUID | no | Explicit round (overrides `roundType`) |
| `roundType` | `PRELIMINARY` \| `FINAL` | no | Resolve round by type; default = last round |

**Example:**

```http
GET /api/events/{eventId}/leaderboard?roundType=PRELIMINARY&trackId={trackId}
```

**Response 200:** `ApiResponse<LiveScoreBoard>` (see §2)

**Access rules (students):**
- Allowed if `resultsPublished=true` for the resolved round **or** `leaderboardPublic=true`
- Judges blocked during active scoring window

**Frontend:** `livescoreApi.getLeaderboard(eventId, { trackId, roundId, roundType })`

---

### POST `/api/events/{eventId}/leaderboard/lock?roundId={uuid}`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Response 200:**

```json
{
  "success": true,
  "message": "Scores locked",
  "data": "LiveScoreBoard"
}
```

---

### POST `/api/events/{eventId}/leaderboard/publish?roundId={uuid}`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

Publishes results for one round, runs advancement determination, sets 24h dispute window.

**Response 200:**

```json
{
  "success": true,
  "message": "Results published",
  "data": "LiveScoreBoard"
}
```

**Errors:**
- `409` — Already published
- `400` — No rankings to publish

---

### POST `/api/events/{eventId}/leaderboard/public?enabled={true|false}`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

Enables/disables live leaderboard visibility before publish.

**Response 200:**

```json
{
  "success": true,
  "message": "Public leaderboard enabled",
  "data": "LiveScoreBoard"
}
```

---

## 7. Awards (post-final)

> Cross-link only — see [`SEAL-Spring-2026-API.md`](./SEAL-Spring-2026-API.md) Phase 6

| Method | Path | Auth |
|---|---|---|
| POST | `/api/events/{eventId}/awards/assign` | ADMIN / COORD |
| GET | `/api/events/{eventId}/awards` | Authenticated |
| GET | `/api/public/events/{eventId}/awards` | Public |

---

## 8. Frontend integration summary

| Endpoint | Client method | UI |
|---|---|---|
| `GET /ranking` | `rankingApi.getSeasonRankings()` | `/ranking` — filters: season, year, roundType, trackId |
| `GET /rounds/{id}/rankings/advancements` | `rankingApi.getAdvancements()` | Status badges (finalist / eliminated) |
| `GET /events/{id}/leaderboard` | `livescoreApi.getLeaderboard()` | LiveScore Arena (admin/coordinator) |
| `GET /rounds/{id}/results` | `rankingApi.getPublishedResults()` | Available; not wired on main ranking page |

---

## 9. Changelog (this sprint)

| Change | Detail |
|---|---|
| **GET `/api/ranking`** | Added `roundType` query param; response includes `roundType`; publish gate for students; per-track re-rank |
| **GET `/api/rounds/{roundId}/rankings`** | Added optional `trackId` query param with per-track re-rank |
| **GET `/api/events/{eventId}/leaderboard`** | Per-track re-rank when `trackId` + `PRELIMINARY`; response includes `roundType` |
| **Frontend types** | `LeaderboardTeam.roundScores[]` replaces hard-coded R1/R2; status = active \| finalist \| eliminated |
