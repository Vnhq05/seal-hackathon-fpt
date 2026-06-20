package com.sealhackathon.event.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.event.domain.Criteria;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.dto.request.CriteriaRequest;
import com.sealhackathon.event.dto.response.CriteriaResponse;
import com.sealhackathon.event.repository.CriteriaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CriteriaServiceTest {

    @Mock private CriteriaRepository criteriaRepository;
    @Mock private RoundService roundService;

    @InjectMocks private CriteriaService criteriaService;

    // ── BR-11: Weights must sum to 100% ──

    @Test
    void addCriteria_shouldSucceed_whenWeightFits() {
        UUID roundId = UUID.randomUUID();
        Round round = buildRound(roundId);
        when(roundService.getRound(roundId)).thenReturn(round);
        when(criteriaRepository.sumWeightsByRoundId(roundId)).thenReturn(60);
        when(criteriaRepository.save(any(Criteria.class))).thenAnswer(i -> {
            Criteria c = i.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        CriteriaRequest request = CriteriaRequest.builder()
                .name("Technical")
                .weight(40)
                .sortOrder(1)
                .build();

        CriteriaResponse result = criteriaService.addCriteria(roundId, request);

        assertThat(result.getName()).isEqualTo("Technical");
        assertThat(result.getWeight()).isEqualTo(40);
    }

    @Test
    void addCriteria_shouldThrow_whenWeightExceeds100() {
        UUID roundId = UUID.randomUUID();
        Round round = buildRound(roundId);
        when(roundService.getRound(roundId)).thenReturn(round);
        when(criteriaRepository.sumWeightsByRoundId(roundId)).thenReturn(80);

        CriteriaRequest request = CriteriaRequest.builder()
                .name("Too Heavy")
                .weight(30)
                .build();

        assertThatThrownBy(() -> criteriaService.addCriteria(roundId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("110%");
    }

    @Test
    void replaceCriteria_shouldSucceed_whenWeightsSumTo100() {
        UUID roundId = UUID.randomUUID();
        Round round = buildRound(roundId);
        when(roundService.getRound(roundId)).thenReturn(round);
        when(criteriaRepository.saveAll(any())).thenAnswer(i -> {
            List<Criteria> list = i.getArgument(0);
            list.forEach(c -> c.setId(UUID.randomUUID()));
            return list;
        });

        List<CriteriaRequest> requests = List.of(
                CriteriaRequest.builder().name("Technical").weight(40).sortOrder(1).build(),
                CriteriaRequest.builder().name("Innovation").weight(30).sortOrder(2).build(),
                CriteriaRequest.builder().name("Presentation").weight(20).sortOrder(3).build(),
                CriteriaRequest.builder().name("Feasibility").weight(10).sortOrder(4).build()
        );

        List<CriteriaResponse> result = criteriaService.replaceCriteria(roundId, requests);

        assertThat(result).hasSize(4);
        assertThat(result.stream().mapToInt(CriteriaResponse::getWeight).sum()).isEqualTo(100);
    }

    @Test
    void replaceCriteria_shouldThrow_whenWeightsNotSum100() {
        UUID roundId = UUID.randomUUID();
        Round round = buildRound(roundId);
        when(roundService.getRound(roundId)).thenReturn(round);

        List<CriteriaRequest> requests = List.of(
                CriteriaRequest.builder().name("A").weight(50).build(),
                CriteriaRequest.builder().name("B").weight(40).build()
        );

        assertThatThrownBy(() -> criteriaService.replaceCriteria(roundId, requests))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("must sum to exactly 100%");
    }

    @Test
    void updateCriteria_shouldThrow_whenNewWeightExceeds100() {
        UUID criteriaId = UUID.randomUUID();
        UUID roundId = UUID.randomUUID();
        Round round = buildRound(roundId);
        Criteria existing = Criteria.builder()
                .round(round)
                .name("Old")
                .weight(20)
                .sortOrder(1)
                .build();
        existing.setId(criteriaId);

        when(criteriaRepository.findById(criteriaId)).thenReturn(Optional.of(existing));
        when(criteriaRepository.countScoresByCriteriaId(criteriaId)).thenReturn(0);
        when(criteriaRepository.sumWeightsByRoundIdExcluding(roundId, criteriaId)).thenReturn(80);

        CriteriaRequest request = CriteriaRequest.builder()
                .name("Updated")
                .weight(30)
                .build();

        assertThatThrownBy(() -> criteriaService.updateCriteria(criteriaId, request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("110%");
    }

    private Round buildRound(UUID roundId) {
        HackathonEvent event = HackathonEvent.builder()
                .name("Test")
                .season("Summer")
                .year(2026)
                .startDate(LocalDate.of(2026, 7, 1))
                .endDate(LocalDate.of(2026, 8, 31))
                .registrationDeadline(LocalDate.of(2026, 6, 30))
                .build();
        event.setId(UUID.randomUUID());

        Round round = Round.builder()
                .hackathonEvent(event)
                .roundNumber(1)
                .name("Round 1")
                .startDate(LocalDateTime.of(2026, 7, 1, 0, 0))
                .endDate(LocalDateTime.of(2026, 7, 15, 23, 59))
                .submissionDeadline(LocalDateTime.of(2026, 7, 10, 23, 59))
                .scoringDeadline(LocalDateTime.of(2026, 7, 14, 23, 59))
                .advancementCutoff(5)
                .build();
        round.setId(roundId);
        return round;
    }
}
