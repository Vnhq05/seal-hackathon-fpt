package com.sealhackathon.team.dto.request;

import com.sealhackathon.common.enums.StudentStanding;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class EnrollRequest {

    @NotBlank
    private String fullName;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String studentId;

    @NotBlank
    private String universityName;

    @NotNull(message = "Student standing is required")
    private StudentStanding studentStanding;
}
