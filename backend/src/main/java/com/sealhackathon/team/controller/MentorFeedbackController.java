package com.sealhackathon.team.controller;

import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.team.dto.request.MentorFeedbackRequest;
import com.sealhackathon.team.dto.response.MentorFeedbackResponse;
import com.sealhackathon.team.service.MentorFeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/mentor")
@RequiredArgsConstructor
@Tag(name = "Mentor Feedback", description = "Mentor feedback for assigned teams")
@SecurityRequirement(name = "bearerAuth")
public class MentorFeedbackController {

    private final MentorFeedbackService feedbackService;
    private final AuthPublicService authPublicService;

    @PostMapping("/feedback")
    @PreAuthorize("hasRole('LECTURER')")
    @Operation(summary = "Submit feedback for an assigned team")
    public ResponseEntity<ApiResponse<MentorFeedbackResponse>> submitFeedback(
            @Valid @RequestBody MentorFeedbackRequest request) {
        UUID mentorId = authPublicService.getCurrentUserId();
        MentorFeedbackResponse response = feedbackService.submitFeedback(mentorId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Feedback submitted", response));
    }
}
