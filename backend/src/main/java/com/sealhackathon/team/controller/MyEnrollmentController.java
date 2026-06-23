package com.sealhackathon.team.controller;

import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.team.dto.response.EnrollmentResponse;
import com.sealhackathon.team.service.EventEnrollmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
@Tag(name = "My Enrollment", description = "Current user enrollment status")
@SecurityRequirement(name = "bearerAuth")
public class MyEnrollmentController {

    private final EventEnrollmentService enrollmentService;
    private final AuthPublicService authPublicService;

    @GetMapping("/my-active")
    @Operation(summary = "Get my current active enrollment across all events")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> getMyActiveEnrollment() {
        UUID userId = authPublicService.getCurrentUserId();
        EnrollmentResponse response = enrollmentService.getMyActiveEnrollment(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
