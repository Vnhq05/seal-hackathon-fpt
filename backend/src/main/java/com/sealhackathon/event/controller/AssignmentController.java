package com.sealhackathon.event.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.event.domain.enums.AssignmentScope;
import com.sealhackathon.event.dto.request.AssignJudgeRequest;
import com.sealhackathon.event.dto.request.AssignMentorRequest;
import com.sealhackathon.event.dto.request.CreateCompetitionGroupRequest;
import com.sealhackathon.event.dto.request.DeactivateJudgeAssignmentRequest;
import com.sealhackathon.event.dto.request.GenerateCompetitionGroupsRequest;
import com.sealhackathon.event.dto.request.ReplaceJudgeAssignmentRequest;
import com.sealhackathon.event.dto.response.CompetitionGroupResponse;
import com.sealhackathon.event.dto.response.GenerateCompetitionGroupsResponse;
import com.sealhackathon.event.dto.response.JudgeAssignmentResponse;
import com.sealhackathon.event.dto.response.JudgeWorkloadPreviewResponse;
import com.sealhackathon.event.dto.response.MentorAssignmentResponse;
import com.sealhackathon.event.service.CompetitionGroupService;
import com.sealhackathon.event.service.JudgeAssignmentService;
import com.sealhackathon.event.service.MentorAssignmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events/{eventId}")
@RequiredArgsConstructor
@Tag(name = "Assignments", description = "Judge and mentor assignments (BR-13, BR-14)")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
public class AssignmentController {

    private final JudgeAssignmentService judgeAssignmentService;
    private final MentorAssignmentService mentorAssignmentService;
    private final CompetitionGroupService competitionGroupService;

    @PostMapping("/rounds/{roundId}/judges")
    @Operation(summary = "Assign a judge to a round scope (ROUND / TRACK / GROUP)")
    public ResponseEntity<ApiResponse<JudgeAssignmentResponse>> assignJudge(
            @PathVariable UUID eventId,
            @PathVariable UUID roundId,
            @Valid @RequestBody AssignJudgeRequest request,
            HttpServletRequest httpRequest) {
        JudgeAssignmentResponse response = judgeAssignmentService.assignJudge(
                eventId, roundId, request, httpRequest.getRemoteAddr());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Judge assigned to round", response));
    }

    @GetMapping("/rounds/{roundId}/judges")
    @Operation(summary = "List judge assignments for a round")
    public ResponseEntity<ApiResponse<List<JudgeAssignmentResponse>>> getJudges(
            @PathVariable UUID eventId,
            @PathVariable UUID roundId,
            @RequestParam(required = false) UUID trackId,
            @RequestParam(required = false) UUID groupId) {
        List<JudgeAssignmentResponse> judges = judgeAssignmentService.getJudgesByRound(
                eventId, roundId, trackId, groupId);
        return ResponseEntity.ok(ApiResponse.success(judges));
    }

    @GetMapping("/rounds/{roundId}/judges/preview-workload")
    @Operation(summary = "Preview team/submission workload for a judge assignment scope")
    public ResponseEntity<ApiResponse<JudgeWorkloadPreviewResponse>> previewWorkload(
            @PathVariable UUID eventId,
            @PathVariable UUID roundId,
            @RequestParam AssignmentScope scope,
            @RequestParam(required = false) UUID trackId,
            @RequestParam(required = false) UUID groupId) {
        return ResponseEntity.ok(ApiResponse.success(judgeAssignmentService.previewWorkload(
                eventId, roundId, scope, trackId, groupId)));
    }

    @DeleteMapping("/rounds/{roundId}/judges/{assignmentId}")
    @Operation(summary = "Remove a judge assignment (only when no scores submitted)")
    public ResponseEntity<ApiResponse<Void>> removeJudge(
            @PathVariable UUID eventId,
            @PathVariable UUID roundId,
            @PathVariable UUID assignmentId,
            HttpServletRequest httpRequest) {
        judgeAssignmentService.removeJudgeAssignment(assignmentId, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("Judge assignment removed", null));
    }

