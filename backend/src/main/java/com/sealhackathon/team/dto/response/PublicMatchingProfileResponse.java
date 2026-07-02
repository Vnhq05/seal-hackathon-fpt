package com.sealhackathon.team.dto.response;

import com.sealhackathon.common.enums.UserType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicMatchingProfileResponse {

    private UUID userId;
    private String fullName;
    private UserType userType;
    private String universityName;
    private Integer semester;
    private List<CompetitionHistoryItem> competitions;
}
