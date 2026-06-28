package com.sealhackathon.ranking.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.ranking.dto.response.TeamAwardResponse;
import com.sealhackathon.ranking.service.AwardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Tag(name = "Awards", description = "Team awards after final ranking")
public class AwardController {

    private final AwardService awardService;

    @PostMapping("/api/events/{eventId}/awards/assign")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Assign awards from final ranking")
    public ResponseEntity<ApiResponse<List<TeamAwardResponse>>> assignAwards(@PathVariable UUID eventId) {
        List<TeamAwardResponse> awards = awardService.assignAwardsFromFinalRanking(eventId);
        return ResponseEntity.ok(ApiResponse.success("Awards assigned", awards));
    }

    @GetMapping("/api/events/{eventId}/awards")
    @Operation(summary = "List team awards for an event")
    public ResponseEntity<ApiResponse<List<TeamAwardResponse>>> getAwards(@PathVariable UUID eventId) {
        return ResponseEntity.ok(ApiResponse.success(awardService.getAwards(eventId)));
    }

    @GetMapping("/api/public/events/{eventId}/awards")
    @Operation(summary = "Public list of team awards")
    public ResponseEntity<ApiResponse<List<TeamAwardResponse>>> getPublicAwards(@PathVariable UUID eventId) {
        return ResponseEntity.ok(ApiResponse.success(awardService.getAwards(eventId)));
    }
}
