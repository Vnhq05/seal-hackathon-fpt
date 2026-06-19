package com.sealhackathon.judging.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.submission.dto.snapshot.SubmissionSnapshot;
import com.sealhackathon.submission.service.SubmissionPublicService;
import com.sealhackathon.team.service.TeamPublicService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConflictDetectionServiceTest {

    @Mock private TeamPublicService teamPublicService;
    @Mock private SubmissionPublicService submissionPublicService;
    @Mock private ApplicationEventPublisher eventPublisher;

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

        verify(eventPublisher).publishEvent(org.mockito.ArgumentMatchers.any());
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
}
