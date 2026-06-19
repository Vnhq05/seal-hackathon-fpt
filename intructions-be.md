## Kiến trúc tối ưu cho Java Spring Modulith

```text
hackathon-management-system
│
├── common
│
├── auth
│
├── user
│
├── event
│
├── team
│
├── submission
│
├── judging
│
├── ranking
│
├── notification
│
└── infrastructure
```

---

# 1. Common Module

Chứa các thành phần dùng chung.

```text
common
│
├── exception
├── constant
├── enums
├── dto
├── response
├── validation
├── util
└── base
```

Ví dụ:

```java
BaseEntity
ApiResponse
BusinessException

RoleType
UserStatus
RoundStatus
SubmissionStatus
```

---

# 2. Auth Module

## Chức năng

```text
Login
Register
JWT

Refresh Token

Forgot Password
Reset Password
```

## Package

```text
auth
│
├── controller
├── service
├── repository
├── dto
├── security
└── domain
```

## Entity

```java
UserAccount
RefreshToken
PasswordResetToken
```

---

# 3. User Module

## Chức năng

```text
Profile
Approval
Role Assignment
Participant Management
```

## Entity

```java
User
Role
UserRole
ApprovalRequest
```

---

# 4. Event Module

Đây là module trung tâm.

## Gom luôn

```text
Hackathon
Round
Track
Criteria
Mentor Assignment
Judge Assignment
```

Thay vì tách riêng Track và Criteria.

## Entity

```java
Hackathon

Round

Track

TrackMentor

JudgeAssignment

CriteriaTemplate

EventCriteria
```

---

# 5. Team Module

## Chức năng

```text
Create Team

Invite Member

Join Team

Register Track
```

## Entity

```java
Team

TeamMember

Invitation
```

---

# 6. Submission Module

## Chức năng

```text
Submit Project

Update Submission

Repository Metadata
```

## Entity

```java
Submission

SubmissionLink

RepositoryMetadata
```

---

# 7. Judging Module

## Chức năng

```text
Scoring

Judge Review

Score History
```

## Entity

```java
Score

ScoreDetail

Comment
```

Ví dụ:

```java
Score
    submissionId
    judgeId
    totalScore

ScoreDetail
    criterionId
    score
    comment
```

---

# 8. Ranking Module

## Chức năng

```text
Ranking

Promotion

Tie Break

Disqualification

Award
```

Award nên để chung Ranking.

## Entity

```java
Ranking

PromotionResult

Disqualification

Award
```

---

# 9. Notification Module

## Chức năng

```text
System Notification

Result Notification

Email Notification
```

## Entity

```java
Notification
```

---

# 10. Infrastructure Module

Toàn bộ kỹ thuật.

```text
infrastructure
│
├── config
├── security
├── mail
├── storage
├── cache
├── persistence
└── scheduler
```

---

# Cấu trúc package chuẩn cho từng module

Ví dụ module Team:

```text
team
│
├── api
│   ├── TeamController
│   └── TeamAdminController
│
├── application
│   ├── TeamService
│   ├── TeamCommandService
│   └── TeamQueryService
│
├── domain
│   ├── Team
│   ├── TeamMember
│   └── Invitation
│
├── repository
│   ├── TeamRepository
│   └── TeamMemberRepository
│
├── dto
│
└── mapper
```

---

# Database (MySQL/PostgreSQL)

Khoảng 25–35 bảng là hợp lý.

```text
users
roles
user_roles

hackathons
rounds
tracks

criteria_templates
criteria_items

event_criteria
event_criteria_items

teams
team_members
team_invitations

submissions
submission_links

judge_assignments

scores
score_details

rankings

promotion_results

awards

notifications

audit_logs
```

---

# Công nghệ nên dùng

### Backend

```text
Java 21

Spring Boot 3.5+

Spring Modulith

Spring Security

JWT

JPA/Hibernate

MapStruct

Validation

OpenAPI/Swagger
```

### Database

```text
PostgreSQL
```

### Dev Tools

```text
Lombok
Docker

Testcontainers

Flyway
```

### Không nên dùng

```text
Microservice
Kafka
Redis
RabbitMQ
```
