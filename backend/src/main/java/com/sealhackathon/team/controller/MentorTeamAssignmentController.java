package com.sealhackathon.team.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.team.dto.request.AssignMentorTeamRequest;
import com.sealhackathon.team.dto.response.MentorDrawResultResponse;
import com.sealhackathon.team.dto.response.MentorTeamAssignmentResponse;
import com.sealhackathon.team.service.MentorDrawService;
import com.sealhackathon.team.service.MentorTeamService;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events/{eventId}")
@RequiredArgsConstructor
@Tag(name = "Mentor–Team Assignment", description = "Random draw and manual mentor-to-team assignment")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
public class MentorTeamAssignmentController {

    private final MentorDrawService mentorDrawService;
    private final MentorTeamService mentorTeamService;

    @PostMapping("/mentors/draw")
    @Operation(summary = "Randomly assign mentors to teams (balanced per track)")
    public ResponseEntity<ApiResponse<MentorDrawResultResponse>> drawMentors(@PathVariable UUID eventId) {
        MentorDrawResultResponse result = mentorDrawService.drawMentors(eventId);
        return ResponseEntity.ok(ApiResponse.success(result.getMessage(), result));
    }

    @GetMapping("/mentor-teams")
    @Operation(summary = "List mentor–team assignments for an event")
    public ResponseEntity<ApiResponse<List<MentorTeamAssignmentResponse>>> listMentorTeams(
            @PathVariable UUID eventId) {
        return ResponseEntity.ok(ApiResponse.success(mentorDrawService.listAssignments(eventId)));
    }

    @PostMapping("/mentor-teams")
    @Operation(summary = "Manually assign a mentor to a team")
    public ResponseEntity<ApiResponse<MentorTeamAssignmentResponse>> assignMentorTeam(
            @PathVariable UUID eventId,
            @Valid @RequestBody AssignMentorTeamRequest request) {
        MentorTeamAssignmentResponse response = mentorDrawService.assignOne(
                eventId, request.getTeamId(), request.getMentorUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Mentor assigned to team", response));
    }

    @DeleteMapping("/mentor-teams/{assignmentId}")
    @Operation(summary = "Remove mentor from team")
    public ResponseEntity<ApiResponse<Void>> removeMentorTeam(
            @PathVariable UUID eventId,
            @PathVariable UUID assignmentId) {
        mentorTeamService.removeMentorFromTeam(assignmentId);
        return ResponseEntity.ok(ApiResponse.success("Mentor removed from team", null));
    }
}
