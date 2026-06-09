package com.seal.seal_hackathon_fpt.features.team.controller;

import com.seal.seal_hackathon_fpt.features.team.dto.AddMemberRequest;
import com.seal.seal_hackathon_fpt.features.team.dto.CreateTeamRequest;
import com.seal.seal_hackathon_fpt.features.team.dto.MyTeamResponse;
import com.seal.seal_hackathon_fpt.features.team.dto.SendInviteRequest;
import com.seal.seal_hackathon_fpt.features.team.dto.UpdateTeamRequest;

import java.util.List;
import com.seal.seal_hackathon_fpt.features.team.entity.Team;
import com.seal.seal_hackathon_fpt.features.team.entity.TeamMember;
import com.seal.seal_hackathon_fpt.features.team.service.TeamInviteService;
import com.seal.seal_hackathon_fpt.features.team.service.TeamService;
import com.seal.seal_hackathon_fpt.features.user.entity.User;
import com.seal.seal_hackathon_fpt.features.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;
    private final TeamInviteService inviteService;
    private final UserRepository userRepository;

    private Long getCurrentUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Unauthorized");
        }

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return user.getId();
    }

    private String getCurrentUserEmail(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Unauthorized");
        }

        return authentication.getName();
    }

    @PostMapping
    public ResponseEntity<?> createTeam(
            @RequestBody CreateTeamRequest request,
            Authentication authentication
    ) {
        Long currentUserId = getCurrentUserId(authentication);

        Team team = Team.builder()
                .competitionId(request.getCompetitionId())
                .name(request.getName())
                .build();

        return ResponseEntity.ok(
                teamService.createTeam(team, currentUserId)
        );
    }

    @GetMapping
    public ResponseEntity<?> getAllTeams() {
        return ResponseEntity.ok(teamService.getAllTeams());
    }

    @GetMapping("/{teamId}")
    public ResponseEntity<?> getTeamById(@PathVariable Long teamId) {
        return ResponseEntity.ok(teamService.getTeamById(teamId));
    }

    @GetMapping("/{teamId}/members")
    public ResponseEntity<?> getTeamMembers(@PathVariable Long teamId) {
        return ResponseEntity.ok(teamService.getMembersByTeamId(teamId));
    }

    @PostMapping("/{teamId}/members")
    public TeamMember addMember(
            @PathVariable Long teamId,
            @RequestBody AddMemberRequest request
    ) {
        return teamService.addMemberToTeam(
                teamId,
                request.getUserId(),
                Boolean.TRUE.equals(request.getIsLeader())
        );
    }

    // Leader thêm thành viên TRỰC TIẾP bằng email (vào team luôn, không cần accept).
    @PostMapping("/{teamId}/members/by-email")
    public ResponseEntity<?> addMemberByEmail(
            @PathVariable Long teamId,
            @RequestBody SendInviteRequest request,
            Authentication authentication
    ) {
        Long currentUserId = getCurrentUserId(authentication);
        return ResponseEntity.ok(
                teamService.addMemberByEmail(teamId, currentUserId, request.getEmail())
        );
    }

    @DeleteMapping("/{teamId}/members/{userId}")
    public ResponseEntity<?> removeMember(
            @PathVariable Long teamId,
            @PathVariable Long userId
    ) {
        teamService.removeMember(teamId, userId);
        return ResponseEntity.ok("Member removed successfully");
    }

    @PostMapping("/{teamId}/invites")
    public ResponseEntity<?> sendInvite(
            @PathVariable Long teamId,
            @RequestBody SendInviteRequest request,
            Authentication authentication
    ) {
        Long currentUserId = getCurrentUserId(authentication);

        return ResponseEntity.ok(
                inviteService.sendInvite(
                        teamId,
                        currentUserId,
                        request.getEmail()
                )
        );
    }

    @PostMapping("/invites/{inviteId}/accept")
    public ResponseEntity<?> acceptInvite(
            @PathVariable Long inviteId,
            Authentication authentication
    ) {
        Long currentUserId = getCurrentUserId(authentication);
        String currentUserEmail = getCurrentUserEmail(authentication);

        inviteService.acceptInvite(inviteId, currentUserId, currentUserEmail);

        return ResponseEntity.ok("Invitation accepted and joined the team successfully");
    }

    @GetMapping("/my-team")
    public MyTeamResponse getMyTeam(Authentication authentication) {
        Long currentUserId = getCurrentUserId(authentication);

        return teamService.getMyTeam(currentUserId);
    }

    // Tất cả các team (mỗi cuộc thi 1 team) mà user đang đăng nhập tham gia.
    @GetMapping("/my-teams")
    public List<MyTeamResponse> getMyTeams(Authentication authentication) {
        Long currentUserId = getCurrentUserId(authentication);

        return teamService.getMyTeams(currentUserId);
    }

    // Leader đổi tên team (chỉ trước khi cuộc thi bắt đầu).
    @PutMapping("/{teamId}")
    public ResponseEntity<?> renameTeam(
            @PathVariable Long teamId,
            @RequestBody UpdateTeamRequest request,
            Authentication authentication
    ) {
        Long currentUserId = getCurrentUserId(authentication);

        return ResponseEntity.ok(
                teamService.renameTeam(teamId, currentUserId, request.getName())
        );
    }

}