package com.sealhackathon.event.service;

import com.sealhackathon.auth.security.UserPrincipal;
import com.sealhackathon.audit.service.AuditService;
import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.dto.request.CreateEventRequest;
import com.sealhackathon.event.dto.request.PrizeRequest;
import com.sealhackathon.event.dto.request.UpdateEventRequest;
import com.sealhackathon.event.domain.enums.PrizeRank;
import com.sealhackathon.event.dto.response.EventResponse;
import com.sealhackathon.event.repository.HackathonEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoSettings;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EventServiceTest {

    @Mock private HackathonEventRepository eventRepository;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private AuditService auditService;
    @Mock private AuthPublicService authPublicService;
    @Mock private EventJudgeService eventJudgeService;
    @Mock private RoundService roundService;

    @InjectMocks private EventService eventService;

    private static final UUID ADMIN_USER_ID = UUID.randomUUID();
    private static final String ADMIN_EMAIL = "admin@test.com";

    @BeforeEach
    void setUpSecurity() {
        var auth = new UsernamePasswordAuthenticationToken(
                new UserPrincipal(ADMIN_USER_ID, ADMIN_EMAIL), null,
                List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(authPublicService.getCurrentUserRole()).thenReturn(UserType.SYSTEM_ADMIN);
        when(authPublicService.getCurrentUserId()).thenReturn(ADMIN_USER_ID);
        when(authPublicService.getCurrentUserEmail()).thenReturn(ADMIN_EMAIL);
    }

    private static final LocalDate REG_OPEN = LocalDate.of(2026, 6, 1);
    private static final LocalDate REG_CLOSE = LocalDate.of(2026, 6, 30);
    private static final LocalDate EVENT_START = LocalDate.of(2026, 7, 1);
    private static final LocalDate EVENT_END = LocalDate.of(2026, 8, 31);

    // ── BR-08: Create event ──

    @Test
    void createEvent_shouldSucceed_whenValidRequest() {
        CreateEventRequest request = CreateEventRequest.builder()
                .name("Summer Hackathon")
                .season("Summer")
                .year(2026)
                .startDate(EVENT_START)
                .endDate(EVENT_END)
                .registrationOpenDate(REG_OPEN)
                .registrationDeadline(REG_CLOSE)
                .build();

        when(eventRepository.existsByName(anyString())).thenReturn(false);
        when(eventRepository.save(any(HackathonEvent.class))).thenAnswer(i -> {
            HackathonEvent e = i.getArgument(0);
            e.setId(UUID.randomUUID());
            return e;
        });

        EventResponse result = eventService.createEvent(request);

        assertThat(result.getName()).isEqualTo("Summer Hackathon");
        assertThat(result.getStatus()).isEqualTo(EventStatus.OPEN);
        verify(eventPublisher).publishEvent(any(Object.class));
    }

    @Test
    void createEvent_shouldThrow_whenEndDateBeforeStartDate() {
        CreateEventRequest request = CreateEventRequest.builder()
                .name("Bad Dates")
                .season("Summer")
                .year(2026)
                .startDate(LocalDate.of(2026, 9, 1))
                .endDate(LocalDate.of(2026, 7, 1))
                .registrationOpenDate(REG_OPEN)
                .registrationDeadline(REG_CLOSE)
                .build();

        assertThatThrownBy(() -> eventService.createEvent(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("End date must be after start date");
    }

    // ── BR-10: Unique event name ──

    @Test
    void createEvent_shouldThrow_whenNameDuplicate() {
        CreateEventRequest request = CreateEventRequest.builder()
                .name("Duplicate")
                .season("Summer")
                .year(2026)
                .startDate(EVENT_START)
                .endDate(EVENT_END)
                .registrationOpenDate(REG_OPEN)
                .registrationDeadline(REG_CLOSE)
                .build();

        when(eventRepository.existsByName("Duplicate")).thenReturn(true);

        assertThatThrownBy(() -> eventService.createEvent(request))
                .isInstanceOf(DuplicateResourceException.class);
    }

    // ── BR-08: No edits after Active ──

    @Test
    void updateEvent_shouldThrow_whenEventIsActive() {
        UUID eventId = UUID.randomUUID();
        HackathonEvent event = buildActiveEvent(eventId);
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        UpdateEventRequest request = UpdateEventRequest.builder()
                .name("Updated")
                .season("Winter")
                .year(2026)
                .startDate(EVENT_START)
                .endDate(EVENT_END)
                .registrationOpenDate(REG_OPEN)
                .registrationDeadline(REG_CLOSE)
                .build();

        assertThatThrownBy(() -> eventService.updateEvent(eventId, request, "127.0.0.1"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Cannot modify event during or after the competition period");
    }

    @Test
    void updateEvent_shouldSucceed_whenDraft() {
        UUID eventId = UUID.randomUUID();
        HackathonEvent event = buildEvent(eventId, EventStatus.UPCOMING);
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(eventRepository.existsByNameAndIdNot(anyString(), any())).thenReturn(false);
        when(eventRepository.save(any(HackathonEvent.class))).thenAnswer(i -> i.getArgument(0));

        UpdateEventRequest request = UpdateEventRequest.builder()
                .name("Updated Name")
                .season("Fall")
                .year(2026)
                .startDate(LocalDate.of(2026, 9, 1))
                .endDate(LocalDate.of(2026, 11, 30))
                .registrationOpenDate(LocalDate.of(2026, 8, 1))
                .registrationDeadline(LocalDate.of(2026, 8, 31))
                .build();

        EventResponse result = eventService.updateEvent(eventId, request, "127.0.0.1");
        assertThat(result.getName()).isEqualTo("Updated Name");
    }

    @Test
    void createEvent_shouldThrow_whenPrizeValuesOutOfOrder() {
        CreateEventRequest request = CreateEventRequest.builder()
                .name("Prize Event")
                .season("Summer")
                .year(2026)
                .startDate(EVENT_START)
                .endDate(EVENT_END)
                .registrationOpenDate(REG_OPEN)
                .registrationDeadline(REG_CLOSE)
                .prizes(List.of(
                        PrizeRequest.builder().rank(PrizeRank.FIRST).value("1,000,000 VND").quantity(1).build(),
                        PrizeRequest.builder().rank(PrizeRank.SECOND).value("5,000,000 VND").quantity(1).build()
                ))
                .build();

        when(eventRepository.existsByName(anyString())).thenReturn(false);

        assertThatThrownBy(() -> eventService.createEvent(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("FIRST prize value must be greater than SECOND");
    }

    @Test
    void getEventById_shouldThrow_whenNotFound() {
        UUID eventId = UUID.randomUUID();
        when(eventRepository.findById(eventId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.getEventById(eventId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── Delete ──

    @Test
    void deleteEvent_shouldSucceed_whenUpcoming() {
        UUID eventId = UUID.randomUUID();
        HackathonEvent event = buildEvent(eventId, EventStatus.UPCOMING);
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        eventService.deleteEvent(eventId, "127.0.0.1");

        verify(eventRepository).delete(event);
        verify(auditService).log(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void deleteEvent_shouldThrow_whenActive() {
        UUID eventId = UUID.randomUUID();
        HackathonEvent event = buildActiveEvent(eventId);
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> eventService.deleteEvent(eventId, "127.0.0.1"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Cannot delete an active or completed event");
    }

    // ── Lifecycle: date-based status resolution ──

    @Test
    void resolveStatus_shouldReturnOpen_duringRegistrationPeriod() {
        HackathonEvent event = buildEvent(UUID.randomUUID(), EventStatus.UPCOMING);
        event.setRegistrationOpenDate(LocalDate.now().minusDays(1));
        event.setStartDate(LocalDate.now().plusDays(2));
        event.setEndDate(LocalDate.now().plusDays(30));
        event.setRegistrationDeadline(LocalDate.now().plusDays(1));

        assertThat(eventService.resolveStatus(event)).isEqualTo(EventStatus.OPEN);
    }

    @Test
    void resolveStatus_shouldReturnOpen_evenWhenPersistedActive_beforeStartDate() {
        HackathonEvent event = buildEvent(UUID.randomUUID(), EventStatus.ACTIVE);
        event.setRegistrationOpenDate(LocalDate.now().minusDays(1));
        event.setStartDate(LocalDate.now().plusDays(2));
        event.setEndDate(LocalDate.now().plusDays(30));
        event.setRegistrationDeadline(LocalDate.now().plusDays(1));

        assertThat(eventService.resolveStatus(event)).isEqualTo(EventStatus.OPEN);
    }

    @Test
    void resolveStatus_shouldReturnUpcoming_beforeRegistrationOpens() {
        HackathonEvent event = buildEvent(UUID.randomUUID(), EventStatus.UPCOMING);
        event.setRegistrationOpenDate(LocalDate.now().plusDays(3));
        event.setStartDate(LocalDate.now().plusDays(10));
        event.setEndDate(LocalDate.now().plusDays(40));
        event.setRegistrationDeadline(LocalDate.now().plusDays(8));

        assertThat(eventService.resolveStatus(event)).isEqualTo(EventStatus.UPCOMING);
    }

    @Test
    void finalizePublish_shouldReturnOpen_duringRegistrationPeriod() {
        UUID eventId = UUID.randomUUID();
        HackathonEvent event = buildEvent(eventId, EventStatus.UPCOMING);
        event.setRegistrationOpenDate(LocalDate.now().minusDays(1));
        event.setStartDate(LocalDate.now().plusDays(2));
        event.setEndDate(LocalDate.now().plusDays(30));
        event.setRegistrationDeadline(LocalDate.now().plusDays(1));
        event.getTracks().add(com.sealhackathon.event.domain.Track.builder()
                .hackathonEvent(event)
                .name("Main")
                .maxTeams(20)
                .build());

        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        EventResponse result = eventService.finalizePublish(eventId, "127.0.0.1");

        assertThat(result.getStatus()).isEqualTo(EventStatus.OPEN);
        verify(auditService).log(any(), any(), any(), any(), any(), any(), any());
    }

    private HackathonEvent buildEvent(UUID id, EventStatus status) {
        HackathonEvent event = HackathonEvent.builder()
                .name("Test Event")
                .season("Summer")
                .year(2026)
                .startDate(EVENT_START)
                .endDate(EVENT_END)
                .registrationOpenDate(REG_OPEN)
                .registrationDeadline(REG_CLOSE)
                .status(status)
                .build();
        event.setId(id);
        return event;
    }

    private HackathonEvent buildActiveEvent(UUID id) {
        HackathonEvent event = HackathonEvent.builder()
                .name("Test Event")
                .season("Summer")
                .year(2026)
                .startDate(LocalDate.now().minusDays(7))
                .endDate(LocalDate.now().plusDays(60))
                .registrationDeadline(LocalDate.now().minusDays(14))
                .status(EventStatus.ACTIVE)
                .build();
        event.setId(id);
        return event;
    }
}
