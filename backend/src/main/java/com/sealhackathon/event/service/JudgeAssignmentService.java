package com.sealhackathon.event.service;

import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.JudgeAssignment;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.dto.request.AssignJudgeRequest;
import com.sealhackathon.event.dto.response.JudgeAssignmentResponse;
import com.sealhackathon.event.event.JudgeAssignedEvent;
import com.sealhackathon.event.repository.JudgeAssignmentRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.judging.repository.JudgeScoreRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JudgeAssignmentService {

    private final JudgeAssignmentRepository judgeAssignmentRepository;
    private final JudgeScoreRepository judgeScoreRepository;
    private final RoundService roundService;
    private final EventJudgeService eventJudgeService;
    private final TrackRepository trackRepository;
    private final UserPublicService userPublicService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public JudgeAssignmentResponse assignJudge(UUID roundId, AssignJudgeRequest request) {
        Round round = roundService.getRound(roundId);
        UUID trackId = resolveTrackIdForAssignment(round, request.getTrackId());

        UserSnapshot judge = userPublicService.findById(request.getJudgeUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getJudgeUserId()));

        if (judge.getUserType() != UserType.LECTURER) {
            throw new BusinessException(
                    "User " + judge.getEmail() + " is not a LECTURER. Role: " + judge.getUserType(),
                    HttpStatus.BAD_REQUEST) {};
        }

        UUID eventId = round.getHackathonEvent().getId();
        if (!eventJudgeService.isEventJudge(eventId, request.getJudgeUserId())) {
            throw new BusinessException(
                    "Judge must be assigned to the event with role JUDGE or BOTH",
                    HttpStatus.BAD_REQUEST) {};
        }

        if (isDuplicate(roundId, request.getJudgeUserId(), trackId)) {
            String scope = trackId != null ? "track " + trackId : "final round";
            throw new DuplicateResourceException("JudgeAssignment", "judge+round",
                    judge.getEmail() + " in round " + round.getName() + " (" + scope + ")");
        }

        JudgeAssignment assignment = JudgeAssignment.builder()
                .round(round)
                .judgeUserId(request.getJudgeUserId())
                .trackId(trackId)
                .assignedAt(LocalDateTime.now())
                .build();

        assignment = judgeAssignmentRepository.save(assignment);

        eventPublisher.publishEvent(new JudgeAssignedEvent(
                assignment.getId(), request.getJudgeUserId(),
                roundId, eventId));

        String trackName = trackId != null ? getTrackName(eventId, trackId) : null;
        return toResponse(assignment, judge, trackName);
    }

    @Transactional(readOnly = true)
    public List<JudgeAssignmentResponse> getJudgesByRound(UUID roundId, UUID trackId) {
        Round round = roundService.getRound(roundId);
        UUID eventId = round.getHackathonEvent().getId();
        Map<UUID, String> trackNames = trackRepository.findByHackathonEventId(eventId).stream()
                .collect(Collectors.toMap(Track::getId, Track::getName));

        List<JudgeAssignment> assignments;
        if (round.getRoundType() == RoundType.PRELIMINARY) {
            if (trackId == null) {
                throw new BusinessException(
                        "trackId query parameter is required for preliminary rounds",
                        HttpStatus.BAD_REQUEST) {};
            }
            validateTrackBelongsToEvent(eventId, trackId);
            assignments = judgeAssignmentRepository.findByRoundIdAndTrackId(roundId, trackId);
        } else if (trackId != null) {
            throw new BusinessException(
                    "trackId must not be provided for final rounds",
                    HttpStatus.BAD_REQUEST) {};
        } else {
            assignments = judgeAssignmentRepository.findByRoundIdAndTrackIdIsNull(roundId);
        }

        return assignments.stream()
                .map(a -> {
                    UserSnapshot judge = userPublicService.findById(a.getJudgeUserId()).orElse(null);
                    String trackName = a.getTrackId() != null ? trackNames.get(a.getTrackId()) : null;
                    return toResponse(a, judge, trackName);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean isJudgeAssignedToRoundScope(UUID roundId, UUID judgeUserId, UUID teamTrackId) {
        Round round = roundService.getRound(roundId);
        if (round.getRoundType() == RoundType.FINAL) {
            return judgeAssignmentRepository.existsByRoundIdAndJudgeUserIdAndTrackIdIsNull(roundId, judgeUserId);
        }
        if (teamTrackId == null) {
            return false;
        }
        return judgeAssignmentRepository.existsByRoundIdAndJudgeUserIdAndTrackId(
                roundId, judgeUserId, teamTrackId);
    }

    @Transactional(readOnly = true)
    public List<UUID> getEligibleJudgeUserIds(UUID roundId, UUID trackId) {
        Round round = roundService.getRound(roundId);
        List<JudgeAssignment> assignments;
        if (round.getRoundType() == RoundType.FINAL) {
            assignments = judgeAssignmentRepository.findByRoundIdAndTrackIdIsNull(roundId);
        } else if (trackId != null) {
            assignments = judgeAssignmentRepository.findByRoundIdAndTrackId(roundId, trackId);
        } else {
            assignments = judgeAssignmentRepository.findByRoundId(roundId);
        }
        return assignments.stream().map(JudgeAssignment::getJudgeUserId).distinct().toList();
    }

    @Transactional
    public void removeJudgeAssignment(UUID assignmentId) {
        JudgeAssignment assignment = judgeAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("JudgeAssignment", "id", assignmentId));

        UUID roundId = assignment.getRound().getId();
        UUID judgeUserId = assignment.getJudgeUserId();
        long scoreCount = judgeScoreRepository.countByRoundIdAndJudgeUserId(roundId, judgeUserId);
        if (scoreCount > 0) {
            throw new BusinessException(
                    "Cannot remove judge assignment: judge has already submitted scores for this round",
                    HttpStatus.BAD_REQUEST) {};
        }

        judgeAssignmentRepository.delete(assignment);
    }

    private UUID resolveTrackIdForAssignment(Round round, UUID trackId) {
        RoundType roundType = round.getRoundType();
        UUID eventId = round.getHackathonEvent().getId();

        if (roundType == RoundType.PRELIMINARY) {
            if (trackId == null) {
                throw new BusinessException(
                        "trackId is required when assigning judges to a preliminary round",
                        HttpStatus.BAD_REQUEST) {};
            }
            validateTrackBelongsToEvent(eventId, trackId);
            return trackId;
        }

        if (roundType == RoundType.FINAL) {
            if (trackId != null) {
                throw new BusinessException(
                        "trackId must not be set when assigning judges to the final round",
                        HttpStatus.BAD_REQUEST) {};
            }
            return null;
        }

        if (trackId != null) {
            validateTrackBelongsToEvent(eventId, trackId);
        }
        return trackId;
    }

    private void validateTrackBelongsToEvent(UUID eventId, UUID trackId) {
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new ResourceNotFoundException("Track", "id", trackId));
        if (!track.getHackathonEvent().getId().equals(eventId)) {
            throw new ResourceNotFoundException("Track", "id", trackId);
        }
    }

    private boolean isDuplicate(UUID roundId, UUID judgeUserId, UUID trackId) {
        if (trackId == null) {
            return judgeAssignmentRepository.existsByRoundIdAndJudgeUserIdAndTrackIdIsNull(roundId, judgeUserId);
        }
        return judgeAssignmentRepository.existsByRoundIdAndJudgeUserIdAndTrackId(roundId, judgeUserId, trackId);
    }

    private String getTrackName(UUID eventId, UUID trackId) {
        return trackRepository.findByHackathonEventId(eventId).stream()
                .filter(t -> t.getId().equals(trackId))
                .map(Track::getName)
                .findFirst()
                .orElse(null);
    }

    private JudgeAssignmentResponse toResponse(JudgeAssignment a, UserSnapshot judge, String trackName) {
        return JudgeAssignmentResponse.builder()
                .id(a.getId())
                .roundId(a.getRound().getId())
                .trackId(a.getTrackId())
                .trackName(trackName)
                .judgeUserId(a.getJudgeUserId())
                .judgeFullName(judge != null ? judge.getFullName() : null)
                .judgeEmail(judge != null ? judge.getEmail() : null)
                .assignedAt(a.getAssignedAt())
                .build();
    }
}
