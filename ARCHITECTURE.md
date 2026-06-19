# SEAL Hackathon — Spring Modulith Architecture

## 1. Package Structure

```text
com.sealhackathon
│
├── common                          ← Shared kernel (no business logic)
│   ├── entity                      BaseEntity (id, createdAt, updatedAt, createdBy, updatedBy)
│   ├── enums                       UserType, AccountStatus, global enums
│   ├── exception                   GlobalExceptionHandler, business exception hierarchy
│   ├── response                    ApiResponse<T> wrapper
│   ├── validation                  Custom validators (e.g. @ValidStudentId)
│   ├── config                      JPA auditing, Jackson, CORS
│   └── util                        DateUtils, SlugUtils, etc.
│
├── auth                            ← Authentication & token lifecycle
│   ├── controller                  AuthController
│   ├── service                     AuthService, AuthPublicService (interface)
│   ├── domain                      RefreshToken, PasswordResetToken
│   ├── repository                  RefreshTokenRepository, PasswordResetTokenRepository
│   ├── dto                         LoginRequest/Response, RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest
│   ├── mapper                      AuthMapper
│   ├── event                       UserLoggedInEvent, PasswordResetEvent
│   └── security                    JwtProvider, JwtAuthenticationFilter, CustomUserDetailsService, SecurityConfig
│
├── user                            ← User domain owner, profile, approval
│   ├── controller                  UserController, AdminUserController
│   ├── service                     UserService, UserPublicService (interface)
│   ├── domain                      User
│   ├── repository                  UserRepository
│   ├── dto                         UserProfileDto, CreateInternalAccountRequest, ApprovalRequest
│   ├── mapper                      UserMapper
│   └── event                       AccountApprovedEvent, AccountRejectedEvent, InternalAccountCreatedEvent
│
├── event                           ← Hackathon lifecycle, rounds, criteria, assignments
│   ├── controller                  EventController, RoundController, CriteriaController, AssignmentController
│   ├── service                     EventService, RoundService, CriteriaService, JudgeAssignmentService, MentorAssignmentService, EventPublicService (interface)
│   ├── domain                      HackathonEvent, Round, Criteria, JudgeAssignment, MentorAssignment
│   ├── repository                  HackathonEventRepository, RoundRepository, CriteriaRepository, JudgeAssignmentRepository, MentorAssignmentRepository
│   ├── dto                         CreateEventRequest, RoundDto, CriteriaDto, AssignJudgeRequest, AssignMentorRequest
│   ├── mapper                      EventMapper, RoundMapper, CriteriaMapper
│   └── event                       EventCreatedEvent, EventActivatedEvent, JudgeAssignedEvent, MentorAssignedEvent, ScoringWindowReopenedEvent
│
├── team                            ← Team formation, invitations, mentor-team pairing
│   ├── controller                  TeamController, InvitationController
│   ├── service                     TeamService, InvitationService, AutoMatchService, TeamPublicService (interface)
│   ├── domain                      Team, TeamMember, Invitation, MentorTeam
│   ├── repository                  TeamRepository, TeamMemberRepository, InvitationRepository, MentorTeamRepository
│   ├── dto                         CreateTeamRequest, JoinTeamRequest, InvitationDto, TeamDto
│   ├── mapper                      TeamMapper
│   └── event                       TeamCreatedEvent, TeamConfirmedEvent, MemberJoinedEvent, InvitationSentEvent
│
├── submission                      ← Submission lifecycle, validation, versioning
│   ├── controller                  SubmissionController
│   ├── service                     SubmissionService, SubmissionPublicService (interface)
│   ├── domain                      Submission, SubmissionVersion, SubmissionAttachment
│   ├── repository                  SubmissionRepository, SubmissionVersionRepository, SubmissionAttachmentRepository
│   ├── dto                         CreateSubmissionRequest, SubmissionDto, SubmissionVersionDto
│   ├── mapper                      SubmissionMapper
│   ├── validation                  GitHubUrlValidator, DemoUrlWhitelistValidator, PdfValidator
│   └── event                       SubmissionCreatedEvent, SubmissionUpdatedEvent
│
├── judging                         ← Scoring, comments, conflict detection
│   ├── controller                  JudgingController
│   ├── service                     JudgingService, ConflictDetectionService, JudgingPublicService (interface)
│   ├── domain                      JudgeScore, JudgeScoreDetail, JudgeComment
│   ├── repository                  JudgeScoreRepository, JudgeScoreDetailRepository, JudgeCommentRepository
│   ├── dto                         ScoreSubmissionRequest, ScoreDetailDto, JudgeScoreDto
│   ├── mapper                      JudgingMapper
│   └── event                       ScoreCreatedEvent, ScoreUpdatedEvent, ScoreDeletedEvent, ScoringCompletedEvent
│
├── ranking                         ← Aggregation, ranking, advancement, publish
│   ├── controller                  RankingController, ResultController
│   ├── service                     RankingService, AggregationService, AdvancementService, DisputeService
│   ├── domain                      Ranking, Advancement, PublishedResult, Dispute
│   ├── repository                  RankingRepository, AdvancementRepository, PublishedResultRepository, DisputeRepository
│   ├── dto                         RankingDto, AdvancementDto, PublishRequest, DisputeRequest
│   ├── mapper                      RankingMapper
│   └── event                       RankingRecalculatedEvent, ResultsPublishedEvent, DisputeFiledEvent
│
├── notification                    ← Email + in-app delivery (pure event consumer)
│   ├── controller                  NotificationController
│   ├── service                     NotificationService, EmailService
│   ├── domain                      Notification, NotificationRecipient
│   ├── repository                  NotificationRepository, NotificationRecipientRepository
│   ├── dto                         NotificationDto
│   ├── mapper                      NotificationMapper
│   └── listener                    NotificationEventListener
│
├── audit                           ← Immutable append-only log (pure event consumer)
│   ├── controller                  AuditController
│   ├── service                     AuditService
│   ├── domain                      AuditLog
│   ├── repository                  AuditLogRepository (save only — no update/delete)
│   ├── dto                         AuditLogDto, AuditExportRequest
│   ├── mapper                      AuditMapper
│   └── listener                    AuditEventListener
│
└── infrastructure                  ← Cross-cutting technical concerns
    ├── config                      WebConfig, AsyncConfig, EventConfig
    ├── mail                        MailSender abstraction
    └── storage                     FileStorageService (PDF uploads)
```

