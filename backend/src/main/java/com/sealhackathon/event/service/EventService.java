package com.sealhackathon.event.service;

import com.sealhackathon.audit.service.AuditService;
import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.common.util.PrizeAmountUtils;
import com.sealhackathon.common.util.SeasonUtils;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.HonoredGuest;
import com.sealhackathon.event.domain.Prize;
import com.sealhackathon.event.domain.ScoringTemplate;
import com.sealhackathon.event.domain.ScoringTemplateCriterion;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.domain.enums.CompetitionFormat;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.domain.enums.PrizeRank;
import com.sealhackathon.event.dto.request.CreateEventRequest;
import com.sealhackathon.event.dto.request.PrizeRequest;
import com.sealhackathon.event.dto.request.UpdateEventRequest;
import com.sealhackathon.event.dto.request.UpdateEventStatusRequest;
import com.sealhackathon.event.dto.response.EventResponse;
import com.sealhackathon.event.dto.response.HonoredGuestResponse;
import com.sealhackathon.event.dto.response.PrizeResponse;
import com.sealhackathon.event.dto.response.TrackResponse;
import com.sealhackathon.event.event.EventCreatedEvent;
import com.sealhackathon.event.template.SealSpring2026Template;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.ScoringTemplateRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class EventService {

    private static final Pattern EVENT_NAME_PATTERN = Pattern.compile("^[a-zA-Z\\s]+$");
    private static final List<PrizeRank> PRIZE_RANK_ORDER = List.of(
            PrizeRank.FIRST, PrizeRank.SECOND, PrizeRank.THIRD);
    private static final int MIN_TRACK_MAX_TEAMS = 16;
    private static final int MAX_TRACK_MAX_TEAMS = 40;

    private final HackathonEventRepository eventRepository;
    private final RoundService roundService;
    private final ApplicationEventPublisher eventPublisher;
    private final AuditService auditService;
    private final AuthPublicService authPublicService;
    private final EventJudgeService eventJudgeService;
    private final EventScheduleService eventScheduleService;
    private final AllowedEmailDomainService allowedEmailDomainService;
    private final ScoringTemplateRepository scoringTemplateRepository;
    private final UserPublicService userPublicService;

    @Transactional
    public EventResponse createEvent(CreateEventRequest request) {
        validateEventName(request.getName());
        validateYear(request.getYear());
        validateDateRange(request.getStartDate(), request.getEndDate());
        validateRegistrationDates(request.getRegistrationOpenDate(), request.getRegistrationDeadline(), request.getStartDate());

        if (eventRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Event", "name", request.getName());
        }

        CompetitionFormat competitionFormat = request.getCompetitionFormat() != null
                ? request.getCompetitionFormat()
                : CompetitionFormat.GENERIC;

        HackathonEvent event = HackathonEvent.builder()
                .name(request.getName())
                .season(SeasonUtils.normalize(request.getSeason()))
                .year(request.getYear())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .registrationDeadline(request.getRegistrationDeadline())
                .description(request.getDescription())
                .location(request.getLocation())
                .format(request.getFormat() != null ? request.getFormat() : "OFFLINE")
                .competitionFormat(competitionFormat)
                .registrationOpenDate(request.getRegistrationOpenDate())
                .minTeam(request.getMinTeam())
                .maxTeam(request.getMaxTeam())
                .semesterMin(request.getSemesterMin())
                .semesterMax(request.getSemesterMax())
                .scoringTemplateId(request.getScoringTemplateId())
                .tiebreakerCriteria(request.getTiebreakerCriteria())
                .status(EventStatus.UPCOMING)
                .build();

        applyTiebreakerCriterionIds(event, request.getTiebreakerCriterionIds());
        applyCoordinatorOwner(event, request.getCoordinatorEmail());

        List<PrizeRequest> prizeRequests = request.getPrizes();
        if (prizeRequests != null && !prizeRequests.isEmpty()) {
            validatePrizes(prizeRequests);
        }

        if (competitionFormat == CompetitionFormat.SEAL_RAG_2026) {
            SealSpring2026Template.apply(event);
        } else if (request.getTracks() != null) {
            request.getTracks().forEach(t -> {
                validateTrackMaxTeams(t.getMaxTeams());
                Track track = Track.builder()
                        .hackathonEvent(event)
                        .name(t.getName())
                        .description(t.getDescription())
                        .topic(t.getTopic())
                        .maxTeams(t.getMaxTeams())
                        .scoringTemplateId(t.getScoringTemplateId())
                        .build();
                event.getTracks().add(track);
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

        eventJudgeService.seedFromEvent(event, request.getJudgeUserIds());

        HackathonEvent saved = eventRepository.save(event);
        eventRepository.flush();

        if (competitionFormat == CompetitionFormat.SEAL_RAG_2026) {
            eventScheduleService.seedSchedules(saved, SealSpring2026Template.buildSchedules(saved));
            allowedEmailDomainService.seedDomains(saved.getId(), SealSpring2026Template.buildDefaultEmailDomains());
        }

        if (prizeRequests != null && competitionFormat != CompetitionFormat.SEAL_RAG_2026) {
            for (PrizeRequest p : prizeRequests) {
                saved.getPrizes().add(buildPrize(saved, p));
            }
            saved = eventRepository.save(saved);
        }

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
        validateEventName(request.getName());
        validateRegistrationDates(request.getRegistrationOpenDate(), request.getRegistrationDeadline(), request.getStartDate());

        if (eventRepository.existsByNameAndIdNot(request.getName(), eventId)) {
            throw new DuplicateResourceException("Event", "name", request.getName());
        }

        String oldName = event.getName();

        event.setName(request.getName());
        event.setSeason(SeasonUtils.normalize(request.getSeason()));
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
        if (request.getTiebreakerCriterionIds() != null) {
            applyTiebreakerCriterionIds(event, request.getTiebreakerCriterionIds());
        }

        if (request.getPrizes() != null) {
            if (!request.getPrizes().isEmpty()) {
                validatePrizes(request.getPrizes());
            }
            event.getPrizes().clear();
            request.getPrizes().forEach(p -> event.getPrizes().add(buildPrize(event, p)));
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
        if (liveStatus == EventStatus.ACTIVE || liveStatus == EventStatus.COMPLETED) {
            throw new BusinessException("Cannot delete an active or completed event", HttpStatus.BAD_REQUEST) {};
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
        return finalizePublish(eventId, ipAddress);
    }

    @Transactional
    public EventResponse finalizePublish(UUID eventId, String ipAddress) {
        HackathonEvent event = getEvent(eventId);
        enforceOwnership(event);

        if (event.getStatus() == EventStatus.CANCELLED) {
            throw new BusinessException("Cannot publish a cancelled event", HttpStatus.BAD_REQUEST) {};
        }

        validatePublishReadiness(event);

        EventStatus resolvedStatus = resolveStatus(event);
        EventResponse response = toResponse(event);

        auditService.log(
                authPublicService.getCurrentUserId(),
                "EVENT_PUBLISH",
                eventId,
                "HackathonEvent",
                "{\"persistedStatus\":\"" + event.getStatus().name() + "\"}",
                "{\"resolvedStatus\":\"" + resolvedStatus.name() + "\"}",
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

    @Transactional
    public EventResponse updateEventStatus(UUID eventId, UpdateEventStatusRequest request, String ipAddress) {
        HackathonEvent event = getEvent(eventId);
        enforceOwnership(event);

        if (event.getStatus() == EventStatus.CANCELLED) {
            throw new BusinessException("Cannot change status of a cancelled event", HttpStatus.BAD_REQUEST);
        }

        EventStatus target = request.getStatus();
        validateStatusTransition(event, target);

        String oldStatus = event.getStatus().name();
        event.setStatus(target);
        EventResponse response = toResponse(eventRepository.save(event));

        auditService.log(
                authPublicService.getCurrentUserId(),
                "EVENT_STATUS_CHANGE",
                eventId,
                "HackathonEvent",
                "{\"from\":\"" + oldStatus + "\"}",
                "{\"to\":\"" + target.name() + "\"}",
                ipAddress);

        return response;
    }

    private void validateStatusTransition(HackathonEvent event, EventStatus target) {
        if (target == EventStatus.CANCELLED) {
            throw new BusinessException("Use cancel endpoint to cancel an event", HttpStatus.BAD_REQUEST);
        }
        EventStatus current = resolveStatus(event);
        if (current == target) {
            return;
        }
        List<EventStatus> allowed = switch (current) {
            case UPCOMING -> List.of(EventStatus.OPEN, EventStatus.CLOSED_REGISTRATION);
            case OPEN -> List.of(EventStatus.CLOSED_REGISTRATION, EventStatus.ACTIVE);
            case CLOSED_REGISTRATION -> List.of(EventStatus.ACTIVE);
            case ACTIVE -> List.of(EventStatus.SCORING, EventStatus.COMPLETED);
            case SCORING -> List.of(EventStatus.COMPLETED);
            case COMPLETED, CANCELLED -> List.of();
        };
        if (!allowed.contains(target)) {
            throw new BusinessException(
                    "Cannot transition from " + current + " to " + target,
                    HttpStatus.BAD_REQUEST);
        }
    }

    @Transactional(readOnly = true)
    public EventResponse getEventById(UUID eventId) {
        return toResponse(getEvent(eventId));
    }

    @Transactional(readOnly = true)
    public EventResponse getPublicEventById(UUID eventId) {
        HackathonEvent event = eventRepository.findByIdWithDetails(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
        assertPubliclyVisible(event);
        return toResponse(event);
    }

    @Transactional(readOnly = true)
    public void assertPubliclyVisible(UUID eventId) {
        HackathonEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
        assertPubliclyVisible(event);
    }

    private void assertPubliclyVisible(HackathonEvent event) {
        if (event.getStatus() == EventStatus.CANCELLED || event.getRounds().isEmpty()) {
            throw new ResourceNotFoundException("Event", "id", event.getId());
        }
    }

    @Transactional(readOnly = true)
    public Page<EventResponse> listPublicEvents(EventStatus status, Pageable pageable) {
        Page<HackathonEvent> page = eventRepository.findPublishedEvents(pageable);
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<EventResponse> listEvents(List<EventStatus> statuses, String season, Integer year, Pageable pageable) {
        if (statuses != null && !statuses.isEmpty()) {
            return listEventsByResolvedStatuses(statuses, season, year, pageable);
        }

        UserType role = authPublicService.getCurrentUserRole();
        Page<HackathonEvent> page;

        if (role == UserType.EVENT_COORDINATOR) {
            String email = authPublicService.getCurrentUserEmail();
            page = eventRepository.findByCreatedByAndFilters(email, null, season, year, pageable);
        } else {
            page = eventRepository.findByFilters(null, season, year, pageable);
        }

        return page.map(this::toResponse);
    }

    private Page<EventResponse> listEventsByResolvedStatuses(List<EventStatus> statuses, String season,
                                                             Integer year, Pageable pageable) {
        UserType role = authPublicService.getCurrentUserRole();
        Page<HackathonEvent> page;

        if (role == UserType.EVENT_COORDINATOR) {
            String email = authPublicService.getCurrentUserEmail();
            page = eventRepository.findByCreatedByAndFilters(email, null, season, year, Pageable.unpaged());
        } else {
            page = eventRepository.findByFilters(null, season, year, Pageable.unpaged());
        }

        List<EventResponse> filtered = page.getContent().stream()
                .map(this::toResponse)
                .filter(e -> statuses.contains(e.getStatus()))
                .toList();

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<EventResponse> slice = start >= filtered.size() ? List.of() : filtered.subList(start, end);
        return new PageImpl<>(slice, pageable, filtered.size());
    }

    HackathonEvent getEvent(UUID eventId) {
        return eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
    }

    /**
     * Derives the live event status from dates. Only {@link EventStatus#CANCELLED} is
     * kept as a hard override from persisted state.
     * Events incorrectly persisted as ACTIVE before startDate will still resolve correctly.
     */
    public EventStatus resolveStatus(HackathonEvent event) {
        if (event.getStatus() == EventStatus.CANCELLED) {
            return EventStatus.CANCELLED;
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

    private void enforceOwnership(HackathonEvent event) {
        UserType role = authPublicService.getCurrentUserRole();
        if (role == UserType.SYSTEM_ADMIN) {
            return;
        }
        String currentEmail = authPublicService.getCurrentUserEmail();
        if (!currentEmail.equals(event.getCreatedBy())) {
            throw new BusinessException("You can only manage events you created", HttpStatus.FORBIDDEN) {};
        }
    }

    private void applyCoordinatorOwner(HackathonEvent event, String coordinatorEmail) {
        if (coordinatorEmail == null || coordinatorEmail.isBlank()) {
            return;
        }
        if (authPublicService.getCurrentUserRole() != UserType.SYSTEM_ADMIN) {
            throw new BusinessException(
                    "Only system admins can assign event ownership to a coordinator",
                    HttpStatus.FORBIDDEN) {};
        }
        UserSnapshot owner = userPublicService.findByEmail(coordinatorEmail.trim())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", coordinatorEmail));
        if (owner.getUserType() != UserType.EVENT_COORDINATOR) {
            throw new BusinessException(
                    "Assigned owner must be an EVENT_COORDINATOR",
                    HttpStatus.BAD_REQUEST) {};
        }
        event.setCreatedBy(owner.getEmail());
    }

    public void enforceEventOwnership(UUID eventId) {
        enforceOwnership(getEvent(eventId));
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

    private void validateEventName(String name) {
        if (name == null || !EVENT_NAME_PATTERN.matcher(name.trim()).matches()) {
            throw new BusinessException(
                    "Event name must contain only letters and spaces",
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    private void validateRegistrationDates(LocalDate open, LocalDate close, LocalDate start) {
        if (open == null) {
            throw new BusinessException("Registration open date is required", HttpStatus.BAD_REQUEST) {};
        }
        if (close == null) {
            throw new BusinessException("Registration close date is required", HttpStatus.BAD_REQUEST) {};
        }
        if (!open.isBefore(close)) {
            throw new BusinessException(
                    "Registration close date must be after registration open date",
                    HttpStatus.BAD_REQUEST) {};
        }
        if (!close.isBefore(start)) {
            throw new BusinessException(
                    "Registration must close before event start date",
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    private void validateTrackMaxTeams(Integer maxTeams) {
        if (maxTeams == null || maxTeams < MIN_TRACK_MAX_TEAMS || maxTeams > MAX_TRACK_MAX_TEAMS) {
            throw new BusinessException(
                    "Track max teams must be between " + MIN_TRACK_MAX_TEAMS + " and " + MAX_TRACK_MAX_TEAMS,
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    private void validatePrizes(List<PrizeRequest> prizes) {
        Map<String, Map<PrizeRank, Long>> grouped = new HashMap<>();

        for (PrizeRequest prize : prizes) {
            String groupKey = prize.getTrackIndex() != null
                    ? "track-" + prize.getTrackIndex()
                    : "shared";
            Long amount = PrizeAmountUtils.parsePrizeAmount(prize.getValue());
            if (amount == null || prize.getRank() == PrizeRank.CONSOLATION) {
                continue;
            }
            grouped.computeIfAbsent(groupKey, k -> new HashMap<>()).put(prize.getRank(), amount);
        }

        for (Map.Entry<String, Map<PrizeRank, Long>> entry : grouped.entrySet()) {
            Map<PrizeRank, Long> byRank = entry.getValue();
            for (int i = 0; i < PRIZE_RANK_ORDER.size() - 1; i++) {
                PrizeRank higher = PRIZE_RANK_ORDER.get(i);
                PrizeRank lower = PRIZE_RANK_ORDER.get(i + 1);
                if (byRank.containsKey(higher) && byRank.containsKey(lower)
                        && byRank.get(higher) <= byRank.get(lower)) {
                    String scope = entry.getKey().startsWith("track-")
                            ? " for track index " + entry.getKey().substring(6)
                            : "";
                    throw new BusinessException(
                            String.format("%s prize value must be greater than %s prize value%s",
                                    higher, lower, scope),
                            HttpStatus.BAD_REQUEST) {};
                }
            }
        }
    }

    private Prize buildPrize(HackathonEvent event, PrizeRequest request) {
        return Prize.builder()
                .hackathonEvent(event)
                .trackId(resolvePrizeTrackId(event, request))
                .rank(request.getRank())
                .value(request.getValue())
                .quantity(request.getQuantity())
                .label(normalizePrizeLabel(request))
                .build();
    }

    private String normalizePrizeLabel(PrizeRequest request) {
        if (request.getLabel() == null || request.getLabel().isBlank()) {
            return null;
        }
        return request.getLabel().trim();
    }

    private UUID resolvePrizeTrackId(HackathonEvent event, PrizeRequest request) {
        if (request.getTrackId() != null) {
            return request.getTrackId();
        }
        if (request.getTrackIndex() != null) {
            List<Track> tracks = event.getTracks();
            if (request.getTrackIndex() < 0 || request.getTrackIndex() >= tracks.size()) {
                throw new BusinessException(
                        "Invalid track index for prize: " + request.getTrackIndex(),
                        HttpStatus.BAD_REQUEST) {};
            }
            return tracks.get(request.getTrackIndex()).getId();
        }
        return null;
    }

    private void validatePublishReadiness(HackathonEvent event) {
        if (event.getTracks().isEmpty()) {
            throw new BusinessException(
                    "Event must have at least one track before publishing",
                    HttpStatus.BAD_REQUEST) {};
        }
        validateRegistrationDates(event.getRegistrationOpenDate(), event.getRegistrationDeadline(), event.getStartDate());
        roundService.validateRoundWeightsForPublish(event.getId());
    }

    EventResponse toResponse(HackathonEvent event) {
        return EventResponse.builder()
                .id(event.getId())
                .name(event.getName())
                .season(SeasonUtils.normalize(event.getSeason()))
                .year(event.getYear())
                .startDate(event.getStartDate())
                .endDate(event.getEndDate())
                .registrationDeadline(event.getRegistrationDeadline())
                .registrationOpenDate(event.getRegistrationOpenDate())
                .status(resolveStatus(event))
                .description(event.getDescription())
                .location(event.getLocation())
                .format(event.getFormat())
                .competitionFormat(event.getCompetitionFormat())
                .minTeam(event.getMinTeam())
                .maxTeam(event.getMaxTeam())
                .semesterMin(event.getSemesterMin())
                .semesterMax(event.getSemesterMax())
                .scoringTemplateId(event.getScoringTemplateId())
                .tiebreakerCriteria(event.getTiebreakerCriteria())
                .tiebreakerCriterionIds(List.copyOf(event.getTiebreakerCriterionIds()))
                .roundCount(event.getRounds().size())
                .mentorCount(event.getMentorAssignments().size())
                .trackCount(event.getTracks().size())
                .tracks(event.getTracks().stream()
                        .map(t -> TrackResponse.builder()
                                .id(t.getId())
                                .eventId(event.getId())
                                .name(t.getName())
                                .description(t.getDescription())
                                .topic(t.getTopic())
                                .maxTeams(t.getMaxTeams())
                                .scoringTemplateId(t.getScoringTemplateId())
                                .status(t.getStatus())
                                .build())
                        .toList())
                .prizes(event.getPrizes().stream()
                        .map(p -> PrizeResponse.builder()
                                .id(p.getId())
                                .trackId(p.getTrackId())
                                .rank(p.getRank())
                                .value(p.getValue())
                                .quantity(p.getQuantity())
                                .label(p.getLabel())
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

    private void applyTiebreakerCriterionIds(HackathonEvent event, List<UUID> ids) {
        if (ids == null) {
            return;
        }
        validateTiebreakerCriterionIds(event.getScoringTemplateId(), ids);
        event.getTiebreakerCriterionIds().clear();
        event.getTiebreakerCriterionIds().addAll(ids);
        if (event.getTiebreakerCriteria() == null || event.getTiebreakerCriteria().isBlank()) {
            event.setTiebreakerCriteria(buildTiebreakerDisplayLabel(event.getScoringTemplateId(), ids));
        }
    }

    private void validateTiebreakerCriterionIds(UUID scoringTemplateId, List<UUID> ids) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        if (scoringTemplateId == null) {
            throw new BusinessException(
                    "scoringTemplateId is required when tiebreakerCriterionIds is set",
                    HttpStatus.BAD_REQUEST) {};
        }
        ScoringTemplate template = scoringTemplateRepository.findById(scoringTemplateId)
                .orElseThrow(() -> new ResourceNotFoundException("ScoringTemplate", "id", scoringTemplateId));
        Set<UUID> validIds = template.getCriteria().stream()
                .map(ScoringTemplateCriterion::getId)
                .collect(Collectors.toSet());
        for (UUID id : ids) {
            if (!validIds.contains(id)) {
                throw new BusinessException(
                        "Invalid tiebreaker criterion id: " + id,
                        HttpStatus.BAD_REQUEST) {};
            }
        }
        if (new HashSet<>(ids).size() != ids.size()) {
            throw new BusinessException(
                    "tiebreakerCriterionIds must not contain duplicates",
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    private String buildTiebreakerDisplayLabel(UUID scoringTemplateId, List<UUID> ids) {
        if (ids == null || ids.isEmpty() || scoringTemplateId == null) {
            return null;
        }
        ScoringTemplate template = scoringTemplateRepository.findById(scoringTemplateId).orElse(null);
        if (template == null) {
            return null;
        }
        Map<UUID, String> names = template.getCriteria().stream()
                .collect(Collectors.toMap(ScoringTemplateCriterion::getId, ScoringTemplateCriterion::getName));
        return ids.stream()
                .map(names::get)
                .filter(name -> name != null && !name.isBlank())
                .collect(Collectors.joining(", "));
    }
}
