package com.seal.seal_hackathon_fpt.features.team.controller;

import com.seal.seal_hackathon_fpt.features.team.dto.AddMemberRequest;
import com.seal.seal_hackathon_fpt.features.team.dto.CreateTeamRequest;
import com.seal.seal_hackathon_fpt.features.team.dto.SendInviteRequest;
import com.seal.seal_hackathon_fpt.features.team.entity.Team;
import com.seal.seal_hackathon_fpt.features.team.service.TeamInviteService;
import com.seal.seal_hackathon_fpt.features.team.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;
    private final TeamInviteService inviteService;

    // --- TEAM CRUD ---
    @PostMapping
    public ResponseEntity<?> createTeam(@RequestBody CreateTeamRequest request) {
        Long currentUserId = 1L; // Mock ID người tạo (Sẽ đổi thành lấy từ JWT sau)
        Team team = Team.builder()
                .competitionId(request.getCompetitionId())
                .name(request.getName())
                .build();
        return ResponseEntity.ok(teamService.createTeam(team, currentUserId));
    }

    // --- TEAM MEMBER API ---
    @PostMapping("/{teamId}/members")
    public ResponseEntity<?> addMember(
            @PathVariable Long teamId,
            @RequestBody AddMemberRequest request) {
        return ResponseEntity.ok(teamService.addMemberToTeam(teamId, request.getUserId(), request.getIsLeader()));
    }

    @DeleteMapping("/{teamId}/members/{userId}")
    public ResponseEntity<?> removeMember(@PathVariable Long teamId, @PathVariable Long userId) {
        teamService.removeMember(teamId, userId);
        return ResponseEntity.ok("Xóa thành viên thành công");
    }

    // --- TEAM INVITE API ---
    @PostMapping("/invites")
    public ResponseEntity<?> sendInvite(@RequestBody SendInviteRequest request) {
        Long currentUserId = 1L; // Mock ID người gửi mời
        return ResponseEntity.ok(inviteService.sendInvite(request.getTeamId(), currentUserId, request.getInviteeId()));
    }

    @PostMapping("/invites/{inviteId}/accept")
    public ResponseEntity<?> acceptInvite(@PathVariable Long inviteId) {
        Long currentUserId = 2L; // Mock ID người được mời
        inviteService.acceptInvite(inviteId, currentUserId);
        return ResponseEntity.ok("Chấp nhận lời mời và gia nhập team thành công");
    }
}
