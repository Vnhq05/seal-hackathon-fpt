package com.sealhackathon.team.controller;

import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.team.dto.request.CreateJoinRequestRequest;
import com.sealhackathon.team.dto.request.CreateLeaveRequestRequest;
import com.sealhackathon.team.dto.request.JoinTeamRequest;
import com.sealhackathon.team.dto.response.JoinableTeamResponse;
import com.sealhackathon.team.dto.response.TeamJoinRequestResponse;
import com.sealhackathon.team.dto.response.TeamLeaveRequestResponse;
import com.sealhackathon.team.service.TeamJoinRequestService;
import com.sealhackathon.team.service.TeamLeaveRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
@RequestMapping("/api/events/{eventId}/teams")
@RequiredArgsConstructor
@Tag(name = "Team Join/Leave Requests")
@SecurityRequirement(name = "bearerAuth")
public class TeamJoinLeaveRequestController {

    private final TeamJoinRequestService joinRequestService;
    private final TeamLeaveRequestService leaveRequestService;
    private final AuthPublicService authPublicService;

    // ── Joinable teams ──

    @GetMapping("/joinable")
    @Operation(summary = "List teams with available slots for join requests")
    public ResponseEntity<ApiResponse<List<JoinableTeamResponse>>> getJoinableTeams(
            @PathVariable UUID eventId,
            @RequestParam(defaultValue = "false") boolean recruitingOnly) {
        UUID userId = authPublicService.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                joinRequestService.getJoinableTeams(eventId, userId, recruitingOnly)));
    }

    // ── Join requests ──

    @PostMapping("/{teamId}/join-requests")
    @Operation(summary = "Submit a join request to a team")
    public ResponseEntity<ApiResponse<TeamJoinRequestResponse>> createJoinRequest(
            @PathVariable UUID eventId,
            @PathVariable UUID teamId,
            @RequestBody(required = false) CreateJoinRequestRequest request) {
        UUID userId = authPublicService.getCurrentUserId();
        TeamJoinRequestResponse response = joinRequestService.createJoinRequest(
                userId, eventId, teamId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Join request submitted", response));
    }

    @GetMapping("/{teamId}/join-requests")
    @Operation(summary = "List pending join requests for a team (leader only)")
    public ResponseEntity<ApiResponse<List<TeamJoinRequestResponse>>> getTeamJoinRequests(
            @PathVariable UUID eventId,
            @PathVariable UUID teamId) {
        UUID leaderId = authPublicService.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                joinRequestService.getTeamJoinRequests(leaderId, eventId, teamId)));
    }

    @GetMapping("/join-requests/my")
    @Operation(summary = "List my join requests in this event")
    public ResponseEntity<ApiResponse<List<TeamJoinRequestResponse>>> getMyJoinRequests(
            @PathVariable UUID eventId) {
        UUID userId = authPublicService.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                joinRequestService.getMyJoinRequests(userId, eventId)));
    }

    @PostMapping("/join-requests/{joinRequestId}/accept")
    @Operation(summary = "Accept a join request (leader only)")
    public ResponseEntity<ApiResponse<TeamJoinRequestResponse>> acceptJoinRequest(
            @PathVariable UUID eventId,
            @PathVariable UUID joinRequestId) {
        UUID leaderId = authPublicService.getCurrentUserId();
        TeamJoinRequestResponse response = joinRequestService.acceptJoinRequest(
                leaderId, eventId, joinRequestId);
        return ResponseEntity.ok(ApiResponse.success("Join request accepted", response));
    }

    @PostMapping("/join-requests/{joinRequestId}/reject")
    @Operation(summary = "Reject a join request (leader only)")
    public ResponseEntity<ApiResponse<TeamJoinRequestResponse>> rejectJoinRequest(
            @PathVariable UUID eventId,
            @PathVariable UUID joinRequestId) {
        UUID leaderId = authPublicService.getCurrentUserId();
        TeamJoinRequestResponse response = joinRequestService.rejectJoinRequest(
                leaderId, eventId, joinRequestId);
        return ResponseEntity.ok(ApiResponse.success("Join request rejected", response));
    }

    @PostMapping("/join-requests/{joinRequestId}/cancel")
    @Operation(summary = "Cancel my pending join request")
    public ResponseEntity<ApiResponse<TeamJoinRequestResponse>> cancelJoinRequest(
            @PathVariable UUID eventId,
            @PathVariable UUID joinRequestId) {
        UUID userId = authPublicService.getCurrentUserId();
        TeamJoinRequestResponse response = joinRequestService.cancelJoinRequest(
                userId, eventId, joinRequestId);
        return ResponseEntity.ok(ApiResponse.success("Join request cancelled", response));
    }

    // ── Leave requests ──

    @PostMapping("/{teamId}/leave-requests")
    @Operation(summary = "Request to leave team (non-leader member)")
    public ResponseEntity<ApiResponse<TeamLeaveRequestResponse>> createLeaveRequest(
            @PathVariable UUID eventId,
            @PathVariable UUID teamId,
            @RequestBody(required = false) CreateLeaveRequestRequest request) {
        UUID userId = authPublicService.getCurrentUserId();
        TeamLeaveRequestResponse response = leaveRequestService.createLeaveRequest(
                userId, eventId, teamId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Leave request submitted", response));
    }

    @GetMapping("/leave-requests")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "List pending leave requests for event (coordinator)")
    public ResponseEntity<ApiResponse<List<TeamLeaveRequestResponse>>> getEventLeaveRequests(
            @PathVariable UUID eventId) {
        return ResponseEntity.ok(ApiResponse.success(leaveRequestService.getEventLeaveRequests(eventId)));
    }

    @GetMapping("/{teamId}/leave-requests")
    @Operation(summary = "List pending leave requests for team (leader)")
    public ResponseEntity<ApiResponse<List<TeamLeaveRequestResponse>>> getTeamLeaveRequests(
            @PathVariable UUID eventId,
            @PathVariable UUID teamId) {
        UUID leaderId = authPublicService.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                leaveRequestService.getTeamLeaveRequests(leaderId, eventId, teamId)));
    }

    @PutMapping("/leave-requests/{leaveRequestId}/approve")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Approve leave request (coordinator)")
    public ResponseEntity<ApiResponse<TeamLeaveRequestResponse>> approveLeaveRequest(
            @PathVariable UUID eventId,
            @PathVariable UUID leaveRequestId) {
        UUID coordinatorId = authPublicService.getCurrentUserId();
        TeamLeaveRequestResponse response = leaveRequestService.approveLeaveRequest(
                coordinatorId, eventId, leaveRequestId);
        return ResponseEntity.ok(ApiResponse.success("Leave request approved", response));
    }

    @PutMapping("/leave-requests/{leaveRequestId}/reject")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Reject leave request (coordinator)")
    public ResponseEntity<ApiResponse<TeamLeaveRequestResponse>> rejectLeaveRequest(
            @PathVariable UUID eventId,
            @PathVariable UUID leaveRequestId) {
        UUID coordinatorId = authPublicService.getCurrentUserId();
        TeamLeaveRequestResponse response = leaveRequestService.rejectLeaveRequest(
                coordinatorId, eventId, leaveRequestId);
        return ResponseEntity.ok(ApiResponse.success("Leave request rejected", response));
    }
}
