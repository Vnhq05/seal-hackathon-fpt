package com.sealhackathon.judging.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.dto.response.EventJudgeResponse;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.event.service.EventJudgeService;
import com.sealhackathon.event.service.EventService;
import com.sealhackathon.event.service.JudgeAssignmentService;
import com.sealhackathon.judging.domain.TeamJudgeAssignment;
import com.sealhackathon.judging.dto.request.CreateTeamAssignmentsRequest;
import com.sealhackathon.judging.dto.response.EventAssignmentsOverviewResponse;
import com.sealhackathon.judging.dto.response.TeamAssignmentOverviewResponse;
import com.sealhackathon.judging.dto.response.TeamJudgeAssignmentResponse;
import com.sealhackathon.judging.repository.TeamJudgeAssignmentRepository;
import com.sealhackathon.submission.domain.Submission;
import com.sealhackathon.submission.repository.SubmissionRepository;
import com.sealhackathon.team.domain.MentorTeam;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.repository.MentorTeamRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.service.TeamPublicService;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssignmentOverviewService {

    private final HackathonEventRepository eventRepository;
    private final RoundRepository roundRepository;
    private final TrackRepository trackRepository;
    private final TeamRepository teamRepository;
    private final MentorTeamRepository mentorTeamRepository;
    private final SubmissionRepository submissionRepository;
    private final TeamJudgeAssignmentRepository assignmentRepository;
    private final EventJudgeService eventJudgeService;
    private final JudgeAssignmentService judgeAssignmentService;
    private final TeamJudgeAssignmentService teamJudgeAssignmentService;
    private final TeamPublicService teamPublicService;
    private final TeamMemberRepository teamMemberRepository;
    private final UserPublicService userPublicService;
    private final EventService eventService;

    @Value("${app.hackathon.judging.max-judges-per-team:3}")
    private int maxJudgesPerTeam;

    @Transactional(readOnly = true)
    public EventAssignmentsOverviewResponse getEventAssignments(
            UUID eventId, String season, Integer year, UUID roundId, UUID trackId) {
        HackathonEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        if (season != null && !season.equalsIgnoreCase(event.getSeason())) {
            throw new BusinessException("Event does not match the requested season", HttpStatus.BAD_REQUEST) {};
        }
        if (year != null && !year.equals(event.getYear())) {
            throw new BusinessException("Event does not match the requested year", HttpStatus.BAD_REQUEST) {};
        }

        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round", "id", roundId));
        if (!round.getHackathonEvent().getId().equals(eventId)) {
            throw new BusinessException("Round does not belong to this event", HttpStatus.BAD_REQUEST) {};
        }

        eventService.enforceEventOwnership(eventId);

        List<Team> teams = teamRepository.findByEventId(eventId).stream()
                .filter(t -> trackId == null || trackId.equals(t.getTrackId()))
                .toList();

        List<EventJudgeResponse> eligibleJudges = resolveEligibleJudges(eventId, round, roundId, trackId, teams);

        Map<UUID, String> trackNames = trackRepository.findByHackathonEventId(eventId).stream()
                .collect(Collectors.toMap(Track::getId, Track::getName));

        Map<UUID, List<TeamJudgeAssignment>> assignmentsByTeam = assignmentRepository
                .findByRoundId(roundId).stream()
                .collect(Collectors.groupingBy(TeamJudgeAssignment::getTeamId));

        Map<UUID, Submission> submissionsByTeam = submissionRepository.findByRoundId(roundId).stream()
                .collect(Collectors.toMap(Submission::getTeamId, s -> s, (a, b) -> a));

        List<TeamAssignmentOverviewResponse> teamRows = teams.stream()
                .map(team -> buildTeamRow(team, trackNames, assignmentsByTeam, submissionsByTeam))
                .toList();

        return EventAssignmentsOverviewResponse.builder()
                .eventId(eventId)
                .roundId(roundId)
                .eligibleJudges(eligibleJudges)
                .teams(teamRows)
                .build();
    }

    @Transactional
    public List<TeamJudgeAssignmentResponse> assignJudges(CreateTeamAssignmentsRequest request) {
        HackathonEvent event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", request.getEventId()));
        eventService.enforceEventOwnership(request.getEventId());

        Round round = roundRepository.findById(request.getRoundId())
                .orElseThrow(() -> new ResourceNotFoundException("Round", "id", request.getRoundId()));
        if (!round.getHackathonEvent().getId().equals(request.getEventId())) {
            throw new BusinessException("Round does not belong to this event", HttpStatus.BAD_REQUEST) {};
        }

        Team team = teamRepository.findById(request.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", request.getTeamId()));
        if (!team.getEventId().equals(request.getEventId())) {
            throw new BusinessException("Team does not belong to this event", HttpStatus.BAD_REQUEST) {};
        }

        List<UUID> judgeIds = request.getJudgeUserIds();
        if (judgeIds.size() != maxJudgesPerTeam) {
            throw new BusinessException(
                    "Exactly " + maxJudgesPerTeam + " judges must be assigned",
                    HttpStatus.BAD_REQUEST) {};
        }

        Set<UUID> unique = new HashSet<>(judgeIds);
        if (unique.size() != maxJudgesPerTeam) {
            throw new BusinessException("Judge assignments must be unique", HttpStatus.BAD_REQUEST) {};
        }

        for (UUID judgeId : judgeIds) {
            validateJudgeCandidate(request.getEventId(), request.getRoundId(), request.getTeamId(), judgeId);
        }

        assignmentRepository.findByTeamIdAndRoundId(request.getTeamId(), request.getRoundId())
                .forEach(a -> assignmentRepository.delete(a));

        return judgeIds.stream()
                .map(judgeId -> teamJudgeAssignmentService.createAssignment(
                        request.getRoundId(), request.getTeamId(), judgeId))
                .toList();
    }

    @Transactional
    public void deleteAssignment(UUID assignmentId) {
        TeamJudgeAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("TeamJudgeAssignment", "id", assignmentId));

        Team team = teamRepository.findById(assignment.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", assignment.getTeamId()));
        eventService.enforceEventOwnership(team.getEventId());

        assignmentRepository.delete(assignment);
    }

    private void validateJudgeCandidate(UUID eventId, UUID roundId, UUID teamId, UUID judgeUserId) {
        if (!eventJudgeService.isEventJudge(eventId, judgeUserId)) {
            throw new BusinessException(
                    "Judge must be assigned to the event with role JUDGE or BOTH",
                    HttpStatus.BAD_REQUEST) {};
        }

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));

        if (!judgeAssignmentService.isJudgeAssignedToRoundScope(roundId, judgeUserId, team.getTrackId())) {
            throw new BusinessException(
                    "Judge is not assigned to this round and track",
                    HttpStatus.BAD_REQUEST) {};
        }

        if (teamPublicService.isMentorOfTeam(judgeUserId, teamId)) {
            throw new BusinessException(
                    "Cannot assign judge who is the mentor of this team (conflict of interest)",
                    HttpStatus.CONFLICT) {};
        }
    }

    private List<EventJudgeResponse> resolveEligibleJudges(
            UUID eventId, Round round, UUID roundId, UUID trackId, List<Team> teams) {
        List<UUID> judgeUserIds;
        if (round.getRoundType() == RoundType.FINAL) {
            judgeUserIds = judgeAssignmentService.getEligibleJudgeUserIds(roundId, null);
        } else if (trackId != null) {
            judgeUserIds = judgeAssignmentService.getEligibleJudgeUserIds(roundId, trackId);
        } else {
            judgeUserIds = teams.stream()
                    .map(Team::getTrackId)
                    .filter(java.util.Objects::nonNull)
                    .distinct()
                    .flatMap(tid -> judgeAssignmentService.getEligibleJudgeUserIds(roundId, tid).stream())
                    .distinct()
                    .toList();
        }

        return judgeUserIds.stream()
                .map(judgeUserId -> {
                    var judge = userPublicService.findById(judgeUserId).orElse(null);
                    return EventJudgeResponse.builder()
                            .judgeUserId(judgeUserId)
                            .judgeFullName(judge != null ? judge.getFullName() : null)
                            .judgeEmail(judge != null ? judge.getEmail() : null)
                            .build();
                })
                .toList();
    }

    private TeamAssignmentOverviewResponse buildTeamRow(
            Team team,
            Map<UUID, String> trackNames,
            Map<UUID, List<TeamJudgeAssignment>> assignmentsByTeam,
            Map<UUID, Submission> submissionsByTeam) {
        List<TeamJudgeAssignment> assignments = assignmentsByTeam.getOrDefault(team.getId(), List.of());
        Submission submission = submissionsByTeam.get(team.getId());

        UUID mentorUserId = null;
        String mentorFullName = null;
        MentorTeam mentorTeam = mentorTeamRepository.findByTeamId(team.getId()).orElse(null);
        if (mentorTeam != null) {
            mentorUserId = mentorTeam.getMentorUserId();
            mentorFullName = userPublicService.findById(mentorUserId)
                    .map(UserSnapshot::getFullName)
                    .orElse(null);
        }

        List<TeamJudgeAssignmentResponse> judgeResponses = assignments.stream()
                .map(teamJudgeAssignmentService::toResponse)
                .toList();

        return TeamAssignmentOverviewResponse.builder()
                .teamId(team.getId())
                .teamName(team.getName())
                .trackId(team.getTrackId())
                .trackName(team.getTrackId() != null ? trackNames.get(team.getTrackId()) : null)
                .memberCount(teamMemberRepository.countByTeamId(team.getId()))
                .mentorUserId(mentorUserId)
                .mentorFullName(mentorFullName)
                .submissionStatus(submission != null ? submission.getStatus() : null)
                .judges(judgeResponses)
                .judgeCount(judgeResponses.size())
                .build();
    }
}
