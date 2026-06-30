package com.sealhackathon.team.service;

import com.sealhackathon.auth.service.AuthEmailService;
import com.sealhackathon.auth.service.MagicLinkTokenService;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.event.dto.snapshot.EventSnapshot;
import com.sealhackathon.event.service.AllowedEmailDomainService;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.infrastructure.mail.MailSendException;
import com.sealhackathon.team.domain.EventEnrollment;
import com.sealhackathon.team.domain.enums.EnrollmentStatus;
import com.sealhackathon.team.dto.response.EnrollmentActionResult;
import com.sealhackathon.team.repository.EventEnrollmentRepository;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventEnrollmentServiceMailTest {

    @Mock private EventEnrollmentRepository enrollmentRepository;
    @Mock private EventPublicService eventPublicService;
    @Mock private UserPublicService userPublicService;
    @Mock private TeamMemberRepository teamMemberRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthEmailService authEmailService;
    @Mock private AllowedEmailDomainService allowedEmailDomainService;
    @Mock private MagicLinkTokenService magicLinkTokenService;

    @InjectMocks private EventEnrollmentService enrollmentService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(enrollmentService, "frontendUrl", "http://localhost:3000");
    }

    @Test
    void approveEnrollment_sendsMagicLink_forExternalStudent() {
        UUID enrollmentId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        EventEnrollment enrollment = EventEnrollment.builder()
                .userId(userId)
                .eventId(eventId)
                .status(EnrollmentStatus.PENDING)
                .enrolledAt(LocalDateTime.now())
                .build();
        enrollment.setId(enrollmentId);
        UserSnapshot user = UserSnapshot.builder()
                .id(userId)
                .email("ext@hcmut.edu.vn")
                .fullName("External Student")
                .userType(UserType.EXTERNAL_STUDENT)
                .status(AccountStatus.PENDING)
                .build();
        EventSnapshot event = EventSnapshot.builder().id(eventId).name("SEAL Spring 2026").build();

        when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));
        when(enrollmentRepository.save(any(EventEnrollment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userPublicService.findById(userId)).thenReturn(Optional.of(user));
        when(eventPublicService.getEvent(eventId)).thenReturn(Optional.of(event));
        when(magicLinkTokenService.createToken(userId, eventId)).thenReturn("magic-token");

        EnrollmentActionResult result = enrollmentService.approveEnrollment(enrollmentId);

        assertThat(result.getMessage()).isEqualTo("Enrollment approved");
        assertThat(result.getEnrollment().getStatus()).isEqualTo(EnrollmentStatus.APPROVED);
        verify(userPublicService).activateParticipantForEnrollment(userId);
        verify(userPublicService, never()).updatePassword(any(), anyString());
        verify(authEmailService).sendEnrollmentApprovedMagicLinkEmail(
                eq("ext@hcmut.edu.vn"),
                eq("External Student"),
                eq("SEAL Spring 2026"),
                eq("http://localhost:3000/magic-login?token=magic-token"));
    }

    @Test
    void approveEnrollment_returnsWarningWhenMailFails() {
        UUID enrollmentId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        EventEnrollment enrollment = EventEnrollment.builder()
                .userId(userId)
                .eventId(eventId)
                .status(EnrollmentStatus.PENDING)
                .enrolledAt(LocalDateTime.now())
                .build();
        enrollment.setId(enrollmentId);
        UserSnapshot user = UserSnapshot.builder()
                .id(userId)
                .email("ext@hcmut.edu.vn")
                .fullName("External Student")
                .userType(UserType.EXTERNAL_STUDENT)
                .status(AccountStatus.PENDING)
                .build();
        EventSnapshot event = EventSnapshot.builder().id(eventId).name("SEAL Spring 2026").build();

        when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));
        when(enrollmentRepository.save(any(EventEnrollment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userPublicService.findById(userId)).thenReturn(Optional.of(user));
        when(eventPublicService.getEvent(eventId)).thenReturn(Optional.of(event));
        when(magicLinkTokenService.createToken(userId, eventId)).thenReturn("magic-token");
        doThrow(new MailSendException("Authentication failed", new RuntimeException()))
                .when(authEmailService)
                .sendEnrollmentApprovedMagicLinkEmail(anyString(), anyString(), anyString(), anyString());

        EnrollmentActionResult result = enrollmentService.approveEnrollment(enrollmentId);

        assertThat(result.getEnrollment().getStatus()).isEqualTo(EnrollmentStatus.APPROVED);
        assertThat(result.getMessage()).contains("email delivery failed");
    }

    @Test
    void resendCredentials_sendsMagicLink_forApprovedExternalStudent() {
        UUID enrollmentId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        EventEnrollment enrollment = EventEnrollment.builder()
                .userId(userId)
                .eventId(eventId)
                .status(EnrollmentStatus.APPROVED)
                .enrolledAt(LocalDateTime.now())
                .build();
        enrollment.setId(enrollmentId);
        UserSnapshot user = UserSnapshot.builder()
                .id(userId)
                .email("ext@hcmut.edu.vn")
                .fullName("External Student")
                .userType(UserType.EXTERNAL_STUDENT)
                .status(AccountStatus.LOCKED)
                .build();
        EventSnapshot event = EventSnapshot.builder().id(eventId).name("SEAL Spring 2026").build();

        when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));
        when(userPublicService.findById(userId)).thenReturn(Optional.of(user));
        when(eventPublicService.getEvent(eventId)).thenReturn(Optional.of(event));
        when(magicLinkTokenService.createToken(userId, eventId)).thenReturn("magic-token");

        enrollmentService.resendCredentials(enrollmentId);

        verify(userPublicService).activateParticipantForEnrollment(userId);
        verify(userPublicService, never()).updatePassword(any(), anyString());
        verify(authEmailService).sendEnrollmentApprovedMagicLinkEmail(
                eq("ext@hcmut.edu.vn"),
                eq("External Student"),
                eq("SEAL Spring 2026"),
                eq("http://localhost:3000/magic-login?token=magic-token"));
    }

    @Test
    void resendCredentials_rejectsPendingEnrollment() {
        UUID enrollmentId = UUID.randomUUID();
        EventEnrollment enrollment = EventEnrollment.builder()
                .userId(UUID.randomUUID())
                .eventId(UUID.randomUUID())
                .status(EnrollmentStatus.PENDING)
                .enrolledAt(LocalDateTime.now())
                .build();
        enrollment.setId(enrollmentId);

        when(enrollmentRepository.findById(enrollmentId)).thenReturn(Optional.of(enrollment));

        assertThatThrownBy(() -> enrollmentService.resendCredentials(enrollmentId))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("APPROVED");
    }
}
