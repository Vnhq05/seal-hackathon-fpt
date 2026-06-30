# SEAL Spring 2026 — Judge Portal API Endpoints

> Base URL: `/api`  
> Auth: `Authorization: Bearer <JWT>` (unless noted)  
> Response envelope: `ApiResponse<T>` — `{ success, message?, data }`  
> TypeScript source of truth: `frontend/src/lib/api/judging.api.ts`, `submission.api.ts`, `criteria.api.ts`, `frontend/src/features/judging/types/judge.types.ts`  
> Related: [`SEAL-Spring-2026-Scoring-API.md`](./SEAL-Spring-2026-Scoring-API.md)

This document lists every API endpoint called by the Judge Portal scoring flow (dashboard, round list, scoring form, score history). **No new endpoints were added** for the Judge Scoring UX work — this is a frontend-facing reference aligned with existing types.

---

## Auth header

All endpoints below require a valid JWT:

```http
Authorization: Bearer <access_token>
```

Role required for judge flows: **`LECTURER`**.

---

## 1. GET `/api/judging/my-assignments`

**Used by:** `judgingApi.getMyAssignments()` → `useJudgeDashboard`, `useJudgeScoringAssignments`, `useSubmissionScoring`, `useRoundSubmissions`, `useScoreHistory`

**Auth:** `LECTURER`

**Request body:** None

**Success (200):** `ApiResponse<JudgeScoringAssignment[]>`

```json
{
  "success": true,
  "data": [
    {
      "teamId": "uuid",
      "teamName": "Team Alpha",
      "roundId": "uuid",
      "roundName": "Preliminary Round",
      "eventId": "uuid",
      "eventName": "SEAL Spring 2026",
      "trackId": "uuid",
      "trackName": "Track A",
      "submissionId": "uuid",
      "scoringStatus": "NOT_STARTED",
      "scoringDeadline": "2026-04-12T15:30:00",
      "conflictOfInterest": false,
      "conflictReason": null,
      "hasOpenScoreReview": false,
      "openScoreReviewId": null
    }
  ]
}
```

| Field | Type | Notes |
|-------|------|-------|
| `scoringStatus` | `"NOT_STARTED" \| "IN_PROGRESS" \| "COMPLETED" \| "LOCKED"` | Assignment-level status |
| `conflictOfInterest` | `boolean` | `true` when judge is mentor of team |
| `conflictReason` | `string \| null` | e.g. `"MENTOR_OF_TEAM"` |
| `submissionId` | `string \| null` | `null` if team has not submitted |

**Known errors:**

| Status | When |
|--------|------|
| `401` | Missing or invalid JWT |
| `403` | User is not `LECTURER` |

---

## 2. GET `/api/judging/my-scores`

**Used by:** `judgingApi.getMyScoresHistory()` → `useScoreHistory`

**Auth:** `LECTURER`

**Request body:** None

