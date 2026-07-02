# SEAL Spring 2026 — Finding Members API

> Companion doc for team leader "Finding members" flow and participant `isProfilePublic` flag.  
> See also: [SEAL-Spring-2026-Team-Matching-API.md](./SEAL-Spring-2026-Team-Matching-API.md)

---

## Ma trận hành vi `isLookingForTeam` × `isProfilePublic`

| isLookingForTeam | isProfilePublic | Xuất hiện trong list candidates? | Nút View Profile (FE) | Invite |
|------------------|-----------------|----------------------------------|-----------------------|--------|
| `false`          | *               | Không                            | —                     | —      |
| `true`           | `false`         | Có                               | Ẩn (không render)     | Có     |
| `true`           | `true`          | Có                               | Có                    | Có     |

- `isProfilePublic` chỉ được cập nhật khi `isLookingForTeam = true` (checkbox FE disable khi bỏ tích, giá trị đã lưu không bị xóa).
- Gọi thẳng API profile khi `isProfilePublic = false` → **403**.

---

## Enum `CompetitionOutcome`

`CHAMPION`, `FINALIST`, `ELIMINATED`, `UNRANKED`

---

## 1. List matching candidates (mới)

### GET `/api/events/{eventId}/teams/{teamId}/matching/candidates`

**Auth:** Bearer JWT — **team leader only**

**Điều kiện truy cập (server enforce):**

- Caller là `team.leaderId` của `teamId` trong `eventId`
- `team.memberCount < maxTeamMembers`
- `canModifyMembers` (event phase OPEN/UPCOMING, chưa qua registration deadline)

**Response `200`:**

```json
{
  "success": true,
  "data": [
    {
      "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "fullName": "Nguyen Van B",
      "universityName": "FPT University",
      "semester": 5,
      "preferredRole": "Backend developer",
      "isProfilePublic": true,
      "hasPendingInvitation": false
    }
  ]
}
```

| Field | Type | Ghi chú |
|---|---|---|
| `userId` | UUID | Dùng cho Invite (`inviteeUserId`) và View Profile |
| `fullName` | string | |
| `universityName` | string \| null | |
| `semester` | integer \| null | |
| `preferredRole` | string \| null | Free text, max 100 characters |
| `isProfilePublic` | boolean | FE quyết định render nút View Profile |
| `hasPendingInvitation` | boolean | `true` → disable Invite, label "Invited" |

**Không trả:** `email`, `studentId`.

**Nguồn dữ liệu:** `APPROVED` + `isLookingForTeam = true` + chưa thuộc team nào trong event + loại trừ chính leader.

**Errors:**

| Code | Khi nào |
|------|---------|
| `403` | Không phải leader |
| `400` | Team full / team không thuộc event / registration closed / phase không cho sửa member |
| `404` | Team không tồn tại |

**Search:** Client-side filter theo `preferredRole` (không có query param API).

---

## 2. Public matching profile (mới)

### GET `/api/events/{eventId}/teams/{teamId}/matching/candidates/{userId}/profile`

**Auth:** Bearer JWT — **team leader only** (cùng guard như candidates)

**Server re-check:** target enrollment phải `APPROVED`, `isLookingForTeam = true`, chưa có team, và **`isProfilePublic = true`** → nếu không → **403**.

**Response `200`:**

```json
{
  "success": true,
  "data": {
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "fullName": "Nguyen Van B",
    "universityName": "FPT University",
    "semester": 5,
    "competitions": [
      {
        "eventId": "8b1e2f3a-1234-5678-9abc-def012345678",
        "eventName": "SEAL Hackathon Fall 2025",
        "season": "FALL",
        "year": 2025,
        "teamName": "Team Alpha",
        "finalRank": 2,
        "outcome": "FINALIST"
      }
    ]
  }
}
```

| Field | Type | Ghi chú |
|---|---|---|
| `competitions` | array | Lịch sử team đã tham gia (mọi event), sort `year` desc, `season` desc |
| `competitions[].finalRank` | integer \| null | Rank tại round cuối team còn xuất hiện |
| `competitions[].outcome` | `CompetitionOutcome` | Tính server-side (không N+1 client) |

