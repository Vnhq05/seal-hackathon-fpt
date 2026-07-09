package com.sealhackathon.infrastructure.config;

import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.submission.repository.SubmissionRepository;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Keeps the Fall demo event in a dev-friendly phase:
 * submission open when no submissions exist, judging open once teams have submitted.
 */
@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class SubmissionDemoSeeder {

    private static final String DEMO_EVENT_NAME = EventDemoSeeder.DEMO_EVENT_NAME_FALL;
    private static final String FALL = "Fall";
    private static final int YEAR = 2026;

    private final HackathonEventRepository eventRepository;
    private final RoundRepository roundRepository;
    private final TeamRepository teamRepository;
    private final SubmissionRepository submissionRepository;

    @Transactional
    public void seed() {
        HackathonEvent event = eventRepository.findAll().stream()
                .filter(e -> FALL.equalsIgnoreCase(e.getSeason())
                        && YEAR == e.getYear()
                        && DEMO_EVENT_NAME.equals(e.getName()))
                .findFirst()
                .orElse(null);
        if (event == null) {
            log.debug("Fall {} demo event not found — skipping submission window refresh", YEAR);
            return;
        }

        ensureTeamsReady(event.getId());
        List<Round> rounds = roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(event.getId());
        if (rounds.isEmpty()) {
            return;
        }
        Round round = rounds.getFirst();
        boolean hasSubmissions = !submissionRepository.findByRoundId(round.getId()).isEmpty();

        if (hasSubmissions) {
            closeSubmissionForJudging(event, round);
            log.info("Judging phase active for '{}' — log in as lecturer1@fpt.edu.vn to score Team Alpha",
                    DEMO_EVENT_NAME);
        } else {
            refreshSubmissionWindow(event, round);
            log.info("Submission window active for '{}' — log in as student1@fpt.edu.vn (Team Alpha leader)",
                    DEMO_EVENT_NAME);
        }
    }

    private void refreshSubmissionWindow(HackathonEvent event, Round round) {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();

        event.setStartDate(today.minusDays(1));
        event.setEndDate(today.plusDays(7));
        eventRepository.save(event);

        round.setStartDate(now.minusHours(2));
        round.setEndDate(now.plusDays(2));
        round.setSubmissionDeadline(now.plusDays(2));
        round.setScoringDeadline(now.plusDays(2).plusHours(4));
        roundRepository.save(round);
    }

    private void closeSubmissionForJudging(HackathonEvent event, Round round) {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();

        event.setStartDate(today.minusDays(2));
        event.setEndDate(today.plusDays(5));
        eventRepository.save(event);

        round.setStartDate(now.minusDays(1));
        round.setEndDate(now.plusDays(2));
        round.setSubmissionDeadline(now.minusHours(1));
        round.setScoringDeadline(now.plusDays(2));
        roundRepository.save(round);
    }

    private void ensureTeamsReady(UUID eventId) {
        teamRepository.findByEventId(eventId).forEach(team -> {
            if (team.getTrackId() != null && team.getStatus() == TeamStatus.CONFIRMED) {
                return;
            }
            if (team.getTrackId() != null && team.getStatus() == TeamStatus.FORMING) {
                long memberCount = team.getMembers() != null ? team.getMembers().size() : 0;
                if (memberCount >= 3) {
                    team.setStatus(TeamStatus.CONFIRMED);
                    teamRepository.save(team);
                }
            }
        });
    }
}
