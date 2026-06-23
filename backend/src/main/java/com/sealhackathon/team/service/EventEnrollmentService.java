package com.sealhackathon.team.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.dto.snapshot.EventSnapshot;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.team.domain.EventEnrollment;
import com.sealhackathon.team.domain.enums.EnrollmentStatus;
import com.sealhackathon.team.dto.response.EnrollmentResponse;
import com.sealhackathon.team.repository.EventEnrollmentRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventEnrollmentService {

    private final EventEnrollmentRepository enrollmentRepository;
    private final EventPublicService eventPublicService;
    private final UserPublicService userPublicService;

    @Transactional
    public EnrollmentResponse enroll(UUID userId, UUID eventId) {
        if (enrollmentRepository.existsByUserIdAndEventId(userId, eventId)) {
            throw new DuplicateResourceException("Enrollment", "userId+eventId", userId + "+" + eventId);
        }

        long activeEnrollments = enrollmentRepository.countByUserIdAndStatusIn(
                userId, List.of(EnrollmentStatus.PENDING, EnrollmentStatus.APPROVED));
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

        EventEnrollment enrollment = EventEnrollment.builder()
                .userId(userId)
                .eventId(eventId)
                .status(EnrollmentStatus.APPROVED)
                .enrolledAt(LocalDateTime.now())
                .build();

        enrollment = enrollmentRepository.save(enrollment);
        return toResponse(enrollment, user);
    }

    @Transactional
    public EnrollmentResponse approveEnrollment(UUID enrollmentId) {
        EventEnrollment enrollment = getEnrollmentEntity(enrollmentId);
        if (enrollment.getStatus() != EnrollmentStatus.PENDING) {
            throw new BusinessException("Only PENDING enrollments can be approved", HttpStatus.BAD_REQUEST) {};
        }
        enrollment.setStatus(EnrollmentStatus.APPROVED);
        return toResponse(enrollmentRepository.save(enrollment), null);
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
        enrollment.setStatus(EnrollmentStatus.WITHDRAWN);
        enrollmentRepository.save(enrollment);
    }

    @Transactional(readOnly = true)
    public EnrollmentResponse getMyActiveEnrollment(UUID userId) {
        EventEnrollment enrollment = enrollmentRepository.findByUserIdAndStatusIn(
                userId, List.of(EnrollmentStatus.APPROVED))
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
            builder.userFullName(user.getFullName()).userEmail(user.getEmail());
        } else {
            userPublicService.findById(enrollment.getUserId()).ifPresent(u ->
                    builder.userFullName(u.getFullName()).userEmail(u.getEmail()));
        }

        return builder.build();
    }
}
