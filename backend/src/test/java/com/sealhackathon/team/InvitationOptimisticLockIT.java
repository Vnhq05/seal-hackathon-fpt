package com.sealhackathon.team;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.team.domain.Invitation;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.enums.InvitationStatus;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.repository.InvitationRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.domain.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class InvitationOptimisticLockIT extends BaseIntegrationTest {

    @Autowired private TeamRepository teamRepository;
    @Autowired private InvitationRepository invitationRepository;

    @Test
    void concurrentStatusUpdate_raisesOptimisticLock() {
        User leader = createUser("optlock-leader@fpt.edu.vn", UserType.FPT_STUDENT, AccountStatus.ACTIVE);
        Team team = teamRepository.save(Team.builder()
                .eventId(java.util.UUID.randomUUID())
                .name("OptLock Team")
                .leaderId(leader.getId())
                .status(TeamStatus.FORMING)
                .build());

        Invitation invitation = invitationRepository.save(Invitation.builder()
                .team(team)
                .inviterId(leader.getId())
                .inviteeEmail("invitee@fpt.edu.vn")
                .status(InvitationStatus.PENDING)
                .build());

        Invitation a = invitationRepository.findById(invitation.getId()).orElseThrow();
        Invitation b = invitationRepository.findById(invitation.getId()).orElseThrow();

        a.setStatus(InvitationStatus.ACCEPTED);
        invitationRepository.saveAndFlush(a);

        b.setStatus(InvitationStatus.REJECTED);
        assertThatThrownBy(() -> invitationRepository.saveAndFlush(b))
                .isInstanceOfAny(
                        OptimisticLockingFailureException.class,
                        ObjectOptimisticLockingFailureException.class);
    }
}