---

## 2. Module Boundaries & Responsibilities

### 2.1 `common` — Shared Kernel

| Aspect | Detail |
|---|---|
| **Type** | Library module (no Spring beans, no controllers) |
| **Owns** | BaseEntity, global enums (UserType, AccountStatus), ApiResponse wrapper, GlobalExceptionHandler, custom validation annotations |
| **Depended on by** | Every other module |
| **Depends on** | Nothing |
| **BR coverage** | None directly — provides building blocks |

### 2.2 `auth` — Authentication & Token Lifecycle

| Aspect | Detail |
|---|---|
| **Boundary** | Login, register, logout, refresh token, forgot/reset password, RBAC enforcement |
| **Owns** | RefreshToken, PasswordResetToken, SecurityConfig, JwtProvider, JwtAuthenticationFilter |
| **Reads from** | `user` module via `UserPublicService` (credential lookup, status check, lock state) |
| **Publishes** | UserLoggedInEvent, PasswordResetEvent |
| **Listens to** | — |
| **BR coverage** | BR-01 (registration flow), BR-03 (field validation), BR-04 (unique email — delegates to user), BR-05 (login), BR-06 (account lock), BR-07 (forgot password), BR-57 (RBAC filter chain) |

**Why auth does not own User:** User has a broader lifecycle (profile, approval, internal account management) that goes beyond authentication. Auth references User by ID and reads via UserPublicService.

### 2.3 `user` — User Domain Owner

| Aspect | Detail |
|---|---|
| **Boundary** | User entity ownership, profile CRUD, account approval/rejection, internal account creation |
| **Owns** | User entity (single source of truth for user data) |
| **Reads from** | Nothing |
| **Publishes** | AccountApprovedEvent, AccountRejectedEvent, InternalAccountCreatedEvent |
| **Listens to** | — |
| **BR coverage** | BR-01 (approval workflow), BR-02 (admin creates internal accounts), BR-03 (student ID validation), BR-04 (email uniqueness enforcement) |

### 2.4 `event` — Hackathon Lifecycle

