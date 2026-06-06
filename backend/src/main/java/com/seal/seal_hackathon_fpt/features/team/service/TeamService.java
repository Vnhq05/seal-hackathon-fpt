package com.seal.seal_hackathon_fpt.features.team.service;

import com.seal.seal_hackathon_fpt.features.team.entity.Team;
import com.seal.seal_hackathon_fpt.features.team.entity.TeamMember;
import com.seal.seal_hackathon_fpt.features.team.repository.TeamMemberRepository;
import com.seal.seal_hackathon_fpt.features.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TeamService {
    private final TeamRepository teamRepository;
    private final TeamMemberRepository memberRepository;

    public Team createTeam(Team team, Long creatorUserId) {
        Team savedTeam = teamRepository.save(team);

        // Tự động gán người tạo làm Leader
        addMemberToTeam(savedTeam.getId(), creatorUserId, true);
        return savedTeam;
    }

    public TeamMember addMemberToTeam(Long teamId, Long userId, boolean isLeader) {
        // [BUSINESS RULE: User không được join nhiều lần trong cùng 1 team]
        if (memberRepository.existsByTeamIdAndUserId(teamId, userId)) {
            throw new RuntimeException("User is already in this team!");
        }

        // [BUSINESS RULE: 1 Leader / Team]
        if (isLeader && memberRepository.existsByTeamIdAndIsLeaderTrue(teamId)) {
            throw new RuntimeException("This team already has a Leader! Cannot add another Leader.");
        }

        TeamMember member = TeamMember.builder()
                .teamId(teamId)
                .userId(userId)
                .isLeader(isLeader)
                .build();
        return memberRepository.save(member);
    }

    public void removeMember(Long teamId, Long userId) {
        TeamMember member = memberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        if (member.getIsLeader()) {
            throw new RuntimeException("Cannot remove the Leader. Please transfer leadership first.");
        }
        memberRepository.delete(member);
    }
}