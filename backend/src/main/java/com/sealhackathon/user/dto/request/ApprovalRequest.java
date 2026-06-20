package com.sealhackathon.user.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalRequest {

    @NotNull(message = "User ID is required")
    private UUID userId;

    @NotNull(message = "Action is required")
    private Action action;

    @Size(max = 500)
    private String reason;

    public enum Action {
        APPROVE,
        REJECT
    }
}