| Aspect | Detail |
|---|---|
| **Boundary** | HackathonEvent CRUD, round management, criteria configuration, judge/mentor assignment |
| **Owns** | HackathonEvent, Round, Criteria, JudgeAssignment, MentorAssignment |
| **Reads from** | `user` via `UserPublicService` (validate judge/mentor role before assignment) |
| **Publishes** | EventCreatedEvent, EventActivatedEvent, JudgeAssignedEvent, MentorAssignedEvent, ScoringWindowReopenedEvent |
| **Listens to** | — |
| **BR coverage** | BR-08 (create/configure event), BR-09 (round date validation), BR-10 (unique event name), BR-11 (criteria weights = 100%), BR-12 (advancement cutoff), BR-13 (judge assignment per round), BR-14 (mentor assignment per event) |

### 2.5 `team` — Team Formation

| Aspect | Detail |
|---|---|
| **Boundary** | Team creation, join, invitations, member management, auto-matching, mentor-team pairing |
| **Owns** | Team, TeamMember, Invitation, MentorTeam |
| **Reads from** | `user` via `UserPublicService` (validate participant), `event` via `EventPublicService` (validate event exists, check registration deadline) |
| **Publishes** | TeamCreatedEvent, TeamConfirmedEvent, MemberJoinedEvent, InvitationSentEvent |
| **Listens to** | — |
| **BR coverage** | BR-15 (team size 3-5), BR-16 (two registration forms), BR-17 (auto-matching), BR-18 (one team per event), BR-19 (unique team name per event), BR-20 (unique leader), BR-21 (invitation system), BR-22 (team confirmed at 3-5), BR-23 (mentor-team), BR-24 (email confirmation) |

### 2.6 `submission` — Submission Lifecycle

| Aspect | Detail |
|---|---|
| **Boundary** | Submission creation, validation (GitHub URL, PDF, demo URL), versioning, attachment storage |
| **Owns** | Submission, SubmissionVersion, SubmissionAttachment |
| **Reads from** | `team` via `TeamPublicService` (verify leader, team membership), `event` via `EventPublicService` (validate round, check deadline) |
| **Publishes** | SubmissionCreatedEvent, SubmissionUpdatedEvent |
| **Listens to** | — |
| **BR coverage** | BR-25 (three components required), BR-26 (PDF ≤ 5MB), BR-27 (PDF ≤ 2 pages), BR-28 (demo URL whitelist), BR-29 (GitHub URL validation), BR-30 (version history), BR-31 (leader-only submission), BR-32 (deadline enforcement), BR-33 (mentor view access) |

### 2.7 `judging` — Scoring Engine

| Aspect | Detail |
|---|---|
| **Boundary** | Score entry per criteria, judge comments, conflict-of-interest detection, scoring timer, score locking |
| **Owns** | JudgeScore, JudgeScoreDetail, JudgeComment |
| **Reads from** | `event` via `EventPublicService` (criteria list, scoring deadline, judge assignments), `submission` via `SubmissionPublicService` (get submission to score), `team` via `TeamPublicService` (conflict-of-interest check — is judge a mentor of this team?) |
| **Publishes** | ScoreCreatedEvent, ScoreUpdatedEvent, ScoreDeletedEvent, ScoringCompletedEvent |
| **Listens to** | ScoringWindowReopenedEvent (from event) — unlocks scores for a round |
| **BR coverage** | BR-34 (conflict of interest), BR-35 (score 0-100), BR-36 (comment for <50 or >90), BR-37 (2h timer), BR-38 (min judge threshold), BR-39 (update before deadline), BR-40 (lock after deadline), BR-41 (scoring audit), BR-42 (coordinator view all), BR-43 (re-open window) |

### 2.8 `ranking` — Results & Advancement

