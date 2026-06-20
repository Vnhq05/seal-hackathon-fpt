package com.sealhackathon.audit.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {

    private UUID id;
    private UUID actorId;
    private String action;
    private UUID targetId;
    private String targetType;
    private String oldValue;
    private String newValue;
    private LocalDateTime timestamp;
    private String ipAddress;
}
