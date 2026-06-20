package com.sealhackathon.judging.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.judging.event.ConflictDetectedEvent;
import com.sealhackathon.submission.dto.snapshot.SubmissionSnapshot;
import com.sealhackathon.submission.service.SubmissionPublicService;
import com.sealhackathon.team.service.TeamPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConflictDetectionService {

    private final TeamPublicService teamPublicService;
    private final SubmissionPublicService submissionPublicService;
    private final ApplicationEventPublisher eventPublisher;

    public void checkConflict(UUID judgeId, UUID submissionId) {
        SubmissionSnapshot submission = submissionPublicService.getSubmission(submissionId)
                .orElseThrow(() -> new BusinessException("Submission not found",
                        HttpStatus.NOT_FOUND) {});

        UUID teamId = submission.getTeamId();

        if (teamPublicService.isMentorOfTeam(judgeId, teamId)) {
            eventPublisher.publishEvent(new ConflictDetectedEvent(judgeId, teamId, submissionId));

            throw new BusinessException(
                    "Conflict of interest: you are a mentor of this team and cannot score their submission",
                    HttpStatus.FORBIDDEN) {};
        }
    }
}
