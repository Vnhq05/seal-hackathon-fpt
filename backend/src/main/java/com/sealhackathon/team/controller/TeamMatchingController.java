package com.sealhackathon.team.controller;

import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.team.dto.response.MatchingCandidateResponse;
import com.sealhackathon.team.dto.response.PublicMatchingProfileResponse;
import com.sealhackathon.team.service.EventEnrollmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events/{eventId}/teams/{teamId}/matching")
@RequiredArgsConstructor
@Tag(name = "Team Matching", description = "Finding members for team leaders")
@SecurityRequirement(name = "bearerAuth")
public class TeamMatchingController {

    private final EventEnrollmentService enrollmentService;
    private final AuthPublicService authPublicService;

    @GetMapping("/candidates")
    @Operation(summary = "List participants looking for a team (team leader only)")
    public ResponseEntity<ApiResponse<List<MatchingCandidateResponse>>> getCandidates(
            @PathVariable UUID eventId,
            @PathVariable UUID teamId) {
        UUID leaderId = authPublicService.getCurrentUserId();
        List<MatchingCandidateResponse> candidates =
                enrollmentService.getFindingMembersCandidates(leaderId, eventId, teamId);
        return ResponseEntity.ok(ApiResponse.success(candidates));
    }

    @GetMapping("/candidates/{userId}/profile")
    @Operation(summary = "View public matching profile of a candidate (team leader only)")
    public ResponseEntity<ApiResponse<PublicMatchingProfileResponse>> getCandidateProfile(
            @PathVariable UUID eventId,
            @PathVariable UUID teamId,
            @PathVariable UUID userId) {
        UUID leaderId = authPublicService.getCurrentUserId();
        PublicMatchingProfileResponse profile =
                enrollmentService.getPublicMatchingProfile(userId, leaderId, eventId, teamId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }
}
