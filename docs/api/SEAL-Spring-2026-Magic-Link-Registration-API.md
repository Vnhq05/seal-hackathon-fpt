# SEAL Spring 2026 — Magic Link Registration API

> Ref: [`Feedback.md`](../../Feedback.md) — sinh viên vãng lai đăng ký qua email + magic link  
> Base URL: `/api` · Auth: **không cần** (public endpoints)  
> Related: [`SEAL-Spring-2026-External-Student-Verification-API.md`](./SEAL-Spring-2026-External-Student-Verification-API.md) · [`SEAL-Spring-2026-API-Reference.md`](./SEAL-Spring-2026-API-Reference.md)

---

## 1. Tổng quan

| Khái niệm | Mô tả |
|---|---|
| **Magic Link** | Link một lần, TTL 30 phút, lưu DB (`event_magic_tokens`) |
| **Luồng** | Landing page → POST register → email HTML → GET magic-login → JWT session |
| **Phạm vi** | Chỉ tạo/kích hoạt `User` (`EXTERNAL_STUDENT`). **Không** tự động tạo `EventEnrollment` |

### Luồng nghiệp vụ

```text
1. Visitor nhập fullName, email, studentId, universityName trên landing page
2. POST /api/public/events/{eventId}/register
3. Backend validate event OPEN + email domain allowlist
4. Tạo hoặc tìm user → gửi email HTML chứa magic link
5. User click link → frontend gọi GET /api/auth/magic-login?token=...
6. Backend kích hoạt tài khoản (PENDING → ACTIVE) + trả AuthResponse (giống login)
7. Frontend lưu token, user tiếp tục enroll / lập team (flow riêng)
```

### Business rules

| Rule | Chi tiết |
|---|---|
| Event status | Resolved status phải là `OPEN` (`registrationOpenDate` đã tới) |
| Email domain | Validate theo allowlist per-event (`AllowedEmailDomain`) |
| User mới | `userType = EXTERNAL_STUDENT`, `status = PENDING`, `temporaryAccount = true` |
| User ACTIVE (external) | Resend magic link, không tạo user mới |
| User PENDING (external) | Resend magic link |
| User REJECTED | `403 Forbidden` |
| User non-external (FPT, lecturer, …) | `409 Conflict` |
| Token | Single-use, scoped theo `userId + eventId`, TTL = `app.magic-link.expiration-minutes` (30) |
| Enrollment | Không tự động — dùng `POST /api/public/events/{eventId}/enrollments` sau khi đã login |

---

## 2. Endpoints đã thêm (không sửa endpoint auth hiện có)

| Method | Path | Mô tả |
|---|---|---|
| **POST** | `/api/public/events/{eventId}/register` | Gửi email magic link đăng ký |
| **GET** | `/api/auth/magic-login?token={token}` | Hoàn tất đăng ký + cấp JWT |

Các endpoint auth hiện có (`/register`, `/login`, `/refresh`, …) **không thay đổi**.

---

## 3. POST `/api/public/events/{eventId}/register`

Gửi email chứa magic link đăng ký cho sinh viên vãng lai.

**Auth:** Không cần

### Path parameters

| Param | Type | Required | Mô tả |
|---|---|---|---|
| `eventId` | UUID | Yes | ID sự kiện |

### Request body

