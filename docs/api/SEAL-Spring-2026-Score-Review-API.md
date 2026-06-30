# SEAL Spring 2026 — Score Deviation Review API (§11)

> Ref: [`File_nghiệp_vụ_lệch.md`](../../File_nghiệp_vụ_lệch.md) **§11**  
> Base URL: `/api` · Auth: Bearer JWT  
> Related: [`SEAL-Spring-2026-Scoring-API.md`](./SEAL-Spring-2026-Scoring-API.md) · [`SEAL-Spring-2026-API-Reference.md`](./SEAL-Spring-2026-API-Reference.md)

---

## 1. Tổng quan

| Khái niệm | Mô tả |
|---|---|
| **ScoreReviewRequest** | Cờ do **hệ thống** tạo khi chênh lệch điểm giữa các judge vượt ngưỡng |
| **Dispute** | Khiếu nại do **team** file qua `POST /rounds/{roundId}/disputes` — khác module, khác luồng |

### Luồng nghiệp vụ

```text
1. Tất cả judge được assign hoàn tất chấm submission
2. Hệ thống tính deviation = max(percentScore) − min(percentScore) trên thang 0–100
3. Nếu deviation ≥ 25 → insert score_review_requests status OPEN
4. Coordinator xem danh sách, resolve hoặc ignore
5. Judge được assign xem chi tiết (read-only) và có thể sửa điểm qua PUT scoring (nếu còn trong scoring window)
6. Audit: SCORE_REVIEW_CREATED, SCORE_REVIEW_RESOLVED
```

### Công thức deviation

```text
weighted_i  = Σ (criterionScore × weight / 100)     // max ≈ 5.0
percent_i   = weighted_i × 20                       // thang 0–100
deviation   = max(percent_i) − min(percent_i)
```

**Ngưỡng:** `deviation ≥ 25` → tạo request `OPEN`. Một submission chỉ có tối đa một record (idempotent).

---

## 2. GET `/api/events/{eventId}/score-reviews`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Query params (optional):**

| Param | Type | Mô tả |
|---|---|---|
| `roundId` | UUID | Lọc theo round |
| `status` | `OPEN` \| `RESOLVED` \| `IGNORED` | Lọc theo trạng thái |

**Response:** `200` · `ApiResponse<ScoreReviewResponse[]>`

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "eventId": "660e8400-e29b-41d4-a716-446655440001",
      "roundId": "770e8400-e29b-41d4-a716-446655440002",
      "roundType": "PRELIMINARY",
      "teamId": "880e8400-e29b-41d4-a716-446655440003",
      "teamName": "Team Alpha",
      "submissionId": "990e8400-e29b-41d4-a716-446655440004",
      "deviationValue": 80.0,
      "minJudgeScore": 20.0,
      "maxJudgeScore": 100.0,
      "status": "OPEN",
      "createdAt": "2026-04-12T18:30:00",
      "resolvedAt": null,
      "resolutionNote": null
    }
  ]
}
```

**Frontend:** `scoreReviewApi.list(eventId, { roundId?, status? })` → `useScoreReviews`

---

## 3. GET `/api/events/{eventId}/score-reviews/{reviewId}`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`, `LECTURER` (chỉ khi judge được assign team+round của review)

**Response:** `200` · `ApiResponse<ScoreReviewResponse>` — bao gồm `judgeScores[]`

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "eventId": "660e8400-e29b-41d4-a716-446655440001",
    "roundId": "770e8400-e29b-41d4-a716-446655440002",
    "roundType": "PRELIMINARY",
    "teamId": "880e8400-e29b-41d4-a716-446655440003",
    "teamName": "Team Alpha",
    "submissionId": "990e8400-e29b-41d4-a716-446655440004",
    "deviationValue": 80.0,
    "minJudgeScore": 20.0,
    "maxJudgeScore": 100.0,
    "status": "OPEN",
    "createdAt": "2026-04-12T18:30:00",
    "resolvedAt": null,
    "resolutionNote": null,
    "judgeScores": [
      {
        "judgeUserId": "aa0e8400-e29b-41d4-a716-446655440005",
        "judgeFullName": "Judge A",
        "weightedScore": 5.0,
        "percentScore": 100.0,
        "status": "COMPLETED"
      },
      {
        "judgeUserId": "bb0e8400-e29b-41d4-a716-446655440006",
        "judgeFullName": "Judge C",
        "weightedScore": 1.0,
        "percentScore": 20.0,
        "status": "COMPLETED"
      }
    ]
  }
}
```

**Errors:**

| Status | Khi |
|---|---|
| `403` | LECTURER không được assign team/round của review |
| `404` | Review không tồn tại hoặc không thuộc event |

**Frontend:** `scoreReviewApi.getById(eventId, reviewId)` → `useScoreReviewDetail`

---

## 4. PATCH `/api/events/{eventId}/score-reviews/{reviewId}`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR` only

