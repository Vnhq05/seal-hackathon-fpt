# SEAL Spring 2026 — Business Rules Enforcement API (§15)

> Ref: `File_nghiệp_vụ_lệch.md` **§15**  
> Base URL: `/api` · Auth: Bearer JWT (unless noted)  
> Related: [`SEAL-Spring-2026-Submission-API.md`](./SEAL-Spring-2026-Submission-API.md) · [`SEAL-Spring-2026-Mentor-Judge-Assignment-API.md`](./SEAL-Spring-2026-Mentor-Judge-Assignment-API.md) · [`SEAL-Spring-2026-External-Student-Verification-API.md`](./SEAL-Spring-2026-External-Student-Verification-API.md)

---

## 1. Tổng quan thay đổi

| Rule | Trước | Sau |
|------|-------|-----|
| Registration deadline + member changes | Chỉ check deadline khi tạo team / gửi join request | Mọi mutation thành viên (invite, accept, kick, transfer leader) đều check deadline + event phase |
| Semester eligibility | Field hiển thị, không validate | Enroll reject nếu `semester` ngoài `semesterMin`–`semesterMax` hoặc thiếu semester khi event có range |
| Graduated students | Backend only (một phần) | Backend + frontend gate; profile trả `studentStanding` |
| Tiebreaker | Free text `tiebreakerCriteria` | **`tiebreakerCriterionIds`** — ordered UUID của `ScoringTemplateCriterion` |
| SEAL milestone gates | Backend enforced; FE partial | FE dùng `round.slideDeadline` / `submissionDeadline` (xem Submission API) |
| Judge–mentor conflict | Đã có backend + FE | Không đổi contract — cross-link Mentor-Judge API |

---

## 2. Enums

### StudentStanding

| Value | Mô tả |
|-------|--------|
| `ENROLLED` | Đang theo học — được phép tham gia |
| `GRADUATED` | Đã tốt nghiệp — **bị chặn** ở register và enroll |

---

## 3. DTO thay đổi

### EventResponse / CreateEventRequest / UpdateEventRequest

| Field | Type | Mô tả |
|-------|------|--------|
| `tiebreakerCriterionIds` | `uuid[]` | **Mới** — thứ tự ưu tiên tie-break (ID từ scoring template) |
| `tiebreakerCriteria` | `string \| null` | Deprecated display label — auto-generate từ tên criteria nếu bỏ trống |

**Ví dụ response:**

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "SEAL Spring 2026",
  "scoringTemplateId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "tiebreakerCriterionIds": [
    "11111111-1111-1111-1111-111111111111",
    "22222222-2222-2222-2222-222222222222"
  ],
  "tiebreakerCriteria": "Technical, Innovation",
  "semesterMin": 4,
  "semesterMax": 8,
  "minTeam": 3,
  "maxTeam": 5,
  "registrationDeadline": "2026-03-25"
}
```

### UserProfileResponse (`GET /api/users/me`)

| Field | Type | Mô tả |
|-------|------|--------|
| `studentStanding` | `ENROLLED \| GRADUATED \| null` | **Mới** — dùng cho FE eligibility gate |
| `semester` | `integer \| null` | **Mới** — dùng so với event `semesterMin`/`semesterMax` |

**Response 200:**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "student1@fpt.edu.vn",
    "fullName": "Nguyen Van A",
    "userType": "FPT_STUDENT",
    "status": "ACTIVE",
    "studentStanding": "ENROLLED",
    "semester": 6,
    "studentId": "SE191001",
    "temporaryAccount": false,
    "createdAt": "2026-01-15T08:00:00"
  }
}
```

---

## 4. Event — Create / Update (sửa)

### POST `/api/events`

**Request (phần tiebreaker mới):**

```json
{
  "name": "SEAL Spring 2026",
  "season": "Spring",
  "year": 2026,
  "startDate": "2026-04-12",
  "endDate": "2026-04-12",
  "registrationDeadline": "2026-03-25",
  "scoringTemplateId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "tiebreakerCriterionIds": [
    "11111111-1111-1111-1111-111111111111",
    "22222222-2222-2222-2222-222222222222"
  ],
  "semesterMin": 4,
  "semesterMax": 8,
  "minTeam": 3,
  "maxTeam": 5
}
```

**Errors 400 (mới):**

| Message | Nguyên nhân |
|---------|-------------|
| `scoringTemplateId is required when tiebreakerCriterionIds is set` | Có IDs nhưng không có template |
| `Invalid tiebreaker criterion id: {uuid}` | ID không thuộc template |
| `tiebreakerCriterionIds must not contain duplicates` | Trùng ID |

### PUT `/api/events/{eventId}`

Same request/validation như create cho `tiebreakerCriterionIds`.

### GET `/api/events/{id}` · GET `/api/public/events/{id}`

Response thêm `tiebreakerCriterionIds`.

---

## 5. Enrollment — eligibility (sửa hành vi)

### POST `/api/events/{eventId}/enrollments`

**Auth:** FPT / external student (approved flow)

**Request body:** None

