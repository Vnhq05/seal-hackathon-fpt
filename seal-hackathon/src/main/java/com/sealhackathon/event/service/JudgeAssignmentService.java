package com.sealhackathon.event.service;

import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.JudgeAssignment;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.dto.request.AssignJudgeRequest;
import com.sealhackathon.event.dto.response.JudgeAssignmentResponse;
import com.sealhackathon.event.event.JudgeAssignedEvent;
import com.sealhackathon.event.repository.JudgeAssignmentRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JudgeAssignmentService {

    private final JudgeAssignmentRepository judgeAssignmentRepository;
    private final RoundService roundService;
    private final UserPublicService userPublicService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public JudgeAssignmentResponse assignJudge(UUID roundId, AssignJudgeRequest request) {
        Round round = roundService.getRound(roundId);

        UserSnapshot judge = userPublicService.findById(request.getJudgeUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getJudgeUserId()));

        if (judge.getUserType() != UserType.JUDGE) {
            throw new BusinessException(
                    "User " + judge.getEmail() + " is not a JUDGE. Role: " + judge.getUserType(),
                    HttpStatus.BAD_REQUEST) {};
        }

        if (judgeAssignmentRepository.existsByRoundIdAndJudgeUserId(roundId, request.getJudgeUserId())) {
            throw new DuplicateResourceException("JudgeAssignment", "judge+round",
                    judge.getEmail() + " in round " + round.getName());
        }

        JudgeAssignment assignment = JudgeAssignment.builder()
                .round(round)
                .judgeUserId(request.getJudgeUserId())
                .assignedAt(LocalDateTime.now())
                .build();

        assignment = judgeAssignmentRepository.save(assignment);

        eventPublisher.publishEvent(new JudgeAssignedEvent(
                assignment.getId(), request.getJudgeUserId(),
                roundId, round.getHackathonEvent().getId()));

        return toResponse(assignment, judge);
    }

    @Transactional(readOnly = true)
    public List<JudgeAssignmentResponse> getJudgesByRound(UUID roundId) {
        roundService.getRound(roundId);
        return judgeAssignmentRepository.findByRoundId(roundId).stream()
                .map(a -> {
                    UserSnapshot judge = userPublicService.findById(a.getJudgeUserId()).orElse(null);
                    return toResponse(a, judge);
                })
                .toList();
    }

    @Transactional
    public void removeJudgeAssignment(UUID assignmentId) {
        JudgeAssignment assignment = judgeAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("JudgeAssignment", "id", assignmentId));
        judgeAssignmentRepository.delete(assignment);
    }

    private JudgeAssignmentResponse toResponse(JudgeAssignment a, UserSnapshot judge) {
        return JudgeAssignmentResponse.builder()
                .id(a.getId())
                .roundId(a.getRound().getId())
                .judgeUserId(a.getJudgeUserId())
                .judgeFullName(judge != null ? judge.getFullName() : null)
                .judgeEmail(judge != null ? judge.getEmail() : null)
                .assignedAt(a.getAssignedAt())
                .build();
    }
}
