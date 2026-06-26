package com.sealhackathon.team.service;

import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.repository.MentorAssignmentRepository;
import com.sealhackathon.event.service.EventPublicService;
import com.sealhackathon.team.domain.MentorInvitation;
import com.sealhackathon.team.domain.MentorTeam;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.enums.MentorInvitationStatus;
import com.sealhackathon.team.dto.request.RespondMentorInvitationRequest;
import com.sealhackathon.team.dto.request.SendMentorInvitationRequest;
import com.sealhackathon.team.dto.response.MentorInvitationResponse;
import com.sealhackathon.team.dto.response.MentorRoomResponse;
import com.sealhackathon.team.repository.MentorInvitationRepository;
import com.sealhackathon.team.repository.MentorTeamRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MentorInvitationService {

    private final MentorInvitationRepository invitationRepository;
    private final MentorTeamRepository mentorTeamRepository;
    private final TeamRepository teamRepository;
    private final MentorAssignmentRepository mentorAssignmentRepository;
    private final EventPublicService eventPublicService;
    private final UserPublicService userPublicService;

    @Transactional
    public MentorInvitationResponse sendInvitation(UUID leaderId, UUID eventId, SendMentorInvitationRequest request) {
        eventPublicService.getEvent(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));

        Team team = teamRepository.findById(request.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", request.getTeamId()));

        if (!team.getEventId().equals(eventId)) {
            throw new BusinessException("Team does not belong to this event", HttpStatus.BAD_REQUEST) {};
        }

        if (!team.getLeaderId().equals(leaderId)) {
            throw new BusinessException("Only the team leader can invite a mentor", HttpStatus.FORBIDDEN) {};
        }

        if (mentorTeamRepository.existsByTeamId(team.getId())) {
            throw new BusinessException("Team already has a mentor assigned", HttpStatus.CONFLICT) {};
        }

        if (!mentorAssignmentRepository.existsByHackathonEventIdAndMentorUserId(eventId, request.getMentorUserId())) {
            throw new BusinessException("Mentor is not assigned to this event", HttpStatus.BAD_REQUEST) {};
        }

        UserSnapshot mentor = userPublicService.findById(request.getMentorUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getMentorUserId()));

        if (mentor.getUserType() != UserType.LECTURER) {
            throw new BusinessException("Selected user is not a mentor", HttpStatus.BAD_REQUEST) {};
        }

        if (invitationRepository.existsByTeamIdAndMentorUserIdAndStatus(
                team.getId(), request.getMentorUserId(), MentorInvitationStatus.PENDING)) {
            throw new DuplicateResourceException("MentorInvitation", "team+mentor",
                    team.getName() + "+" + mentor.getEmail());
        }

        MentorInvitation invitation = MentorInvitation.builder()
                .team(team)
                .mentorUserId(request.getMentorUserId())
                .inviterId(leaderId)
                .status(MentorInvitationStatus.PENDING)
                .message(request.getMessage())
                .build();

        invitation = invitationRepository.save(invitation);
        return toResponse(invitation, mentor, team);
    }

    @Transactional
    public MentorInvitationResponse respond(UUID mentorId, UUID eventId, UUID invitationId,
                                            RespondMentorInvitationRequest request) {
        MentorInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("MentorInvitation", "id", invitationId));

        Team team = invitation.getTeam();
        if (!team.getEventId().equals(eventId)) {
            throw new BusinessException("Invitation does not belong to this event", HttpStatus.BAD_REQUEST) {};
        }

        if (!invitation.getMentorUserId().equals(mentorId)) {
            throw new BusinessException("This invitation is not for you", HttpStatus.FORBIDDEN) {};
        }

        if (invitation.getStatus() != MentorInvitationStatus.PENDING) {
            throw new BusinessException("Invitation is no longer pending", HttpStatus.BAD_REQUEST) {};
        }

        if (request.getDecision() == MentorInvitationStatus.ACCEPTED) {
            if (mentorTeamRepository.existsByTeamId(team.getId())) {
                throw new BusinessException("Team already has a mentor", HttpStatus.CONFLICT) {};
            }

            invitation.setStatus(MentorInvitationStatus.ACCEPTED);
            invitationRepository.save(invitation);

            invitationRepository.findByTeamIdAndStatus(team.getId(), MentorInvitationStatus.PENDING)
                    .forEach(pending -> {
                        pending.setStatus(MentorInvitationStatus.DENIED);
                        invitationRepository.save(pending);
                    });

            MentorTeam mentorTeam = MentorTeam.builder()
                    .mentorUserId(mentorId)
                    .team(team)
                    .assignedAt(LocalDateTime.now())
                    .build();
            mentorTeamRepository.save(mentorTeam);
        } else if (request.getDecision() == MentorInvitationStatus.DENIED) {
            invitation.setStatus(MentorInvitationStatus.DENIED);
            invitationRepository.save(invitation);
        } else {
            throw new BusinessException("Invalid decision", HttpStatus.BAD_REQUEST) {};
        }

        UserSnapshot mentor = userPublicService.findById(mentorId).orElse(null);
        return toResponse(invitation, mentor, team);
    }

    @Transactional(readOnly = true)
    public List<MentorInvitationResponse> getByTeam(UUID eventId, UUID teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));
        if (!team.getEventId().equals(eventId)) {
            throw new BusinessException("Team does not belong to this event", HttpStatus.BAD_REQUEST) {};
        }
        return invitationRepository.findByTeamIdOrderByCreatedAtDesc(teamId).stream()
                .map(inv -> toResponse(inv, userPublicService.findById(inv.getMentorUserId()).orElse(null), team))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MentorInvitationResponse> getPendingForMentor(UUID mentorId, UUID eventId) {
        eventPublicService.getEvent(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
        return invitationRepository.findByMentorUserIdAndStatus(mentorId, MentorInvitationStatus.PENDING).stream()
                .filter(inv -> inv.getTeam().getEventId().equals(eventId))
                .map(inv -> toResponse(inv, userPublicService.findById(mentorId).orElse(null), inv.getTeam()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MentorInvitationResponse> getAllPendingForMentor(UUID mentorId) {
        return invitationRepository.findByMentorUserIdAndStatus(mentorId, MentorInvitationStatus.PENDING).stream()
                .map(inv -> toResponse(inv, userPublicService.findById(mentorId).orElse(null), inv.getTeam()))
                .toList();
    }

    @Transactional(readOnly = true)
    public MentorRoomResponse getRoomByTeam(UUID eventId, UUID teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", teamId));
        if (!team.getEventId().equals(eventId)) {
            throw new BusinessException("Team does not belong to this event", HttpStatus.BAD_REQUEST) {};
        }
        return mentorTeamRepository.findByTeamId(teamId)
                .map(mt -> toRoomResponse(mt, team))
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<MentorRoomResponse> getMentorActiveRooms(UUID mentorId, UUID eventId) {
        eventPublicService.getEvent(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", eventId));
        return mentorTeamRepository.findByMentorUserIdAndEventId(mentorId, eventId).stream()
                .map(mt -> toRoomResponse(mt, mt.getTeam()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MentorRoomResponse> getAllMentorActiveRooms(UUID mentorId) {
        return mentorTeamRepository.findByMentorUserId(mentorId).stream()
                .map(mt -> toRoomResponse(mt, mt.getTeam()))
                .toList();
    }

    private MentorInvitationResponse toResponse(MentorInvitation inv, UserSnapshot mentor, Team team) {
        return MentorInvitationResponse.builder()
                .id(inv.getId())
                .teamId(team.getId())
                .teamName(team.getName())
                .eventId(team.getEventId())
                .mentorUserId(inv.getMentorUserId())
                .mentorEmail(mentor != null ? mentor.getEmail() : null)
                .mentorName(mentor != null ? mentor.getFullName() : null)
                .status(inv.getStatus())
                .message(inv.getMessage())
                .createdAt(inv.getCreatedAt())
                .build();
    }

    private MentorRoomResponse toRoomResponse(MentorTeam mt, Team team) {
        return MentorRoomResponse.builder()
                .id(mt.getId())
                .teamId(team.getId())
                .teamName(team.getName())
                .eventId(team.getEventId())
                .mentorUserId(mt.getMentorUserId())
                .createdAt(mt.getAssignedAt())
                .build();
    }
}
