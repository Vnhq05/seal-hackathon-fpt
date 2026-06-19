package com.sealhackathon.team.controller;

import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.team.dto.request.SendInvitationRequest;
import com.sealhackathon.team.dto.response.InvitationResponse;
import com.sealhackathon.team.service.InvitationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
@Tag(name = "Invitations", description = "Team invitation workflow (BR-21)")
@SecurityRequirement(name = "bearerAuth")
public class InvitationController {

    private final InvitationService invitationService;
    private final AuthPublicService authPublicService;

    @PostMapping("/teams/{teamId}")
    @Operation(summary = "Send invitation to a user (leader only, BR-21)")
    public ResponseEntity<ApiResponse<InvitationResponse>> sendInvitation(
            @PathVariable UUID teamId,
            @Valid @RequestBody SendInvitationRequest request) {
        UUID leaderId = authPublicService.getCurrentUserId();
        InvitationResponse response = invitationService.sendInvitation(leaderId, teamId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Invitation sent", response));
    }

    @PostMapping("/{invitationId}/accept")
    @Operation(summary = "Accept an invitation (BR-21)")
    public ResponseEntity<ApiResponse<InvitationResponse>> acceptInvitation(
            @PathVariable UUID invitationId) {
        UUID userId = authPublicService.getCurrentUserId();
        InvitationResponse response = invitationService.acceptInvitation(userId, invitationId);
        return ResponseEntity.ok(ApiResponse.success("Invitation accepted", response));
    }

    @PostMapping("/{invitationId}/reject")
    @Operation(summary = "Reject an invitation (BR-21)")
    public ResponseEntity<ApiResponse<InvitationResponse>> rejectInvitation(
            @PathVariable UUID invitationId) {
        UUID userId = authPublicService.getCurrentUserId();
        InvitationResponse response = invitationService.rejectInvitation(userId, invitationId);
        return ResponseEntity.ok(ApiResponse.success("Invitation rejected", response));
    }

    @GetMapping("/my")
    @Operation(summary = "Get my pending invitations")
    public ResponseEntity<ApiResponse<List<InvitationResponse>>> getMyInvitations() {
        UUID userId = authPublicService.getCurrentUserId();
        List<InvitationResponse> invitations = invitationService.getMyPendingInvitations(userId);
        return ResponseEntity.ok(ApiResponse.success(invitations));
    }

    @GetMapping("/teams/{teamId}")
    @Operation(summary = "Get all invitations for a team")
    public ResponseEntity<ApiResponse<List<InvitationResponse>>> getTeamInvitations(
            @PathVariable UUID teamId) {
        List<InvitationResponse> invitations = invitationService.getTeamInvitations(teamId);
        return ResponseEntity.ok(ApiResponse.success(invitations));
    }
}