**Errors:**

| Code | Khi nào |
|------|---------|
| `403` | Không phải leader / profile không public |
| `400` | Candidate không approved / không looking for team |
| `404` | Enrollment hoặc user không tồn tại |
| `409` | Candidate đã có team |

---

## 3. Update matching profile (sửa)

### PUT `/api/events/{eventId}/enrollments/my/matching-profile`

**Auth:** Bearer JWT — enrolled participant (`APPROVED`)

**Request:**

```json
{
  "isLookingForTeam": true,
  "isProfilePublic": true,
  "preferredRole": "Backend developer"
}
```

| Field | Type | Required | Ghi chú |
|---|---|---|---|
| `isLookingForTeam` | boolean | Yes | Alias: `lookingForTeam` |
| `isProfilePublic` | boolean | No | Alias: `profilePublic`. Chỉ persist khi `isLookingForTeam = true` |
| `preferredRole` | string \| null | No | Max 100 characters |

**Response `200`:** `EnrollmentResponse` (thêm field mới):

```json
{
  "success": true,
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "eventId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "APPROVED",
    "enrolledAt": "2026-06-01T08:00:00",
    "userFullName": "Nguyen Van B",
    "userEmail": "student@fpt.edu.vn",
    "userStudentId": "SE123456",
    "userUniversityName": "FPT University",
    "isLookingForTeam": true,
    "isProfilePublic": true,
    "preferredRole": "Backend developer",
    "semester": 5
  }
}
```

**Errors:** `400` enrollment chưa approved / đang on team mà bật looking-for-team.

---

## 4. Get my enrollment (sửa response)

### GET `/api/events/{eventId}/enrollments/my`

Response `EnrollmentResponse` thêm:

- `semester` (integer \| null) — từ user profile
- `isProfilePublic` (boolean)

---

## 5. Send invitation (sửa)

### POST `/api/invitations/teams/{teamId}`

**Auth:** Bearer JWT — team leader

**Request (một trong hai cách):**

By email (existing):

```json
{
  "inviteeEmail": "student@fpt.edu.vn"
}
```

By user id (mới — dùng từ Finding Members, không lộ email):

```json
{
  "inviteeUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

| Field | Type | Required | Ghi chú |
|---|---|---|---|
| `inviteeEmail` | string | Conditional | Email hợp lệ, lowercase server-side |
| `inviteeUserId` | UUID | Conditional | Resolve email nội bộ |

**Validation:** Phải có **một trong hai** `inviteeEmail` hoặc `inviteeUserId`.

**Response `201`:** `InvitationResponse` (không đổi schema).

```json
{
  "success": true,
  "message": "Invitation sent",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "teamId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "teamName": "Team Beta",
    "inviterId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "inviteeEmail": "student@fpt.edu.vn",
    "status": "PENDING",
    "expiresAt": "2026-06-08T10:00:00",
    "createdAt": "2026-06-01T10:00:00"
  }
}
```

**Errors:** `400` thiếu email/userId / team full; `403` không phải leader; `404` user không tồn tại; `409` duplicate pending invitation.

---

## Database migration

Chạy [`backend/src/main/resources/db/team_matching.sql`](../../backend/src/main/resources/db/team_matching.sql) — block mới:

```sql
ALTER TABLE event_enrollments ADD is_profile_public BIT NOT NULL DEFAULT 0;
```

(idempotent `IF NOT EXISTS` trong file)

---

## Frontend integration

| Component | API |
|-----------|-----|
| `matching-profile-panel.tsx` | `PUT .../matching-profile` |
| `finding-members-section.tsx` | `GET .../matching/candidates`, `POST .../invitations` |
| `public-profile-modal.tsx` | `GET .../matching/candidates/{userId}/profile` |

Query keys: `["matching-candidates", eventId, teamId]`, `["public-matching-profile", eventId, teamId, userId]`.
