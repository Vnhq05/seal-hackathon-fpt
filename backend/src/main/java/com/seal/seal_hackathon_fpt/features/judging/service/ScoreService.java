package com.seal.seal_hackathon_fpt.features.judging.service;

import com.seal.seal_hackathon_fpt.audit.service.AuditService;
import com.seal.seal_hackathon_fpt.features.judging.dto.CreateScoreRequest;
import com.seal.seal_hackathon_fpt.features.judging.entity.Score;
import com.seal.seal_hackathon_fpt.features.judging.repository.JudgeAssignmentRepository;
import com.seal.seal_hackathon_fpt.features.judging.repository.ScoreRepository;
import com.seal.seal_hackathon_fpt.features.judging.entity.ScoreOverride;
import com.seal.seal_hackathon_fpt.features.judging.repository.ScoreOverrideRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScoreService {

    private final ScoreRepository scoreRepository;
    private final JudgeAssignmentRepository assignmentRepository;

    // [SỬA ĐỔI - Tính năng: Ghi đè điểm (Override Score)]
    // Đã sửa: Mở comment và inject ScoreOverrideRepository để Spring Boot có thể sử dụng
    private final ScoreOverrideRepository overrideRepository;

    // [SỬA ĐỔI - Tính năng: Audit Log]
    // Đã thêm: Inject AuditService để ghi log
    private final AuditService auditService;

    public Score createScore(CreateScoreRequest request) {

        boolean assigned = assignmentRepository
                .findByJudgeIdAndRoundIdAndTeamId(
                        request.getJudgeId(),
                        request.getRoundId(),
                        request.getTeamId()
                )
                .isPresent();

        if (!assigned) {
            throw new RuntimeException("Judge not assigned");
        }

        boolean duplicate = scoreRepository
                .findByJudgeIdAndTeamIdAndRoundIdAndCriterionId(
                        request.getJudgeId(),
                        request.getTeamId(),
                        request.getRoundId(),
                        request.getCriterionId()
                )
                .isPresent();

        if (duplicate) {
            throw new RuntimeException("Duplicate score");
        }

        // [SỬA ĐỔI - Tính năng: Validate Business Rule]
        // Đã thêm: Logic kiểm tra score từ 0 -> max_score (Tạm hardcode max_score là 10.00)
        BigDecimal maxScore = new BigDecimal("10.00");
        if (request.getScore().compareTo(BigDecimal.ZERO) < 0 || request.getScore().compareTo(maxScore) > 0) {
            throw new RuntimeException("Score must be between 0 and max_score");
        }

        Score score = Score.builder()
                .judgeId(request.getJudgeId())
                .teamId(request.getTeamId())
                .roundId(request.getRoundId())
                .criterionId(request.getCriterionId())
                .score(request.getScore())
                .comment(request.getComment())
                .status("PENDING_REVIEW")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // [SỬA ĐỔI - Tính năng: Audit Log]
        // Đã sửa: Gán lại biến score để lấy ID sau khi save
        score = scoreRepository.save(score);

        // [SỬA ĐỔI - Tính năng: Audit Log]
        // Đã thêm: Gọi hàm log sau khi tạo điểm thành công
        auditService.log(
                request.getJudgeId(),
                "Judge " + request.getJudgeId(),
                "CREATE_SCORE",
                "Score",
                score.getId().toString()
        );

        return score;
    }


    // [THÊM MỚI - Tính năng: Ghi đè điểm (Override Score)]
    // Đã sửa: Nhận thêm judgeId và judgeName từ Controller truyền xuống thay vì hardcode Admin
    public ScoreOverride overrideScore(Long teamId, Long roundId, BigDecimal newScore, String reason, Long judgeId, String judgeName) {

        // Kiểm tra xem đã có override chưa
        ScoreOverride override = overrideRepository.findByTeamIdAndRoundId(teamId, roundId)
                .orElse(new ScoreOverride());

        override.setTeamId(teamId);
        override.setRoundId(roundId);
        override.setOverrideScore(newScore);
        override.setReason(reason);
        override.setCreatedAt(LocalDateTime.now());

        // Đã sửa: Gán đúng thông tin người thực hiện hành động
        override.setCreatedBy(judgeId);
        override.setCreatedByName(judgeName);

        override = overrideRepository.save(override);

        // [SỬA ĐỔI - Tính năng: Audit Log]
        // Đã sửa: Truyền đúng judgeId, judgeName thực tế.
        // Đã sửa: Đổi "ScoreOverride" thành "Score" để khớp chính xác với Constraint CK_audit_entity dưới DB
        auditService.log(
                judgeId,
                judgeName,
                "OVERRIDE_SCORE",
                "Score", // Khớp với Constraint DB để tránh lỗi 400
                override.getId().toString()
        );

        return override;
    }

    // [SỬA ĐỔI - Tính năng: Lấy điểm theo team]
    // Đã thêm: Hàm lấy danh sách điểm
    public List<Score> getScoresByTeam(Long teamId) {
        return scoreRepository.findByTeamId(teamId);
    }
}