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

import java.util.List;

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
        ensureTemplate(
                "Standard Hackathon",
                "Default scoring criteria for hackathon projects",
                List.of(
                        new CriterionDef("Innovation", "Novelty and creativity of the solution", 25, 0, 0, 10),
                        new CriterionDef("Technical", "Code quality and architecture", 30, 1, 0, 10),
                        new CriterionDef("Business Value", "Market potential and impact", 25, 2, 0, 10),
                        new CriterionDef("Presentation", "Demo and pitch quality", 20, 3, 0, 10)
                ));

        ensureTemplate(
                "Research Track",
                "Criteria focused on research-oriented submissions",
                List.of(
                        new CriterionDef("Methodology", "Research approach and rigor", 35, 0, 0, 10),
                        new CriterionDef("Results", "Findings and evidence", 35, 1, 0, 10),
                        new CriterionDef("Impact", "Practical or academic impact", 30, 2, 0, 10)
                ));

        // Rubric used by all current SEAL_RAG_2026 competitions (Build Day, Fall Preview, Final Pitch, …).
        ensureTemplate(
                "SEAL Agentic RAG - Preliminary Round",
                "Preliminary round rubric for SEAL Hackathon Agentic RAG events - scale 1-5",
                List.of(
                        new CriterionDef("Accuracy and Domain Relevance", "Accuracy and Domain Relevance", 30, 0, 1, 5),
                        new CriterionDef("Agentic RAG Architecture & Algorithm", "Agentic RAG Architecture & Algorithm", 30, 1, 1, 5),
                        new CriterionDef("Ideas & Presentation", "Ideas & Presentation", 15, 2, 1, 5),
                        new CriterionDef("Feasibility & Creativity", "Feasibility & Creativity", 15, 3, 1, 5),
                        new CriterionDef("User Experience & Interactive Interface", "User Experience & Interactive Interface", 10, 4, 1, 5)
                ));

        ensureTemplate(
                "SEAL Agentic RAG - Finals",
                "Final round rubric for SEAL Hackathon Agentic RAG events - scale 1-5",
                List.of(
                        new CriterionDef("Data Processing & Retrieval Quality", "Data Processing & Retrieval Quality", 30, 0, 1, 5),
                        new CriterionDef("Reliability & Hallucination Resistance", "Reliability & Hallucination Resistance", 20, 1, 1, 5),
                        new CriterionDef("Agent Reasoning & Multi-hop Processing", "Agent Reasoning & Multi-hop Processing", 20, 2, 1, 5),
                        new CriterionDef("Practicality & Operational Optimization", "Practicality & Operational Optimization", 20, 3, 1, 5),
                        new CriterionDef("Scalability & Innovation", "Scalability & Innovation", 10, 4, 1, 5)
                ));

        log.info("Scoring templates ready: {} total", scoringTemplateRepository.count());
    }

    private void ensureTemplate(String name, String description, List<CriterionDef> criteria) {
        if (scoringTemplateRepository.existsByName(name)) {
            return;
        }
        ScoringTemplate template = ScoringTemplate.builder()
                .name(name)
                .description(description)
                .build();
        for (CriterionDef def : criteria) {
            template.getCriteria().add(criterion(
                    template, def.name(), def.description(), def.weight(), def.sortOrder(), def.minScore(), def.maxScore()));
        }
        scoringTemplateRepository.save(template);
        log.info("Seeded scoring template: {}", name);
    }

    private record CriterionDef(
            String name, String description, int weight, int sortOrder, int minScore, int maxScore) {}

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
