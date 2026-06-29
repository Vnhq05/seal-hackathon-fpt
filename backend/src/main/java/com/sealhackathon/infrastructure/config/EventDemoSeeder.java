package com.sealhackathon.infrastructure.config;

import com.sealhackathon.common.util.SeasonUtils;
import com.sealhackathon.event.domain.EventJudgeAssignment;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.JudgeAssignment;
import com.sealhackathon.event.domain.MentorAssignment;
import com.sealhackathon.event.domain.Round;
import com.sealhackathon.event.domain.ScoringTemplate;
import com.sealhackathon.event.domain.ScoringTemplateCriterion;
import com.sealhackathon.event.domain.Track;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.ScoringTemplateRepository;
import com.sealhackathon.team.domain.EventEnrollment;
import com.sealhackathon.team.domain.MentorTeam;
import com.sealhackathon.team.domain.Team;
import com.sealhackathon.team.domain.TeamMember;
import com.sealhackathon.team.domain.enums.EnrollmentStatus;
import com.sealhackathon.team.domain.enums.HackathonSkillRole;
import com.sealhackathon.team.domain.enums.TeamMemberRole;
import com.sealhackathon.team.domain.enums.TeamStatus;
import com.sealhackathon.team.repository.EventEnrollmentRepository;
import com.sealhackathon.team.repository.MentorTeamRepository;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.user.domain.User;
import com.sealhackathon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class EventDemoSeeder {

    public static final String DEV_COORDINATOR_EMAIL = "coordinator@seal.com";

    public static final String DEMO_EVENT_NAME_FALL = "SEAL Fall Hackathon Demo";
    private static final String DEMO_EVENT_NAME = DEMO_EVENT_NAME_FALL;
    private static final String FALL = "Fall";
    private static final int YEAR = 2026;

    private final HackathonEventRepository eventRepository;
    private final ScoringTemplateRepository scoringTemplateRepository;
    private final UserRepository userRepository;
    private final EventEnrollmentRepository enrollmentRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final MentorTeamRepository mentorTeamRepository;

    @Transactional
    public void seed() {
        normalizeExistingSeasons();

        if (hasFallDemoEvent()) {
            log.info("Fall {} demo event already present — skipping seed", YEAR);
            return;
        }

        ScoringTemplate template = scoringTemplateRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No scoring template available for demo seed"));

        User lecturer1 = requireUser("lecturer1@fpt.edu.vn");
        User lecturer2 = requireUser("lecturer2@fpt.edu.vn");
        User lecturer3 = requireUser("lecturer3@fpt.edu.vn");
        User lecturer4 = requireUser("lecturer4@fpt.edu.vn");
        User lecturer5 = requireUser("lecturer5@fpt.edu.vn");

        User student1 = requireUser("student1@fpt.edu.vn");
        User student2 = requireUser("student2@fpt.edu.vn");
        User student3 = requireUser("student3@fpt.edu.vn");

        LocalDateTime now = LocalDateTime.now();
        List<UUID> judgeIds = List.of(lecturer1.getId(), lecturer2.getId(), lecturer3.getId());

        List<UUID> tiebreakerIds = template.getCriteria().stream()
                .sorted(java.util.Comparator.comparingInt(ScoringTemplateCriterion::getSortOrder))
                .map(ScoringTemplateCriterion::getId)
                .toList();

        HackathonEvent event = HackathonEvent.builder()
                .name(DEMO_EVENT_NAME)
                .season(FALL)
                .year(YEAR)
                .startDate(LocalDate.of(YEAR, 9, 1))
                .endDate(LocalDate.of(YEAR, 11, 30))
                .registrationOpenDate(LocalDate.of(YEAR, 6, 1))
                .registrationDeadline(LocalDate.of(YEAR, 8, 31))
                .description("Demo hackathon for Fall " + YEAR + " — judge assignment testing")
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
                .status(EventStatus.OPEN)
                .build();
        event.setCreatedBy(DEV_COORDINATOR_EMAIL);
        event.getTiebreakerCriterionIds().addAll(tiebreakerIds);

        Track softwareTrack = Track.builder()
                .hackathonEvent(event)
                .name("Software Development")
                .description("Build innovative software solutions")
                .maxTeams(20)
                .scoringTemplateId(template.getId())
                .build();
        event.getTracks().add(softwareTrack);

        Track aiTrack = Track.builder()
                .hackathonEvent(event)
                .name("AI and Data")
                .description("Machine learning and data-driven projects")
                .maxTeams(20)
                .scoringTemplateId(template.getId())
                .build();
        event.getTracks().add(aiTrack);

        Round roundOne = Round.builder()
                .hackathonEvent(event)
                .roundNumber(1)
                .name("Round One")
                .startDate(LocalDateTime.of(YEAR, 10, 1, 8, 0))
                .endDate(LocalDateTime.of(YEAR, 10, 15, 23, 59))
                .submissionDeadline(LocalDateTime.of(YEAR, 10, 14, 23, 59))
                .scoringDeadline(LocalDateTime.of(YEAR, 10, 15, 23, 59))
                .advancementCutoff(10)
                .roundWeight(100)
                .build();

        for (UUID judgeId : judgeIds) {
            roundOne.getJudgeAssignments().add(JudgeAssignment.builder()
                    .round(roundOne)
                    .judgeUserId(judgeId)
                    .assignedAt(now)
                    .build());
        }
        event.getRounds().add(roundOne);

        for (UUID judgeId : judgeIds) {
            event.getEventJudgeAssignments().add(EventJudgeAssignment.builder()
                    .hackathonEvent(event)
                    .judgeUserId(judgeId)
                    .assignedAt(now)
                    .build());
        }

        HackathonEvent savedEvent = eventRepository.save(event);
        UUID eventId = savedEvent.getId();
        UUID softwareTrackId = savedEvent.getTracks().get(0).getId();
        UUID aiTrackId = savedEvent.getTracks().get(1).getId();

        savedEvent.getMentorAssignments().add(MentorAssignment.builder()
                .hackathonEvent(savedEvent)
                .trackId(softwareTrackId)
                .mentorUserId(lecturer4.getId())
                .assignedAt(now)
                .build());
        savedEvent.getMentorAssignments().add(MentorAssignment.builder()
                .hackathonEvent(savedEvent)
                .trackId(aiTrackId)
                .mentorUserId(lecturer5.getId())
                .assignedAt(now)
                .build());
        savedEvent = eventRepository.save(savedEvent);

        User student4 = requireUser("student4@fpt.edu.vn");
        User student5 = requireUser("student5@fpt.edu.vn");
        User student6 = requireUser("student6@fpt.edu.vn");

        seedEnrollment(student1.getId(), eventId, now);
        seedEnrollment(student2.getId(), eventId, now);
        seedEnrollment(student3.getId(), eventId, now);
        seedEnrollment(student4.getId(), eventId, now);
        seedEnrollment(student5.getId(), eventId, now);
        seedEnrollment(student6.getId(), eventId, now, true, HackathonSkillRole.FRONTEND);

        Team alpha = seedTeam(eventId, "Team Alpha", student1.getId(), softwareTrackId, now,
                List.of(student1.getId(), student2.getId(), student3.getId()), TeamStatus.CONFIRMED, null);
        Team beta = seedTeam(eventId, "Team Beta", student4.getId(), aiTrackId, now,
                List.of(student4.getId(), student5.getId()), TeamStatus.FORMING,
                TeamRecruitmentSeed.builder()
                        .isRecruiting(true)
                        .recruitmentNote("Looking for a backend developer to complete our team!")
                        .neededRoles(List.of(HackathonSkillRole.BACKEND, HackathonSkillRole.FULLSTACK))
                        .build());

        mentorTeamRepository.save(MentorTeam.builder()
                .mentorUserId(lecturer4.getId())
                .team(alpha)
                .assignedAt(now)
                .build());
        mentorTeamRepository.save(MentorTeam.builder()
                .mentorUserId(lecturer5.getId())
                .team(beta)
                .assignedAt(now)
                .build());

        log.info("Seeded Fall {} demo event '{}' with {} teams", YEAR, DEMO_EVENT_NAME, 2);
    }

    private void normalizeExistingSeasons() {
        eventRepository.findAll().forEach(event -> {
            String normalized = SeasonUtils.normalize(event.getSeason());
            if (!normalized.equals(event.getSeason())) {
                event.setSeason(normalized);
                eventRepository.save(event);
                log.info("Normalized event '{}' season to {}", event.getName(), normalized);
            }
        });
    }

    private boolean hasFallDemoEvent() {
        return eventRepository.findAll().stream()
                .anyMatch(e -> FALL.equalsIgnoreCase(e.getSeason())
                        && YEAR == e.getYear()
                        && DEMO_EVENT_NAME.equals(e.getName()));
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Required user not found: " + email));
    }

    private void seedEnrollment(
            UUID userId,
            UUID eventId,
            LocalDateTime now,
            boolean isLookingForTeam,
            HackathonSkillRole preferredRole) {
        if (enrollmentRepository.existsByUserIdAndEventId(userId, eventId)) {
            enrollmentRepository.findByUserIdAndEventId(userId, eventId).ifPresent(existing -> {
                existing.setLookingForTeam(isLookingForTeam);
                existing.setPreferredRole(preferredRole);
                enrollmentRepository.save(existing);
            });
            return;
        }
        enrollmentRepository.save(EventEnrollment.builder()
                .userId(userId)
                .eventId(eventId)
                .status(EnrollmentStatus.APPROVED)
                .enrolledAt(now)
                .isLookingForTeam(isLookingForTeam)
                .preferredRole(preferredRole)
                .build());
    }

    private void seedEnrollment(UUID userId, UUID eventId, LocalDateTime now) {
        seedEnrollment(userId, eventId, now, false, null);
    }

    private record TeamRecruitmentSeed(
            boolean isRecruiting,
            String recruitmentNote,
            List<HackathonSkillRole> neededRoles) {

        static TeamRecruitmentSeedBuilder builder() {
            return new TeamRecruitmentSeedBuilder();
        }

        static final class TeamRecruitmentSeedBuilder {
            private boolean isRecruiting;
            private String recruitmentNote;
            private List<HackathonSkillRole> neededRoles = List.of();

            TeamRecruitmentSeedBuilder isRecruiting(boolean value) {
                this.isRecruiting = value;
                return this;
            }

            TeamRecruitmentSeedBuilder recruitmentNote(String value) {
                this.recruitmentNote = value;
                return this;
            }

            TeamRecruitmentSeedBuilder neededRoles(List<HackathonSkillRole> value) {
                this.neededRoles = value;
                return this;
            }

            TeamRecruitmentSeed build() {
                return new TeamRecruitmentSeed(isRecruiting, recruitmentNote, neededRoles);
            }
        }
    }

    private Team seedTeam(
            UUID eventId,
            String name,
            UUID leaderId,
            UUID trackId,
            LocalDateTime now,
            List<UUID> memberIds,
            TeamStatus status,
            TeamRecruitmentSeed recruitment) {
        if (teamRepository.existsByEventIdAndName(eventId, name)) {
            return teamRepository.findByEventId(eventId).stream()
                    .filter(t -> name.equals(t.getName()))
                    .findFirst()
                    .orElseThrow();
        }

        Team.TeamBuilder teamBuilder = Team.builder()
                .eventId(eventId)
                .name(name)
                .leaderId(leaderId)
                .status(status)
                .trackId(trackId);

        if (recruitment != null) {
            teamBuilder
                    .isRecruiting(recruitment.isRecruiting())
                    .recruitmentNote(recruitment.recruitmentNote())
                    .neededRoles(new ArrayList<>(recruitment.neededRoles()));
        }

        Team team = teamBuilder.build();
        team = teamRepository.save(team);

        for (UUID memberId : memberIds) {
            if (teamMemberRepository.existsByTeamIdAndUserId(team.getId(), memberId)) {
                continue;
            }
            teamMemberRepository.save(TeamMember.builder()
                    .team(team)
                    .userId(memberId)
                    .role(memberId.equals(leaderId) ? TeamMemberRole.LEADER : TeamMemberRole.MEMBER)
                    .joinedAt(now)
                    .build());
        }
        return team;
    }
}
