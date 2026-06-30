package com.sealhackathon.team.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class EnrollmentActionResult {

    private final EnrollmentResponse enrollment;
    private final String message;
}
