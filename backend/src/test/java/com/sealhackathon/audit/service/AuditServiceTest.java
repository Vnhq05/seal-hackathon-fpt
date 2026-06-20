package com.sealhackathon.audit.service;

import com.sealhackathon.audit.domain.AuditLog;
import com.sealhackathon.audit.dto.request.AuditExportRequest;
import com.sealhackathon.audit.repository.AuditLogRepository;
import com.sealhackathon.common.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock private AuditLogRepository auditLogRepository;

    @InjectMocks private AuditService auditService;

    @Test
    void log_shouldPersistAllFields() {
        UUID actorId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(i -> {
            AuditLog a = i.getArgument(0);
            a = AuditLog.builder()
                    .actorId(a.getActorId()).action(a.getAction())
                    .targetId(a.getTargetId()).targetType(a.getTargetType())
                    .oldValue(a.getOldValue()).newValue(a.getNewValue())
                    .timestamp(a.getTimestamp()).ipAddress(a.getIpAddress())
                    .build();
            return a;
        });

        AuditLog result = auditService.log(actorId, "SCORE_CREATED", targetId, "JudgeScore",
                null, "{\"score\":80}", "192.168.1.1");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());

        AuditLog saved = captor.getValue();
        assertThat(saved.getActorId()).isEqualTo(actorId);
        assertThat(saved.getAction()).isEqualTo("SCORE_CREATED");
        assertThat(saved.getTargetId()).isEqualTo(targetId);
        assertThat(saved.getTargetType()).isEqualTo("JudgeScore");
        assertThat(saved.getIpAddress()).isEqualTo("192.168.1.1");
        assertThat(saved.getTimestamp()).isNotNull();
    }

    @Test
    void export_csv_shouldGenerateValidCsv() {
        UUID adminId = UUID.randomUUID();
        LocalDateTime from = LocalDateTime.of(2026, 1, 1, 0, 0);
        LocalDateTime to = LocalDateTime.of(2026, 12, 31, 23, 59);

        AuditLog log1 = AuditLog.builder()
                .actorId(UUID.randomUUID()).action("SCORE_CREATED")
                .targetId(UUID.randomUUID()).targetType("JudgeScore")
                .timestamp(LocalDateTime.of(2026, 6, 15, 10, 30))
                .build();

        when(auditLogRepository.findAllByTimestampRange(from, to)).thenReturn(List.of(log1));
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(i -> i.getArgument(0));

        AuditExportRequest request = AuditExportRequest.builder()
                .startDate(from).endDate(to)
                .format(AuditExportRequest.ExportFormat.CSV)
                .build();

        byte[] result = auditService.export(adminId, request, "127.0.0.1");
        String csv = new String(result);

        assertThat(csv).startsWith("id,actor_id,action,target_id,target_type");
        assertThat(csv).contains("SCORE_CREATED");

        // BR-55: meta-log the export
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    void export_json_shouldGenerateValidJson() {
        UUID adminId = UUID.randomUUID();
        LocalDateTime from = LocalDateTime.of(2026, 1, 1, 0, 0);
        LocalDateTime to = LocalDateTime.of(2026, 12, 31, 23, 59);

        when(auditLogRepository.findAllByTimestampRange(from, to)).thenReturn(List.of());
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(i -> i.getArgument(0));

        AuditExportRequest request = AuditExportRequest.builder()
                .startDate(from).endDate(to)
                .format(AuditExportRequest.ExportFormat.JSON)
                .build();

        byte[] result = auditService.export(adminId, request, "127.0.0.1");
        String json = new String(result);

        assertThat(json).startsWith("[");
    }

    @Test
    void export_shouldThrow_whenEndBeforeStart() {
        LocalDateTime from = LocalDateTime.of(2026, 12, 1, 0, 0);
        LocalDateTime to = LocalDateTime.of(2026, 1, 1, 0, 0);

        AuditExportRequest request = AuditExportRequest.builder()
                .startDate(from).endDate(to)
                .format(AuditExportRequest.ExportFormat.CSV)
                .build();

        assertThatThrownBy(() -> auditService.export(UUID.randomUUID(), request, "127.0.0.1"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("End date");
    }

    @Test
    void export_shouldCreateMetaLog() {
        UUID adminId = UUID.randomUUID();
        LocalDateTime from = LocalDateTime.of(2026, 6, 1, 0, 0);
        LocalDateTime to = LocalDateTime.of(2026, 6, 30, 23, 59);

        when(auditLogRepository.findAllByTimestampRange(from, to)).thenReturn(List.of());
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(i -> i.getArgument(0));

        AuditExportRequest request = AuditExportRequest.builder()
                .startDate(from).endDate(to)
                .format(AuditExportRequest.ExportFormat.JSON)
                .build();

        auditService.export(adminId, request, "10.0.0.1");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());

        AuditLog metaLog = captor.getValue();
        assertThat(metaLog.getAction()).isEqualTo("AUDIT_EXPORT");
        assertThat(metaLog.getActorId()).isEqualTo(adminId);
        assertThat(metaLog.getIpAddress()).isEqualTo("10.0.0.1");
        assertThat(metaLog.getNewValue()).contains("JSON");
    }
}
