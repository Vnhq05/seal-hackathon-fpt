package com.sealhackathon.team.service;

import com.sealhackathon.auth.service.AuthEmailService;
import com.sealhackathon.auth.service.MagicLinkTokenService;
import com.sealhackathon.common.enums.StudentStanding;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.dto.snapshot.EventSnapshot;
import com.sealhackathon.event.service.AllowedEmailDomainService;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.team.domain.EventEnrollment;
import com.sealhackathon.team.domain.TeamMember;
import com.sealhackathon.team.domain.enums.EnrollmentStatus;
import com.sealhackathon.team.dto.request.EnrollRequest;
import com.sealhackathon.team.dto.request.UpdateMatchingProfileRequest;
import com.sealhackathon.infrastructure.mail.MailSendException;
import com.sealhackathon.team.dto.response.EnrollmentActionResult;
import com.sealhackathon.team.dto.response.EnrollmentResponse;
import com.sealhackathon.team.repository.EventEnrollmentRepository;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventEnrollmentService {

    private final EventEnrollmentRepository enrollmentRepository;
    private final EventPublicService eventPublicService;
    private final UserPublicService userPublicService;
    private final TeamMemberRepository teamMemberRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthEmailService authEmailService;
    private final AllowedEmailDomainService allowedEmailDomainService;
    private final MagicLinkTokenService magicLinkTokenService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    private static final List<EnrollmentStatus> ACTIVE_STATUSES =
            List.of(EnrollmentStatus.PENDING, EnrollmentStatus.APPROVED);

    @Transactional
    public EnrollmentResponse enroll(UUID userId, UUID eventId) {
        if (enrollmentRepository.existsByUserIdAndEventId(userId, eventId)) {
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

        EventEnrollment enrollment = EventEnrollment.builder()
                .userId(userId)
                .eventId(eventId)
                .status(status)
                .enrolledAt(LocalDateTime.now())
                .build();

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

        if (event.getSemesterMin() != null && event.getSemesterMax() != null) {
            assertSemesterEligible(request.getSemester(), event);
        }

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

        if (enrollmentRepository.existsByUserIdAndEventId(user.getId(), eventId)) {
            throw new DuplicateResourceException("Enrollment", "userId+eventId", user.getId() + "+" + eventId);
        }

        if (enrollmentRepository.existsActiveEnrollmentInOtherEvent(user.getId(), eventId, ACTIVE_STATUSES)) {
            throw new BusinessException(
                    "This student is already enrolled in another event",
                    HttpStatus.CONFLICT) {};
        }

        EventEnrollment enrollment = EventEnrollment.builder()
                .userId(user.getId())
                .eventId(eventId)
                .status(EnrollmentStatus.PENDING)
                .enrolledAt(LocalDateTime.now())
                .build();

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
        if (teamMemberRepository.existsByUserIdAndEventId(userId, eventId)) {
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

    @Transactional
    public void withdrawEnrollment(UUID userId, UUID eventId) {
        EventEnrollment enrollment = enrollmentRepository.findByUserIdAndEventId(userId, eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", "userId+eventId", userId + "+" + eventId));

        Optional<TeamMember> teamMember = teamMemberRepository.findByUserIdAndEventId(userId, eventId);
        if (teamMember.isPresent()) {
            throw new BusinessException(
                    "Cannot withdraw enrollment while on a team. Leave the team first.",
                    HttpStatus.BAD_REQUEST) {};
        }

        enrollment.setStatus(EnrollmentStatus.WITHDRAWN);
        enrollmentRepository.save(enrollment);
    }

    @Transactional(readOnly = true)
    public EnrollmentResponse getMyActiveEnrollment(UUID userId) {
        EventEnrollment enrollment = enrollmentRepository.findByUserIdAndStatusIn(
                userId, ACTIVE_STATUSES)
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

        boolean onTeam = teamMemberRepository.existsByUserIdAndEventId(userId, eventId);
        if (onTeam) {
            if (request.isLookingForTeam()) {
                throw new BusinessException(
                        "Cannot enable looking-for-team while you are on a team",
                        HttpStatus.BAD_REQUEST) {};
            }
            enrollment.setLookingForTeam(false);
        } else {
            enrollment.setLookingForTeam(request.isLookingForTeam());
        }
        enrollment.setPreferredRole(request.getPreferredRole());

        return toResponse(enrollmentRepository.save(enrollment), null);
    }

    private EventEnrollment getEnrollmentEntity(UUID enrollmentId) {
        return enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", "id", enrollmentId));
    }

    private EnrollmentResponse toResponse(EventEnrollment enrollment, UserSnapshot user) {
        EnrollmentResponse.EnrollmentResponseBuilder builder = EnrollmentResponse.builder()
                .id(enrollment.getId())
                .userId(enrollment.getUserId())
                .eventId(enrollment.getEventId())
                .status(enrollment.getStatus())
                .enrolledAt(enrollment.getEnrolledAt())
                .isLookingForTeam(enrollment.isLookingForTeam())
                .preferredRole(enrollment.getPreferredRole());

        if (user != null) {
            builder.userFullName(user.getFullName())
                    .userEmail(user.getEmail())
                    .userStudentId(user.getStudentId())
                    .userUniversityName(user.getUniversityName());
        } else {
            userPublicService.findById(enrollment.getUserId()).ifPresent(u ->
                    builder.userFullName(u.getFullName())
                            .userEmail(u.getEmail())
                            .userStudentId(u.getStudentId())
                            .userUniversityName(u.getUniversityName()));
        }

        return builder.build();
    }

    private void assertEligibleParticipant(UserSnapshot user, EventSnapshot event) {
        if (user.getStudentStanding() == StudentStanding.GRADUATED) {
            throw new BusinessException(
                    "Graduated students are not eligible to participate",
                    HttpStatus.BAD_REQUEST) {};
        }
        assertSemesterEligible(user, event);
    }

    private void assertSemesterEligible(Integer semester, EventSnapshot event) {
        if (event.getSemesterMin() == null || event.getSemesterMax() == null) {
            return;
        }
        if (semester == null) {
            throw new BusinessException(
                    "Semester information is required for this event (semester "
                            + event.getSemesterMin() + "-" + event.getSemesterMax() + ")",
                    HttpStatus.BAD_REQUEST) {};
        }
        if (semester < event.getSemesterMin() || semester > event.getSemesterMax()) {
            throw new BusinessException(
                    "Your semester (" + semester + ") does not meet the requirement (semester "
                            + event.getSemesterMin() + "-" + event.getSemesterMax() + ")",
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    private void assertSemesterEligible(UserSnapshot user, EventSnapshot event) {
        assertSemesterEligible(user.getSemester(), event);
    }
}
