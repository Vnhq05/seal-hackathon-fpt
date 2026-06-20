package com.sealhackathon.event.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.event.dto.request.AssignJudgeRequest;
import com.sealhackathon.event.dto.request.AssignMentorRequest;
import com.sealhackathon.event.dto.response.JudgeAssignmentResponse;
import com.sealhackathon.event.dto.response.MentorAssignmentResponse;
import com.sealhackathon.event.service.JudgeAssignmentService;
import com.sealhackathon.event.service.MentorAssignmentService;
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
@Tag(name = "Assignments", description = "Judge and mentor assignments (BR-13, BR-14)")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
public class AssignmentController {

    private final JudgeAssignmentService judgeAssignmentService;
    private final MentorAssignmentService mentorAssignmentService;

    // ═══════════════════════════════════════
    //  Judge Assignments — BR-13 (per round)
    // ═══════════════════════════════════════

    @PostMapping("/rounds/{roundId}/judges")
    @Operation(summary = "Assign a judge to a round (BR-13)")
    public ResponseEntity<ApiResponse<JudgeAssignmentResponse>> assignJudge(
            @PathVariable UUID eventId, @PathVariable UUID roundId,
            @Valid @RequestBody AssignJudgeRequest request) {
        JudgeAssignmentResponse response = judgeAssignmentService.assignJudge(roundId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Judge assigned to round", response));
    }

    @GetMapping("/rounds/{roundId}/judges")
    @Operation(summary = "List judges assigned to a round")
    public ResponseEntity<ApiResponse<List<JudgeAssignmentResponse>>> getJudges(
            @PathVariable UUID eventId, @PathVariable UUID roundId) {
        List<JudgeAssignmentResponse> judges = judgeAssignmentService.getJudgesByRound(roundId);
        return ResponseEntity.ok(ApiResponse.success(judges));
    }

    @DeleteMapping("/rounds/{roundId}/judges/{assignmentId}")
    @Operation(summary = "Remove a judge assignment")
    public ResponseEntity<ApiResponse<Void>> removeJudge(
            @PathVariable UUID eventId, @PathVariable UUID roundId,
            @PathVariable UUID assignmentId) {
        judgeAssignmentService.removeJudgeAssignment(assignmentId);
        return ResponseEntity.ok(ApiResponse.success("Judge assignment removed", null));
    }

    // ═══════════════════════════════════════
    //  Mentor Assignments — BR-14 (per event)
    // ═══════════════════════════════════════

    @PostMapping("/mentors")
    @Operation(summary = "Assign a mentor to the event (BR-14)")
    public ResponseEntity<ApiResponse<MentorAssignmentResponse>> assignMentor(
            @PathVariable UUID eventId,
            @Valid @RequestBody AssignMentorRequest request) {
        MentorAssignmentResponse response = mentorAssignmentService.assignMentor(eventId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Mentor assigned to event", response));
    }

    @GetMapping("/mentors")
    @Operation(summary = "List mentors assigned to the event")
    public ResponseEntity<ApiResponse<List<MentorAssignmentResponse>>> getMentors(
            @PathVariable UUID eventId) {
        List<MentorAssignmentResponse> mentors = mentorAssignmentService.getMentorsByEvent(eventId);
        return ResponseEntity.ok(ApiResponse.success(mentors));
    }

    @DeleteMapping("/mentors/{assignmentId}")
    @Operation(summary = "Remove a mentor assignment")
    public ResponseEntity<ApiResponse<Void>> removeMentor(
            @PathVariable UUID eventId, @PathVariable UUID assignmentId) {
        mentorAssignmentService.removeMentorAssignment(assignmentId);
        return ResponseEntity.ok(ApiResponse.success("Mentor assignment removed", null));
    }
}
