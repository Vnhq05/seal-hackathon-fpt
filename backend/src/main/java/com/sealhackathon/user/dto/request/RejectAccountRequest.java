package com.sealhackathon.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RejectAccountRequest {

    @NotBlank(message = "Reason is required when rejecting an account")
    private String reason;
}
