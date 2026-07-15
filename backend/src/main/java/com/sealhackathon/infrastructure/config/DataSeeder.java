package com.sealhackathon.infrastructure.config;

import com.sealhackathon.common.domain.SystemConfig;
import com.sealhackathon.common.repository.SystemConfigRepository;
import com.sealhackathon.event.domain.ScoringTemplate;
import com.sealhackathon.event.domain.ScoringTemplateCriterion;
import com.sealhackathon.event.repository.ScoringTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Seeds reference data only: default rules and scoring templates. Accounts and event data are
 * created through the app or the SQL scripts under {@code src/main/resources/db}.
 */
@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ScoringTemplateRepository scoringTemplateRepository;
    private final SystemConfigRepository systemConfigRepository;

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
                .name("SEAL Spring 2026 — Preliminary Round")
                .description("Preliminary round rubric — scale 1–5")
                .build();
        sealPreliminary.getCriteria().add(criterion(sealPreliminary,
                "Accuracy and Domain Relevance", "Accuracy and Domain Relevance", 30, 0, 1, 5));
        sealPreliminary.getCriteria().add(criterion(sealPreliminary,
                "Agentic RAG Architecture & Algorithm", "Agentic RAG Architecture & Algorithm", 30, 1, 1, 5));
        sealPreliminary.getCriteria().add(criterion(sealPreliminary,
                "Ideas & Presentation", "Ideas & Presentation", 15, 2, 1, 5));
        sealPreliminary.getCriteria().add(criterion(sealPreliminary,
                "Feasibility & Creativity", "Feasibility & Creativity", 15, 3, 1, 5));
        sealPreliminary.getCriteria().add(criterion(sealPreliminary,
                "User Experience & Interactive Interface", "User Experience & Interactive Interface", 10, 4, 1, 5));
        scoringTemplateRepository.save(sealPreliminary);

        ScoringTemplate sealFinal = ScoringTemplate.builder()
                .name("SEAL Spring 2026 — Finals")
                .description("Final round rubric — scale 1–5")
                .build();
        sealFinal.getCriteria().add(criterion(sealFinal,
                "Data Processing & Retrieval Quality", "Data Processing & Retrieval Quality", 30, 0, 1, 5));
        sealFinal.getCriteria().add(criterion(sealFinal,
                "Reliability & Hallucination Resistance", "Reliability & Hallucination Resistance", 20, 1, 1, 5));
        sealFinal.getCriteria().add(criterion(sealFinal,
                "Agent Reasoning & Multi-hop Processing", "Agent Reasoning & Multi-hop Processing", 20, 2, 1, 5));
        sealFinal.getCriteria().add(criterion(sealFinal,
                "Practicality & Operational Optimization", "Practicality & Operational Optimization", 20, 3, 1, 5));
        sealFinal.getCriteria().add(criterion(sealFinal,
                "Scalability & Innovation", "Scalability & Innovation", 10, 4, 1, 5));
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
}
