package com.sealhackathon.infrastructure.config;

import com.sealhackathon.event.domain.ScoringTemplate;
import com.sealhackathon.event.domain.ScoringTemplateCriterion;
import com.sealhackathon.event.repository.ScoringTemplateRepository;
import com.sealhackathon.event.service.ScoringTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Ensures the system {@code Default} scoring template exists in every environment
 * (BR-44: Technical 40%, Innovation 30%, Presentation Quality 20%, Feasibility 10%).
 */
@Slf4j
@Component
@Order(20)
@RequiredArgsConstructor
public class DefaultScoringTemplateInitializer implements ApplicationRunner {

    private final ScoringTemplateRepository scoringTemplateRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (scoringTemplateRepository.existsByName(ScoringTemplateService.DEFAULT_TEMPLATE_NAME)) {
            return;
        }

        ScoringTemplate template = ScoringTemplate.builder()
                .name(ScoringTemplateService.DEFAULT_TEMPLATE_NAME)
                .description("Default rubric applied when creating rounds — editable after selection")
                .build();

        template.getCriteria().add(criterion(template, "Technical", "Technical quality and implementation", 40, 0));
        template.getCriteria().add(criterion(template, "Innovation", "Novelty and creative approach", 30, 1));
        template.getCriteria().add(criterion(template, "Presentation Quality", "Clarity and communication", 20, 2));
        template.getCriteria().add(criterion(template, "Feasibility", "Practicality and delivery readiness", 10, 3));

        scoringTemplateRepository.save(template);
        log.info("Seeded system scoring template: {}", ScoringTemplateService.DEFAULT_TEMPLATE_NAME);
    }

    private static ScoringTemplateCriterion criterion(
            ScoringTemplate template, String name, String description, int weight, int sortOrder) {
        return ScoringTemplateCriterion.builder()
                .scoringTemplate(template)
                .name(name)
                .description(description)
                .weight(weight)
                .sortOrder(sortOrder)
                .minScore(1)
                .maxScore(100)
                .build();
    }
}
