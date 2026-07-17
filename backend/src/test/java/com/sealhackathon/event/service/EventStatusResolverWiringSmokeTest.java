package com.sealhackathon.event.service;

import com.sealhackathon.audit.service.AuditService;
import com.sealhackathon.auth.service.AuthPublicService;
import com.sealhackathon.common.service.SystemConfigService;
import com.sealhackathon.common.storage.FileStorageService;
import com.sealhackathon.event.repository.CompetitionGroupRepository;
import com.sealhackathon.event.repository.CriteriaRepository;
import com.sealhackathon.event.repository.EventJudgeAssignmentRepository;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.JudgeAssignmentRepository;
import com.sealhackathon.event.repository.MentorAssignmentRepository;
import com.sealhackathon.event.repository.RoundRepository;
import com.sealhackathon.event.repository.ScoringTemplateRepository;
import com.sealhackathon.event.repository.TrackRepository;
import com.sealhackathon.team.repository.TeamMemberRepository;
import com.sealhackathon.team.repository.TeamRepository;
import com.sealhackathon.team.service.EventEnrollmentService;
import com.sealhackathon.team.service.GroupAssignmentService;
import com.sealhackathon.team.service.TeamService;
import com.sealhackathon.user.service.UserPublicService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.AutowiredAnnotationBeanPostProcessor;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.context.event.ApplicationEventMulticaster;
import org.springframework.context.event.SimpleApplicationEventMulticaster;
import org.springframework.core.env.MapPropertySource;
import org.springframework.mock.env.MockEnvironment;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

/**
 * Loads the EventService / FormatRuleEngine / TeamService / EventPublicServiceImpl /
 * EventJudgeService cluster with {@code allow-circular-references=false} and without Docker.
 * Proves EventStatusResolver and EventFinder broke the old cycles.
 */
class EventStatusResolverWiringSmokeTest {

    private AnnotationConfigApplicationContext context;

    @AfterEach
    void tearDown() {
        if (context != null) {
            context.close();
        }
    }

    @Test
    void contextStarts_withoutCircularReferences_forStatusResolverCluster() {
        context = new AnnotationConfigApplicationContext();
        MockEnvironment env = new MockEnvironment();
        env.setProperty("spring.main.allow-circular-references", "false");
        env.getPropertySources().addFirst(new MapPropertySource("seal", Map.of(
                "app.hackathon.seal.max-tracks", "3",
                "app.hackathon.seal.max-teams-per-track", "8",
                "app.hackathon.seal.finalist-count", "6",
                "app.hackathon.seal.top-per-track", "2",
                "app.hackathon.team.min-track-max-teams", "16",
                "app.hackathon.team.max-track-max-teams", "40",
                "app.hackathon.team.max-skill-roles", "5"
        )));
        context.setEnvironment(env);
        context.register(WiringConfig.class);
        context.refresh();

        assertThat(context.getBean(EventStatusResolver.class)).isNotNull();
        assertThat(context.getBean(EventFinder.class)).isNotNull();
        assertThat(context.getBean(FormatRuleEngine.class)).isNotNull();
        assertThat(context.getBean(EventService.class)).isNotNull();
        assertThat(context.getBean(TeamService.class)).isNotNull();
        assertThat(context.getBean(EventPublicServiceImpl.class)).isNotNull();
        assertThat(context.getBean(EventJudgeService.class)).isNotNull();
    }

    @Configuration
    @Import({
            EventStatusResolver.class,
            EventFinder.class,
            EventOwnershipGuard.class,
            FormatRuleEngine.class,
            EventService.class,
            EventPublicServiceImpl.class,
            TeamService.class,
            EventJudgeService.class
    })
    static class WiringConfig {

        @Bean
        static AutowiredAnnotationBeanPostProcessor autowiredAnnotationBeanPostProcessor() {
            return new AutowiredAnnotationBeanPostProcessor();
        }

        @Bean
        ApplicationEventMulticaster applicationEventMulticaster() {
            return new SimpleApplicationEventMulticaster();
        }

        @Bean HackathonEventRepository hackathonEventRepository() { return mock(HackathonEventRepository.class); }
        @Bean TrackRepository trackRepository() { return mock(TrackRepository.class); }
        @Bean TeamRepository teamRepository() { return mock(TeamRepository.class); }
        @Bean TeamMemberRepository teamMemberRepository() { return mock(TeamMemberRepository.class); }
        @Bean RoundService roundService() { return mock(RoundService.class); }
        @Bean AuditService auditService() { return mock(AuditService.class); }
        @Bean AuthPublicService authPublicService() { return mock(AuthPublicService.class); }
        @Bean EventScheduleService eventScheduleService() { return mock(EventScheduleService.class); }
        @Bean AllowedEmailDomainService allowedEmailDomainService() { return mock(AllowedEmailDomainService.class); }
        @Bean TrackDrawSessionService trackDrawSessionService() { return mock(TrackDrawSessionService.class); }
        @Bean ScoringTemplateRepository scoringTemplateRepository() { return mock(ScoringTemplateRepository.class); }
        @Bean UserPublicService userPublicService() { return mock(UserPublicService.class); }
        @Bean FileStorageService fileStorageService() { return mock(FileStorageService.class); }
        @Bean JudgeAssignmentService judgeAssignmentService() { return mock(JudgeAssignmentService.class); }
        @Bean EventJudgeAssignmentRepository eventJudgeAssignmentRepository() { return mock(EventJudgeAssignmentRepository.class); }
        @Bean RoundRepository roundRepository() { return mock(RoundRepository.class); }
        @Bean CriteriaRepository criteriaRepository() { return mock(CriteriaRepository.class); }
        @Bean JudgeAssignmentRepository judgeAssignmentRepository() { return mock(JudgeAssignmentRepository.class); }
        @Bean MentorAssignmentRepository mentorAssignmentRepository() { return mock(MentorAssignmentRepository.class); }
        @Bean EventEnrollmentService eventEnrollmentService() { return mock(EventEnrollmentService.class); }
        @Bean SystemConfigService systemConfigService() { return mock(SystemConfigService.class); }
        @Bean CompetitionGroupRepository competitionGroupRepository() { return mock(CompetitionGroupRepository.class); }
        @Bean GroupAssignmentService groupAssignmentService() { return mock(GroupAssignmentService.class); }
    }
}
