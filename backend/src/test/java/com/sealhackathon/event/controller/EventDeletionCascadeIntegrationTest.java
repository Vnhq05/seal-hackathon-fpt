package com.sealhackathon.event.controller;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.user.domain.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Guards V12 plus the deletion cleanup: event_schedules, allowed_email_domains and track_draw_sessions
 * reference an event but are not JPA-cascaded from it, so deleting an event used to orphan them. The
 * V12 FK would now block that delete unless EventService.deleteEvent removes them first -- this drives
 * the whole path and asserts both that the delete succeeds and that nothing is left behind.
 */
class EventDeletionCascadeIntegrationTest extends BaseIntegrationTest {

    @Autowired private JdbcTemplate jdbc;

    @Test
    void deleteEvent_removesScheduleDomainAndDrawSessionChildren() throws Exception {
        User admin = createAdmin();
        UUID eventId = seedDeletableEvent();

        UUID scheduleId = UUID.randomUUID();
        jdbc.update("INSERT INTO event_schedules "
                        + "(id, event_id, type, title, start_time, end_time, sort_order, created_at, updated_at) "
                        + "VALUES (?, ?, N'WORKSHOP', N'Khai mạc', SYSUTCDATETIME(), SYSUTCDATETIME(), 0, "
                        + "SYSUTCDATETIME(), SYSUTCDATETIME())",
                scheduleId, eventId);
        jdbc.update("INSERT INTO allowed_email_domains (id, event_id, domain, created_at, updated_at) "
                        + "VALUES (?, ?, N'fpt.edu.vn', SYSUTCDATETIME(), SYSUTCDATETIME())",
                UUID.randomUUID(), eventId);
        jdbc.update("INSERT INTO track_draw_sessions "
                        + "(id, event_id, status, current_index, created_at, updated_at) "
                        + "VALUES (?, ?, N'OPEN', 0, SYSUTCDATETIME(), SYSUTCDATETIME())",
                UUID.randomUUID(), eventId);

        mockMvc.perform(delete("/api/events/" + eventId)
                        .header("Authorization", "Bearer " + tokenFor(admin)))
                .andExpect(status().isOk());

        assertThat(childCount("event_schedules", eventId)).isZero();
        assertThat(childCount("allowed_email_domains", eventId)).isZero();
        assertThat(childCount("track_draw_sessions", eventId)).isZero();
        assertThat(jdbc.queryForObject(
                "SELECT COUNT(*) FROM hackathon_events WHERE id = ?", Integer.class, eventId)).isZero();
    }

    private Integer childCount(String table, UUID eventId) {
        return jdbc.queryForObject(
                "SELECT COUNT(*) FROM " + table + " WHERE event_id = ?", Integer.class, eventId);
    }

    /** UPCOMING event (registration not yet open), which deleteEvent permits. */
    private UUID seedDeletableEvent() {
        LocalDate today = LocalDate.now();
        HackathonEvent event = eventRepository.save(HackathonEvent.builder()
                .name("Deletable Event")
                .season("Summer")
                .year(today.getYear())
                .startDate(today.plusDays(30))
                .endDate(today.plusDays(60))
                .registrationOpenDate(today.plusDays(10))
                .registrationDeadline(today.plusDays(20))
                .status(EventStatus.UPCOMING)
                .build());
        return event.getId();
    }
}
