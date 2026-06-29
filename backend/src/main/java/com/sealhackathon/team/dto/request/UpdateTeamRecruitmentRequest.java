package com.sealhackathon.team.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.sealhackathon.team.domain.enums.HackathonSkillRole;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTeamRecruitmentRequest {

    @JsonAlias("recruiting")
    @Getter(onMethod_ = {@JsonProperty("isRecruiting")})
    @Setter(onMethod_ = {@JsonProperty("isRecruiting")})
    private boolean isRecruiting;

    @Size(max = 1000)
    private String recruitmentNote;

    @Size(max = 5)
    private List<HackathonSkillRole> neededRoles;
}
