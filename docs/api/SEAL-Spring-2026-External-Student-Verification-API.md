# SEAL Spring 2026 — External Student Verification API (§14)

> Ref: `File_nghiệp_vụ_lệch.md` **§14**  
> Scope: email domain whitelist, graduated-student block, university whitelist validation

---

## Tổng quan thay đổi

| Vấn đề nghiệp vụ | Giải pháp |
|---|---|
| Không kiểm tra domain email khi đăng ký | Validate domain theo danh sách mặc định (template SEAL 2026) tại `POST /api/auth/register` |
| Không chặn sinh viên đã tốt nghiệp | Field `studentStanding` bắt buộc; chỉ `ENROLLED` được chấp nhận |
| `universityName` nhập tự do | Phải khớp `universityLabel` của domain email (whitelist) |

**Quy tắc domain:**
- Domain lưu **không có** `@` (vd: `hcmut.edu.vn`)
- Subdomain được chấp nhận (vd: `student@student.hcmus.edu.vn` match rule `hcmus.edu.vn`)
- `universityName` phải trùng `universityLabel` của bản ghi domain khớp email (không phân biệt hoa thường)

---

## 1. Allowed Email Domains — Admin (mới)

Per-event whitelist cho `EXTERNAL_STUDENT`. Event `SEAL_RAG_2026` được seed domain mặc định khi tạo event.

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

| Field | Type | Required | Ghi chú |
|---|---|---|---|
| `domain` | string | Yes | Có thể có hoặc không có `@` prefix |
| `universityLabel` | string | No | Tên trường hiển thị trên form đăng ký |

**Response `201`:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "eventId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "domain": "uit.edu.vn",
    "universityLabel": "ĐH Công nghệ Thông tin TP.HCM"
  }
}
```

**Errors:**
- `409` — domain đã tồn tại cho event
- `400` — domain rỗng

### DELETE `/api/events/{eventId}/allowed-email-domains/{domainId}`

**Auth:** `SYSTEM_ADMIN`, `EVENT_COORDINATOR`

**Response `200`:**
```json
{
  "success": true,
  "message": "Success",
  "data": null
}
```

---

## 2. Allowed Email Domains — Public (mới / sửa)

### GET `/api/public/events/{eventId}/allowed-email-domains`

**Auth:** Public (không cần token)

Dùng cho form đăng ký external theo event. Event phải ở trạng thái public.

**Response `200`:** cùng format list như endpoint admin.

### GET `/api/public/registration/allowed-email-domains` *(mới)*

**Auth:** Public (không cần token)

Danh sách domain mặc định cho trang **Create Account** (`/register`) khi chọn `EXTERNAL_STUDENT`. Không gắn với event cụ thể.

**Response `200`:**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": null,
      "eventId": null,
      "domain": "fpt.edu.vn",
      "universityLabel": "FPT University"
    },
    {
      "id": null,
      "eventId": null,
      "domain": "hcmut.edu.vn",
      "universityLabel": "ĐH Bách khoa TP.HCM"
    }
  ]
}
```

---

## 3. Participant Registration (sửa)

### POST `/api/auth/register`

**Auth:** Public

**Request:**
```json
{
  "email": "student@hcmut.edu.vn",
  "password": "Password1",
  "fullName": "Nguyen Van A",
  "phone": "0901234567",
  "studentId": "2012345",
  "universityName": "ĐH Bách khoa TP.HCM",
  "userType": "EXTERNAL_STUDENT",
  "studentStanding": "ENROLLED",
  "semester": 5
}
```

| Field | Type | Required | Ghi chú |
|---|---|---|---|
| `email` | string | Yes | `EXTERNAL_STUDENT`: phải thuộc domain whitelist |
| `password` | string | Yes | Min 8, có hoa/thường/số |
| `fullName` | string | Yes | |
| `phone` | string | No | |
| `studentId` | string | Yes* | *Bắt buộc với `FPT_STUDENT` và `EXTERNAL_STUDENT` |
| `universityName` | string | Yes* | *Bắt buộc với `EXTERNAL_STUDENT`; phải khớp `universityLabel` |
| `userType` | `"FPT_STUDENT"` \| `"EXTERNAL_STUDENT"` | Yes | |
| `studentStanding` | `"ENROLLED"` \| `"GRADUATED"` | Yes | Chỉ `ENROLLED` được chấp nhận |
| `semester` | number | No | 1–10 |

