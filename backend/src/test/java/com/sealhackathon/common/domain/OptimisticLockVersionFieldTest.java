package com.sealhackathon.common.domain;

import com.sealhackathon.judging.domain.ScoreReviewRequest;
import com.sealhackathon.ranking.domain.Ranking;
import com.sealhackathon.submission.domain.Submission;
import com.sealhackathon.team.domain.Invitation;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.TeamJoinRequest;
import com.sealhackathon.team.domain.TeamLeaveRequest;
import jakarta.persistence.Version;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.assertj.core.api.Assertions.assertThat;

class OptimisticLockVersionFieldTest {

    @Test
    void workflowEntities_haveJpaVersionAnnotation() throws Exception {
        assertVersionField(Team.class, "version");
        assertVersionField(Invitation.class, "version");
        assertVersionField(TeamJoinRequest.class, "version");
        assertVersionField(TeamLeaveRequest.class, "version");
        assertVersionField(Submission.class, "optLock");
        assertVersionField(Ranking.class, "lockVersion");
        assertVersionField(ScoreReviewRequest.class, "version");
    }

    private static void assertVersionField(Class<?> type, String fieldName) throws Exception {
        Field field = type.getDeclaredField(fieldName);
        assertThat(field.getAnnotation(Version.class))
                .as("%s.%s should be @Version", type.getSimpleName(), fieldName)
                .isNotNull();
    }
}
