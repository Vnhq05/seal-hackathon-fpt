# SEAL Hackathon — Complete API Reference

Tổng hợp toàn bộ API từ 9 yêu cầu trong hội thoại.

## Tổng quan 9 yêu cầu

| # | Yêu cầu | Output |
|---|---|---|
| 1 | Phân tích BR-01→BR-57, bounded contexts, aggregates | Architecture report (text) |
| 2 | Thiết kế Spring Modulith architecture | `ARCHITECTURE.md` |
| 3 | Tạo folder structure đầy đủ | `FOLDER_STRUCTURE.md` |
| 4 | Tạo domain model (entities, enums) | 38 Java entity files |
| 5 | Tạo ERD, verify BR coverage | `ERD.md` |
| 6 | Implement Auth Module (BR-01→BR-07, BR-57) | 42 files (POM + common + auth) |
| 7 | Implement User Module (BR-01→BR-04) | 20 files |
| 8 | Implement Event Module (BR-08→BR-14) | 35 files |
| 9 | Implement Team Module (BR-15→BR-24) | 36 files |

## API tổng — 49 endpoints

> Base URL: `${NEXT_PUBLIC_API_URL}` (ví dụ: `http://localhost:8080/api`)
> Response wrapper: `{ success: boolean, message: string, data: T }`

---

## Module 1: AUTH (`/api/auth`) — Public, không cần token

| # | Method | Path | Request Body | Response Data | BR |
|---|---|---|---|---|---|
| 1 | POST | `/api/auth/register` | `RegisterRequest` | `UUID` (userId) | BR-01 |
| 2 | POST | `/api/auth/login` | `LoginRequest` | `AuthResponse` | BR-05, BR-06 |
| 3 | POST | `/api/auth/refresh` | `RefreshTokenRequest` | `AuthResponse` | BR-05 |
| 4 | POST | `/api/auth/logout` | `RefreshTokenRequest` | — | — |
| 5 | POST | `/api/auth/forgot-password` | `ForgotPasswordRequest` | — | BR-07 |
| 6 | POST | `/api/auth/reset-password` | `ResetPasswordRequest` | — | BR-07 |

### Request / Response Types

```typescript
// RegisterRequest
{ email: string, password: string, fullName: string, phone?: string,
  studentId?: string, universityName?: string,
  userType: "FPT_STUDENT" | "EXTERNAL_STUDENT" }

// LoginRequest
{ email: string, password: string }

// RefreshTokenRequest
{ refreshToken: string }

// ForgotPasswordRequest
{ email: string }

// ResetPasswordRequest
{ token: string, newPassword: string }

// AuthResponse
{ accessToken: string, refreshToken: string, expiresIn: number,
  tokenType: "Bearer",
  user: { id: string, email: string, fullName: string,
          userType: UserType, status: AccountStatus } }
```

---

## Module 2: USER PROFILE (`/api/users`) — Token required

| # | Method | Path | Request Body | Response Data | BR |
|---|---|---|---|---|---|
| 7 | GET | `/api/users/me` | — | `UserProfileResponse` | — |
| 8 | PUT | `/api/users/me` | `UpdateProfileRequest` | `UserProfileResponse` | — |
| 9 | PUT | `/api/users/me/password` | `ChangePasswordRequest` | — | BR-03 |

```typescript
// UpdateProfileRequest
{ fullName: string, phone?: string }

// ChangePasswordRequest
{ currentPassword: string, newPassword: string }

// UserProfileResponse
{ id: string, email: string, fullName: string, phone?: string,
  studentId?: string, universityName?: string,
  userType: UserType, status: AccountStatus, createdAt: string }
```

---

## Module 3: ADMIN USER (`/api/admin/users`) — SYSTEM_ADMIN only

