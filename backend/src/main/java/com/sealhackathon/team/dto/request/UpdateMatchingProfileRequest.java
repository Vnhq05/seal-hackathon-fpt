package com.sealhackathon.team.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMatchingProfileRequest {

    @JsonAlias("lookingForTeam")
    @Getter(onMethod_ = {@JsonProperty("isLookingForTeam")})
    @Setter(onMethod_ = {@JsonProperty("isLookingForTeam")})
    private boolean isLookingForTeam;

    @JsonAlias("profilePublic")
    @Getter(onMethod_ = {@JsonProperty("isProfilePublic")})
    @Setter(onMethod_ = {@JsonProperty("isProfilePublic")})
    private boolean isProfilePublic;

    @Size(max = 100)
    private String preferredRole;
}
