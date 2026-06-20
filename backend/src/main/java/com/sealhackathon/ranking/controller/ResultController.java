package com.sealhackathon.ranking.controller;

import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.ranking.dto.response.PublishedResultResponse;
import com.sealhackathon.ranking.service.RankingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/rounds/{roundId}/results")
@RequiredArgsConstructor
@Tag(name = "Results", description = "Publish and view results (BR-51, BR-52)")
@SecurityRequirement(name = "bearerAuth")
public class ResultController {

    private final RankingService rankingService;
    private final AuthPublicService authPublicService;

    @PostMapping("/publish")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Publish results for a round (BR-51)")
    public ResponseEntity<ApiResponse<PublishedResultResponse>> publishResults(
            @PathVariable UUID roundId) {
        UUID publisherId = authPublicService.getCurrentUserId();
        PublishedResultResponse response = rankingService.publishResults(roundId, publisherId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Results published", response));
    }

    @GetMapping
    @Operation(summary = "Get published results for a round")
    public ResponseEntity<ApiResponse<PublishedResultResponse>> getPublishedResults(
            @PathVariable UUID roundId) {
        PublishedResultResponse response = rankingService.getPublishedResult(roundId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
