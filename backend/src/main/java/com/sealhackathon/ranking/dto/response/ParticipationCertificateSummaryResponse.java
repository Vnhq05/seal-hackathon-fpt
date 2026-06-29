package com.sealhackathon.ranking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipationCertificateSummaryResponse {

    private UUID eventId;
    private long issuedCount;
}
