package com.sealhackathon.ranking.listener;

import com.sealhackathon.judging.event.ScoreCreatedEvent;
import com.sealhackathon.judging.event.ScoreDeletedEvent;
import com.sealhackathon.judging.event.ScoreUpdatedEvent;
import com.sealhackathon.ranking.service.AggregationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class RankingEventListener {

    private final AggregationService aggregationService;

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onScoreCreated(ScoreCreatedEvent event) {
        aggregationService.recalculate(event.roundId());
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onScoreUpdated(ScoreUpdatedEvent event) {
        aggregationService.recalculate(event.roundId());
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void onScoreDeleted(ScoreDeletedEvent event) {
        aggregationService.recalculate(event.roundId());
    }
}
