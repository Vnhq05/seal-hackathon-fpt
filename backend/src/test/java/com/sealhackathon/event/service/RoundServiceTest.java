package com.sealhackathon.event.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.dto.request.CreateRoundRequest;
import com.sealhackathon.event.dto.response.RoundResponse;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.RoundRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RoundServiceTest {

    @Mock private RoundRepository roundRepository;
    @Mock private HackathonEventRepository eventRepository;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks private RoundService roundService;

    private UUID eventId;
    private HackathonEvent event;

    @BeforeEach
    void setUp() {
        eventId = UUID.randomUUID();
        event = buildEvent(eventId);
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId)).thenReturn(List.of());
    }

    // ── BR-09: Round dates within event dates ──

    @Test
    void createRound_shouldSucceed_whenDatesWithinEvent() {
        when(roundRepository.existsByHackathonEventIdAndRoundNumber(eventId, 1)).thenReturn(false);
        when(roundRepository.existsOverlappingRoundForNew(any(), any(), any())).thenReturn(false);
        when(roundRepository.save(any(Round.class))).thenAnswer(i -> {
            Round r = i.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        CreateRoundRequest request = CreateRoundRequest.builder()
                .roundNumber(1)
                .name("Round 1")
                .startDate(LocalDateTime.of(2026, 7, 1, 0, 0))
                .endDate(LocalDateTime.of(2026, 7, 15, 23, 59))
                .submissionDeadline(LocalDateTime.of(2026, 7, 10, 23, 59))
                .scoringDeadline(LocalDateTime.of(2026, 7, 14, 23, 59))
                .advancementCutoff(5)
                .build();

        RoundResponse result = roundService.createRound(eventId, request);

        assertThat(result.getName()).isEqualTo("Round 1");
        assertThat(result.getAdvancementCutoff()).isEqualTo(5);
    }

    @Test
    void createRound_shouldThrow_whenDatesOutsideEvent() {
        CreateRoundRequest request = CreateRoundRequest.builder()
                .roundNumber(1)
                .name("Bad Round")
                .startDate(LocalDateTime.of(2026, 6, 1, 0, 0))
                .endDate(LocalDateTime.of(2026, 6, 15, 23, 59))
                .submissionDeadline(LocalDateTime.of(2026, 6, 10, 23, 59))
                .scoringDeadline(LocalDateTime.of(2026, 6, 14, 23, 59))
                .advancementCutoff(3)
                .build();

        assertThatThrownBy(() -> roundService.createRound(eventId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Round dates must be within event dates");
    }

    @Test
    void createRound_shouldThrow_whenOverlapping() {
        when(roundRepository.existsOverlappingRoundForNew(eq(eventId), any(), any())).thenReturn(true);

        CreateRoundRequest request = CreateRoundRequest.builder()
                .roundNumber(2)
                .name("Overlap Round")
                .startDate(LocalDateTime.of(2026, 7, 10, 0, 0))
                .endDate(LocalDateTime.of(2026, 7, 25, 23, 59))
                .submissionDeadline(LocalDateTime.of(2026, 7, 20, 23, 59))
                .scoringDeadline(LocalDateTime.of(2026, 7, 24, 23, 59))
                .advancementCutoff(3)
                .build();

        assertThatThrownBy(() -> roundService.createRound(eventId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("overlap");
    }

    @Test
    void createRound_shouldThrow_whenSubmissionDeadlineOutsideRound() {
        when(roundRepository.existsByHackathonEventIdAndRoundNumber(eventId, 1)).thenReturn(false);
        when(roundRepository.existsOverlappingRoundForNew(any(), any(), any())).thenReturn(false);

        CreateRoundRequest request = CreateRoundRequest.builder()
                .roundNumber(1)
                .name("Bad Deadline")
                .startDate(LocalDateTime.of(2026, 7, 1, 0, 0))
                .endDate(LocalDateTime.of(2026, 7, 15, 23, 59))
                .submissionDeadline(LocalDateTime.of(2026, 7, 20, 23, 59))
                .scoringDeadline(LocalDateTime.of(2026, 7, 25, 23, 59))
                .advancementCutoff(3)
                .build();

        assertThatThrownBy(() -> roundService.createRound(eventId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Submission deadline must be within round dates");
    }

    @Test
    void createRound_shouldThrow_whenCompletedEvent() {
        event.setStatus(EventStatus.COMPLETED);

        CreateRoundRequest request = CreateRoundRequest.builder()
                .roundNumber(1)
                .name("R1")
                .startDate(LocalDateTime.of(2026, 7, 1, 0, 0))
                .endDate(LocalDateTime.of(2026, 7, 15, 23, 59))
                .submissionDeadline(LocalDateTime.of(2026, 7, 10, 23, 59))
                .scoringDeadline(LocalDateTime.of(2026, 7, 14, 23, 59))
                .advancementCutoff(3)
                .build();

        assertThatThrownBy(() -> roundService.createRound(eventId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Cannot modify rounds");
    }

    private HackathonEvent buildEvent(UUID id) {
        HackathonEvent event = HackathonEvent.builder()
                .name("Test Event")
                .season("Summer")
                .year(2026)
                .startDate(LocalDate.of(2026, 7, 1))
                .endDate(LocalDate.of(2026, 8, 31))
                .registrationDeadline(LocalDate.of(2026, 6, 30))
                .status(EventStatus.UPCOMING)
                .build();
        event.setId(id);
        return event;
    }
}
