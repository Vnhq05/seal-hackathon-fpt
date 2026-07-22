package com.sealhackathon.team.controller;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MyEnrollmentControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired private HackathonEventRepository eventRepository;

    private User student;
    private UUID completedEventId;
    private UUID cancelledEventId;
    private UUID activeEventId;

    @BeforeEach
    void setUp() {
        student = createStudent();
        LocalDate today = LocalDate.now();

        completedEventId = eventRepository.save(HackathonEvent.builder()
                .name("Completed Event")
                .season("Spring")
                .year(today.getYear())
                .registrationOpenDate(today.minusDays(60))
                .registrationDeadline(today.minusDays(40))
                .startDate(today.minusDays(30))
                .endDate(today.minusDays(20))
                .status(EventStatus.COMPLETED)
                .build()).getId();

        cancelledEventId = eventRepository.save(HackathonEvent.builder()
                .name("Cancelled Event")
                .season("Spring")
                .year(today.getYear())
                .registrationOpenDate(today.minusDays(60))
                .registrationDeadline(today.minusDays(40))
                .startDate(today.minusDays(10))
                .endDate(today.plusDays(10))
                .status(EventStatus.CANCELLED)
                .build()).getId();

        activeEventId = eventRepository.save(HackathonEvent.builder()
                .name("Active Event")
                .season("Summer")
                .year(today.getYear())
                .registrationOpenDate(today.minusDays(7))
                .registrationDeadline(today.plusDays(14))
                .startDate(today.plusDays(30))
                .endDate(today.plusDays(32))
                .status(EventStatus.OPEN)
                .build()).getId();
    }

    @Test
    void getMyEnrollments_shouldIncludeCompleted_andExcludeCancelled() throws Exception {
        seedApprovedEnrollment(student.getId(), completedEventId);
        seedApprovedEnrollment(student.getId(), cancelledEventId);

        mockMvc.perform(get("/api/enrollments/my")
                        .header("Authorization", "Bearer " + tokenFor(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].eventId", is(completedEventId.toString())));
    }

    @Test
    void getMyEnrollments_shouldReturnBothActiveAndCompleted() throws Exception {
        seedApprovedEnrollment(student.getId(), completedEventId);
        seedApprovedEnrollment(student.getId(), activeEventId);

        mockMvc.perform(get("/api/enrollments/my")
                        .header("Authorization", "Bearer " + tokenFor(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)));
    }

    @Test
    void getMyActiveEnrollment_shouldExcludeCompleted() throws Exception {
        seedApprovedEnrollment(student.getId(), completedEventId);

        mockMvc.perform(get("/api/enrollments/my-active")
                        .header("Authorization", "Bearer " + tokenFor(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    void getMyEnrollments_shouldReturnEmpty_whenNoEnrollments() throws Exception {
        mockMvc.perform(get("/api/enrollments/my")
                        .header("Authorization", "Bearer " + tokenFor(student)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));
    }
}
