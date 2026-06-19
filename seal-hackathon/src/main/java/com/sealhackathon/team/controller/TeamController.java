package com.sealhackathon.team.controller;

import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.team.dto.request.AssignMentorTeamRequest;
import com.sealhackathon.team.dto.request.CreateTeamRequest;
import com.sealhackathon.team.dto.request.JoinTeamRequest;
import com.sealhackathon.team.dto.response.TeamResponse;
import com.sealhackathon.team.service.MentorTeamService;
import com.sealhackathon.team.service.TeamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/events/{eventId}/teams")
@RequiredArgsConstructor
@Tag(name = "Teams", description = "Team registration, membership, mentor-team pairing (BR-15 to BR-24)")
@SecurityRequirement(name = "bearerAuth")
public class TeamController {

    private final TeamService teamService;
    private final MentorTeamService mentorTeamService;
    private final AuthPublicService authPublicService;

    @PostMapping
    @Operation(summary = "Create a new team (BR-15, BR-16 form 1)")
    public ResponseEntity<ApiResponse<TeamResponse>> createTeam(
            @PathVariable UUID eventId,
            @Valid @RequestBody CreateTeamRequest request) {
        UUID userId = authPublicService.getCurrentUserId();
        CreateTeamRequest fullRequest = CreateTeamRequest.builder()
                .name(request.getName())
                .eventId(eventId)
                .build();
        TeamResponse response = teamService.createTeam(userId, fullRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Team created successfully", response));
    }

    @PostMapping("/join")
    @Operation(summary = "Join an existing team (BR-16 form 2)")
    public ResponseEntity<ApiResponse<TeamResponse>> joinTeam(
            @PathVariable UUID eventId,
            @Valid @RequestBody JoinTeamRequest request) {
        UUID userId = authPublicService.getCurrentUserId();
        TeamResponse response = teamService.joinTeam(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Joined team successfully", response));
    }

    @GetMapping
    @Operation(summary = "List all teams for an event")
    public ResponseEntity<ApiResponse<Page<TeamResponse>>> getTeams(
            @PathVariable UUID eventId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<TeamResponse> page = teamService.getTeamsByEvent(eventId, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/my-team")
    @Operation(summary = "Get my team in this event")
    public ResponseEntity<ApiResponse<TeamResponse>> getMyTeam(@PathVariable UUID eventId) {
        UUID userId = authPublicService.getCurrentUserId();
        TeamResponse response = teamService.getMyTeam(userId, eventId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{teamId}")
    @Operation(summary = "Get team by ID")
    public ResponseEntity<ApiResponse<TeamResponse>> getTeam(
            @PathVariable UUID eventId, @PathVariable UUID teamId) {
        TeamResponse response = teamService.getTeamById(teamId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{teamId}/members/{memberId}")
    @Operation(summary = "Remove a member from team (leader only)")
    public ResponseEntity<ApiResponse<TeamResponse>> removeMember(
            @PathVariable UUID eventId, @PathVariable UUID teamId, @PathVariable UUID memberId) {
        UUID leaderId = authPublicService.getCurrentUserId();
        TeamResponse response = teamService.removeMember(leaderId, teamId, memberId);
        return ResponseEntity.ok(ApiResponse.success("Member removed", response));
    }

    @PostMapping("/{teamId}/leave")
    @Operation(summary = "Leave a team (non-leader)")
    public ResponseEntity<ApiResponse<Void>> leaveTeam(
            @PathVariable UUID eventId, @PathVariable UUID teamId) {
        UUID userId = authPublicService.getCurrentUserId();
        teamService.leaveTeam(userId, teamId);
        return ResponseEntity.ok(ApiResponse.success("Left team successfully", null));
    }

    @PutMapping("/{teamId}/leader/{newLeaderId}")
    @Operation(summary = "Transfer leadership (BR-20)")
    public ResponseEntity<ApiResponse<TeamResponse>> transferLeadership(
            @PathVariable UUID eventId, @PathVariable UUID teamId, @PathVariable UUID newLeaderId) {
        UUID currentLeaderId = authPublicService.getCurrentUserId();
        TeamResponse response = teamService.transferLeadership(currentLeaderId, teamId, newLeaderId);
        return ResponseEntity.ok(ApiResponse.success("Leadership transferred", response));
    }

    @PostMapping("/mentor-team")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Assign mentor to team (BR-23)")
    public ResponseEntity<ApiResponse<Void>> assignMentorToTeam(
            @PathVariable UUID eventId,
            @Valid @RequestBody AssignMentorTeamRequest request) {
        mentorTeamService.assignMentorToTeam(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Mentor assigned to team", null));
    }

    @DeleteMapping("/mentor-team/{assignmentId}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Remove mentor from team")
    public ResponseEntity<ApiResponse<Void>> removeMentorFromTeam(
            @PathVariable UUID eventId, @PathVariable UUID assignmentId) {
        mentorTeamService.removeMentorFromTeam(assignmentId);
        return ResponseEntity.ok(ApiResponse.success("Mentor removed from team", null));
    }
}
