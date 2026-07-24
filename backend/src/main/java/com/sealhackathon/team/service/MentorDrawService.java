package com.sealhackathon.team.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.MentorAssignment;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.MentorAssignmentRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.team.domain.MentorTeam;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.dto.response.MentorDrawResultResponse;
import com.sealhackathon.team.dto.response.MentorTeamAssignmentResponse;
import com.sealhackathon.team.event.MentorTeamAssignedEvent;
import com.sealhackathon.team.repository.MentorTeamRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MentorDrawService {

    private final HackathonEventRepository eventRepository;
    private final TeamRepository teamRepository;
    private final TrackRepository trackRepository;
    private final MentorAssignmentRepository mentorAssignmentRepository;
    private final MentorTeamRepository mentorTeamRepository;
    private final UserPublicService userPublicService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public MentorDrawResultResponse drawMentors(UUID eventId) {
        eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        Map<UUID, String> trackNames = trackRepository.findByHackathonEventId(eventId).stream()
                .collect(Collectors.toMap(Track::getId, Track::getName, (a, b) -> a, LinkedHashMap::new));

        List<Team> candidates = teamRepository.findByEventId(eventId).stream()
                .filter(t -> t.getStatus() != TeamStatus.DISBANDED)
                .filter(t -> t.getTrackId() != null)
                .filter(t -> !mentorTeamRepository.existsByTeamId(t.getId()))
                .collect(Collectors.toCollection(ArrayList::new));

        if (candidates.isEmpty()) {
            return MentorDrawResultResponse.builder()
                    .assignments(List.of())
                    .assignedCount(0)
                    .unassignedCount(0)
                    .message("No teams need mentor assignment (all assigned or missing track)")
                    .build();
        }

        Map<UUID, List<Team>> byTrack = candidates.stream()
                .collect(Collectors.groupingBy(Team::getTrackId, LinkedHashMap::new, Collectors.toCollection(ArrayList::new)));

        List<MentorTeamAssignmentResponse> assignments = new ArrayList<>();
        int unassigned = 0;

        for (Map.Entry<UUID, List<Team>> entry : byTrack.entrySet()) {
            UUID trackId = entry.getKey();
            List<Team> teams = entry.getValue();
            Collections.shuffle(teams);

            List<UUID> mentorIds = mentorAssignmentRepository
                    .findByHackathonEventIdAndTrackId(eventId, trackId).stream()
                    .map(MentorAssignment::getMentorUserId)
                    .distinct()
                    .toList();

            if (mentorIds.isEmpty()) {
                unassigned += teams.size();
                continue;
            }

            Map<UUID, Integer> load = new HashMap<>();
            for (UUID mentorId : mentorIds) {
                load.put(mentorId, (int) mentorTeamRepository.countByMentorUserIdAndTrackId(mentorId, trackId));
            }

            int computedCapacity = (int) Math.ceil((double) (teams.size() + load.values().stream().mapToInt(Integer::intValue).sum())
                    / mentorIds.size());
            int maxExisting = load.values().stream().mapToInt(Integer::intValue).max().orElse(0);
            final int capacity = Math.max(computedCapacity, maxExisting);

            for (Team team : teams) {
                UUID picked = mentorIds.stream()
                        .filter(id -> load.getOrDefault(id, 0) < capacity)
                        .min(Comparator.comparingInt(id -> load.getOrDefault(id, 0)))
                        .orElse(null);

                if (picked == null) {
                    picked = mentorIds.stream()
                            .min(Comparator.comparingInt(id -> load.getOrDefault(id, 0)))
                            .orElse(null);
                }
                if (picked == null) {
                    unassigned++;
                    continue;
                }
                final UUID mentorId = picked;

                MentorTeam mt = MentorTeam.builder()
                        .mentorUserId(mentorId)
                        .team(team)
                        .assignedAt(LocalDateTime.now())
                        .build();
                mt = mentorTeamRepository.save(mt);
                load.put(mentorId, load.getOrDefault(mentorId, 0) + 1);

                eventPublisher.publishEvent(new MentorTeamAssignedEvent(mentorId, team.getId()));

                UserSnapshot mentor = userPublicService.findById(mentorId).orElse(null);
                assignments.add(MentorTeamAssignmentResponse.builder()
                        .id(mt.getId())
                        .teamId(team.getId())
                        .teamName(team.getName())
                        .trackId(trackId)
                        .trackName(trackNames.get(trackId))
                        .mentorUserId(mentorId)
                        .mentorFullName(mentor != null ? mentor.getFullName() : null)
                        .mentorEmail(mentor != null ? mentor.getEmail() : null)
                        .assignedAt(mt.getAssignedAt())
                        .build());
            }
        }

        String message = unassigned > 0
                ? "Assigned " + assignments.size() + " team(s); " + unassigned
                + " team(s) skipped (no mentors in track pool)"
                : "Assigned mentors to " + assignments.size() + " team(s)";

        return MentorDrawResultResponse.builder()
                .assignments(assignments)
                .assignedCount(assignments.size())
                .unassignedCount(unassigned)
                .message(message)
                .build();
    }

    @Transactional(readOnly = true)
    public List<MentorTeamAssignmentResponse> listAssignments(UUID eventId) {
        eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        Map<UUID, String> trackNames = trackRepository.findByHackathonEventId(eventId).stream()
                .collect(Collectors.toMap(Track::getId, Track::getName, (a, b) -> a));

        return mentorTeamRepository.findByEventIdWithTeam(eventId).stream()
                .map(mt -> {
                    Team team = mt.getTeam();
                    UserSnapshot mentor = userPublicService.findById(mt.getMentorUserId()).orElse(null);
                    UUID trackId = team.getTrackId();
                    return MentorTeamAssignmentResponse.builder()
                            .id(mt.getId())
                            .teamId(team.getId())
                            .teamName(team.getName())
                            .trackId(trackId)
                            .trackName(trackId != null ? trackNames.get(trackId) : null)
                            .mentorUserId(mt.getMentorUserId())
                            .mentorFullName(mentor != null ? mentor.getFullName() : null)
                            .mentorEmail(mentor != null ? mentor.getEmail() : null)
                            .assignedAt(mt.getAssignedAt())
                            .build();
                })
                .toList();
    }

    @Transactional
    public MentorTeamAssignmentResponse assignOne(UUID eventId, UUID teamId, UUID mentorUserId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));
        if (!team.getEventId().equals(eventId)) {
            throw new BusinessException("Team does not belong to this event", HttpStatus.BAD_REQUEST);
        }
        if (team.getTrackId() == null) {
            throw new BusinessException("Team must be assigned to a track before assigning a mentor", HttpStatus.BAD_REQUEST);
        }
        if (mentorTeamRepository.existsByTeamId(teamId)) {
            throw new BusinessException("Team already has a mentor assigned", HttpStatus.CONFLICT);
        }
        if (!mentorAssignmentRepository.existsByHackathonEventIdAndTrackIdAndMentorUserId(
                eventId, team.getTrackId(), mentorUserId)) {
            throw new BusinessException("Mentor is not assigned to this team's track", HttpStatus.BAD_REQUEST);
        }

        UserSnapshot mentor = userPublicService.findById(mentorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", mentorUserId));

        MentorTeam mt = MentorTeam.builder()
                .mentorUserId(mentorUserId)
                .team(team)
                .assignedAt(LocalDateTime.now())
                .build();
        mt = mentorTeamRepository.save(mt);
        eventPublisher.publishEvent(new MentorTeamAssignedEvent(mentorUserId, teamId));

        String trackName = trackRepository.findById(team.getTrackId()).map(Track::getName).orElse(null);
        return MentorTeamAssignmentResponse.builder()
                .id(mt.getId())
                .teamId(teamId)
                .teamName(team.getName())
                .trackId(team.getTrackId())
                .trackName(trackName)
                .mentorUserId(mentorUserId)
                .mentorFullName(mentor.getFullName())
                .mentorEmail(mentor.getEmail())
                .assignedAt(mt.getAssignedAt())
                .build();
    }
}
