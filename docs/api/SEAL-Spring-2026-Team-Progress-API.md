# SEAL Spring 2026 — Team Progress API

> **Phạm vi:** Module `com.sealhackathon.progress` — phát hiện team có tiến độ nộp bài chưa đáng kể, gửi cảnh báo qua notification polling, và cung cấp dữ liệu cho mentor/coordinator/student dashboard.

---

## Tổng quan

| Method | Path | Mô tả | UI consumer |
|--------|------|--------|-------------|
| GET | `/api/events/{eventId}/rounds/{roundId}/progress` | Danh sách risk tiến độ theo round (role-scoped) | Coordinator dashboard, student banner |
| GET | `/api/mentor/teams/at-risk` | Team at-risk của mentor hiện tại | `/lecturer/teams` badge |

**Scheduler (không phải HTTP):** `TeamProgressScheduler` — cron `0 */15 6-23 * * *`, gọi `TeamProgressScanService.scanActiveRounds()`.

**Auth:** Bearer JWT (`Authorization: Bearer <access_token>`).

**Base URL:** `{API_BASE}/api`

---

## Shared schemas

### ApiResponse&lt;T&gt;

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

| Field | Type | Mô tả |
|-------|------|--------|
| `success` | `boolean` | `true` khi thành công |
| `message` | `string` | Thông báo ngắn |
| `data` | `T` | Payload |

### ProgressRiskReason

| Value | Mô tả rule |
|-------|------------|
| `NOT_STARTED` | Chưa có submission hoặc DRAFT (0 version), trong cửa sổ ≤ `alert-lead-time-hours` trước deadline, và **chưa quá** `submissionDeadline` |
| `SLIDE_ONLY_PAST_GATE` | SEAL + PRELIMINARY: qua `slideDeadline`, chỉ có slide, chưa có github/demo (chỉ khi còn trước `submissionDeadline`) |
| `SINGLE_VERSION_LAST_MINUTE` | Đúng 1 version, nộp trong cửa sổ lead-time trước deadline (chỉ khi còn trước `submissionDeadline`) |
| `STALLED` | ≥1 version nhưng không cập nhật trong `stalled-hours`, còn ≤48h tới deadline |
| `MISSING_ATTACHMENT` | `SUBMITTED` nhưng latest version không có attachment (chỉ khi còn trước `submissionDeadline`) |

> **Lưu ý:** Sau khi `submissionDeadline` kết thúc, evaluation luôn trả `OK` (không còn alert / banner).

### ProgressRiskLevel

| Value | Điều kiện |
|-------|-----------|
| `OK` | Không match rule nào |
| `AT_RISK` | Có reason không thuộc nhóm critical |
| `CRITICAL` | Có `NOT_STARTED` hoặc `SLIDE_ONLY_PAST_GATE` |

### TeamProgressResponse

```json
{
  "teamId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "teamName": "Team Alpha",
  "roundId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "riskLevel": "AT_RISK",
  "reasons": ["STALLED"],
  "lastSubmittedAt": "2026-07-08T14:30:00",
  "totalVersions": 2,
  "hoursUntilDeadline": 36
}
```

| Field | Type | Nullable | Mô tả |
|-------|------|----------|--------|
| `teamId` | `UUID` | No | ID team |
| `teamName` | `string` | No | Tên team |
| `roundId` | `UUID` | No | ID round đang đánh giá |
| `riskLevel` | `ProgressRiskLevel` | No | Mức rủi ro tổng hợp |
| `reasons` | `ProgressRiskReason[]` | No | Danh sách lý do (có thể rỗng khi `OK`) |
| `lastSubmittedAt` | `string` (ISO-8601 datetime) | Yes | Thời điểm version mới nhất; `null` nếu chưa nộp |
| `totalVersions` | `integer` | No | Số version (0 nếu chưa có submission) |
| `hoursUntilDeadline` | `long` | No | Giờ còn lại tới `submissionDeadline` (âm nếu đã qua deadline) |

---

## GET `/api/events/{eventId}/rounds/{roundId}/progress`

Đánh giá tiến độ tất cả team eligible trong round (hoặc subset theo role).

### Request

**Path parameters**

