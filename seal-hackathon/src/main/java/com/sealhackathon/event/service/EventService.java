package com.sealhackathon.event.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.dto.request.CreateEventRequest;
import com.sealhackathon.event.dto.request.UpdateEventRequest;
import com.sealhackathon.event.dto.response.EventResponse;
import com.sealhackathon.event.event.EventActivatedEvent;
import com.sealhackathon.event.event.EventConfigChangedEvent;
import com.sealhackathon.event.event.EventCreatedEvent;
import com.sealhackathon.event.repository.HackathonEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventService {

    private final HackathonEventRepository eventRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public EventResponse createEvent(CreateEventRequest request) {
        validateDateRange(request.getStartDate(), request.getEndDate());

        if (eventRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Event", "name", request.getName());
        }

        HackathonEvent event = HackathonEvent.builder()
                .name(request.getName())
                .season(request.getSeason())
                .year(request.getYear())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .registrationDeadline(request.getRegistrationDeadline())
                .build();

        event = eventRepository.save(event);

        eventPublisher.publishEvent(new EventCreatedEvent(
                event.getId(), event.getName(), event.getCreatedBy()));

        return toResponse(event);
    }

    @Transactional
    public EventResponse updateEvent(UUID eventId, UpdateEventRequest request) {
        HackathonEvent event = getEvent(eventId);

        if (event.getStatus() == EventStatus.ACTIVE) {
            throw new BusinessException(
                    "Cannot modify event after activation. Contact admin for changes requiring audit justification.",
                    HttpStatus.BAD_REQUEST) {};
        }

        validateDateRange(request.getStartDate(), request.getEndDate());

        if (eventRepository.existsByNameAndIdNot(request.getName(), eventId)) {
            throw new DuplicateResourceException("Event", "name", request.getName());
        }

        event.setName(request.getName());
        event.setSeason(request.getSeason());
        event.setYear(request.getYear());
        event.setStartDate(request.getStartDate());
        event.setEndDate(request.getEndDate());
        event.setRegistrationDeadline(request.getRegistrationDeadline());

        event = eventRepository.save(event);
        return toResponse(event);
    }

    @Transactional
    public EventResponse activateEvent(UUID eventId) {
        HackathonEvent event = getEvent(eventId);

        if (event.getStatus() != EventStatus.DRAFT) {
            throw new BusinessException(
                    "Only DRAFT events can be activated. Current status: " + event.getStatus(),
                    HttpStatus.BAD_REQUEST) {};
        }

        event.setStatus(EventStatus.ACTIVE);
        event = eventRepository.save(event);

        eventPublisher.publishEvent(new EventActivatedEvent(eventId));

        return toResponse(event);
    }

    @Transactional
    public EventResponse completeEvent(UUID eventId) {
        HackathonEvent event = getEvent(eventId);

        if (event.getStatus() != EventStatus.ACTIVE) {
            throw new BusinessException(
                    "Only ACTIVE events can be completed. Current status: " + event.getStatus(),
                    HttpStatus.BAD_REQUEST) {};
        }

        event.setStatus(EventStatus.COMPLETED);
        event = eventRepository.save(event);
        return toResponse(event);
    }

    @Transactional
    public EventResponse cancelEvent(UUID eventId) {
        HackathonEvent event = getEvent(eventId);

        if (event.getStatus() == EventStatus.COMPLETED) {
            throw new BusinessException("Cannot cancel a completed event", HttpStatus.BAD_REQUEST) {};
        }

        event.setStatus(EventStatus.CANCELLED);
        event = eventRepository.save(event);
        return toResponse(event);
    }

    @Transactional(readOnly = true)
    public EventResponse getEventById(UUID eventId) {
        return toResponse(getEvent(eventId));
    }

    @Transactional(readOnly = true)
    public Page<EventResponse> listEvents(EventStatus status, Pageable pageable) {
        Page<HackathonEvent> page = (status != null)
                ? eventRepository.findByStatus(status, pageable)
                : eventRepository.findAll(pageable);
        return page.map(this::toResponse);
    }

    HackathonEvent getEvent(UUID eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
    }

    private void validateDateRange(java.time.LocalDate start, java.time.LocalDate end) {
        if (!end.isAfter(start)) {
            throw new BusinessException("End date must be after start date", HttpStatus.BAD_REQUEST) {};
        }
    }

    EventResponse toResponse(HackathonEvent event) {
        return EventResponse.builder()
                .id(event.getId())
                .name(event.getName())
                .season(event.getSeason())
                .year(event.getYear())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .registrationDeadline(event.getRegistrationDeadline())
                .status(event.getStatus())
                .roundCount(event.getRounds().size())
                .mentorCount(event.getMentorAssignments().size())
                .createdAt(event.getCreatedAt())
                .build();
    }
}
