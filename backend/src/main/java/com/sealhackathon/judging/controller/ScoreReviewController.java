package com.sealhackathon.judging.controller;

import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.judging.domain.enums.ScoreReviewStatus;
import com.sealhackathon.judging.dto.request.JudgeScoreReviewRequest;
import com.sealhackathon.judging.dto.request.ResolveScoreReviewRequest;
import com.sealhackathon.judging.dto.response.ScoreReviewResponse;
import com.sealhackathon.judging.service.ScoreReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events/{eventId}/score-reviews")
@RequiredArgsConstructor
@Tag(name = "Score Reviews", description = "Inter-judge score deviation review workflow")
@SecurityRequirement(name = "bearerAuth")
public class ScoreReviewController {

    private final ScoreReviewService scoreReviewService;
    private final AuthPublicService authPublicService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "List score deviation review requests for an event")
    public ResponseEntity<ApiResponse<List<ScoreReviewResponse>>> listReviews(
            @PathVariable UUID eventId,
            @RequestParam(required = false) UUID roundId,
            @RequestParam(required = false) ScoreReviewStatus status) {
        List<ScoreReviewResponse> reviews = scoreReviewService.listReviews(eventId, roundId, status);
        return ResponseEntity.ok(ApiResponse.success(reviews));
    }

    @GetMapping("/{reviewId}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR', 'LECTURER')")
    @Operation(summary = "Get score deviation review detail with judge breakdown")
    public ResponseEntity<ApiResponse<ScoreReviewResponse>> getReview(
            @PathVariable UUID eventId, @PathVariable UUID reviewId) {
        UUID requesterId = authPublicService.getCurrentUserId();
        UserType requesterRole = authPublicService.getCurrentUserRole();
        ScoreReviewResponse review = scoreReviewService.getReview(
                eventId, reviewId, requesterId, requesterRole);
        return ResponseEntity.ok(ApiResponse.success(review));
    }

    @PostMapping("/judge-request")
    @PreAuthorize("hasRole('LECTURER')")
    @Operation(summary = "Request coordinator review of judge scores for a submission")
    public ResponseEntity<ApiResponse<ScoreReviewResponse>> requestJudgeAdjustment(
            @PathVariable UUID eventId,
            @Valid @RequestBody JudgeScoreReviewRequest request) {
        UUID judgeId = authPublicService.getCurrentUserId();
        ScoreReviewResponse review = scoreReviewService.requestJudgeAdjustment(
                eventId, judgeId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Adjustment request submitted", review));
    }

    @PatchMapping("/{reviewId}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Resolve or ignore a score deviation review")
    public ResponseEntity<ApiResponse<ScoreReviewResponse>> resolveReview(
            @PathVariable UUID eventId, @PathVariable UUID reviewId,
            @Valid @RequestBody ResolveScoreReviewRequest request) {
        UUID resolverId = authPublicService.getCurrentUserId();
        ScoreReviewResponse review = scoreReviewService.resolveReview(
                eventId, reviewId, resolverId, request);
        return ResponseEntity.ok(ApiResponse.success("Score review updated", review));
    }
}