| # | Method | Path | Query Params | Request Body | Response Data | BR |
|---|---|---|---|---|---|---|
| 10 | GET | `/api/admin/users` | `status?, userType?, search?, page, size, sort` | — | `Page<UserListResponse>` | — |
| 11 | GET | `/api/admin/users/pending` | `page, size` | — | `Page<UserListResponse>` | BR-01 |
| 12 | GET | `/api/admin/users/pending/count` | — | — | `number` | BR-01 |
| 13 | GET | `/api/admin/users/{userId}` | — | — | `UserProfileResponse` | — |
| 14 | POST | `/api/admin/users/approve` | — | `ApprovalRequest` | `UserProfileResponse` | BR-01 |
| 15 | POST | `/api/admin/users/internal` | — | `CreateInternalAccountRequest` | `UserProfileResponse` | BR-02 |

```typescript
// ApprovalRequest
{ userId: string, action: "APPROVE" | "REJECT", reason?: string }

// CreateInternalAccountRequest
{ email: string, password: string, fullName: string, phone?: string,
  userType: "MENTOR" | "JUDGE" | "LECTURER" | "EVENT_COORDINATOR" }

// UserListResponse
{ id: string, email: string, fullName: string,
  userType: UserType, status: AccountStatus, createdAt: string }
```

---

## Module 4: EVENTS (`/api/events`) — ADMIN/COORDINATOR for writes

| # | Method | Path | Request Body | Response Data | BR |
|---|---|---|---|---|---|
| 16 | POST | `/api/events` | `CreateEventRequest` | `EventResponse` | BR-08 |
| 17 | PUT | `/api/events/{eventId}` | `UpdateEventRequest` | `EventResponse` | BR-08 |
| 18 | POST | `/api/events/{eventId}/activate` | — | `EventResponse` | BR-08 |
| 19 | POST | `/api/events/{eventId}/complete` | — | `EventResponse` | — |
| 20 | POST | `/api/events/{eventId}/cancel` | — | `EventResponse` | — |
| 21 | GET | `/api/events/{eventId}` | — | `EventResponse` | — |
| 22 | GET | `/api/events` | `status?, page, size, sort` | `Page<EventResponse>` | — |

```typescript
// CreateEventRequest / UpdateEventRequest
{ name: string, season: string, year: number,
  startDate: string, endDate: string, registrationDeadline: string }

// EventResponse
{ id: string, name: string, season: string, year: number,
  startDate: string, endDate: string, registrationDeadline: string,
  status: "DRAFT"|"ACTIVE"|"COMPLETED"|"CANCELLED",
  roundCount: number, mentorCount: number, createdAt: string }
```

---

## Module 5: ROUNDS (`/api/events/{eventId}/rounds`)

| # | Method | Path | Request Body | Response Data | BR |
|---|---|---|---|---|---|
| 23 | POST | `/api/events/{eventId}/rounds` | `CreateRoundRequest` | `RoundResponse` | BR-09 |
| 24 | GET | `/api/events/{eventId}/rounds` | — | `RoundResponse[]` | — |
| 25 | GET | `/api/events/{eventId}/rounds/{roundId}` | — | `RoundResponse` | — |
| 26 | PUT | `/api/events/{eventId}/rounds/{roundId}` | `CreateRoundRequest` | `RoundResponse` | BR-09 |
| 27 | DELETE | `/api/events/{eventId}/rounds/{roundId}` | — | — | — |
| 28 | POST | `/api/events/{eventId}/rounds/{roundId}/reopen-scoring` | `LocalDateTime` | `RoundResponse` | BR-43 |

```typescript
// CreateRoundRequest
{ roundNumber: number, name: string,
  startDate: string, endDate: string,
  submissionDeadline: string, scoringDeadline: string,
  advancementCutoff: number }

// RoundResponse
{ id: string, eventId: string, roundNumber: number, name: string,
  startDate: string, endDate: string,
  submissionDeadline: string, scoringDeadline: string,
  advancementCutoff: number,
  criteria: CriteriaResponse[], judgeCount: number }
```

---

## Module 6: CRITERIA (`/api/rounds/{roundId}/criteria`)

