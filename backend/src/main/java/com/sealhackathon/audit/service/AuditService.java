package com.sealhackathon.audit.service;

import com.sealhackathon.audit.domain.AuditLog;
import com.sealhackathon.audit.dto.request.AuditExportRequest;
import com.sealhackathon.audit.dto.response.AuditLogResponse;
import com.sealhackathon.audit.repository.AuditLogRepository;
import com.sealhackathon.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    private static final DateTimeFormatter CSV_DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Transactional
    public AuditLog log(UUID actorId, String action, UUID targetId, String targetType,
                        String oldValue, String newValue, String ipAddress) {
        return auditLogRepository.save(AuditLog.builder()
                .actorId(actorId)
                .action(action)
                .targetId(targetId)
                .targetType(targetType)
                .oldValue(oldValue)
                .newValue(newValue)
                .timestamp(LocalDateTime.now())
                .ipAddress(ipAddress)
                .build());
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> list(Pageable pageable) {
        return auditLogRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> listByFilters(UUID actorId, String action,
                                                 String targetType, Pageable pageable) {
        return auditLogRepository.findByFilters(actorId, action, targetType, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> listByTimeRange(LocalDateTime from, LocalDateTime to,
                                                   Pageable pageable) {
        return auditLogRepository.findByTimestampRange(from, to, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> listByTarget(UUID targetId, String targetType,
                                                Pageable pageable) {
        return auditLogRepository.findByTargetIdAndTargetType(targetId, targetType, pageable)
                .map(this::toResponse);
    }

    // ── BR-55: Export (CSV or JSON) — meta-logged ──
    @Transactional
    public byte[] export(UUID adminId, AuditExportRequest request, String ipAddress) {
        if (!request.getEndDate().isAfter(request.getStartDate())) {
            throw new BusinessException("End date must be after start date",
                    HttpStatus.BAD_REQUEST) {};
        }

        List<AuditLog> logs = auditLogRepository.findAllByTimestampRange(
                request.getStartDate(), request.getEndDate());

        byte[] result;
        if (request.getFormat() == AuditExportRequest.ExportFormat.CSV) {
            result = exportCsv(logs);
        } else {
            result = exportJson(logs);
        }

        // BR-55: meta-log the export itself
        auditLogRepository.save(AuditLog.builder()
                .actorId(adminId)
                .action("AUDIT_EXPORT")
                .targetType("AuditLog")
                .newValue(String.format("{\"format\":\"%s\",\"from\":\"%s\",\"to\":\"%s\",\"count\":%d}",
                        request.getFormat(), request.getStartDate(), request.getEndDate(), logs.size()))
                .timestamp(LocalDateTime.now())
                .ipAddress(ipAddress)
                .build());

        return result;
    }

    private byte[] exportCsv(List<AuditLog> logs) {
        StringBuilder sb = new StringBuilder();
        sb.append("id,actor_id,action,target_id,target_type,old_value,new_value,timestamp,ip_address\n");

        for (AuditLog log : logs) {
            sb.append(log.getId()).append(',');
            sb.append(log.getActorId()).append(',');
            sb.append(escapeCsv(log.getAction())).append(',');
            sb.append(log.getTargetId() != null ? log.getTargetId() : "").append(',');
            sb.append(escapeCsv(log.getTargetType())).append(',');
            sb.append(escapeCsv(log.getOldValue())).append(',');
            sb.append(escapeCsv(log.getNewValue())).append(',');
            sb.append(log.getTimestamp().format(CSV_DATE)).append(',');
            sb.append(log.getIpAddress() != null ? log.getIpAddress() : "");
            sb.append('\n');
        }

        return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    private byte[] exportJson(List<AuditLog> logs) {
        List<AuditLogResponse> responses = logs.stream().map(this::toResponse).toList();
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper =
                    new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.findAndRegisterModules();
            return mapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(responses);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new BusinessException("Failed to serialize audit logs",
                    HttpStatus.INTERNAL_SERVER_ERROR) {};
        }
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .actorId(log.getActorId())
                .action(log.getAction())
                .targetId(log.getTargetId())
                .targetType(log.getTargetType())
                .oldValue(log.getOldValue())
                .newValue(log.getNewValue())
                .timestamp(log.getTimestamp())
                .ipAddress(log.getIpAddress())
                .build();
    }
}
