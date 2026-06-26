package com.sealhackathon.ranking.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.ranking.dto.response.PublishedResultResponse;
import com.sealhackathon.ranking.service.RankingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/rounds/{roundId}/results")
@RequiredArgsConstructor
@Tag(name = "Results", description = "View published results (BR-52). Use LiveScoreController to publish.")
@SecurityRequirement(name = "bearerAuth")
public class ResultController {

    private final RankingService rankingService;

    @GetMapping
    @Operation(summary = "Get published results for a round")
    public ResponseEntity<ApiResponse<PublishedResultResponse>> getPublishedResults(
            @PathVariable UUID roundId) {
        PublishedResultResponse response = rankingService.getPublishedResult(roundId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
