package com.sealhackathon.judging.listener;

import com.sealhackathon.event.event.ScoringWindowReopenedEvent;
import com.sealhackathon.judging.domain.enums.ScoreStatus;
import com.sealhackathon.judging.repository.JudgeScoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class JudgingEventListener {

    private final JudgeScoreRepository judgeScoreRepository;

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onScoringWindowReopened(ScoringWindowReopenedEvent event) {
        judgeScoreRepository.updateStatusByRoundId(
                event.roundId(), ScoreStatus.LOCKED, ScoreStatus.COMPLETED);
    }
}
