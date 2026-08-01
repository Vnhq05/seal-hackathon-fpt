package com.sealhackathon.event.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.CompetitionGroup;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.dto.request.CreateCompetitionGroupRequest;
import com.sealhackathon.event.dto.request.GenerateCompetitionGroupsRequest;
import com.sealhackathon.event.dto.response.CompetitionGroupResponse;
import com.sealhackathon.event.dto.response.GenerateCompetitionGroupsResponse;
import com.sealhackathon.event.repository.CompetitionGroupRepository;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompetitionGroupService {

    private final CompetitionGroupRepository groupRepository;
    private final TrackRepository trackRepository;
    private final HackathonEventRepository eventRepository;
    private final EventService eventService;
    private final TeamRepository teamRepository;
    private final JudgeAssignmentService judgeAssignmentService;

    @Transactional
    public CompetitionGroupResponse createGroup(UUID eventId, UUID trackId, CreateCompetitionGroupRequest request) {
        validateTrack(eventId, trackId);
        eventService.enforceEventOwnership(eventId);

        if (groupRepository.existsByTrackIdAndName(trackId, request.getName().trim())) {
            throw new DuplicateResourceException("CompetitionGroup", "track+name", trackId + "/" + request.getName());
        }

        CompetitionGroup group = CompetitionGroup.builder()
                .eventId(eventId)
                .trackId(trackId)
                .name(request.getName().trim())
                .maxTeams(10)
                .sortOrder((int) groupRepository.findByTrackIdOrderByNameAsc(trackId).size() + 1)
                .build();
        group = groupRepository.save(group);
        return toResponse(group);
    }

    @Transactional(readOnly = true)
    public List<CompetitionGroupResponse> listGroups(UUID eventId, UUID trackId) {
        validateTrack(eventId, trackId);
        return groupRepository.findByTrackIdOrderByNameAsc(trackId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void deleteGroup(UUID eventId, UUID trackId, UUID groupId, String ipAddress) {
        validateTrack(eventId, trackId);
        eventService.enforceEventOwnership(eventId);

        CompetitionGroup group = groupRepository.findByIdAndTrackId(groupId, trackId)
                .orElseThrow(() -> new ResourceNotFoundException("CompetitionGroup", "id", groupId));

        deleteGroupInternal(group, ipAddress);
    }

    /**
     * After track assignment: BTC enters target teams/group (K). For each track with N teams,
     * create G = ceil(N/K) groups and assign teams so group sizes differ by at most 1.
     * Safe to re-run: clears previous groups first (and flushes) so unique (track, name) can be reused.
     */
    @Transactional
    public GenerateCompetitionGroupsResponse generateGroups(
            UUID eventId, GenerateCompetitionGroupsRequest request, String ipAddress) {
        if (eventRepository.findById(eventId).isEmpty()) {
            throw new ResourceNotFoundException("Event", "id", eventId);
        }
        eventService.enforceEventOwnership(eventId);

        int teamsPerGroup = request.getTeamsPerGroup();
        List<Team> confirmed = teamRepository.findByEventIdAndStatus(eventId, TeamStatus.CONFIRMED);
        long withoutTrack = confirmed.stream().filter(t -> t.getTrackId() == null).count();
        if (withoutTrack > 0) {
            throw new BusinessException(
                    withoutTrack + " confirmed team(s) still have no track. Finish track assignment first.",
                    HttpStatus.CONFLICT);
        }
        if (confirmed.isEmpty()) {
            throw new BusinessException("No confirmed teams to place into groups", HttpStatus.BAD_REQUEST);
        }

        List<Track> tracks = trackRepository.findByHackathonEventId(eventId);
        for (Track track : tracks) {
            List<CompetitionGroup> existing = groupRepository.findByTrackIdOrderByNameAsc(track.getId());
            for (CompetitionGroup group : existing) {
                deleteGroupInternal(group, ipAddress);
            }
        }
        // Flush the deletes before re-creating: otherwise Hibernate orders the new inserts
        // first and unique (track_id, name) blocks reusing group names on a re-run.
        teamRepository.flush();
        groupRepository.flush();

        List<GenerateCompetitionGroupsResponse.TrackGroupPlan> plans = new ArrayList<>();
        int totalGroups = 0;
        int totalAssigned = 0;

        for (Track track : tracks) {
            List<Team> trackTeams = new ArrayList<>(
                    confirmed.stream().filter(t -> track.getId().equals(t.getTrackId())).toList());
            if (trackTeams.isEmpty()) {
                continue;
            }

            Collections.shuffle(trackTeams);
            int n = trackTeams.size();
            int groupCount = Math.max(1, (int) Math.ceil((double) n / teamsPerGroup));
            int base = n / groupCount;
            int remain = n % groupCount;

            List<GenerateCompetitionGroupsResponse.GroupSize> groupSizes = new ArrayList<>();
            int cursor = 0;
            for (int i = 0; i < groupCount; i++) {
                int size = base + (i < remain ? 1 : 0);
                String name = track.getName().trim() + " G" + (i + 1);
                CompetitionGroup group = groupRepository.save(CompetitionGroup.builder()
                        .eventId(eventId)
                        .trackId(track.getId())
                        .name(name)
                        .maxTeams(Math.max(size, teamsPerGroup))
                        .sortOrder(i + 1)
                        .build());

                List<String> teamNames = new ArrayList<>();
                for (int j = 0; j < size; j++) {
                    Team team = trackTeams.get(cursor++);
                    team.setGroupId(group.getId());
                    teamNames.add(team.getName());
                }

                groupSizes.add(GenerateCompetitionGroupsResponse.GroupSize.builder()
                        .groupId(group.getId())
                        .name(name)
                        .teamCount(size)
                        .teamNames(teamNames)
                        .build());
            }
            teamRepository.saveAll(trackTeams);

            totalGroups += groupCount;
            totalAssigned += n;
            plans.add(GenerateCompetitionGroupsResponse.TrackGroupPlan.builder()
                    .trackId(track.getId())
                    .trackName(track.getName())
                    .teamCount(n)
                    .groupCount(groupCount)
                    .groups(groupSizes)
                    .build());
        }

        if (plans.isEmpty()) {
            throw new BusinessException("No tracks have assigned teams", HttpStatus.BAD_REQUEST);
        }

        return GenerateCompetitionGroupsResponse.builder()
                .teamsPerGroup(teamsPerGroup)
                .totalGroupsCreated(totalGroups)
                .totalTeamsAssigned(totalAssigned)
                .tracks(plans)
                .build();
    }

    @Transactional(readOnly = true)
    public CompetitionGroup getGroupInTrack(UUID trackId, UUID groupId) {
        return groupRepository.findByIdAndTrackId(groupId, trackId)
                .orElseThrow(() -> new ResourceNotFoundException("CompetitionGroup", "id", groupId));
    }

    private void deleteGroupInternal(CompetitionGroup group, String ipAddress) {
        judgeAssignmentService.deactivateAssignmentsForDeletedGroup(group.getId(), ipAddress);

        List<Team> affectedTeams = teamRepository.findByGroupId(group.getId());
        affectedTeams.forEach(team -> team.setGroupId(null));
        teamRepository.saveAll(affectedTeams);

        groupRepository.delete(group);
    }

    private void validateTrack(UUID eventId, UUID trackId) {
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new ResourceNotFoundException("Track", "id", trackId));
        if (!track.getHackathonEvent().getId().equals(eventId)) {
            throw new BusinessException("Track does not belong to this event", HttpStatus.BAD_REQUEST) {};
        }
    }

    private CompetitionGroupResponse toResponse(CompetitionGroup group) {
        return CompetitionGroupResponse.builder()
                .id(group.getId())
                .trackId(group.getTrackId())
                .name(group.getName())
                .build();
    }
}
