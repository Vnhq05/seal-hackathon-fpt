package com.sealhackathon.infrastructure.config;

import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.ScoringTemplate;
import com.sealhackathon.event.domain.ScoringTemplateCriterion;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.domain.enums.RoundType;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.ScoringTemplateRepository;
import com.sealhackathon.team.domain.EventEnrollment;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.TeamMember;
import com.sealhackathon.team.domain.enums.EnrollmentStatus;
import com.sealhackathon.team.domain.enums.TeamMemberRole;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.repository.EventEnrollmentRepository;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.domain.User;
import com.sealhackathon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Dev event kept in {@link EventStatus#COMPLETED} so students on confirmed teams can submit post-event feedback.
 */
@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class FeedbackDemoSeeder {

    public static final String DEMO_EVENT_NAME_FEEDBACK = "DEV Feedback";
    private static final String SEASON = "Summer";
    private static final int YEAR = 2026;
    private static final String TEAM_NAME = "Team Echo";

    private final HackathonEventRepository eventRepository;
    private final RoundRepository roundRepository;
    private final ScoringTemplateRepository scoringTemplateRepository;
    private final UserRepository userRepository;
    private final EventEnrollmentRepository enrollmentRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;

    @Transactional
    public void seed() {
        HackathonEvent event = findEvent().orElseGet(this::createEvent);
        if (event == null) {
            return;
        }

        syncCompletedPhase(event);
        ensureTeamReady(event.getId(), LocalDateTime.now());

        log.info("Feedback demo ready: '{}' — login {} / {} → /student/feedback",
                DEMO_EVENT_NAME_FEEDBACK,
                DataSeeder.FEEDBACK_TEST_STUDENT_EMAILS.getFirst(),
                DataSeeder.DEMO_TEST_STUDENT_PASSWORD_HINT);
    }

    private Optional<HackathonEvent> findEvent() {
        return eventRepository.findAll().stream()
                .filter(e -> DEMO_EVENT_NAME_FEEDBACK.equals(e.getName()))
                .findFirst();
    }

    private HackathonEvent createEvent() {
        ScoringTemplate template = scoringTemplateRepository.findAll().stream()
                .findFirst()
                .orElse(null);
        if (template == null) {
            log.warn("Feedback demo seeder: no scoring template — skip");
            return null;
        }

        List<String> studentEmails = DataSeeder.FEEDBACK_TEST_STUDENT_EMAILS;
        if (studentEmails.size() < 3) {
            log.warn("Feedback demo seeder: need at least 3 feedback test students — skip");
            return null;
        }

        User leader = requireUser(studentEmails.get(0));
        User member2 = requireUser(studentEmails.get(1));
        User member3 = requireUser(studentEmails.get(2));

        LocalDateTime now = LocalDateTime.now();
        LocalDate start = LocalDate.now().minusDays(30);
        LocalDate end = LocalDate.now().minusDays(7);

        List<UUID> tiebreakerIds = template.getCriteria().stream()
                .sorted(Comparator.comparingInt(ScoringTemplateCriterion::getSortOrder))
                .map(ScoringTemplateCriterion::getId)
                .toList();

        HackathonEvent event = HackathonEvent.builder()
                .name(DEMO_EVENT_NAME_FEEDBACK)
                .season(SEASON)
                .year(YEAR)
                .startDate(start)
                .endDate(end)
                .registrationOpenDate(start.minusMonths(1))
                .registrationDeadline(start.minusDays(3))
                .description("Dev event for testing post-event participant feedback — event already completed")
                .location("FPT University Da Nang")
                .format("OFFLINE")
                .minTeam(3)
                .maxTeam(5)
                .semesterMin(4)
                .semesterMax(8)
                .scoringTemplateId(template.getId())
                .tiebreakerCriteria(tiebreakerIds.stream()
                        .map(id -> template.getCriteria().stream()
                                .filter(c -> c.getId().equals(id))
                                .map(ScoringTemplateCriterion::getName)
                                .findFirst()
                                .orElse(""))
                        .filter(name -> !name.isBlank())
                        .reduce((a, b) -> a + ", " + b)
                        .orElse(null))
                .status(EventStatus.COMPLETED)
                .build();
        event.setCreatedBy(EventDemoSeeder.DEV_COORDINATOR_EMAIL);
        event.getTiebreakerCriterionIds().addAll(tiebreakerIds);

        Track track = Track.builder()
                .hackathonEvent(event)
                .name("General Track")
                .description("Feedback smoke-test track")
                .maxTeams(20)
                .scoringTemplateId(template.getId())
                .build();
        event.getTracks().add(track);

        Round round = Round.builder()
                .hackathonEvent(event)
                .roundNumber(1)
                .name("Round One")
                .startDate(start.atStartOfDay())
                .endDate(end.atTime(23, 59))
                .submissionDeadline(end.atTime(18, 0))
                .scoringDeadline(end.atTime(23, 59))
                .advancementCutoff(10)
                .roundWeight(100)
                .roundType(RoundType.PRELIMINARY)
                .build();
        event.getRounds().add(round);

        HackathonEvent saved = eventRepository.save(event);
        UUID eventId = saved.getId();
        UUID trackId = saved.getTracks().getFirst().getId();

        for (User student : List.of(leader, member2, member3)) {
            seedEnrollment(student.getId(), eventId, now);
        }

        seedTeam(eventId, TEAM_NAME, leader.getId(), trackId, now,
                List.of(leader.getId(), member2.getId(), member3.getId()));

        log.info("Created feedback demo event '{}' with team {}", DEMO_EVENT_NAME_FEEDBACK, TEAM_NAME);
        return saved;
    }

    private void syncCompletedPhase(HackathonEvent event) {
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(30);
        LocalDate end = today.minusDays(7);
        boolean changed = false;

        if (event.getStatus() != EventStatus.COMPLETED) {
            event.setStatus(EventStatus.COMPLETED);
            changed = true;
        }
        if (!start.equals(event.getStartDate())) {
            event.setStartDate(start);
            changed = true;
        }
        if (!end.equals(event.getEndDate())) {
            event.setEndDate(end);
            changed = true;
        }
        if (changed) {
            eventRepository.save(event);
        }

        roundRepository.findByHackathonEventIdOrderByRoundNumberAsc(event.getId()).stream()
                .findFirst()
                .ifPresent(round -> {
                    LocalDateTime submissionEnd = end.atTime(18, 0);
                    LocalDateTime scoringEnd = end.atTime(23, 59);
                    if (!submissionEnd.equals(round.getSubmissionDeadline())
                            || !scoringEnd.equals(round.getScoringDeadline())) {
                        round.setStartDate(start.atStartOfDay());
                        round.setEndDate(scoringEnd);
                        round.setSubmissionDeadline(submissionEnd);
                        round.setScoringDeadline(scoringEnd);
                        roundRepository.save(round);
                    }
                });
    }

    private void ensureTeamReady(UUID eventId, LocalDateTime now) {
        teamRepository.findByEventId(eventId).stream()
                .filter(team -> TEAM_NAME.equals(team.getName()))
                .findFirst()
                .ifPresent(team -> {
                    if (team.getStatus() != TeamStatus.CONFIRMED) {
                        team.setStatus(TeamStatus.CONFIRMED);
                        teamRepository.save(team);
                    }
                });
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Required user not found: " + email));
    }

    private void seedEnrollment(UUID userId, UUID eventId, LocalDateTime now) {
        if (enrollmentRepository.existsByUserIdAndEventId(userId, eventId)) {
            enrollmentRepository.findByUserIdAndEventId(userId, eventId).ifPresent(existing -> {
                if (existing.getStatus() != EnrollmentStatus.APPROVED) {
                    existing.setStatus(EnrollmentStatus.APPROVED);
                    enrollmentRepository.save(existing);
                }
            });
            return;
        }
        enrollmentRepository.save(EventEnrollment.builder()
                .userId(userId)
                .eventId(eventId)
                .status(EnrollmentStatus.APPROVED)
                .enrolledAt(now.minusDays(35))
                .build());
    }

    private void seedTeam(
            UUID eventId,
            String name,
            UUID leaderId,
            UUID trackId,
            LocalDateTime now,
            List<UUID> memberIds) {
        if (teamRepository.existsByEventIdAndName(eventId, name)) {
            return;
        }

        Team team = teamRepository.save(Team.builder()
                .eventId(eventId)
                .name(name)
                .leaderId(leaderId)
                .status(TeamStatus.CONFIRMED)
                .trackId(trackId)
                .build());

        for (UUID memberId : memberIds) {
            if (teamMemberRepository.existsByTeamIdAndUserId(team.getId(), memberId)) {
                continue;
            }
            teamMemberRepository.save(TeamMember.builder()
                    .team(team)
                    .userId(memberId)
                    .role(memberId.equals(leaderId) ? TeamMemberRole.LEADER : TeamMemberRole.MEMBER)
                    .joinedAt(now.minusDays(28))
                    .build());
        }
    }
}
