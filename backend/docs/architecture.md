# Architecture

## Overview

The system follows a **Modular Monolith** architecture using **Spring Modulith** with **DDD Lite** patterns. The database schema is generated from JPA entities (Code First). Modules communicate through **Public Service Interfaces** (synchronous) and **Domain Events** (asynchronous).

## Core Principles

| Principle | Implementation |
|---|---|
| Modular Monolith | Spring Modulith with verified module boundaries |
| DDD Lite | Aggregate Roots, Entities, Value Objects, Domain Events |
| Code First | JPA/Hibernate generates schema from entities |
| CQRS-light | Public Services for queries, Domain Events for reactions |
| Immutable Audit | Append-only audit log, no update/delete |

## Module Responsibilities

### Common (Shared Kernel)

No business logic. Provides `BaseEntity` (UUID, audit timestamps), global enums (`UserType`, `AccountStatus`), `ApiResponse<T>` wrapper, exception hierarchy, custom validators, JPA auditing config.

### Auth

**Owns:** RefreshToken, PasswordResetToken, SecurityConfig, JwtProvider
**BR:** BR-01 to BR-07, BR-57

Handles registration (participant self-register → Pending), login (JWT + refresh token), logout, forgot/reset password, RBAC filter chain. Account locking after 5 failed attempts in 15-min window.

### User

**Owns:** User entity (single source of truth)
**BR:** BR-01 to BR-04

Profile CRUD, account approval/rejection by admin, internal account creation (Mentor/Judge/Lecturer/Coordinator). Publishes AccountApprovedEvent, AccountRejectedEvent, InternalAccountCreatedEvent.

### Event

**Owns:** HackathonEvent, Round, Criteria, JudgeAssignment, MentorAssignment
**BR:** BR-08 to BR-14

Event lifecycle (Draft → Active → Completed), round management with date validation and overlap prevention, criteria configuration with weight-sum enforcement (=100%), judge assignment per round, mentor assignment per event.

### Team

**Owns:** Team, TeamMember, Invitation, MentorTeam
**BR:** BR-15 to BR-24

Team creation/join (two forms), invitation workflow (send/accept/reject), auto-matching for solo registrants, mentor-team pairing. Enforces team size 3–5, one team per event per participant, unique team name per event.

### Submission

**Owns:** Submission, SubmissionVersion, SubmissionAttachment
**BR:** BR-25 to BR-33

Multipart submission (GitHub URL + PDF + Demo video URL), URL validation (GitHub regex, demo whitelist), PDF validation (≤5MB, ≤2 pages), version history (append-only), leader-only submission, deadline enforcement.

### Judging

**Owns:** JudgeScore, JudgeScoreDetail, JudgeComment
**BR:** BR-34 to BR-43

Score entry per criteria (0–100), conflict-of-interest detection (judge cannot score mentored team), mandatory comments for extreme scores (<50 or >90), 2-hour scoring timer, score locking after deadline, re-open scoring window.

### Ranking

**Owns:** Ranking, Advancement, PublishedResult, Dispute
**BR:** BR-44 to BR-52, BR-56

Score aggregation (weighted mean), trimmed mean (≥5 judges), tie-break (criteria order → submittedAt), auto-recalculation on score changes, advancement by cutoff, result publication, 24-hour dispute window.

### Notification

**Owns:** Notification, NotificationRecipient
Event-driven (pure consumer)

Dual-channel delivery (EMAIL + IN_APP). Subscribes to 13 domain events from all modules. Async email via SMTP.

### Audit

**Owns:** AuditLog (immutable)
**BR:** BR-53 to BR-55

Append-only repository (extends `Repository`, not `JpaRepository` — no delete/update). Subscribes to 27 domain events. Export CSV/JSON (admin only, export itself meta-logged).

## Cross-Module Communication

### Synchronous: Public Service Interfaces

Each module exposes at most one `*PublicService` interface. Consumers inject the interface, never the repository or entity.

| Interface | Consumed By |
|---|---|
| `UserPublicService` | auth, event, team, notification |
| `EventPublicService` | team, submission, judging, ranking |
| `TeamPublicService` | submission, judging, ranking |
| `SubmissionPublicService` | judging, ranking |
| `JudgingPublicService` | ranking |

### Asynchronous: Domain Events

31 domain events flow between modules. Key flows:

- `ScoreCreated/Updated/DeletedEvent` → `RankingEventListener` triggers recalculation
- `ScoringWindowReopenedEvent` → `JudgingEventListener` unlocks scores
- All mutation events → `AuditEventListener` (universal sink)
- Notification-triggering events → `NotificationEventListener` (selective sink)

## Security Architecture

| Component | Purpose |
|---|---|
| `SecurityConfig` | Filter chain, URL-level RBAC, stateless sessions |
| `JwtProvider` | Token generation/validation (HMAC-SHA, 15-min access) |
| `JwtAuthenticationFilter` | Extracts Bearer token, sets SecurityContext |
| `CustomUserDetailsService` | Loads user via `UserPublicService` |
| `@PreAuthorize` | Method-level RBAC on controllers |

### Token Lifecycle

```
Login → JWT access (15 min) + Refresh token (7 days)
Refresh → New access + new refresh (old revoked)
Logout → Revoke refresh token
Password Reset → Revoke ALL refresh tokens (BR-07)
```

## Data Architecture

- **UUID primary keys** on all entities
- **FetchType.LAZY** everywhere (no eager loading)
- **No @ManyToMany** — all M:N via join entities
- **Cross-module references** use UUID columns (no JPA FK)
- **Intra-module parent-child** uses `@ManyToOne`/`@OneToMany` with cascade
- **AuditLog** does not extend BaseEntity (immutable, no updatedAt)
