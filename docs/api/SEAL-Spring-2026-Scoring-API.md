# SEAL Spring 2026 — Scoring & Deviation Review API

> Ref: `File_nghiệp_vụ_lệch.md` **§10**, **§11**  
> Base URL: `/api` · Auth: Bearer JWT (unless noted)  
> Related: [`SEAL-Spring-2026-Scoring-Rubric-API.md`](./SEAL-Spring-2026-Scoring-Rubric-API.md) · [`SEAL-Spring-2026-API-Reference.md`](./SEAL-Spring-2026-API-Reference.md)

---

## 1. Tổng quan

| Luồng | Mô tả |
|---|---|
| Judge scoring | Judge chỉ thấy/chấm team được `TeamJudgeAssignment`; mentor conflict bị chặn |
| Submission ACL | `GET submissions/team/{teamId}` yêu cầu judge được assign (LECTURER) |
| Deviation review | Khi tất cả judge hoàn tất → nếu spread ≥ 25 (thang 0–100) → tạo `ScoreReviewRequest` |

**Công thức deviation:**

```text
weighted_i  = Σ (criterionScore × weight / 100)     // max ≈ 5.0
percent_i   = weighted_i × 20                       // thang 0–100
deviation   = max(percent_i) − min(percent_i)
```

**Ngưỡng:** `deviation ≥ 25` → status `OPEN`.

---

## 2. §10 — Judge scoring flow

### 2.1 GET `/api/judging/my-assignments`

**Auth:** `LECTURER`

**Response:** `ApiResponse<JudgeScoringAssignmentResponse[]>`

```json
{
  "success": true,
  "data": [
    {
      "teamId": "uuid",
      "teamName": "Team Alpha",
      "roundId": "uuid",
      "roundName": "Vòng bảng",
      "eventId": "uuid",
      "eventName": "SEAL Spring 2026",
      "trackId": "uuid",
      "trackName": "Track A",
      "submissionId": "uuid",
      "scoringStatus": "NOT_STARTED",
      "scoringDeadline": "2026-04-12T18:00:00",
      "conflictOfInterest": false,
      "conflictReason": null,
      "hasOpenScoreReview": false
    }
  ]
}
```

| Field | Mô tả |
|---|---|
| `scoringStatus` | `NOT_STARTED` \| `IN_PROGRESS` \| `COMPLETED` \| `LOCKED` |
| `conflictOfInterest` | `true` nếu judge là mentor của team |
| `conflictReason` | `"MENTOR_OF_TEAM"` khi conflict |
| `hasOpenScoreReview` | `true` nếu submission có flag deviation đang OPEN |

**Frontend:** `judgingApi.getMyAssignments()` → `useJudgeScoringAssignments`

---

### 2.2 GET `/api/rounds/{roundId}/submissions/team/{teamId}`

**Auth:** Authenticated — **LECTURER** phải có `TeamJudgeAssignment` cho team+round

**Response:** `ApiResponse<SubmissionResponse>`

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
      "sourceCodeUrl": "https://github.com/...",
      "githubUrl": "https://github.com/...",
      "slideUrl": null,
      "demoUrl": "https://youtube.com/...",
      "submittedAt": "2026-04-12T10:00:00",
      "attachments": []
    },
    "createdAt": "2026-04-12T10:00:00"
  }
}
```

**Errors:**

| Status | Khi |
|---|---|
| `403` | LECTURER không được assign team này |
| `404` | Team chưa nộp bài |

**Thay đổi (§10):** Thêm ACL — trước đây endpoint không kiểm tra assignment.

**Frontend:** `submissionApi.getByTeam(roundId, teamId)` → `useSubmissionScoring`

---

### 2.3 GET `/api/rounds/{roundId}/submissions/{submissionId}`

**Auth:** Authenticated — cùng ACL như §2.2 (theo team của submission)

**Response:** Giống §2.2.

---

### 2.4 GET `/api/rounds/{roundId}/scoring/my/submission/{submissionId}`

**Auth:** `LECTURER` (score của chính judge)

**Response:** `ApiResponse<JudgeScoreResponse>`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "judgeUserId": "uuid",
    "judgeFullName": "Nguyen Van A",
    "submissionId": "uuid",
    "roundId": "uuid",
    "status": "IN_PROGRESS",
    "startedAt": "2026-04-12T14:00:00",
    "completedAt": null,
    "details": [
      {
        "id": "uuid",
        "criteriaId": "uuid",
        "criteriaName": "Tính chính xác và phù hợp với Domain",
        "score": 4
      }
    ],
    "comments": [
      {
        "id": "uuid",
        "criteriaId": "uuid",
        "criteriaName": "Tính chính xác và phù hợp với Domain",
        "comment": "Good domain fit"
      }
    ]
  }
}
```

