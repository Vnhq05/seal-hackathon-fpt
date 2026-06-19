# SEAL Hackathon — Complete Backend Folder Structure

## Maven Project Root

```text
seal-hackathon/
├── pom.xml                                          ← Parent POM (Spring Boot 3.5+, Java 21, Spring Modulith BOM)
├── mvnw / mvnw.cmd                                  ← Maven wrapper
├── .mvn/
│   └── wrapper/
│       └── maven-wrapper.properties
│
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/sealhackathon/
│   │   │       │
│   │   │       ├── SealhackathonApplication.java     ← @SpringBootApplication entry point
│   │   │       ├── package-info.java                 ← Spring Modulith root marker
│   │   │       │
│   │   │       │
│   │   │       │ ══════════════════════════════════════════════
│   │   │       │  COMMON — Shared Kernel (no Spring beans)
│   │   │       │ ══════════════════════════════════════════════
│   │   │       │
│   │   │       ├── common/
│   │   │       │   ├── package-info.java
│   │   │       │   │
│   │   │       │   ├── entity/
│   │   │       │   │   └── BaseEntity.java                   ← @MappedSuperclass: id, createdAt, updatedAt, createdBy, updatedBy
│   │   │       │   │
│   │   │       │   ├── enums/
│   │   │       │   │   ├── UserType.java                     ← FPT_STUDENT, EXTERNAL_STUDENT, MENTOR, JUDGE, LECTURER, EVENT_COORDINATOR, SYSTEM_ADMIN
│   │   │       │   │   └── AccountStatus.java                ← PENDING, ACTIVE, REJECTED, LOCKED
│   │   │       │   │
│   │   │       │   ├── exception/
│   │   │       │   │   ├── GlobalExceptionHandler.java       ← @RestControllerAdvice
│   │   │       │   │   ├── BusinessException.java            ← Abstract base for all business exceptions
│   │   │       │   │   ├── ResourceNotFoundException.java
│   │   │       │   │   ├── DuplicateResourceException.java
│   │   │       │   │   ├── AccessDeniedException.java
│   │   │       │   │   └── ValidationException.java
│   │   │       │   │
│   │   │       │   ├── response/
│   │   │       │   │   └── ApiResponse.java                  ← { success, message, data } wrapper
│   │   │       │   │
│   │   │       │   ├── validation/
│   │   │       │   │   ├── ValidStudentId.java               ← Custom annotation for SE + 6 digits
│   │   │       │   │   └── StudentIdValidator.java           ← ConstraintValidator implementation
│   │   │       │   │
│   │   │       │   ├── config/
│   │   │       │   │   ├── JpaAuditingConfig.java            ← @EnableJpaAuditing, AuditorAware bean
│   │   │       │   │   ├── JacksonConfig.java                ← ObjectMapper customization
│   │   │       │   │   └── CorsConfig.java                   ← CORS configuration
│   │   │       │   │
│   │   │       │   └── util/
│   │   │       │       └── DateTimeUtils.java
│   │   │       │
│   │   │       │
│   │   │       │ ══════════════════════════════════════════════
│   │   │       │  AUTH — Authentication & Token Lifecycle
│   │   │       │  BR-01, BR-03, BR-04, BR-05, BR-06, BR-07, BR-57
│   │   │       │ ══════════════════════════════════════════════
│   │   │       │
│   │   │       ├── auth/
│   │   │       │   ├── package-info.java
│   │   │       │   │
│   │   │       │   │── controller/
│   │   │       │   │   └── AuthController.java               ← /api/auth/** (login, register, refresh, logout, forgot-password, reset-password)
│   │   │       │   │
│   │   │       │   ├── service/
│   │   │       │   │   ├── AuthPublicService.java            ← Interface: getCurrentUserId(), getCurrentUserRole(), invalidateAllSessions()
│   │   │       │   │   ├── AuthPublicServiceImpl.java        ← Implementation
│   │   │       │   │   ├── AuthService.java                  ← Internal: login, register, refresh, forgot/reset password logic
│   │   │       │   │   └── TokenService.java                 ← Internal: refresh token + password reset token CRUD
│   │   │       │   │
│   │   │       │   ├── domain/
│   │   │       │   │   ├── RefreshToken.java                 ← @Entity: id, token, userId, expiresAt, revoked
│   │   │       │   │   └── PasswordResetToken.java           ← @Entity: id, token, userId, expiresAt, used
│   │   │       │   │
│   │   │       │   ├── repository/
│   │   │       │   │   ├── RefreshTokenRepository.java
│   │   │       │   │   └── PasswordResetTokenRepository.java
│   │   │       │   │
│   │   │       │   ├── dto/
│   │   │       │   │   ├── request/
│   │   │       │   │   │   ├── LoginRequest.java             ← email, password
│   │   │       │   │   │   ├── RegisterRequest.java          ← email, password, fullName, phone, studentId, universityName, userType
│   │   │       │   │   │   ├── RefreshTokenRequest.java      ← refreshToken
│   │   │       │   │   │   ├── ForgotPasswordRequest.java    ← email
│   │   │       │   │   │   └── ResetPasswordRequest.java     ← token, newPassword
│   │   │       │   │   │
│   │   │       │   │   └── response/
│   │   │       │   │       ├── AuthResponse.java             ← accessToken, refreshToken, expiresIn
│   │   │       │   │       └── UserInfoResponse.java         ← id, email, fullName, userType, status
│   │   │       │   │
│   │   │       │   ├── mapper/
│   │   │       │   │   └── AuthMapper.java                   ← @Mapper (MapStruct)
│   │   │       │   │
│   │   │       │   ├── event/
│   │   │       │   │   ├── UserLoggedInEvent.java            ← userId, ipAddress, timestamp
│   │   │       │   │   ├── LoginFailedEvent.java             ← email, ipAddress, attemptCount
│   │   │       │   │   ├── PasswordResetEvent.java           ← userId, timestamp
│   │   │       │   │   └── AccessDeniedEvent.java            ← userId, endpoint, method, ipAddress
│   │   │       │   │
│   │   │       │   └── security/
│   │   │       │       ├── SecurityConfig.java               ← @Configuration: filter chain, RBAC rules
│   │   │       │       ├── JwtProvider.java                  ← Token generation + validation (15 min access, 7 day refresh)
│   │   │       │       ├── JwtAuthenticationFilter.java      ← OncePerRequestFilter
│   │   │       │       └── CustomUserDetailsService.java     ← Loads user via UserPublicService
│   │   │       │
│   │   │       │
│   │   │       │ ══════════════════════════════════════════════
│   │   │       │  USER — User Domain Owner
│   │   │       │  BR-01, BR-02, BR-03, BR-04
│   │   │       │ ══════════════════════════════════════════════
│   │   │       │
│   │   │       ├── user/
│   │   │       │   ├── package-info.java
│   │   │       │   │
│   │   │       │   ├── controller/
│   │   │       │   │   ├── UserController.java               ← /api/users/** (profile CRUD)
│   │   │       │   │   └── AdminUserController.java          ← /api/admin/users/** (approval, create internal, list users)
│   │   │       │   │
│   │   │       │   ├── service/
│   │   │       │   │   ├── UserPublicService.java            ← Interface: findByEmail, findById, existsByEmail, isActive, getLockState,
│   │   │       │   │   │                                        incrementFailedAttempts, resetFailedAttempts, lockAccount,
│   │   │       │   │   │                                        createParticipant, createInternalAccount, approveAccount, rejectAccount, hasRole
│   │   │       │   │   ├── UserPublicServiceImpl.java
│   │   │       │   │   └── UserService.java                  ← Internal: profile update, password change, avatar upload
│   │   │       │   │
│   │   │       │   ├── domain/
│   │   │       │   │   └── User.java                         ← @Entity: email, passwordHash, fullName, phone, studentId, universityName,
│   │   │       │   │                                            userType, status, failedLoginAttempts, lockedUntil
│   │   │       │   │
│   │   │       │   ├── repository/
│   │   │       │   │   └── UserRepository.java               ← findByEmail, existsByEmail
│   │   │       │   │
│   │   │       │   ├── dto/
│   │   │       │   │   ├── request/
│   │   │       │   │   │   ├── CreateInternalAccountRequest.java   ← email, password, fullName, phone, userType (internal roles only)
│   │   │       │   │   │   ├── ApprovalRequest.java                ← userId, action (APPROVE/REJECT), reason
│   │   │       │   │   │   ├── UpdateProfileRequest.java           ← fullName, phone, studentId, universityName
│   │   │       │   │   │   └── ChangePasswordRequest.java          ← currentPassword, newPassword
│   │   │       │   │   │
│   │   │       │   │   ├── response/
│   │   │       │   │   │   └── UserProfileResponse.java
│   │   │       │   │   │
│   │   │       │   │   └── snapshot/
│   │   │       │   │       ├── UserSnapshot.java                   ← Read-only projection exposed via UserPublicService
│   │   │       │   │       └── LockState.java                      ← failedAttempts, lockedUntil, isLocked
│   │   │       │   │
│   │   │       │   ├── mapper/
│   │   │       │   │   └── UserMapper.java
│   │   │       │   │
│   │   │       │   └── event/
│   │   │       │       ├── AccountApprovedEvent.java          ← userId, email, fullName
│   │   │       │       ├── AccountRejectedEvent.java          ← userId, email, reason
│   │   │       │       ├── InternalAccountCreatedEvent.java   ← userId, email, role
│   │   │       │       ├── AccountLockedEvent.java            ← userId, lockedUntil
│   │   │       │       └── ProfileUpdatedEvent.java           ← userId, changedFields
│   │   │       │
│   │   │       │
│   │   │       │ ══════════════════════════════════════════════
│   │   │       │  EVENT — Hackathon Lifecycle
│   │   │       │  BR-08, BR-09, BR-10, BR-11, BR-12, BR-13, BR-14
│   │   │       │ ══════════════════════════════════════════════
│   │   │       │
│   │   │       ├── event/
│   │   │       │   ├── package-info.java
│   │   │       │   │
│   │   │       │   ├── controller/
│   │   │       │   │   ├── EventController.java              ← /api/events/** (CRUD hackathon events)
│   │   │       │   │   ├── RoundController.java              ← /api/events/{eventId}/rounds/** (round management)
│   │   │       │   │   ├── CriteriaController.java           ← /api/rounds/{roundId}/criteria/** (criteria config)
│   │   │       │   │   └── AssignmentController.java         ← /api/events/{eventId}/assignments/** (judge + mentor assign)
│   │   │       │   │
│   │   │       │   ├── service/
│   │   │       │   │   ├── EventPublicService.java           ← Interface: getEvent, getRound, getRoundsByEvent, getCriteriaByRound,
│   │   │       │   │   │                                        getRegistrationDeadline, getSubmissionDeadline, getScoringDeadline,
│   │   │       │   │   │                                        getAdvancementCutoff, getJudgeAssignments, getMentorAssignments,
│   │   │       │   │   │                                        isJudgeAssignedToRound, isEventActive
│   │   │       │   │   ├── EventPublicServiceImpl.java
│   │   │       │   │   ├── EventService.java                 ← Internal: event CRUD, status transitions
│   │   │       │   │   ├── RoundService.java                 ← Internal: round CRUD, date validation (BR-09)
│   │   │       │   │   ├── CriteriaService.java              ← Internal: criteria CRUD, weight validation (BR-11)
│   │   │       │   │   ├── JudgeAssignmentService.java       ← Internal: assign judges to rounds (BR-13)
│   │   │       │   │   └── MentorAssignmentService.java      ← Internal: assign mentors to events (BR-14)
│   │   │       │   │
│   │   │       │   ├── domain/
│   │   │       │   │   ├── HackathonEvent.java               ← @Entity: name, season, year, startDate, endDate, registrationDeadline, status
│   │   │       │   │   ├── Round.java                        ← @Entity: eventId, roundNumber, name, startDate, endDate, submissionDeadline, scoringDeadline, advancementCutoff
│   │   │       │   │   ├── Criteria.java                     ← @Entity: roundId, name, description, weight, sortOrder
│   │   │       │   │   ├── JudgeAssignment.java              ← @Entity: roundId, judgeUserId, assignedAt
│   │   │       │   │   ├── MentorAssignment.java             ← @Entity: eventId, mentorUserId, assignedAt
│   │   │       │   │   └── enums/
│   │   │       │   │       └── EventStatus.java              ← DRAFT, ACTIVE, COMPLETED, CANCELLED
│   │   │       │   │
│   │   │       │   ├── repository/
│   │   │       │   │   ├── HackathonEventRepository.java
│   │   │       │   │   ├── RoundRepository.java
│   │   │       │   │   ├── CriteriaRepository.java
│   │   │       │   │   ├── JudgeAssignmentRepository.java
│   │   │       │   │   └── MentorAssignmentRepository.java
│   │   │       │   │
│   │   │       │   ├── dto/
│   │   │       │   │   ├── request/
│   │   │       │   │   │   ├── CreateEventRequest.java       ← name, season, year, startDate, endDate, registrationDeadline
│   │   │       │   │   │   ├── UpdateEventRequest.java
│   │   │       │   │   │   ├── CreateRoundRequest.java       ← roundNumber, name, startDate, endDate, submissionDeadline, scoringDeadline, advancementCutoff
│   │   │       │   │   │   ├── UpdateRoundRequest.java
│   │   │       │   │   │   ├── CriteriaRequest.java          ← name, description, weight
│   │   │       │   │   │   ├── AssignJudgeRequest.java       ← judgeUserId, roundId
│   │   │       │   │   │   └── AssignMentorRequest.java      ← mentorUserId
│   │   │       │   │   │
│   │   │       │   │   ├── response/
│   │   │       │   │   │   ├── EventResponse.java
│   │   │       │   │   │   ├── RoundResponse.java
│   │   │       │   │   │   └── CriteriaResponse.java
│   │   │       │   │   │
│   │   │       │   │   └── snapshot/
│   │   │       │   │       ├── EventSnapshot.java            ← Read-only projection for other modules
│   │   │       │   │       ├── RoundSnapshot.java
│   │   │       │   │       └── CriteriaSnapshot.java
│   │   │       │   │
│   │   │       │   ├── mapper/
│   │   │       │   │   ├── EventMapper.java
│   │   │       │   │   ├── RoundMapper.java
│   │   │       │   │   └── CriteriaMapper.java
│   │   │       │   │
│   │   │       │   └── event/
│   │   │       │       ├── EventCreatedEvent.java            ← eventId, name, coordinatorId
│   │   │       │       ├── EventActivatedEvent.java          ← eventId
│   │   │       │       ├── EventConfigChangedEvent.java      ← eventId, field, oldValue, newValue
│   │   │       │       ├── JudgeAssignedEvent.java           ← assignmentId, judgeId, roundId, eventId
│   │   │       │       ├── MentorAssignedEvent.java          ← assignmentId, mentorId, eventId
│   │   │       │       └── ScoringWindowReopenedEvent.java   ← roundId, newDeadline
│   │   │       │
│   │   │       │
│   │   │       │ ══════════════════════════════════════════════
│   │   │       │  TEAM — Team Formation
│   │   │       │  BR-15 to BR-24
│   │   │       │ ══════════════════════════════════════════════
│   │   │       │
│   │   │       ├── team/
│   │   │       │   ├── package-info.java
│   │   │       │   │
│   │   │       │   ├── controller/
│   │   │       │   │   ├── TeamController.java               ← /api/events/{eventId}/teams/** (create, join, list, my-team)
│   │   │       │   │   └── InvitationController.java         ← /api/invitations/** (send, accept, reject, list pending)
│   │   │       │   │
│   │   │       │   ├── service/
│   │   │       │   │   ├── TeamPublicService.java            ← Interface: getTeam, getTeamByParticipantAndEvent, isTeamLeader,
│   │   │       │   │   │                                        isTeamMember, isMentorOfTeam, getTeamsByEvent,
│   │   │       │   │   │                                        getTeamsByMentor, getTeamIdBySubmission
│   │   │       │   │   ├── TeamPublicServiceImpl.java
│   │   │       │   │   ├── TeamService.java                  ← Internal: create, join, remove member, update leader
│   │   │       │   │   ├── InvitationService.java            ← Internal: send, accept, reject, expire invitations
│   │   │       │   │   └── AutoMatchService.java             ← Internal: group solo registrants into teams (BR-17)
│   │   │       │   │
│   │   │       │   ├── domain/
│   │   │       │   │   ├── Team.java                         ← @Entity: eventId, name, leaderId, status
│   │   │       │   │   ├── TeamMember.java                   ← @Entity: teamId, userId, role (LEADER/MEMBER), joinedAt
│   │   │       │   │   ├── Invitation.java                   ← @Entity: teamId, inviterId, inviteeEmail, status, expiresAt
│   │   │       │   │   ├── MentorTeam.java                   ← @Entity: mentorUserId, teamId, assignedAt
│   │   │       │   │   └── enums/
│   │   │       │   │       ├── TeamStatus.java               ← FORMING, CONFIRMED, DISBANDED
│   │   │       │   │       ├── TeamMemberRole.java           ← LEADER, MEMBER
│   │   │       │   │       └── InvitationStatus.java         ← PENDING, ACCEPTED, REJECTED, EXPIRED
│   │   │       │   │
│   │   │       │   ├── repository/
│   │   │       │   │   ├── TeamRepository.java
│   │   │       │   │   ├── TeamMemberRepository.java
│   │   │       │   │   ├── InvitationRepository.java
│   │   │       │   │   └── MentorTeamRepository.java
│   │   │       │   │
│   │   │       │   ├── dto/
│   │   │       │   │   ├── request/
│   │   │       │   │   │   ├── CreateTeamRequest.java        ← name, eventId
│   │   │       │   │   │   ├── JoinTeamRequest.java          ← teamId
│   │   │       │   │   │   ├── SendInvitationRequest.java    ← inviteeEmail
│   │   │       │   │   │   └── AssignMentorTeamRequest.java  ← mentorUserId, teamId
│   │   │       │   │   │
│   │   │       │   │   ├── response/
│   │   │       │   │   │   ├── TeamResponse.java
│   │   │       │   │   │   ├── TeamMemberResponse.java
│   │   │       │   │   │   └── InvitationResponse.java
│   │   │       │   │   │
│   │   │       │   │   └── snapshot/
│   │   │       │   │       └── TeamSnapshot.java             ← Read-only projection for other modules
│   │   │       │   │
│   │   │       │   ├── mapper/
│   │   │       │   │   └── TeamMapper.java
│   │   │       │   │
│   │   │       │   └── event/
│   │   │       │       ├── TeamCreatedEvent.java             ← teamId, eventId, leaderId, teamName
│   │   │       │       ├── TeamConfirmedEvent.java           ← teamId, memberCount
│   │   │       │       ├── MemberJoinedEvent.java            ← teamId, userId, role
│   │   │       │       ├── MemberLeftEvent.java              ← teamId, userId
│   │   │       │       ├── InvitationSentEvent.java          ← invitationId, teamId, inviteeEmail
│   │   │       │       ├── InvitationAcceptedEvent.java      ← invitationId, userId
│   │   │       │       ├── InvitationRejectedEvent.java      ← invitationId, userId
│   │   │       │       └── MentorTeamAssignedEvent.java      ← mentorId, teamId
│   │   │       │
│   │   │       │
│   │   │       │ ══════════════════════════════════════════════
│   │   │       │  SUBMISSION — Submission Lifecycle
│   │   │       │  BR-25 to BR-33
│   │   │       │ ══════════════════════════════════════════════
│   │   │       │
│   │   │       ├── submission/
│   │   │       │   ├── package-info.java
│   │   │       │   │
│   │   │       │   ├── controller/
│   │   │       │   │   └── SubmissionController.java         ← /api/rounds/{roundId}/submissions/** (create, update, list, get)
│   │   │       │   │
│   │   │       │   ├── service/
│   │   │       │   │   ├── SubmissionPublicService.java      ← Interface: getSubmission, getSubmissionsByRound, getSubmissionByTeamAndRound,
│   │   │       │   │   │                                        getSubmissionStatus, getSubmittedAt
│   │   │       │   │   ├── SubmissionPublicServiceImpl.java
│   │   │       │   │   └── SubmissionService.java            ← Internal: create, update (new version), deadline check
│   │   │       │   │
│   │   │       │   ├── domain/
│   │   │       │   │   ├── Submission.java                   ← @Entity: teamId, roundId, currentVersionId, status, submittedBy
│   │   │       │   │   ├── SubmissionVersion.java            ← @Entity: submissionId, versionNumber, githubUrl, demoUrl, submittedAt
│   │   │       │   │   ├── SubmissionAttachment.java         ← @Entity: submissionVersionId, fileName, fileUrl, fileSize, pageCount
│   │   │       │   │   └── enums/
│   │   │       │   │       └── SubmissionStatus.java         ← DRAFT, SUBMITTED, SCORED, NOT_SCORED
│   │   │       │   │
│   │   │       │   ├── repository/
│   │   │       │   │   ├── SubmissionRepository.java
│   │   │       │   │   ├── SubmissionVersionRepository.java
│   │   │       │   │   └── SubmissionAttachmentRepository.java
│   │   │       │   │
│   │   │       │   ├── dto/
│   │   │       │   │   ├── request/
│   │   │       │   │   │   └── CreateSubmissionRequest.java  ← githubUrl, demoUrl, pdfFile (multipart)
│   │   │       │   │   │
│   │   │       │   │   ├── response/
│   │   │       │   │   │   ├── SubmissionResponse.java
│   │   │       │   │   │   └── SubmissionVersionResponse.java
│   │   │       │   │   │
│   │   │       │   │   └── snapshot/
│   │   │       │   │       └── SubmissionSnapshot.java       ← Read-only projection for other modules
│   │   │       │   │
│   │   │       │   ├── mapper/
│   │   │       │   │   └── SubmissionMapper.java
│   │   │       │   │
│   │   │       │   ├── validation/
│   │   │       │   │   ├── GitHubUrlValidator.java           ← Validates GitHub repository URL format (BR-29)
│   │   │       │   │   ├── DemoUrlWhitelistValidator.java    ← Validates demo URL against allowed domains (BR-28)
│   │   │       │   │   └── PdfValidator.java                 ← Validates file size ≤ 5MB and page count ≤ 2 (BR-26, BR-27)
│   │   │       │   │
│   │   │       │   └── event/
│   │   │       │       ├── SubmissionCreatedEvent.java       ← submissionId, teamId, roundId, versionNumber
│   │   │       │       └── SubmissionUpdatedEvent.java       ← submissionId, teamId, newVersionNumber
│   │   │       │
│   │   │       │
│   │   │       │ ══════════════════════════════════════════════
│   │   │       │  JUDGING — Scoring Engine
│   │   │       │  BR-34 to BR-43
│   │   │       │ ══════════════════════════════════════════════
│   │   │       │
│   │   │       ├── judging/
│   │   │       │   ├── package-info.java
│   │   │       │   │
│   │   │       │   ├── controller/
│   │   │       │   │   └── JudgingController.java            ← /api/rounds/{roundId}/scoring/** (submit score, update, list by submission)
│   │   │       │   │
│   │   │       │   ├── service/
│   │   │       │   │   ├── JudgingPublicService.java         ← Interface: getScoresBySubmission, getScoresByRound, getScoreCountBySubmission,
│   │   │       │   │   │                                        getDetailedScores, isFullyScored
│   │   │       │   │   ├── JudgingPublicServiceImpl.java
│   │   │       │   │   ├── JudgingService.java               ← Internal: submit score, update, lock, timer management
│   │   │       │   │   └── ConflictDetectionService.java     ← Internal: checks judge-mentor conflict via TeamPublicService (BR-34)
│   │   │       │   │
│   │   │       │   ├── domain/
│   │   │       │   │   ├── JudgeScore.java                   ← @Entity: judgeUserId, submissionId, roundId, status, startedAt, completedAt
│   │   │       │   │   ├── JudgeScoreDetail.java             ← @Entity: judgeScoreId, criteriaId, score (0-100)
│   │   │       │   │   ├── JudgeComment.java                 ← @Entity: judgeScoreId, criteriaId, comment
│   │   │       │   │   └── enums/
│   │   │       │   │       └── ScoreStatus.java              ← IN_PROGRESS, COMPLETED, LOCKED
│   │   │       │   │
│   │   │       │   ├── repository/
│   │   │       │   │   ├── JudgeScoreRepository.java
│   │   │       │   │   ├── JudgeScoreDetailRepository.java
│   │   │       │   │   └── JudgeCommentRepository.java
│   │   │       │   │
│   │   │       │   ├── dto/
│   │   │       │   │   ├── request/
│   │   │       │   │   │   └── ScoreSubmissionRequest.java   ← List<ScoreDetailDto> scores, List<CommentDto> comments
│   │   │       │   │   │
│   │   │       │   │   ├── response/
│   │   │       │   │   │   ├── JudgeScoreResponse.java
│   │   │       │   │   │   └── ScoreDetailResponse.java
│   │   │       │   │   │
│   │   │       │   │   └── snapshot/
│   │   │       │   │       ├── JudgeScoreSnapshot.java       ← Read-only projection for ranking module
│   │   │       │   │       └── ScoreDetailSnapshot.java      ← criteriaId, score (for aggregation)
│   │   │       │   │
│   │   │       │   ├── mapper/
│   │   │       │   │   └── JudgingMapper.java
│   │   │       │   │
│   │   │       │   ├── listener/
│   │   │       │   │   └── JudgingEventListener.java         ← Listens to ScoringWindowReopenedEvent (from event module)
│   │   │       │   │
│   │   │       │   └── event/
│   │   │       │       ├── ScoreCreatedEvent.java            ← judgeScoreId, judgeId, submissionId, roundId
│   │   │       │       ├── ScoreUpdatedEvent.java            ← judgeScoreId, judgeId, submissionId, roundId, changedCriteria
│   │   │       │       ├── ScoreDeletedEvent.java            ← judgeScoreId, judgeId, submissionId, roundId
│   │   │       │       ├── ScoringCompletedEvent.java        ← submissionId, judgeCount
│   │   │       │       └── ConflictDetectedEvent.java        ← judgeId, teamId, submissionId
│   │   │       │
│   │   │       │
│   │   │       │ ══════════════════════════════════════════════
│   │   │       │  RANKING — Results & Advancement
│   │   │       │  BR-44 to BR-52, BR-56
│   │   │       │ ══════════════════════════════════════════════
│   │   │       │
│   │   │       ├── ranking/
│   │   │       │   ├── package-info.java
│   │   │       │   │
│   │   │       │   ├── controller/
│   │   │       │   │   ├── RankingController.java            ← /api/rounds/{roundId}/rankings/** (get rankings, get by team)
│   │   │       │   │   ├── ResultController.java             ← /api/rounds/{roundId}/results/** (publish, get published)
│   │   │       │   │   └── DisputeController.java            ← /api/rounds/{roundId}/disputes/** (file, list, resolve)
│   │   │       │   │
│   │   │       │   ├── service/
│   │   │       │   │   ├── RankingService.java               ← Internal: get rankings, check publish status
│   │   │       │   │   ├── AggregationService.java           ← Internal: weighted mean, trimmed mean, tie-break (BR-44 to BR-47)
│   │   │       │   │   ├── AdvancementService.java           ← Internal: mark Advanced/Eliminated by cutoff (BR-49)
│   │   │       │   │   └── DisputeService.java               ← Internal: file dispute within 24h window, resolve (BR-56)
│   │   │       │   │
│   │   │       │   ├── domain/
│   │   │       │   │   ├── Ranking.java                      ← @Entity: teamId, roundId, finalScore, rank, version, calculatedAt
│   │   │       │   │   ├── Advancement.java                  ← @Entity: teamId, roundId, status (ADVANCED/ELIMINATED)
│   │   │       │   │   ├── PublishedResult.java              ← @Entity: roundId, publishedBy, publishedAt, disputeDeadline
│   │   │       │   │   ├── Dispute.java                      ← @Entity: teamId, roundId, filedBy, reason, status, filedAt, resolvedAt, resolvedBy, resolution
│   │   │       │   │   └── enums/
│   │   │       │   │       ├── AdvancementStatus.java        ← ADVANCED, ELIMINATED
│   │   │       │   │       └── DisputeStatus.java            ← PENDING, UNDER_REVIEW, RESOLVED, REJECTED
│   │   │       │   │
│   │   │       │   ├── repository/
│   │   │       │   │   ├── RankingRepository.java
│   │   │       │   │   ├── AdvancementRepository.java
│   │   │       │   │   ├── PublishedResultRepository.java
│   │   │       │   │   └── DisputeRepository.java
│   │   │       │   │
│   │   │       │   ├── dto/
│   │   │       │   │   ├── request/
│   │   │       │   │   │   ├── PublishRequest.java           ← roundId (confirmation action)
│   │   │       │   │   │   ├── DisputeRequest.java           ← reason
│   │   │       │   │   │   └── ResolveDisputeRequest.java    ← resolution, action (RESOLVE/REJECT)
│   │   │       │   │   │
│   │   │       │   │   └── response/
│   │   │       │   │       ├── RankingResponse.java
│   │   │       │   │       ├── AdvancementResponse.java
│   │   │       │   │       └── DisputeResponse.java
│   │   │       │   │
│   │   │       │   ├── mapper/
│   │   │       │   │   └── RankingMapper.java
│   │   │       │   │
│   │   │       │   ├── listener/
│   │   │       │   │   └── RankingEventListener.java         ← Listens to ScoreCreatedEvent, ScoreUpdatedEvent, ScoreDeletedEvent
│   │   │       │   │                                            → triggers AggregationService.recalculate()
│   │   │       │   │
│   │   │       │   └── event/
│   │   │       │       ├── RankingRecalculatedEvent.java     ← roundId, version, teamCount
│   │   │       │       ├── ResultsPublishedEvent.java        ← roundId, publishedBy, publishedAt, disputeDeadline
│   │   │       │       ├── DisputeFiledEvent.java            ← disputeId, teamId, roundId, filedBy
│   │   │       │       └── DisputeResolvedEvent.java         ← disputeId, resolution, resolvedBy
│   │   │       │
│   │   │       │
│   │   │       │ ══════════════════════════════════════════════
│   │   │       │  NOTIFICATION — Delivery Engine
│   │   │       │  Event-driven sink, no public interface
│   │   │       │ ══════════════════════════════════════════════
│   │   │       │
│   │   │       ├── notification/
│   │   │       │   ├── package-info.java
│   │   │       │   │
│   │   │       │   ├── controller/
│   │   │       │   │   └── NotificationController.java       ← /api/notifications/** (list, mark-read, mark-all-read)
│   │   │       │   │
│   │   │       │   ├── service/
│   │   │       │   │   ├── NotificationService.java          ← Internal: create notification records, mark read
│   │   │       │   │   └── EmailService.java                 ← Internal: format and send emails via infrastructure.mail
│   │   │       │   │
│   │   │       │   ├── domain/
│   │   │       │   │   ├── Notification.java                 ← @Entity: type, title, message, referenceId, referenceType
│   │   │       │   │   ├── NotificationRecipient.java        ← @Entity: notificationId, userId, channel (EMAIL/IN_APP), readAt, sentAt
│   │   │       │   │   └── enums/
│   │   │       │   │       ├── NotificationType.java         ← ACCOUNT_APPROVED, ACCOUNT_REJECTED, TEAM_REGISTERED, SUBMISSION_CREATED,
│   │   │       │   │       │                                    JUDGE_ASSIGNED, MENTOR_ASSIGNED, RESULTS_PUBLISHED, INVITATION_RECEIVED,
│   │   │       │   │       │                                    SCORING_REOPENED, DISPUTE_FILED
│   │   │       │   │       └── NotificationChannel.java      ← EMAIL, IN_APP
│   │   │       │   │
│   │   │       │   ├── repository/
│   │   │       │   │   ├── NotificationRepository.java
│   │   │       │   │   └── NotificationRecipientRepository.java
│   │   │       │   │
│   │   │       │   ├── dto/
│   │   │       │   │   └── response/
│   │   │       │   │       └── NotificationResponse.java
│   │   │       │   │
│   │   │       │   ├── mapper/
│   │   │       │   │   └── NotificationMapper.java
│   │   │       │   │
│   │   │       │   └── listener/
│   │   │       │       └── NotificationEventListener.java    ← Subscribes to all notification-triggering events:
│   │   │       │                                                AccountApprovedEvent, AccountRejectedEvent,
│   │   │       │                                                InternalAccountCreatedEvent, JudgeAssignedEvent,
│   │   │       │                                                MentorAssignedEvent, TeamCreatedEvent, TeamConfirmedEvent,
│   │   │       │                                                InvitationSentEvent, SubmissionCreatedEvent,
│   │   │       │                                                ScoringWindowReopenedEvent, ResultsPublishedEvent,
│   │   │       │                                                DisputeFiledEvent
│   │   │       │
│   │   │       │
│   │   │       │ ══════════════════════════════════════════════
│   │   │       │  AUDIT — Immutable Log
│   │   │       │  BR-53, BR-54, BR-55
│   │   │       │ ══════════════════════════════════════════════
│   │   │       │
│   │   │       ├── audit/
│   │   │       │   ├── package-info.java
│   │   │       │   │
│   │   │       │   ├── controller/
│   │   │       │   │   └── AuditController.java              ← /api/admin/audit/** (list, export — System Admin only)
│   │   │       │   │
│   │   │       │   ├── service/
│   │   │       │   │   └── AuditService.java                 ← Internal: append log entry, export to CSV/JSON (BR-55)
│   │   │       │   │
│   │   │       │   ├── domain/
│   │   │       │   │   └── AuditLog.java                     ← @Entity: actorId, action, targetId, targetType, oldValue (JSON),
│   │   │       │   │                                            newValue (JSON), timestamp, ipAddress
│   │   │       │   │
│   │   │       │   ├── repository/
│   │   │       │   │   └── AuditLogRepository.java           ← save() ONLY — no update, no delete methods exposed
│   │   │       │   │
│   │   │       │   ├── dto/
│   │   │       │   │   ├── request/
│   │   │       │   │   │   └── AuditExportRequest.java       ← startDate, endDate, format (CSV/JSON)
│   │   │       │   │   │
│   │   │       │   │   └── response/
│   │   │       │   │       └── AuditLogResponse.java
│   │   │       │   │
│   │   │       │   ├── mapper/
│   │   │       │   │   └── AuditMapper.java
│   │   │       │   │
│   │   │       │   └── listener/
│   │   │       │       └── AuditEventListener.java           ← Universal sink — subscribes to ALL mutation events:
│   │   │       │                                                UserLoggedInEvent, LoginFailedEvent, PasswordResetEvent,
│   │   │       │                                                AccessDeniedEvent, AccountApprovedEvent, AccountRejectedEvent,
│   │   │       │                                                InternalAccountCreatedEvent, AccountLockedEvent, ProfileUpdatedEvent,
│   │   │       │                                                EventCreatedEvent, EventActivatedEvent, EventConfigChangedEvent,
│   │   │       │                                                JudgeAssignedEvent, MentorAssignedEvent, ScoringWindowReopenedEvent,
│   │   │       │                                                TeamCreatedEvent, TeamConfirmedEvent, MemberJoinedEvent, MemberLeftEvent,
│   │   │       │                                                InvitationAcceptedEvent, InvitationRejectedEvent,
│   │   │       │                                                SubmissionCreatedEvent, SubmissionUpdatedEvent,
│   │   │       │                                                ScoreCreatedEvent, ScoreUpdatedEvent, ScoreDeletedEvent, ConflictDetectedEvent,
│   │   │       │                                                RankingRecalculatedEvent, ResultsPublishedEvent,
│   │   │       │                                                DisputeFiledEvent, DisputeResolvedEvent
│   │   │       │
│   │   │       │
│   │   │       │ ══════════════════════════════════════════════
│   │   │       │  INFRASTRUCTURE — Technical Cross-Cutting
│   │   │       │ ══════════════════════════════════════════════
│   │   │       │
│   │   │       └── infrastructure/
│   │   │           ├── package-info.java
│   │   │           │
│   │   │           ├── config/
│   │   │           │   ├── WebConfig.java                    ← Servlet configuration
│   │   │           │   ├── AsyncConfig.java                  ← @EnableAsync, thread pool for event processing
│   │   │           │   ├── EventConfig.java                  ← Spring Modulith event externalization config
│   │   │           │   └── OpenApiConfig.java                ← Swagger / OpenAPI documentation setup
│   │   │           │
│   │   │           ├── mail/
│   │   │           │   ├── MailSender.java                   ← Interface: sendEmail(to, subject, body)
│   │   │           │   └── SmtpMailSender.java               ← Implementation using Spring Mail
│   │   │           │
│   │   │           └── storage/
│   │   │               ├── FileStorageService.java           ← Interface: store(file), load(path), delete(path)
│   │   │               └── LocalFileStorageService.java      ← Implementation for PDF uploads
│   │   │
│   │   │
│   │   └── resources/
│   │       ├── application.yml                               ← Main config: datasource, JPA, JWT, mail, storage
│   │       ├── application-dev.yml                           ← Dev profile: H2/local PostgreSQL, debug logging
│   │       ├── application-prod.yml                          ← Prod profile: production database, optimized settings
│   │       └── db/
│   │           └── migration/                                ← (Empty — schema generated from JPA entities, per guideline)
│   │
│   │
│   └── test/
│       └── java/
│           └── com/sealhackathon/
│               │
│               ├── SealhackathonApplicationTests.java         ← Context loads test
│               ├── ModularityTests.java                      ← ApplicationModules.of(...).verify()
│               │
│               ├── auth/
│               │   ├── service/
│               │   │   ├── AuthServiceTest.java              ← Unit tests (Mockito)
│               │   │   └── TokenServiceTest.java
│               │   ├── controller/
│               │   │   └── AuthControllerIntegrationTest.java   ← @SpringBootTest + Testcontainers
│               │   └── security/
│               │       └── JwtProviderTest.java
│               │
│               ├── user/
│               │   ├── service/
│               │   │   └── UserServiceTest.java
│               │   └── controller/
│               │       ├── UserControllerIntegrationTest.java
│               │       └── AdminUserControllerIntegrationTest.java
│               │
│               ├── event/
│               │   ├── service/
│               │   │   ├── EventServiceTest.java
│               │   │   ├── RoundServiceTest.java
│               │   │   └── CriteriaServiceTest.java
│               │   └── controller/
│               │       ├── EventControllerIntegrationTest.java
│               │       └── RoundControllerIntegrationTest.java
│               │
│               ├── team/
│               │   ├── service/
│               │   │   ├── TeamServiceTest.java
│               │   │   ├── InvitationServiceTest.java
│               │   │   └── AutoMatchServiceTest.java
│               │   └── controller/
│               │       ├── TeamControllerIntegrationTest.java
│               │       └── InvitationControllerIntegrationTest.java
│               │
│               ├── submission/
│               │   ├── service/
│               │   │   └── SubmissionServiceTest.java
│               │   ├── controller/
│               │   │   └── SubmissionControllerIntegrationTest.java
│               │   └── validation/
│               │       ├── GitHubUrlValidatorTest.java
│               │       ├── DemoUrlWhitelistValidatorTest.java
│               │       └── PdfValidatorTest.java
│               │
│               ├── judging/
│               │   ├── service/
│               │   │   ├── JudgingServiceTest.java
│               │   │   └── ConflictDetectionServiceTest.java
│               │   └── controller/
│               │       └── JudgingControllerIntegrationTest.java
│               │
│               ├── ranking/
│               │   ├── service/
│               │   │   ├── AggregationServiceTest.java       ← Critical: tests weighted mean, trimmed mean, tie-break
│               │   │   ├── AdvancementServiceTest.java
│               │   │   └── DisputeServiceTest.java
│               │   └── controller/
│               │       ├── RankingControllerIntegrationTest.java
│               │       └── ResultControllerIntegrationTest.java
│               │
│               ├── notification/
│               │   ├── service/
│               │   │   └── NotificationServiceTest.java
│               │   └── listener/
│               │       └── NotificationEventListenerTest.java
│               │
│               └── audit/
│                   ├── service/
│                   │   └── AuditServiceTest.java
│                   └── listener/
│                       └── AuditEventListenerTest.java
│
│
├── PROJECT_GUIDELINE.md
├── ARCHITECTURE.md
└── FOLDER_STRUCTURE.md
```