| Param | Type | Required | Mô tả |
|-------|------|----------|--------|
| `eventId` | `UUID` | Yes | ID hackathon event |
| `roundId` | `UUID` | Yes | ID round (phải thuộc `eventId`) |

**Headers**

| Header | Value |
|--------|--------|
| `Authorization` | `Bearer <access_token>` |

**Query parameters:** none

**Request body:** none

### Response `200 OK`

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "teamId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "teamName": "Team Alpha",
      "roundId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "riskLevel": "CRITICAL",
      "reasons": ["NOT_STARTED"],
      "lastSubmittedAt": null,
      "totalVersions": 0,
      "hoursUntilDeadline": 4
    },
    {
      "teamId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "teamName": "Team Beta",
      "roundId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "riskLevel": "OK",
      "reasons": [],
      "lastSubmittedAt": "2026-07-09T10:15:00",
      "totalVersions": 3,
      "hoursUntilDeadline": 4
    }
  ]
}
```

### Role behavior

| Role | Phạm vi dữ liệu |
|------|-----------------|
| `SYSTEM_ADMIN` | Tất cả team eligible trong round |
| `EVENT_COORDINATOR` | Tất cả team eligible; phải là owner event (`createdBy` email) |
| `LECTURER` | Chỉ team mentor được gán (`MentorTeam`) |
| `FPT_STUDENT` / `EXTERNAL_STUDENT` | Chỉ team của user hiện tại |
| Khác | `403 Forbidden` |

### Errors

| HTTP | Khi nào |
|------|---------|
| `401` | Thiếu / token không hợp lệ |
| `403` | Role không được phép hoặc coordinator không sở hữu event |
| `404` | `roundId` không tồn tại hoặc không thuộc `eventId` |

---

## GET `/api/mentor/teams/at-risk`

Danh sách team mentor đang được gán có `riskLevel != OK` trong round active hiện tại của event.

### Request

**Query parameters**

| Param | Type | Required | Mô tả |
|-------|------|----------|--------|
| `eventId` | `UUID` | Yes | ID hackathon event |

**Headers**

| Header | Value |
|--------|--------|
| `Authorization` | `Bearer <access_token>` |

**Path / body:** none

### Response `200 OK`

Cùng schema `ApiResponse<List<TeamProgressResponse>>`, chỉ gồm team at-risk của mentor.

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "teamId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "teamName": "Team Alpha",
      "roundId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "riskLevel": "AT_RISK",
      "reasons": ["STALLED", "MISSING_ATTACHMENT"],
      "lastSubmittedAt": "2026-07-07T08:00:00",
      "totalVersions": 1,
      "hoursUntilDeadline": 30
    }
  ]
}
```

### Auth

| Role | Allowed |
|------|---------|
| `LECTURER` | Yes |
| Khác | `403 Forbidden` |

---

## Notification changes (behavior, không phải REST endpoint mới)

### `TEAM_PROGRESS_ALERT` (mới)

Khi scheduler phát hiện risk và vượt cooldown, hệ thống tạo notification:

| Field | Giá trị |
|-------|---------|
| `type` | `TEAM_PROGRESS_ALERT` |
| `title` | `Team progress alert` |
| `message` | English sentences joined from `reasons` |
| `referenceId` | `teamId` |
| `referenceType` | `Team` |

**Recipients:** mentor của team + team leader + coordinator owner event.

### `SUBMISSION_CREATED` (sửa behavior)

Trước đây gửi `recipients = []` (bug — không tạo notification).

**Sau sửa:** recipients = team leader + mentor (nếu có).

**Notification row schema** (không đổi):

```json
{
  "id": "uuid",
  "recipientId": "uuid",
  "type": "SUBMISSION_CREATED",
  "title": "Submission Received",
  "message": "Your team's submission (version 1) has been received.",
  "referenceId": "submission-uuid",
  "referenceType": "Submission",
  "read": false,
  "readAt": null,
  "createdAt": "2026-07-10T12:00:00"
}
```

---

## Configuration (`application.yml`)

```yaml
app:
  progress:
    alert-lead-time-hours: 6
    stalled-hours: 24
    cooldown-hours: 12
```

---

## Database

Migration: `backend/src/main/resources/db/team_progress_alerts.sql` — bảng `team_progress_alerts`, unique `(team_id, round_id)`.
