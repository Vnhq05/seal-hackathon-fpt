package com.sealhackathon.ranking.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.ranking.domain.PublishedResult;
import com.sealhackathon.ranking.domain.Ranking;
import com.sealhackathon.ranking.dto.response.PublishedResultResponse;
import com.sealhackathon.ranking.repository.PublishedResultRepository;
import com.sealhackathon.ranking.repository.RankingRepository;
import com.sealhackathon.team.service.TeamPublicService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RankingServiceTest {

    @Mock private RankingRepository rankingRepository;
    @Mock private PublishedResultRepository publishedResultRepository;
    @Mock private AggregationService aggregationService;
    @Mock private AdvancementService advancementService;
    @Mock private TeamPublicService teamPublicService;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks private RankingService rankingService;

    // ── BR-51: Publish results ──

    @Test
    void publishResults_shouldSucceed_whenNotAlreadyPublished() {
        UUID roundId = UUID.randomUUID();
        UUID publisherId = UUID.randomUUID();

        when(publishedResultRepository.existsByRoundId(roundId)).thenReturn(false);
        when(rankingRepository.findMaxVersionByRoundId(roundId)).thenReturn(1);
        when(advancementService.determineAdvancements(roundId)).thenReturn(List.of());
        when(publishedResultRepository.save(any(PublishedResult.class))).thenAnswer(i -> {
            PublishedResult pr = i.getArgument(0);
            pr.setId(UUID.randomUUID());
            return pr;
        });
        when(rankingRepository.findByRoundIdAndVersionOrderByRankAsc(roundId, 1))
                .thenReturn(List.of());

        PublishedResultResponse result = rankingService.publishResults(roundId, publisherId);

        assertThat(result.getRoundId()).isEqualTo(roundId);
        assertThat(result.getPublishedBy()).isEqualTo(publisherId);
        assertThat(result.getDisputeDeadline()).isAfter(result.getPublishedAt());
    }

    @Test
    void publishResults_shouldThrow_whenAlreadyPublished() {
        UUID roundId = UUID.randomUUID();
        when(publishedResultRepository.existsByRoundId(roundId)).thenReturn(true);

        assertThatThrownBy(() -> rankingService.publishResults(roundId, UUID.randomUUID()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("already published");
    }

    @Test
    void publishResults_shouldThrow_whenNoRankings() {
        UUID roundId = UUID.randomUUID();
        when(publishedResultRepository.existsByRoundId(roundId)).thenReturn(false);
        when(rankingRepository.findMaxVersionByRoundId(roundId)).thenReturn(0);

        assertThatThrownBy(() -> rankingService.publishResults(roundId, UUID.randomUUID()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("No rankings");
    }

    // ── Rankings ──

    @Test
    void getLatestRankings_shouldReturnEmpty_whenNoVersion() {
        UUID roundId = UUID.randomUUID();
        when(rankingRepository.findMaxVersionByRoundId(roundId)).thenReturn(0);

        List<com.sealhackathon.ranking.dto.response.RankingResponse> result =
                rankingService.getLatestRankings(roundId);

        assertThat(result).isEmpty();
    }

    @Test
    void getLatestRankings_shouldReturnLatestVersion() {
        UUID roundId = UUID.randomUUID();
        when(rankingRepository.findMaxVersionByRoundId(roundId)).thenReturn(3);

        Ranking r = Ranking.builder()
                .teamId(UUID.randomUUID()).roundId(roundId)
                .finalScore(BigDecimal.valueOf(85)).rank(1)
                .version(3).calculatedAt(LocalDateTime.now())
                .build();
        r.setId(UUID.randomUUID());

        when(rankingRepository.findByRoundIdAndVersionOrderByRankAsc(roundId, 3))
                .thenReturn(List.of(r));
        when(teamPublicService.getTeam(any())).thenReturn(java.util.Optional.empty());

        var result = rankingService.getLatestRankings(roundId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getVersion()).isEqualTo(3);
    }
}