| Aspect | Detail |
|---|---|
| **Boundary** | Score aggregation, ranking computation (weighted mean, trimmed mean, tie-break), advancement determination, result publication, dispute handling |
| **Owns** | Ranking, Advancement, PublishedResult, Dispute |
| **Reads from** | `judging` via `JudgingPublicService` (all scores for a round), `event` via `EventPublicService` (criteria weights, advancement cutoff), `submission` via `SubmissionPublicService` (submission status — exclude Pending/Not Scored) |
| **Publishes** | RankingRecalculatedEvent, ResultsPublishedEvent, DisputeFiledEvent |
| **Listens to** | ScoreCreatedEvent, ScoreUpdatedEvent, ScoreDeletedEvent (from judging) — triggers recalculation |
| **BR coverage** | BR-44 (score formula), BR-45 (mean aggregation), BR-46 (trimmed mean ≥ 5 judges), BR-47 (tie-break order), BR-48 (auto recalculation), BR-49 (advancement cutoff), BR-50 (exclude pending), BR-51 (publish action), BR-52 (email results), BR-56 (24h dispute window) |

### 2.9 `notification` — Delivery Engine

| Aspect | Detail |
|---|---|
| **Boundary** | Email and in-app notification delivery. Pure reactor — never drives business logic. |
| **Owns** | Notification, NotificationRecipient |
| **Reads from** | `user` via `UserPublicService` (resolve recipient email/name for delivery) |
| **Publishes** | — |
| **Listens to** | AccountApprovedEvent, AccountRejectedEvent, InternalAccountCreatedEvent, JudgeAssignedEvent, MentorAssignedEvent, TeamCreatedEvent, TeamConfirmedEvent, InvitationSentEvent, SubmissionCreatedEvent, ScoringWindowReopenedEvent, ResultsPublishedEvent |
| **BR coverage** | Supports BR-01 (approval email), BR-02 (credentials email), BR-13 (judge notification), BR-14 (mentor notification), BR-24 (team email), BR-43 (re-open notification), BR-52 (results email) |

### 2.10 `audit` — Immutable Log

| Aspect | Detail |
|---|---|
| **Boundary** | Append-only audit log. Write-only for all modules; read/export only for System Admin. |
| **Owns** | AuditLog |
| **Reads from** | — |
| **Publishes** | — |
| **Listens to** | All domain events that represent state mutations: score changes, submission status changes, account operations, login events, access-denied events, ranking changes, export requests |
| **BR coverage** | BR-53 (audit all critical ops), BR-54 (immutable — no update/delete), BR-55 (admin-only export, meta-logged) |

### 2.11 `infrastructure` — Technical Cross-Cutting

| Aspect | Detail |
|---|---|
| **Boundary** | Mail transport, file storage, async configuration. No business logic. |
| **Owns** | No entities |
| **Used by** | notification (mail sending), submission (PDF storage) |

---

## 3. Public Service Interfaces

Each module exposes **one** public service interface. This is the only way other modules may access its data. No repository, no entity, no internal service leaks across module boundaries.

### 3.1 `UserPublicService`

Consumed by: auth, event, team, submission, notification

```text
findByEmail(email)             → UserSnapshot?          Used by auth for login
findById(userId)               → UserSnapshot?          Used by event, team, notification
existsByEmail(email)           → boolean                Used by auth for registration (BR-04)
isActive(userId)               → boolean                Used by auth for login gate (BR-05)
getLockState(userId)            → LockState              Used by auth for lock check (BR-06)
incrementFailedAttempts(userId) → void                  Used by auth on failed login (BR-06)
resetFailedAttempts(userId)     → void                  Used by auth on successful login
lockAccount(userId, until)      → void                  Used by auth after 5 failures (BR-06)
createParticipant(request)      → UUID                  Used by auth for registration (BR-01)
createInternalAccount(request)  → UUID                  Used by user admin endpoint (BR-02)
approveAccount(userId)          → void                  Used by user admin endpoint (BR-01)
rejectAccount(userId, reason)   → void                  Used by user admin endpoint (BR-01)
hasRole(userId, role)           → boolean               Used by event for assignment validation
```

> **UserSnapshot** is a read-only DTO projected from User. The User entity never crosses the module boundary.

### 3.2 `AuthPublicService`

Consumed by: (minimal — most auth concerns are handled by the security filter chain)

```text
getCurrentUserId()              → UUID                  Extracted from SecurityContext
getCurrentUserRole()            → UserType              Extracted from SecurityContext
invalidateAllSessions(userId)   → void                  Used internally on password reset (BR-07)
```

### 3.3 `EventPublicService`

Consumed by: team, submission, judging, ranking

