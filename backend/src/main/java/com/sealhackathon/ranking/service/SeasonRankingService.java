package com.sealhackathon.ranking.service;

import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.dto.response.TrackResponse;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.service.EventService;
import com.sealhackathon.ranking.dto.response.EventRankingBoard;
import com.sealhackathon.ranking.dto.response.RankingResponse;
import com.sealhackathon.ranking.repository.RankingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SeasonRankingService {

    private final HackathonEventRepository eventRepository;
    private final EventService eventService;
    private final RankingService rankingService;
    private final RankingRepository rankingRepository;

    @Transactional(readOnly = true)
    public List<EventRankingBoard> getSeasonRankings(String season, Integer year, UUID trackId) {
        List<HackathonEvent> events = eventRepository
                .findByFilters(null, season, year, Pageable.unpaged())
                .getContent()
                .stream()
                .map(e -> eventRepository.findByIdWithDetails(e.getId()).orElse(e))
                .toList();

        return events.stream()
                .filter(e -> {
                    EventStatus resolved = eventService.resolveStatus(e);
                    return resolved == EventStatus.ACTIVE || resolved == EventStatus.COMPLETED;
                })
                .map(entity -> buildBoard(entity, entity.getSeason(), entity.getYear(), trackId))
                .filter(board -> board != null && !board.getRankings().isEmpty())
                .sorted(Comparator.comparing(EventRankingBoard::getYear).reversed()
                        .thenComparing(EventRankingBoard::getEventName))
                .toList();
    }

    private EventRankingBoard buildBoard(HackathonEvent event, String season, Integer year, UUID trackId) {
        Round latestRound = event.getRounds().stream()
                .max(Comparator.comparingInt(Round::getRoundNumber))
                .orElse(null);
        if (latestRound == null) return null;

        int version = rankingRepository.findMaxVersionByRoundId(latestRound.getId());
        if (version == 0) return null;

        Map<UUID, String> trackNameMap = event.getTracks().stream()
                .collect(Collectors.toMap(t -> t.getId(), t -> t.getName()));

        List<TrackResponse> tracks = event.getTracks().stream()
                .map(t -> TrackResponse.builder()
                        .id(t.getId())
                        .eventId(event.getId())
                        .name(t.getName())
                        .description(t.getDescription())
                        .maxTeams(t.getMaxTeams())
                        .scoringTemplateId(t.getScoringTemplateId())
                        .build())
                .toList();

        List<RankingResponse> rankings = rankingService.getLatestRankings(latestRound.getId()).stream()
                .map(r -> enrichRanking(r, latestRound.getName(), trackNameMap))
                .filter(r -> trackId == null || trackId.equals(r.getTrackId()))
                .toList();

        if (rankings.isEmpty()) return null;

        return EventRankingBoard.builder()
                .eventId(event.getId())
                .eventName(event.getName())
                .season(season)
                .year(year)
                .roundId(latestRound.getId())
                .roundName(latestRound.getName())
                .tracks(tracks)
                .rankings(rankings)
                .build();
    }

    private RankingResponse enrichRanking(RankingResponse r, String roundName, Map<UUID, String> trackNameMap) {
        String trackName = r.getTrackId() != null ? trackNameMap.get(r.getTrackId()) : null;
        return RankingResponse.builder()
                .id(r.getId())
                .teamId(r.getTeamId())
                .teamName(r.getTeamName())
                .roundId(r.getRoundId())
                .roundName(roundName)
                .trackId(r.getTrackId())
                .trackName(trackName)
                .finalScore(r.getFinalScore())
                .rank(r.getRank())
                .version(r.getVersion())
                .calculatedAt(r.getCalculatedAt())
                .build();
    }
}
