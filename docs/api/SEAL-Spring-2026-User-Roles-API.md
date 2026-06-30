# SEAL Spring 2026 — User Roles API Changes (§2)

> Ref: `File_nghiệp_vụ_lệch.md` **§2**, **§14**, **§15**  
> Scope: COI judge/mentor, `AllowedEmailDomain`, graduated student block  
> **Không thêm role mới** — vẫn giữ 5 `UserType`.

---

## 1. Allowed Email Domains (mới)

Per-event whitelist cho `EXTERNAL_STUDENT`. Domain lưu **không có** `@` (vd: `hcmut.edu.vn`). Subdomain được chấp nhận (vd: `student@hcmus.edu.vn` match rule `hcmus.edu.vn`).

Event `SEAL_RAG_2026` được seed domain mặc định khi tạo event. Event `GENERIC` không bắt buộc domain nếu list rỗng.

### GET `/api/events/{eventId}/allowed-email-domains`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Response `200`:**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "eventId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "domain": "hcmut.edu.vn",
      "universityLabel": "ĐH Bách khoa TP.HCM"
    }
  ]
}
```

### POST `/api/events/{eventId}/allowed-email-domains`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Request:**
```json
{
  "domain": "uit.edu.vn",
  "universityLabel": "ĐH Công nghệ Thông tin TP.HCM"
}
```

**Response `201`:** `AllowedEmailDomainResponse` (một object như trên).

**Errors:**
- `409` — domain đã tồn tại cho event
- `400` — domain rỗng

### DELETE `/api/events/{eventId}/allowed-email-domains/{domainId}`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Response `200`:** `{ "success": true, "data": null }`

### GET `/api/public/events/{eventId}/allowed-email-domains`

**Auth:** Public (không cần token)

**Response `200`:** cùng format list như endpoint admin.

---

## 2. Registration — Graduated Block (sửa)

### POST `/api/auth/register`

**Thay đổi request** — thêm field bắt buộc:

**Request:**
```json
{
  "email": "student@fpt.edu.vn",
  "password": "Password1",
  "fullName": "Nguyen Van A",
  "phone": "0901234567",
  "studentId": "SE123456",
  "universityName": "FPT University",
  "userType": "FPT_STUDENT",
  "studentStanding": "ENROLLED",
  "semester": 5
}
```

| Field | Type | Required | Ghi chú |
|---|---|---|---|
| `studentStanding` | `"ENROLLED"` \| `"GRADUATED"` | Yes | Chỉ `ENROLLED` được chấp nhận |

**Response `201`:** `UUID` user id (string) — không đổi.

**Errors mới:**
- `400` — `"Graduated students are not eligible to participate"` khi `studentStanding = GRADUATED`

**Lưu ý:** `EXTERNAL_STUDENT` validate email domain + `universityName` tại register (danh sách mặc định SEAL 2026). Khi enroll event, validate lại theo whitelist per-event.

---

## 3. External Enrollment (sửa)

### POST `/api/public/events/{eventId}/enrollments`

**Request:**
```json
{
  "fullName": "Tran Thi B",
  "email": "student@hcmut.edu.vn",
  "studentId": "2012345",
  "universityName": "HCMUT",
  "studentStanding": "ENROLLED"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "eventId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "PENDING",
    "enrolledAt": "2026-06-29T10:00:00",
    "userFullName": "Tran Thi B",
    "userEmail": "student@hcmut.edu.vn",
    "userStudentId": "2012345",
    "userUniversityName": "HCMUT"
  }
}
```

**Errors mới:**
- `400` — graduated student
- `400` — email domain không nằm trong whitelist event
- `400` — event `SEAL_RAG_2026` chưa cấu hình domain

### POST `/api/events/{eventId}/enrollments` (logged-in)

**Behavior change** (contract không đổi):
- Reject nếu `user.studentStanding = GRADUATED`
- `EXTERNAL_STUDENT`: validate email domain theo event

---

## 4. Judge–Mentor Conflict of Interest

### GET `/api/judging/my-assignments`

**Auth:** `LECTURER`

**Response `200` (mỗi phần tử):**
```json
{
  "teamId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "teamName": "Team Alpha",
  "roundId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "roundName": "Vòng bảng",
  "eventId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "eventName": "SEAL Hackathon Spring 2026",
  "trackId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "trackName": "Track A",
  "submissionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "scoringStatus": "NOT_STARTED",
  "scoringDeadline": "2026-04-12T17:00:00",
  "conflictOfInterest": false,
  "conflictReason": null
}
```

Khi lecturer vừa là mentor của team:
```json
{
  "conflictOfInterest": true,
  "conflictReason": "MENTOR_OF_TEAM"
}
```

### Behavior change — gán mentor

**POST** assign mentor to team (`TeamController`)

**POST** accept mentor invitation

**Response khi conflict:**
- `409` — `"Conflict of interest: this user is assigned as a judge for this team"`

### Behavior change — gán judge (đã có, giữ nguyên)

**POST** team judge assignment

- `409` — `"Cannot assign judge who is the mentor of this team (conflict of interest)"`

### Behavior change — chấm điểm (đã có)

**POST** `/api/rounds/{roundId}/scoring`

- `403` — mentor không được chấm team mình mentor

### Side effect — mentor gán sau judge

Khi `MentorTeam` được tạo, hệ thống **tự xóa** `TeamJudgeAssignment` tương ứng nếu judge chưa submit score.

---

## 5. User entity — `studentStanding`

| Value | Meaning |
|---|---|
| `ENROLLED` | Đang theo học (default) |
| `GRADUATED` | Đã tốt nghiệp — không được enroll |

Cột DB: `users.student_standing NVARCHAR(20) NOT NULL DEFAULT 'ENROLLED'`

---

## 6. Default domains — SEAL_RAG_2026 template

Seed khi tạo event `competitionFormat = SEAL_RAG_2026`:

| domain | universityLabel |
|---|---|
| fpt.edu.vn | FPT University |
| fe.edu.vn | FPT Education |
| hcmut.edu.vn | ĐH Bách khoa TP.HCM |
| hcmus.edu.vn | ĐH Khoa học Tự nhiên TP.HCM |
| student.hcmus.edu.vn | ĐH Khoa học Tự nhiên TP.HCM |
| uit.edu.vn | ĐH Công nghệ Thông tin TP.HCM |
| hcmute.edu.vn | ĐH Sư phạm Kỹ thuật TP.HCM |
| ueh.edu.vn | ĐH Kinh tế TP.HCM |
| student.ueh.edu.vn | ĐH Kinh tế TP.HCM |
| student.iuh.edu.vn | ĐH Công nghiệp TP.HCM |

---

## 7. Frontend mapping

```typescript
// types.ts
export type StudentStanding = "ENROLLED" | "GRADUATED";

