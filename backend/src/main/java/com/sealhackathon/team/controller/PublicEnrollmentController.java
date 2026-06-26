package com.sealhackathon.team.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.team.dto.request.EnrollRequest;
import com.sealhackathon.team.dto.response.EnrollmentResponse;
import com.sealhackathon.team.service.EventEnrollmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/public/events/{eventId}/enrollments")
@RequiredArgsConstructor
@Tag(name = "Public Enrollment", description = "External student event registration without an account")
public class PublicEnrollmentController {

    private final EventEnrollmentService enrollmentService;

    @PostMapping
    @Operation(summary = "Register external student for an event (creates pending account + enrollment)")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> enrollExternal(
            @PathVariable UUID eventId,
            @Valid @RequestBody EnrollRequest request) {
        EnrollmentResponse response = enrollmentService.enrollExternal(eventId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration submitted. Awaiting coordinator approval.", response));
    }
}
