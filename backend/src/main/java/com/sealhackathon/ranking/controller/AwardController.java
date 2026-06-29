package com.sealhackathon.ranking.controller;

import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.ranking.dto.response.AwardAssignmentResultResponse;
import com.sealhackathon.ranking.dto.response.ParticipationCertificateResponse;
import com.sealhackathon.ranking.dto.response.ParticipationCertificateSummaryResponse;
import com.sealhackathon.ranking.dto.response.TeamAwardResponse;
import com.sealhackathon.ranking.service.AwardService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Tag(name = "Awards", description = "Team awards and participation certificates after final ranking")
public class AwardController {

    private final AwardService awardService;
    private final AuthPublicService authPublicService;

    @PostMapping("/api/events/{eventId}/awards/assign")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Assign team awards from final ranking and issue participation certificates")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<AwardAssignmentResultResponse>> assignAwards(@PathVariable UUID eventId) {
        AwardAssignmentResultResponse result = awardService.assignAwardsFromFinalRanking(eventId);
        return ResponseEntity.ok(ApiResponse.success("Awards assigned", result));
    }

    @GetMapping("/api/events/{eventId}/awards")
    @Operation(summary = "List team awards for an event")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<TeamAwardResponse>>> getAwards(@PathVariable UUID eventId) {
        return ResponseEntity.ok(ApiResponse.success(awardService.getAwards(eventId)));
    }

    @GetMapping("/api/public/events/{eventId}/awards")
    @Operation(summary = "Public list of team awards")
    public ResponseEntity<ApiResponse<List<TeamAwardResponse>>> getPublicAwards(@PathVariable UUID eventId) {
        return ResponseEntity.ok(ApiResponse.success(awardService.getAwards(eventId)));
    }

    @GetMapping("/api/events/{eventId}/awards/participation")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "List participation certificates for an event")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<ParticipationCertificateResponse>>> getParticipationCertificates(
            @PathVariable UUID eventId) {
        return ResponseEntity.ok(ApiResponse.success(awardService.getParticipationCertificates(eventId)));
    }

    @GetMapping("/api/events/{eventId}/awards/participation/me")
    @Operation(summary = "Get the current user's participation certificate for an event")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<ParticipationCertificateResponse>> getMyParticipationCertificate(
            @PathVariable UUID eventId) {
        UUID userId = authPublicService.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                awardService.getMyParticipationCertificate(eventId, userId)));
    }

    @GetMapping("/api/public/events/{eventId}/awards/participation")
    @Operation(summary = "Public summary of participation certificates issued")
    public ResponseEntity<ApiResponse<ParticipationCertificateSummaryResponse>> getPublicParticipationSummary(
            @PathVariable UUID eventId) {
        return ResponseEntity.ok(ApiResponse.success(awardService.getParticipationCertificateSummary(eventId)));
    }
}
