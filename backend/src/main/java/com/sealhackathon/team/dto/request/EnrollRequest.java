package com.sealhackathon.team.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class EnrollRequest {

    private String fullName;
    private String email;
    private String studentId;
    private String universityName;
}