---

## Layer Explanation

### Per-Module Layers (inside each business module)

Each module follows the same internal layering. The layers map to DDD Lite:

```text
┌─────────────────────────────────────────────────────────────┐
│                      controller/                            │  API Layer
│  @RestController classes. Receives HTTP, validates with     │  ─────────
│  @Valid, delegates to service, returns ApiResponse<T>.      │  Inbound adapter
│  Never contains business logic.                             │
├─────────────────────────────────────────────────────────────┤
│                      dto/                                   │  Data Transfer
│  ├── request/    Inbound payloads with Bean Validation      │  ────────────
│  ├── response/   Outbound payloads for API consumers        │  Boundary objects
│  └── snapshot/   Read-only projections for cross-module     │  (never leak entities)
│                  use via PublicService interfaces            │
├─────────────────────────────────────────────────────────────┤
│                      mapper/                                │  Mapping Layer
│  MapStruct interfaces. Entity ↔ DTO conversion.            │  ─────────────
│  No business logic. Pure structural transformation.         │
├─────────────────────────────────────────────────────────────┤
│                      service/                               │  Application Layer
│  ├── *PublicService.java      Interface (module boundary)   │  ─────────────────
│  ├── *PublicServiceImpl.java  Implements the public API     │  Orchestrates domain
│  └── *Service.java            Internal services (pkg-priv)  │  operations, publishes
│                                                             │  domain events
├─────────────────────────────────────────────────────────────┤
│                      domain/                                │  Domain Layer
│  @Entity classes with JPA annotations. Owns invariants.     │  ────────────
│  Contains entity-level validation and state transitions.    │  Source of truth
│  └── enums/   Module-specific enums (not in common)         │  (JPA Code First)
├─────────────────────────────────────────────────────────────┤
│                      repository/                            │  Repository Layer
│  Spring Data JPA interfaces. Module-private — never         │  ────────────────
│  injected by other modules. FetchType.LAZY always.          │  Persistence adapter
├─────────────────────────────────────────────────────────────┤
│                      event/                                 │  Domain Events
│  Record classes representing facts that happened.           │  ─────────────
│  Published by services. Consumed by listener/ in other      │  Outbound signals
│  modules.                                                   │
├─────────────────────────────────────────────────────────────┤
│                      listener/  (consumer modules only)     │  Event Listeners
│  @TransactionalEventListener methods that react to events   │  ───────────────
│  from other modules. Present in: judging, ranking,          │  Inbound signals
│  notification, audit.                                       │
├─────────────────────────────────────────────────────────────┤
│                      validation/  (submission only)         │  Domain Validators
│  Stateless validators for complex business rules            │  ─────────────────
│  (GitHub URL, demo URL whitelist, PDF constraints).         │  BR-26 to BR-29
└─────────────────────────────────────────────────────────────┘
```

