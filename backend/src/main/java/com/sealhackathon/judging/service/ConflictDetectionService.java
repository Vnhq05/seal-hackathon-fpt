package com.sealhackathon.judging.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.judging.event.ConflictDetectedEvent;
import com.sealhackathon.submission.dto.snapshot.SubmissionSnapshot;
import com.sealhackathon.submission.service.SubmissionPublicService;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.team.service.TeamPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConflictDetectionService {

    public static final String REASON_MENTOR_OF_TEAM = "MENTOR_OF_TEAM";
    public static final String REASON_COORDINATOR_MARKED = "COORDINATOR_MARKED_CONFLICT";

    private final TeamPublicService teamPublicService;
    private final SubmissionPublicService submissionPublicService;
    private final ApplicationEventPublisher eventPublisher;
    private final TeamRepository teamRepository;

    public void checkConflict(UUID judgeId, UUID submissionId) {
        SubmissionSnapshot submission = submissionPublicService.getSubmission(submissionId)
                .orElseThrow(() -> new BusinessException("Submission not found",
                        HttpStatus.NOT_FOUND) {});

        UUID teamId = submission.getTeamId();
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("Team not found", HttpStatus.NOT_FOUND) {});

        String reason = resolveConflictReason(judgeId, team);
        if (reason != null) {
            eventPublisher.publishEvent(new ConflictDetectedEvent(judgeId, teamId, submissionId));
            throw conflictException(reason);
        }
    }

    public String resolveConflictReason(UUID judgeId, Team team) {
        if (teamPublicService.isMentorOfTeam(judgeId, team.getId())) {
            return REASON_MENTOR_OF_TEAM;
        }
        return null;
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

    private BusinessException conflictException(String reason) {
        String message = switch (reason) {
            case REASON_MENTOR_OF_TEAM ->
                    "Conflict of interest: you are a mentor of this team and cannot score their submission";
            case REASON_COORDINATOR_MARKED ->
                    "Conflict of interest: scoring has been blocked by the coordinator";
            default -> "Conflict of interest: you cannot score this submission";
        };
        return new BusinessException(message, HttpStatus.FORBIDDEN) {};
    }
}