    @PatchMapping("/rounds/{roundId}/judges/{assignmentId}/deactivate")
    @Operation(summary = "Deactivate a judge assignment")
    public ResponseEntity<ApiResponse<JudgeAssignmentResponse>> deactivateJudge(
            @PathVariable UUID eventId,
            @PathVariable UUID roundId,
            @PathVariable UUID assignmentId,
            @Valid @RequestBody DeactivateJudgeAssignmentRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.success("Judge assignment deactivated",
                judgeAssignmentService.deactivateAssignment(assignmentId, request, httpRequest.getRemoteAddr())));
    }

    @PatchMapping("/rounds/{roundId}/judges/{assignmentId}/activate")
    @Operation(summary = "Re-activate a judge assignment")
    public ResponseEntity<ApiResponse<JudgeAssignmentResponse>> activateJudge(
            @PathVariable UUID eventId,
            @PathVariable UUID roundId,
            @PathVariable UUID assignmentId,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.success("Judge assignment activated",
                judgeAssignmentService.activateAssignment(assignmentId, httpRequest.getRemoteAddr())));
    }

    @PostMapping("/rounds/{roundId}/judges/{assignmentId}/replace")
    @Operation(summary = "Replace a judge assignment with another judge")
    public ResponseEntity<ApiResponse<JudgeAssignmentResponse>> replaceJudge(
            @PathVariable UUID eventId,
            @PathVariable UUID roundId,
            @PathVariable UUID assignmentId,
            @Valid @RequestBody ReplaceJudgeAssignmentRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.success("Judge replaced",
                judgeAssignmentService.replaceAssignment(assignmentId, request, httpRequest.getRemoteAddr())));
    }

    @PostMapping("/tracks/{trackId}/groups")
    @Operation(summary = "Create a competition group within a track")
    public ResponseEntity<ApiResponse<CompetitionGroupResponse>> createGroup(
            @PathVariable UUID eventId,
            @PathVariable UUID trackId,
            @Valid @RequestBody CreateCompetitionGroupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Group created",
                        competitionGroupService.createGroup(eventId, trackId, request)));
    }

    @GetMapping("/tracks/{trackId}/groups")
    @Operation(summary = "List competition groups for a track")
    public ResponseEntity<ApiResponse<List<CompetitionGroupResponse>>> listGroups(
            @PathVariable UUID eventId,
            @PathVariable UUID trackId) {
        return ResponseEntity.ok(ApiResponse.success(
                competitionGroupService.listGroups(eventId, trackId)));
    }

    @DeleteMapping("/tracks/{trackId}/groups/{groupId}")
    @Operation(summary = "Delete a competition group")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(
            @PathVariable UUID eventId,
            @PathVariable UUID trackId,
            @PathVariable UUID groupId,
            HttpServletRequest httpRequest) {
        competitionGroupService.deleteGroup(eventId, trackId, groupId, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("Group deleted", null));
    }

    @PostMapping("/groups/generate")
    @Operation(summary = "Generate balanced competition groups for all tracks from teams-per-group target")
    public ResponseEntity<ApiResponse<GenerateCompetitionGroupsResponse>> generateGroups(
            @PathVariable UUID eventId,
            @Valid @RequestBody GenerateCompetitionGroupsRequest request,
            HttpServletRequest httpRequest) {
        GenerateCompetitionGroupsResponse result = competitionGroupService.generateGroups(
                eventId, request, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("Competition groups generated", result));
    }

    @PostMapping("/tracks/{trackId}/mentors")
    @Operation(summary = "Assign a mentor to a track (BR-14)")
    public ResponseEntity<ApiResponse<MentorAssignmentResponse>> assignMentor(
            @PathVariable UUID eventId,
            @PathVariable UUID trackId,
            @Valid @RequestBody AssignMentorRequest request) {
        MentorAssignmentResponse response = mentorAssignmentService.assignMentor(eventId, trackId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Mentor assigned to track", response));
    }

    @GetMapping("/tracks/{trackId}/mentors")
    @Operation(summary = "List mentors assigned to a track")
    public ResponseEntity<ApiResponse<List<MentorAssignmentResponse>>> getMentors(
            @PathVariable UUID eventId,
            @PathVariable UUID trackId) {
        List<MentorAssignmentResponse> mentors = mentorAssignmentService.getMentorsByTrack(eventId, trackId);
        return ResponseEntity.ok(ApiResponse.success(mentors));
    }

    @DeleteMapping("/tracks/{trackId}/mentors/{assignmentId}")
    @Operation(summary = "Remove a mentor assignment from a track")
    public ResponseEntity<ApiResponse<Void>> removeMentor(
            @PathVariable UUID eventId,
            @PathVariable UUID trackId,
            @PathVariable UUID assignmentId) {
        mentorAssignmentService.removeMentorAssignment(eventId, trackId, assignmentId);
        return ResponseEntity.ok(ApiResponse.success("Mentor assignment removed", null));
    }
}
