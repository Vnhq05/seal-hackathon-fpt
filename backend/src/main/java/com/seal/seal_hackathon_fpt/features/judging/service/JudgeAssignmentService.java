package com.seal.seal_hackathon_fpt.features.judging.service;

import com.seal.seal_hackathon_fpt.features.judging.dto.CreateJudgeAssignmentRequest;
import com.seal.seal_hackathon_fpt.features.judging.entity.JudgeAssignment;
import com.seal.seal_hackathon_fpt.features.judging.repository.JudgeAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JudgeAssignmentService {

    private final JudgeAssignmentRepository assignmentRepository;

    public JudgeAssignment createAssignment(
            CreateJudgeAssignmentRequest request
    ) {

        // [SỬA ĐỔI - Tính năng: Mentor không được chấm team mình]
        // Đã thêm: Block giả lập logic check mentor.
        // Khi bạn có Team và Judge entity đầy đủ, hãy mở comment này ra.
        /*
        Team team = teamRepository.findById(request.getTeamId()).orElseThrow();
        Judge judge = judgeRepository.findById(request.getJudgeId()).orElseThrow();
        if (team.getMentorId() != null && team.getMentorId().equals(judge.getUserId())) {
            throw new RuntimeException("Mentor không được chấm team mình mentor");
        }
        */

        boolean exists = assignmentRepository
                .findByJudgeIdAndRoundIdAndTeamId(
                        request.getJudgeId(),
                        request.getRoundId(),
                        request.getTeamId()
                )
                .isPresent();

        if (exists) {
            throw new RuntimeException(
                    "Assignment already exists"
            );
        }

        JudgeAssignment assignment =
                JudgeAssignment.builder()
                        .judgeId(request.getJudgeId())
                        .competitionId(request.getCompetitionId())
                        .roundId(request.getRoundId())
                        .teamId(request.getTeamId())
                        .assignedAt(LocalDateTime.now())
                        .build();

        return assignmentRepository.save(assignment);
    }

    // [SỬA ĐỔI - Tính năng: Lấy danh sách Assignments]
    // Đã thêm: Hàm getAllAssignments
    public List<JudgeAssignment> getAllAssignments() {
        return assignmentRepository.findAll();
    }
}