**Success (200):** `ApiResponse<JudgeScoreResponse[]>`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "judgeUserId": "uuid",
      "judgeFullName": "Nguyen Van A",
      "submissionId": "uuid",
      "roundId": "uuid",
      "status": "COMPLETED",
      "startedAt": "2026-04-12T14:00:00",
      "completedAt": "2026-04-12T14:25:00",
      "details": [
        {
          "id": "uuid",
          "criteriaId": "uuid",
          "criteriaName": "Domain Accuracy & Relevance",
          "score": 4
        }
      ],
      "comments": [
        {
          "id": "uuid",
          "criteriaId": "uuid",
          "criteriaName": "Domain Accuracy & Relevance",
          "comment": "Strong domain fit"
        }
      ]
    }
  ]
}
```

| Field | Type | Notes |
|-------|------|-------|
| `status` | `"IN_PROGRESS" \| "COMPLETED" \| "LOCKED"` | Score record status |
| `details` | `ScoreDetailResponse[]` | Per-criterion scores |
| `comments` | `CommentResponse[]` | Per-criterion comments |

**Known errors:**

| Status | When |
|--------|------|
| `401` | Missing or invalid JWT |
| `403` | User is not `LECTURER` |

---

## 3. GET `/api/rounds/{roundId}/scoring/my`

**Used by:** `judgingApi.getMyScores(roundId)` → `useRoundSubmissions`

**Auth:** `LECTURER`

**Path params:** `roundId` — UUID of the round

**Request body:** None

**Success (200):** `ApiResponse<JudgeScoreResponse[]>` — same shape as §2 entry items, filtered to the judge's scores (implementation returns all judge scores; frontend filters by round context).

**Known errors:**

| Status | When |
|--------|------|
| `401` | Missing or invalid JWT |
| `403` | User is not `LECTURER` |

---

## 4. GET `/api/rounds/{roundId}/scoring/my/submission/{submissionId}`

**Used by:** `judgingApi.getMyScoreForSubmission(roundId, submissionId)` → `useSubmissionScoring`

**Auth:** `LECTURER`

**Path params:** `roundId`, `submissionId` — UUIDs

**Request body:** None

**Success (200):** `ApiResponse<JudgeScoreResponse>` — single object, same shape as §2.

**Known errors:**

| Status | When |
|--------|------|
| `401` | Missing or invalid JWT |
| `403` | User is not `LECTURER` |
| `404` | No score exists yet for this judge + submission (frontend treats as empty draft via `.catch(() => null)`) |

---

## 5. POST `/api/rounds/{roundId}/scoring`

**Used by:** `judgingApi.submitScore()` → `useSubmitScores`, `useSaveScoringDraft` (new score)

**Auth:** `LECTURER` — must be assigned; no mentor conflict

**Path params:** `roundId` — UUID

**Request body:** `ScoreSubmissionRequest`

```json
{
  "submissionId": "uuid",
  "complete": false,
  "scores": [
    {
      "criteriaId": "uuid",
      "score": 4,
      "comment": "Optional except at min/max"
    }
  ]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `submissionId` | `string` (UUID) | Yes | Target submission |
| `complete` | `boolean` | No (default `true`) | `false` → draft `IN_PROGRESS`; `true` → `COMPLETED` |
| `scores` | `ScoreDetailDto[]` | Yes (min 1) | Partial allowed when `complete: false` |
| `scores[].criteriaId` | `string` (UUID) | Yes | Must belong to round rubric |
| `scores[].score` | `number` | Yes | Within criterion `[minScore, maxScore]` |
| `scores[].comment` | `string` | Conditional | Required when score = min or max (scale 1–5) |

**Success (201):** `ApiResponse<JudgeScoreResponse>` with `message: "Score submitted"`

**Known errors:**

| Status | When |
|--------|------|
| `400` | Score out of range; missing criteria on complete; missing comment at extremes; scoring deadline passed; score locked |
| `401` | Missing or invalid JWT |
| `403` | Not assigned; mentor conflict |
| `409` | Concurrent score modification |

---

## 6. PUT `/api/rounds/{roundId}/scoring/{judgeScoreId}`

**Used by:** `judgingApi.updateScore()` → `useSubmitScores`, `useSaveScoringDraft` (existing score)

**Auth:** `LECTURER` — own score only; before deadline; not `LOCKED`

**Path params:** `roundId`, `judgeScoreId` — UUIDs

**Request body:** Same as §5 (`ScoreSubmissionRequest`)

**Success (200):** `ApiResponse<JudgeScoreResponse>` with `message: "Score updated"`

**Known errors:**

| Status | When |
|--------|------|
| `400` | Same validation as §5; score locked; deadline passed |
| `401` | Missing or invalid JWT |
| `403` | Not own score; not assigned; mentor conflict |
| `404` | `judgeScoreId` not found |
| `409` | Concurrent score modification |

---

## 7. GET `/api/rounds/{roundId}/submissions/team/{teamId}`

**Used by:** `submissionApi.getByTeam(roundId, teamId)` → `useSubmissionScoring`, `useRoundSubmissions`

**Auth:** Authenticated — **LECTURER** must have `TeamJudgeAssignment` for team + round

**Path params:** `roundId`, `teamId` — UUIDs

**Request body:** None

**Success (200):** `ApiResponse<SubmissionResponse>`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "teamId": "uuid",
    "roundId": "uuid",
    "status": "SUBMITTED",
    "submittedBy": "uuid",
    "currentVersion": 1,
    "totalVersions": 1,
    "latestVersion": {
      "id": "uuid",
      "versionNumber": 1,
      "sourceCodeUrl": "https://github.com/org/repo",
      "githubUrl": "https://github.com/org/repo",
      "slideUrl": "https://docs.google.com/presentation/d/...",
      "demoUrl": "https://youtube.com/watch?v=...",
      "submittedAt": "2026-04-12T10:00:00",
      "attachments": [
        {
          "id": "uuid",
          "fileName": "report.pdf",
          "fileUrl": "/api/files/submissions/...",
          "fileSize": 102400,
          "pageCount": 12
        }
      ]
    },
    "createdAt": "2026-04-12T10:00:00"
  }
}
```

**Frontend mapping (`SubmissionForScoring`):**

| UI field | Source |
|----------|--------|
| `sourceCodeUrl` | `latestVersion.sourceCodeUrl ?? latestVersion.githubUrl` |
| `slideUrl` | `latestVersion.slideUrl` |
| `demoUrl` | `latestVersion.demoUrl` |
| `pdfUrl` | First attachment `fileUrl` (resolved) |

**Known errors:**

| Status | When |
|--------|------|
| `401` | Missing or invalid JWT |
| `403` | LECTURER not assigned to this team |
| `404` | Team has not submitted for this round |

---

## 8. GET `/api/rounds/{roundId}/criteria`

**Used by:** `criteriaApi.list(roundId)` → `useSubmissionScoring`, `useRoundSubmissions`, `useScoreHistory`

**Auth:** Authenticated (read); rubric managed by admin/coordinator

**Path params:** `roundId` — UUID

**Request body:** None

**Success (200):** `ApiResponse<CriteriaResponse[]>`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Domain Accuracy & Relevance",
      "description": "Tính chính xác & Sự phù hợp với Domain",
      "weight": 20,
      "sortOrder": 1,
      "minScore": 1,
      "maxScore": 5
    }
  ]
}
```

