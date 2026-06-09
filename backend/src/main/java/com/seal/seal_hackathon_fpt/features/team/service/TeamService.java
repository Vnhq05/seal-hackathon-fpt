    package com.seal.seal_hackathon_fpt.features.team.service;

    import com.seal.seal_hackathon_fpt.features.competition.entity.Competition;
    import com.seal.seal_hackathon_fpt.features.competition.repository.CompetitionRepository;
    import com.seal.seal_hackathon_fpt.features.team.dto.MyTeamResponse;
    import com.seal.seal_hackathon_fpt.features.team.entity.Team;
    import com.seal.seal_hackathon_fpt.features.team.entity.TeamMember;
    import com.seal.seal_hackathon_fpt.features.team.entity.TeamStatus;
    import com.seal.seal_hackathon_fpt.features.team.repository.TeamMemberRepository;
    import com.seal.seal_hackathon_fpt.features.team.repository.TeamRepository;
    import com.seal.seal_hackathon_fpt.features.user.repository.UserRepository;
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
        private final UserRepository userRepository;
        private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

        /** Gắn email/tên (từ bảng users) vào từng member để FE hiển thị thay cho userId. */
        private List<TeamMember> enrichWithUser(List<TeamMember> members) {
            members.forEach(m -> userRepository.findById(m.getUserId()).ifPresent(u -> {
                m.setEmail(u.getEmail());
                m.setName(u.getFull_name());
            }));
            return members;
        }

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
            return enrichWithUser(memberRepository.findByTeamId(teamId));
        }

        /**
         * Leader thêm thành viên TRỰC TIẾP bằng email — không cần lời mời/accept.
         * Nếu email CHƯA có tài khoản → tự tạo 1 tài khoản Participant tạm (status pending,
         * mật khẩu ngẫu nhiên; người đó dùng "quên mật khẩu" để nhận tài khoản sau),
         * rồi add vào team. Vẫn áp dụng luật của addMemberToTeam (tối đa 5, trùng, hạn...).
         */
        public TeamMember addMemberByEmail(Long teamId, Long requesterId, String email) {
            if (email == null || email.trim().isEmpty()) {
                throw new RuntimeException("Email is required");
            }
            String normalized = email.trim().toLowerCase();
            if (!normalized.matches("^[A-Za-z0-9._%+-]+@gmail\\.com$")) {
                throw new RuntimeException("Email must be a valid Gmail address");
            }

            TeamMember requester = memberRepository.findByTeamIdAndUserId(teamId, requesterId)
                    .orElseThrow(() -> new RuntimeException("You are not a member of this team."));
            if (!Boolean.TRUE.equals(requester.getIsLeader())) {
                throw new RuntimeException("Only the team leader can add members.");
            }

            com.seal.seal_hackathon_fpt.features.user.entity.User user = userRepository.findByEmail(normalized)
                    .orElseGet(() -> {
                        int at = normalized.indexOf('@');
                        String displayName = at > 0 ? normalized.substring(0, at) : normalized;
                        com.seal.seal_hackathon_fpt.features.user.entity.User created =
                                com.seal.seal_hackathon_fpt.features.user.entity.User.builder()
                                        .full_name(displayName)
                                        .email(normalized)
                                        .password(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                                        .role(com.seal.seal_hackathon_fpt.features.user.entity.Role.Participant)
                                        .status(com.seal.seal_hackathon_fpt.features.user.entity.UserStatus.pending)
                                        .build();
                        return userRepository.save(created);
                    });

            return addMemberToTeam(teamId, user.getId(), false);
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

            List<TeamMember> members = enrichWithUser(memberRepository.findByTeamId(team.getId()));

            return new MyTeamResponse(
                    team,
                    members,
                    Boolean.TRUE.equals(myMember.getIsLeader())
            );
        }

        /**
         * Tất cả các team mà user tham gia — mỗi cuộc thi 1 team.
         * Dùng cho trang "My team": liệt kê mọi cuộc thi user đã đăng ký.
         */
        public List<MyTeamResponse> getMyTeams(Long userId) {
            return memberRepository.findByUserId(userId).stream()
                    .map(myMember -> {
                        Team team = teamRepository.findById(myMember.getTeamId())
                                .orElse(null);
                        if (team == null) return null;
                        List<TeamMember> members = enrichWithUser(memberRepository.findByTeamId(team.getId()));
                        return new MyTeamResponse(
                                team,
                                members,
                                Boolean.TRUE.equals(myMember.getIsLeader())
                        );
                    })
                    .filter(java.util.Objects::nonNull)
                    .toList();
        }

        /**
         * Leader đổi tên team — chỉ cho phép TRƯỚC khi cuộc thi bắt đầu (startDate).
         */
        public Team renameTeam(Long teamId, Long userId, String newName) {
            if (newName == null || newName.trim().isEmpty()) {
                throw new RuntimeException("Team name must not be empty.");
            }

            Team team = teamRepository.findById(teamId)
                    .orElseThrow(() -> new RuntimeException("Team not found"));

            TeamMember member = memberRepository.findByTeamIdAndUserId(teamId, userId)
                    .orElseThrow(() -> new RuntimeException("You are not a member of this team."));

            if (!Boolean.TRUE.equals(member.getIsLeader())) {
                throw new RuntimeException("Only the team leader can rename the team.");
            }

            Competition competition = competitionRepository.findById(team.getCompetitionId())
                    .orElseThrow(() -> new RuntimeException("Competition not found"));

            if (competition.getStartDate() != null &&
                    LocalDateTime.now().isAfter(competition.getStartDate())) {
                throw new RuntimeException("Competition has already started. Team name can no longer be changed.");
            }

            team.setName(newName.trim());
            return teamRepository.save(team);
        }
    }