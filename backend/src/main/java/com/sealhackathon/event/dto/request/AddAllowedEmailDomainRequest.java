package com.sealhackathon.event.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AddAllowedEmailDomainRequest {

    @NotBlank(message = "Domain is required")
    @Size(max = 255)
    private String domain;

    @Size(max = 255)
    private String universityLabel;
}