// auth.api.ts — register
studentStanding: "ENROLLED";

// enrollment.api.ts — enrollExternal
studentStanding: "ENROLLED";

// event.api.ts
eventApi.listAllowedEmailDomains(eventId);
eventApi.listPublicAllowedEmailDomains(eventId);

// judging.api.ts — my-assignments
conflictOfInterest?: boolean;
conflictReason?: string | null;
```

---

## 8. Dev seed accounts (local / demo)

Password mặc định cho tất cả tài khoản seed: **`12345678`**

| Email | Role |
|---|---|
| admin@seal.com | SYSTEM_ADMIN |
| coordinator@seal.com | EVENT_COORDINATOR |
| lecturer1@fpt.edu.vn … lecturer5@fpt.edu.vn | LECTURER |
| student1@fpt.edu.vn … student6@fpt.edu.vn | FPT_STUDENT |

**Re-sync on startup:** [`DataSeeder`](backend/src/main/java/com/sealhackathon/infrastructure/config/DataSeeder.java) đặt lại password, `ACTIVE`, unlock, và `studentStanding = ENROLLED` cho các email seed khi:

```yaml
app.seeder.resync-dev-accounts: true   # default
```

Production: set `SEEDER_RESYNC_DEV_ACCOUNTS=false` hoặc `app.seeder.resync-dev-accounts: false`.

Sau khi pull code mới, **restart backend** để login dev accounts hoạt động lại nếu DB đã có user với hash/status cũ.

### DB migration prerequisite

Chạy [`seal_spring_2026_migration.sql`](backend/src/main/resources/db/seal_spring_2026_migration.sql) trước khi start app (`spring.jpa.hibernate.ddl-auto: validate`):

- `users.student_standing`
- `allowed_email_domains`

### E2E smoke (sau login OK)

| Flow | Route | Account |
|---|---|---|
| Domain admin | `/coordinator/allowed-domains` | coordinator@seal.com |
| Scoring + COI UI | `/lecturer/scoring` | lecturer1@fpt.edu.vn |
| Public domains | `/register`, event external form | (no auth) |
