package com.sealhackathon.event.service;

import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.CompetitionGroup;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.repository.CompetitionGroupRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.repository.TeamRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CompetitionGroupServiceTest {

    @Mock private CompetitionGroupRepository groupRepository;
    @Mock private TrackRepository trackRepository;
    @Mock private EventService eventService;
    @Mock private TeamRepository teamRepository;
    @Mock private JudgeAssignmentService judgeAssignmentService;

    @InjectMocks private CompetitionGroupService competitionGroupService;

    private static final String IP = "127.0.0.1";
    private final UUID eventId = UUID.randomUUID();
    private final UUID trackId = UUID.randomUUID();
    private final UUID groupId = UUID.randomUUID();

    @Test
    void deleteGroup_shouldClearTeamGroupIds_beforeDeletingGroup() {
        stubTrack();
        CompetitionGroup group = buildGroup();
        when(groupRepository.findByIdAndTrackId(groupId, trackId)).thenReturn(Optional.of(group));

        Team first = buildTeam(groupId);
        Team second = buildTeam(groupId);
        when(teamRepository.findByGroupId(groupId)).thenReturn(List.of(first, second));

        competitionGroupService.deleteGroup(eventId, trackId, groupId, IP);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Team>> captor = ArgumentCaptor.forClass(List.class);
        verify(teamRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).allSatisfy(team -> assertThat(team.getGroupId()).isNull());

        InOrder inOrder = inOrder(teamRepository, groupRepository);
        inOrder.verify(teamRepository).saveAll(any());
        inOrder.verify(groupRepository).delete(group);
    }

    @Test
    void deleteGroup_shouldDeactivateJudgeAssignments_beforeDeletingGroup() {
        stubTrack();
        CompetitionGroup group = buildGroup();
        when(groupRepository.findByIdAndTrackId(groupId, trackId)).thenReturn(Optional.of(group));
        when(teamRepository.findByGroupId(groupId)).thenReturn(List.of());

        competitionGroupService.deleteGroup(eventId, trackId, groupId, IP);

        InOrder inOrder = inOrder(judgeAssignmentService, groupRepository);
        inOrder.verify(judgeAssignmentService).deactivateAssignmentsForDeletedGroup(groupId, IP);
        inOrder.verify(groupRepository).delete(group);
    }

    @Test
    void deleteGroup_shouldDeleteGroup_whenNoTeamsAssigned() {
        stubTrack();
        CompetitionGroup group = buildGroup();
        when(groupRepository.findByIdAndTrackId(groupId, trackId)).thenReturn(Optional.of(group));
        when(teamRepository.findByGroupId(groupId)).thenReturn(List.of());

        competitionGroupService.deleteGroup(eventId, trackId, groupId, IP);

        verify(groupRepository).delete(group);
    }

    @Test
    void deleteGroup_shouldThrowNotFound_whenGroupNotInTrack() {
        stubTrack();
        when(groupRepository.findByIdAndTrackId(groupId, trackId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> competitionGroupService.deleteGroup(eventId, trackId, groupId, IP))
                .isInstanceOf(ResourceNotFoundException.class);

        verifyNoInteractions(teamRepository);
        verifyNoInteractions(judgeAssignmentService);
        verify(groupRepository, never()).delete(any());
    }

    private void stubTrack() {
        HackathonEvent event = HackathonEvent.builder().build();
        event.setId(eventId);
        Track track = Track.builder().hackathonEvent(event).name("AI").maxTeams(20).build();
        track.setId(trackId);
        when(trackRepository.findById(trackId)).thenReturn(Optional.of(track));
    }

    private CompetitionGroup buildGroup() {
        CompetitionGroup group = CompetitionGroup.builder().trackId(trackId).name("GA1").build();
        group.setId(groupId);
        return group;
    }

    private Team buildTeam(UUID groupId) {
        Team team = Team.builder()
                .eventId(eventId)
                .name("Test Team " + UUID.randomUUID())
                .leaderId(UUID.randomUUID())
                .status(TeamStatus.FORMING)
                .build();
        team.setId(UUID.randomUUID());
        team.setTrackId(trackId);
        team.setGroupId(groupId);
        return team;
    }
}
