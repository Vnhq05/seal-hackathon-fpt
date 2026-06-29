export { api } from "./api-client";
export type { ApiResponse, Page, PageParams } from "./types";
export type {
  UserType,
  AccountStatus,
  StudentStanding,
  EventStatus,
  CompetitionFormat,
  RoundType,
  TeamStatus,
  TeamMemberRole,
  InvitationStatus,
  SubmissionStatus,
  HackathonSkillRole,
} from "./types";
export { HACKATHON_SKILL_ROLE_LABELS } from "./types";

export { coordinatorUserApi } from "./coordinator-user.api";
export type {
  CoordinatorUserListItem,
  CoordinatorUserListParams,
  RejectAccountRequest,
} from "./coordinator-user.api";

export { authApi } from "./auth.api";
export type { RegisterRequest, LoginRequest, RefreshTokenRequest, ForgotPasswordRequest, ResetPasswordRequest, AuthResponse, UserInfo } from "./auth.api";

export { userApi } from "./user.api";
export type { UserProfile, UpdateProfileRequest, ChangePasswordRequest, UserSearchResult } from "./user.api";

export { adminUserApi } from "./admin-user.api";
export type { UserListItem, UserListParams, ApprovalRequest, CreateInternalAccountRequest } from "./admin-user.api";

export { eventApi } from "./event.api";
export type {
  EventResponse,
  CreateEventRequest,
  UpdateEventRequest,
  PublishEventRequest,
  EventListParams,
  PrizeRank,
  PrizeResponse,
  PrizeRequest,
  HonoredGuestResponse,
  HonoredGuestRequest,
  TrackRequest,
  UpdateEventStatusRequest,
  AllowedEmailDomainResponse,
  AddAllowedEmailDomainRequest,
} from "./event.api";

export { scheduleApi } from "./schedule.api";
export type { ScheduleType, ScheduleGate, EventScheduleResponse } from "./schedule.api";

export { roundApi } from "./round.api";
export type { RoundResponse, CreateRoundRequest, AdvancementRule } from "./round.api";
export { formatAdvancementLabel } from "./round.utils";

export { criteriaApi } from "./criteria.api";
export type { CriteriaResponse, CriteriaRequest } from "./criteria.api";

export { assignmentApi } from "./assignment.api";
export type {
  JudgeAssignmentResponse,
  MentorAssignmentResponse,
  AssignJudgeRequest,
  AssignMentorRequest,
  EventAssignmentsOverviewResponse,
  TeamAssignmentOverview,
  EventJudgeOption,
  CreateTeamAssignmentsRequest,
} from "./assignment.api";

export { teamApi } from "./team.api";
export type { TeamResponse, TeamMemberResponse, CreateTeamRequest, JoinTeamRequest, AssignMentorTeamRequest, SelfDrawTrackRequest, SelectTrackRequest, UpdateTeamRecruitmentRequest } from "./team.api";

export { invitationApi } from "./invitation.api";
export type { InvitationResponse, SendInvitationRequest } from "./invitation.api";

export { submissionApi, SUBMISSION_MAX_PDF_BYTES, normalizeSubmissionFilePath } from "./submission.api";
export type { SubmissionResponse, SubmissionVersionResponse, AttachmentResponse, CreateSubmissionRequest } from "./submission.api";

export { judgingApi } from "./judging.api";
export type { JudgeScoreResponse, ScoreDetailResponse, CommentResponse, ScoreSubmissionRequest, ScoreDetailDto, ScoreStatus, ScoringStatus, JudgeScoringAssignment } from "./judging.api";

export { rankingApi } from "./ranking.api";
export type { RankingResponse, EventRankingBoard, AdvancementResponse, PublishedAdvancementStatus, PublishedResultResponse, DisputeRequest, ResolveDisputeRequest, DisputeResponse } from "./ranking.api";

export { notificationApi } from "./notification.api";
export type { NotificationResponse, NotificationType } from "./notification.api";

export { auditApi } from "./audit.api";
export type { AuditLogResponse, AuditListParams, AuditRangeParams, AuditExportRequest } from "./audit.api";

export { publicApi } from "./public.api";
export type { PlatformStats } from "./public.api";

export { scoringTemplateApi } from "./scoring-template.api";
export type { ScoringTemplateResponse, ScoringTemplateCriterionResponse, CreateScoringTemplateRequest, CriterionRequest } from "./scoring-template.api";

export { systemConfigApi } from "./system-config.api";
export type { SystemConfigResponse, SystemConfigRequest } from "./system-config.api";

export { enrollmentApi } from "./enrollment.api";
export type { EnrollmentResponse, EnrollmentStatus, ExternalEnrollmentRequest, UpdateMatchingProfileRequest } from "./enrollment.api";

export { mentorChatApi } from "./mentor-chat.api";
export type { ChatMessageResponse, ChatMessageRequest } from "./mentor-chat.api";

export { mentorInvitationApi } from "./mentor-invitation.api";
export type { MentorInvitationResponse, MentorInvitationStatus, SendMentorInvitationRequest, RespondMentorInvitationRequest, MentorRoomResponse } from "./mentor-invitation.api";

export { teamJudgeAssignmentApi } from "./team-judge-assignment.api";
export type { TeamJudgeAssignmentResponse, AssignJudgeToTeamRequest } from "./team-judge-assignment.api";

export { joinRequestApi } from "./join-request.api";
export type { JoinableTeamResponse, TeamJoinRequestResponse, JoinRequestStatus, CreateJoinRequestRequest } from "./join-request.api";

export { leaveRequestApi } from "./leave-request.api";
export type { TeamLeaveRequestResponse, LeaveRequestStatus, CreateLeaveRequestRequest } from "./leave-request.api";

export { trackApi } from "./track.api";
export type { TrackResponse, CreateTrackRequest, AssignTrackTopicRequest } from "./track.api";

export { livescoreApi } from "./livescore.api";
export type { LiveScoreBoard, LiveScoreEntry, RankingEvent, LeaderboardParams, LiveScoreStatus, TrackInfo } from "./livescore.api";

export { trackAssignmentApi } from "./track-assignment.api";
export type {
  TrackAssignmentMethod,
  TrackAssignmentResponse,
  TrackAssignRequest,
  TrackDrawResultResponse,
  TrackDrawRequest,
  DrawSessionStatus,
  TrackStatus,
  AvailableTrackSlotResponse,
  TrackDrawSessionResponse,
  OpenTrackDrawSessionRequest,
  TrackLockResponse,
} from "./track-assignment.api";

export { finalistApi } from "./finalist.api";
export type {
  FinalistResponse,
  FinalistSelectResultResponse,
  ContestedSlotResponse,
  ContestedTeamResponse,
  FinalistSelectionSummaryResponse,
  FinalistSelectionMethod,
  ContestedSlotType,
} from "./finalist.api";
export { formatSelectionMethod, formatContestedSlotType } from "./finalist.utils";

export { awardApi } from "./award.api";
export type {
  TeamAwardResponse,
  ParticipationCertificateResponse,
  ParticipationCertificateSummaryResponse,
  AwardAssignmentResultResponse,
} from "./award.api";

export { scoreReviewApi } from "./score-review.api";
export type {
  ScoreReviewResponse,
  ScoreReviewJudgeScore,
  ScoreReviewStatus,
  ResolveScoreReviewRequest,
} from "./score-review.api";

export { participantFeedbackApi } from "./participant-feedback.api";
export type {
  ParticipantFeedbackResponse,
  ParticipantFeedbackSummaryResponse,
  SubmitParticipantFeedbackRequest,
} from "./participant-feedback.api";
