package com.sealhackathon.event.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.event.domain.AllowedEmailDomain;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.enums.CompetitionFormat;
import com.sealhackathon.event.repository.AllowedEmailDomainRepository;
import com.sealhackathon.event.repository.HackathonEventRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
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
    void validateExternalRegistration_shouldPass_whenEmailAndUniversityMatch() {
        assertThatCode(() -> allowedEmailDomainService.validateExternalRegistration(
                "student@hcmut.edu.vn",
                "Ho Chi Minh City University of Technology"))
                .doesNotThrowAnyException();
    }

    @Test
    void validateExternalRegistration_shouldPass_whenSubdomainMatchesParentRule() {
        assertThatCode(() -> allowedEmailDomainService.validateExternalRegistration(
                "alice@student.hcmus.edu.vn",
                "Vietnam National University Ho Chi Minh City - University of Science"))
                .doesNotThrowAnyException();
    }

    @Test
    void validateExternalRegistration_shouldThrow_whenEmailDomainNotAllowed() {
        assertThatThrownBy(() -> allowedEmailDomainService.validateExternalRegistration(
                "user@gmail.com",
                "Ho Chi Minh City University of Technology"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Email domain is not allowed");
    }

    @Test
    void validateExternalRegistration_shouldThrow_whenUniversityDoesNotMatchEmail() {
        assertThatThrownBy(() -> allowedEmailDomainService.validateExternalRegistration(
                "student@hcmut.edu.vn",
                "University of Information Technology"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("University name does not match");
    }

    @Test
    void validateExternalStudentForEvent_shouldValidateUniversity_whenProvided() {
        UUID eventId = UUID.randomUUID();
        HackathonEvent event = HackathonEvent.builder()
                .competitionFormat(CompetitionFormat.SEAL_RAG_2026)
                .build();
        event.setId(eventId);
        List<AllowedEmailDomain> domains = List.of(
                AllowedEmailDomain.builder()
                        .eventId(eventId)
                        .domain("uit.edu.vn")
                        .universityLabel("University of Information Technology")
                        .build());

        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(domainRepository.findByEventIdOrderByDomainAsc(eventId)).thenReturn(domains);

        assertThatCode(() -> allowedEmailDomainService.validateExternalStudentForEvent(
                eventId,
                "student@uit.edu.vn",
                "University of Information Technology"))
                .doesNotThrowAnyException();
    }

    @Test
    void validateExternalStudentForEvent_shouldThrow_whenUniversityMismatchForEvent() {
        UUID eventId = UUID.randomUUID();
        HackathonEvent event = HackathonEvent.builder()
                .competitionFormat(CompetitionFormat.SEAL_RAG_2026)
                .build();
        event.setId(eventId);
        List<AllowedEmailDomain> domains = List.of(
                AllowedEmailDomain.builder()
                        .eventId(eventId)
                        .domain("uit.edu.vn")
                        .universityLabel("University of Information Technology")
                        .build());

        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(domainRepository.findByEventIdOrderByDomainAsc(eventId)).thenReturn(domains);

        assertThatThrownBy(() -> allowedEmailDomainService.validateExternalStudentForEvent(
                eventId,
                "student@uit.edu.vn",
                "Ho Chi Minh City University of Technology"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("University name does not match");
    }
}
