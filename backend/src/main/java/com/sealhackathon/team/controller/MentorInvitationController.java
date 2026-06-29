package com.sealhackathon.team.controller;

import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.event.dto.response.MentorAssignmentResponse;
import com.sealhackathon.event.service.MentorAssignmentService;
import com.sealhackathon.team.dto.request.RespondMentorInvitationRequest;
import com.sealhackathon.team.dto.request.SendMentorInvitationRequest;
import com.sealhackathon.team.dto.response.MentorInvitationResponse;
import com.sealhackathon.team.dto.response.MentorRoomResponse;
import com.sealhackathon.team.service.MentorInvitationService;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Tag(name = "Mentor Invitations", description = "Team leader invites mentors; mentors accept/decline")
@SecurityRequirement(name = "bearerAuth")
public class MentorInvitationController {

    private final MentorInvitationService invitationService;
    private final MentorAssignmentService mentorAssignmentService;
    private final AuthPublicService authPublicService;

    @PostMapping("/api/events/{eventId}/mentor-invitations")
    @Operation(summary = "Send mentor invitation (team leader only)")
    public ResponseEntity<ApiResponse<MentorInvitationResponse>> send(
            @PathVariable UUID eventId,
            @Valid @RequestBody SendMentorInvitationRequest request) {
        UUID userId = authPublicService.getCurrentUserId();
        MentorInvitationResponse response = invitationService.sendInvitation(userId, eventId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Mentor invitation sent", response));
    }

    @GetMapping("/api/events/{eventId}/mentor-invitations/team/{teamId}")
    @Operation(summary = "List mentor invitations for a team")
    public ResponseEntity<ApiResponse<List<MentorInvitationResponse>>> getByTeam(
            @PathVariable UUID eventId,
            @PathVariable UUID teamId) {
        return ResponseEntity.ok(ApiResponse.success(invitationService.getByTeam(eventId, teamId)));
    }

    @GetMapping("/api/events/{eventId}/mentor-invitations/pending")
    @Operation(summary = "List pending mentor invitations for current mentor")
    public ResponseEntity<ApiResponse<List<MentorInvitationResponse>>> getPendingForMentor(
            @PathVariable UUID eventId) {
        UUID userId = authPublicService.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(invitationService.getPendingForMentor(userId, eventId)));
    }

    @GetMapping("/api/mentor-invitations/pending")
    @Operation(summary = "List all pending mentor invitations for current mentor")
    public ResponseEntity<ApiResponse<List<MentorInvitationResponse>>> getAllPendingForMentor() {
        UUID userId = authPublicService.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(invitationService.getAllPendingForMentor(userId)));
    }

    @PutMapping("/api/events/{eventId}/mentor-invitations/{invitationId}/respond")
    @Operation(summary = "Accept or decline a mentor invitation")
    public ResponseEntity<ApiResponse<MentorInvitationResponse>> respond(
            @PathVariable UUID eventId,
            @PathVariable UUID invitationId,
            @Valid @RequestBody RespondMentorInvitationRequest request) {
        UUID userId = authPublicService.getCurrentUserId();
        MentorInvitationResponse response = invitationService.respond(userId, eventId, invitationId, request);
        return ResponseEntity.ok(ApiResponse.success("Invitation updated", response));
    }

    @GetMapping("/api/events/{eventId}/mentor-invitations/available-mentors")
    @Operation(summary = "List mentors available for invitation in a track")
    public ResponseEntity<ApiResponse<List<MentorAssignmentResponse>>> getAvailableMentors(
            @PathVariable UUID eventId,
            @RequestParam UUID trackId) {
        return ResponseEntity.ok(ApiResponse.success(mentorAssignmentService.getMentorsByTrack(eventId, trackId)));
    }

    @GetMapping("/api/events/{eventId}/teams/{teamId}/mentor-room")
    @Operation(summary = "Get mentor chat room for a team (if mentor assigned)")
    public ResponseEntity<ApiResponse<MentorRoomResponse>> getRoomByTeam(
            @PathVariable UUID eventId,
            @PathVariable UUID teamId) {
        MentorRoomResponse room = invitationService.getRoomByTeam(eventId, teamId);
        return ResponseEntity.ok(ApiResponse.success(room));
    }

    @GetMapping("/api/events/{eventId}/mentor-rooms")
    @Operation(summary = "List active mentor rooms for current mentor in event")
    public ResponseEntity<ApiResponse<List<MentorRoomResponse>>> getMentorActiveRooms(
            @PathVariable UUID eventId) {
        UUID userId = authPublicService.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(invitationService.getMentorActiveRooms(userId, eventId)));
    }

    @GetMapping("/api/mentor-rooms")
    @Operation(summary = "List all active mentor rooms for current mentor")
    public ResponseEntity<ApiResponse<List<MentorRoomResponse>>> getAllMentorActiveRooms() {
        UUID userId = authPublicService.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(invitationService.getAllMentorActiveRooms(userId)));
    }
}
