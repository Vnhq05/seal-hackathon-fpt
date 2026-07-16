package com.sealhackathon.audit.listener;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sealhackathon.audit.service.AuditService;
import com.sealhackathon.auth.event.LoginFailedEvent;
import com.sealhackathon.auth.event.PasswordResetEvent;
import com.sealhackathon.auth.event.UserLoggedInEvent;
import com.sealhackathon.event.event.EventActivatedEvent;
import com.sealhackathon.event.event.EventConfigChangedEvent;
import com.sealhackathon.event.event.EventCreatedEvent;
import com.sealhackathon.event.event.JudgeAssignedEvent;
import com.sealhackathon.event.event.MentorAssignedEvent;
import com.sealhackathon.event.event.ScoringWindowReopenedEvent;
import com.sealhackathon.feedback.event.ParticipantFeedbackSubmittedEvent;
import com.sealhackathon.judging.event.ConflictDetectedEvent;
import com.sealhackathon.judging.event.ScoreCreatedEvent;
import com.sealhackathon.judging.event.ScoreDeletedEvent;
import com.sealhackathon.judging.event.ScoreReviewCreatedEvent;
import com.sealhackathon.judging.event.ScoreReviewResolvedEvent;
import com.sealhackathon.judging.event.ScoreUpdatedEvent;
import com.sealhackathon.ranking.event.DisputeFiledEvent;
import com.sealhackathon.ranking.event.DisputeResolvedEvent;
import com.sealhackathon.ranking.event.RankingRecalculatedEvent;
import com.sealhackathon.ranking.event.ResultsPublishedEvent;
import com.sealhackathon.submission.event.SubmissionCreatedEvent;
import com.sealhackathon.submission.event.SubmissionUpdatedEvent;
import com.sealhackathon.team.event.InvitationSentEvent;
import com.sealhackathon.team.event.JoinRequestCreatedEvent;
import com.sealhackathon.team.event.JoinRequestResolvedEvent;
import com.sealhackathon.team.event.LeaveRequestCreatedEvent;
import com.sealhackathon.team.event.LeaveRequestResolvedEvent;
import com.sealhackathon.team.event.MemberJoinedEvent;
import com.sealhackathon.team.event.MemberLeftEvent;
import com.sealhackathon.team.event.MentorTeamAssignedEvent;
import com.sealhackathon.team.event.TeamConfirmedEvent;
import com.sealhackathon.team.event.TeamCreatedEvent;
import com.sealhackathon.user.event.AccountApprovedEvent;
import com.sealhackathon.user.event.AccountRejectedEvent;
import com.sealhackathon.user.event.InternalAccountCreatedEvent;
import com.sealhackathon.user.event.ProfileUpdatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuditEventListener {

    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    private static final UUID SYSTEM_ACTOR = UUID.fromString("00000000-0000-0000-0000-000000000000");

    // ═══════════════════════════════════════
    //  Auth Module
    // ═══════════════════════════════════════

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onUserLoggedIn(UserLoggedInEvent e) {
        auditService.log(e.userId(), "USER_LOGGED_IN", e.userId(), "User",
                null, null, e.ipAddress());
    }

    // AFTER_COMPLETION, not the default AFTER_COMMIT: login() throws on bad credentials, so its
    // transaction always rolls back and an AFTER_COMMIT handler would never run -- brute force would
    // stay invisible in the audit trail even though the lockout counter engages. The failure is the
    // thing being audited here, so it must be recorded whichever way the transaction resolves.
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMPLETION)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onLoginFailed(LoginFailedEvent e) {
        auditService.log(SYSTEM_ACTOR, "LOGIN_FAILED", null, "User",
                null, json("email", e.email(), "attempt", e.attemptCount()),
                e.ipAddress());
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onPasswordReset(PasswordResetEvent e) {
        auditService.log(e.userId(), "PASSWORD_RESET", e.userId(), "User",
                null, null, null);
    }

    // ═══════════════════════════════════════
    //  User Module
    // ═══════════════════════════════════════

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onAccountApproved(AccountApprovedEvent e) {
        auditService.log(SYSTEM_ACTOR, "ACCOUNT_APPROVED", e.userId(), "User",
                json("status", "PENDING"), json("status", "ACTIVE"), null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onAccountRejected(AccountRejectedEvent e) {
        auditService.log(SYSTEM_ACTOR, "ACCOUNT_REJECTED", e.userId(), "User",
                json("status", "PENDING"),
                json("status", "REJECTED", "reason", e.reason()), null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onInternalAccountCreated(InternalAccountCreatedEvent e) {
        auditService.log(SYSTEM_ACTOR, "INTERNAL_ACCOUNT_CREATED", e.userId(), "User",
                null, json("role", e.role()), null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onProfileUpdated(ProfileUpdatedEvent e) {
        auditService.log(e.userId(), "PROFILE_UPDATED", e.userId(), "User",
                null, json("changedFields", e.changedFields()), null);
    }

    // ═══════════════════════════════════════
    //  Event Module
    // ═══════════════════════════════════════

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onEventCreated(EventCreatedEvent e) {
        auditService.log(SYSTEM_ACTOR, "EVENT_CREATED", e.eventId(), "HackathonEvent",
                null, json("name", e.name()), null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onEventActivated(EventActivatedEvent e) {
        auditService.log(SYSTEM_ACTOR, "EVENT_ACTIVATED", e.eventId(), "HackathonEvent",
                json("status", "DRAFT"), json("status", "ACTIVE"), null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onEventConfigChanged(EventConfigChangedEvent e) {
        auditService.log(SYSTEM_ACTOR, "EVENT_CONFIG_CHANGED", e.eventId(), "HackathonEvent",
                json(e.field(), e.oldValue()),
                json(e.field(), e.newValue()), null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onJudgeAssigned(JudgeAssignedEvent e) {
        auditService.log(SYSTEM_ACTOR, "JUDGE_ASSIGNED", e.assignmentId(), "JudgeAssignment",
                null, json("judgeId", e.judgeId(), "roundId", e.roundId()), null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onMentorAssigned(MentorAssignedEvent e) {
        auditService.log(SYSTEM_ACTOR, "MENTOR_ASSIGNED", e.assignmentId(), "MentorAssignment",
                null, json("mentorId", e.mentorId(), "eventId", e.eventId()), null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onScoringWindowReopened(ScoringWindowReopenedEvent e) {
        auditService.log(SYSTEM_ACTOR, "SCORING_WINDOW_REOPENED", e.roundId(), "Round",
                null, json("newDeadline", e.newDeadline()), null);
    }

    // ═══════════════════════════════════════
    //  Team Module
    // ═══════════════════════════════════════

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onTeamCreated(TeamCreatedEvent e) {
        auditService.log(e.leaderId(), "TEAM_CREATED", e.teamId(), "Team",
                null, json("name", e.teamName()), null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onTeamConfirmed(TeamConfirmedEvent e) {
        auditService.log(SYSTEM_ACTOR, "TEAM_CONFIRMED", e.teamId(), "Team",
                json("status", "FORMING"),
                json("status", "CONFIRMED", "memberCount", e.memberCount()), null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onMemberJoined(MemberJoinedEvent e) {
        auditService.log(e.userId(), "MEMBER_JOINED", e.teamId(), "Team",
                null, json("role", e.role()), null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onMemberLeft(MemberLeftEvent e) {
        auditService.log(e.userId(), "MEMBER_LEFT", e.teamId(), "Team",
                null, null, null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onInvitationSent(InvitationSentEvent e) {
        auditService.log(SYSTEM_ACTOR, "INVITATION_SENT", e.invitationId(), "Invitation",
                null, json("inviteeEmail", e.inviteeEmail()), null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onJoinRequestCreated(JoinRequestCreatedEvent e) {
        safeLog(e.requesterId(), "JOIN_REQUEST_CREATED", e.joinRequestId(), "TeamJoinRequest",
                null, json("teamId", e.teamId()), null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onJoinRequestResolved(JoinRequestResolvedEvent e) {
        safeLog(SYSTEM_ACTOR, e.accepted() ? "JOIN_REQUEST_ACCEPTED" : "JOIN_REQUEST_REJECTED",
                e.joinRequestId(), "TeamJoinRequest",
                null, json("requesterId", e.requesterId()), null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onLeaveRequestCreated(LeaveRequestCreatedEvent e) {
        auditService.log(e.userId(), "LEAVE_REQUEST_CREATED", e.leaveRequestId(), "TeamLeaveRequest",
                null, json("teamId", e.teamId()), null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onLeaveRequestResolved(LeaveRequestResolvedEvent e) {
        auditService.log(SYSTEM_ACTOR, e.approved() ? "LEAVE_REQUEST_APPROVED" : "LEAVE_REQUEST_REJECTED",
                e.leaveRequestId(), "TeamLeaveRequest",
                null, json("userId", e.userId()), null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onMentorTeamAssigned(MentorTeamAssignedEvent e) {
        auditService.log(SYSTEM_ACTOR, "MENTOR_TEAM_ASSIGNED", e.teamId(), "MentorTeam",
                null, json("mentorId", e.mentorId()), null);
    }

    // ═══════════════════════════════════════
    //  Submission Module
    // ═══════════════════════════════════════

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onSubmissionCreated(SubmissionCreatedEvent e) {
        auditService.log(SYSTEM_ACTOR, "SUBMISSION_CREATED", e.submissionId(), "Submission",
                null, json("version", e.versionNumber()), null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onSubmissionUpdated(SubmissionUpdatedEvent e) {
        auditService.log(SYSTEM_ACTOR, "SUBMISSION_UPDATED", e.submissionId(), "Submission",
                null, json("newVersion", e.newVersionNumber()), null);
    }

    // ═══════════════════════════════════════
    //  Judging Module
    // ═══════════════════════════════════════

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onScoreCreated(ScoreCreatedEvent e) {
        auditService.log(e.judgeId(), "SCORE_CREATED", e.judgeScoreId(), "JudgeScore",
                null, json("judgeId", e.judgeId(), "teamId", e.teamId(), "roundId", e.roundId(),
                        "submissionId", e.submissionId(), "timestamp", LocalDateTime.now()), null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onScoreUpdated(ScoreUpdatedEvent e) {
        for (var change : e.changes()) {
            auditService.log(e.judgeId(), "SCORE_UPDATED", e.judgeScoreId(), "JudgeScore",
                    json("oldScore", change.oldScore()),
                    json("judgeId", e.judgeId(), "teamId", e.teamId(), "roundId", e.roundId(),
                            "criteriaId", change.criteriaId(), "oldScore", change.oldScore(),
                            "newScore", change.newScore(), "timestamp", LocalDateTime.now()), null);
        }
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onScoreDeleted(ScoreDeletedEvent e) {
        auditService.log(e.judgeId(), "SCORE_DELETED", e.judgeScoreId(), "JudgeScore",
                null, null, null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onConflictDetected(ConflictDetectedEvent e) {
        auditService.log(e.judgeId(), "CONFLICT_DETECTED", e.submissionId(), "JudgeScore",
                null, json("teamId", e.teamId()), null);
    }

    // ═══════════════════════════════════════
    //  Ranking Module
    // ═══════════════════════════════════════

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onRankingRecalculated(RankingRecalculatedEvent e) {
        auditService.log(SYSTEM_ACTOR, "RANKING_RECALCULATED", e.roundId(), "Ranking",
                null, json("version", e.version(), "teamCount", e.teamCount()), null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onResultsPublished(ResultsPublishedEvent e) {
        auditService.log(e.publishedBy(), "RESULTS_PUBLISHED", e.roundId(), "PublishedResult",
                null, json("disputeDeadline", e.disputeDeadline()), null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onDisputeFiled(DisputeFiledEvent e) {
        auditService.log(e.filedBy(), "DISPUTE_FILED", e.disputeId(), "Dispute",
                null, json("teamId", e.teamId()), null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onDisputeResolved(DisputeResolvedEvent e) {
        auditService.log(e.resolvedBy(), "DISPUTE_RESOLVED", e.disputeId(), "Dispute",
                null, json("resolution", e.resolution()), null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onScoreReviewCreated(ScoreReviewCreatedEvent e) {
        auditService.log(SYSTEM_ACTOR, "SCORE_REVIEW_CREATED", e.reviewId(), "ScoreReviewRequest",
                null, json("submissionId", e.submissionId(),
                        "deviationValue", e.deviationValue()), null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onScoreReviewResolved(ScoreReviewResolvedEvent e) {
        auditService.log(e.resolvedBy(), "SCORE_REVIEW_RESOLVED", e.reviewId(), "ScoreReviewRequest",
                null, json("status", e.status()), null);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onParticipantFeedbackSubmitted(ParticipantFeedbackSubmittedEvent e) {
        auditService.log(e.userId(), "PARTICIPANT_FEEDBACK_SUBMITTED", e.feedbackId(), "ParticipantFeedback",
                null, json("eventId", e.eventId(), "teamId", e.teamId(),
                        "overallRating", e.overallRating()), null);
    }

    /**
     * Audit payloads were concatenated by hand, so any value carrying a quote or backslash
     * produced a row no parser could read -- team names, event names and rejection reasons are
     * all free text. Jackson also renders a null as null rather than the string "null".
     */
    private String json(Object... keyValuePairs) {
        Map<String, Object> payload = new LinkedHashMap<>();
        for (int i = 0; i < keyValuePairs.length; i += 2) {
            payload.put(String.valueOf(keyValuePairs[i]), keyValuePairs[i + 1]);
        }
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            log.error("Failed to serialize audit payload for keys {}", payload.keySet(), ex);
            return null;
        }
    }

    private void safeLog(UUID actorId, String action, UUID targetId, String targetType,
                         String oldValue, String newValue, String ipAddress) {
        try {
            auditService.log(actorId, action, targetId, targetType, oldValue, newValue, ipAddress);
        } catch (Exception e) {
            log.error("Failed to write audit log for action {}", action, e);
        }
    }
}
