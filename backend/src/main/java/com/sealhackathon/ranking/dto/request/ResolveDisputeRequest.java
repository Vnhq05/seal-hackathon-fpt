package com.sealhackathon.ranking.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResolveDisputeRequest {

    @NotNull(message = "Action is required")
    private Action action;

    @NotBlank(message = "Resolution is required")
    @Size(max = 2000)
    private String resolution;

    public enum Action {
        RESOLVE,
        REJECT
    }
}
