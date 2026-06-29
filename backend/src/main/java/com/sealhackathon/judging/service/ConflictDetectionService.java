package com.sealhackathon.judging.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.judging.event.ConflictDetectedEvent;
import com.sealhackathon.judging.repository.TeamJudgeAssignmentRepository;
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
    private final TeamJudgeAssignmentRepository teamJudgeAssignmentRepository;

    public void checkConflict(UUID judgeId, UUID submissionId) {
        SubmissionSnapshot submission = submissionPublicService.getSubmission(submissionId)
                .orElseThrow(() -> new BusinessException("Submission not found",
                        HttpStatus.NOT_FOUND) {});

        UUID teamId = submission.getTeamId();
        assertNotMentorOfTeamForScoring(judgeId, teamId, submissionId);
    }

    public void assertNotMentorOfTeam(UUID userId, UUID teamId) {
        if (teamPublicService.isMentorOfTeam(userId, teamId)) {
            throw new BusinessException(
                    "Cannot assign judge who is the mentor of this team (conflict of interest)",
                    HttpStatus.CONFLICT) {};
        }
    }

    public void assertNotMentorOfTeamForScoring(UUID judgeId, UUID teamId, UUID submissionId) {
        if (teamPublicService.isMentorOfTeam(judgeId, teamId)) {
            eventPublisher.publishEvent(new ConflictDetectedEvent(judgeId, teamId, submissionId));
            throw new BusinessException(
                    "Conflict of interest: you are a mentor of this team and cannot score their submission",
                    HttpStatus.FORBIDDEN) {};
        }
    }

    public void assertNotJudgeOfTeam(UUID userId, UUID teamId) {
        if (isJudgeOfTeam(userId, teamId)) {
            throw new BusinessException(
                    "Conflict of interest: this user is assigned as a judge for this team",
                    HttpStatus.CONFLICT) {};
        }
    }

    public boolean hasConflict(UUID userId, UUID teamId) {
        return teamPublicService.isMentorOfTeam(userId, teamId) || isJudgeOfTeam(userId, teamId);
    }

    public boolean isJudgeOfTeam(UUID userId, UUID teamId) {
        return teamJudgeAssignmentRepository.findByJudgeUserId(userId).stream()
                .anyMatch(a -> a.getTeamId().equals(teamId));
    }
}