**Request body:**

```json
{
  "status": "RESOLVED",
  "resolutionNote": "Đã trao đổi với các judge, giữ nguyên điểm."
}
```

| Field | Bắt buộc | Giá trị |
|---|---|---|
| `status` | Yes | `RESOLVED` \| `IGNORED` |
| `resolutionNote` | No | Max 2000 ký tự |

**Response:** `200` · `ApiResponse<ScoreReviewResponse>` (full detail như §3)

```json
{
  "success": true,
  "message": "Score review updated",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "RESOLVED",
    "resolvedAt": "2026-04-12T19:00:00",
    "resolutionNote": "Đã trao đổi với các judge, giữ nguyên điểm.",
    "judgeScores": []
  }
}
```

**Errors:**

| Status | Khi |
|---|---|
| `400` | `status` không phải RESOLVED/IGNORED; review đã đóng |
| `403` | LECTURER cố resolve |

**Audit:** `SCORE_REVIEW_RESOLVED` với `resolvedBy` = coordinator/admin.

**Frontend:** `scoreReviewApi.resolve(eventId, reviewId, body)` → `useResolveScoreReview`

---

## 5. Auto-create trigger (không có HTTP endpoint)

Khi `ScoringCompletedEvent` fire (tất cả assigned judges `COMPLETED`):

1. `ScoreReviewService.evaluateSubmission(submissionId)`
2. Tính deviation trên thang 0–100
3. Nếu `≥ 25` → insert `score_review_requests` status `OPEN`
4. Publish `ScoreReviewCreatedEvent` → audit `SCORE_REVIEW_CREATED`

**Idempotent:** nếu đã có record cho `submissionId` thì bỏ qua.

---

## 6. GET `/api/judging/my-assignments` (fields liên quan §11)

**Auth:** `LECTURER`

**Response fields bổ sung:**

```json
{
  "success": true,
  "data": [
    {
      "teamId": "uuid",
      "teamName": "Team Alpha",
      "roundId": "uuid",
      "eventId": "uuid",
      "submissionId": "uuid",
      "hasOpenScoreReview": true,
      "openScoreReviewId": "550e8400-e29b-41d4-a716-446655440000"
    }
  ]
}
```

| Field | Mô tả |
|---|---|
| `hasOpenScoreReview` | `true` nếu submission có flag deviation đang `OPEN` |
| `openScoreReviewId` | ID review để judge gọi GET detail (null nếu không có flag) |

**Frontend:** `judgingApi.getMyAssignments()` → badge + `ScoreReviewReadonlyModal` trên judge scoring list.

---

## 7. Phân biệt ScoreReview vs Dispute vs Judge Adjustment

| | ScoreReviewRequest (auto) | Judge Adjustment Request | Dispute |
|---|---|---|---|
| **Ai tạo** | Hệ thống (auto) | Judge (LECTURER) | Team |
| **API module** | `/events/{id}/score-reviews` | `POST .../score-reviews/judge-request` | `/rounds/{id}/disputes` |
| **Frontend types** | `score-review.api.ts` | `JudgeScoreReviewRequest` | `ranking.api.ts` → `DisputeResponse` |
| **Trigger** | deviation ≥ 25 | Judge hoàn tất chấm, gửi note | Team file sau publish |

---

## 8. Frontend wiring

