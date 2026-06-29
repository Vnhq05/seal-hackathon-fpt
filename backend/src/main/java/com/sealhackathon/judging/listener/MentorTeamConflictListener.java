package com.sealhackathon.judging.listener;

import com.sealhackathon.judging.repository.JudgeScoreRepository;
import com.sealhackathon.judging.repository.TeamJudgeAssignmentRepository;
import com.sealhackathon.team.event.MentorTeamAssignedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class MentorTeamConflictListener {

    private final TeamJudgeAssignmentRepository teamJudgeAssignmentRepository;
    private final JudgeScoreRepository judgeScoreRepository;

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onMentorTeamAssigned(MentorTeamAssignedEvent event) {
        teamJudgeAssignmentRepository.findByJudgeUserId(event.mentorId()).stream()
                .filter(a -> a.getTeamId().equals(event.teamId()))
                .filter(a -> !judgeScoreRepository.existsByJudgeUserIdAndRoundIdAndTeamId(
                        a.getJudgeUserId(), a.getRoundId(), a.getTeamId()))
                .forEach(teamJudgeAssignmentRepository::delete);
    }
}
