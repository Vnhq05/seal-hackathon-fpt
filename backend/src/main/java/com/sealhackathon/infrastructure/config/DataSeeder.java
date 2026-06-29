package com.sealhackathon.infrastructure.config;

import com.sealhackathon.common.domain.SystemConfig;
import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.StudentStanding;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.common.repository.SystemConfigRepository;
import com.sealhackathon.event.domain.ScoringTemplate;
import com.sealhackathon.event.domain.ScoringTemplateCriterion;
import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.ScoringTemplateRepository;
import com.sealhackathon.user.domain.User;
import com.sealhackathon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final String DEV_COORDINATOR_EMAIL = EventDemoSeeder.DEV_COORDINATOR_EMAIL;
    private static final String DEV_ADMIN_EMAIL = "admin@seal.com";
    private static final Set<String> DEV_OWNERSHIP_REALIGN_FROM = Set.of("system", DEV_ADMIN_EMAIL);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ScoringTemplateRepository scoringTemplateRepository;
    private final SystemConfigRepository systemConfigRepository;
    private final EventDemoSeeder eventDemoSeeder;
    private final JudgingDemoSeeder judgingDemoSeeder;
    private final HackathonEventRepository eventRepository;
    private final TransactionTemplate transactionTemplate;

    @Value("${app.seeder.resync-dev-accounts:true}")
    private boolean resyncDevAccounts;

    private static final String DEFAULT_SEED_PASSWORD = "12345678";

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
        judgingDemoSeeder.seedIfMissing();
        if (resyncDevAccounts) {
            alignDevEventOwnership();
        }
    }

    /**
     * Dev-only: coordinators list/manage events by {@code createdBy}. Admin- or system-owned
     * seeded events are reassigned to the default coordinator account on startup.
     */
    void alignDevEventOwnership() {
        transactionTemplate.executeWithoutResult(status -> {
            List<UUID> eventIds = eventRepository.findAll().stream()
                    .filter(this::shouldRealignDevOwnership)
                    .map(HackathonEvent::getId)
                    .toList();
            if (eventIds.isEmpty()) {
                return;
            }
            int updated = eventRepository.reassignOwnership(eventIds, DEV_COORDINATOR_EMAIL);
            log.info("Aligned {} dev event(s) to coordinator owner {}", updated, DEV_COORDINATOR_EMAIL);
        });
    }

    private boolean shouldRealignDevOwnership(HackathonEvent event) {
        String owner = event.getCreatedBy();
        if (owner == null || owner.isBlank()) {
            return true;
        }
        return DEV_OWNERSHIP_REALIGN_FROM.contains(owner.trim().toLowerCase());
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
        standard.getCriteria().add(criterion(standard, "Innovation", "Novelty and creativity of the solution", 25, 0, 0, 10));
        standard.getCriteria().add(criterion(standard, "Technical", "Code quality and architecture", 30, 1, 0, 10));
        standard.getCriteria().add(criterion(standard, "Business Value", "Market potential and impact", 25, 2, 0, 10));
        standard.getCriteria().add(criterion(standard, "Presentation", "Demo and pitch quality", 20, 3, 0, 10));
        scoringTemplateRepository.save(standard);

        ScoringTemplate research = ScoringTemplate.builder()
                .name("Research Track")
                .description("Criteria focused on research-oriented submissions")
                .build();
        research.getCriteria().add(criterion(research, "Methodology", "Research approach and rigor", 35, 0, 0, 10));
        research.getCriteria().add(criterion(research, "Results", "Findings and evidence", 35, 1, 0, 10));
        research.getCriteria().add(criterion(research, "Impact", "Practical or academic impact", 30, 2, 0, 10));
        scoringTemplateRepository.save(research);

        ScoringTemplate sealPreliminary = ScoringTemplate.builder()
                .name("SEAL Spring 2026 — Vòng bảng")
                .description("Preliminary round rubric — scale 1–5")
                .build();
        sealPreliminary.getCriteria().add(criterion(sealPreliminary,
                "Tính chính xác và phù hợp với Domain", "Accuracy and Domain Relevance", 30, 0, 1, 5));
        sealPreliminary.getCriteria().add(criterion(sealPreliminary,
                "Kiến trúc Agentic RAG & Giải thuật", "Agentic RAG Architecture & Algorithm", 30, 1, 1, 5));
        sealPreliminary.getCriteria().add(criterion(sealPreliminary,
                "Ý tưởng & Thuyết trình", "Ideas & Presentation", 15, 2, 1, 5));
        sealPreliminary.getCriteria().add(criterion(sealPreliminary,
                "Khả năng thực thi & tính sáng tạo", "Feasibility & Creativity", 15, 3, 1, 5));
        sealPreliminary.getCriteria().add(criterion(sealPreliminary,
                "Trải nghiệm người dùng & giao diện tương tác", "User Experience & Interactive Interface", 10, 4, 1, 5));
        scoringTemplateRepository.save(sealPreliminary);

        ScoringTemplate sealFinal = ScoringTemplate.builder()
                .name("SEAL Spring 2026 — Chung kết")
                .description("Final round rubric — scale 1–5")
                .build();
        sealFinal.getCriteria().add(criterion(sealFinal,
                "Chất lượng xử lý & truy xuất dữ liệu", "Data Processing & Retrieval Quality", 30, 0, 1, 5));
        sealFinal.getCriteria().add(criterion(sealFinal,
                "Độ tin cậy & chống ảo giác", "Reliability & Hallucination Resistance", 20, 1, 1, 5));
        sealFinal.getCriteria().add(criterion(sealFinal,
                "Tư duy Agent & xử lý đa tầng", "Agent Reasoning & Multi-hop Processing", 20, 2, 1, 5));
        sealFinal.getCriteria().add(criterion(sealFinal,
                "Tính thực tế & tối ưu vận hành", "Practicality & Operational Optimization", 20, 3, 1, 5));
        sealFinal.getCriteria().add(criterion(sealFinal,
                "Khả năng mở rộng & sáng tạo", "Scalability & Innovation", 10, 4, 1, 5));
        scoringTemplateRepository.save(sealFinal);

        log.info("Seeded {} scoring templates", scoringTemplateRepository.count());
    }

    private ScoringTemplateCriterion criterion(
            ScoringTemplate template, String name, String description,
            int weight, int sortOrder, int minScore, int maxScore) {
        return ScoringTemplateCriterion.builder()
                .scoringTemplate(template)
                .name(name)
                .description(description)
                .weight(weight)
                .sortOrder(sortOrder)
                .minScore(minScore)
                .maxScore(maxScore)
                .build();
    }

    private void seedUser(String email, String fullName, UserType userType, Integer semester) {
        User existing = userRepository.findByEmail(email).orElse(null);
        if (existing != null) {
            if (resyncDevAccounts) {
                resyncDevAccount(existing);
            }
            return;
        }

        User.UserBuilder builder = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(DEFAULT_SEED_PASSWORD))
                .fullName(fullName)
                .userType(userType)
                .status(AccountStatus.ACTIVE)
                .studentStanding(StudentStanding.ENROLLED);

        if (userType == UserType.FPT_STUDENT) {
            String idNum = email.replaceAll("[^0-9]", "");
            builder.studentId("SE19100" + idNum);
            builder.semester(semester);
        }

        userRepository.save(builder.build());
        log.info("Seeded account: {} / {} [{}]", email, DEFAULT_SEED_PASSWORD, userType);
    }

    private void resyncDevAccount(User user) {
        user.setPasswordHash(passwordEncoder.encode(DEFAULT_SEED_PASSWORD));
        user.setStatus(AccountStatus.ACTIVE);
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        user.setStudentStanding(StudentStanding.ENROLLED);
        userRepository.save(user);
        log.info("Re-synced dev account: {} / {} [{}]", user.getEmail(), DEFAULT_SEED_PASSWORD, user.getUserType());
    }
}
