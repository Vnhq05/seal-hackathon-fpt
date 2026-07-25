package com.sealhackathon.team.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.event.service.FormatRuleEngine;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.domain.enums.TrackAssignmentMethod;
import com.sealhackathon.team.dto.response.TrackAssignmentResponse;
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
import org.springframework.http.HttpStatus;

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
class TrackAssignmentServiceTest {

    @Mock private TeamRepository teamRepository;
    @Mock private TrackRepository trackRepository;
    @Mock private HackathonEventRepository eventRepository;
    @Mock private FormatRuleEngine formatRuleEngine;
    @Mock private GroupAssignmentService groupAssignmentService;

    @InjectMocks private TrackAssignmentService trackAssignmentService;

    private final UUID eventId = UUID.randomUUID();
    private final UUID assignedBy = UUID.randomUUID();
    private final UUID teamId = UUID.randomUUID();
    private final UUID trackId = UUID.randomUUID();

    @Test
    void assignOneInternal_shouldThrowConflict_whenNonManualAndTeamAlreadyHasTrack() {
        Team team = buildTeam();
        team.setTrackId(UUID.randomUUID());
        stubHappyPath(team);

        assertThatThrownBy(() -> trackAssignmentService.assignOneInternal(
                eventId, assignedBy, teamId, trackId, TrackAssignmentMethod.RANDOM))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Team already has a track assigned")
                .extracting(e -> ((BusinessException) e).getHttpStatus())
                .isEqualTo(HttpStatus.CONFLICT);

        verify(teamRepository, never()).save(any());
        verifyNoInteractions(groupAssignmentService);
    }

    @Test
    void assignOneInternal_shouldReassignTrack_whenManualAndTeamAlreadyHasDifferentTrack() {
        Team team = buildTeam();
        team.setTrackId(UUID.randomUUID());
        team.setGroupId(UUID.randomUUID());
        stubHappyPath(team);

        trackAssignmentService.assignOneInternal(
                eventId, assignedBy, teamId, trackId, TrackAssignmentMethod.MANUAL);

        ArgumentCaptor<Team> captor = ArgumentCaptor.forClass(Team.class);
        verify(teamRepository).save(captor.capture());
        Team saved = captor.getValue();
        assertThat(saved.getTrackId()).isEqualTo(trackId);
        assertThat(saved.getGroupId()).isNull();
        assertThat(saved.getTrackAssignmentMethod()).isEqualTo(TrackAssignmentMethod.MANUAL);
        verify(groupAssignmentService).autoAssignGroup(team);
    }

    @Test
    void assignOneInternal_shouldNoOp_whenManualAndSameTrackAlreadyAssigned() {
        Team team = buildTeam();
        team.setTrackId(trackId);
        team.setTrackAssignmentMethod(TrackAssignmentMethod.RANDOM);
        stubHappyPath(team);

        TrackAssignmentResponse response = trackAssignmentService.assignOneInternal(
                eventId, assignedBy, teamId, trackId, TrackAssignmentMethod.MANUAL);

        assertThat(response.getTrackId()).isEqualTo(trackId);
        assertThat(response.getMethod()).isEqualTo(TrackAssignmentMethod.RANDOM);
        verify(teamRepository, never()).save(any());
        verifyNoInteractions(groupAssignmentService);
    }

    @Test
    void assignOneInternal_shouldSetTrackAndAutoAssignGroup_whenTeamHasNoTrack() {
        Team team = buildTeam();
        stubHappyPath(team);

        trackAssignmentService.assignOneInternal(eventId, assignedBy, teamId, trackId, TrackAssignmentMethod.RANDOM);

        ArgumentCaptor<Team> captor = ArgumentCaptor.forClass(Team.class);
        verify(teamRepository).save(captor.capture());
        Team saved = captor.getValue();
        assertThat(saved.getTrackId()).isEqualTo(trackId);
        assertThat(saved.getTrackAssignmentMethod()).isEqualTo(TrackAssignmentMethod.RANDOM);
        assertThat(saved.getTrackAssignedBy()).isEqualTo(assignedBy);
        assertThat(saved.getTrackAssignedAt()).isNotNull();
        verify(groupAssignmentService).autoAssignGroup(team);
    }

    @Test
    void assignOneInternal_shouldAssignGroupBeforeSaving() {
        Team team = buildTeam();
        stubHappyPath(team);

        trackAssignmentService.assignOneInternal(eventId, assignedBy, teamId, trackId, TrackAssignmentMethod.MANUAL);

        InOrder inOrder = inOrder(groupAssignmentService, teamRepository);
        inOrder.verify(groupAssignmentService).autoAssignGroup(team);
        inOrder.verify(teamRepository).save(team);
    }

    private void stubHappyPath(Team team) {
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));

        HackathonEvent event = HackathonEvent.builder().build();
        event.setId(eventId);
        Track track = Track.builder().hackathonEvent(event).name("AI").maxTeams(20).build();
        track.setId(trackId);
        when(trackRepository.findById(trackId)).thenReturn(Optional.of(track));
    }

    private Team buildTeam() {
        Team team = Team.builder()
                .eventId(eventId)
                .name("Test Team")
                .leaderId(UUID.randomUUID())
                .status(TeamStatus.FORMING)
                .build();
        team.setId(teamId);
        return team;
    }
}
