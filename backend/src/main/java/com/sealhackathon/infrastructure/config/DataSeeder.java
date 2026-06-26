package com.sealhackathon.infrastructure.config;

import com.sealhackathon.common.domain.SystemConfig;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.repository.SystemConfigRepository;
import com.sealhackathon.event.domain.ScoringTemplate;
import com.sealhackathon.event.domain.ScoringTemplateCriterion;
import com.sealhackathon.event.repository.ScoringTemplateRepository;
import com.sealhackathon.user.domain.User;
import com.sealhackathon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ScoringTemplateRepository scoringTemplateRepository;
    private final SystemConfigRepository systemConfigRepository;
    private final EventDemoSeeder eventDemoSeeder;

    private static final String DEFAULT_RULES = """
            1. Teams must comply with the configured minimum and maximum member limits.
            2. All submissions must be original work created during the hackathon period.
            3. Plagiarism, cheating, or misrepresentation will result in disqualification.
            4. Teams must follow the event schedule and submission deadlines for each round.
            5. Judges' decisions are final. Tiebreaker criteria apply when scores are equal.
            6. Participants must behave professionally and respect mentors, judges, and other teams.
            """.trim();

    @Override
    public void run(String... args) {
        seedDefaultRules();
        seedScoringTemplates();
        seedUser("admin@seal.com", "System Admin", UserType.SYSTEM_ADMIN, null);
        seedUser("coordinator@seal.com", "Event Coordinator", UserType.EVENT_COORDINATOR, null);

        seedUser("lecturer1@fpt.edu.vn", "Nguyen Van A", UserType.LECTURER, null);
        seedUser("lecturer2@fpt.edu.vn", "Tran Thi B", UserType.LECTURER, null);
        seedUser("lecturer3@fpt.edu.vn", "Le Van C", UserType.LECTURER, null);
        seedUser("lecturer4@fpt.edu.vn", "Pham Thi D", UserType.LECTURER, null);
        seedUser("lecturer5@fpt.edu.vn", "Hoang Van E", UserType.LECTURER, null);

        seedUser("student1@fpt.edu.vn", "Sinh Vien 1", UserType.FPT_STUDENT, 5);
        seedUser("student2@fpt.edu.vn", "Sinh Vien 2", UserType.FPT_STUDENT, 6);
        seedUser("student3@fpt.edu.vn", "Sinh Vien 3", UserType.FPT_STUDENT, 5);
        seedUser("student4@fpt.edu.vn", "Sinh Vien 4", UserType.FPT_STUDENT, 6);
        seedUser("student5@fpt.edu.vn", "Sinh Vien 5", UserType.FPT_STUDENT, 5);
        seedUser("student6@fpt.edu.vn", "Sinh Vien 6", UserType.FPT_STUDENT, 7);

        eventDemoSeeder.seed();
    }

    private void seedDefaultRules() {
        SystemConfig config = systemConfigRepository.findFirstBy().orElse(null);
        if (config == null) {
            systemConfigRepository.save(SystemConfig.builder()
                    .defaultRules(DEFAULT_RULES)
                    .build());
            log.info("Seeded system config with default rules");
            return;
        }
        if (config.getDefaultRules() == null || config.getDefaultRules().isBlank()) {
            config.setDefaultRules(DEFAULT_RULES);
            systemConfigRepository.save(config);
            log.info("Restored default rules on existing system config");
        }
    }

    private void seedScoringTemplates() {
        if (scoringTemplateRepository.count() > 0) {
            return;
        }

        ScoringTemplate standard = ScoringTemplate.builder()
                .name("Standard Hackathon")
                .description("Default scoring criteria for hackathon projects")
                .build();
        standard.getCriteria().add(criterion(standard, "Innovation", "Novelty and creativity of the solution", 25, 0));
        standard.getCriteria().add(criterion(standard, "Technical", "Code quality and architecture", 30, 1));
        standard.getCriteria().add(criterion(standard, "Business Value", "Market potential and impact", 25, 2));
        standard.getCriteria().add(criterion(standard, "Presentation", "Demo and pitch quality", 20, 3));
        scoringTemplateRepository.save(standard);

        ScoringTemplate research = ScoringTemplate.builder()
                .name("Research Track")
                .description("Criteria focused on research-oriented submissions")
                .build();
        research.getCriteria().add(criterion(research, "Methodology", "Research approach and rigor", 35, 0));
        research.getCriteria().add(criterion(research, "Results", "Findings and evidence", 35, 1));
        research.getCriteria().add(criterion(research, "Impact", "Practical or academic impact", 30, 2));
        scoringTemplateRepository.save(research);

        log.info("Seeded {} scoring templates", scoringTemplateRepository.count());
    }

    private ScoringTemplateCriterion criterion(
            ScoringTemplate template, String name, String description, int weight, int sortOrder) {
        return ScoringTemplateCriterion.builder()
                .scoringTemplate(template)
                .name(name)
                .description(description)
                .weight(weight)
                .sortOrder(sortOrder)
                .build();
    }

    private void seedUser(String email, String fullName, UserType userType, Integer semester) {
        if (userRepository.existsByEmail(email)) return;

        User.UserBuilder builder = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode("123456"))
                .fullName(fullName)
                .userType(userType)
                .status(AccountStatus.ACTIVE);

        if (userType == UserType.FPT_STUDENT) {
            String idNum = email.replaceAll("[^0-9]", "");
            builder.studentId("SE19100" + idNum);
            builder.semester(semester);
        }

        userRepository.save(builder.build());
        log.info("Seeded account: {} / 123456 [{}]", email, userType);
    }
}
