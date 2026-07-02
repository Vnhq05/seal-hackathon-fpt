package com.sealhackathon.team.service;

import com.sealhackathon.common.dto.SystemConfigResponse;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.service.SystemConfigService;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.event.service.FormatRuleEngine;
import com.sealhackathon.ranking.service.RankingService;
import com.sealhackathon.team.domain.EventEnrollment;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.enums.EnrollmentStatus;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.repository.EventEnrollmentRepository;
import com.sealhackathon.team.repository.InvitationRepository;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventEnrollmentMatchingServiceTest {

    @Mock private EventEnrollmentRepository enrollmentRepository;
    @Mock private EventPublicService eventPublicService;
    @Mock private TeamMemberRepository teamMemberRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private InvitationRepository invitationRepository;
    @Mock private RankingService rankingService;
    @Mock private FormatRuleEngine formatRuleEngine;
    @Mock private SystemConfigService systemConfigService;
    @Mock private UserPublicService userPublicService;

    @InjectMocks private EventEnrollmentService enrollmentService;

    @Test
    void getPublicMatchingProfile_shouldThrow403_whenProfileNotPublic() {
        UUID eventId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        UUID leaderId = UUID.randomUUID();
        UUID targetUserId = UUID.randomUUID();

        stubLeaderTeam(eventId, teamId, leaderId);

        EventEnrollment enrollment = EventEnrollment.builder()
                .userId(targetUserId)
                .eventId(eventId)
                .status(EnrollmentStatus.APPROVED)
                .isLookingForTeam(true)
                .isProfilePublic(false)
                .build();

        when(enrollmentRepository.findByUserIdAndEventId(targetUserId, eventId))
                .thenReturn(Optional.of(enrollment));
        when(teamMemberRepository.existsByUserIdAndEventId(targetUserId, eventId)).thenReturn(false);

        assertThatThrownBy(() -> enrollmentService.getPublicMatchingProfile(
                targetUserId, leaderId, eventId, teamId))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not public");
    }

    @Test
    void getFindingMembersCandidates_shouldExcludeLeaderAndMapFlags() {
        UUID eventId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        UUID leaderId = UUID.randomUUID();
        UUID candidateId = UUID.randomUUID();

        stubLeaderTeam(eventId, teamId, leaderId);

        EventEnrollment enrollment = EventEnrollment.builder()
                .userId(candidateId)
                .eventId(eventId)
                .status(EnrollmentStatus.APPROVED)
                .isLookingForTeam(true)
                .isProfilePublic(true)
                .preferredRole("Backend developer")
                .build();

        when(enrollmentRepository.findFindingMembersCandidates(eventId, leaderId))
                .thenReturn(List.of(enrollment));
        when(invitationRepository.findByTeamIdAndStatus(any(), any())).thenReturn(List.of());
        when(userPublicService.findById(candidateId)).thenReturn(Optional.of(UserSnapshot.builder()
                .id(candidateId)
                .fullName("Candidate User")
                .email("candidate@fpt.edu.vn")
                .universityName("FPT University")
                .semester(5)
                .build()));

        var candidates = enrollmentService.getFindingMembersCandidates(leaderId, eventId, teamId);

        assertThat(candidates).hasSize(1);
        assertThat(candidates.get(0).getUserId()).isEqualTo(candidateId);
        assertThat(candidates.get(0).isProfilePublic()).isTrue();
        assertThat(candidates.get(0).getPreferredRole()).isEqualTo("Backend developer");
    }

    private void stubLeaderTeam(UUID eventId, UUID teamId, UUID leaderId) {
        Team team = Team.builder()
                .eventId(eventId)
                .leaderId(leaderId)
                .name("Team A")
                .status(TeamStatus.FORMING)
                .build();
        team.setId(teamId);

        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        doNothing().when(formatRuleEngine).assertCanModifyTeamMembers(eventId);
        when(eventPublicService.getRegistrationDeadline(eventId)).thenReturn(null);
        when(teamMemberRepository.countByTeamId(teamId)).thenReturn(2);
        when(systemConfigService.getConfig()).thenReturn(SystemConfigResponse.builder()
                .maxTeamMembers(5)
                .minTeamMembers(3)
                .build());
    }
}
