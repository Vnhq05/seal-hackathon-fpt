package com.sealhackathon.event.service;

import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.enums.EventStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

/**
 * Derives the live event status from dates. {@link EventStatus#CANCELLED},
 * {@link EventStatus#COMPLETED}, {@link EventStatus#CLOSED_REGISTRATION}, and
 * {@link EventStatus#SCORING} are kept as hard overrides from persisted state.
 */
@Service
public class EventStatusResolver {

    public EventStatus resolveStatus(HackathonEvent event) {
        if (event.getStatus() == EventStatus.CANCELLED) {
            return EventStatus.CANCELLED;
        }
        if (event.getStatus() == EventStatus.COMPLETED) {
            return EventStatus.COMPLETED;
        }
        if (event.getStatus() == EventStatus.CLOSED_REGISTRATION
                || event.getStatus() == EventStatus.SCORING) {
            return event.getStatus();
        }

        LocalDate today = LocalDate.now();

        if (today.isAfter(event.getEndDate())) {
            return EventStatus.COMPLETED;
        }
        if (!today.isBefore(event.getStartDate())) {
            return EventStatus.ACTIVE;
        }
        if (event.getRegistrationOpenDate() != null
                && !today.isBefore(event.getRegistrationOpenDate())) {
            return EventStatus.OPEN;
        }
        return EventStatus.UPCOMING;
    }
}