```text
getEvent(eventId)                       → EventSnapshot?
getRound(roundId)                       → RoundSnapshot?
getRoundsByEvent(eventId)               → List<RoundSnapshot>
getCriteriaByRound(roundId)             → List<CriteriaSnapshot>
getRegistrationDeadline(eventId)        → LocalDateTime       Used by team (BR-15 deadline)
getSubmissionDeadline(roundId)          → LocalDateTime       Used by submission (BR-32)
getScoringDeadline(roundId)             → LocalDateTime       Used by judging (BR-40)
getAdvancementCutoff(roundId)           → int                 Used by ranking (BR-49)
getJudgeAssignments(roundId)            → List<UUID>          Used by judging (BR-13)
getMentorAssignments(eventId)           → List<UUID>          Used by team (BR-14)
isJudgeAssignedToRound(judgeId, roundId) → boolean            Used by judging
isEventActive(eventId)                  → boolean
```

### 3.4 `TeamPublicService`

Consumed by: submission, judging

```text
getTeam(teamId)                         → TeamSnapshot?
getTeamByParticipantAndEvent(userId, eventId)  → TeamSnapshot?
isTeamLeader(userId, teamId)            → boolean             Used by submission (BR-31)
isTeamMember(userId, teamId)            → boolean
isMentorOfTeam(mentorId, teamId)        → boolean             Used by judging for conflict check (BR-34)
getTeamsByEvent(eventId)                → List<TeamSnapshot>
getTeamsByMentor(mentorId, eventId)     → List<TeamSnapshot>  Used by submission for mentor view (BR-33)
getTeamIdBySubmission(submissionId)     → UUID                Used by judging (BR-34 reverse lookup)
```

### 3.5 `SubmissionPublicService`

Consumed by: judging, ranking

```text
getSubmission(submissionId)             → SubmissionSnapshot?
getSubmissionsByRound(roundId)          → List<SubmissionSnapshot>
getSubmissionByTeamAndRound(teamId, roundId) → SubmissionSnapshot?
getSubmissionStatus(submissionId)       → SubmissionStatus    Used by ranking (BR-50)
getSubmittedAt(submissionId)            → LocalDateTime       Used by ranking for tie-break (BR-47)
```

### 3.6 `JudgingPublicService`

Consumed by: ranking

```text
getScoresBySubmission(submissionId)     → List<JudgeScoreSnapshot>
getScoresByRound(roundId)              → List<JudgeScoreSnapshot>
getScoreCountBySubmission(submissionId) → int                 Used by ranking (BR-38 threshold check)
getDetailedScores(submissionId)         → List<ScoreDetailSnapshot>  Per-criteria scores for aggregation
isFullyScored(submissionId, minJudges)  → boolean             Used by ranking (BR-50)
```

### 3.7 Modules with No Public Interface

| Module | Reason |
|---|---|
| `notification` | Pure consumer of events. Other modules trigger notifications by publishing domain events, not by calling notification methods. |
| `audit` | Pure consumer of events. Audit records are created by listening to domain events. The only read endpoint (export) is internal to audit module. |
| `ranking` | Ranking results are served by its own controller. No other module needs to query ranking programmatically. |
| `common` | Provides base classes and utilities via direct classpath dependency, not a service interface. |
| `infrastructure` | Provides technical services (mail, storage) used internally by notification and submission via direct injection within those modules, or via Spring abstractions. |

---

## 4. Domain Events

### 4.1 Event Catalog

#### Published by `user`

| Event | Payload | Triggered by | Consumers |
|---|---|---|---|
| `AccountApprovedEvent` | userId, email, fullName | Admin approves account (BR-01) | notification, audit |
| `AccountRejectedEvent` | userId, email, reason | Admin rejects account (BR-01) | notification, audit |
| `InternalAccountCreatedEvent` | userId, email, role | Admin creates internal account (BR-02) | notification, audit |
| `AccountLockedEvent` | userId, lockedUntil | 5 failed login attempts (BR-06) | audit |
| `ProfileUpdatedEvent` | userId, changedFields | User updates profile | audit |

#### Published by `auth`

| Event | Payload | Triggered by | Consumers |
|---|---|---|---|
| `UserLoggedInEvent` | userId, ipAddress, timestamp | Successful login (BR-05) | audit |
| `LoginFailedEvent` | email, ipAddress, attemptCount | Failed login (BR-06) | audit |
| `PasswordResetEvent` | userId, timestamp | Password reset completed (BR-07) | audit |
| `AccessDeniedEvent` | userId, endpoint, method, ipAddress | RBAC rejection (BR-57) | audit |

