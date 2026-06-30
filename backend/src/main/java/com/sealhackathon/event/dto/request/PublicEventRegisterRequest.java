package com.sealhackathon.event.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PublicEventRegisterRequest {

    @NotBlank
    private String fullName;

    @NotBlank
    @Email
    private String email;

    private String studentId;

    private String universityName;
}