### Cross-Cutting Layers (outside business modules)

| Layer | Package | Purpose |
|---|---|---|
| **Shared Kernel** | `common/` | Base classes, global enums, exception hierarchy, API response wrapper, validation annotations, JPA auditing config. No Spring beans. |
| **Security** | `auth/security/` | JWT filter chain, RBAC configuration, SecurityConfig. Lives inside auth module but applies globally via Spring Security filter chain. |
| **Infrastructure** | `infrastructure/` | Technical adapters (mail, file storage) with interface + implementation pairs. No business logic. |

---

## Visibility Rules

Spring Modulith enforces module boundaries at the package level. Each module's internal packages are hidden from other modules.

| Package | Visibility | Who can access |
|---|---|---|
| `<module>/service/*PublicService.java` | **Public** | Any module that declares the dependency |
| `<module>/service/*PublicServiceImpl.java` | **Public** | Spring container (auto-wired via interface) |
| `<module>/dto/snapshot/*` | **Public** | Consumers of the PublicService |
| `<module>/event/*Event.java` | **Public** | Any module's listener can subscribe |
| `<module>/service/*Service.java` (internal) | **Module-private** | Only within the owning module |
| `<module>/repository/*` | **Module-private** | Only within the owning module |
| `<module>/domain/*` | **Module-private** | Only within the owning module |
| `<module>/controller/*` | **Module-private** | Only within the owning module (Spring MVC registers via reflection) |
| `<module>/mapper/*` | **Module-private** | Only within the owning module |
| `<module>/listener/*` | **Module-private** | Only within the owning module (Spring events dispatch via reflection) |

---

## File Count Summary

| Module | Entities | Repositories | Services | Controllers | DTOs | Events | Total (approx) |
|---|---|---|---|---|---|---|---|
| common | 1 (BaseEntity) | 0 | 0 | 0 | 1 | 0 | ~10 |
| auth | 2 | 2 | 3 | 1 | 7 | 4 | ~22 |
| user | 1 | 1 | 3 | 2 | 6 | 5 | ~20 |
| event | 5 | 5 | 7 | 4 | 10 | 6 | ~42 |
| team | 4 | 4 | 4 | 2 | 7 | 8 | ~34 |
| submission | 3 | 3 | 2 | 1 | 4 | 2 | ~20 |
| judging | 3 | 3 | 3 | 1 | 5 | 5 | ~24 |
| ranking | 4 | 4 | 4 | 3 | 6 | 4 | ~30 |
| notification | 2 | 2 | 2 | 1 | 1 | 0 | ~12 |
| audit | 1 | 1 | 1 | 1 | 2 | 0 | ~9 |
| infrastructure | 0 | 0 | 0 | 0 | 0 | 0 | ~6 |
| **Total** | **26** | **25** | **29** | **16** | **49** | **34** | **~229** |
