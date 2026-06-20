package com.sealhackathon.audit.controller;

import com.sealhackathon.audit.dto.request.AuditExportRequest;
import com.sealhackathon.audit.dto.response.AuditLogResponse;
import com.sealhackathon.audit.service.AuditService;
import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/audit")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
@Tag(name = "Audit", description = "Immutable audit log — view and export (BR-53, BR-54, BR-55)")
@SecurityRequirement(name = "bearerAuth")
public class AuditController {

    private final AuditService auditService;
    private final AuthPublicService authPublicService;

    @GetMapping
    @Operation(summary = "List audit logs with optional filters")
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> list(
            @RequestParam(required = false) UUID actorId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String targetType,
            @PageableDefault(size = 50, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AuditLogResponse> page = auditService.listByFilters(actorId, action, targetType, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/range")
    @Operation(summary = "List audit logs by time range")
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> listByRange(
            @RequestParam LocalDateTime from,
            @RequestParam LocalDateTime to,
            @PageableDefault(size = 50, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AuditLogResponse> page = auditService.listByTimeRange(from, to, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/target/{targetId}")
    @Operation(summary = "List audit logs for a specific target entity")
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> listByTarget(
            @PathVariable UUID targetId,
            @RequestParam String targetType,
            @PageableDefault(size = 50, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AuditLogResponse> page = auditService.listByTarget(targetId, targetType, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @PostMapping("/export")
    @Operation(summary = "Export audit logs as CSV or JSON (BR-55 — export itself is logged)")
    public ResponseEntity<byte[]> export(
            @Valid @RequestBody AuditExportRequest request,
            HttpServletRequest httpRequest) {
        UUID adminId = authPublicService.getCurrentUserId();
        String ipAddress = extractIp(httpRequest);

        byte[] data = auditService.export(adminId, request, ipAddress);

        String contentType;
        String extension;
        if (request.getFormat() == AuditExportRequest.ExportFormat.CSV) {
            contentType = "text/csv";
            extension = "csv";
        } else {
            contentType = MediaType.APPLICATION_JSON_VALUE;
            extension = "json";
        }

        String filename = "audit_export_" +
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) +
                "." + extension;

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(data);
    }

    private String extractIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
