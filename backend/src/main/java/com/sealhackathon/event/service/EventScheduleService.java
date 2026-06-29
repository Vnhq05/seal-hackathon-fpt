package com.sealhackathon.event.service;

import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.EventSchedule;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.dto.response.EventScheduleResponse;
import com.sealhackathon.event.repository.EventScheduleRepository;
import com.sealhackathon.event.repository.HackathonEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventScheduleService {

    private final EventScheduleRepository scheduleRepository;
    private final HackathonEventRepository eventRepository;

    @Transactional(readOnly = true)
    public List<EventScheduleResponse> getSchedule(UUID eventId) {
        ensureEventExists(eventId);
        return scheduleRepository.findByEventIdOrderBySortOrderAscStartTimeAsc(eventId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void seedSchedules(HackathonEvent event, List<EventSchedule> schedules) {
        scheduleRepository.deleteByEventId(event.getId());
        for (EventSchedule schedule : schedules) {
            schedule.setEventId(event.getId());
            scheduleRepository.save(schedule);
        }
    }

    private EventScheduleResponse toResponse(EventSchedule s) {
        return EventScheduleResponse.builder()
                .id(s.getId())
                .eventId(s.getEventId())
                .type(s.getType())
                .title(s.getTitle())
                .description(s.getDescription())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .gate(s.getGate())
                .sortOrder(s.getSortOrder())
                .build();
    }

    private void ensureEventExists(UUID eventId) {
        eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
    }
}
