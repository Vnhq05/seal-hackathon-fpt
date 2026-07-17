package com.sealhackathon.team.service;

import com.sealhackathon.event.domain.CompetitionGroup;
import com.sealhackathon.event.repository.CompetitionGroupRepository;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupAssignmentService {

    private final TeamRepository teamRepository;
    private final CompetitionGroupRepository competitionGroupRepository;

    /**
     * Puts the team in the least-loaded competition group of its track, so every team in a
     * track that has groups is judgeable: judges resolve teams by group at GROUP scope, and a
     * team without a group matches no assignment.
     *
     * <p>Mutates the entity only — the caller saves it and owns the transaction, mirroring
     * {@link TrackAssignmentService#assignOneInternal}. No-op when the team has no track, when
     * it already has a group (a coordinator's manual choice always wins), or when the track has
     * no groups at all.
     */
    public void autoAssignGroup(Team team) {
        if (team.getTrackId() == null || team.getGroupId() != null) {
            return;
        }

        List<CompetitionGroup> groups = competitionGroupRepository.findByTrackIdOrderByNameAsc(team.getTrackId());
        if (groups.isEmpty()) {
            return;
        }

        Map<UUID, Long> teamsPerGroup = teamRepository.countByTrackIdGroupByGroup(team.getTrackId()).stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> ((Number) row[1]).longValue()));

        // Iterating the groups rather than the counts is what lets an empty group win: it has no
        // count row. Ties resolve to the first group by name, since min() keeps the earlier element.
        groups.stream()
                .min(Comparator.comparingLong(group -> teamsPerGroup.getOrDefault(group.getId(), 0L)))
                .ifPresent(group -> team.setGroupId(group.getId()));
    }
}
