package com.sealhackathon.submission.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.submission.dto.request.CreateSubmissionRequest;
import com.sealhackathon.submission.dto.response.SubmissionResponse;
import com.sealhackathon.submission.dto.response.SubmissionVersionResponse;
import com.sealhackathon.submission.service.SubmissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rounds/{roundId}/submissions")
@RequiredArgsConstructor
@Tag(name = "Submissions", description = "Submission management (BR-25 to BR-33)")
@SecurityRequirement(name = "bearerAuth")
public class SubmissionController {

    private final SubmissionService submissionService;
    private final AuthPublicService authPublicService;
    private final ObjectMapper objectMapper;
    private final Validator validator;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Submit or re-submit (BR-25, BR-30, BR-31, BR-32)")
    public ResponseEntity<ApiResponse<SubmissionResponse>> submit(
            @PathVariable UUID roundId,
            @RequestPart("submission") String submissionJson,
            @RequestPart(value = "pdf", required = false) MultipartFile pdfFile) {
        CreateSubmissionRequest request = parseAndValidateSubmission(submissionJson);
        UUID userId = authPublicService.getCurrentUserId();
        SubmissionResponse response = submissionService.submit(userId, roundId, request, pdfFile);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Submission successful", response));
    }

    private CreateSubmissionRequest parseAndValidateSubmission(String submissionJson) {
        CreateSubmissionRequest request;
        try {
            request = objectMapper.readValue(submissionJson, CreateSubmissionRequest.class);
        } catch (JsonProcessingException e) {
            throw new BusinessException(
                    "Invalid submission JSON: " + e.getOriginalMessage(),
                    HttpStatus.BAD_REQUEST) {};
        }

        Set<ConstraintViolation<CreateSubmissionRequest>> violations = validator.validate(request);
        if (!violations.isEmpty()) {
            String message = violations.stream()
                    .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                    .collect(Collectors.joining("; "));
            throw new BusinessException(message, HttpStatus.BAD_REQUEST) {};
        }

        return request;
    }

    @GetMapping
    @Operation(summary = "List all submissions for a round")
    public ResponseEntity<ApiResponse<List<SubmissionResponse>>> getSubmissions(
            @PathVariable UUID roundId) {
        UUID userId = authPublicService.getCurrentUserId();
        var role = authPublicService.getCurrentUserRole();
        List<SubmissionResponse> submissions =
                submissionService.getSubmissionsByRound(roundId, userId, role);
        return ResponseEntity.ok(ApiResponse.success(submissions));
    }

    @GetMapping("/{submissionId}")
    @Operation(summary = "Get submission by ID")
    public ResponseEntity<ApiResponse<SubmissionResponse>> getSubmission(
            @PathVariable UUID roundId, @PathVariable UUID submissionId) {
        UUID userId = authPublicService.getCurrentUserId();
        var role = authPublicService.getCurrentUserRole();
        SubmissionResponse response = submissionService.getSubmissionById(
                roundId, submissionId, userId, role);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/team/{teamId}")
    @Operation(summary = "Get submission by team and round")
    public ResponseEntity<ApiResponse<SubmissionResponse>> getByTeam(
            @PathVariable UUID roundId, @PathVariable UUID teamId) {
        UUID userId = authPublicService.getCurrentUserId();
        var role = authPublicService.getCurrentUserRole();
        SubmissionResponse response = submissionService.getSubmissionByTeamAndRound(
                teamId, roundId, userId, role);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{submissionId}/versions")
    @Operation(summary = "Get version history (BR-30)")
    public ResponseEntity<ApiResponse<List<SubmissionVersionResponse>>> getVersions(
            @PathVariable UUID roundId, @PathVariable UUID submissionId) {
        List<SubmissionVersionResponse> versions = submissionService.getVersionHistory(roundId, submissionId);
        return ResponseEntity.ok(ApiResponse.success(versions));
    }

    @GetMapping("/mentor")
    @Operation(summary = "Mentor: view assigned teams' submissions (BR-33)")
    public ResponseEntity<ApiResponse<List<SubmissionResponse>>> getMentorSubmissions(
            @PathVariable UUID roundId,
            @RequestParam UUID eventId) {
        UUID mentorId = authPublicService.getCurrentUserId();
        List<SubmissionResponse> submissions = submissionService.getSubmissionsByMentor(mentorId, eventId, roundId);
        return ResponseEntity.ok(ApiResponse.success(submissions));
    }
}
