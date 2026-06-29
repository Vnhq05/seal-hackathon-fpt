# SEAL Spring 2026 — Participant Feedback API (§17)

> Ref: [`File_nghiệp_vụ_lệch.md`](../../File_nghiệp_vụ_lệch.md) **§17** · [`Feedback.md`](../../Feedback.md) mục 6  
> Base URL: `/api` · Auth: Bearer JWT  
> Related: [`SEAL-Spring-2026-Event-Status-API.md`](./SEAL-Spring-2026-Event-Status-API.md) · [`SEAL-Spring-2026-API-Reference.md`](./SEAL-Spring-2026-API-Reference.md)

---

## 1. Tổng quan

| Khái niệm | Mô tả |
|---|---|
| **ParticipantFeedback** | Đánh giá sau sự kiện do **người tham gia** gửi (khác `MentorFeedback` mentor → team) |
| **MentorFeedback** | Module hiện có: `POST /api/mentor/feedback` — không thay đổi trong §17 |

### Luồng nghiệp vụ

```text
1. Sự kiện chuyển trạng thái resolved COMPLETED (endDate đã qua)
2. Thành viên đội CONFIRMED gửi feedback (một lần / user / event)
3. BTC (Coordinator / Admin) xem danh sách + thống kê tổng hợp
4. Audit: PARTICIPANT_FEEDBACK_SUBMITTED
```

### Business rules

| Rule | Chi tiết |
|---|---|
| Eligibility | User phải là thành viên team `CONFIRMED` trong event |
| Timing | Chỉ submit khi `event.status` (resolved) = `COMPLETED` |
| Uniqueness | `UNIQUE (user_id, event_id)` — submit lần 2 → `409 Conflict` |
| Rating | `overallRating` bắt buộc, integer `1`–`5` |
| Comment | Tuỳ chọn, tối đa 2000 ký tự |
| Coordinator access | `EVENT_COORDINATOR` chỉ xem event do mình tạo; `SYSTEM_ADMIN` xem mọi event |

---

## 2. Response types

### ParticipantFeedbackResponse

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "eventId": "660e8400-e29b-41d4-a716-446655440001",
  "userId": "770e8400-e29b-41d4-a716-446655440002",
  "userFullName": "Nguyen Van A",
  "teamId": "880e8400-e29b-41d4-a716-446655440003",
  "teamName": "Team Alpha",
  "overallRating": 4,
  "comment": "Great event, well organized!",
  "submittedAt": "2026-04-13T10:30:00"
}
```

### ParticipantFeedbackSummaryResponse

```json
{
  "eventId": "660e8400-e29b-41d4-a716-446655440001",
  "totalCount": 22,
  "averageRating": 4.2,
  "ratingDistribution": {
    "1": 0,
    "2": 1,
    "3": 4,
    "4": 10,
    "5": 7
  }
}
```

---

## 3. POST `/api/events/{eventId}/participant-feedback`

Gửi feedback sau sự kiện.

**Auth:** Bearer JWT (participant đã đăng nhập)

**Path params:**

| Param | Type | Required |
|---|---|---|
| `eventId` | UUID | Yes |

**Request body:**

```json
{
  "overallRating": 4,
  "comment": "Great event, well organized!"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `overallRating` | integer | Yes | `1`–`5` |
| `comment` | string | No | max 2000 chars |

**Response:** `201 Created` · `ApiResponse<ParticipantFeedbackResponse>`

```json
{
  "success": true,
  "message": "Feedback submitted",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "eventId": "660e8400-e29b-41d4-a716-446655440001",
    "userId": "770e8400-e29b-41d4-a716-446655440002",
    "userFullName": "Nguyen Van A",
    "teamId": "880e8400-e29b-41d4-a716-446655440003",
    "teamName": "Team Alpha",
    "overallRating": 4,
    "comment": "Great event, well organized!",
    "submittedAt": "2026-04-13T10:30:00"
  }
}
```

**Errors:**

| HTTP | Khi nào |
|---|---|
| `400` | Event chưa `COMPLETED`; user không trên team `CONFIRMED`; validation fail |
| `404` | Event không tồn tại |
| `409` | User đã gửi feedback cho event này |

**Frontend:** `participantFeedbackApi.submit(eventId, body)` → `useSubmitParticipantFeedback`

---

## 4. GET `/api/events/{eventId}/participant-feedback/me`

Lấy feedback đã gửi của user hiện tại.

**Auth:** Bearer JWT

**Path params:**

| Param | Type | Required |
|---|---|---|
| `eventId` | UUID | Yes |

**Request body:** none

**Response:** `200` · `ApiResponse<ParticipantFeedbackResponse>`

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "eventId": "660e8400-e29b-41d4-a716-446655440001",
    "userId": "770e8400-e29b-41d4-a716-446655440002",
    "userFullName": "Nguyen Van A",
    "teamId": "880e8400-e29b-41d4-a716-446655440003",
    "teamName": "Team Alpha",
    "overallRating": 4,
    "comment": "Great event!",
    "submittedAt": "2026-04-13T10:30:00"
  }
}
```

**Errors:**

| HTTP | Khi nào |
|---|---|
| `404` | Chưa gửi feedback cho event này |

**Frontend:** `participantFeedbackApi.getMine(eventId)` → `useMyParticipantFeedback`

---

## 5. GET `/api/events/{eventId}/participant-feedback`

Danh sách feedback của event (BTC).

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Path params:**

| Param | Type | Required |
|---|---|---|
| `eventId` | UUID | Yes |

**Request body:** none

**Response:** `200` · `ApiResponse<ParticipantFeedbackResponse[]>`

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "eventId": "660e8400-e29b-41d4-a716-446655440001",
      "userId": "770e8400-e29b-41d4-a716-446655440002",
      "userFullName": "Nguyen Van A",
      "teamId": "880e8400-e29b-41d4-a716-446655440003",
      "teamName": "Team Alpha",
      "overallRating": 4,
      "comment": "Great event!",
      "submittedAt": "2026-04-13T10:30:00"
    },
    {
      "id": "551e8400-e29b-41d4-a716-446655440001",
      "eventId": "660e8400-e29b-41d4-a716-446655440001",
      "userId": "771e8400-e29b-41d4-a716-446655440003",
      "userFullName": "Tran Thi B",
      "teamId": "881e8400-e29b-41d4-a716-446655440004",
      "teamName": "Team Beta",
      "overallRating": 5,
      "comment": null,
      "submittedAt": "2026-04-13T11:00:00"
    }
  ]
}
```

