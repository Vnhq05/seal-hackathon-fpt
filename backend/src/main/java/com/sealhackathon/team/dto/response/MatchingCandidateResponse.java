package com.sealhackathon.team.dto.response;

import com.sealhackathon.common.enums.UserType;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchingCandidateResponse {

    private UUID userId;
    private String fullName;
    private UserType userType;
    private String universityName;
    private Integer semester;
    private String preferredRole;
    @Getter(onMethod_ = {@JsonProperty("isProfilePublic")})
    private boolean isProfilePublic;
    @Getter(onMethod_ = {@JsonProperty("hasPendingInvitation")})
    private boolean hasPendingInvitation;
}
