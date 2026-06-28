package com.sealhackathon.ranking.service;

import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.dto.snapshot.EventSnapshot;
import com.sealhackathon.event.dto.snapshot.RoundSnapshot;
import com.sealhackathon.event.dto.snapshot.TrackSnapshot;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.judging.service.JudgingPublicService;
import com.sealhackathon.ranking.domain.Ranking;
import com.sealhackathon.ranking.dto.response.LiveScoreBoard;
import com.sealhackathon.ranking.dto.response.LiveScoreEntry;
import com.sealhackathon.ranking.dto.response.TrackInfo;
import com.sealhackathon.ranking.repository.PublishedResultRepository;
import com.sealhackathon.ranking.repository.RankingRepository;
import com.sealhackathon.submission.dto.snapshot.SubmissionSnapshot;
import com.sealhackathon.submission.service.SubmissionPublicService;
import com.sealhackathon.team.dto.snapshot.TeamSnapshot;
import com.sealhackathon.team.service.TeamPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LiveScoreService {

    private final RankingRepository rankingRepository;
    private final PublishedResultRepository publishedResultRepository;
    private final EventPublicService eventPublicService;
    private final TeamPublicService teamPublicService;
    private final SubmissionPublicService submissionPublicService;
    private final JudgingPublicService judgingPublicService;

    @Transactional(readOnly = true)
    public void validateLeaderboardSubscription(UUID eventId, Optional<UserType> role) {
        EventSnapshot event = eventPublicService.getEvent(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        List<RoundSnapshot> rounds = eventPublicService.getRoundsByEvent(eventId);
        if (rounds.isEmpty()) {
            if (role.map(r -> r == UserType.SYSTEM_ADMIN || r == UserType.EVENT_COORDINATOR).orElse(false)) {
                return;
            }
            if (!event.isLeaderboardPublic()) {
                throw new BusinessException(
                        "Live ranking is not publicly available for this event",
                        HttpStatus.FORBIDDEN) {};
            }
            return;
        }

        RoundSnapshot round = rounds.get(rounds.size() - 1);
        boolean scoresLocked = isRoundScoresLocked(eventId, round.getId());
        boolean resultsPublished = publishedResultRepository.existsByRoundId(round.getId());
        validateLeaderboardAccess(event, round, role, scoresLocked, resultsPublished);
    }

    @Transactional(readOnly = true)
    public LiveScoreBoard getLeaderboard(UUID eventId, UUID trackId, UUID roundId, String roundType) {
        EventSnapshot event = eventPublicService.getEvent(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        List<RoundSnapshot> rounds = eventPublicService.getRoundsByEvent(eventId);
        if (rounds.isEmpty()) {
            return buildEmptyBoard(event, eventId);
        }

        RoundSnapshot round;
        if (roundId != null) {
            round = rounds.stream()
                    .filter(r -> r.getId().equals(roundId))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Round", "id", roundId));
        } else if (roundType != null && !roundType.isBlank()) {
            round = rounds.stream()
                    .filter(r -> r.getRoundType() != null
                            && r.getRoundType().name().equalsIgnoreCase(roundType))
                    .findFirst()
                    .orElseThrow(() -> new BusinessException(
                            "No round found for type: " + roundType, HttpStatus.NOT_FOUND));
        } else {
            round = rounds.get(rounds.size() - 1);
        }

        boolean scoresLocked = isRoundScoresLocked(eventId, round.getId());
        boolean resultsPublished = publishedResultRepository.existsByRoundId(round.getId());

        Optional<UserType> role = resolveCurrentRole();
        validateLeaderboardAccess(event, round, role, scoresLocked, resultsPublished);

        List<TrackSnapshot> tracks = eventPublicService.getTracksByEvent(eventId);
        Map<UUID, String> trackNameMap = tracks.stream()
                .collect(Collectors.toMap(TrackSnapshot::getId, TrackSnapshot::getName));

        Map<UUID, TeamSnapshot> teamMap = teamPublicService.getTeamsByEvent(eventId).stream()
                .collect(Collectors.toMap(TeamSnapshot::getId, t -> t));

        int currentVersion = rankingRepository.findMaxVersionByRoundId(round.getId());
        List<Ranking> currentRankings = currentVersion > 0
                ? rankingRepository.findByRoundIdAndVersionOrderByRankAsc(round.getId(), currentVersion)
                : List.of();

        Map<UUID, Integer> previousRankMap = Map.of();
        if (currentVersion > 1) {
            previousRankMap = rankingRepository
                    .findByRoundIdAndVersionOrderByRankAsc(round.getId(), currentVersion - 1)
                    .stream()
                    .collect(Collectors.toMap(Ranking::getTeamId, Ranking::getRank));
        }

        Map<UUID, Integer> finalPrevRankMap = previousRankMap;

        Map<UUID, SubmissionSnapshot> submissionMap = submissionPublicService
                .getSubmissionsByRound(round.getId()).stream()
                .collect(Collectors.toMap(SubmissionSnapshot::getTeamId, s -> s));

        Map<UUID, Integer> scoreCountMap = judgingPublicService.countCompletedScoresByRound(round.getId());
        Map<UUID, Long> assignedJudgesMap = judgingPublicService.countAssignedJudgesByRound(round.getId());

        List<LiveScoreEntry> entries = currentRankings.stream()
                .map(ranking -> toEntry(ranking, round, teamMap, trackNameMap, finalPrevRankMap,
                        scoresLocked, resultsPublished, submissionMap, scoreCountMap, assignedJudgesMap))
                .filter(entry -> trackId == null || trackId.equals(entry.getTrackId()))
                .sorted(Comparator.comparingInt(LiveScoreEntry::getRank))
                .toList();

        boolean canManage = role.map(r ->
                r == UserType.SYSTEM_ADMIN || r == UserType.EVENT_COORDINATOR).orElse(false);

        return LiveScoreBoard.builder()
                .eventId(eventId)
                .eventName(event.getName())
                .season(event.getSeason())
                .year(event.getYear())
                .roundId(round.getId())
                .roundName(round.getName())
                .tracks(tracks.stream()
                        .map(t -> TrackInfo.builder().id(t.getId()).name(t.getName()).build())
                        .toList())
                .rankings(entries)
                .scoresLocked(scoresLocked)
                .resultsPublished(resultsPublished)
                .leaderboardPublic(event.isLeaderboardPublic())
                .canManageLeaderboard(canManage)
                .build();
    }

    @Transactional
    public void setLeaderboardPublic(UUID eventId, boolean enabled) {
        eventPublicService.setLeaderboardPublic(eventId, enabled);
    }

    private LiveScoreEntry toEntry(Ranking ranking, RoundSnapshot round,
                                   Map<UUID, TeamSnapshot> teamMap,
                                   Map<UUID, String> trackNameMap,
                                   Map<UUID, Integer> previousRankMap,
                                   boolean scoresLocked, boolean resultsPublished,
                                   Map<UUID, SubmissionSnapshot> submissionMap,
                                   Map<UUID, Integer> scoreCountMap,
                                   Map<UUID, Long> assignedJudgesMap) {
        TeamSnapshot team = teamMap.get(ranking.getTeamId());
        String teamName = team != null ? team.getName() : "Unknown";
        UUID teamTrackId = team != null ? team.getTrackId() : null;
        String trackName = teamTrackId != null ? trackNameMap.get(teamTrackId) : null;

        SubmissionSnapshot sub = submissionMap.get(ranking.getTeamId());

        int judgesScored = 0;
        long judgesAssigned = 0;
        String scoreStatus = "NOT_SUBMITTED";

        if (sub != null) {
            judgesScored = scoreCountMap.getOrDefault(sub.getId(), 0);
            judgesAssigned = assignedJudgesMap.getOrDefault(ranking.getTeamId(), 0L);

            if (resultsPublished) {
                scoreStatus = "PUBLISHED";
            } else if (scoresLocked) {
                scoreStatus = "LOCKED";
            } else if (judgesAssigned > 0 && judgesScored >= judgesAssigned) {
                scoreStatus = "FULLY_SCORED";
            } else if (judgesScored > 0) {
                scoreStatus = "PARTIALLY_SCORED";
            } else {
                scoreStatus = "WAITING_FOR_SCORE";
            }
        }

        return LiveScoreEntry.builder()
                .teamId(ranking.getTeamId())
                .teamName(teamName)
                .trackName(trackName)
                .trackId(teamTrackId)
                .finalScore(ranking.getFinalScore())
                .rank(ranking.getRank())
                .previousRank(previousRankMap.get(ranking.getTeamId()))
                .scoreStatus(scoreStatus)
                .judgesScored(judgesScored)
                .judgesAssigned((int) judgesAssigned)
                .calculatedAt(ranking.getCalculatedAt())
                .build();
    }

    private boolean isRoundScoresLocked(UUID eventId, UUID roundId) {
        return judgingPublicService.existsLockedScoreByRound(roundId);
    }

    private void validateLeaderboardAccess(EventSnapshot event, RoundSnapshot round,
                                           Optional<UserType> role,
                                           boolean scoresLocked, boolean resultsPublished) {
        if (role.map(r -> r == UserType.SYSTEM_ADMIN || r == UserType.EVENT_COORDINATOR).orElse(false)) {
            return;
        }

        if (role.map(r -> r == UserType.LECTURER).orElse(false)) {
            if (isRoundActivelyScoring(round, scoresLocked, resultsPublished)) {
                throw new BusinessException(
                        "Judges cannot view live ranking while the round is being scored",
                        HttpStatus.FORBIDDEN) {};
            }
            return;
        }

        boolean isStudent = role.map(r ->
                r == UserType.FPT_STUDENT || r == UserType.EXTERNAL_STUDENT).orElse(true);

        if (isStudent && !event.isLeaderboardPublic() && !resultsPublished) {
            throw new BusinessException(
                    "Live ranking is not publicly available for this event",
                    HttpStatus.FORBIDDEN) {};
        }
    }

    private boolean isRoundActivelyScoring(RoundSnapshot round, boolean scoresLocked, boolean resultsPublished) {
        if (scoresLocked || resultsPublished) return false;
        LocalDateTime now = LocalDateTime.now();
        return !now.isBefore(round.getStartDate());
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

    private LiveScoreBoard buildEmptyBoard(EventSnapshot event, UUID eventId) {
        List<TrackSnapshot> tracks = eventPublicService.getTracksByEvent(eventId);
        Optional<UserType> role = resolveCurrentRole();
        boolean canManage = role.map(r ->
                r == UserType.SYSTEM_ADMIN || r == UserType.EVENT_COORDINATOR).orElse(false);

        return LiveScoreBoard.builder()
                .eventId(eventId)
                .eventName(event.getName())
                .season(event.getSeason())
                .year(event.getYear())
                .tracks(tracks.stream()
                        .map(t -> TrackInfo.builder().id(t.getId()).name(t.getName()).build())
                        .toList())
                .rankings(List.of())
                .scoresLocked(false)
                .resultsPublished(false)
                .leaderboardPublic(event.isLeaderboardPublic())
                .canManageLeaderboard(canManage)
                .build();
    }
}
