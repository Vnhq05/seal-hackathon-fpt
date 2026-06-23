package com.sealhackathon.event.service;

import com.sealhackathon.audit.service.AuditService;
import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.HonoredGuest;
import com.sealhackathon.event.domain.MentorAssignment;
import com.sealhackathon.event.domain.Prize;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.dto.request.CreateEventRequest;
import com.sealhackathon.event.dto.request.UpdateEventRequest;
import com.sealhackathon.event.dto.response.EventResponse;
import com.sealhackathon.event.dto.response.HonoredGuestResponse;
import com.sealhackathon.event.dto.response.PrizeResponse;
import com.sealhackathon.event.dto.response.TrackResponse;
import com.sealhackathon.event.event.EventCreatedEvent;
import com.sealhackathon.event.repository.HackathonEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventService {

    private final HackathonEventRepository eventRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final AuditService auditService;
    private final AuthPublicService authPublicService;

    @Transactional
    public EventResponse createEvent(CreateEventRequest request) {
        validateYear(request.getYear());
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
                .description(request.getDescription())
                .location(request.getLocation())
                .format(request.getFormat() != null ? request.getFormat() : "OFFLINE")
                .registrationOpenDate(request.getRegistrationOpenDate())
                .minTeam(request.getMinTeam())
                .maxTeam(request.getMaxTeam())
                .semesterMin(request.getSemesterMin())
                .semesterMax(request.getSemesterMax())
                .scoringTemplateId(request.getScoringTemplateId())
                .tiebreakerCriteria(request.getTiebreakerCriteria())
                .status(EventStatus.UPCOMING)
                .build();

        if (request.getTracks() != null) {
            request.getTracks().forEach(t -> {
                Track track = Track.builder()
                        .hackathonEvent(event)
                        .name(t.getName())
                        .description(t.getDescription())
                        .maxTeams(t.getMaxTeams())
                        .scoringTemplateId(t.getScoringTemplateId())
                        .build();
                event.getTracks().add(track);
            });
        }

        if (request.getPrizes() != null) {
            request.getPrizes().forEach(p -> {
                Prize prize = Prize.builder()
                        .hackathonEvent(event)
                        .trackId(p.getTrackId())
                        .rank(p.getRank())
                        .value(p.getValue())
                        .quantity(p.getQuantity())
                        .build();
                event.getPrizes().add(prize);
            });
        }

        if (request.getHonoredGuests() != null) {
            request.getHonoredGuests().forEach(g -> {
                HonoredGuest guest = HonoredGuest.builder()
                        .hackathonEvent(event)
                        .fullName(g.getFullName())
                        .title(g.getTitle())
                        .build();
                event.getHonoredGuests().add(guest);
            });
        }

        if (request.getMentorUserIds() != null) {
            request.getMentorUserIds().forEach(mentorId -> {
                MentorAssignment assignment = MentorAssignment.builder()
                        .hackathonEvent(event)
                        .mentorUserId(mentorId)
                        .assignedAt(LocalDateTime.now())
                        .build();
                event.getMentorAssignments().add(assignment);
            });
        }

        HackathonEvent saved = eventRepository.save(event);

        eventPublisher.publishEvent(new EventCreatedEvent(
                saved.getId(), saved.getName(), saved.getCreatedBy()));

        return toResponse(saved);
    }

    @Transactional
    public EventResponse updateEvent(UUID eventId, UpdateEventRequest request, String ipAddress) {
        HackathonEvent event = getEvent(eventId);
        enforceOwnership(event);

        EventStatus liveStatus = resolveStatus(event);
        if (liveStatus == EventStatus.ACTIVE || liveStatus == EventStatus.COMPLETED) {
            throw new BusinessException(
                    "Cannot modify event during or after the competition period.",
                    HttpStatus.BAD_REQUEST) {};
        }

        validateYear(request.getYear());
        validateDateRange(request.getStartDate(), request.getEndDate());

        if (eventRepository.existsByNameAndIdNot(request.getName(), eventId)) {
            throw new DuplicateResourceException("Event", "name", request.getName());
        }

        String oldName = event.getName();

        event.setName(request.getName());
        event.setSeason(request.getSeason());
        event.setYear(request.getYear());
        event.setStartDate(request.getStartDate());
        event.setEndDate(request.getEndDate());
        event.setRegistrationDeadline(request.getRegistrationDeadline());
        event.setDescription(request.getDescription());
        event.setLocation(request.getLocation());
        event.setFormat(request.getFormat() != null ? request.getFormat() : "OFFLINE");
        event.setRegistrationOpenDate(request.getRegistrationOpenDate());
        event.setMinTeam(request.getMinTeam());
        event.setMaxTeam(request.getMaxTeam());
        event.setSemesterMin(request.getSemesterMin());
        event.setSemesterMax(request.getSemesterMax());
        event.setScoringTemplateId(request.getScoringTemplateId());
        event.setTiebreakerCriteria(request.getTiebreakerCriteria());

        if (request.getPrizes() != null) {
            event.getPrizes().clear();
            request.getPrizes().forEach(p -> {
                Prize prize = Prize.builder()
                        .hackathonEvent(event)
                        .trackId(p.getTrackId())
                        .rank(p.getRank())
                        .value(p.getValue())
                        .quantity(p.getQuantity())
                        .build();
                event.getPrizes().add(prize);
            });
        }

        if (request.getHonoredGuests() != null) {
            event.getHonoredGuests().clear();
            request.getHonoredGuests().forEach(g -> {
                HonoredGuest guest = HonoredGuest.builder()
                        .hackathonEvent(event)
                        .fullName(g.getFullName())
                        .title(g.getTitle())
                        .build();
                event.getHonoredGuests().add(guest);
            });
        }

        EventResponse response = toResponse(eventRepository.save(event));

        auditService.log(
                authPublicService.getCurrentUserId(),
                "EVENT_UPDATE",
                eventId,
                "HackathonEvent",
                "{\"name\":\"" + oldName + "\"}",
                "{\"name\":\"" + event.getName() + "\"}",
                ipAddress);

        return response;
    }

    @Transactional
    public void deleteEvent(UUID eventId, String ipAddress) {
        HackathonEvent event = getEvent(eventId);
        enforceOwnership(event);

        EventStatus liveStatus = resolveStatus(event);
        if (liveStatus == EventStatus.ACTIVE) {
            throw new BusinessException("Cannot delete an active event", HttpStatus.BAD_REQUEST) {};
        }

        String eventName = event.getName();
        eventRepository.delete(event);

        auditService.log(
                authPublicService.getCurrentUserId(),
                "EVENT_DELETE",
                eventId,
                "HackathonEvent",
                "{\"name\":\"" + eventName + "\"}",
                null,
                ipAddress);
    }

    @Transactional
    public EventResponse activateEvent(UUID eventId, String ipAddress) {
        HackathonEvent event = getEvent(eventId);
        enforceOwnership(event);

        if (event.getStatus() == EventStatus.COMPLETED) {
            throw new BusinessException("Cannot activate a completed event", HttpStatus.BAD_REQUEST) {};
        }

        String oldStatus = resolveStatus(event).name();
        event.setStatus(EventStatus.ACTIVE);
        EventResponse response = toResponse(eventRepository.save(event));

        auditService.log(
                authPublicService.getCurrentUserId(),
                "EVENT_ACTIVATE",
                eventId,
                "HackathonEvent",
                "{\"status\":\"" + oldStatus + "\"}",
                "{\"status\":\"ACTIVE\"}",
                ipAddress);

        return response;
    }

    @Transactional
    public EventResponse cancelEvent(UUID eventId, String ipAddress) {
        HackathonEvent event = getEvent(eventId);
        enforceOwnership(event);

        EventStatus liveStatus = resolveStatus(event);
        if (liveStatus == EventStatus.COMPLETED) {
            throw new BusinessException("Cannot cancel a completed event", HttpStatus.BAD_REQUEST) {};
        }

        String oldStatus = liveStatus.name();
        event.setStatus(EventStatus.CANCELLED);
        EventResponse response = toResponse(eventRepository.save(event));

        auditService.log(
                authPublicService.getCurrentUserId(),
                "EVENT_CANCEL",
                eventId,
                "HackathonEvent",
                "{\"status\":\"" + oldStatus + "\"}",
                "{\"status\":\"CANCELLED\"}",
                ipAddress);

        return response;
    }

    @Transactional(readOnly = true)
    public EventResponse getEventById(UUID eventId) {
        return toResponse(getEvent(eventId));
    }

    @Transactional(readOnly = true)
    public Page<EventResponse> listPublicEvents(EventStatus status, Pageable pageable) {
        Page<HackathonEvent> page = (status != null)
                ? eventRepository.findByStatus(status, pageable)
                : eventRepository.findAll(pageable);
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<EventResponse> listEvents(EventStatus status, String season, Integer year, Pageable pageable) {
        UserType role = authPublicService.getCurrentUserRole();
        Page<HackathonEvent> page;

        if (role == UserType.EVENT_COORDINATOR) {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            page = eventRepository.findByCreatedByAndFilters(email, status, season, year, pageable);
        } else {
            page = eventRepository.findByFilters(status, season, year, pageable);
        }

        return page.map(this::toResponse);
    }

    HackathonEvent getEvent(UUID eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
    }

    EventStatus resolveStatus(HackathonEvent event) {
        if (event.getStatus() == EventStatus.CANCELLED) {
            return EventStatus.CANCELLED;
        }
        if (event.getStatus() == EventStatus.ACTIVE) {
            return EventStatus.ACTIVE;
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

    private void enforceOwnership(HackathonEvent event) {
        UserType role = authPublicService.getCurrentUserRole();
        if (role == UserType.SYSTEM_ADMIN) {
            return;
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentEmail = auth.getName();
        if (!currentEmail.equals(event.getCreatedBy())) {
            throw new BusinessException("You can only manage events you created", HttpStatus.FORBIDDEN) {};
        }
    }

    private void validateYear(Integer year) {
        int currentYear = LocalDate.now().getYear();
        if (year < currentYear) {
            throw new BusinessException(
                    "Year must be " + currentYear + " or later", HttpStatus.BAD_REQUEST) {};
        }
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
                .registrationOpenDate(event.getRegistrationOpenDate())
                .status(resolveStatus(event))
                .description(event.getDescription())
                .location(event.getLocation())
                .format(event.getFormat())
                .minTeam(event.getMinTeam())
                .maxTeam(event.getMaxTeam())
                .semesterMin(event.getSemesterMin())
                .semesterMax(event.getSemesterMax())
                .scoringTemplateId(event.getScoringTemplateId())
                .tiebreakerCriteria(event.getTiebreakerCriteria())
                .roundCount(event.getRounds().size())
                .mentorCount(event.getMentorAssignments().size())
                .trackCount(event.getTracks().size())
                .tracks(event.getTracks().stream()
                        .map(t -> TrackResponse.builder()
                                .id(t.getId())
                                .eventId(event.getId())
                                .name(t.getName())
                                .description(t.getDescription())
                                .maxTeams(t.getMaxTeams())
                                .scoringTemplateId(t.getScoringTemplateId())
                                .build())
                        .toList())
                .prizes(event.getPrizes().stream()
                        .map(p -> PrizeResponse.builder()
                                .id(p.getId())
                                .trackId(p.getTrackId())
                                .rank(p.getRank())
                                .value(p.getValue())
                                .quantity(p.getQuantity())
                                .build())
                        .toList())
                .honoredGuests(event.getHonoredGuests().stream()
                        .map(g -> HonoredGuestResponse.builder()
                                .id(g.getId())
                                .fullName(g.getFullName())
                                .title(g.getTitle())
                                .build())
                        .toList())
                .createdAt(event.getCreatedAt())
                .build();
    }
}