| # | Method | Path | Request Body | Response Data | BR |
|---|---|---|---|---|---|
| 29 | GET | `/api/rounds/{roundId}/criteria` | — | `CriteriaResponse[]` | — |
| 30 | POST | `/api/rounds/{roundId}/criteria` | `CriteriaRequest` | `CriteriaResponse` | BR-11 |
| 31 | PUT | `/api/rounds/{roundId}/criteria/{criteriaId}` | `CriteriaRequest` | `CriteriaResponse` | BR-11 |
| 32 | PUT | `/api/rounds/{roundId}/criteria` | `CriteriaRequest[]` | `CriteriaResponse[]` | BR-11 |
| 33 | DELETE | `/api/rounds/{roundId}/criteria/{criteriaId}` | — | — | — |

```typescript
// CriteriaRequest
{ name: string, description?: string, weight: number, sortOrder?: number }

// CriteriaResponse
{ id: string, name: string, description?: string, weight: number, sortOrder: number }
```

---

## Module 7: ASSIGNMENTS (Judge + Mentor)

| # | Method | Path | Request Body | Response Data | BR |
|---|---|---|---|---|---|
| 34 | POST | `/api/events/{eventId}/rounds/{roundId}/judges` | `AssignJudgeRequest` | `JudgeAssignmentResponse` | BR-13 |
| 35 | GET | `/api/events/{eventId}/rounds/{roundId}/judges` | — | `JudgeAssignmentResponse[]` | — |
| 36 | DELETE | `/api/events/{eventId}/rounds/{roundId}/judges/{assignmentId}` | — | — | — |
| 37 | POST | `/api/events/{eventId}/mentors` | `AssignMentorRequest` | `MentorAssignmentResponse` | BR-14 |
| 38 | GET | `/api/events/{eventId}/mentors` | — | `MentorAssignmentResponse[]` | — |
| 39 | DELETE | `/api/events/{eventId}/mentors/{assignmentId}` | — | — | — |

```typescript
// AssignJudgeRequest
{ judgeUserId: string }

// AssignMentorRequest
{ mentorUserId: string }

// JudgeAssignmentResponse
{ id: string, roundId: string, judgeUserId: string,
  judgeFullName: string, judgeEmail: string, assignedAt: string }

// MentorAssignmentResponse
{ id: string, eventId: string, mentorUserId: string,
  mentorFullName: string, mentorEmail: string, assignedAt: string }
```

---

## Module 8: TEAMS (`/api/events/{eventId}/teams`)

| # | Method | Path | Request Body | Response Data | BR |
|---|---|---|---|---|---|
| 40 | POST | `/api/events/{eventId}/teams` | `CreateTeamRequest` | `TeamResponse` | BR-15, BR-16 |
| 41 | POST | `/api/events/{eventId}/teams/join` | `JoinTeamRequest` | `TeamResponse` | BR-16 |
| 42 | GET | `/api/events/{eventId}/teams` | `page, size` | `Page<TeamResponse>` | — |
| 43 | GET | `/api/events/{eventId}/teams/my-team` | — | `TeamResponse` | — |
| 44 | GET | `/api/events/{eventId}/teams/{teamId}` | — | `TeamResponse` | — |
| 45 | DELETE | `/api/events/{eventId}/teams/{teamId}/members/{memberId}` | — | `TeamResponse` | BR-20 |
| 46 | POST | `/api/events/{eventId}/teams/{teamId}/leave` | — | — | — |
| 47 | PUT | `/api/events/{eventId}/teams/{teamId}/leader/{newLeaderId}` | — | `TeamResponse` | BR-20 |
| 48 | POST | `/api/events/{eventId}/teams/mentor-team` | `AssignMentorTeamRequest` | — | BR-23 |
| 49 | DELETE | `/api/events/{eventId}/teams/mentor-team/{assignmentId}` | — | — | — |

