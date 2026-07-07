package com.sealhackathon.progress.controller;

import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.progress.dto.response.TeamProgressResponse;
import com.sealhackathon.progress.service.TeamProgressQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Tag(name = "Team Progress", description = "Team submission progress risk monitoring")
@SecurityRequirement(name = "bearerAuth")
public class TeamProgressController {

    private final TeamProgressQueryService teamProgressQueryService;
    private final AuthPublicService authPublicService;

    @GetMapping("/api/events/{eventId}/rounds/{roundId}/progress")
    @Operation(summary = "List team progress risk for a round (role-scoped)")
    public ResponseEntity<ApiResponse<List<TeamProgressResponse>>> getProgressByRound(
            @PathVariable UUID eventId,
            @PathVariable UUID roundId) {
        UUID requesterId = authPublicService.getCurrentUserId();
        var requesterRole = authPublicService.getCurrentUserRole();
        List<TeamProgressResponse> response = teamProgressQueryService.getProgressByRound(
                eventId, roundId, requesterId, requesterRole);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/api/mentor/teams/at-risk")
    @PreAuthorize("hasRole('LECTURER')")
    @Operation(summary = "List at-risk teams for the current mentor")
    public ResponseEntity<ApiResponse<List<TeamProgressResponse>>> getMentorAtRiskTeams(
            @RequestParam UUID eventId) {
        UUID mentorId = authPublicService.getCurrentUserId();
        List<TeamProgressResponse> response = teamProgressQueryService.getMentorAtRiskTeams(mentorId, eventId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
