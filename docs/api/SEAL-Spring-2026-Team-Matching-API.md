# SEAL Spring 2026 — Team Matching API (§13)

> Ref: `File_nghiệp_vụ_lệch.md` **§13**  
> Scope: team recruitment profile, participant matching profile (per-event enrollment), public browse privacy

---

## Enum `HackathonSkillRole`

Dùng cho `neededRoles` (team) và `preferredRole` (enrollment):

`FRONTEND`, `BACKEND`, `FULLSTACK`, `MOBILE`, `AI_ML`, `DESIGN`, `DEVOPS`, `DATA`, `PM`, `OTHER`

- `neededRoles`: tối đa 5 giá trị, không trùng
- `preferredRole`: nullable, một giá trị

### JSON field names (boolean)

Canonical keys trong request/response:

| Field | Canonical JSON key |
|---|---|
| Team recruiting flag | `isRecruiting` |
| Participant looking-for-team flag | `isLookingForTeam` |

Request bodies cũng chấp nhận alias ngắn (backward-compat): `recruiting`, `lookingForTeam`.

Response **chỉ** trả canonical keys (`isRecruiting`, `isLookingForTeam`) — không dùng `recruiting` / `lookingForTeam`.

---

## 1. Team Recruitment Settings (mới)

### PUT `/api/events/{eventId}/teams/{teamId}/recruitment`

**Auth:** Bearer JWT — **team leader only**

**Request:**
```json
{
  "isRecruiting": true,
  "recruitmentNote": "We need a backend dev familiar with Spring Boot.",
  "neededRoles": ["BACKEND", "FULLSTACK"]
}
```

| Field | Type | Required | Ghi chú |
|---|---|---|---|
| `isRecruiting` | boolean | Yes | Chỉ `true` khi team chưa full và không `DISBANDED` |
| `recruitmentNote` | string | No | Max 1000 ký tự |
| `neededRoles` | `HackathonSkillRole[]` | No | Max 5, không trùng |

**Response `200`:**
```json
{
  "success": true,
  "message": "Recruitment settings updated",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "eventId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Team Beta",
    "leaderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "FORMING",
    "trackId": null,
    "memberCount": 2,
    "minTeamMembers": 3,
    "maxTeamMembers": 5,
    "canSelectTrack": false,
    "members": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "fullName": "Nguyen Van A",
        "email": "leader@fpt.edu.vn",
        "role": "LEADER",
        "joinedAt": "2026-06-01T10:00:00"
      }
    ],
    "createdAt": "2026-06-01T09:00:00",
    "isRecruiting": true,
    "recruitmentNote": "We need a backend dev familiar with Spring Boot.",
    "neededRoles": ["BACKEND", "FULLSTACK"]
  }
}
```

**Errors:**
- `403` — không phải leader
- `400` — team full / disbanded / note quá dài / quá 5 roles

**Side effect:** Khi team đủ `maxTeamMembers`, `isRecruiting` tự động về `false`.

---

## 2. Joinable Teams Browse (sửa)

### GET `/api/events/{eventId}/teams/joinable`

**Auth:** Bearer JWT — enrolled user (approved), chưa có team, không có join request pending

**Query params:**

| Param | Type | Default | Ghi chú |
|---|---|---|---|
| `recruitingOnly` | boolean | `false` | `true` → chỉ teams có `isRecruiting=true` và còn slot |

**Response `200`:**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Team Beta",
      "leaderId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "leaderFullName": "Tran Thi B",
      "memberCount": 2,
      "maxTeamMembers": 5,
      "status": "FORMING",
      "isRecruiting": true,
      "recruitmentNote": "Looking for a backend developer!",
      "neededRoles": ["BACKEND", "FULLSTACK"]
    }
  ]
}
```

**Breaking change:** Field `leaderEmail` đã **bị xóa** — public browse không expose email leader.

---

## 3. Participant Matching Profile (mới)

### PUT `/api/events/{eventId}/enrollments/my/matching-profile`

**Auth:** Bearer JWT — enrolled user (approved)

**Request:**
```json
{
  "isLookingForTeam": true,
  "preferredRole": "FRONTEND"
}
```

| Field | Type | Required | Ghi chú |
|---|---|---|---|
| `isLookingForTeam` | boolean | Yes | Không thể `true` nếu user đã có team |
| `preferredRole` | `HackathonSkillRole` \| null | No | Role ưu tiên khi tìm team |

**Response `200`:**
```json
{
  "success": true,
  "message": "Matching profile updated",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "eventId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "APPROVED",
    "enrolledAt": "2026-06-01T08:00:00",
    "userFullName": "Le Van C",
    "userEmail": "student6@fpt.edu.vn",
    "userStudentId": "SE191006",
    "userUniversityName": "FPT University",
    "isLookingForTeam": true,
    "preferredRole": "FRONTEND"
  }
}
```

**Errors:**
- `400` — enrollment chưa approved
- `400` — `isLookingForTeam=true` khi đã có team

**Lưu ý:** Profile lưu trên `EventEnrollment` (theo event), không phải global user profile.

---

## 4. Get My Enrollment (sửa)

### GET `/api/events/{eventId}/enrollments/my`

**Response `200`:** thêm fields `isLookingForTeam`, `preferredRole` (cùng format như §3).

---

## 5. Waiting List (sửa)

### GET `/api/events/{eventId}/enrollments/waiting-list`

**Auth:** Leader/coordinator (logic hiện tại)

**Response `200`:** mỗi item thêm:
```json
{
  "isLookingForTeam": true,
  "preferredRole": "FRONTEND"
}
```

Email vẫn hiển thị (leader cần để gửi invitation).

---

## 6. Team Detail — Privacy Rules (sửa)

### GET `/api/events/{eventId}/teams/{teamId}`

**Response** thêm recruitment fields: `isRecruiting`, `recruitmentNote`, `neededRoles`.

**Member visibility:**

| Viewer | `members[].email` |
|---|---|
| Team member / leader | Có |
| `SYSTEM_ADMIN`, `EVENT_COORDINATOR` | Có |
| Enrolled user (non-member) | **Không** — chỉ `userId`, `fullName`, `role` |

---

## 7. Team List — Privacy Rules (sửa)

### GET `/api/events/{eventId}/teams`

**Response:** recruitment fields trên mỗi team; `members` luôn là `[]` (chỉ `memberCount`).

---

## 8. My Team (không đổi behavior)

### GET `/api/events/{eventId}/teams/my-team`

Trả full details (members có email) + recruitment fields.

---

## Migration

Chạy script trước deploy (SQL Server, `ddl-auto=validate`):

`backend/src/main/resources/db/team_matching.sql`

---

## Frontend integration

| Endpoint | Client | UI |
|---|---|---|
| `PUT .../teams/{id}/recruitment` | `teamApi.updateRecruitment()` | `TeamRecruitmentSettings` (leader) |
| `GET .../teams/joinable?recruitingOnly` | `joinRequestApi.getJoinable()` | `JoinTeamPanel` |
| `PUT .../enrollments/my/matching-profile` | `enrollmentApi.updateMatchingProfile()` | `MatchingProfilePanel` |
| `GET .../enrollments/waiting-list` | `enrollmentApi.getWaitingList()` | `CreateTeamPanel` badges |