#### Published by `event`

| Event | Payload | Triggered by | Consumers |
|---|---|---|---|
| `EventCreatedEvent` | eventId, name, coordinatorId | Event creation (BR-08) | audit |
| `EventActivatedEvent` | eventId | Event status → Active (BR-08) | audit |
| `EventConfigChangedEvent` | eventId, field, oldValue, newValue | Config change after Active (BR-08) | audit |
| `JudgeAssignedEvent` | assignmentId, judgeId, roundId, eventId | Judge assigned to round (BR-13) | notification, audit |
| `MentorAssignedEvent` | assignmentId, mentorId, eventId | Mentor assigned to event (BR-14) | notification, audit |
| `ScoringWindowReopenedEvent` | roundId, newDeadline | Coordinator re-opens scoring (BR-43) | judging, notification, audit |

#### Published by `team`

| Event | Payload | Triggered by | Consumers |
|---|---|---|---|
| `TeamCreatedEvent` | teamId, eventId, leaderId, teamName | Team created (BR-15) | notification, audit |
| `TeamConfirmedEvent` | teamId, memberCount | Team reaches 3-5 members (BR-22) | notification, audit |
| `MemberJoinedEvent` | teamId, userId, role | Member joins team | audit |
| `MemberLeftEvent` | teamId, userId | Member removed or left | audit |
| `InvitationSentEvent` | invitationId, teamId, inviteeEmail | Leader sends invitation (BR-21) | notification |
| `InvitationAcceptedEvent` | invitationId, userId | Invitee accepts | audit |
| `InvitationRejectedEvent` | invitationId, userId | Invitee rejects | audit |
| `MentorTeamAssignedEvent` | mentorId, teamId | Mentor-team pairing (BR-23) | notification, audit |

#### Published by `submission`

| Event | Payload | Triggered by | Consumers |
|---|---|---|---|
| `SubmissionCreatedEvent` | submissionId, teamId, roundId, versionNumber | First submission (BR-25) | notification, audit |
| `SubmissionUpdatedEvent` | submissionId, teamId, newVersionNumber | Re-submission (BR-30) | audit |

#### Published by `judging`

| Event | Payload | Triggered by | Consumers |
|---|---|---|---|
| `ScoreCreatedEvent` | judgeScoreId, judgeId, submissionId, roundId | Judge submits score (BR-35) | ranking, audit |
| `ScoreUpdatedEvent` | judgeScoreId, judgeId, submissionId, roundId, changedCriteria | Judge updates score (BR-39) | ranking, audit |
| `ScoreDeletedEvent` | judgeScoreId, judgeId, submissionId, roundId | Score removed (admin action) | ranking, audit |
| `ScoringCompletedEvent` | submissionId, judgeCount | All assigned judges have scored | ranking |
| `ConflictDetectedEvent` | judgeId, teamId, submissionId | Conflict of interest blocked (BR-34) | audit |

#### Published by `ranking`

| Event | Payload | Triggered by | Consumers |
|---|---|---|---|
| `RankingRecalculatedEvent` | roundId, version, teamCount | Recalculation after score change (BR-48) | audit |
| `ResultsPublishedEvent` | roundId, publishedBy, publishedAt, disputeDeadline | Coordinator publishes (BR-51) | notification, audit |
| `DisputeFiledEvent` | disputeId, teamId, roundId, filedBy | Team leader disputes (BR-56) | notification, audit |
| `DisputeResolvedEvent` | disputeId, resolution, resolvedBy | Coordinator resolves dispute | audit |

### 4.2 Event Flow Summary

```text
user ──events──→ notification, audit
auth ──events──→ audit
event ─events──→ notification, audit, judging (ScoringWindowReopenedEvent)
team ──events──→ notification, audit
submission ────→ notification, audit
judging ───────→ ranking (score changes), notification, audit
ranking ───────→ notification (ResultsPublishedEvent), audit
```

### 4.3 Event Design Rules

