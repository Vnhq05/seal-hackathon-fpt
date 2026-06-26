package com.sealhackathon.judging.controller;

import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.judging.dto.response.JudgeScoreResponse;
import com.sealhackathon.judging.dto.response.JudgeScoringAssignmentResponse;
import com.sealhackathon.judging.service.JudgingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/judging")
@RequiredArgsConstructor
@PreAuthorize("hasRole('LECTURER')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Judge Scoring", description = "Judge scoring assignments and overview")
public class JudgeScoringController {

    private final JudgingService judgingService;
    private final AuthPublicService authPublicService;

    @GetMapping("/my-assignments")
    @Operation(summary = "List teams assigned to the current judge for scoring")
    public ResponseEntity<ApiResponse<List<JudgeScoringAssignmentResponse>>> getMyAssignments() {
        UUID judgeId = authPublicService.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(judgingService.getMyScoringAssignments(judgeId)));
    }

    @GetMapping("/my-scores")
    @Operation(summary = "List all scores submitted by the current judge")
    public ResponseEntity<ApiResponse<List<JudgeScoreResponse>>> getMyScores() {
        UUID judgeId = authPublicService.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(judgingService.getMyScores(judgeId)));
    }
}
