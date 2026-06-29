package com.sealhackathon.judging.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.judging.domain.TeamJudgeAssignment;
import com.sealhackathon.judging.repository.TeamJudgeAssignmentRepository;
import com.sealhackathon.submission.dto.snapshot.SubmissionSnapshot;
import com.sealhackathon.submission.service.SubmissionPublicService;
import com.sealhackathon.team.service.TeamPublicService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConflictDetectionServiceTest {

    @Mock private TeamPublicService teamPublicService;
    @Mock private SubmissionPublicService submissionPublicService;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private TeamJudgeAssignmentRepository teamJudgeAssignmentRepository;

    @InjectMocks private ConflictDetectionService conflictDetectionService;

    @Test
    void shouldThrow_whenJudgeIsMentorOfTeam() {
        UUID judgeId = UUID.randomUUID();
        UUID submissionId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();

        when(submissionPublicService.getSubmission(submissionId))
                .thenReturn(Optional.of(SubmissionSnapshot.builder()
                        .id(submissionId).teamId(teamId).build()));
        when(teamPublicService.isMentorOfTeam(judgeId, teamId)).thenReturn(true);

        assertThatThrownBy(() -> conflictDetectionService.checkConflict(judgeId, submissionId))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Conflict of interest");

        verify(eventPublisher).publishEvent(any(Object.class));
    }

    @Test
    void shouldPass_whenNoConflict() {
        UUID judgeId = UUID.randomUUID();
        UUID submissionId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();

        when(submissionPublicService.getSubmission(submissionId))
                .thenReturn(Optional.of(SubmissionSnapshot.builder()
                        .id(submissionId).teamId(teamId).build()));
        when(teamPublicService.isMentorOfTeam(judgeId, teamId)).thenReturn(false);

        assertThatNoException().isThrownBy(
                () -> conflictDetectionService.checkConflict(judgeId, submissionId));
    }

    @Test
    void assertNotJudgeOfTeam_shouldThrow_whenUserIsTeamJudge() {
        UUID userId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        when(teamJudgeAssignmentRepository.findByJudgeUserId(userId))
                .thenReturn(List.of(TeamJudgeAssignment.builder().teamId(teamId).build()));

        assertThatThrownBy(() -> conflictDetectionService.assertNotJudgeOfTeam(userId, teamId))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("assigned as a judge");
    }

    @Test
    void hasConflict_shouldBeTrue_whenMentorOrJudge() {
        UUID userId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        when(teamPublicService.isMentorOfTeam(userId, teamId)).thenReturn(true);

        assertThat(conflictDetectionService.hasConflict(userId, teamId)).isTrue();
    }
}
