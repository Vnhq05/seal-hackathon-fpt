package com.sealhackathon.event.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.event.dto.request.CreateRoundRequest;
import com.sealhackathon.event.dto.response.RoundResponse;
import com.sealhackathon.event.service.RoundService;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events/{eventId}/rounds")
@RequiredArgsConstructor
@Tag(name = "Rounds", description = "Round management within events (BR-09, BR-12)")
@SecurityRequirement(name = "bearerAuth")
public class RoundController {

    private final RoundService roundService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Create a round (BR-09 — dates within event, no overlap)")
    public ResponseEntity<ApiResponse<RoundResponse>> createRound(
            @PathVariable UUID eventId,
            @Valid @RequestBody CreateRoundRequest request) {
        RoundResponse response = roundService.createRound(eventId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Round created successfully", response));
    }

    @GetMapping
    @Operation(summary = "List all rounds for an event")
    public ResponseEntity<ApiResponse<List<RoundResponse>>> getRounds(@PathVariable UUID eventId) {
        List<RoundResponse> rounds = roundService.getRoundsByEvent(eventId);
        return ResponseEntity.ok(ApiResponse.success(rounds));
    }

    @GetMapping("/{roundId}")
    @Operation(summary = "Get round by ID")
    public ResponseEntity<ApiResponse<RoundResponse>> getRound(
            @PathVariable UUID eventId, @PathVariable UUID roundId) {
        RoundResponse response = roundService.getRoundById(roundId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{roundId}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Update round configuration")
    public ResponseEntity<ApiResponse<RoundResponse>> updateRound(
            @PathVariable UUID eventId, @PathVariable UUID roundId,
            @Valid @RequestBody CreateRoundRequest request) {
        RoundResponse response = roundService.updateRound(roundId, request);
        return ResponseEntity.ok(ApiResponse.success("Round updated successfully", response));
    }

    @DeleteMapping("/{roundId}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Delete a round")
    public ResponseEntity<ApiResponse<Void>> deleteRound(
            @PathVariable UUID eventId, @PathVariable UUID roundId) {
        roundService.deleteRound(roundId);
        return ResponseEntity.ok(ApiResponse.success("Round deleted", null));
    }

    @PostMapping("/{roundId}/reopen-scoring")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Re-open scoring window with new deadline (BR-43)")
    public ResponseEntity<ApiResponse<RoundResponse>> reopenScoring(
            @PathVariable UUID eventId, @PathVariable UUID roundId,
            @RequestBody LocalDateTime newDeadline) {
        RoundResponse response = roundService.reopenScoringWindow(roundId, newDeadline);
        return ResponseEntity.ok(ApiResponse.success("Scoring window re-opened", response));
    }
}