```json
{
  "fullName": "Nguyen Van A",
  "email": "example@student.iuh.edu.vn",
  "studentId": "20065321",
  "universityName": "IUH"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `fullName` | string | Yes | `@NotBlank` |
| `email` | string | Yes | `@NotBlank`, `@Email` — normalize lowercase |
| `studentId` | string | No | Dùng khi tạo user mới |
| `universityName` | string | No | Nếu có: phải khớp `universityLabel` của domain email |

### Response `201 Created`

```json
{
  "success": true,
  "message": "Registration email sent. Check your inbox.",
  "data": null
}
```

### Error responses

**`400 Bad Request`** — Event không OPEN:

```json
{
  "success": false,
  "message": "Event is not open for registration"
}
```

**`400 Bad Request`** — Email domain không hợp lệ:

```json
{
  "success": false,
  "message": "Email domain is not allowed for this event. Use a university email from the approved list."
}
```

**`400 Bad Request`** — University không khớp domain:

```json
{
  "success": false,
  "message": "University name does not match the email domain"
}
```

**`404 Not Found`** — Event không tồn tại:

```json
{
  "success": false,
  "message": "Event not found with id: {eventId}"
}
```

**`403 Forbidden`** — Tài khoản bị từ chối:

```json
{
  "success": false,
  "message": "Account registration was rejected"
}
```

**`409 Conflict`** — Email đã dùng cho loại tài khoản khác:

```json
{
  "success": false,
  "message": "Email already registered with a different account type"
}
```

**`400 Bad Request`** — Validation lỗi:

```json
{
  "success": false,
  "message": "email: must be a well-formed email address; fullName: must not be blank"
}
```

### Email gửi đi

| Thuộc tính | Giá trị |
|---|---|
| Subject | `[SEAL Hackathon] Your Registration Link — {eventName}` |
| Format | HTML branded `#5b5bd6` |
| CTA | `{frontendUrl}/magic-login?token={token}` |
| Expiry notice | Link expires in 30 minutes |
| Fallback | Plain-text URL dưới button |

---

## 4. GET `/api/auth/magic-login?token={token}`

Xác thực magic link, kích hoạt tài khoản và trả JWT session (cùng shape với `POST /api/auth/login`).

**Auth:** Không cần

### Query parameters

| Param | Type | Required | Mô tả |
|---|---|---|---|
| `token` | string | Yes | UUID token từ email |

### Response `200 OK`

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "expiresIn": 900,
    "tokenType": "Bearer",
    "user": {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "email": "example@student.iuh.edu.vn",
      "fullName": "Nguyen Van A",
      "userType": "EXTERNAL_STUDENT",
      "status": "ACTIVE"
    }
  }
}
```

| Field | Type | Mô tả |
|---|---|---|
| `accessToken` | string | JWT access token |
| `refreshToken` | string | Refresh token (DB-backed) |
| `expiresIn` | number | Access token TTL (giây), mặc định 900 |
| `tokenType` | string | Luôn `"Bearer"` |
| `user` | object | Thông tin user sau kích hoạt (`status` = `ACTIVE`) |

### Error responses

**`400 Bad Request`** — Token không hợp lệ hoặc đã dùng:

```json
{
  "success": false,
  "message": "Invalid or already-used link."
}
```

**`410 Gone`** — Token hết hạn:

```json
{
  "success": false,
  "message": "This link has expired. Please register again."
}
```

**`403 Forbidden`** — Tài khoản bị khóa (BR-06):

```json
{
  "success": false,
  "message": "Account is locked until {datetime}. Please try again later."
}
```

---

## 5. Cấu hình

[`application.yml`](../../backend/src/main/resources/application.yml):

```yaml
app:
  magic-link:
    expiration-minutes: 30
  frontend:
    url: ${FRONTEND_URL:http://localhost:3000}
```

### Database migration

Chạy thủ công trên SQL Server trước khi start app:

[`backend/src/main/resources/db/event_magic_tokens.sql`](../../backend/src/main/resources/db/event_magic_tokens.sql)

---

## 6. Security

| Path | Access |
|---|---|
| `POST /api/public/events/{eventId}/register` | `permitAll` (via `/api/public/**`) |
| `GET /api/auth/magic-login` | `permitAll` (via `/api/auth/**`) |

---

## 7. Files liên quan

| Layer | File |
|---|---|
| Entity | `auth/domain/EventMagicToken.java` |
| Repository | `auth/repository/EventMagicTokenRepository.java` |
| Token service | `auth/service/MagicLinkTokenService.java` |
| Registration | `event/service/PublicRegistrationServiceImpl.java` |
| Controller | `event/controller/PublicEventController.java`, `auth/controller/AuthController.java` |
| Email | `auth/service/AuthEmailService.java`, `infrastructure/mail/SmtpMailSender.java` |
