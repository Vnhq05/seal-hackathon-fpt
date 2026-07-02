package com.sealhackathon.event.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.event.dto.request.AssignEventStaffRequest;
import com.sealhackathon.event.dto.response.EventJudgeResponse;
import com.sealhackathon.event.dto.response.EventMentorResponse;
import com.sealhackathon.event.service.EventJudgeService;
import com.sealhackathon.event.service.EventMentorService;
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
@RequestMapping("/api/events/{eventId}/staff")
@RequiredArgsConstructor
@Tag(name = "Event Staff", description = "Event-level judge and mentor roster")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
public class EventStaffController {

    private final EventJudgeService eventJudgeService;
    private final EventMentorService eventMentorService;

    @GetMapping("/judges")
    @Operation(summary = "List judges assigned to an event")
    public ResponseEntity<ApiResponse<List<EventJudgeResponse>>> listJudges(@PathVariable UUID eventId) {
        return ResponseEntity.ok(ApiResponse.success(eventJudgeService.getEventJudges(eventId)));
    }

    @PostMapping("/judges")
    @Operation(summary = "Add a judge to an event")
    public ResponseEntity<ApiResponse<EventJudgeResponse>> assignJudge(
            @PathVariable UUID eventId,
            @Valid @RequestBody AssignEventStaffRequest request) {
        EventJudgeResponse response = eventJudgeService.assignEventJudge(eventId, request.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Judge added to event", response));
    }

    @DeleteMapping("/judges/{assignmentId}")
    @Operation(summary = "Remove a judge from an event")
    public ResponseEntity<ApiResponse<Void>> removeJudge(
            @PathVariable UUID eventId,
            @PathVariable UUID assignmentId) {
        eventJudgeService.removeEventJudge(eventId, assignmentId);
        return ResponseEntity.ok(ApiResponse.success("Judge removed from event", null));
    }

    @GetMapping("/mentors")
    @Operation(summary = "List mentors assigned to an event")
    public ResponseEntity<ApiResponse<List<EventMentorResponse>>> listMentors(@PathVariable UUID eventId) {
        return ResponseEntity.ok(ApiResponse.success(eventMentorService.getEventMentors(eventId)));
    }

    @PostMapping("/mentors")
    @Operation(summary = "Add a mentor to an event")
    public ResponseEntity<ApiResponse<EventMentorResponse>> assignMentor(
            @PathVariable UUID eventId,
            @Valid @RequestBody AssignEventStaffRequest request) {
        EventMentorResponse response = eventMentorService.assignEventMentor(eventId, request.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Mentor added to event", response));
    }

    @DeleteMapping("/mentors/{assignmentId}")
    @Operation(summary = "Remove a mentor from an event")
    public ResponseEntity<ApiResponse<Void>> removeMentor(
            @PathVariable UUID eventId,
            @PathVariable UUID assignmentId) {
        eventMentorService.removeEventMentor(eventId, assignmentId);
        return ResponseEntity.ok(ApiResponse.success("Mentor removed from event", null));
    }
}
