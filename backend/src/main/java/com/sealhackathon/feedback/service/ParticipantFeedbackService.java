package com.sealhackathon.feedback.service;

import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.dto.snapshot.EventSnapshot;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.event.service.EventService;
import com.sealhackathon.feedback.domain.ParticipantFeedback;
import com.sealhackathon.feedback.dto.request.SubmitParticipantFeedbackRequest;
import com.sealhackathon.feedback.dto.response.ParticipantFeedbackResponse;
import com.sealhackathon.feedback.dto.response.ParticipantFeedbackSummaryResponse;
import com.sealhackathon.feedback.event.ParticipantFeedbackSubmittedEvent;
import com.sealhackathon.feedback.repository.ParticipantFeedbackRepository;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.TeamMember;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ParticipantFeedbackService {

    private final ParticipantFeedbackRepository feedbackRepository;
    private final EventPublicService eventPublicService;
    private final EventService eventService;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamRepository teamRepository;
    private final UserPublicService userPublicService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public ParticipantFeedbackResponse submitFeedback(
            UUID userId, UUID eventId, SubmitParticipantFeedbackRequest request) {
        EventSnapshot event = requireEvent(eventId);
        requireEventCompleted(event);

        Team team = resolveConfirmedTeam(userId, eventId);

        if (feedbackRepository.existsByUserIdAndEventId(userId, eventId)) {
            throw new BusinessException(
                    "You have already submitted feedback for this event",
                    HttpStatus.CONFLICT) {};
        }

        String comment = request.getComment() != null ? request.getComment().trim() : null;
        if (comment != null && comment.isEmpty()) {
            comment = null;
        }

        ParticipantFeedback feedback = ParticipantFeedback.builder()
                .eventId(eventId)
                .userId(userId)
                .teamId(team.getId())
                .overallRating(request.getOverallRating())
                .comment(comment)
                .submittedAt(LocalDateTime.now())
                .build();

        feedback = feedbackRepository.save(feedback);

        eventPublisher.publishEvent(new ParticipantFeedbackSubmittedEvent(
                feedback.getId(), eventId, userId, team.getId(), feedback.getOverallRating()));

        return toResponse(feedback);
    }

    @Transactional(readOnly = true)
    public ParticipantFeedbackResponse getMyFeedback(UUID userId, UUID eventId) {
        requireEvent(eventId);
        ParticipantFeedback feedback = feedbackRepository.findByUserIdAndEventId(userId, eventId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "ParticipantFeedback", "userId+eventId", userId + "+" + eventId));
        return toResponse(feedback);
    }

    @Transactional(readOnly = true)
    public List<ParticipantFeedbackResponse> listFeedback(UUID eventId, UserType requesterRole) {
        requireEvent(eventId);
        if (requesterRole == UserType.EVENT_COORDINATOR) {
            eventService.enforceEventOwnership(eventId);
        }

        return feedbackRepository.findByEventIdOrderBySubmittedAtDesc(eventId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ParticipantFeedbackSummaryResponse getSummary(UUID eventId, UserType requesterRole) {
        requireEvent(eventId);
        if (requesterRole == UserType.EVENT_COORDINATOR) {
            eventService.enforceEventOwnership(eventId);
        }

        List<ParticipantFeedback> feedbacks = feedbackRepository.findByEventIdOrderBySubmittedAtDesc(eventId);
        Map<String, Integer> distribution = new LinkedHashMap<>();
        for (int i = 1; i <= 5; i++) {
            distribution.put(String.valueOf(i), 0);
        }
        for (ParticipantFeedback feedback : feedbacks) {
            String key = String.valueOf(feedback.getOverallRating());
            distribution.merge(key, 1, Integer::sum);
        }

        Double average = feedbacks.isEmpty()
                ? null
                : feedbacks.stream()
                        .mapToInt(ParticipantFeedback::getOverallRating)
                        .average()
                        .orElse(0);

        return ParticipantFeedbackSummaryResponse.builder()
                .eventId(eventId)
                .totalCount(feedbacks.size())
                .averageRating(average)
                .ratingDistribution(distribution)
                .build();
    }

    private EventSnapshot requireEvent(UUID eventId) {
        return eventPublicService.getEvent(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
    }

    private void requireEventCompleted(EventSnapshot event) {
        if (event.getStatus() != EventStatus.COMPLETED) {
            throw new BusinessException(
                    "Feedback can only be submitted after the event is completed",
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    private Team resolveConfirmedTeam(UUID userId, UUID eventId) {
        TeamMember membership = teamMemberRepository.findByUserIdAndEventId(userId, eventId)
                .orElseThrow(() -> new BusinessException(
                        "You must be on a confirmed team to submit feedback",
                        HttpStatus.BAD_REQUEST) {});

        Team team = teamRepository.findById(membership.getTeam().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", membership.getTeam().getId()));

        if (team.getStatus() != TeamStatus.CONFIRMED) {
            throw new BusinessException(
                    "You must be on a confirmed team to submit feedback",
                    HttpStatus.BAD_REQUEST) {};
        }

        return team;
    }

    private ParticipantFeedbackResponse toResponse(ParticipantFeedback feedback) {
        String userFullName = userPublicService.findById(feedback.getUserId())
                .map(UserSnapshot::getFullName)
                .orElse(null);
        String teamName = teamRepository.findById(feedback.getTeamId())
                .map(Team::getName)
                .orElse(null);

        return ParticipantFeedbackResponse.builder()
                .id(feedback.getId())
                .eventId(feedback.getEventId())
                .userId(feedback.getUserId())
                .userFullName(userFullName)
                .teamId(feedback.getTeamId())
                .teamName(teamName)
                .overallRating(feedback.getOverallRating())
                .comment(feedback.getComment())
                .submittedAt(feedback.getSubmittedAt())
                .build();
    }
}
