package com.sealhackathon.team.service;

import com.sealhackathon.auth.service.AuthEmailService;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.dto.snapshot.EventSnapshot;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.team.domain.EventEnrollment;
import com.sealhackathon.team.domain.TeamMember;
import com.sealhackathon.team.domain.enums.EnrollmentStatus;
import com.sealhackathon.team.dto.request.EnrollRequest;
import com.sealhackathon.team.dto.response.EnrollmentResponse;
import com.sealhackathon.team.repository.EventEnrollmentRepository;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
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

        if (event.getSemesterMin() != null && event.getSemesterMax() != null && user.getSemester() != null) {
            if (user.getSemester() < event.getSemesterMin() || user.getSemester() > event.getSemesterMax()) {
                throw new BusinessException(
                        "Your semester (" + user.getSemester() + ") does not meet the requirement (semester " +
                                event.getSemesterMin() + "-" + event.getSemesterMax() + ")",
                        HttpStatus.BAD_REQUEST) {};
            }
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
                    null,
                    true);
            user = userPublicService.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        } else if (user.getUserType() != UserType.EXTERNAL_STUDENT) {
            throw new BusinessException(
                    "This email is already registered as a non-external account",
                    HttpStatus.CONFLICT) {};
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
    public EnrollmentResponse approveEnrollment(UUID enrollmentId) {
        EventEnrollment enrollment = getEnrollmentEntity(enrollmentId);
        if (enrollment.getStatus() != EnrollmentStatus.PENDING) {
            throw new BusinessException("Only PENDING enrollments can be approved", HttpStatus.BAD_REQUEST) {};
        }
        enrollment.setStatus(EnrollmentStatus.APPROVED);
        EventEnrollment saved = enrollmentRepository.save(enrollment);
        UserSnapshot user = userPublicService.findById(saved.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", saved.getUserId()));
        userPublicService.activateParticipant(saved.getUserId());
        if (user.getUserType() == UserType.EXTERNAL_STUDENT) {
            String tempPassword = UUID.randomUUID().toString();
            userPublicService.updatePassword(saved.getUserId(), passwordEncoder.encode(tempPassword));
            authEmailService.sendEnrollmentCredentialsEmail(
                    user.getEmail(), user.getFullName(), tempPassword);
        }
        return toResponse(saved, user);
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
                .enrolledAt(enrollment.getEnrolledAt());

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
}
