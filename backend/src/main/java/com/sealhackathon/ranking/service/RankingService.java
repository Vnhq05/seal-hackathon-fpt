package com.sealhackathon.ranking.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.ranking.domain.PublishedResult;
import com.sealhackathon.ranking.domain.Ranking;
import com.sealhackathon.ranking.dto.response.AdvancementResponse;
import com.sealhackathon.ranking.dto.response.PublishedResultResponse;
import com.sealhackathon.ranking.dto.response.RankingResponse;
import com.sealhackathon.ranking.event.ResultsPublishedEvent;
import com.sealhackathon.ranking.repository.PublishedResultRepository;
import com.sealhackathon.ranking.repository.RankingRepository;
import com.sealhackathon.team.dto.snapshot.TeamSnapshot;
import com.sealhackathon.team.service.TeamPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RankingService {

    private final RankingRepository rankingRepository;
    private final PublishedResultRepository publishedResultRepository;
    private final AggregationService aggregationService;
    private final AdvancementService advancementService;
    private final TeamPublicService teamPublicService;
    private final ApplicationEventPublisher eventPublisher;

    private static final int DISPUTE_WINDOW_HOURS = 24;

    @Transactional(readOnly = true)
    public List<RankingResponse> getLatestRankings(UUID roundId) {
        int version = rankingRepository.findMaxVersionByRoundId(roundId);
        if (version == 0) {
            return List.of();
        }
        return rankingRepository.findByRoundIdAndVersionOrderByRankAsc(roundId, version).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RankingResponse getTeamRanking(UUID roundId, UUID teamId) {
        int version = rankingRepository.findMaxVersionByRoundId(roundId);
        return rankingRepository.findByTeamIdAndRoundIdAndVersion(teamId, roundId, version)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Ranking", "team+round",
                        teamId + " / " + roundId));
    }

    @Transactional
    public List<RankingResponse> triggerRecalculation(UUID roundId) {
        List<Ranking> rankings = aggregationService.recalculate(roundId);
        return rankings.stream().map(this::toResponse).toList();
    }

    // ── BR-51: Publish results ──
    @Transactional
    public PublishedResultResponse publishResults(UUID roundId, UUID publisherId) {
        if (publishedResultRepository.existsByRoundId(roundId)) {
            throw new BusinessException("Results for this round are already published",
                    HttpStatus.CONFLICT) {};
        }

        int version = rankingRepository.findMaxVersionByRoundId(roundId);
        if (version == 0) {
            throw new BusinessException("No rankings to publish. Run calculation first.",
                    HttpStatus.BAD_REQUEST) {};
        }

        // Determine advancements
        List<AdvancementResponse> advancements = advancementService.determineAdvancements(roundId);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime disputeDeadline = now.plusHours(DISPUTE_WINDOW_HOURS);

        PublishedResult result = PublishedResult.builder()
                .roundId(roundId)
                .publishedBy(publisherId)
                .publishedAt(now)
                .disputeDeadline(disputeDeadline)
                .build();
        result = publishedResultRepository.save(result);

        eventPublisher.publishEvent(new ResultsPublishedEvent(
                roundId, publisherId, now, disputeDeadline));

        List<RankingResponse> rankings = getLatestRankings(roundId);

        return PublishedResultResponse.builder()
                .id(result.getId())
                .roundId(roundId)
                .publishedBy(publisherId)
                .publishedAt(now)
                .disputeDeadline(disputeDeadline)
                .rankings(rankings)
                .advancements(advancements)
                .build();
    }

    @Transactional(readOnly = true)
    public PublishedResultResponse getPublishedResult(UUID roundId) {
        PublishedResult result = publishedResultRepository.findByRoundId(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("PublishedResult", "roundId", roundId));

        List<RankingResponse> rankings = getLatestRankings(roundId);
        List<AdvancementResponse> advancements = advancementService.getAdvancements(roundId);

        return PublishedResultResponse.builder()
                .id(result.getId())
                .roundId(roundId)
                .publishedBy(result.getPublishedBy())
                .publishedAt(result.getPublishedAt())
                .disputeDeadline(result.getDisputeDeadline())
                .rankings(rankings)
                .advancements(advancements)
                .build();
    }

    @Transactional(readOnly = true)
    public boolean isPublished(UUID roundId) {
        return publishedResultRepository.existsByRoundId(roundId);
    }

    private RankingResponse toResponse(Ranking ranking) {
        TeamSnapshot team = teamPublicService.getTeam(ranking.getTeamId()).orElse(null);

        return RankingResponse.builder()
                .id(ranking.getId())
                .teamId(ranking.getTeamId())
                .teamName(team != null ? team.getName() : null)
                .roundId(ranking.getRoundId())
                .roundName(null)
                .trackId(team != null ? team.getTrackId() : null)
                .trackName(null)
                .finalScore(ranking.getFinalScore())
                .rank(ranking.getRank())
                .version(ranking.getVersion())
                .calculatedAt(ranking.getCalculatedAt())
                .build();
    }
}
