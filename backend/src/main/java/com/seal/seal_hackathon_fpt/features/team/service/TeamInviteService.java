package com.seal.seal_hackathon_fpt.features.team.service;

import com.seal.seal_hackathon_fpt.common.mail.MailService;
import com.seal.seal_hackathon_fpt.features.competition.entity.Competition;
import com.seal.seal_hackathon_fpt.features.competition.repository.CompetitionRepository;
import com.seal.seal_hackathon_fpt.features.team.dto.InviteCompetitionInfoResponse;
import com.seal.seal_hackathon_fpt.features.team.entity.Team;
import com.seal.seal_hackathon_fpt.features.team.entity.TeamInvite;
import com.seal.seal_hackathon_fpt.features.team.repository.TeamInviteRepository;
import com.seal.seal_hackathon_fpt.features.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TeamInviteService {

    private final TeamInviteRepository inviteRepository;
    private final TeamService teamService;
    private final TeamRepository teamRepository;
    private final CompetitionRepository competitionRepository;
    private final MailService mailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public TeamInvite sendInvite(Long teamId, Long inviterId, String email) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        Competition competition = competitionRepository.findById(team.getCompetitionId())
                .orElseThrow(() -> new RuntimeException("Competition not found"));

        TeamInvite invite = TeamInvite.builder()
                .teamId(teamId)
                .fromUserId(inviterId)
                .toEmail(email)
                .track("TEAM_INVITE")
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        TeamInvite savedInvite = inviteRepository.save(invite);

        String competitionLink = frontendUrl + "/competitions/" + competition.getId();

        mailService.sendTeamInviteEmail(
                email,
                team.getName(),
                competition.getName(),
                competitionLink
        );

        return savedInvite;
    }

    public void acceptInvite(Long inviteId, Long currentUserId, String currentUserEmail) {
        TeamInvite invite = inviteRepository.findById(inviteId)
                .orElseThrow(() -> new RuntimeException("Invite not found"));

        if (!"PENDING".equals(invite.getStatus())) {
            throw new RuntimeException("Invite is not pending");
        }

        if (!invite.getToEmail().equalsIgnoreCase(currentUserEmail)) {
            throw new RuntimeException("You are not allowed to accept this invitation");
        }

        invite.setStatus("ACCEPTED");
        inviteRepository.save(invite);

        teamService.addMemberToTeam(invite.getTeamId(), currentUserId, false);
    }

    public InviteCompetitionInfoResponse getInviteCompetitionInfo(String token) {
        TeamInvite invite = inviteRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invite not found"));

        Team team = teamRepository.findById(invite.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found"));

        Competition competition = competitionRepository.findById(team.getCompetitionId())
                .orElseThrow(() -> new RuntimeException("Competition not found"));

        return new InviteCompetitionInfoResponse(
                team,
                competition,
                invite.getToEmail(),
                invite.getStatus()
        );
    }
}