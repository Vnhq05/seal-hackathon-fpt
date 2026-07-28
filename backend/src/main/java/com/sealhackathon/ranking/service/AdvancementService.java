package com.sealhackathon.ranking.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.CompetitionGroup;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.repository.CompetitionGroupRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.ranking.domain.Advancement;
import com.sealhackathon.ranking.domain.FinalistContestedSlot;
import com.sealhackathon.ranking.domain.FinalistContestedSlotTeam;
import com.sealhackathon.ranking.domain.FinalistSelection;
import com.sealhackathon.ranking.domain.Ranking;
import com.sealhackathon.ranking.domain.enums.AdvancementStatus;
import com.sealhackathon.ranking.domain.enums.ContestedSlotType;
import com.sealhackathon.ranking.domain.enums.FinalistSelectionMethod;
import com.sealhackathon.ranking.dto.request.AdvancementSelectionRequest;
import com.sealhackathon.ranking.dto.response.AdvancementResponse;
import com.sealhackathon.ranking.dto.response.AdvancementSelectionPreviewResponse;
import com.sealhackathon.ranking.dto.response.AdvancementSelectionPreviewResponse.ContestedBucket;
import com.sealhackathon.ranking.dto.response.AdvancementSelectionPreviewResponse.Scope;
import com.sealhackathon.ranking.dto.response.AdvancementSelectionPreviewResponse.SelectedTeam;
import com.sealhackathon.ranking.repository.AdvancementRepository;
import com.sealhackathon.ranking.repository.FinalistContestedSlotRepository;
import com.sealhackathon.ranking.repository.FinalistSelectionRepository;
import com.sealhackathon.ranking.repository.RankingRepository;
import com.sealhackathon.submission.service.FinalSubmissionCarryOverService;
import com.sealhackathon.submission.service.SubmissionPublicService;
import com.sealhackathon.team.dto.snapshot.TeamSnapshot;
import com.sealhackathon.team.service.TeamPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdvancementService {

    private final AdvancementRepository advancementRepository;
    private final RankingRepository rankingRepository;
    private final RoundRepository roundRepository;
    private final TrackRepository trackRepository;
    private final CompetitionGroupRepository competitionGroupRepository;
    private final TeamPublicService teamPublicService;
    private final RankingTieBreakComparator tieBreakComparator;
    private final FinalistSelectionRepository finalistRepository;
    private final FinalistContestedSlotRepository contestedSlotRepository;
    private final FinalSubmissionCarryOverService finalSubmissionCarryOverService;
    private final SubmissionPublicService submissionPublicService;

    @Transactional(readOnly = true)
    public AdvancementSelectionPreviewResponse preview(UUID roundId, AdvancementSelectionRequest request) {
        return buildSelection(roundId, request, false);
    }

    @Transactional
    public AdvancementSelectionPreviewResponse confirm(UUID roundId, AdvancementSelectionRequest request) {
        AdvancementSelectionPreviewResponse dryRun = buildSelection(roundId, request, false);
        if (!dryRun.getContested().isEmpty() && request.getMode() == AdvancementSelectionRequest.Mode.AUTO) {
            throw new BusinessException(
                    "Contested slots remain after tiebreak. Resolve ties manually (MANUAL mode) before confirming.",
                    HttpStatus.CONFLICT);
        }
        return buildSelection(roundId, request, true);
    }

    /**
     * @deprecated Use {@link #confirm(UUID, AdvancementSelectionRequest)} with explicit Top N / team ids.
     * Kept only so publish can read already-confirmed rows — does not auto-select by ratio.
     */
    @Transactional(readOnly = true)
    public List<AdvancementResponse> determineAdvancements(UUID roundId) {
        List<AdvancementResponse> existing = getAdvancements(roundId);
        if (existing.isEmpty()) {
            throw new BusinessException(
                    "No advancement selection confirmed for this round. Preview and confirm Top N or manual picks first.",
                    HttpStatus.BAD_REQUEST);
        }
        return existing;
    }

    @Transactional(readOnly = true)
    public List<AdvancementResponse> getAdvancements(UUID roundId) {
        int latestVersion = rankingRepository.findMaxVersionByRoundId(roundId);
        Map<UUID, Ranking> rankingMap = rankingRepository
                .findByRoundIdAndVersionOrderByRankAsc(roundId, latestVersion).stream()
                .collect(Collectors.toMap(Ranking::getTeamId, r -> r, (a, b) -> a, LinkedHashMap::new));

        return advancementRepository.findByRoundId(roundId).stream()
                .map(a -> toResponse(a, rankingMap.get(a.getTeamId())))
                .toList();
    }

    private AdvancementSelectionPreviewResponse buildSelection(
            UUID roundId, AdvancementSelectionRequest request, boolean persist) {
        validateRequest(request);

        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round", "id", roundId));
        if (round.getRoundType() == RoundType.FINAL) {
            throw new BusinessException("Cannot advance teams from the final round", HttpStatus.BAD_REQUEST);
        }

        Round nextRound = findNextRound(round);
        if (nextRound == null) {
            throw new BusinessException("No next round found to advance into", HttpStatus.BAD_REQUEST);
        }

        int latestVersion = rankingRepository.findMaxVersionByRoundId(roundId);
        if (latestVersion == 0) {
            throw new BusinessException("Rankings not yet calculated for this round", HttpStatus.BAD_REQUEST);
        }
        List<Ranking> rankings = rankingRepository
                .findByRoundIdAndVersionOrderByRankAsc(roundId, latestVersion);

        SelectionBuild built = request.getMode() == AdvancementSelectionRequest.Mode.MANUAL
                ? buildManual(rankings, request.getTeamIds())
                : buildAuto(rankings, roundId, request.getTopN());

        if (persist) {
            persistAdvancements(roundId, rankings, built.selectedIds);
            round.setAdvancementCutoff(request.getMode() == AdvancementSelectionRequest.Mode.AUTO
                    ? request.getTopN()
                    : Math.max(1, built.selected.size()));
            roundRepository.save(round);

            if (nextRound.getRoundType() == RoundType.FINAL) {
                syncFinalists(round, nextRound, built);
            }
        }

        return AdvancementSelectionPreviewResponse.builder()
                .roundId(roundId)
                .roundName(round.getName())
                .nextRoundId(nextRound.getId())
                .nextRoundName(nextRound.getName())
                .nextRoundType(nextRound.getRoundType() != null ? nextRound.getRoundType().name() : null)
                .nextIsFinal(nextRound.getRoundType() == RoundType.FINAL)
                .scope(built.scope)
                .topN(request.getTopN())
                .mode(request.getMode().name())
                .selected(built.selected)
                .contested(built.contested)
                .eliminatedCount(Math.max(0, rankings.size() - built.selectedIds.size()))
                .confirmed(persist)
                .build();
    }

    private void validateRequest(AdvancementSelectionRequest request) {
        if (request == null || request.getMode() == null) {
            throw new BusinessException("mode is required (AUTO or MANUAL)", HttpStatus.BAD_REQUEST);
        }
        if (request.getMode() == AdvancementSelectionRequest.Mode.AUTO) {
            if (request.getTopN() == null || request.getTopN() < 1) {
                throw new BusinessException("topN is required for AUTO mode (minimum 1)", HttpStatus.BAD_REQUEST);
            }
        } else {
            if (request.getTeamIds() == null || request.getTeamIds().isEmpty()) {
                throw new BusinessException("teamIds is required for MANUAL mode", HttpStatus.BAD_REQUEST);
            }
        }
    }

    private Round findNextRound(Round current) {
        UUID eventId = current.getHackathonEvent().getId();
        return roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId).stream()
                .filter(r -> r.getRoundNumber() != null
                        && current.getRoundNumber() != null
                        && r.getRoundNumber() > current.getRoundNumber())
                .findFirst()
                .orElse(null);
    }

    private SelectionBuild buildManual(List<Ranking> rankings, List<UUID> teamIds) {
        Map<UUID, Ranking> byTeam = rankings.stream()
                .collect(Collectors.toMap(Ranking::getTeamId, r -> r, (a, b) -> a, LinkedHashMap::new));
        Set<UUID> requested = new LinkedHashSet<>(teamIds);
        List<UUID> missing = requested.stream().filter(id -> !byTeam.containsKey(id)).toList();
        if (!missing.isEmpty()) {
            throw new BusinessException(
                    "Some teamIds are not in this round's rankings: " + missing,
                    HttpStatus.BAD_REQUEST);
        }

        List<SelectedTeam> selected = new ArrayList<>();
        for (UUID teamId : requested) {
            selected.add(toSelectedTeam(byTeam.get(teamId), "Manual selection"));
        }
        return new SelectionBuild(Scope.GLOBAL, selected, List.of(), new LinkedHashSet<>(requested));
    }

    private SelectionBuild buildAuto(List<Ranking> rankings, UUID roundId, int topN) {
        Map<UUID, List<Ranking>> byGroup = bucketByGroup(rankings);
        if (!byGroup.isEmpty()) {
            return cutBuckets(byGroup, roundId, topN, Scope.GROUP, true);
        }
        Map<UUID, List<Ranking>> byTrack = bucketByTrack(rankings);
        if (!byTrack.isEmpty()) {
            return cutBuckets(byTrack, roundId, topN, Scope.TRACK, false);
        }
        return cutBuckets(Map.of((UUID) null, rankings), roundId, topN, Scope.GLOBAL, false);
    }

    private SelectionBuild cutBuckets(
            Map<UUID, List<Ranking>> buckets,
            UUID roundId,
            int topN,
            Scope scope,
            boolean groupKeys) {
        List<SelectedTeam> selected = new ArrayList<>();
        List<ContestedBucket> contested = new ArrayList<>();
        Set<UUID> selectedIds = new LinkedHashSet<>();

        for (Map.Entry<UUID, List<Ranking>> entry : buckets.entrySet()) {
            RankingTieBreakComparator.SelectionCutResult cut =
                    tieBreakComparator.cutTopN(entry.getValue(), topN, roundId);

            for (Ranking r : cut.selected()) {
                if (selectedIds.add(r.getTeamId())) {
                    String reason = scope == Scope.GROUP
                            ? "Top " + topN + " in competition group"
                            : scope == Scope.TRACK
                            ? "Top " + topN + " in track"
                            : "Top " + topN + " overall";
                    selected.add(toSelectedTeam(r, reason));
                }
            }

            if (!cut.contested().isEmpty()) {
                UUID key = entry.getKey();
                UUID trackId = null;
                String trackName = null;
                UUID groupId = null;
                String groupName = null;
                if (groupKeys && key != null) {
                    groupId = key;
                    groupName = competitionGroupRepository.findById(key).map(CompetitionGroup::getName).orElse(null);
                } else if (!groupKeys && key != null) {
                    trackId = key;
                    trackName = trackRepository.findById(key).map(Track::getName).orElse(null);
                }
                contested.add(ContestedBucket.builder()
                        .trackId(trackId)
                        .trackName(trackName)
                        .groupId(groupId)
                        .groupName(groupName)
                        .teams(cut.contested().stream()
                                .map(r -> toSelectedTeam(r, "Contested at cutoff"))
                                .toList())
                        .build());
            }
        }

        return new SelectionBuild(scope, selected, contested, selectedIds);
    }

    private Map<UUID, List<Ranking>> bucketByGroup(List<Ranking> rankings) {
        Map<UUID, List<Ranking>> byGroup = new LinkedHashMap<>();
        for (Ranking r : rankings) {
            UUID groupId = teamPublicService.getTeam(r.getTeamId())
                    .map(TeamSnapshot::getGroupId)
                    .orElse(null);
            if (groupId != null) {
                byGroup.computeIfAbsent(groupId, k -> new ArrayList<>()).add(r);
            }
        }
        return byGroup;
    }

    private Map<UUID, List<Ranking>> bucketByTrack(List<Ranking> rankings) {
        Map<UUID, List<Ranking>> byTrack = new LinkedHashMap<>();
        for (Ranking r : rankings) {
            UUID trackId = teamPublicService.getTeam(r.getTeamId())
                    .map(TeamSnapshot::getTrackId)
                    .orElse(null);
            if (trackId != null) {
                byTrack.computeIfAbsent(trackId, k -> new ArrayList<>()).add(r);
            }
        }
        return byTrack;
    }

    private void persistAdvancements(UUID roundId, List<Ranking> rankings, Set<UUID> advancedTeamIds) {
        advancementRepository.deleteByRoundId(roundId);
        advancementRepository.flush();

        List<Advancement> rows = new ArrayList<>();
        for (Ranking r : rankings) {
            rows.add(Advancement.builder()
                    .teamId(r.getTeamId())
                    .roundId(roundId)
                    .status(advancedTeamIds.contains(r.getTeamId())
                            ? AdvancementStatus.ADVANCED
                            : AdvancementStatus.ELIMINATED)
                    .build());
        }
        advancementRepository.saveAll(rows);
    }

    private void syncFinalists(Round sourceRound, Round finalRound, SelectionBuild built) {
        UUID eventId = sourceRound.getHackathonEvent().getId();

        finalistRepository.deleteByEventId(eventId);
        contestedSlotRepository.deleteByEventId(eventId);
        finalistRepository.flush();
        contestedSlotRepository.flush();

        LocalDateTime now = LocalDateTime.now();
        int rank = 1;
        List<UUID> teamIds = new ArrayList<>();
        for (SelectedTeam team : built.selected) {
            teamIds.add(team.getTeamId());
            finalistRepository.save(FinalistSelection.builder()
                    .eventId(eventId)
                    .teamId(team.getTeamId())
                    .trackId(team.getTrackId())
                    .preliminaryRank(rank++)
                    .selectedReason(team.getReason())
                    .selectedAt(now)
                    .selectionMethod(built.scope == Scope.GROUP
                            ? FinalistSelectionMethod.TOP_PER_GROUP
                            : FinalistSelectionMethod.TOP_PER_TRACK)
                    .needsPenaltyEvaluation(false)
                    .build());
        }

        int slotIndex = 1;
        for (ContestedBucket bucket : built.contested) {
            ContestedSlotType slotType = bucket.getGroupId() != null
                    ? ContestedSlotType.PER_GROUP_CUTOFF
                    : ContestedSlotType.PER_TRACK_CUTOFF;
            FinalistContestedSlot slot = FinalistContestedSlot.builder()
                    .eventId(eventId)
                    .trackId(bucket.getTrackId())
                    .slotType(slotType)
                    .slotIndex(slotIndex++)
                    .needsPenaltyEvaluation(true)
                    .resolved(false)
                    .build();
            for (SelectedTeam t : bucket.getTeams()) {
                slot.getTeams().add(FinalistContestedSlotTeam.builder()
                        .contestedSlot(slot)
                        .teamId(t.getTeamId())
                        .finalScore(t.getFinalScore())
                        .submittedAt(submissionPublicService
                                .getSubmissionByTeamAndRound(t.getTeamId(), sourceRound.getId())
                                .map(s -> submissionPublicService.getSubmittedAt(s.getId()))
                                .orElse(null))
                        .build());
            }
            contestedSlotRepository.save(slot);
        }

        if (!teamIds.isEmpty()) {
            finalSubmissionCarryOverService.carryOverForTeams(finalRound.getId(), teamIds);
        }
    }

    private SelectedTeam toSelectedTeam(Ranking ranking, String reason) {
        TeamSnapshot team = teamPublicService.getTeam(ranking.getTeamId()).orElse(null);
        UUID trackId = team != null ? team.getTrackId() : null;
        UUID groupId = team != null ? team.getGroupId() : null;
        return SelectedTeam.builder()
                .teamId(ranking.getTeamId())
                .teamName(team != null ? team.getName() : null)
                .trackId(trackId)
                .trackName(trackId != null
                        ? trackRepository.findById(trackId).map(Track::getName).orElse(null)
                        : null)
                .groupId(groupId)
                .groupName(groupId != null
                        ? competitionGroupRepository.findById(groupId).map(CompetitionGroup::getName).orElse(null)
                        : null)
                .rank(ranking.getRank())
                .finalScore(ranking.getFinalScore())
                .reason(reason)
                .build();
    }

    private AdvancementResponse toResponse(Advancement a, Ranking ranking) {
        TeamSnapshot team = teamPublicService.getTeam(a.getTeamId()).orElse(null);
        return AdvancementResponse.builder()
                .id(a.getId())
                .teamId(a.getTeamId())
                .teamName(team != null ? team.getName() : null)
                .roundId(a.getRoundId())
                .status(a.getStatus())
                .rank(ranking != null ? ranking.getRank() : null)
                .finalScore(ranking != null ? ranking.getFinalScore() : null)
                .build();
    }

    private record SelectionBuild(
            Scope scope,
            List<SelectedTeam> selected,
            List<ContestedBucket> contested,
            Set<UUID> selectedIds) {
        SelectionBuild {
            selectedIds = selectedIds != null ? selectedIds : new HashSet<>();
        }
    }
}