| Rule | Rationale |
|---|---|
| Events carry IDs, not full entities | Consumer calls the appropriate PublicService if it needs more data. Keeps events lightweight. |
| Events are published after the transaction commits | Use `@TransactionalEventListener(phase = AFTER_COMMIT)` for notification/audit. Use `@TransactionalEventListener(phase = BEFORE_COMMIT)` only for ranking recalculation where transactional consistency matters. |
| Event names are past-tense | `ScoreCreatedEvent`, not `CreateScoreEvent`. Events describe something that already happened. |
| No event chaining beyond 2 hops | Maximum: Module A → event → Module B → event → Module C. Prevents hidden cascades. |

---

## 5. Dependency Diagram

### 5.1 Synchronous Dependencies (Public Service Calls)

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         COMMON (shared kernel)                      │
│           BaseEntity · Enums · ApiResponse · Validation             │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ (classpath dependency from all modules)
                              │
           ┌──────────────────┼───────────────────────────────────┐
           │                  │                                   │
     ┌─────▼─────┐     ┌─────▼─────┐                             │
     │           │     │           │                             │
     │   USER    │     │   AUTH    │                             │
     │           │◄────│           │                             │
     │ (entity   │     │ (tokens,  │                             │
     │  owner)   │     │  security)│                             │
     └─────▲─────┘     └───────────┘                             │
           │                                                     │
     ┌─────┴─────┐                                               │
     │           │                                               │
     │   EVENT   │                                               │
     │           │                                               │
     │ (hackathon│                                               │
     │  rounds,  │                                               │
     │  criteria)│                                               │
     └─────▲─────┘                                               │
           │                                                     │
     ┌─────┴─────┐                                               │
     │           │                                               │
     │   TEAM   ├───────► user (validate participant)            │
     │           │───────► event (registration deadline)          │
     └─────▲─────┘                                               │
           │                                                     │
     ┌─────┴──────┐                                              │
     │            │                                              │
     │ SUBMISSION ├──────► team  (verify leader)                 │
     │            │──────► event (round deadline)                 │
     └─────▲──────┘                                              │
           │                                                     │
     ┌─────┴─────┐                                               │
     │           │                                               │
     │  JUDGING  ├───────► event      (criteria, deadline)       │
     │           │───────► submission  (get submission)           │
     │           │───────► team       (conflict check)           │
     └─────▲─────┘                                               │
           │                                                     │
     ┌─────┴─────┐                                               │
     │           │                                               │
     │  RANKING  ├───────► judging    (scores)                   │
     │           │───────► event      (weights, cutoff)          │
     │           │───────► submission  (status, submittedAt)     │
     └───────────┘                                               │
                                                                 │
     ┌──────────────┐  ┌─────────┐  ┌────────────────┐          │
     │ NOTIFICATION │  │  AUDIT  │  │ INFRASTRUCTURE │          │
     │  (listens)   │  │(listens)│  │   (technical)  │──────────┘
     └──────────────┘  └─────────┘  └────────────────┘
```

### 5.2 Asynchronous Dependencies (Domain Events)

```text
                    ┌───────────────────────┐
                    │        AUDIT          │
                    │   (universal sink)    │
                    └───────────▲───────────┘
                                │
         ALL modules publish ───┘ (every state mutation)
                                
                    ┌───────────────────────┐
                    │     NOTIFICATION      │
                    │   (selective sink)    │
                    └───────────▲───────────┘
                                │
     ┌──────┬───────┬───────┬───┴──┬──────────┐
     │      │       │       │      │          │
   user   event   team  submis-  judging   ranking
                          sion   (re-open)  (publish)

                    ┌───────────────────────┐
                    │       RANKING         │
                    │  (recalculation)      │
                    └───────────▲───────────┘
                                │
                             judging
                    (ScoreCreated/Updated/Deleted)
                    
                    ┌───────────────────────┐
                    │       JUDGING         │
                    │   (unlock scores)     │
                    └───────────▲───────────┘
                                │
                              event
                    (ScoringWindowReopenedEvent)
