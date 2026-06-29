package com.sealhackathon.feedback.controller;

import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.feedback.dto.request.SubmitParticipantFeedbackRequest;
import com.sealhackathon.feedback.dto.response.ParticipantFeedbackResponse;
import com.sealhackathon.feedback.dto.response.ParticipantFeedbackSummaryResponse;
import com.sealhackathon.feedback.service.ParticipantFeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events/{eventId}/participant-feedback")
@RequiredArgsConstructor
@Tag(name = "Participant Feedback", description = "Post-event participant review and feedback")
@SecurityRequirement(name = "bearerAuth")
public class ParticipantFeedbackController {

    private final ParticipantFeedbackService feedbackService;
    private final AuthPublicService authPublicService;

    @PostMapping
    @Operation(summary = "Submit post-event feedback (one per user per event)")
    public ResponseEntity<ApiResponse<ParticipantFeedbackResponse>> submitFeedback(
            @PathVariable UUID eventId,
            @Valid @RequestBody SubmitParticipantFeedbackRequest request) {
        UUID userId = authPublicService.getCurrentUserId();
        ParticipantFeedbackResponse response = feedbackService.submitFeedback(userId, eventId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Feedback submitted", response));
    }

    @GetMapping("/me")
    @Operation(summary = "Get the current user's feedback for an event")
    public ResponseEntity<ApiResponse<ParticipantFeedbackResponse>> getMyFeedback(
            @PathVariable UUID eventId) {
        UUID userId = authPublicService.getCurrentUserId();
        ParticipantFeedbackResponse response = feedbackService.getMyFeedback(userId, eventId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "List all participant feedback for an event")
    public ResponseEntity<ApiResponse<List<ParticipantFeedbackResponse>>> listFeedback(
            @PathVariable UUID eventId) {
        UserType role = authPublicService.getCurrentUserRole();
        List<ParticipantFeedbackResponse> feedback = feedbackService.listFeedback(eventId, role);
        return ResponseEntity.ok(ApiResponse.success(feedback));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Get aggregated participant feedback statistics")
    public ResponseEntity<ApiResponse<ParticipantFeedbackSummaryResponse>> getSummary(
            @PathVariable UUID eventId) {
        UserType role = authPublicService.getCurrentUserRole();
        ParticipantFeedbackSummaryResponse summary = feedbackService.getSummary(eventId, role);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}
