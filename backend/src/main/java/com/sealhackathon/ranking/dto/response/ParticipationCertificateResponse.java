package com.sealhackathon.ranking.dto.response;

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
public class ParticipationCertificateResponse {

    private UUID id;
    private UUID eventId;
    private UUID userId;
    private UUID teamId;
    private String userFullName;
    private String teamName;
    private LocalDateTime issuedAt;
}