```

### 5.3 Dependency Matrix (Synchronous)

Consumer ↓ calls → Provider

| | user | auth | event | team | submission | judging | ranking | notification | audit |
|---|---|---|---|---|---|---|---|---|---|
| **auth** | **R** | — | — | — | — | — | — | — | — |
| **event** | **R** | — | — | — | — | — | — | — | — |
| **team** | **R** | — | **R** | — | — | — | — | — | — |
| **submission** | — | — | **R** | **R** | — | — | — | — | — |
| **judging** | — | — | **R** | **R** | **R** | — | — | — | — |
| **ranking** | — | — | **R** | — | **R** | **R** | — | — | — |
| **notification** | **R** | — | — | — | — | — | — | — | — |

**R** = reads via PublicService interface. No module writes to another module's data.

### 5.4 Topological Order (Build / Test Order)

```text
Level 0:  common
Level 1:  user, infrastructure
Level 2:  auth, event
Level 3:  team, notification, audit
Level 4:  submission
Level 5:  judging
Level 6:  ranking
```

Modules at the same level have no mutual dependencies and can be built/tested in parallel.

---

## 6. Spring Modulith Verification

The architecture above is designed to pass `ApplicationModules.of(SealhackathonApplication.class).verify()`. The verification checks:

| Check | How this architecture satisfies it |
|---|---|
| **No cyclic dependencies** | The dependency graph is a strict DAG (see topological order above). |
| **No illegal cross-module access** | All cross-module communication goes through `*PublicService` interfaces or domain events. No repository, entity, or internal service is exposed. |
| **Named interfaces** | Each module's `service` package contains at most one `*PublicService` interface. Internal services are package-private or not in the public API package. |
| **Event listeners are registered** | All `@TransactionalEventListener` methods are in dedicated `listener` classes within consuming modules. |

---

## 7. Module Communication Patterns

### Pattern 1: Synchronous Query (PublicService)

Used when a module needs data from another module **within the same request** to enforce a business rule.

```text
Example: Judging checks conflict of interest (BR-34)

JudgingService
  → TeamPublicService.isMentorOfTeam(judgeId, teamId)
  → if true: throw ConflictOfInterestException
```

### Pattern 2: Asynchronous Reaction (Domain Event)

Used when a state change in one module should trigger a **side effect** in another module, without the publisher knowing or caring about the consumer.

```text
Example: Score change triggers ranking recalculation (BR-48)

JudgingService
  → saves JudgeScore
  → publishes ScoreCreatedEvent

RankingEventListener (in ranking module)
  → listens to ScoreCreatedEvent
  → calls AggregationService.recalculate(roundId)
```

### Pattern 3: Event-Driven Notification (Fire and Forget)

All notification triggers follow this pattern. The publishing module never references the notification module.

```text
Example: Results published → email all teams (BR-52)

RankingService
  → creates PublishedResult
  → publishes ResultsPublishedEvent { roundId, publishedAt }

NotificationEventListener (in notification module)
  → listens to ResultsPublishedEvent
  → resolves team leaders via UserPublicService
  → sends emails via infrastructure.mail
```

### Pattern 4: Audit Logging (Universal Listener)

The audit module subscribes to all mutation events. Publishing modules are unaware of auditing.

```text
AuditEventListener
  → listens to: all *CreatedEvent, *UpdatedEvent, *DeletedEvent, AccessDeniedEvent
  → writes AuditLog { actorId, action, targetId, oldValue, newValue, timestamp, ip }
  → repository exposes save() only — no update/delete methods
```

---

## 8. Key Boundaries Summary

| Boundary Decision | Rationale |
|---|---|
| User entity owned by `user`, not `auth` | User lifecycle (profile, approval) extends beyond authentication. Auth reads user via public interface. |
| Criteria owned by `event`, not `judging` | Criteria are configured during event setup (Phase 1). Judging only reads criteria to validate scores. |
| MentorTeam owned by `team`, not `event` | Mentor-team pairing is a team-formation concern (BR-23). Event only tracks which mentors are available (MentorAssignment). |
| Dispute owned by `ranking`, not a separate module | Disputes are tightly coupled to published results and the 24h window (BR-56). Not enough complexity to warrant a separate bounded context. |
| Notification has no public interface | It is a pure reactor. If a module needs to "send a notification," it publishes a domain event describing what happened — the notification module decides how to deliver it. |
| Audit has no public interface for writes | All audit entries come from domain events. The only endpoint is the admin export (BR-55), which is internal to the audit module. |

This completes the Spring Modulith architecture design. Every module boundary, public interface, and domain event traces back to specific business rules (BR-01 through BR-57) from the source documents.