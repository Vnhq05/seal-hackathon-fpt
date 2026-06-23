package com.sealhackathon.team.service;

import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.team.domain.MentorTeam;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.dto.request.AssignMentorTeamRequest;
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
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MentorTeamService {

    private final MentorTeamRepository mentorTeamRepository;
    private final TeamRepository teamRepository;
    private final UserPublicService userPublicService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void assignMentorToTeam(AssignMentorTeamRequest request) {
        Team team = teamRepository.findById(request.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", request.getTeamId()));

        UserSnapshot mentor = userPublicService.findById(request.getMentorUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getMentorUserId()));

        if (mentor.getUserType() != UserType.LECTURER) {
            throw new BusinessException(
                    "User " + mentor.getEmail() + " is not a LECTURER",
                    HttpStatus.BAD_REQUEST) {};
        }

        if (mentorTeamRepository.existsByMentorUserIdAndTeamId(
                request.getMentorUserId(), request.getTeamId())) {
            throw new DuplicateResourceException("MentorTeam", "mentor+team",
                    mentor.getEmail() + " + " + team.getName());
        }

        MentorTeam mentorTeam = MentorTeam.builder()
                .mentorUserId(request.getMentorUserId())
                .team(team)
                .assignedAt(LocalDateTime.now())
                .build();

        mentorTeamRepository.save(mentorTeam);

        eventPublisher.publishEvent(new MentorTeamAssignedEvent(
                request.getMentorUserId(), request.getTeamId()));
    }

    @Transactional
    public void removeMentorFromTeam(UUID assignmentId) {
        MentorTeam mt = mentorTeamRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("MentorTeam", "id", assignmentId));
        mentorTeamRepository.delete(mt);
    }
}
