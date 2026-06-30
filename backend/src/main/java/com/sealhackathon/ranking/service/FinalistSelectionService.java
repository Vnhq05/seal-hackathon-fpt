package com.sealhackathon.ranking.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.enums.CompetitionFormat;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.event.service.EventService;
import com.sealhackathon.event.service.FormatRuleEngine;
import com.sealhackathon.ranking.domain.FinalistContestedSlot;
import com.sealhackathon.ranking.domain.FinalistContestedSlotTeam;
import com.sealhackathon.ranking.domain.FinalistSelection;
import com.sealhackathon.ranking.domain.Ranking;
import com.sealhackathon.ranking.domain.enums.ContestedSlotType;
import com.sealhackathon.ranking.domain.enums.FinalistSelectionMethod;
import com.sealhackathon.ranking.dto.response.ContestedSlotResponse;
import com.sealhackathon.ranking.dto.response.ContestedTeamResponse;
import com.sealhackathon.ranking.dto.response.FinalistResponse;
import com.sealhackathon.ranking.dto.response.FinalistSelectResultResponse;
import com.sealhackathon.ranking.dto.response.FinalistSelectionSummaryResponse;
import com.sealhackathon.ranking.repository.FinalistContestedSlotRepository;
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
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FinalistSelectionService {

    private final FinalistSelectionRepository finalistRepository;
    private final FinalistContestedSlotRepository contestedSlotRepository;
    private final RankingRepository rankingRepository;
    private final RoundRepository roundRepository;
    private final HackathonEventRepository eventRepository;
    private final TrackRepository trackRepository;
    private final TeamPublicService teamPublicService;
    private final SubmissionPublicService submissionPublicService;
    private final EventService eventService;
    private final RankingTieBreakComparator tieBreakComparator;
    private final FormatRuleEngine formatRuleEngine;

    @Transactional
    public FinalistSelectResultResponse selectFinalists(UUID eventId) {
        var event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        EventStatus resolved = eventService.resolveStatus(event);
        if (resolved != EventStatus.SCORING && resolved != EventStatus.ACTIVE
                && resolved != EventStatus.COMPLETED) {
            throw new BusinessException(
                    "Finalist selection is only allowed when event is ACTIVE, SCORING, or COMPLETED",
                    HttpStatus.BAD_REQUEST);
        }

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

        SelectionState state = new SelectionState();
        if (event.getCompetitionFormat() == CompetitionFormat.SEAL_RAG_2026) {
            selectSealFinalists(eventId, preliminary.getId(), rankings, state);
        } else {
            selectGenericFinalists(preliminary, rankings, state);
        }

        finalistRepository.deleteByEventId(eventId);
        contestedSlotRepository.deleteByEventId(eventId);
        finalistRepository.flush();
        contestedSlotRepository.flush();

        LocalDateTime now = LocalDateTime.now();
        List<FinalistSelection> saved = persistSelections(eventId, state, now);
        List<FinalistContestedSlot> savedSlots = persistContestedSlots(eventId, preliminary.getId(), state);

        List<FinalistResponse> finalistResponses = saved.stream().map(this::toResponse).toList();
        List<ContestedSlotResponse> contestedResponses = savedSlots.stream()
                .map(s -> toContestedResponse(s, preliminary.getId()))
                .toList();

        boolean penaltyRequired = contestedResponses.stream()
                .anyMatch(ContestedSlotResponse::isNeedsPenaltyEvaluation);

        return FinalistSelectResultResponse.builder()
                .finalists(finalistResponses)
                .contestedSlots(contestedResponses)
                .summary(FinalistSelectionSummaryResponse.builder()
                        .selectedCount(finalistResponses.size())
                        .targetCount(event.getCompetitionFormat() == CompetitionFormat.SEAL_RAG_2026
                                ? formatRuleEngine.getSealFinalistCount()
                                : preliminary.getAdvancementCutoff())
                        .penaltyEvaluationRequired(penaltyRequired)
                        .build())
                .build();
    }

    private void selectGenericFinalists(Round preliminary, List<Ranking> rankings, SelectionState state) {
        int cutoff = preliminary.getAdvancementCutoff() != null ? preliminary.getAdvancementCutoff() : 3;
        RankingTieBreakComparator.SelectionCutResult cut = tieBreakComparator.cutTopN(
                rankings, cutoff, preliminary.getId());
        for (Ranking r : cut.selected()) {
            state.addSelection(r.getTeamId(), FinalistSelectionMethod.TOP_PER_TRACK,
                    "Advancement cutoff", false);
        }
        if (!cut.contested().isEmpty()) {
            state.addContested(null, ContestedSlotType.PER_TRACK_CUTOFF, 1, cut.contested());
        }
    }

    private void selectSealFinalists(UUID eventId, UUID roundId, List<Ranking> rankings,
                                      SelectionState state) {
        Map<UUID, List<Ranking>> byTrack = groupByTrack(rankings);
        int slotIndex = 1;

        for (Map.Entry<UUID, List<Ranking>> entry : byTrack.entrySet()) {
            UUID trackId = entry.getKey();
            RankingTieBreakComparator.SelectionCutResult cut = tieBreakComparator.cutTopN(
                    entry.getValue(), formatRuleEngine.getSealTopPerTrack(), roundId);

            for (Ranking r : cut.selected()) {
                state.addSelection(r.getTeamId(), FinalistSelectionMethod.TOP_PER_TRACK,
                        "Top 2 in track", false);
            }
            if (!cut.contested().isEmpty()) {
                state.addContested(trackId, ContestedSlotType.PER_TRACK_CUTOFF, slotIndex++, cut.contested());
            }
        }

        if (state.selectedTeamIds.size() < formatRuleEngine.getSealFinalistCount()) {
            int needed = formatRuleEngine.getSealFinalistCount() - state.selectedTeamIds.size();
            List<Ranking> remaining = rankings.stream()
                    .filter(r -> !state.selectedSet.contains(r.getTeamId()))
                    .toList();

            RankingTieBreakComparator.SelectionCutResult overflow = tieBreakComparator.cutTopN(
                    remaining, needed, roundId);

            for (Ranking r : overflow.selected()) {
                state.addSelection(r.getTeamId(), FinalistSelectionMethod.OVERFLOW_FILL,
                        "Overflow fill to reach " + formatRuleEngine.getSealFinalistCount() + " finalists", false);
            }
            if (!overflow.contested().isEmpty()) {
                state.addContested(null, ContestedSlotType.OVERFLOW_FILL, slotIndex, overflow.contested());
            }
        }
    }

    private Map<UUID, List<Ranking>> groupByTrack(List<Ranking> rankings) {
        Map<UUID, List<Ranking>> byTrack = new LinkedHashMap<>();
        for (Ranking r : rankings) {
            UUID trackId = teamPublicService.getTeam(r.getTeamId())
                    .map(TeamSnapshot::getTrackId)
                    .orElse(null);
            if (trackId == null) {
                continue;
            }
            byTrack.computeIfAbsent(trackId, k -> new ArrayList<>()).add(r);
        }
        return byTrack;
    }

    private List<FinalistSelection> persistSelections(UUID eventId, SelectionState state, LocalDateTime now) {
        List<FinalistSelection> saved = new ArrayList<>();
        int rank = 1;
        for (SelectionEntry entry : state.selections) {
            TeamSnapshot team = teamPublicService.getTeam(entry.teamId()).orElse(null);
            saved.add(finalistRepository.save(FinalistSelection.builder()
                    .eventId(eventId)
                    .teamId(entry.teamId())
                    .trackId(team != null ? team.getTrackId() : null)
                    .preliminaryRank(rank++)
                    .selectedReason(entry.reason())
                    .selectedAt(now)
                    .selectionMethod(entry.method())
                    .needsPenaltyEvaluation(entry.needsPenalty())
                    .build()));
        }
        return saved;
    }

    private List<FinalistContestedSlot> persistContestedSlots(UUID eventId, UUID roundId, SelectionState state) {
        List<FinalistContestedSlot> saved = new ArrayList<>();
        for (ContestedEntry entry : state.contested) {
            FinalistContestedSlot slot = FinalistContestedSlot.builder()
                    .eventId(eventId)
                    .trackId(entry.trackId())
                    .slotType(entry.slotType())
                    .slotIndex(entry.slotIndex())
                    .needsPenaltyEvaluation(true)
                    .resolved(false)
                    .build();

            for (Ranking r : entry.rankings()) {
                slot.getTeams().add(FinalistContestedSlotTeam.builder()
                        .contestedSlot(slot)
                        .teamId(r.getTeamId())
                        .finalScore(r.getFinalScore())
                        .submittedAt(getSubmittedAt(roundId, r.getTeamId()))
                        .build());
            }
            saved.add(contestedSlotRepository.save(slot));
        }
        return saved;
    }

    @Transactional(readOnly = true)
    public List<FinalistResponse> getFinalists(UUID eventId) {
        return finalistRepository.findByEventIdOrderByPreliminaryRankAsc(eventId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ContestedSlotResponse> getContestedSlots(UUID eventId) {
        Round preliminary = roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(eventId).stream()
                .filter(r -> r.getRoundType() == RoundType.PRELIMINARY)
                .findFirst()
                .orElse(null);
        UUID roundId = preliminary != null ? preliminary.getId() : null;

        return contestedSlotRepository.findByEventIdAndResolvedFalseOrderBySlotIndexAsc(eventId).stream()
                .map(s -> toContestedResponse(s, roundId))
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
                .selectionMethod(f.getSelectionMethod())
                .needsPenaltyEvaluation(f.isNeedsPenaltyEvaluation())
                .build();
    }

    private ContestedSlotResponse toContestedResponse(FinalistContestedSlot slot, UUID roundId) {
        String trackName = slot.getTrackId() != null
                ? trackRepository.findById(slot.getTrackId()).map(t -> t.getName()).orElse(null)
                : null;
        List<ContestedTeamResponse> teams = slot.getTeams().stream()
                .map(t -> ContestedTeamResponse.builder()
                        .teamId(t.getTeamId())
                        .teamName(teamPublicService.getTeam(t.getTeamId())
                                .map(TeamSnapshot::getName).orElse(null))
                        .finalScore(t.getFinalScore())
                        .submittedAt(t.getSubmittedAt())
                        .build())
                .toList();
        return ContestedSlotResponse.builder()
                .id(slot.getId())
                .trackId(slot.getTrackId())
                .trackName(trackName)
                .slotType(slot.getSlotType())
                .slotIndex(slot.getSlotIndex())
                .needsPenaltyEvaluation(slot.isNeedsPenaltyEvaluation())
                .teams(teams)
                .build();
    }

    private LocalDateTime getSubmittedAt(UUID roundId, UUID teamId) {
        if (roundId == null) {
            return null;
        }
        return submissionPublicService.getSubmissionByTeamAndRound(teamId, roundId)
                .map(s -> submissionPublicService.getSubmittedAt(s.getId()))
                .orElse(null);
    }

    private static final class SelectionState {
        final List<SelectionEntry> selections = new ArrayList<>();
        final List<ContestedEntry> contested = new ArrayList<>();
        final Set<UUID> selectedSet = new HashSet<>();

        List<UUID> selectedTeamIds = new ArrayList<>();

        void addSelection(UUID teamId, FinalistSelectionMethod method, String reason, boolean needsPenalty) {
            if (selectedSet.add(teamId)) {
                selectedTeamIds.add(teamId);
                selections.add(new SelectionEntry(teamId, method, reason, needsPenalty));
            }
        }

        void addContested(UUID trackId, ContestedSlotType slotType, int slotIndex, List<Ranking> rankings) {
            contested.add(new ContestedEntry(trackId, slotType, slotIndex, rankings));
        }
    }

    private record SelectionEntry(UUID teamId, FinalistSelectionMethod method, String reason,
                                  boolean needsPenalty) {}

    private record ContestedEntry(UUID trackId, ContestedSlotType slotType, int slotIndex,
                                  List<Ranking> rankings) {}
}
