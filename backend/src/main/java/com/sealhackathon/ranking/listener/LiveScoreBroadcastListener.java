package com.sealhackathon.ranking.listener;

import com.sealhackathon.event.dto.snapshot.RoundSnapshot;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.ranking.domain.Ranking;
import com.sealhackathon.ranking.dto.response.RankingEventDto;
import com.sealhackathon.ranking.event.RankingRecalculatedEvent;
import com.sealhackathon.ranking.event.ResultsPublishedEvent;
import com.sealhackathon.ranking.repository.RankingRepository;
import com.sealhackathon.team.dto.snapshot.TeamSnapshot;
import com.sealhackathon.team.service.TeamPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class LiveScoreBroadcastListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final RankingRepository rankingRepository;
    private final EventPublicService eventPublicService;
    private final TeamPublicService teamPublicService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onRankingRecalculated(RankingRecalculatedEvent event) {
        UUID roundId = event.roundId();
        int version = event.version();

        RoundSnapshot round = eventPublicService.getRound(roundId).orElse(null);
        if (round == null) return;
        UUID eventId = round.getEventId();

        messagingTemplate.convertAndSend(
                "/topic/events/" + eventId + "/leaderboard",
                Map.of("type", "LEADERBOARD_UPDATED", "roundId", roundId, "version", version));

        RankingEventDto updatedDto = RankingEventDto.builder()
                .type("LEADERBOARD_UPDATED")
                .eventId(eventId)
                .roundId(roundId)
                .timestamp(LocalDateTime.now())
                .build();
        messagingTemplate.convertAndSend(
                "/topic/events/" + eventId + "/ranking-events", updatedDto);

        if (version <= 1) return;

        List<Ranking> current = rankingRepository.findByRoundIdAndVersionOrderByRankAsc(roundId, version);
        Map<UUID, Integer> prevRankMap = rankingRepository
                .findByRoundIdAndVersionOrderByRankAsc(roundId, version - 1)
                .stream()
                .collect(Collectors.toMap(Ranking::getTeamId, Ranking::getRank));

        List<RankingEventDto> events = new ArrayList<>();

        for (Ranking r : current) {
            Integer oldRank = prevRankMap.get(r.getTeamId());
            if (oldRank == null || oldRank.equals(r.getRank())) continue;

            String teamName = teamPublicService.getTeam(r.getTeamId())
                    .map(TeamSnapshot::getName).orElse("Unknown");

            if (r.getRank() == 1 && (oldRank > 1)) {
                events.add(RankingEventDto.builder()
                        .type("NEW_LEADER")
                        .eventId(eventId)
                        .roundId(roundId)
                        .teamId(r.getTeamId())
                        .teamName(teamName)
                        .newRank(1)
                        .oldRank(oldRank)
                        .timestamp(LocalDateTime.now())
                        .build());
            } else {
                events.add(RankingEventDto.builder()
                        .type("RANK_CHANGED")
                        .eventId(eventId)
                        .roundId(roundId)
                        .teamId(r.getTeamId())
                        .teamName(teamName)
                        .newRank(r.getRank())
                        .oldRank(oldRank)
                        .timestamp(LocalDateTime.now())
                        .build());
            }
        }

        for (RankingEventDto dto : events) {
            messagingTemplate.convertAndSend(
                    "/topic/events/" + eventId + "/ranking-events", dto);
        }
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onResultsPublished(ResultsPublishedEvent event) {
        UUID roundId = event.roundId();
        RoundSnapshot round = eventPublicService.getRound(roundId).orElse(null);
        if (round == null) return;
        UUID eventId = round.getEventId();

        RankingEventDto dto = RankingEventDto.builder()
                .type("FINAL_RESULTS_PUBLISHED")
                .eventId(eventId)
                .roundId(roundId)
                .timestamp(event.publishedAt())
                .build();

        messagingTemplate.convertAndSend(
                "/topic/events/" + eventId + "/leaderboard", dto);
        messagingTemplate.convertAndSend(
                "/topic/events/" + eventId + "/ranking-events", dto);
        messagingTemplate.convertAndSend(
                "/topic/events/" + eventId + "/final-results", dto);
    }
}
