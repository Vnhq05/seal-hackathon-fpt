package com.sealhackathon.ranking.controller;

import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.judging.service.JudgingService;
import com.sealhackathon.ranking.dto.response.LiveScoreBoard;
import com.sealhackathon.ranking.service.LiveScoreService;
import com.sealhackathon.ranking.service.RankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/events/{eventId}/leaderboard")
@RequiredArgsConstructor
public class LiveScoreController {

    private final LiveScoreService liveScoreService;
    private final JudgingService judgingService;
    private final RankingService rankingService;
    private final AuthPublicService authPublicService;

    @GetMapping
    public ResponseEntity<ApiResponse<LiveScoreBoard>> getLeaderboard(
            @PathVariable UUID eventId,
            @RequestParam(required = false) UUID trackId,
            @RequestParam(required = false) UUID roundId) {
        LiveScoreBoard board = liveScoreService.getLeaderboard(eventId, trackId, roundId);
        return ResponseEntity.ok(ApiResponse.success(board));
    }

    @PostMapping("/lock")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    public ResponseEntity<ApiResponse<LiveScoreBoard>> lockScores(
            @PathVariable UUID eventId,
            @RequestParam UUID roundId) {
        judgingService.lockScoresForRound(roundId);
        LiveScoreBoard board = liveScoreService.getLeaderboard(eventId, null, roundId);
        return ResponseEntity.ok(ApiResponse.success("Scores locked", board));
    }

    @PostMapping("/publish")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    public ResponseEntity<ApiResponse<LiveScoreBoard>> publishResults(
            @PathVariable UUID eventId,
            @RequestParam UUID roundId) {
        UUID userId = authPublicService.getCurrentUserId();
        rankingService.publishResults(roundId, userId);
        LiveScoreBoard board = liveScoreService.getLeaderboard(eventId, null, roundId);
        return ResponseEntity.ok(ApiResponse.success("Results published", board));
    }

    @PostMapping("/public")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    public ResponseEntity<ApiResponse<LiveScoreBoard>> setLeaderboardPublic(
            @PathVariable UUID eventId,
            @RequestParam boolean enabled) {
        liveScoreService.setLeaderboardPublic(eventId, enabled);
        LiveScoreBoard board = liveScoreService.getLeaderboard(eventId, null, null);
        return ResponseEntity.ok(ApiResponse.success(
                enabled ? "Public leaderboard enabled" : "Public leaderboard disabled", board));
    }
}
