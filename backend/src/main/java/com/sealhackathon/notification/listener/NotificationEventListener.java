package com.sealhackathon.notification.listener;

import com.sealhackathon.event.event.JudgeAssignedEvent;
import com.sealhackathon.event.event.MentorAssignedEvent;
import com.sealhackathon.event.event.ScoringWindowReopenedEvent;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.notification.domain.Notification;
import com.sealhackathon.notification.domain.enums.NotificationType;
import com.sealhackathon.notification.service.EmailService;
import com.sealhackathon.notification.service.NotificationService;
import com.sealhackathon.progress.domain.enums.ProgressRiskReason;
import com.sealhackathon.progress.event.TeamProgressAlertEvent;
import com.sealhackathon.ranking.event.DisputeFiledEvent;
import com.sealhackathon.ranking.event.ResultsPublishedEvent;
import com.sealhackathon.submission.event.SubmissionCreatedEvent;
import com.sealhackathon.team.event.InvitationAcceptedEvent;
import com.sealhackathon.team.event.InvitationSentEvent;
import com.sealhackathon.team.event.InvitationsExpiredDueToTeamFullEvent;
import com.sealhackathon.team.event.JoinRequestCreatedEvent;
import com.sealhackathon.team.event.JoinRequestResolvedEvent;
import com.sealhackathon.team.event.LeaveRequestCreatedEvent;
import com.sealhackathon.team.event.LeaveRequestResolvedEvent;
import com.sealhackathon.team.event.MemberKickedEvent;
import com.sealhackathon.team.event.TeamConfirmedEvent;
import com.sealhackathon.team.event.TeamCreatedEvent;
import com.sealhackathon.team.event.MentorTeamAssignedEvent;
import com.sealhackathon.team.repository.MentorTeamRepository;
import com.sealhackathon.team.service.TeamPublicService;
import com.sealhackathon.user.event.AccountApprovedEvent;
import com.sealhackathon.user.event.AccountRejectedEvent;
import com.sealhackathon.user.event.InternalAccountCreatedEvent;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationService notificationService;
    private final EmailService emailService;
    private final UserPublicService userPublicService;
    private final MentorTeamRepository mentorTeamRepository;
    private final TeamPublicService teamPublicService;
    private final HackathonEventRepository hackathonEventRepository;

    // ── User Module Events ──

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onAccountApproved(AccountApprovedEvent event) {
        notify(NotificationType.ACCOUNT_APPROVED,
                "Account Approved",
                "Your account has been approved. You can now log in to the system.",
                event.userId(), "User",
                List.of(event.userId()));
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onAccountRejected(AccountRejectedEvent event) {
        notify(NotificationType.ACCOUNT_REJECTED,
                "Account Rejected",
                "Your account has been rejected. Reason: " + event.reason(),
                event.userId(), "User",
                List.of(event.userId()));
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
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
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onTeamCreated(TeamCreatedEvent event) {
        notify(NotificationType.TEAM_REGISTERED,
                "Team Created",
                "Team '" + event.teamName() + "' has been created successfully.",
                event.teamId(), "Team",
                List.of(event.leaderId()));
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onTeamConfirmed(TeamConfirmedEvent event) {
        notify(NotificationType.TEAM_CONFIRMED,
                "Team Confirmed",
                "Your team now has " + event.memberCount() + " members and is confirmed.",
                event.teamId(), "Team",
                List.of());
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onInvitationSent(InvitationSentEvent event) {
        userPublicService.findByEmail(event.inviteeEmail()).ifPresent(invitee ->
                notify(NotificationType.INVITATION_RECEIVED,
                        "Team Invitation",
                        "You have been invited to a team. Check your invitations to accept or decline.",
                        event.teamId(), "Team",
                        List.of(invitee.getId())));
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onInvitationAccepted(InvitationAcceptedEvent event) {
        notify(NotificationType.INVITATION_ACCEPTED,
                "Invitation Accepted",
                event.memberName() + " has joined team " + event.teamName(),
                event.teamId(), "Team",
                List.of(event.leaderId()));
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onInvitationsExpiredDueToTeamFull(InvitationsExpiredDueToTeamFullEvent event) {
        List<UUID> recipients = event.inviteeEmails().stream()
                .map(userPublicService::findByEmail)
                .flatMap(Optional::stream)
                .map(UserSnapshot::getId)
                .distinct()
                .toList();

        notify(NotificationType.INVITATION_EXPIRED,
                "Invitation Expired",
                "Team '" + event.teamName() + "' is now full. Your invitation has expired.",
                event.teamId(), "Team",
                recipients);
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onJoinRequestCreated(JoinRequestCreatedEvent event) {
        notify(NotificationType.JOIN_REQUEST_RECEIVED,
                "Join Request",
                "There is a request to join team " + event.teamName(),
                event.teamId(), "Team",
                List.of(event.leaderId()));
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
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
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onLeaveRequestCreated(LeaveRequestCreatedEvent event) {
        notify(NotificationType.LEAVE_REQUEST_CREATED,
                "Leave Request",
                event.userFullName() + " requested to leave team " + event.teamName(),
                event.teamId(), "Team",
                event.coordinatorIds());
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
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
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onMemberKicked(MemberKickedEvent event) {
        notify(NotificationType.MEMBER_KICKED,
                "Removed from Team",
                "You have been removed from team " + event.teamName(),
                event.teamId(), "Team",
                List.of(event.userId()));
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onMentorTeamAssigned(MentorTeamAssignedEvent event) {
        notify(NotificationType.MENTOR_TEAM_ASSIGNED,
                "Mentor Assigned to Team",
                "You have been assigned as a mentor to a team.",
                event.teamId(), "Team",
                List.of(event.mentorId()));
    }

    // ── Submission Module Events ──

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onSubmissionCreated(SubmissionCreatedEvent event) {
        List<UUID> recipients = new ArrayList<>();
        teamPublicService.getTeamMemberUserIds(event.teamId(), true)
                .forEach(recipients::add);
        mentorTeamRepository.findByTeamId(event.teamId())
                .ifPresent(mt -> recipients.add(mt.getMentorUserId()));

        notify(NotificationType.SUBMISSION_CREATED,
                "Submission Received",
                "Your team's submission (version " + event.versionNumber() + ") has been received.",
                event.submissionId(), "Submission",
                recipients.stream().distinct().toList());
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onTeamProgressAlert(TeamProgressAlertEvent event) {
        List<UUID> recipients = new ArrayList<>();
        mentorTeamRepository.findByTeamId(event.teamId())
                .ifPresent(mt -> recipients.add(mt.getMentorUserId()));
        recipients.addAll(teamPublicService.getTeamMemberUserIds(event.teamId(), true));
        resolveCoordinatorId(event.eventId()).ifPresent(recipients::add);

        notify(NotificationType.TEAM_PROGRESS_ALERT,
                "Team progress alert",
                buildProgressAlertMessage(event.reasons()),
                event.teamId(), "Team",
                recipients.stream().distinct().toList());
    }

    // ── Event Module Events ──

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onJudgeAssigned(JudgeAssignedEvent event) {
        notify(NotificationType.JUDGE_ASSIGNED,
                "Judge Assignment",
                "You have been assigned as a judge for a round. Please check your assignments.",
                event.roundId(), "Round",
                List.of(event.judgeId()));
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onMentorAssigned(MentorAssignedEvent event) {
        notify(NotificationType.MENTOR_ASSIGNED,
                "Mentor Assignment",
                "You have been assigned as a mentor for a hackathon event.",
                event.eventId(), "Event",
                List.of(event.mentorId()));
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onScoringWindowReopened(ScoringWindowReopenedEvent event) {
        notify(NotificationType.SCORING_REOPENED,
                "Scoring Window Re-opened",
                "The scoring window for the round has been re-opened. New deadline: " + event.newDeadline(),
                event.roundId(), "Round",
                List.of());
    }

    // ── Ranking Module Events ──

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onResultsPublished(ResultsPublishedEvent event) {
        notify(NotificationType.RESULTS_PUBLISHED,
                "Results Published",
                "The results for the round have been published. Check your rankings. " +
                        "Dispute deadline: " + event.disputeDeadline(),
                event.roundId(), "Round",
                List.of());
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onDisputeFiled(DisputeFiledEvent event) {
        notify(NotificationType.DISPUTE_FILED,
                "Dispute Filed",
                "A dispute has been filed for round results. Dispute ID: " + event.disputeId(),
                event.disputeId(), "Dispute",
                List.of(event.filedBy()));
    }

    // ═══ Helper ═══

    /** Empty when the event has no attributable owner; callers simply skip that recipient. */
    private Optional<UUID> resolveCoordinatorId(UUID eventId) {
        return hackathonEventRepository.findById(eventId)
                .map(event -> event.getOwnerUserId());
    }

    private String buildProgressAlertMessage(List<ProgressRiskReason> reasons) {
        return reasons.stream()
                .map(this::describeProgressReason)
                .collect(Collectors.joining(" "));
    }

    private String describeProgressReason(ProgressRiskReason reason) {
        return switch (reason) {
            case NOT_STARTED -> "Team has not started submitting before the deadline.";
            case SLIDE_ONLY_PAST_GATE -> "Slide deadline passed but GitHub/source or Other not submitted.";
            case SINGLE_VERSION_LAST_MINUTE -> "Only one last-minute submission with no follow-up edits.";
            case STALLED -> "No recent updates for an extended period.";
            case MISSING_ATTACHMENT -> "Submission is missing required attachments.";
        };
    }

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