| UI | Route | Hook / API |
|---|---|---|
| Admin coordinator review | `/admin/analytics/variance` | `useScoreReviews`, `useResolveScoreReview` |
| Coordinator review | `/coordinator/score-reviews` | Cùng `JudgeVariancePage` |
| Judge read-only | Judge scoring list | `hasOpenScoreReview`, `ScoreReviewReadonlyModal` |
| Judge request adjustment | Judge scoring page (completed) | `useRequestAdjustment`, `scoreReviewApi.requestAdjustment` |

---

## 9. TypeScript types (frontend)

```typescript
export type ScoreReviewStatus = "OPEN" | "RESOLVED" | "IGNORED";

export interface ScoreReviewResponse {
  id: string;
  eventId: string;
  roundId: string;
  roundType: "PRELIMINARY" | "FINAL" | null;
  teamId: string;
  teamName: string;
  submissionId: string;
  deviationValue: number;
  minJudgeScore: number;
  maxJudgeScore: number;
  status: ScoreReviewStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
  judgeScores?: ScoreReviewJudgeScore[];
}

export interface ResolveScoreReviewRequest {
  status: "RESOLVED" | "IGNORED";
  resolutionNote?: string;
}

export interface JudgeScoreReviewRequest {
  submissionId: string;
  note: string;
}
```

File: [`frontend/src/lib/api/score-review.api.ts`](../../frontend/src/lib/api/score-review.api.ts)

---

## 10. POST `/api/events/{eventId}/score-reviews/judge-request`

**Auth:** `LECTURER` only — judge phải được assign team + round của submission và đã hoàn tất chấm (`COMPLETED` hoặc `LOCKED`).

**Request body:**

```json
{
  "submissionId": "990e8400-e29b-41d4-a716-446655440004",
  "note": "Please re-examine the scoring spread for this team."
}
```

| Field | Type | Bắt buộc | Ràng buộc |
|---|---|---|---|
| `submissionId` | UUID | Yes | Submission thuộc `eventId` trong path |
| `note` | string | Yes | Min 10, max 1000 ký tự |

**Response:** `201 Created` · `ApiResponse<ScoreReviewResponse>` (full detail như §3)

```json
{
  "success": true,
  "message": "Adjustment request submitted",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "eventId": "660e8400-e29b-41d4-a716-446655440001",
    "roundId": "770e8400-e29b-41d4-a716-446655440002",
    "roundType": "PRELIMINARY",
    "teamId": "880e8400-e29b-41d4-a716-446655440003",
    "teamName": "Team Alpha",
    "submissionId": "990e8400-e29b-41d4-a716-446655440004",
    "deviationValue": 20.0,
    "minJudgeScore": 60.0,
    "maxJudgeScore": 80.0,
    "status": "OPEN",
    "createdAt": "2026-04-12T18:30:00",
    "resolvedAt": null,
    "resolutionNote": "Please re-examine the scoring spread for this team.",
    "judgeScores": []
  }
}
```

**Errors:**

| Status | Khi |
|---|---|
| `400` | Validation fail (`note` < 10 chars); judge chưa hoàn tất chấm; chưa đủ judge scores hoàn tất để tính deviation |
| `403` | Judge không được assign team/round của submission |
| `404` | Submission không tồn tại hoặc không thuộc event |
| `409` | Đã có review `OPEN` cho submission — message: `"A deviation review is already open for this submission."` |

**Notes / edge cases:**

- Judge note được lưu vào `resolutionNote` khi review đang `OPEN`. Khi coordinator resolve/ignore, note này bị ghi đè bởi resolution note của coordinator.
- Do `UNIQUE(submission_id)`, nếu review trước đó đã `RESOLVED` hoặc `IGNORED`, endpoint **reopen** record hiện có (set `status=OPEN`, clear `resolvedAt`/`resolvedBy`, cập nhật deviation stats) thay vì insert mới.
- Deviation stats (`minJudgeScore`, `maxJudgeScore`, `deviationValue`) được tính từ tất cả judge scores hoàn tất — không yêu cầu deviation ≥ 25.
- Publish `ScoreReviewCreatedEvent` → audit `SCORE_REVIEW_CREATED`.
- Sau thành công, `GET /api/judging/my-assignments` refetch → `hasOpenScoreReview=true`, badge xuất hiện trên judge scoring list.

**Frontend:** `scoreReviewApi.requestAdjustment(eventId, body)` → `useRequestAdjustment`
