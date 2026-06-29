package com.sealhackathon.ranking.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.ranking.dto.response.AdvancementResponse;
import com.sealhackathon.ranking.dto.response.RankingResponse;
import com.sealhackathon.ranking.service.AdvancementService;
import com.sealhackathon.ranking.service.RankingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rounds/{roundId}/rankings")
@RequiredArgsConstructor
@Tag(name = "Rankings", description = "Ranking calculation and leaderboard (BR-44 to BR-49)")
@SecurityRequirement(name = "bearerAuth")
public class RankingController {

    private final RankingService rankingService;
    private final AdvancementService advancementService;

    @GetMapping
    @Operation(summary = "Get latest rankings for a round")
    public ResponseEntity<ApiResponse<List<RankingResponse>>> getRankings(
            @PathVariable UUID roundId,
            @RequestParam(required = false) UUID trackId) {
        List<RankingResponse> rankings = rankingService.getLatestRankings(roundId, trackId);
        return ResponseEntity.ok(ApiResponse.success(rankings));
    }

    @GetMapping("/team/{teamId}")
    @Operation(summary = "Get ranking for a specific team")
    public ResponseEntity<ApiResponse<RankingResponse>> getTeamRanking(
            @PathVariable UUID roundId, @PathVariable UUID teamId) {
        RankingResponse ranking = rankingService.getTeamRanking(roundId, teamId);
        return ResponseEntity.ok(ApiResponse.success(ranking));
    }

    @PostMapping("/recalculate")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Trigger manual ranking recalculation (BR-48)")
    public ResponseEntity<ApiResponse<List<RankingResponse>>> recalculate(
            @PathVariable UUID roundId) {
        List<RankingResponse> rankings = rankingService.triggerRecalculation(roundId);
        return ResponseEntity.ok(ApiResponse.success("Rankings recalculated", rankings));
    }

    @GetMapping("/advancements")
    @Operation(summary = "Get advancement status for all teams (BR-49)")
    public ResponseEntity<ApiResponse<List<AdvancementResponse>>> getAdvancements(
            @PathVariable UUID roundId) {
        List<AdvancementResponse> advancements = advancementService.getAdvancements(roundId);
        return ResponseEntity.ok(ApiResponse.success(advancements));
    }
}
