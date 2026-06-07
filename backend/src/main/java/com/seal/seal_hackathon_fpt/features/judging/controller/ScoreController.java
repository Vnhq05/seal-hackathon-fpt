package com.seal.seal_hackathon_fpt.features.judging.controller;

import com.seal.seal_hackathon_fpt.features.judging.dto.CreateScoreRequest;
import com.seal.seal_hackathon_fpt.features.judging.entity.Score;
import com.seal.seal_hackathon_fpt.features.judging.entity.ScoreOverride;
import com.seal.seal_hackathon_fpt.features.judging.service.ScoreService;
import com.seal.seal_hackathon_fpt.features.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;

// [SỬA ĐỔI - Tính năng: Lấy danh sách điểm]
// Đã thêm: Import List
import java.nio.file.attribute.UserPrincipal;
import java.util.List;

@RestController
@RequestMapping("/api/scores")
@RequiredArgsConstructor
public class ScoreController {

    private final ScoreService scoreService;

    @PostMapping
    public ResponseEntity<Score> createScore(
            @RequestBody CreateScoreRequest request
    ) {

        return ResponseEntity.ok(
                scoreService.createScore(request)
        );
    }

    @PostMapping("/override")
    public ResponseEntity<?> overrideScore(
            @RequestParam Long teamId,
            @RequestParam Long roundId,
            @RequestParam BigDecimal newScore,
            @RequestParam String reason,
            @AuthenticationPrincipal User currentUser // Nhận trực tiếp đối tượng User của bạn
    ){
        // Sửa lại theo đúng tên hàm Getter có trong Entity User của bạn
        Long judgeId = currentUser.getId();
        String judgeName = currentUser.getUsername(); // hoặc currentUser.getName(), tùy bạn đặt tên trong Entity

        ScoreOverride result = scoreService.overrideScore(teamId, roundId, newScore, reason, judgeId, judgeName);
        return ResponseEntity.ok(result);
    }

    // [SỬA ĐỔI - Tính năng: API Lấy điểm của team]
    // Đã xóa: Không xóa gì
    // Đã thêm: API GET /scores/team/{teamId}
    @GetMapping("/team/{teamId}")
    public ResponseEntity<List<Score>> getScoresByTeam(@PathVariable Long teamId) {
        return ResponseEntity.ok(scoreService.getScoresByTeam(teamId));
    }
}