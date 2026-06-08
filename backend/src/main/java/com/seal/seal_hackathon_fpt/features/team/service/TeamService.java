    package com.seal.seal_hackathon_fpt.features.team.service;

    import com.seal.seal_hackathon_fpt.features.competition.entity.Competition;
    import com.seal.seal_hackathon_fpt.features.competition.repository.CompetitionRepository;
    import com.seal.seal_hackathon_fpt.features.team.dto.MyTeamResponse;
    import com.seal.seal_hackathon_fpt.features.team.entity.Team;
    import com.seal.seal_hackathon_fpt.features.team.entity.TeamMember;
    import com.seal.seal_hackathon_fpt.features.team.entity.TeamStatus;
    import com.seal.seal_hackathon_fpt.features.team.repository.TeamMemberRepository;
    import com.seal.seal_hackathon_fpt.features.team.repository.TeamRepository;
    import lombok.RequiredArgsConstructor;
    import org.springframework.stereotype.Service;

    import java.time.LocalDateTime;
    import java.util.List;

    @Service
    @RequiredArgsConstructor
    public class TeamService {

        private final TeamRepository teamRepository;
        private final TeamMemberRepository memberRepository;
        private final CompetitionRepository competitionRepository;

        public Team createTeam(Team team, Long creatorUserId) {
            Competition competition = competitionRepository.findById(team.getCompetitionId())
                    .orElseThrow(() -> new RuntimeException("Competition not found"));

            if (competition.getRegistrationDeadline() != null &&
                    LocalDateTime.now().isAfter(competition.getRegistrationDeadline())) {
                throw new RuntimeException("Registration deadline has passed. Cannot create team.");
            }

            team.setStatus(TeamStatus.INCOMPLETE);

            Team savedTeam = teamRepository.save(team);

            addMemberToTeam(savedTeam.getId(), creatorUserId, true);

            return savedTeam;
        }

        public List<Team> getAllTeams() {
            return teamRepository.findAll();
        }

        public Team getTeamById(Long teamId) {
            return teamRepository.findById(teamId)
                    .orElseThrow(() -> new RuntimeException("Team not found"));
        }

        public List<TeamMember> getMembersByTeamId(Long teamId) {
            return memberRepository.findByTeamId(teamId);
        }

        public TeamMember addMemberToTeam(Long teamId, Long userId, boolean isLeader) {
            Team team = teamRepository.findById(teamId)
                    .orElseThrow(() -> new RuntimeException("Team not found"));

            Competition competition = competitionRepository.findById(team.getCompetitionId())
                    .orElseThrow(() -> new RuntimeException("Competition not found"));

            if (competition.getRegistrationDeadline() != null &&
                    LocalDateTime.now().isAfter(competition.getRegistrationDeadline())) {
                throw new RuntimeException("Registration deadline has passed. Cannot add member.");
            }

            if (memberRepository.existsByTeamIdAndUserId(teamId, userId)) {
                throw new RuntimeException("User is already in this team");
            }

            long memberCount = memberRepository.countByTeamId(teamId);

            if (memberCount >= 5) {
                throw new RuntimeException("Team cannot have more than 5 members");
            }

            if (isLeader && memberRepository.existsByTeamIdAndIsLeaderTrue(teamId)) {
                throw new RuntimeException("This team already has a leader");
            }

            TeamMember member = TeamMember.builder()
                    .teamId(teamId)
                    .userId(userId)
                    .isLeader(isLeader)
                    .joinedAt(LocalDateTime.now())
                    .build();

            TeamMember savedMember = memberRepository.save(member);

            long newMemberCount = memberRepository.countByTeamId(teamId);

            if (newMemberCount >= 3 && newMemberCount <= 5) {
                team.setStatus(TeamStatus.REGISTERED);
            } else {
                team.setStatus(TeamStatus.INCOMPLETE);
            }

            teamRepository.save(team);

            return savedMember;
        }

        public void removeMember(Long teamId, Long userId) {
            TeamMember member = memberRepository.findByTeamIdAndUserId(teamId, userId)
                    .orElseThrow(() -> new RuntimeException("Member not found"));

            if (Boolean.TRUE.equals(member.getIsLeader())) {
                throw new RuntimeException("Cannot remove the leader");
            }

            memberRepository.delete(member);
        }

        public MyTeamResponse getMyTeam(Long userId) {
            TeamMember myMember = memberRepository.findFirstByUserId(userId)
                    .orElse(null);

            if (myMember == null) {
                return new MyTeamResponse(null, List.of(), false);
            }

            Team team = teamRepository.findById(myMember.getTeamId())
                    .orElseThrow(() -> new RuntimeException("Team not found"));

            List<TeamMember> members = memberRepository.findByTeamId(team.getId());

            return new MyTeamResponse(
                    team,
                    members,
                    Boolean.TRUE.equals(myMember.getIsLeader())
            );
        }
    }