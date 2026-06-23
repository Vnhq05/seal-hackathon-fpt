package com.sealhackathon.judging.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.judging.domain.TeamJudgeAssignment;
import com.sealhackathon.judging.dto.request.AssignJudgeToTeamRequest;
import com.sealhackathon.judging.dto.response.TeamJudgeAssignmentResponse;
import com.sealhackathon.judging.repository.TeamJudgeAssignmentRepository;
import com.sealhackathon.team.service.TeamPublicService;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TeamJudgeAssignmentService {

    private final TeamJudgeAssignmentRepository assignmentRepository;
    private final EventPublicService eventPublicService;
    private final TeamPublicService teamPublicService;
    private final UserPublicService userPublicService;

    @Transactional
    public TeamJudgeAssignmentResponse assignJudgeToTeam(UUID roundId, UUID teamId, AssignJudgeToTeamRequest request) {
        UUID judgeUserId = request.getJudgeUserId();

        if (!eventPublicService.isJudgeAssignedToRound(judgeUserId, roundId)) {
            throw new BusinessException("Judge is not assigned to this round", HttpStatus.BAD_REQUEST) {};
        }

        if (teamPublicService.isMentorOfTeam(judgeUserId, teamId)) {
            throw new BusinessException(
                    "Cannot assign judge who is the mentor of this team (conflict of interest)",
                    HttpStatus.CONFLICT) {};
        }

        if (assignmentRepository.existsByTeamIdAndRoundIdAndJudgeUserId(teamId, roundId, judgeUserId)) {
            throw new DuplicateResourceException("TeamJudgeAssignment", "judge", judgeUserId.toString());
        }

        long currentCount = assignmentRepository.countByTeamIdAndRoundId(teamId, roundId);
        if (currentCount >= 3) {
            throw new BusinessException("Each team can have at most 3 judges per round", HttpStatus.BAD_REQUEST) {};
        }

        TeamJudgeAssignment assignment = TeamJudgeAssignment.builder()
                .teamId(teamId)
                .roundId(roundId)
                .judgeUserId(judgeUserId)
                .assignedAt(LocalDateTime.now())
                .build();

        return toResponse(assignmentRepository.save(assignment));
    }

    @Transactional(readOnly = true)
    public List<TeamJudgeAssignmentResponse> getAssignmentsForTeam(UUID roundId, UUID teamId) {
        return assignmentRepository.findByTeamIdAndRoundId(teamId, roundId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TeamJudgeAssignmentResponse> getAssignmentsByRound(UUID roundId) {
        return assignmentRepository.findByRoundId(roundId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void removeAssignment(UUID assignmentId) {
        TeamJudgeAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("TeamJudgeAssignment", "id", assignmentId));
        assignmentRepository.delete(assignment);
    }

    private TeamJudgeAssignmentResponse toResponse(TeamJudgeAssignment assignment) {
        String judgeName = userPublicService.findById(assignment.getJudgeUserId())
                .map(u -> u.getFullName())
                .orElse("Unknown");

        return TeamJudgeAssignmentResponse.builder()
                .id(assignment.getId())
                .teamId(assignment.getTeamId())
                .roundId(assignment.getRoundId())
                .judgeUserId(assignment.getJudgeUserId())
                .judgeFullName(judgeName)
                .assignedAt(assignment.getAssignedAt())
                .build();
    }
}