```typescript
// CreateTeamRequest
{ name: string, eventId: string }

// JoinTeamRequest
{ teamId: string }

// AssignMentorTeamRequest
{ mentorUserId: string, teamId: string }

// TeamResponse
{ id: string, eventId: string, name: string, leaderId: string,
  status: "FORMING"|"CONFIRMED"|"DISBANDED",
  memberCount: number,
  members: TeamMemberResponse[], createdAt: string }

// TeamMemberResponse
{ id: string, userId: string, fullName: string, email: string,
  role: "LEADER"|"MEMBER", joinedAt: string }
```

---

## Module 9: INVITATIONS (`/api/invitations`)

| # | Method | Path | Request Body | Response Data | BR |
|---|---|---|---|---|---|
| 50 | POST | `/api/invitations/teams/{teamId}` | `SendInvitationRequest` | `InvitationResponse` | BR-21 |
| 51 | POST | `/api/invitations/{invitationId}/accept` | — | `InvitationResponse` | BR-21 |
| 52 | POST | `/api/invitations/{invitationId}/reject` | — | `InvitationResponse` | BR-21 |
| 53 | GET | `/api/invitations/my` | — | `InvitationResponse[]` | — |
| 54 | GET | `/api/invitations/teams/{teamId}` | — | `InvitationResponse[]` | — |

```typescript
// SendInvitationRequest
{ inviteeEmail: string }

// InvitationResponse
{ id: string, teamId: string, teamName: string, inviterId: string,
  inviteeEmail: string,
  status: "PENDING"|"ACCEPTED"|"REJECTED"|"EXPIRED",
  expiresAt: string, createdAt: string }
```

---

## So sánh Old Frontend → New Backend

| Frontend cũ (path) | Backend mới (path) | Thay đổi |
|---|---|---|
| `/auth/login` | `/api/auth/login` | Thêm prefix `/api` |
| `/auth/register` | `/api/auth/register` | Thêm prefix `/api` |
| `/auth/forgot-password` | `/api/auth/forgot-password` | Thêm prefix `/api` |
| `/auth/reset-password` | `/api/auth/reset-password` | Thêm prefix `/api` |
| `/auth/refresh` | `/api/auth/refresh` | Thêm prefix `/api`, cần body `{refreshToken}` |
| `/auth/logout` | `/api/auth/logout` | Thêm prefix `/api`, cần body `{refreshToken}` |
| `/profile/me` | `/api/users/me` | Path mới hoàn toàn |
| `/profile/me` (PUT) | `/api/users/me` | Path mới |
| `/profile/password` | `/api/users/me/password` | Path mới |
| `/admin/users` | `/api/admin/users` | Thêm prefix `/api` |
| `/admin/users/{id}/activate` | `/api/admin/users/approve` (POST body) | Logic thay đổi hoàn toàn |
| `/admin/hackathons` | `/api/events` | Đổi resource name |
| `/admin/rounds` | `/api/events/{eventId}/rounds` | Nested resource |
| `/admin/tracks` | Không tồn tại | Criteria thay tracks |
| `/teams` | `/api/events/{eventId}/teams` | Cần eventId |
| `/teams/me` | `/api/events/{eventId}/teams/my-team` | Cần eventId |
| `/teams/{id}/invites` | `/api/invitations/teams/{teamId}` | Path mới |

---

## Shared Enums (dùng chung frontend/backend)

```typescript
type UserType =
  | "FPT_STUDENT" | "EXTERNAL_STUDENT"
  | "MENTOR" | "JUDGE" | "LECTURER"
  | "EVENT_COORDINATOR" | "SYSTEM_ADMIN";

type AccountStatus = "PENDING" | "ACTIVE" | "REJECTED" | "LOCKED";

type EventStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";

type TeamStatus = "FORMING" | "CONFIRMED" | "DISBANDED";

type TeamMemberRole = "LEADER" | "MEMBER";

type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
```

---

## Cấu hình Axios

Tất cả response đều wrap trong:

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
```

Frontend cần extract `response.data.data` vì axios wrap thêm 1 lớp `.data`.

```typescript
// Pattern đúng:
const { data } = await apiClient.post<ApiResponse<AuthResponse>>("/api/auth/login", body);
return data.data; // ← AuthResponse
```
