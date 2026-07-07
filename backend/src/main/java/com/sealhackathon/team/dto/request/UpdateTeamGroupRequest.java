package com.sealhackathon.team.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTeamGroupRequest {

    /** Null clears group assignment. */
    private UUID groupId;
}
