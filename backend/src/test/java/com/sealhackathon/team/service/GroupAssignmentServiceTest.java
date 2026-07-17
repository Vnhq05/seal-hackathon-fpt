package com.sealhackathon.team.service;

import com.sealhackathon.event.domain.CompetitionGroup;
import com.sealhackathon.event.repository.CompetitionGroupRepository;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.repository.TeamRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GroupAssignmentServiceTest {

    @Mock private TeamRepository teamRepository;
    @Mock private CompetitionGroupRepository competitionGroupRepository;

    @InjectMocks private GroupAssignmentService groupAssignmentService;

    private final UUID trackId = UUID.randomUUID();

    @Test
    void autoAssignGroup_shouldPickLeastLoadedGroup_whenCountsDiffer() {
        CompetitionGroup a = buildGroup("GA1");
        CompetitionGroup b = buildGroup("GA2");
        CompetitionGroup c = buildGroup("GA3");
        stubGroups(a, b, c);
        stubCounts(new Object[]{a.getId(), 3L}, new Object[]{b.getId(), 1L}, new Object[]{c.getId(), 2L});

        Team team = buildTeam();
        groupAssignmentService.autoAssignGroup(team);

        assertThat(team.getGroupId()).isEqualTo(b.getId());
    }

    @Test
    void autoAssignGroup_shouldTreatGroupMissingFromCounts_asEmpty() {
        // A GROUP BY returns no row for an empty group, so the emptiest group is the one absent
        // from the counts. Reading the counts instead of the group list would never pick it.
        CompetitionGroup a = buildGroup("GA1");
        CompetitionGroup b = buildGroup("GA2");
        stubGroups(a, b);
        stubCounts(new Object[]{a.getId(), 4L});

        Team team = buildTeam();
        groupAssignmentService.autoAssignGroup(team);

        assertThat(team.getGroupId()).isEqualTo(b.getId());
    }

    @Test
    void autoAssignGroup_shouldPickFirstByName_whenAllGroupsEmpty() {
        CompetitionGroup a = buildGroup("GA1");
        CompetitionGroup b = buildGroup("GA2");
        stubGroups(a, b);
        stubCounts();

        Team team = buildTeam();
        groupAssignmentService.autoAssignGroup(team);

        assertThat(team.getGroupId()).isEqualTo(a.getId());
    }

    @Test
    void autoAssignGroup_shouldPickFirstByName_whenTiedForLeast() {
        CompetitionGroup a = buildGroup("GA1");
        CompetitionGroup b = buildGroup("GA2");
        CompetitionGroup c = buildGroup("GA3");
        stubGroups(a, b, c);
        stubCounts(new Object[]{a.getId(), 2L}, new Object[]{b.getId(), 1L}, new Object[]{c.getId(), 1L});

        Team team = buildTeam();
        groupAssignmentService.autoAssignGroup(team);

        assertThat(team.getGroupId()).isEqualTo(b.getId());
    }

    @Test
    void autoAssignGroup_shouldCorrectSkew_whenManualAssignmentUnbalancedGroups() {
        CompetitionGroup a = buildGroup("GA1");
        CompetitionGroup b = buildGroup("GA2");
        stubGroups(a, b);
        stubCounts(new Object[]{a.getId(), 5L});

        Team team = buildTeam();
        groupAssignmentService.autoAssignGroup(team);

        assertThat(team.getGroupId()).isEqualTo(b.getId());
    }

    @Test
    void autoAssignGroup_shouldLeaveGroupNull_whenTrackHasNoGroups() {
        when(competitionGroupRepository.findByTrackIdOrderByNameAsc(trackId)).thenReturn(List.of());

        Team team = buildTeam();
        groupAssignmentService.autoAssignGroup(team);

        assertThat(team.getGroupId()).isNull();
        verify(teamRepository, never()).countByTrackIdGroupByGroup(any());
    }

    @Test
    void autoAssignGroup_shouldNotOverwrite_whenCoordinatorAlreadyAssignedGroup() {
        UUID manualGroupId = UUID.randomUUID();
        Team team = buildTeam();
        team.setGroupId(manualGroupId);

        groupAssignmentService.autoAssignGroup(team);

        assertThat(team.getGroupId()).isEqualTo(manualGroupId);
        verifyNoInteractions(competitionGroupRepository);
        verifyNoInteractions(teamRepository);
    }

    @Test
    void autoAssignGroup_shouldDoNothing_whenTeamHasNoTrack() {
        Team team = buildTeam();
        team.setTrackId(null);

        groupAssignmentService.autoAssignGroup(team);

        assertThat(team.getGroupId()).isNull();
        verifyNoInteractions(competitionGroupRepository);
        verifyNoInteractions(teamRepository);
    }

    private void stubGroups(CompetitionGroup... groups) {
        when(competitionGroupRepository.findByTrackIdOrderByNameAsc(trackId)).thenReturn(List.of(groups));
    }

    private void stubCounts(Object[]... rows) {
        when(teamRepository.countByTrackIdGroupByGroup(trackId)).thenReturn(List.of(rows));
    }

    private CompetitionGroup buildGroup(String name) {
        CompetitionGroup group = CompetitionGroup.builder().trackId(trackId).name(name).build();
        group.setId(UUID.randomUUID());
        return group;
    }

    private Team buildTeam() {
        Team team = Team.builder()
                .eventId(UUID.randomUUID())
                .name("Test Team")
                .leaderId(UUID.randomUUID())
                .status(TeamStatus.FORMING)
                .build();
        team.setId(UUID.randomUUID());
        team.setTrackId(trackId);
        return team;
    }
}
