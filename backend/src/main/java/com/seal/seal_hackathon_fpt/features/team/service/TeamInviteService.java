package com.seal.seal_hackathon_fpt.features.team.service;

import com.seal.seal_hackathon_fpt.features.team.entity.TeamInvite;
import com.seal.seal_hackathon_fpt.features.team.repository.TeamInviteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TeamInviteService {
    private final TeamInviteRepository inviteRepository;
    private final TeamService teamService;

    public TeamInvite sendInvite(Long teamId, Long inviterId, Long inviteeId) {
        TeamInvite invite = TeamInvite.builder()
                .teamId(teamId)
                .inviterId(inviterId)
                .inviteeId(inviteeId)
                .status("PENDING")
                .build();
        return inviteRepository.save(invite);
    }

    public void acceptInvite(Long inviteId, Long currentUserId) {
        TeamInvite invite = inviteRepository.findById(inviteId).orElseThrow();

        if (!invite.getInviteeId().equals(currentUserId)) {
            throw new RuntimeException("Bạn không có quyền chấp nhận lời mời này.");
        }

        invite.setStatus("ACCEPTED");
        inviteRepository.save(invite);

        // Add user vào team với vai trò member thường
        teamService.addMemberToTeam(invite.getTeamId(), currentUserId, false);
    }
}