**Frontend mapping (`ScoringCriterion`):**

| Field | Source |
|-------|--------|
| `id` | `id` |
| `name` | `name` |
| `weight` | `weight` |
| `description` | `description ?? ""` |
| `minScore` | `minScore ?? 1` |
| `maxScore` | `maxScore ?? 5` |

Criteria are **not hardcoded** in the UI — Preliminary (5×20%) and Grand Final (25/25/20/15/15) rubrics are configured via admin and loaded dynamically.

**Known errors:**

| Status | When |
|--------|------|
| `401` | Missing or invalid JWT |
| `404` | Round not found |

---

## Frontend hook → endpoint map

| UI / Hook | Endpoints called |
|-----------|------------------|
| `useJudgeDashboard` | `GET /judging/my-assignments` |
| `useJudgeScoringAssignments` | `GET /judging/my-assignments` |
| `useRoundSubmissions` | `GET /judging/my-assignments`, `GET /rounds/{id}/scoring/my`, `GET /rounds/{id}/criteria`, `GET /rounds/{id}/submissions/team/{teamId}` |
| `useSubmissionScoring` | `GET /rounds/{id}/submissions/team/{teamId}`, `GET /judging/my-assignments`, `GET /rounds/{id}/criteria`, `GET /rounds/{id}/scoring/my/submission/{submissionId}` |
| `useSubmitScores` | `POST` or `PUT /rounds/{id}/scoring[/{judgeScoreId}]` with `complete: true` |
| `useSaveScoringDraft` | `POST` or `PUT /rounds/{id}/scoring[/{judgeScoreId}]` with `complete: false` |
| `useScoreHistory` | `GET /judging/my-scores`, `GET /judging/my-assignments`, `GET /rounds/{id}/criteria` (per round) |

---

## Scoring rules (UI enforcement)

| Rule | Implementation |
|------|----------------|
| Score scale | 1–5 per criterion (`minScore`/`maxScore` from API) |
| Comment required | Score = `minScore` OR `maxScore` → comment required (`needsCommentForScore` in `scoring.schema.ts`) |
| Weighted total | `Σ (score × weight / 100)` |
| Draft auto-save | Same POST/PUT with `complete: false` every 30s when editable |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-30 | Initial Judge Portal endpoints doc for scoring UX work (no backend API changes) |