**Frontend:** `judgingApi.getMyScoreForSubmission(roundId, submissionId)`

---

### 2.5 POST `/api/rounds/{roundId}/scoring`

**Auth:** `LECTURER` — phải assigned + không conflict mentor

**Request body:**

```json
{
  "submissionId": "uuid",
  "complete": true,
  "scores": [
    {
      "criteriaId": "uuid",
      "score": 4,
      "comment": "Optional except at min/max"
    }
  ]
}
```

| Field | Bắt buộc | Mô tả |
|---|---|---|
| `submissionId` | Yes | Submission cần chấm |
| `complete` | No (default `true`) | `false` → lưu nháp `IN_PROGRESS` |
| `scores[].criteriaId` | Yes | ID tiêu chí thuộc round |
| `scores[].score` | Yes | Trong `[minScore, maxScore]` của criterion |
| `scores[].comment` | Conditional | Bắt buộc khi score = min hoặc max |

**Response:** `201` · `ApiResponse<JudgeScoreResponse>`

**Errors:**

| Status | Khi |
|---|---|
| `403` | Không assigned hoặc mentor conflict |
| `400` | Thiếu criteria, score ngoài range, thiếu comment ở cực trị |

**Frontend:** `judgingApi.submitScore()` → `useSubmitScores` / `useSaveScoringDraft`

---

### 2.6 PUT `/api/rounds/{roundId}/scoring/{judgeScoreId}`

**Auth:** `LECTURER` — chỉ score của chính judge, trước deadline, không `LOCKED`

**Request / Response:** Giống §2.5.

**Frontend:** `judgingApi.updateScore()`

---

## 3. §11 — Score deviation review

> **Full spec:** [`SEAL-Spring-2026-Score-Review-API.md`](./SEAL-Spring-2026-Score-Review-API.md)

Các endpoint list / detail / resolve và auto-create trigger được mô tả đầy đủ (request body + response) trong file trên.

---

## 4. Frontend wiring

| UI | Hook / API | Endpoint |
|---|---|---|
| Danh sách chấm điểm | `useJudgeScoringAssignments` | `GET /judging/my-assignments` |
| Form chấm điểm | `useSubmissionScoring` | `GET submissions/team/{id}` + assignments + criteria + my score |
| Chặn conflict | `ScoringPage` | `conflictOfInterest` từ assignment |
| Gửi điểm | `useSubmitScores` | `POST/PUT /rounds/{rid}/scoring` |
| Round submissions | `useRoundSubmissions` | assignments filtered (không list toàn round) |
| Coordinator review | `JudgeVariancePage` | `GET/PATCH /events/{eid}/score-reviews` |
| Judge read-only flag | `JudgeScoringListPage` | `hasOpenScoreReview`, `openScoreReviewId` |

**Route admin:** `/admin/analytics/variance`

---

## 5. Ghi chú ngoài phạm vi

- **BR-37** (timer 2 giờ / submission): field `startedAt` có trên `JudgeScore` nhưng chưa enforce server-side.
- `trackId` / `roundType` **không** cần trong score payload — implicit qua `roundId` và rubric criteria.
