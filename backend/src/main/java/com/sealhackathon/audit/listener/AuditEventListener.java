package com.sealhackathon.audit.listener;

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
import com.sealhackathon.judging.event.ConflictDetectedEvent;
import com.sealhackathon.judging.event.ScoreCreatedEvent;
import com.sealhackathon.judging.event.ScoreDeletedEvent;
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
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuditEventListener {

    private final AuditService auditService;

    private static final UUID SYSTEM_ACTOR = UUID.fromString("00000000-0000-0000-0000-000000000000");

    // ═══════════════════════════════════════
    //  Auth Module
    // ═══════════════════════════════════════

    @TransactionalEventListener
    public void onUserLoggedIn(UserLoggedInEvent e) {
        auditService.log(e.userId(), "USER_LOGGED_IN", e.userId(), "User",
                null, null, e.ipAddress());
    }

    @TransactionalEventListener
    public void onLoginFailed(LoginFailedEvent e) {
        auditService.log(SYSTEM_ACTOR, "LOGIN_FAILED", null, "User",
                null, "{\"email\":\"" + e.email() + "\",\"attempt\":" + e.attemptCount() + "}",
                e.ipAddress());
    }

    @TransactionalEventListener
    public void onPasswordReset(PasswordResetEvent e) {
        auditService.log(e.userId(), "PASSWORD_RESET", e.userId(), "User",
                null, null, null);
    }

    // ═══════════════════════════════════════
    //  User Module
    // ═══════════════════════════════════════

    @TransactionalEventListener
    public void onAccountApproved(AccountApprovedEvent e) {
        auditService.log(SYSTEM_ACTOR, "ACCOUNT_APPROVED", e.userId(), "User",
                "{\"status\":\"PENDING\"}", "{\"status\":\"ACTIVE\"}", null);
    }

    @TransactionalEventListener
    public void onAccountRejected(AccountRejectedEvent e) {
        auditService.log(SYSTEM_ACTOR, "ACCOUNT_REJECTED", e.userId(), "User",
                "{\"status\":\"PENDING\"}",
                "{\"status\":\"REJECTED\",\"reason\":\"" + e.reason() + "\"}", null);
    }

    @TransactionalEventListener
    public void onInternalAccountCreated(InternalAccountCreatedEvent e) {
        auditService.log(SYSTEM_ACTOR, "INTERNAL_ACCOUNT_CREATED", e.userId(), "User",
                null, "{\"role\":\"" + e.role() + "\"}", null);
    }

    @TransactionalEventListener
    public void onProfileUpdated(ProfileUpdatedEvent e) {
        auditService.log(e.userId(), "PROFILE_UPDATED", e.userId(), "User",
                null, "{\"changedFields\":" + e.changedFields() + "}", null);
    }

    // ═══════════════════════════════════════
    //  Event Module
    // ═══════════════════════════════════════

    @TransactionalEventListener
    public void onEventCreated(EventCreatedEvent e) {
        auditService.log(SYSTEM_ACTOR, "EVENT_CREATED", e.eventId(), "HackathonEvent",
                null, "{\"name\":\"" + e.name() + "\"}", null);
    }

    @TransactionalEventListener
    public void onEventActivated(EventActivatedEvent e) {
        auditService.log(SYSTEM_ACTOR, "EVENT_ACTIVATED", e.eventId(), "HackathonEvent",
                "{\"status\":\"DRAFT\"}", "{\"status\":\"ACTIVE\"}", null);
    }

    @TransactionalEventListener
    public void onEventConfigChanged(EventConfigChangedEvent e) {
        auditService.log(SYSTEM_ACTOR, "EVENT_CONFIG_CHANGED", e.eventId(), "HackathonEvent",
                "{\"" + e.field() + "\":\"" + e.oldValue() + "\"}",
                "{\"" + e.field() + "\":\"" + e.newValue() + "\"}", null);
    }

    @TransactionalEventListener
    public void onJudgeAssigned(JudgeAssignedEvent e) {
        auditService.log(SYSTEM_ACTOR, "JUDGE_ASSIGNED", e.assignmentId(), "JudgeAssignment",
                null, "{\"judgeId\":\"" + e.judgeId() + "\",\"roundId\":\"" + e.roundId() + "\"}", null);
    }

    @TransactionalEventListener
    public void onMentorAssigned(MentorAssignedEvent e) {
        auditService.log(SYSTEM_ACTOR, "MENTOR_ASSIGNED", e.assignmentId(), "MentorAssignment",
                null, "{\"mentorId\":\"" + e.mentorId() + "\",\"eventId\":\"" + e.eventId() + "\"}", null);
    }

    @TransactionalEventListener
    public void onScoringWindowReopened(ScoringWindowReopenedEvent e) {
        auditService.log(SYSTEM_ACTOR, "SCORING_WINDOW_REOPENED", e.roundId(), "Round",
                null, "{\"newDeadline\":\"" + e.newDeadline() + "\"}", null);
    }

    // ═══════════════════════════════════════
    //  Team Module
    // ═══════════════════════════════════════

    @TransactionalEventListener
    public void onTeamCreated(TeamCreatedEvent e) {
        auditService.log(e.leaderId(), "TEAM_CREATED", e.teamId(), "Team",
                null, "{\"name\":\"" + e.teamName() + "\"}", null);
    }

    @TransactionalEventListener
    public void onTeamConfirmed(TeamConfirmedEvent e) {
        auditService.log(SYSTEM_ACTOR, "TEAM_CONFIRMED", e.teamId(), "Team",
                "{\"status\":\"FORMING\"}",
                "{\"status\":\"CONFIRMED\",\"memberCount\":" + e.memberCount() + "}", null);
    }

    @TransactionalEventListener
    public void onMemberJoined(MemberJoinedEvent e) {
        auditService.log(e.userId(), "MEMBER_JOINED", e.teamId(), "Team",
                null, "{\"role\":\"" + e.role() + "\"}", null);
    }

    @TransactionalEventListener
    public void onMemberLeft(MemberLeftEvent e) {
        auditService.log(e.userId(), "MEMBER_LEFT", e.teamId(), "Team",
                null, null, null);
    }

    @TransactionalEventListener
    public void onInvitationSent(InvitationSentEvent e) {
        auditService.log(SYSTEM_ACTOR, "INVITATION_SENT", e.invitationId(), "Invitation",
                null, "{\"inviteeEmail\":\"" + e.inviteeEmail() + "\"}", null);
    }

    @TransactionalEventListener
    public void onJoinRequestCreated(JoinRequestCreatedEvent e) {
        safeLog(e.requesterId(), "JOIN_REQUEST_CREATED", e.joinRequestId(), "TeamJoinRequest",
                null, "{\"teamId\":\"" + e.teamId() + "\"}", null);
    }

    @TransactionalEventListener
    public void onJoinRequestResolved(JoinRequestResolvedEvent e) {
        safeLog(SYSTEM_ACTOR, e.accepted() ? "JOIN_REQUEST_ACCEPTED" : "JOIN_REQUEST_REJECTED",
                e.joinRequestId(), "TeamJoinRequest",
                null, "{\"requesterId\":\"" + e.requesterId() + "\"}", null);
    }

    @TransactionalEventListener
    public void onLeaveRequestCreated(LeaveRequestCreatedEvent e) {
        auditService.log(e.userId(), "LEAVE_REQUEST_CREATED", e.leaveRequestId(), "TeamLeaveRequest",
                null, "{\"teamId\":\"" + e.teamId() + "\"}", null);
    }

    @TransactionalEventListener
    public void onLeaveRequestResolved(LeaveRequestResolvedEvent e) {
        auditService.log(SYSTEM_ACTOR, e.approved() ? "LEAVE_REQUEST_APPROVED" : "LEAVE_REQUEST_REJECTED",
                e.leaveRequestId(), "TeamLeaveRequest",
                null, "{\"userId\":\"" + e.userId() + "\"}", null);
    }

    @TransactionalEventListener
    public void onMentorTeamAssigned(MentorTeamAssignedEvent e) {
        auditService.log(SYSTEM_ACTOR, "MENTOR_TEAM_ASSIGNED", e.teamId(), "MentorTeam",
                null, "{\"mentorId\":\"" + e.mentorId() + "\"}", null);
    }

    // ═══════════════════════════════════════
    //  Submission Module
    // ═══════════════════════════════════════

    @TransactionalEventListener
    public void onSubmissionCreated(SubmissionCreatedEvent e) {
        auditService.log(SYSTEM_ACTOR, "SUBMISSION_CREATED", e.submissionId(), "Submission",
                null, "{\"version\":" + e.versionNumber() + "}", null);
    }

    @TransactionalEventListener
    public void onSubmissionUpdated(SubmissionUpdatedEvent e) {
        auditService.log(SYSTEM_ACTOR, "SUBMISSION_UPDATED", e.submissionId(), "Submission",
                null, "{\"newVersion\":" + e.newVersionNumber() + "}", null);
    }

    // ═══════════════════════════════════════
    //  Judging Module
    // ═══════════════════════════════════════

    @TransactionalEventListener
    public void onScoreCreated(ScoreCreatedEvent e) {
        String payload = String.format(
                "{\"judgeId\":\"%s\",\"teamId\":\"%s\",\"roundId\":\"%s\",\"submissionId\":\"%s\",\"timestamp\":\"%s\"}",
                e.judgeId(), e.teamId(), e.roundId(), e.submissionId(), java.time.LocalDateTime.now());
        auditService.log(e.judgeId(), "SCORE_CREATED", e.judgeScoreId(), "JudgeScore",
                null, payload, null);
    }

    @TransactionalEventListener
    public void onScoreUpdated(ScoreUpdatedEvent e) {
        for (var change : e.changes()) {
            String oldVal = change.oldScore() != null ? change.oldScore().toString() : "null";
            String payload = String.format(
                    "{\"judgeId\":\"%s\",\"teamId\":\"%s\",\"roundId\":\"%s\",\"criteriaId\":\"%s\",\"oldScore\":%s,\"newScore\":%s,\"timestamp\":\"%s\"}",
                    e.judgeId(), e.teamId(), e.roundId(), change.criteriaId(),
                    oldVal, change.newScore(), java.time.LocalDateTime.now());
            auditService.log(e.judgeId(), "SCORE_UPDATED", e.judgeScoreId(), "JudgeScore",
                    "{\"oldScore\":" + oldVal + "}", payload, null);
        }
    }

    @TransactionalEventListener
    public void onScoreDeleted(ScoreDeletedEvent e) {
        auditService.log(e.judgeId(), "SCORE_DELETED", e.judgeScoreId(), "JudgeScore",
                null, null, null);
    }

    @TransactionalEventListener
    public void onConflictDetected(ConflictDetectedEvent e) {
        auditService.log(e.judgeId(), "CONFLICT_DETECTED", e.submissionId(), "JudgeScore",
                null, "{\"teamId\":\"" + e.teamId() + "\"}", null);
    }

    // ═══════════════════════════════════════
    //  Ranking Module
    // ═══════════════════════════════════════

    @TransactionalEventListener
    public void onRankingRecalculated(RankingRecalculatedEvent e) {
        auditService.log(SYSTEM_ACTOR, "RANKING_RECALCULATED", e.roundId(), "Ranking",
                null, "{\"version\":" + e.version() + ",\"teamCount\":" + e.teamCount() + "}", null);
    }

    @TransactionalEventListener
    public void onResultsPublished(ResultsPublishedEvent e) {
        auditService.log(e.publishedBy(), "RESULTS_PUBLISHED", e.roundId(), "PublishedResult",
                null, "{\"disputeDeadline\":\"" + e.disputeDeadline() + "\"}", null);
    }

    @TransactionalEventListener
    public void onDisputeFiled(DisputeFiledEvent e) {
        auditService.log(e.filedBy(), "DISPUTE_FILED", e.disputeId(), "Dispute",
                null, "{\"teamId\":\"" + e.teamId() + "\"}", null);
    }

    @TransactionalEventListener
    public void onDisputeResolved(DisputeResolvedEvent e) {
        auditService.log(e.resolvedBy(), "DISPUTE_RESOLVED", e.disputeId(), "Dispute",
                null, "{\"resolution\":\"" + e.resolution() + "\"}", null);
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
