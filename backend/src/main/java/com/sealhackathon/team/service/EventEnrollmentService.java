package com.sealhackathon.team.service;

import com.sealhackathon.auth.service.AuthEmailService;
import com.sealhackathon.auth.service.MagicLinkTokenService;
import com.sealhackathon.common.enums.StudentStanding;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.common.service.SystemConfigService;
import com.sealhackathon.common.util.UniversityUtils;
import com.sealhackathon.event.dto.snapshot.EventSnapshot;
import com.sealhackathon.event.service.AllowedEmailDomainService;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.event.service.FormatRuleEngine;
import com.sealhackathon.ranking.dto.FinalRankResult;
import com.sealhackathon.ranking.service.RankingService;
import com.sealhackathon.team.domain.EventEnrollment;
import com.sealhackathon.team.domain.Invitation;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.TeamMember;
import com.sealhackathon.team.domain.enums.EnrollmentStatus;
import com.sealhackathon.team.domain.enums.InvitationStatus;
import com.sealhackathon.team.domain.enums.TeamMemberRole;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.dto.request.EnrollRequest;
import com.sealhackathon.team.dto.request.UpdateMatchingProfileRequest;
import com.sealhackathon.infrastructure.mail.MailSendException;
import com.sealhackathon.team.dto.response.CompetitionHistoryItem;
import com.sealhackathon.team.dto.response.EnrollmentActionResult;
import com.sealhackathon.team.dto.response.EnrollmentResponse;
import com.sealhackathon.team.dto.response.MatchingCandidateResponse;
import com.sealhackathon.team.dto.response.PublicMatchingProfileResponse;
import com.sealhackathon.team.event.MemberLeftEvent;
import com.sealhackathon.team.repository.EventEnrollmentRepository;
import com.sealhackathon.team.repository.InvitationRepository;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventEnrollmentService {

    private final EventEnrollmentRepository enrollmentRepository;
    private final EventPublicService eventPublicService;
    private final UserPublicService userPublicService;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamRepository teamRepository;
    private final InvitationRepository invitationRepository;
    private final RankingService rankingService;
    private final FormatRuleEngine formatRuleEngine;
    private final PasswordEncoder passwordEncoder;
    private final AuthEmailService authEmailService;
    private final AllowedEmailDomainService allowedEmailDomainService;
    private final MagicLinkTokenService magicLinkTokenService;
    private final SystemConfigService systemConfigService;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    private static final List<EnrollmentStatus> ACTIVE_STATUSES =
            List.of(EnrollmentStatus.PENDING, EnrollmentStatus.APPROVED);

    @Transactional
    public EnrollmentResponse enroll(UUID userId, UUID eventId) {
        // A WITHDRAWN row is kept for history; re-enrolling reactivates it instead of failing
        // on the (user_id, event_id) unique constraint.
        Optional<EventEnrollment> existing = enrollmentRepository.findByUserIdAndEventId(userId, eventId);
        if (existing.isPresent() && existing.get().getStatus() != EnrollmentStatus.WITHDRAWN) {
            throw new DuplicateResourceException("Enrollment", "userId+eventId", userId + "+" + eventId);
        }

        long activeEnrollments = enrollmentRepository.countByUserIdAndStatusIn(
                userId, ACTIVE_STATUSES);
        if (activeEnrollments > 0) {
            throw new BusinessException(
                    "You are already enrolled in another event. Leave that event first.",
                    HttpStatus.CONFLICT) {};
        }

        EventSnapshot event = eventPublicService.getEvent(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        if (!event.isOpenForEnrollment()) {
            throw new BusinessException("Event is not open for enrollment", HttpStatus.BAD_REQUEST) {};
        }

        UserSnapshot user = userPublicService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        assertEligibleParticipant(user, event);

        if (user.getUserType() == UserType.EXTERNAL_STUDENT) {
            allowedEmailDomainService.validateEmailForEvent(eventId, user.getEmail());
        }

        EnrollmentStatus status = user.getUserType() == UserType.EXTERNAL_STUDENT
                ? EnrollmentStatus.PENDING
                : EnrollmentStatus.APPROVED;

        EventEnrollment enrollment = existing.orElseGet(() -> EventEnrollment.builder()
                .userId(userId)
                .eventId(eventId)
                .build());
        enrollment.setStatus(status);
        enrollment.setEnrolledAt(LocalDateTime.now());
        enrollment.setLookingForTeam(false);
        enrollment.setProfilePublic(false);

        enrollment = enrollmentRepository.save(enrollment);
        return toResponse(enrollment, user);
    }

    @Transactional
    public EnrollmentResponse enrollExternal(UUID eventId, EnrollRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        EventSnapshot event = eventPublicService.getEvent(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        if (!event.isOpenForEnrollment()) {
            throw new BusinessException("Event is not open for enrollment", HttpStatus.BAD_REQUEST) {};
        }

        if (request.getStudentStanding() == StudentStanding.GRADUATED) {
            throw new BusinessException(
                    "Graduated students are not eligible to participate",
                    HttpStatus.BAD_REQUEST) {};
        }

        allowedEmailDomainService.validateExternalStudentForEvent(
                eventId, email, request.getUniversityName().trim());

        assertSemesterEligible(request.getSemester());

        UUID userId;
        String tempPassword = null;
        UserSnapshot user = userPublicService.findByEmail(email).orElse(null);

        if (user == null) {
            tempPassword = UUID.randomUUID().toString();
            userId = userPublicService.createParticipant(
                    email,
                    passwordEncoder.encode(tempPassword),
                    request.getFullName().trim(),
                    null,
                    request.getStudentId().trim(),
                    request.getUniversityName().trim(),
                    UserType.EXTERNAL_STUDENT,
                    request.getSemester(),
                    true,
                    request.getStudentStanding());
            user = userPublicService.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        } else if (user.getUserType() != UserType.EXTERNAL_STUDENT) {
            throw new BusinessException(
                    "This email is already registered as a non-external account",
                    HttpStatus.CONFLICT) {};
        }

        if (user != null && request.getSemester() != null) {
            UUID existingUserId = user.getId();
            userPublicService.updateSemester(existingUserId, request.getSemester());
            user = userPublicService.findById(existingUserId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", existingUserId));
        }

        if (user != null && user.getStudentStanding() == StudentStanding.GRADUATED) {
            throw new BusinessException(
                    "Graduated students are not eligible to participate",
                    HttpStatus.BAD_REQUEST) {};
        }

        Optional<EventEnrollment> existing =
                enrollmentRepository.findByUserIdAndEventId(user.getId(), eventId);
        if (existing.isPresent() && existing.get().getStatus() != EnrollmentStatus.WITHDRAWN) {
            throw new DuplicateResourceException("Enrollment", "userId+eventId", user.getId() + "+" + eventId);
        }

        if (enrollmentRepository.existsActiveEnrollmentInOtherEvent(user.getId(), eventId, ACTIVE_STATUSES)) {
            throw new BusinessException(
                    "This student is already enrolled in another event",
                    HttpStatus.CONFLICT) {};
        }

        UUID enrollUserId = user.getId();
        EventEnrollment enrollment = existing.orElseGet(() -> EventEnrollment.builder()
                .userId(enrollUserId)
                .eventId(eventId)
                .build());
        enrollment.setStatus(EnrollmentStatus.PENDING);
        enrollment.setEnrolledAt(LocalDateTime.now());
        enrollment.setLookingForTeam(false);
        enrollment.setProfilePublic(false);

        enrollment = enrollmentRepository.save(enrollment);
        return toResponse(enrollment, user);
    }

    public void requireApprovedEnrollment(UUID userId, UUID eventId) {
        EventEnrollment enrollment = enrollmentRepository.findByUserIdAndEventId(userId, eventId)
                .orElseThrow(() -> new BusinessException(
                        "You must enroll in this event before joining a team",
                        HttpStatus.BAD_REQUEST) {});

        if (enrollment.getStatus() != EnrollmentStatus.APPROVED) {
            throw new BusinessException(
                    "Your enrollment is pending approval",
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    public void requireOnWaitingList(UUID userId, UUID eventId) {
        requireApprovedEnrollment(userId, eventId);
        if (teamMemberRepository.existsActiveByUserIdAndEventId(userId, eventId)) {
            throw new BusinessException("User is already in a team for this event",
                    HttpStatus.CONFLICT) {};
        }
    }

    public void requireCanViewWaitingList(UUID userId, UUID eventId) {
        requireApprovedEnrollment(userId, eventId);
    }

    public boolean hasActiveEnrollmentInOtherEvent(UUID userId, UUID eventId) {
        return enrollmentRepository.existsActiveEnrollmentInOtherEvent(userId, eventId, ACTIVE_STATUSES);
    }

    @Transactional
    public EnrollmentActionResult approveEnrollment(UUID enrollmentId) {
        EventEnrollment enrollment = getEnrollmentEntity(enrollmentId);
        if (enrollment.getStatus() != EnrollmentStatus.PENDING) {
            throw new BusinessException("Only PENDING enrollments can be approved", HttpStatus.BAD_REQUEST) {};
        }
        enrollment.setStatus(EnrollmentStatus.APPROVED);
        EventEnrollment saved = enrollmentRepository.save(enrollment);
        userPublicService.activateParticipantForEnrollment(saved.getUserId());
        UserSnapshot user = userPublicService.findById(saved.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", saved.getUserId()));

        String message = "Enrollment approved";
        if (user.getUserType() == UserType.EXTERNAL_STUDENT) {
            try {
                sendExternalStudentLoginLink(user, saved.getEventId());
            } catch (MailSendException e) {
                message = "Enrollment approved but email delivery failed: " + e.getMessage();
            }
        }
        return new EnrollmentActionResult(toResponse(saved, user), message);
    }

    @Transactional
    public EnrollmentResponse resendCredentials(UUID enrollmentId) {
        EventEnrollment enrollment = getEnrollmentEntity(enrollmentId);
        if (enrollment.getStatus() != EnrollmentStatus.APPROVED) {
            throw new BusinessException(
                    "Login link can only be resent for APPROVED enrollments",
                    HttpStatus.BAD_REQUEST) {};
        }

        UserSnapshot user = userPublicService.findById(enrollment.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", enrollment.getUserId()));
        if (user.getUserType() != UserType.EXTERNAL_STUDENT) {
            throw new BusinessException(
                    "Login link email is only available for external students",
                    HttpStatus.BAD_REQUEST) {};
        }

        UUID userId = user.getId();
        userPublicService.activateParticipantForEnrollment(userId);
        UserSnapshot refreshedUser = userPublicService.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        try {
            sendExternalStudentLoginLink(refreshedUser, enrollment.getEventId());
        } catch (MailSendException e) {
            throw new BusinessException(
                    "Failed to send login link email: " + e.getMessage(),
                    HttpStatus.BAD_REQUEST) {};
        }
        return toResponse(enrollment, refreshedUser);
    }

    private void sendExternalStudentLoginLink(UserSnapshot user, UUID eventId) {
        EventSnapshot event = eventPublicService.getEvent(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
        String token = magicLinkTokenService.createToken(user.getId(), eventId);
        String magicLinkUrl = frontendUrl + "/magic-login?token=" + token;
        authEmailService.sendEnrollmentApprovedMagicLinkEmail(
                user.getEmail(), user.getFullName(), event.getName(), magicLinkUrl);
    }

    @Transactional
    public EnrollmentResponse rejectEnrollment(UUID enrollmentId) {
        EventEnrollment enrollment = getEnrollmentEntity(enrollmentId);
        if (enrollment.getStatus() != EnrollmentStatus.PENDING) {
            throw new BusinessException("Only PENDING enrollments can be rejected", HttpStatus.BAD_REQUEST) {};
        }
        enrollment.setStatus(EnrollmentStatus.REJECTED);
        return toResponse(enrollmentRepository.save(enrollment), null);
    }

    /**
     * Student voluntarily leaves the event before the competition starts.
     * Also removes them from their team (if any). Leaders transfer to another member when possible.
     */
    @Transactional
    public void withdrawEnrollment(UUID userId, UUID eventId) {
        formatRuleEngine.assertCanModifyTeamMembers(eventId);

        EventEnrollment enrollment = enrollmentRepository.findByUserIdAndEventId(userId, eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", "userId+eventId", userId + "+" + eventId));

        if (enrollment.getStatus() != EnrollmentStatus.PENDING
                && enrollment.getStatus() != EnrollmentStatus.APPROVED) {
            throw new BusinessException("Enrollment is not active", HttpStatus.BAD_REQUEST) {};
        }

        teamMemberRepository.findByUserIdAndEventId(userId, eventId)
                .ifPresent(member -> removeFromTeamOnEventLeave(member));

        enrollment.setStatus(EnrollmentStatus.WITHDRAWN);
        enrollmentRepository.save(enrollment);
    }

    /**
     * System force-withdraw after undersized-team cleanup or similar phase transitions.
     * Does not check competition phase — caller already removed team membership.
     */
    @Transactional
    public void forceWithdrawEnrollment(UUID userId, UUID eventId) {
        enrollmentRepository.findByUserIdAndEventId(userId, eventId).ifPresent(enrollment -> {
            if (enrollment.getStatus() == EnrollmentStatus.PENDING
                    || enrollment.getStatus() == EnrollmentStatus.APPROVED) {
                enrollment.setStatus(EnrollmentStatus.WITHDRAWN);
                enrollmentRepository.save(enrollment);
            }
        });
    }

    private void removeFromTeamOnEventLeave(TeamMember membership) {
        Team team = membership.getTeam();
        UUID userId = membership.getUserId();
        UUID teamId = team.getId();
        boolean wasLeader = userId.equals(team.getLeaderId());

        teamMemberRepository.delete(membership);
        eventPublisher.publishEvent(new MemberLeftEvent(teamId, userId));

        List<TeamMember> remaining = teamMemberRepository.findByTeamId(teamId);
        if (remaining.isEmpty()) {
            team.setStatus(TeamStatus.DISBANDED);
            team.setRecruiting(false);
            teamRepository.save(team);
            return;
        }

        if (wasLeader) {
            TeamMember newLeader = remaining.getFirst();
            newLeader.setRole(TeamMemberRole.LEADER);
            teamMemberRepository.save(newLeader);
            team.setLeaderId(newLeader.getUserId());
        }

        int minSize = systemConfigService.getConfig().getMinTeamMembers();
        if (remaining.size() < minSize && team.getStatus() == TeamStatus.CONFIRMED) {
            team.setStatus(TeamStatus.FORMING);
        }
        teamRepository.save(team);
    }

    @Transactional(readOnly = true)
    public EnrollmentResponse getMyActiveEnrollment(UUID userId) {
        EventEnrollment enrollment = enrollmentRepository.findByUserIdAndStatusIn(
                userId, ACTIVE_STATUSES)
                .stream()
                .findFirst()
                .orElse(null);
        if (enrollment == null) return null;
        return toResponse(enrollment, null);
    }

    @Transactional(readOnly = true)
    public EnrollmentResponse getMyEnrollment(UUID userId, UUID eventId) {
        EventEnrollment enrollment = enrollmentRepository.findByUserIdAndEventId(userId, eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", "userId+eventId", userId + "+" + eventId));
        return toResponse(enrollment, null);
    }

    @Transactional(readOnly = true)
    public List<EnrollmentResponse> listEnrollments(UUID eventId, EnrollmentStatus status) {
        List<EventEnrollment> enrollments = (status != null)
                ? enrollmentRepository.findByEventIdAndStatus(eventId, status)
                : enrollmentRepository.findByEventId(eventId);
        return enrollments.stream().map(e -> toResponse(e, null)).toList();
    }

    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getWaitingList(UUID eventId) {
        return enrollmentRepository.findWaitingList(eventId).stream()
                .map(e -> toResponse(e, null))
                .toList();
    }

    @Transactional
    public EnrollmentResponse updateMatchingProfile(
            UUID userId, UUID eventId, UpdateMatchingProfileRequest request) {
        EventEnrollment enrollment = enrollmentRepository.findByUserIdAndEventId(userId, eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", "userId+eventId",
                        userId + "+" + eventId));

        if (enrollment.getStatus() != EnrollmentStatus.APPROVED) {
            throw new BusinessException(
                    "Your enrollment must be approved before updating matching profile",
                    HttpStatus.BAD_REQUEST) {};
        }

        boolean onTeam = teamMemberRepository.existsActiveByUserIdAndEventId(userId, eventId);
        if (onTeam) {
            if (request.isLookingForTeam()) {
                throw new BusinessException(
                        "Cannot enable looking-for-team while you are on a team",
                        HttpStatus.BAD_REQUEST) {};
            }
            enrollment.setLookingForTeam(false);
        } else {
            enrollment.setLookingForTeam(request.isLookingForTeam());
            if (request.isLookingForTeam()) {
                enrollment.setProfilePublic(request.isProfilePublic());
            }
        }
        enrollment.setPreferredRole(normalizePreferredRole(request.getPreferredRole()));

        return toResponse(enrollmentRepository.save(enrollment), null);
    }

    public void requireCanManageFindingMembers(UUID leaderId, UUID eventId, UUID teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));

        if (!team.getEventId().equals(eventId)) {
            throw new BusinessException("Team does not belong to this event", HttpStatus.BAD_REQUEST) {};
        }
        if (!team.getLeaderId().equals(leaderId)) {
            throw new BusinessException("Only the team leader can manage finding members",
                    HttpStatus.FORBIDDEN) {};
        }

        formatRuleEngine.assertCanModifyTeamMembers(eventId);
        LocalDateTime deadline = eventPublicService.getRegistrationDeadline(eventId);
        if (deadline != null && LocalDateTime.now().isAfter(deadline)) {
            throw new BusinessException("Registration deadline has passed", HttpStatus.BAD_REQUEST) {};
        }

        int currentSize = teamMemberRepository.countByTeamId(teamId);
        int maxTeamSize = systemConfigService.getConfig().getMaxTeamMembers();
        if (currentSize >= maxTeamSize) {
            throw new BusinessException("Team is already full", HttpStatus.BAD_REQUEST) {};
        }
    }

    @Transactional(readOnly = true)
    public List<MatchingCandidateResponse> getFindingMembersCandidates(
            UUID leaderId, UUID eventId, UUID teamId) {
        requireCanManageFindingMembers(leaderId, eventId, teamId);

        List<EventEnrollment> enrollments =
                enrollmentRepository.findFindingMembersCandidates(eventId, leaderId);

        Set<String> pendingInviteeEmails = invitationRepository
                .findByTeamIdAndStatus(teamId, InvitationStatus.PENDING).stream()
                .map(Invitation::getInviteeEmail)
                .map(String::toLowerCase)
                .collect(Collectors.toCollection(HashSet::new));

        return enrollments.stream()
                .map(enrollment -> {
                    UserSnapshot user = userPublicService.findById(enrollment.getUserId())
                            .orElse(null);
                    String email = user != null ? user.getEmail().toLowerCase() : "";
                    boolean hasPendingInvitation = user != null && pendingInviteeEmails.contains(email);
                    return MatchingCandidateResponse.builder()
                            .userId(enrollment.getUserId())
                            .fullName(user != null ? user.getFullName() : null)
                            .userType(user != null ? user.getUserType() : null)
                            .universityName(user != null
                                    ? UniversityUtils.resolveUniversityName(
                                            user.getUserType(), user.getUniversityName())
                                    : null)
                            .semester(user != null ? user.getSemester() : null)
                            .preferredRole(enrollment.getPreferredRole())
                            .isProfilePublic(enrollment.isProfilePublic())
                            .hasPendingInvitation(hasPendingInvitation)
                            .build();
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public PublicMatchingProfileResponse getPublicMatchingProfile(
            UUID targetUserId, UUID leaderId, UUID eventId, UUID teamId) {
        requireCanManageFindingMembers(leaderId, eventId, teamId);

        EventEnrollment enrollment = enrollmentRepository.findByUserIdAndEventId(targetUserId, eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", "userId+eventId",
                        targetUserId + "+" + eventId));

        if (enrollment.getStatus() != EnrollmentStatus.APPROVED) {
            throw new BusinessException("Candidate enrollment is not approved", HttpStatus.BAD_REQUEST) {};
        }
        if (!enrollment.isLookingForTeam()) {
            throw new BusinessException("Candidate is not looking for a team", HttpStatus.BAD_REQUEST) {};
        }
        if (teamMemberRepository.existsActiveByUserIdAndEventId(targetUserId, eventId)) {
            throw new BusinessException("Candidate is already on a team", HttpStatus.CONFLICT) {};
        }
        if (!enrollment.isProfilePublic()) {
            throw new BusinessException("This profile is not public", HttpStatus.FORBIDDEN) {};
        }

        UserSnapshot user = userPublicService.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));

        List<CompetitionHistoryItem> competitions = teamMemberRepository.findByUserId(targetUserId).stream()
                .map(TeamMember::getTeam)
                .filter(team -> team != null)
                .map(team -> {
                    EventSnapshot event = eventPublicService.getEvent(team.getEventId()).orElse(null);
                    if (event == null) {
                        return null;
                    }
                    FinalRankResult rankResult = rankingService.getFinalRankForTeam(team.getId(), team.getEventId());
                    return CompetitionHistoryItem.builder()
                            .eventId(event.getId())
                            .eventName(event.getName())
                            .season(event.getSeason())
                            .year(event.getYear())
                            .teamName(team.getName())
                            .finalRank(rankResult.finalRank())
                            .outcome(rankResult.outcome())
                            .achievedAt(event.getEndDate())
                            .build();
                })
                .filter(item -> item != null)
                .sorted(Comparator
                        .comparing(CompetitionHistoryItem::getYear, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(CompetitionHistoryItem::getSeason, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        return PublicMatchingProfileResponse.builder()
                .userId(targetUserId)
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .studentId(user.getStudentId())
                .userType(user.getUserType())
                .universityName(UniversityUtils.resolveUniversityName(
                        user.getUserType(), user.getUniversityName()))
                .studentStanding(user.getStudentStanding())
                .semester(user.getSemester())
                .temporaryAccount(user.isTemporaryAccount())
                .createdAt(user.getCreatedAt())
                .competitions(competitions)
                .build();
    }

    private EventEnrollment getEnrollmentEntity(UUID enrollmentId) {
        return enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", "id", enrollmentId));
    }

    private static String normalizePreferredRole(String preferredRole) {
        if (preferredRole == null) {
            return null;
        }
        String trimmed = preferredRole.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private EnrollmentResponse toResponse(EventEnrollment enrollment, UserSnapshot user) {
        EnrollmentResponse.EnrollmentResponseBuilder builder = EnrollmentResponse.builder()
                .id(enrollment.getId())
                .userId(enrollment.getUserId())
                .eventId(enrollment.getEventId())
                .status(enrollment.getStatus())
                .enrolledAt(enrollment.getEnrolledAt())
                .isLookingForTeam(enrollment.isLookingForTeam())
                .isProfilePublic(enrollment.isProfilePublic())
                .preferredRole(enrollment.getPreferredRole());

        if (user != null) {
            builder.userFullName(user.getFullName())
                    .userEmail(user.getEmail())
                    .userStudentId(user.getStudentId())
                    .userUniversityName(user.getUniversityName())
                    .semester(user.getSemester());
        } else {
            userPublicService.findById(enrollment.getUserId()).ifPresent(u ->
                    builder.userFullName(u.getFullName())
                            .userEmail(u.getEmail())
                            .userStudentId(u.getStudentId())
                            .userUniversityName(u.getUniversityName())
                            .semester(u.getSemester()));
        }

        return builder.build();
    }

    private void assertEligibleParticipant(UserSnapshot user, EventSnapshot event) {
        if (user.getStudentStanding() == StudentStanding.GRADUATED) {
            throw new BusinessException(
                    "Graduated students are not eligible to participate",
                    HttpStatus.BAD_REQUEST) {};
        }
        assertSemesterEligible(user);
    }

    private void assertSemesterEligible(Integer semester) {
        Integer semesterMin = systemConfigService.getConfig().getSemesterMin();
        Integer semesterMax = systemConfigService.getConfig().getSemesterMax();
        if (semesterMin == null || semesterMax == null) {
            return;
        }
        if (semester == null) {
            throw new BusinessException(
                    "Semester information is required for this event (semester "
                            + semesterMin + "-" + semesterMax + ")",
                    HttpStatus.BAD_REQUEST) {};
        }
        if (semester < semesterMin || semester > semesterMax) {
            throw new BusinessException(
                    "Your semester (" + semester + ") does not meet the requirement (semester "
                            + semesterMin + "-" + semesterMax + ")",
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    private void assertSemesterEligible(UserSnapshot user) {
        assertSemesterEligible(user.getSemester());
    }
}
