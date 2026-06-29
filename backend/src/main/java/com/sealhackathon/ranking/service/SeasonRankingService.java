package com.sealhackathon.ranking.service;

import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.dto.response.TrackResponse;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.service.EventService;
import com.sealhackathon.ranking.dto.response.EventRankingBoard;
import com.sealhackathon.ranking.dto.response.RankingResponse;
import com.sealhackathon.ranking.repository.PublishedResultRepository;
import com.sealhackathon.ranking.repository.RankingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SeasonRankingService {

    private final HackathonEventRepository eventRepository;
    private final EventService eventService;
    private final RankingService rankingService;
    private final RankingRepository rankingRepository;
    private final PublishedResultRepository publishedResultRepository;

    @Transactional(readOnly = true)
    public List<EventRankingBoard> getSeasonRankings(String season, Integer year, UUID trackId,
                                                     String roundType) {
        RoundType resolvedRoundType = parseRoundType(roundType);
        boolean privilegedViewer = isPrivilegedViewer();

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
                .map(entity -> buildBoard(entity, entity.getSeason(), entity.getYear(),
                        trackId, resolvedRoundType, privilegedViewer))
                .filter(board -> board != null && !board.getRankings().isEmpty())
                .sorted(Comparator.comparing(EventRankingBoard::getYear).reversed()
                        .thenComparing(EventRankingBoard::getEventName))
                .toList();
    }

    private EventRankingBoard buildBoard(HackathonEvent event, String season, Integer year, UUID trackId,
                                         RoundType roundTypeFilter, boolean privilegedViewer) {
        Round selectedRound = resolveRound(event, roundTypeFilter);
        if (selectedRound == null) {
            return null;
        }

        if (!privilegedViewer && !canStudentViewRound(event, selectedRound.getId())) {
            return null;
        }

        int version = rankingRepository.findMaxVersionByRoundId(selectedRound.getId());
        if (version == 0) {
            return null;
        }

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

        List<RankingResponse> rankings = rankingService.getLatestRankings(selectedRound.getId()).stream()
                .map(r -> enrichRanking(r, selectedRound.getName(), trackNameMap))
                .filter(r -> trackId == null || trackId.equals(r.getTrackId()))
                .toList();

        if (rankings.isEmpty()) {
            return null;
        }

        if (trackId != null && selectedRound.getRoundType() == RoundType.PRELIMINARY) {
            rankings = RankingDisplayHelper.reRankWithinTrack(rankings);
        }

        return EventRankingBoard.builder()
                .eventId(event.getId())
                .eventName(event.getName())
                .season(season)
                .year(year)
                .roundId(selectedRound.getId())
                .roundName(selectedRound.getName())
                .roundType(selectedRound.getRoundType())
                .tracks(tracks)
                .rankings(rankings)
                .build();
    }

    private Round resolveRound(HackathonEvent event, RoundType roundTypeFilter) {
        if (event.getRounds() == null || event.getRounds().isEmpty()) {
            return null;
        }
        if (roundTypeFilter != null) {
            return event.getRounds().stream()
                    .filter(r -> r.getRoundType() == roundTypeFilter)
                    .findFirst()
                    .orElse(null);
        }
        return event.getRounds().stream()
                .max(Comparator.comparingInt(Round::getRoundNumber))
                .orElse(null);
    }

    private boolean canStudentViewRound(HackathonEvent event, UUID roundId) {
        return event.isLeaderboardPublic()
                || publishedResultRepository.existsByRoundId(roundId);
    }

    private boolean isPrivilegedViewer() {
        return resolveCurrentRole()
                .map(r -> r == UserType.SYSTEM_ADMIN || r == UserType.EVENT_COORDINATOR)
                .orElse(false);
    }

    private Optional<UserType> resolveCurrentRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()
                || "anonymousUser".equals(auth.getPrincipal())) {
            return Optional.empty();
        }
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .map(UserType::valueOf)
                .findFirst();
    }

    private RoundType parseRoundType(String roundType) {
        if (roundType == null || roundType.isBlank()) {
            return null;
        }
        try {
            return RoundType.valueOf(roundType.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
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
