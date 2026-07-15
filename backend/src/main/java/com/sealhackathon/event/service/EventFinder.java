package com.sealhackathon.event.service;

import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.repository.HackathonEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventFinder {

    private final HackathonEventRepository eventRepository;

    public HackathonEvent getEvent(UUID eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
    }
}