**Errors:**

| HTTP | Khi nào |
|---|---|
| `403` | Coordinator không sở hữu event |

**Frontend:** `participantFeedbackApi.list(eventId)` → `useParticipantFeedbackList`

---

## 6. GET `/api/events/{eventId}/participant-feedback/summary`

Thống kê tổng hợp feedback.

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Path params:**

| Param | Type | Required |
|---|---|---|
| `eventId` | UUID | Yes |

**Request body:** none

**Response:** `200` · `ApiResponse<ParticipantFeedbackSummaryResponse>`

```json
{
  "success": true,
  "data": {
    "eventId": "660e8400-e29b-41d4-a716-446655440001",
    "totalCount": 2,
    "averageRating": 4.5,
    "ratingDistribution": {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 1,
      "5": 1
    }
  }
}
```

**Errors:**

| HTTP | Khi nào |
|---|---|
| `403` | Coordinator không sở hữu event |

**Frontend:** `participantFeedbackApi.getSummary(eventId)` → `useParticipantFeedbackSummary`

---

## 7. Frontend integration

| Endpoint | Client | UI |
|---|---|---|
| `POST /events/{eventId}/participant-feedback` | `participantFeedbackApi.submit()` | `/student/feedback` — `ParticipantFeedbackPage` |
| `GET /events/{eventId}/participant-feedback/me` | `participantFeedbackApi.getMine()` | `/student/feedback` — read-only sau submit |
| `GET /events/{eventId}/participant-feedback` | `participantFeedbackApi.list()` | `/coordinator/feedback` — bảng danh sách |
| `GET /events/{eventId}/participant-feedback/summary` | `participantFeedbackApi.getSummary()` | `/coordinator/feedback` — summary cards |

**Files:**

- API: `frontend/src/lib/api/participant-feedback.api.ts`
- Hooks: `frontend/src/features/feedback/hooks/use-participant-feedback.ts`
- Student UI: `frontend/src/features/feedback/components/participant-feedback-page.tsx`
- Coordinator UI: `frontend/src/features/feedback/components/participant-feedback-review-page.tsx`

---

## 8. Backend files

| Layer | Path |
|---|---|
| Entity | `backend/.../feedback/domain/ParticipantFeedback.java` |
| Repository | `backend/.../feedback/repository/ParticipantFeedbackRepository.java` |
| Service | `backend/.../feedback/service/ParticipantFeedbackService.java` |
| Controller | `backend/.../feedback/controller/ParticipantFeedbackController.java` |
| Event | `backend/.../feedback/event/ParticipantFeedbackSubmittedEvent.java` |
| Test | `backend/.../feedback/controller/ParticipantFeedbackIntegrationTest.java` |

---

## 9. Phân biệt với feedback khác

| Module | Hướng | Khi nào |
|---|---|---|
| `ParticipantFeedback` | Participant → BTC | Sau event `COMPLETED` |
| `MentorFeedback` | Mentor → Team | Trong lúc thi |
| Judge scoring `comment` | Judge → Submission criterion | Trong chấm điểm |
