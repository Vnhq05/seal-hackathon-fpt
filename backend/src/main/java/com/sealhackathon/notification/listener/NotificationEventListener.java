package com.sealhackathon.notification.listener;

import com.sealhackathon.event.event.JudgeAssignedEvent;
import com.sealhackathon.event.event.MentorAssignedEvent;
import com.sealhackathon.event.event.ScoringWindowReopenedEvent;
import com.sealhackathon.notification.domain.Notification;
import com.sealhackathon.notification.domain.enums.NotificationType;
import com.sealhackathon.notification.service.EmailService;
import com.sealhackathon.notification.service.NotificationService;
import com.sealhackathon.ranking.event.DisputeFiledEvent;
import com.sealhackathon.ranking.event.ResultsPublishedEvent;
import com.sealhackathon.submission.event.SubmissionCreatedEvent;
import com.sealhackathon.team.event.InvitationAcceptedEvent;
import com.sealhackathon.team.event.InvitationSentEvent;
import com.sealhackathon.team.event.JoinRequestCreatedEvent;
import com.sealhackathon.team.event.JoinRequestResolvedEvent;
import com.sealhackathon.team.event.LeaveRequestCreatedEvent;
import com.sealhackathon.team.event.LeaveRequestResolvedEvent;
import com.sealhackathon.team.event.MemberKickedEvent;
import com.sealhackathon.team.event.TeamConfirmedEvent;
import com.sealhackathon.team.event.TeamCreatedEvent;
import com.sealhackathon.team.event.MentorTeamAssignedEvent;
import com.sealhackathon.user.event.AccountApprovedEvent;
import com.sealhackathon.user.event.AccountRejectedEvent;
import com.sealhackathon.user.event.InternalAccountCreatedEvent;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationService notificationService;
    private final EmailService emailService;
    private final UserPublicService userPublicService;

    // ── User Module Events ──

    @TransactionalEventListener
    public void onAccountApproved(AccountApprovedEvent event) {
        notify(NotificationType.ACCOUNT_APPROVED,
                "Account Approved",
                "Your account has been approved. You can now log in to the system.",
                event.userId(), "User",
                List.of(event.userId()));
    }

    @TransactionalEventListener
    public void onAccountRejected(AccountRejectedEvent event) {
        notify(NotificationType.ACCOUNT_REJECTED,
                "Account Rejected",
                "Your account has been rejected. Reason: " + event.reason(),
                event.userId(), "User",
                List.of(event.userId()));
    }

    @TransactionalEventListener
    public void onInternalAccountCreated(InternalAccountCreatedEvent event) {
        notify(NotificationType.INTERNAL_ACCOUNT_CREATED,
                "Account Created",
                "An account has been created for you with role: " + event.role() +
                        ". Please check your email for login credentials.",
                event.userId(), "User",
                List.of(event.userId()));
    }

    // ── Team Module Events ──

    @TransactionalEventListener
    public void onTeamCreated(TeamCreatedEvent event) {
        notify(NotificationType.TEAM_REGISTERED,
                "Team Created",
                "Team '" + event.teamName() + "' has been created successfully.",
                event.teamId(), "Team",
                List.of(event.leaderId()));
    }

    @TransactionalEventListener
    public void onTeamConfirmed(TeamConfirmedEvent event) {
        notify(NotificationType.TEAM_CONFIRMED,
                "Team Confirmed",
                "Your team now has " + event.memberCount() + " members and is confirmed.",
                event.teamId(), "Team",
                List.of());
    }

    @TransactionalEventListener
    public void onInvitationSent(InvitationSentEvent event) {
        userPublicService.findByEmail(event.inviteeEmail()).ifPresent(invitee ->
                notify(NotificationType.INVITATION_RECEIVED,
                        "Team Invitation",
                        "You have been invited to a team. Check your invitations to accept or decline.",
                        event.teamId(), "Team",
                        List.of(invitee.getId())));
    }

    @TransactionalEventListener
    public void onInvitationAccepted(InvitationAcceptedEvent event) {
        notify(NotificationType.INVITATION_ACCEPTED,
                "Invitation Accepted",
                event.memberName() + " has joined team " + event.teamName(),
                event.teamId(), "Team",
                List.of(event.leaderId()));
    }

    @TransactionalEventListener
    public void onJoinRequestCreated(JoinRequestCreatedEvent event) {
        notify(NotificationType.JOIN_REQUEST_RECEIVED,
                "Join Request",
                "There is a request to join team " + event.teamName(),
                event.teamId(), "Team",
                List.of(event.leaderId()));
    }

    @TransactionalEventListener
    public void onJoinRequestResolved(JoinRequestResolvedEvent event) {
        if (event.accepted()) {
            notify(NotificationType.JOIN_REQUEST_ACCEPTED,
                    "Join Request Accepted",
                    "Your request to join team " + event.teamName() + " was accepted",
                    event.teamId(), "Team",
                    List.of(event.requesterId()));
        } else {
            notify(NotificationType.JOIN_REQUEST_REJECTED,
                    "Join Request Rejected",
                    "Your request to join team " + event.teamName() + " was declined",
                    event.teamId(), "Team",
                    List.of(event.requesterId()));
        }
    }

    @TransactionalEventListener
    public void onLeaveRequestCreated(LeaveRequestCreatedEvent event) {
        notify(NotificationType.LEAVE_REQUEST_CREATED,
                "Leave Request",
                event.userFullName() + " requested to leave team " + event.teamName(),
                event.teamId(), "Team",
                event.coordinatorIds());
    }

    @TransactionalEventListener
    public void onLeaveRequestResolved(LeaveRequestResolvedEvent event) {
        NotificationType type = event.approved()
                ? NotificationType.LEAVE_REQUEST_APPROVED
                : NotificationType.LEAVE_REQUEST_REJECTED;
        String message = event.approved()
                ? "Your request to leave team " + event.teamName() + " was approved"
                : "Your request to leave team " + event.teamName() + " was declined";
        notify(type, event.approved() ? "Leave Approved" : "Leave Rejected",
                message, event.teamId(), "Team",
                List.of(event.userId(), event.leaderId()));
    }

    @TransactionalEventListener
    public void onMemberKicked(MemberKickedEvent event) {
        notify(NotificationType.MEMBER_KICKED,
                "Removed from Team",
                "You have been removed from team " + event.teamName(),
                event.teamId(), "Team",
                List.of(event.userId()));
    }

    @TransactionalEventListener
    public void onMentorTeamAssigned(MentorTeamAssignedEvent event) {
        notify(NotificationType.MENTOR_TEAM_ASSIGNED,
                "Mentor Assigned to Team",
                "You have been assigned as a mentor to a team.",
                event.teamId(), "Team",
                List.of(event.mentorId()));
    }

    // ── Submission Module Events ──

    @TransactionalEventListener
    public void onSubmissionCreated(SubmissionCreatedEvent event) {
        notify(NotificationType.SUBMISSION_CREATED,
                "Submission Received",
                "Your team's submission (version " + event.versionNumber() + ") has been received.",
                event.submissionId(), "Submission",
                List.of());
    }

    // ── Event Module Events ──

    @TransactionalEventListener
    public void onJudgeAssigned(JudgeAssignedEvent event) {
        notify(NotificationType.JUDGE_ASSIGNED,
                "Judge Assignment",
                "You have been assigned as a judge for a round. Please check your assignments.",
                event.roundId(), "Round",
                List.of(event.judgeId()));
    }

    @TransactionalEventListener
    public void onMentorAssigned(MentorAssignedEvent event) {
        notify(NotificationType.MENTOR_ASSIGNED,
                "Mentor Assignment",
                "You have been assigned as a mentor for a hackathon event.",
                event.eventId(), "Event",
                List.of(event.mentorId()));
    }

    @TransactionalEventListener
    public void onScoringWindowReopened(ScoringWindowReopenedEvent event) {
        notify(NotificationType.SCORING_REOPENED,
                "Scoring Window Re-opened",
                "The scoring window for the round has been re-opened. New deadline: " + event.newDeadline(),
                event.roundId(), "Round",
                List.of());
    }

    // ── Ranking Module Events ──

    @TransactionalEventListener
    public void onResultsPublished(ResultsPublishedEvent event) {
        notify(NotificationType.RESULTS_PUBLISHED,
                "Results Published",
                "The results for the round have been published. Check your rankings. " +
                        "Dispute deadline: " + event.disputeDeadline(),
                event.roundId(), "Round",
                List.of());
    }

    @TransactionalEventListener
    public void onDisputeFiled(DisputeFiledEvent event) {
        notify(NotificationType.DISPUTE_FILED,
                "Dispute Filed",
                "A dispute has been filed for round results. Dispute ID: " + event.disputeId(),
                event.disputeId(), "Dispute",
                List.of(event.filedBy()));
    }

    // ═══ Helper ═══

    private void notify(NotificationType type, String title, String message,
                         UUID referenceId, String referenceType,
                         List<UUID> recipientUserIds) {
        if (recipientUserIds.isEmpty()) {
            log.debug("No recipients for notification: {} - {}", type, title);
            return;
        }

        try {
            Notification notification = notificationService.createNotification(
                    type, title, message, referenceId, referenceType, recipientUserIds);

            emailService.sendEmailsForNotification(notification);
        } catch (Exception e) {
            log.error("Failed to deliver notification {} - {}", type, title, e);
        }
    }
}
