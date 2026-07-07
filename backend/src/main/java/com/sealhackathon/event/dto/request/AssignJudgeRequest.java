package com.sealhackathon.event.dto.request;

import com.sealhackathon.event.domain.enums.AssignmentScope;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignJudgeRequest {

    @NotNull(message = "Judge user ID is required")
    private UUID judgeUserId;

    /** Explicit scope; inferred from trackId when omitted for backward compatibility. */
    private AssignmentScope scope;

    /** Required for TRACK and GROUP scopes. */
    private UUID trackId;

    /** Required for GROUP scope. */
    private UUID groupId;
}
