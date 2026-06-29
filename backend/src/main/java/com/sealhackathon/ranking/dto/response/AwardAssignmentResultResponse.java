package com.sealhackathon.ranking.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AwardAssignmentResultResponse {

    private List<TeamAwardResponse> teamAwards;
    private int participationCertificatesIssued;
    private List<ParticipationCertificateResponse> participationCertificates;
}
