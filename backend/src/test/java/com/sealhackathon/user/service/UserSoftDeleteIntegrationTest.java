package com.sealhackathon.user.service;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.audit.domain.AuditLog;
import com.sealhackathon.audit.repository.AuditLogRepository;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.submission.domain.Submission;
import com.sealhackathon.submission.domain.enums.SubmissionStatus;
import com.sealhackathon.submission.repository.SubmissionRepository;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.TeamMember;
import com.sealhackathon.team.domain.enums.TeamMemberRole;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.domain.User;
import com.sealhackathon.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Soft-delete must succeed even when UUID refs exist (audit / leader / submission).
 * Requires Docker + SQL Server Testcontainers (BaseIntegrationTest).
 */
class UserSoftDeleteIntegrationTest extends BaseIntegrationTest {

    @Autowired private UserService userService;
    @Autowired private UserRepository userRepository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private TeamRepository teamRepository;
    @Autowired private TeamMemberRepository teamMemberRepository;
    @Autowired private SubmissionRepository submissionRepository;

    @Test
    void deleteUser_keepsRowAndAudit_whenLeaderAndSubmitter() {
        User admin = createAdmin();
        User target = createStudent();
        target.setStudentId("SE654321");
        target = userRepository.save(target);
        final UUID targetId = target.getId();

        AuditLog audit = AuditLog.builder()
                .actorId(targetId)
                .action("TEST_ACTION")
                .targetType("User")
                .targetId(targetId)
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(audit);

        UUID eventId = UUID.randomUUID();
        UUID roundId = UUID.randomUUID();
        Team team = teamRepository.save(Team.builder()
                .eventId(eventId)
                .name("SoftDelete Team")
                .leaderId(targetId)
                .status(TeamStatus.FORMING)
                .build());
        teamMemberRepository.save(TeamMember.builder()
                .team(team)
                .eventId(eventId)
                .userId(targetId)
                .role(TeamMemberRole.LEADER)
                .joinedAt(LocalDateTime.now())
                .build());
        submissionRepository.save(Submission.builder()
                .teamId(team.getId())
                .roundId(roundId)
                .status(SubmissionStatus.SUBMITTED)
                .submittedBy(targetId)
                .build());

        userService.deleteUser(targetId, admin.getId());

        User deleted = userRepository.findById(targetId).orElseThrow();
        assertThat(deleted.getStatus()).isEqualTo(AccountStatus.DELETED);
        assertThat(deleted.getEmail()).startsWith("deleted+");
        assertThat(deleted.getStudentId()).isNull();

        assertThat(auditLogRepository.findById(audit.getId())).isPresent();
        assertThat(auditLogRepository.findById(audit.getId()).orElseThrow().getActorId())
                .isEqualTo(targetId);
        assertThat(teamRepository.findById(team.getId()).orElseThrow().getLeaderId())
                .isEqualTo(targetId);
        assertThat(submissionRepository.findAll()).anyMatch(s -> targetId.equals(s.getSubmittedBy()));
    }
}