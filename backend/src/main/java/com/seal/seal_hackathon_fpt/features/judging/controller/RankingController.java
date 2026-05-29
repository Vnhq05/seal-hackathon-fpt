package com.seal.seal_hackathon_fpt.features.judging.controller;

// [THÊM MỚI TOÀN BỘ FILE - Tính năng: Mở API Ranking]
import com.seal.seal_hackathon_fpt.features.judging.dto.RankingResponse;
import com.seal.seal_hackathon_fpt.features.judging.service.RankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ranking")
@RequiredArgsConstructor
public class RankingController {

    private final RankingService rankingService;

    // LƯU Ý: RankingService trong file test.txt của bạn nhận tham số là "roundId" (Lấy bảng xếp hạng theo Vòng thi),
    // nên đường dẫn thực tế mình sẽ thiết kế là /api/ranking/{roundId} để khớp với Service của bạn.
    @GetMapping("/{roundId}")
    public ResponseEntity<List<RankingResponse>> getRanking(@PathVariable Long roundId) {
        return ResponseEntity.ok(rankingService.getRanking(roundId));
    }
}