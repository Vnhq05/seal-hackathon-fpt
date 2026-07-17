package com.sealhackathon.judging.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.dto.response.EventJudgeResponse;
import com.sealhackathon.event.repository.CompetitionGroupRepository;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.event.service.EventOwnershipGuard;
import com.sealhackathon.event.service.JudgeAssignmentService;
import com.sealhackathon.judging.dto.response.EventAssignmentsOverviewResponse;
import com.sealhackathon.judging.dto.response.TeamAssignmentOverviewResponse;
import com.sealhackathon.judging.dto.response.TeamJudgeAssignmentResponse;
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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssignmentOverviewService {

    private final HackathonEventRepository eventRepository;
    private final RoundRepository roundRepository;
    private final TrackRepository trackRepository;
    private final CompetitionGroupRepository competitionGroupRepository;
    private final TeamRepository teamRepository;
    private final MentorTeamRepository mentorTeamRepository;
    private final SubmissionRepository submissionRepository;
    private final JudgeAssignmentService judgeAssignmentService;
    private final TeamPublicService teamPublicService;
    private final TeamMemberRepository teamMemberRepository;
    private final UserPublicService userPublicService;
    private final EventOwnershipGuard eventOwnershipGuard;

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

        eventOwnershipGuard.enforceEventOwnership(eventId);

        List<Team> teams = teamRepository.findByEventId(eventId).stream()
                .filter(t -> trackId == null || trackId.equals(t.getTrackId()))
                .toList();

        List<EventJudgeResponse> eligibleJudges = resolveEligibleJudges(eventId, round, roundId, trackId, teams);

        Map<UUID, String> trackNames = trackRepository.findByHackathonEventId(eventId).stream()
                .collect(Collectors.toMap(Track::getId, Track::getName));
        Map<UUID, String> groupNames = competitionGroupRepository.findAll().stream()
                .filter(g -> trackNames.containsKey(g.getTrackId()))
                .collect(Collectors.toMap(
                        com.sealhackathon.event.domain.CompetitionGroup::getId,
                        com.sealhackathon.event.domain.CompetitionGroup::getName,
                        (a, b) -> a));

        Map<UUID, Submission> submissionsByTeam = submissionRepository.findByRoundId(roundId).stream()
                .collect(Collectors.toMap(Submission::getTeamId, s -> s, (a, b) -> a));

        List<TeamAssignmentOverviewResponse> teamRows = teams.stream()
                .map(team -> buildTeamRow(team, round, trackNames, groupNames, submissionsByTeam))
                .toList();

        return EventAssignmentsOverviewResponse.builder()
                .eventId(eventId)
                .roundId(roundId)
                .eligibleJudges(eligibleJudges)
                .teams(teamRows)
                .build();
    }

    private List<EventJudgeResponse> resolveEligibleJudges(
            UUID eventId, Round round, UUID roundId, UUID trackId, List<Team> teams) {
        List<UUID> judgeUserIds;
        if (round.getRoundType() == RoundType.FINAL) {
            judgeUserIds = teams.stream()
                    .flatMap(t -> judgeAssignmentService.getEligibleJudgeUserIds(
                            roundId, t.getTrackId(), t.getGroupId()).stream())
                    .distinct()
                    .toList();
        } else if (trackId != null) {
            judgeUserIds = teamRepository.findByEventIdAndTrackId(eventId, trackId).stream()
                    .flatMap(t -> judgeAssignmentService.getEligibleJudgeUserIds(
                            roundId, t.getTrackId(), t.getGroupId()).stream())
                    .distinct()
                    .toList();
        } else {
            judgeUserIds = teams.stream()
                    .flatMap(t -> judgeAssignmentService.getEligibleJudgeUserIds(
                            roundId, t.getTrackId(), t.getGroupId()).stream())
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
            Round round,
            Map<UUID, String> trackNames,
            Map<UUID, String> groupNames,
            Map<UUID, Submission> submissionsByTeam) {
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

        List<UUID> poolJudgeIds = judgeAssignmentService.getEffectiveJudgeUserIdsForTeam(
                round.getId(), team.getId(), team.getTrackId(), team.getGroupId());
        List<TeamJudgeAssignmentResponse> judgeResponses = poolJudgeIds.stream()
                .map(judgeUserId -> TeamJudgeAssignmentResponse.builder()
                        .teamId(team.getId())
                        .roundId(round.getId())
                        .judgeUserId(judgeUserId)
                        .judgeFullName(userPublicService.findById(judgeUserId)
                                .map(UserSnapshot::getFullName)
                                .orElse(null))
                        .build())
                .toList();

        return TeamAssignmentOverviewResponse.builder()
                .teamId(team.getId())
                .teamName(team.getName())
                .trackId(team.getTrackId())
                .trackName(team.getTrackId() != null ? trackNames.get(team.getTrackId()) : null)
                .groupId(team.getGroupId())
                .groupName(team.getGroupId() != null ? groupNames.get(team.getGroupId()) : null)
                .memberCount(teamMemberRepository.countByTeamId(team.getId()))
                .mentorUserId(mentorUserId)
                .mentorFullName(mentorFullName)
                .submissionStatus(submission != null ? submission.getStatus() : null)
                .judges(judgeResponses)
                .judgeCount(judgeResponses.size())
                .build();
    }
}
