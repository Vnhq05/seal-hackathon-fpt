package com.sealhackathon.team.dto.request;

import com.sealhackathon.common.enums.StudentStanding;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
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

    @Min(1)
    @Max(10)
    private Integer semester;
}
