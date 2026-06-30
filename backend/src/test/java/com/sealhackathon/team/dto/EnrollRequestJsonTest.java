package com.sealhackathon.team.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sealhackathon.common.enums.StudentStanding;
import com.sealhackathon.team.dto.request.EnrollRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

import static org.assertj.core.api.Assertions.assertThat;

class EnrollRequestJsonTest {

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = Jackson2ObjectMapperBuilder.json().build();
    }

    @Test
    void deserializeEnrollRequest_includesSemester() throws Exception {
        EnrollRequest request = objectMapper.readValue(
                """
                {
                  "fullName": "Ngô Lê Phúc An",
                  "email": "23654471.an@student.iuh.edu.vn",
                  "studentId": "23654471",
                  "universityName": "Industrial University of Ho Chi Minh City",
                  "studentStanding": "ENROLLED",
                  "semester": 7
                }
                """,
                EnrollRequest.class);

        assertThat(request.getFullName()).isEqualTo("Ngô Lê Phúc An");
        assertThat(request.getSemester()).isEqualTo(7);
        assertThat(request.getStudentStanding()).isEqualTo(StudentStanding.ENROLLED);
    }
}
