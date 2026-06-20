package com.sealhackathon.judging.controller;

import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.judging.dto.request.ScoreSubmissionRequest;
import com.sealhackathon.judging.dto.response.JudgeScoreResponse;
import com.sealhackathon.judging.service.JudgingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rounds/{roundId}/scoring")
@RequiredArgsConstructor
@Tag(name = "Judging", description = "Score entry, conflict detection, locking (BR-34 to BR-43)")
@SecurityRequirement(name = "bearerAuth")
public class JudgingController {

    private final JudgingService judgingService;
    private final AuthPublicService authPublicService;

    @PostMapping
    @PreAuthorize("hasRole('JUDGE')")
    @Operation(summary = "Submit scores for a submission (BR-34, BR-35, BR-36, BR-37)")
    public ResponseEntity<ApiResponse<JudgeScoreResponse>> submitScore(
            @PathVariable UUID roundId,
            @Valid @RequestBody ScoreSubmissionRequest request) {
        UUID judgeId = authPublicService.getCurrentUserId();
        JudgeScoreResponse response = judgingService.submitScore(judgeId, roundId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Score submitted", response));
    }

    @PutMapping("/{judgeScoreId}")
    @PreAuthorize("hasRole('JUDGE')")
    @Operation(summary = "Update existing score (BR-39 — before deadline)")
    public ResponseEntity<ApiResponse<JudgeScoreResponse>> updateScore(
            @PathVariable UUID roundId, @PathVariable UUID judgeScoreId,
            @Valid @RequestBody ScoreSubmissionRequest request) {
        UUID judgeId = authPublicService.getCurrentUserId();
        JudgeScoreResponse response = judgingService.updateScore(judgeId, judgeScoreId, request);
        return ResponseEntity.ok(ApiResponse.success("Score updated", response));
    }

    @GetMapping("/submission/{submissionId}")
    @Operation(summary = "Get all scores for a submission (BR-42 — coordinator view)")
    public ResponseEntity<ApiResponse<List<JudgeScoreResponse>>> getScoresBySubmission(
            @PathVariable UUID roundId, @PathVariable UUID submissionId) {
        List<JudgeScoreResponse> scores = judgingService.getScoresBySubmission(submissionId);
        return ResponseEntity.ok(ApiResponse.success(scores));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Get all scores for a round (BR-42)")
    public ResponseEntity<ApiResponse<List<JudgeScoreResponse>>> getScoresByRound(
            @PathVariable UUID roundId) {
        List<JudgeScoreResponse> scores = judgingService.getScoresByRound(roundId);
        return ResponseEntity.ok(ApiResponse.success(scores));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('JUDGE')")
    @Operation(summary = "Get my scores")
    public ResponseEntity<ApiResponse<List<JudgeScoreResponse>>> getMyScores(
            @PathVariable UUID roundId) {
        UUID judgeId = authPublicService.getCurrentUserId();
        List<JudgeScoreResponse> scores = judgingService.getMyScores(judgeId);
        return ResponseEntity.ok(ApiResponse.success(scores));
    }

    @GetMapping("/my/submission/{submissionId}")
    @PreAuthorize("hasRole('JUDGE')")
    @Operation(summary = "Get my score for a specific submission")
    public ResponseEntity<ApiResponse<JudgeScoreResponse>> getMyScoreForSubmission(
            @PathVariable UUID roundId, @PathVariable UUID submissionId) {
        UUID judgeId = authPublicService.getCurrentUserId();
        JudgeScoreResponse response = judgingService.getMyScoreForSubmission(judgeId, submissionId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{judgeScoreId}")
    @Operation(summary = "Get score by ID")
    public ResponseEntity<ApiResponse<JudgeScoreResponse>> getScoreById(
            @PathVariable UUID roundId, @PathVariable UUID judgeScoreId) {
        JudgeScoreResponse response = judgingService.getScoreById(judgeScoreId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/lock")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Lock all scores for the round (BR-40)")
    public ResponseEntity<ApiResponse<Integer>> lockScores(@PathVariable UUID roundId) {
        int locked = judgingService.lockScoresForRound(roundId);
        return ResponseEntity.ok(ApiResponse.success("Locked " + locked + " scores", locked));
    }

    @DeleteMapping("/{judgeScoreId}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Delete a score (admin)")
    public ResponseEntity<ApiResponse<Void>> deleteScore(
            @PathVariable UUID roundId, @PathVariable UUID judgeScoreId) {
        judgingService.deleteScore(judgeScoreId);
        return ResponseEntity.ok(ApiResponse.success("Score deleted", null));
    }
}
