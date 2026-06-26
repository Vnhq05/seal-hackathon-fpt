package com.sealhackathon.ranking.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.ranking.dto.response.EventRankingBoard;
import com.sealhackathon.ranking.service.SeasonRankingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ranking")
@RequiredArgsConstructor
@Tag(name = "Season Rankings", description = "Cross-event rankings filtered by season and year")
@SecurityRequirement(name = "bearerAuth")
public class SeasonRankingController {

    private final SeasonRankingService seasonRankingService;

    @GetMapping
    @Operation(summary = "Get team rankings grouped by event for a season/year")
    public ResponseEntity<ApiResponse<List<EventRankingBoard>>> getSeasonRankings(
            @RequestParam(required = false) String season,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) UUID trackId) {
        List<EventRankingBoard> boards = seasonRankingService.getSeasonRankings(season, year, trackId);
        return ResponseEntity.ok(ApiResponse.success(boards));
    }
}
