package com.sealhackathon.team.controller;

import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.team.domain.enums.EnrollmentStatus;
import com.sealhackathon.team.dto.request.UpdateMatchingProfileRequest;
import com.sealhackathon.team.dto.response.EnrollmentResponse;
import com.sealhackathon.team.service.EventEnrollmentService;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events/{eventId}/enrollments")
@RequiredArgsConstructor
@Tag(name = "Event Enrollment", description = "Student enrollment in hackathon events")
@SecurityRequirement(name = "bearerAuth")
public class EnrollmentController {

    private final EventEnrollmentService enrollmentService;
    private final AuthPublicService authPublicService;

    @PostMapping
    @Operation(summary = "Enroll in an event (one event at a time)")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> enroll(
            @PathVariable UUID eventId) {
        UUID userId = authPublicService.getCurrentUserId();
        EnrollmentResponse response = enrollmentService.enroll(userId, eventId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Successfully joined the competition", response));
    }

    @GetMapping("/my")
    @Operation(summary = "Get my enrollment status for this event")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> getMyEnrollment(
            @PathVariable UUID eventId) {
        UUID userId = authPublicService.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(enrollmentService.getMyEnrollment(userId, eventId)));
    }

    @PutMapping("/my/matching-profile")
    @Operation(summary = "Update my team-matching profile for this event")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> updateMatchingProfile(
            @PathVariable UUID eventId,
            @Valid @RequestBody UpdateMatchingProfileRequest request) {
        UUID userId = authPublicService.getCurrentUserId();
        EnrollmentResponse response = enrollmentService.updateMatchingProfile(userId, eventId, request);
        return ResponseEntity.ok(ApiResponse.success("Matching profile updated", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "List enrollments for an event (Admin/Coordinator)")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> listEnrollments(
            @PathVariable UUID eventId,
            @RequestParam(required = false) EnrollmentStatus status) {
        return ResponseEntity.ok(ApiResponse.success(enrollmentService.listEnrollments(eventId, status)));
    }

    @GetMapping("/waiting-list")
    @Operation(summary = "Get waiting list (approved but not yet in a team)")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getWaitingList(
            @PathVariable UUID eventId) {
        UUID userId = authPublicService.getCurrentUserId();
        UserType role = authPublicService.getCurrentUserRole();
        if (role != UserType.SYSTEM_ADMIN && role != UserType.EVENT_COORDINATOR) {
            enrollmentService.requireCanViewWaitingList(userId, eventId);
        }
        return ResponseEntity.ok(ApiResponse.success(enrollmentService.getWaitingList(eventId)));
    }

    @PutMapping("/{enrollmentId}/approve")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Approve an enrollment")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> approve(
            @PathVariable UUID eventId,
            @PathVariable UUID enrollmentId) {
        return ResponseEntity.ok(ApiResponse.success("Enrollment approved", enrollmentService.approveEnrollment(enrollmentId)));
    }

    @PutMapping("/{enrollmentId}/reject")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'EVENT_COORDINATOR')")
    @Operation(summary = "Reject an enrollment")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> reject(
            @PathVariable UUID eventId,
            @PathVariable UUID enrollmentId) {
        return ResponseEntity.ok(ApiResponse.success("Enrollment rejected", enrollmentService.rejectEnrollment(enrollmentId)));
    }

    @PostMapping("/withdraw")
    @Operation(summary = "Withdraw enrollment from event")
    public ResponseEntity<ApiResponse<Void>> withdraw(
            @PathVariable UUID eventId) {
        UUID userId = authPublicService.getCurrentUserId();
        enrollmentService.withdrawEnrollment(userId, eventId);
        return ResponseEntity.ok(ApiResponse.success("Enrollment withdrawn", null));
    }
}
