package com.sealhackathon.event.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.enums.CompetitionFormat;
import com.sealhackathon.event.repository.AllowedEmailDomainRepository;
import com.sealhackathon.event.repository.HackathonEventRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AllowedEmailDomainServiceTest {

    @Mock private AllowedEmailDomainRepository domainRepository;
    @Mock private HackathonEventRepository eventRepository;

    @InjectMocks private AllowedEmailDomainService allowedEmailDomainService;

    @Test
    void validateExternalRegistration_shouldPass_whenEduVnEmailAndUniversityProvided() {
        assertThatCode(() -> allowedEmailDomainService.validateExternalRegistration(
                "student@hcmut.edu.vn",
                "Ho Chi Minh City University of Technology"))
                .doesNotThrowAnyException();
    }

    @Test
    void validateExternalRegistration_shouldPass_whenSubdomainEndsWithEduVn() {
        assertThatCode(() -> allowedEmailDomainService.validateExternalRegistration(
                "alice@student.hcmus.edu.vn",
                "Vietnam National University Ho Chi Minh City - University of Science"))
                .doesNotThrowAnyException();
    }

    @Test
    void validateExternalRegistration_shouldThrow_whenEmailNotEduVn() {
        assertThatThrownBy(() -> allowedEmailDomainService.validateExternalRegistration(
                "user@gmail.com",
                "Ho Chi Minh City University of Technology"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining(".edu.vn");
    }

    @Test
    void validateExternalRegistration_shouldThrow_whenUniversityMissing() {
        assertThatThrownBy(() -> allowedEmailDomainService.validateExternalRegistration(
                "student@hcmut.edu.vn",
                null))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("University name is required");
    }

    @Test
    void validateExternalStudentForEvent_shouldPass_whenEduVnEmail() {
        UUID eventId = UUID.randomUUID();
        HackathonEvent event = HackathonEvent.builder()
                .competitionFormat(CompetitionFormat.SEAL_RAG_2026)
                .build();
        event.setId(eventId);

        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        assertThatCode(() -> allowedEmailDomainService.validateExternalStudentForEvent(
                eventId,
                "student@uit.edu.vn",
                "University of Information Technology"))
                .doesNotThrowAnyException();
    }

    @Test
    void validateExternalStudentForEvent_shouldThrow_whenEmailNotEduVn() {
        UUID eventId = UUID.randomUUID();
        HackathonEvent event = HackathonEvent.builder()
                .competitionFormat(CompetitionFormat.SEAL_RAG_2026)
                .build();
        event.setId(eventId);

        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> allowedEmailDomainService.validateExternalStudentForEvent(
                eventId,
                "student@example.com",
                null))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining(".edu.vn");
    }
}