**Response `201`:**
```json
{
  "success": true,
  "message": "Registration successful. Please wait for admin approval.",
  "data": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

**Errors mới / cập nhật (`400`):**

| Message | Điều kiện |
|---|---|
| `Graduated students are not eligible to participate` | `studentStanding = GRADUATED` |
| `Email domain is not allowed. Use a university email from the approved list.` | Email không khớp whitelist (`EXTERNAL_STUDENT`) |
| `University name is required` | Thiếu `universityName` |
| `University name does not match your email domain.` | `universityName` không khớp label của domain email |

**Ví dụ hợp lệ — FPT student:**
```json
{
  "email": "student@fpt.edu.vn",
  "password": "Password1",
  "fullName": "Tran Van B",
  "studentId": "SE123456",
  "userType": "FPT_STUDENT",
  "studentStanding": "ENROLLED"
}
```

---

## 4. External Event Enrollment (sửa)

### POST `/api/public/events/{eventId}/enrollments`

**Auth:** Public

Đăng ký tham gia event với tài khoản external tạm (không cần login trước).

**Request:**
```json
{
  "fullName": "Tran Thi B",
  "email": "student@hcmut.edu.vn",
  "studentId": "2012345",
  "universityName": "ĐH Bách khoa TP.HCM",
  "studentStanding": "ENROLLED"
}
```

| Field | Type | Required | Ghi chú |
|---|---|---|---|
| `fullName` | string | Yes | |
| `email` | string | Yes | Phải thuộc whitelist domain của event |
| `studentId` | string | Yes | |
| `universityName` | string | Yes | Phải khớp `universityLabel` của domain email |
| `studentStanding` | `"ENROLLED"` \| `"GRADUATED"` | Yes | Chỉ `ENROLLED` |

**Response `201`:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "eventId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "status": "PENDING",
    "enrolledAt": "2026-06-29T10:00:00",
    "userFullName": "Tran Thi B",
    "userEmail": "student@hcmut.edu.vn",
    "userStudentId": "2012345",
    "userUniversityName": "ĐH Bách khoa TP.HCM",
    "isLookingForTeam": false,
    "preferredRole": null
  }
}
```

**Errors (`400`):**
- `Graduated students are not eligible to participate`
- `Email domain is not allowed for this event. Use a university email from the approved list.`
- `University name does not match your email domain.`
- `No allowed email domains configured for this event. Contact the organizer.` (event `SEAL_RAG_2026` chưa có domain)

---

## 5. Logged-in Enrollment (behavior change)

### POST `/api/events/{eventId}/enrollments`

**Auth:** Bearer token (`FPT_STUDENT`, `EXTERNAL_STUDENT`)

Contract request/response **không đổi** (không có body).

**Behavior mới:**
- Reject nếu `user.studentStanding = GRADUATED` → `400`
- `EXTERNAL_STUDENT`: validate email domain theo whitelist event → `400` nếu không hợp lệ

---

## 6. Default domains — SEAL_RAG_2026 template

Seed khi tạo event `competitionFormat = SEAL_RAG_2026`. Cùng danh sách dùng cho `GET /api/public/registration/allowed-email-domains`.

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

## 7. User entity — `studentStanding` (mới)

| Value | Meaning |
|---|---|
| `ENROLLED` | Đang theo học (default) |
| `GRADUATED` | Đã tốt nghiệp — không được đăng ký / enroll |

Cột DB: `users.student_standing NVARCHAR(20) NOT NULL DEFAULT 'ENROLLED'`

---

## 8. Frontend mapping

```typescript
// types.ts
export type StudentStanding = "ENROLLED" | "GRADUATED";

// auth.api.ts
authApi.listRegistrationAllowedDomains();
authApi.register({ ..., studentStanding: "ENROLLED", universityName: "ĐH Bách khoa TP.HCM" });

// event.api.ts
eventApi.listPublicAllowedEmailDomains(eventId);
eventApi.listAllowedEmailDomains(eventId); // admin

// enrollment.api.ts
enrollmentApi.enrollExternal(eventId, {
  ...,
  studentStanding: "ENROLLED",
  universityName: "ĐH Bách khoa TP.HCM", // select từ whitelist, không free text
});

// lib/email-domain.ts — client-side validation helpers
matchesAllowedDomain(email, domains);
universityMatchesEmail(email, universityName, domains);
uniqueUniversityLabels(domains);
```

**UI thay đổi:**
- `/register` — `EXTERNAL_STUDENT`: dropdown chọn trường + hiển thị danh sách domain
- Event external registration form — dropdown trường thay cho text input
- Checkbox xác nhận đang theo học (map sang `studentStanding: "ENROLLED"`)

---

## 9. Admin / Coordinator UI (mới)

OC quản lý whitelist per-event qua panel dùng chung. Backend auth: `SYSTEM_ADMIN`, `EVENT_COORDINATOR`.

### Admin — event edit page

| Route | Component | Mô tả |
|---|---|---|
| `/admin/hackathons/[id]` | `AllowedEmailDomainsPanel` | Embed dưới `EventPhasePanel`, anchor `#allowed-email-domains` |
| `/admin/hackathons` action menu | — | Link "Email Domains" → edit page anchor |

**API dùng bởi panel** (request/response chi tiết ở **§1**):

- `GET /api/events/{eventId}/allowed-email-domains`
- `POST /api/events/{eventId}/allowed-email-domains`
- `DELETE /api/events/{eventId}/allowed-email-domains/{domainId}`

**Frontend files:**
- `frontend/src/features/events/components/allowed-email-domains-panel.tsx`
- `frontend/src/features/events/hooks/use-allowed-email-domains.ts`

### Coordinator — dedicated route

| Route | Component |
|---|---|
| `/coordinator/allowed-domains` | `AllowedEmailDomainsPage` (event selector + `AllowedEmailDomainsPanel`) |

Sidebar nav: **Email Domains** (gần Enrollments).

**Lưu ý:** Coordinator không vào được `/admin/*`; route riêng bắt buộc dù backend đã cho phép cùng API admin.

### Public read-only (forms)

| Route | Dùng cho |
|---|---|
| `GET /api/public/registration/allowed-email-domains` | `/register` — external student |
| `GET /api/public/events/{eventId}/allowed-email-domains` | Event external registration form |
