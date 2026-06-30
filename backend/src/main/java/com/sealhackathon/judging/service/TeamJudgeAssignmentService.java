package com.sealhackathon.judging.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.service.EventJudgeService;
import com.sealhackathon.event.service.JudgeAssignmentService;
import com.sealhackathon.judging.domain.TeamJudgeAssignment;
import com.sealhackathon.judging.dto.request.AssignJudgeToTeamRequest;
import com.sealhackathon.judging.dto.response.TeamJudgeAssignmentResponse;
import com.sealhackathon.judging.repository.JudgeScoreRepository;
import com.sealhackathon.judging.repository.TeamJudgeAssignmentRepository;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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
    private final JudgeScoreRepository judgeScoreRepository;
    private final EventJudgeService eventJudgeService;
    private final JudgeAssignmentService judgeAssignmentService;
    private final TeamRepository teamRepository;
    private final ConflictDetectionService conflictDetectionService;
    private final UserPublicService userPublicService;

    @Value("${app.hackathon.judging.max-judges-per-team:3}")
    private int maxJudgesPerTeam;

    @Transactional
    public TeamJudgeAssignmentResponse assignJudgeToTeam(
            UUID eventId, UUID roundId, UUID teamId, AssignJudgeToTeamRequest request) {
        validateJudgeCandidate(eventId, roundId, teamId, request.getJudgeUserId());

        if (assignmentRepository.existsByTeamIdAndRoundIdAndJudgeUserId(teamId, roundId, request.getJudgeUserId())) {
            throw new DuplicateResourceException("TeamJudgeAssignment", "judge", request.getJudgeUserId().toString());
        }

        long currentCount = assignmentRepository.countByTeamIdAndRoundId(teamId, roundId);
        if (currentCount >= maxJudgesPerTeam) {
            throw new BusinessException(
                    "Each team can have at most " + maxJudgesPerTeam + " judges per round",
                    HttpStatus.BAD_REQUEST) {};
        }

        return createAssignment(roundId, teamId, request.getJudgeUserId());
    }

    @Transactional
    TeamJudgeAssignmentResponse createAssignment(UUID roundId, UUID teamId, UUID judgeUserId) {
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

        boolean hasScores = judgeScoreRepository.existsByJudgeUserIdAndRoundIdAndTeamId(
                assignment.getJudgeUserId(), assignment.getRoundId(), assignment.getTeamId());
        if (hasScores) {
            throw new BusinessException(
                    "Cannot remove assignment: judge has already submitted scores",
                    HttpStatus.BAD_REQUEST) {};
        }

        assignmentRepository.delete(assignment);
    }

    void validateJudgeCandidate(UUID eventId, UUID roundId, UUID teamId, UUID judgeUserId) {
        if (!eventJudgeService.isEventJudge(eventId, judgeUserId)) {
            throw new BusinessException(
                    "Judge must be assigned to the event with role JUDGE or BOTH",
                    HttpStatus.BAD_REQUEST) {};
        }

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));

        if (!judgeAssignmentService.isJudgeAssignedToRoundScope(roundId, judgeUserId, team.getTrackId())) {
            throw new BusinessException(
                    "Judge is not assigned to this round and track",
                    HttpStatus.BAD_REQUEST) {};
        }

        conflictDetectionService.assertNotMentorOfTeam(judgeUserId, teamId);
    }

    TeamJudgeAssignmentResponse toResponse(TeamJudgeAssignment assignment) {
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
