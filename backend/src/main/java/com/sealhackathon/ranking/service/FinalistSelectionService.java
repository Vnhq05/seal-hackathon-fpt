package com.sealhackathon.ranking.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.CompetitionFormat;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.event.service.FormatRuleEngine;
import com.sealhackathon.ranking.domain.FinalistSelection;
import com.sealhackathon.ranking.domain.Ranking;
import com.sealhackathon.ranking.dto.response.FinalistResponse;
import com.sealhackathon.ranking.repository.FinalistSelectionRepository;
import com.sealhackathon.ranking.repository.RankingRepository;
import com.sealhackathon.submission.service.SubmissionPublicService;
import com.sealhackathon.team.dto.snapshot.TeamSnapshot;
import com.sealhackathon.team.service.TeamPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FinalistSelectionService {

    private final FinalistSelectionRepository finalistRepository;
    private final RankingRepository rankingRepository;
    private final RoundRepository roundRepository;
    private final HackathonEventRepository eventRepository;
    private final TrackRepository trackRepository;
    private final TeamPublicService teamPublicService;
    private final SubmissionPublicService submissionPublicService;
    private final FormatRuleEngine formatRuleEngine;

    @Transactional
    public List<FinalistResponse> selectFinalists(UUID eventId) {
        var event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        Round preliminary = roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId).stream()
                .filter(r -> r.getRoundType() == RoundType.PRELIMINARY)
                .findFirst()
                .orElseThrow(() -> new BusinessException(
                        "No preliminary round found for this event", HttpStatus.BAD_REQUEST));

        int latestVersion = rankingRepository.findMaxVersionByRoundId(preliminary.getId());
        if (latestVersion == 0) {
            throw new BusinessException("Preliminary rankings not yet calculated", HttpStatus.BAD_REQUEST);
        }

        List<Ranking> rankings = rankingRepository
                .findByRoundIdAndVersionOrderByRankAsc(preliminary.getId(), latestVersion);

        List<UUID> selectedTeamIds = new ArrayList<>();
        Set<UUID> selectedSet = new HashSet<>();

        if (event.getCompetitionFormat() == CompetitionFormat.SEAL_RAG_2026) {
            selectSealFinalists(eventId, preliminary.getId(), rankings, selectedTeamIds, selectedSet);
        } else {
            int cutoff = preliminary.getAdvancementCutoff() != null ? preliminary.getAdvancementCutoff() : 3;
            for (Ranking r : rankings) {
                if (selectedTeamIds.size() >= cutoff) break;
                selectedTeamIds.add(r.getTeamId());
                selectedSet.add(r.getTeamId());
            }
        }

        finalistRepository.deleteByEventId(eventId);
        finalistRepository.flush();

        List<FinalistSelection> saved = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (int i = 0; i < selectedTeamIds.size(); i++) {
            UUID teamId = selectedTeamIds.get(i);
            TeamSnapshot team = teamPublicService.getTeam(teamId).orElse(null);
            saved.add(finalistRepository.save(FinalistSelection.builder()
                    .eventId(eventId)
                    .teamId(teamId)
                    .trackId(team != null ? team.getTrackId() : null)
                    .preliminaryRank(i + 1)
                    .selectedReason(event.getCompetitionFormat() == CompetitionFormat.SEAL_RAG_2026
                            ? "SEAL Top-2-per-track selection" : "Advancement cutoff")
                    .selectedAt(now)
                    .build()));
        }

        return saved.stream().map(this::toResponse).toList();
    }

    private void selectSealFinalists(UUID eventId, UUID roundId, List<Ranking> rankings,
                                      List<UUID> selectedTeamIds, Set<UUID> selectedSet) {
        Map<UUID, List<Ranking>> byTrack = new LinkedHashMap<>();
        for (Ranking r : rankings) {
            UUID trackId = teamPublicService.getTeam(r.getTeamId())
                    .map(TeamSnapshot::getTrackId)
                    .orElse(null);
            if (trackId == null) continue;
            byTrack.computeIfAbsent(trackId, k -> new ArrayList<>()).add(r);
        }

        for (List<Ranking> trackRankings : byTrack.values()) {
            trackRankings.sort(Comparator.comparing(Ranking::getRank));
            int take = Math.min(FormatRuleEngine.SEAL_TOP_PER_TRACK, trackRankings.size());
            for (int i = 0; i < take; i++) {
                UUID teamId = trackRankings.get(i).getTeamId();
                if (selectedSet.add(teamId)) {
                    selectedTeamIds.add(teamId);
                }
            }
        }

        if (selectedTeamIds.size() < FormatRuleEngine.SEAL_FINALIST_COUNT) {
            List<Ranking> remaining = rankings.stream()
                    .filter(r -> !selectedSet.contains(r.getTeamId()))
                    .sorted(Comparator
                            .comparing(Ranking::getFinalScore).reversed()
                            .thenComparing(r -> getSubmittedAt(roundId, r.getTeamId())))
                    .toList();
            for (Ranking r : remaining) {
                if (selectedTeamIds.size() >= FormatRuleEngine.SEAL_FINALIST_COUNT) break;
                if (selectedSet.add(r.getTeamId())) {
                    selectedTeamIds.add(r.getTeamId());
                }
            }
        }
    }

    private LocalDateTime getSubmittedAt(UUID roundId, UUID teamId) {
        return submissionPublicService.getSubmissionByTeamAndRound(teamId, roundId)
                .map(s -> submissionPublicService.getSubmittedAt(s.getId()))
                .orElse(LocalDateTime.MAX);
    }

    @Transactional(readOnly = true)
    public List<FinalistResponse> getFinalists(UUID eventId) {
        return finalistRepository.findByEventIdOrderByPreliminaryRankAsc(eventId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean isFinalist(UUID eventId, UUID teamId) {
        return finalistRepository.existsByEventIdAndTeamId(eventId, teamId);
    }

    private FinalistResponse toResponse(FinalistSelection f) {
        String teamName = teamPublicService.getTeam(f.getTeamId())
                .map(TeamSnapshot::getName)
                .orElse(null);
        String trackName = f.getTrackId() != null
                ? trackRepository.findById(f.getTrackId()).map(t -> t.getName()).orElse(null)
                : null;
        return FinalistResponse.builder()
                .id(f.getId())
                .eventId(f.getEventId())
                .teamId(f.getTeamId())
                .teamName(teamName)
                .trackId(f.getTrackId())
                .trackName(trackName)
                .preliminaryRank(f.getPreliminaryRank())
                .selectedReason(f.getSelectedReason())
                .selectedAt(f.getSelectedAt())
                .build();
    }
}
