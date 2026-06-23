package com.sealhackathon.ranking.service;

import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.dto.snapshot.EventSnapshot;
import com.sealhackathon.event.dto.snapshot.RoundSnapshot;
import com.sealhackathon.event.dto.snapshot.TrackSnapshot;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.judging.service.JudgingPublicService;
import com.sealhackathon.ranking.domain.Ranking;
import com.sealhackathon.ranking.dto.response.LiveScoreBoard;
import com.sealhackathon.ranking.dto.response.LiveScoreEntry;
import com.sealhackathon.ranking.repository.PublishedResultRepository;
import com.sealhackathon.ranking.repository.RankingRepository;
import com.sealhackathon.submission.dto.snapshot.SubmissionSnapshot;
import com.sealhackathon.submission.service.SubmissionPublicService;
import com.sealhackathon.team.dto.snapshot.TeamSnapshot;
import com.sealhackathon.team.service.TeamPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
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
    public LiveScoreBoard getLeaderboard(UUID eventId, UUID trackId, UUID roundId) {
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
        } else {
            round = rounds.get(rounds.size() - 1);
        }

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

        boolean scoresLocked = currentRankings.stream()
                .anyMatch(r -> {
                    TeamSnapshot team = teamMap.get(r.getTeamId());
                    if (team == null) return false;
                    SubmissionSnapshot sub = submissionPublicService
                            .getSubmissionByTeamAndRound(team.getId(), round.getId()).orElse(null);
                    if (sub == null) return false;
                    var scores = judgingPublicService.getScoresBySubmission(sub.getId());
                    return scores.stream().anyMatch(s ->
                            s.getStatus() == com.sealhackathon.judging.domain.enums.ScoreStatus.LOCKED);
                });

        boolean resultsPublished = publishedResultRepository.existsByRoundId(round.getId());

        Map<UUID, Integer> finalPrevRankMap = previousRankMap;
        List<LiveScoreEntry> entries = currentRankings.stream()
                .map(ranking -> {
                    TeamSnapshot team = teamMap.get(ranking.getTeamId());
                    String teamName = team != null ? team.getName() : "Unknown";
                    UUID teamTrackId = team != null ? team.getTrackId() : null;
                    String trackName = teamTrackId != null ? trackNameMap.get(teamTrackId) : null;

                    SubmissionSnapshot sub = submissionPublicService
                            .getSubmissionByTeamAndRound(ranking.getTeamId(), round.getId()).orElse(null);

                    int judgesScored = 0;
                    long judgesAssigned = 0;
                    String scoreStatus = "NOT_SUBMITTED";

                    if (sub != null) {
                        judgesScored = judgingPublicService.countCompletedScores(sub.getId());
                        judgesAssigned = judgingPublicService.countAssignedJudges(ranking.getTeamId(), round.getId());

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

                    Integer previousRank = finalPrevRankMap.get(ranking.getTeamId());

                    return LiveScoreEntry.builder()
                            .teamId(ranking.getTeamId())
                            .teamName(teamName)
                            .trackName(trackName)
                            .trackId(teamTrackId)
                            .finalScore(ranking.getFinalScore())
                            .rank(ranking.getRank())
                            .previousRank(previousRank)
                            .scoreStatus(scoreStatus)
                            .judgesScored(judgesScored)
                            .judgesAssigned((int) judgesAssigned)
                            .calculatedAt(ranking.getCalculatedAt())
                            .build();
                })
                .filter(entry -> trackId == null || trackId.equals(entry.getTrackId()))
                .toList();

        return LiveScoreBoard.builder()
                .eventId(eventId)
                .eventName(event.getName())
                .season(event.getSeason())
                .year(event.getYear())
                .roundId(round.getId())
                .roundName(round.getName())
                .tracks(tracks.stream().map(TrackSnapshot::getName).toList())
                .rankings(entries)
                .scoresLocked(scoresLocked)
                .resultsPublished(resultsPublished)
                .build();
    }

    private LiveScoreBoard buildEmptyBoard(EventSnapshot event, UUID eventId) {
        List<TrackSnapshot> tracks = eventPublicService.getTracksByEvent(eventId);
        return LiveScoreBoard.builder()
                .eventId(eventId)
                .eventName(event.getName())
                .season(event.getSeason())
                .year(event.getYear())
                .tracks(tracks.stream().map(TrackSnapshot::getName).toList())
                .rankings(List.of())
                .scoresLocked(false)
                .resultsPublished(false)
                .build();
    }
}
