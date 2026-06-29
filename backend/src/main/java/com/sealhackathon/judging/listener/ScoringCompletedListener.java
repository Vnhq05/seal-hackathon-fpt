package com.sealhackathon.judging.listener;

import com.sealhackathon.judging.event.ScoringCompletedEvent;
import com.sealhackathon.judging.service.ScoreReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class ScoringCompletedListener {

    private final ScoreReviewService scoreReviewService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onScoringCompleted(ScoringCompletedEvent event) {
        scoreReviewService.evaluateSubmission(event.submissionId());
    }
}