**Response 201:** `EnrollmentResponse` (unchanged)

**Errors 400 (bổ sung / làm rõ):**

```json
{
  "success": false,
  "message": "Graduated students are not eligible to participate",
  "data": null
}
```

```json
{
  "success": false,
  "message": "Your semester (3) does not meet the requirement (semester 4-8)",
  "data": null
}
```

```json
{
  "success": false,
  "message": "Semester information is required for this event (semester 4-8)",
  "data": null
}
```

### POST `/api/public/events/{eventId}/enrollments`

**Request:**

```json
{
  "fullName": "Tran Thi B",
  "email": "student@hcmut.edu.vn",
  "studentId": "2111001",
  "universityName": "ĐH Bách khoa TP.HCM",
  "studentStanding": "ENROLLED"
}
```

**Errors:** Same graduated / semester rules sau khi user được resolve/create.

---

## 6. Team member mutations — registration gate (sửa hành vi)

Sau `registrationDeadline` (end of day) **hoặc** khi event phase không cho phép (`CLOSED_REGISTRATION`, `ACTIVE`, …), các endpoint sau trả **`400`**:

```json
{
  "success": false,
  "message": "Registration deadline has passed",
  "data": null
}
```

hoặc

```json
{
  "success": false,
  "message": "Team member changes are not allowed in the current event phase",
  "data": null
}
```

| Method | Path | Mô tả |
|--------|------|--------|
| `POST` | `/api/invitations/teams/{teamId}` | Gửi invite |
| `POST` | `/api/invitations/{invitationId}/accept` | Accept invite |
| `POST` | `/api/events/{eventId}/teams/join-requests/{joinRequestId}/accept` | Leader accept join |
| `DELETE` | `/api/events/{eventId}/teams/{teamId}/members/{memberId}` | Remove member |
| `PUT` | `/api/events/{eventId}/teams/{teamId}/leader/{newLeaderId}` | **Mới guard** — transfer leadership |

**Request examples (unchanged):**

```http
DELETE /api/events/{eventId}/teams/{teamId}/members/{memberId}
Authorization: Bearer {token}
```

```http
PUT /api/events/{eventId}/teams/{teamId}/leader/{newLeaderId}
Authorization: Bearer {token}
```

**Response 200 (transfer leadership):**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "team-uuid",
    "name": "Alpha Team",
    "leaderId": "new-leader-uuid",
    "memberCount": 4,
    "status": "FORMING"
  }
}
```

---

## 7. Submission milestone gates (reference)

Không đổi contract — xem [`SEAL-Spring-2026-Submission-API.md`](./SEAL-Spring-2026-Submission-API.md).

### POST `/api/rounds/{roundId}/submissions`

**Errors 400 (SEAL PRELIMINARY):**

| Phase | Message (typical) |
|-------|-------------------|
| Sau slide deadline, chỉ gửi slide | Slide-only resubmit blocked |
| Sau demo deadline | Submission closed |

---

## 8. Judge–mentor conflict (reference)

Không đổi contract — xem [`SEAL-Spring-2026-Mentor-Judge-Assignment-API.md`](./SEAL-Spring-2026-Mentor-Judge-Assignment-API.md).

### POST `/api/rounds/{roundId}/scoring`

**Error 403:**

```json
{
  "success": false,
  "message": "Judge cannot score a team they mentor",
  "data": null
}
```

`GET /api/judging/my-assignments` — `conflictOfInterest: true`, `conflictReason: "MENTOR_OF_TEAM"`.

---

## 9. Ranking / finalists (hành vi nội bộ, contract không đổi)

Tie-break chain khi recalculate ranking hoặc chọn finalists:

1. `roundScore` (desc)
2. Criteria theo `tiebreakerCriterionIds` (desc per criterion avg)
3. Lower judge score deviation
4. Earlier `submittedAt`

| Endpoint | Ghi chú |
|----------|---------|
| `POST /api/rounds/{roundId}/rankings/recalculate` | Dùng `tiebreakerCriterionIds` |
| `POST /api/events/{eventId}/finalists/select` | Finalist cutoff dùng cùng tie-break chain |

---

## 10. Frontend API layer (sửa)

### `event.api.ts`

```typescript
interface EventResponse {
  // ...
  tiebreakerCriteria: string | null;
  tiebreakerCriterionIds?: string[] | null;
}

interface CreateEventRequest {
  tiebreakerCriterionIds?: string[];
}
```

### `user.api.ts`

```typescript
interface UserProfile {
  studentStanding?: StudentStanding | null;
  semester?: number | null;
}
```

### Hooks mới

| File | Mục đích |
|------|----------|
| `use-event-participation-gate.ts` | `canModifyMembers`, `canEnroll`, reasons |
| `participation-gate.utils.ts` | Pure functions — deadline, semester, team size |

---

## 11. Auth register (reference)

`POST /api/auth/register` — `studentStanding: "GRADUATED"` → **400**.  
Xem [`SEAL-Spring-2026-External-Student-Verification-API.md`](./SEAL-Spring-2026-External-Student-Verification-API.md).
