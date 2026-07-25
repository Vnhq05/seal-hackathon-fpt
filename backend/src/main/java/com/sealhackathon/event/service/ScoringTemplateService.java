package com.sealhackathon.event.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.DuplicateResourceException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.event.domain.ScoringTemplate;
import com.sealhackathon.event.domain.ScoringTemplateCriterion;
import com.sealhackathon.event.dto.request.CreateScoringTemplateRequest;
import com.sealhackathon.event.dto.response.ScoringTemplateResponse;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.ScoringTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class ScoringTemplateService {

    public static final String DEFAULT_TEMPLATE_NAME = "Default";

    private final ScoringTemplateRepository templateRepository;
    private final HackathonEventRepository eventRepository;

    @Transactional
    public ScoringTemplateResponse createTemplate(CreateScoringTemplateRequest request) {
        validateWeightSum(request.getCriteria());

        if (DEFAULT_TEMPLATE_NAME.equalsIgnoreCase(request.getName())) {
            throw new BusinessException(
                    "Name \"" + DEFAULT_TEMPLATE_NAME + "\" is reserved for the system default template",
                    HttpStatus.BAD_REQUEST) {};
        }

        if (templateRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("ScoringTemplate", "name", request.getName());
        }

        ScoringTemplate template = ScoringTemplate.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();

        AtomicInteger order = new AtomicInteger(0);
        request.getCriteria().forEach(c -> {
            ScoringTemplateCriterion criterion = ScoringTemplateCriterion.builder()
                    .scoringTemplate(template)
                    .name(c.getName())
                    .description(c.getDescription())
                    .weight(c.getWeight())
                    .sortOrder(c.getSortOrder() != null ? c.getSortOrder() : order.getAndIncrement())
                    .minScore(resolveMinScore(c))
                    .maxScore(resolveMaxScore(c))
                    .build();
            template.getCriteria().add(criterion);
        });

        return toResponse(templateRepository.save(template));
    }

    @Transactional
    public ScoringTemplateResponse updateTemplate(UUID templateId, CreateScoringTemplateRequest request) {
        ScoringTemplate template = getTemplateEntity(templateId);
        boolean wasDefault = isDefaultTemplate(template);

        validateWeightSum(request.getCriteria());

        String nextName = wasDefault ? DEFAULT_TEMPLATE_NAME : request.getName();
        if (!wasDefault && templateRepository.existsByNameAndIdNot(nextName, templateId)) {
            throw new DuplicateResourceException("ScoringTemplate", "name", nextName);
        }
        if (!wasDefault && DEFAULT_TEMPLATE_NAME.equalsIgnoreCase(nextName)) {
            throw new BusinessException(
                    "Name \"" + DEFAULT_TEMPLATE_NAME + "\" is reserved for the system default template",
                    HttpStatus.BAD_REQUEST) {};
        }

        template.setName(nextName);
        template.setDescription(request.getDescription());

        template.getCriteria().clear();

        AtomicInteger order = new AtomicInteger(0);
        request.getCriteria().forEach(c -> {
            ScoringTemplateCriterion criterion = ScoringTemplateCriterion.builder()
                    .scoringTemplate(template)
                    .name(c.getName())
                    .description(c.getDescription())
                    .weight(c.getWeight())
                    .sortOrder(c.getSortOrder() != null ? c.getSortOrder() : order.getAndIncrement())
                    .minScore(resolveMinScore(c))
                    .maxScore(resolveMaxScore(c))
                    .build();
            template.getCriteria().add(criterion);
        });

        return toResponse(templateRepository.save(template));
    }

    @Transactional(readOnly = true)
    public ScoringTemplateResponse getTemplateById(UUID templateId) {
        return toResponse(getTemplateEntity(templateId));
    }

    @Transactional(readOnly = true)
    public List<ScoringTemplateResponse> listTemplates() {
        return templateRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .sorted((a, b) -> {
                    if (a.isDefault() == b.isDefault()) {
                        return 0;
                    }
                    return a.isDefault() ? -1 : 1;
                })
                .toList();
    }

    @Transactional
    public void deleteTemplate(UUID templateId) {
        ScoringTemplate template = getTemplateEntity(templateId);

        if (isDefaultTemplate(template)) {
            throw new BusinessException(
                    "Cannot delete the system Default scoring template",
                    HttpStatus.BAD_REQUEST) {};
        }

        if (eventRepository.existsByScoringTemplateId(templateId)) {
            throw new BusinessException(
                    "Cannot delete template that is in use by an event",
                    HttpStatus.CONFLICT) {};
        }

        templateRepository.delete(template);
    }

    @Transactional
    public ScoringTemplateResponse deleteCriterion(UUID templateId, UUID criterionId) {
        ScoringTemplate template = getTemplateEntity(templateId);

        ScoringTemplateCriterion criterion = template.getCriteria().stream()
                .filter(c -> c.getId().equals(criterionId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("ScoringTemplateCriterion", "id", criterionId));

        if (template.getCriteria().size() <= 1) {
            throw new BusinessException(
                    "Cannot delete the last criterion. A template must have at least one criterion.",
                    HttpStatus.BAD_REQUEST) {};
        }

        int remainingSum = template.getCriteria().stream()
                .filter(c -> !c.getId().equals(criterionId))
                .mapToInt(ScoringTemplateCriterion::getWeight)
                .sum();

        if (remainingSum != 100) {
            throw new BusinessException(
                    "Cannot delete criterion: remaining criteria would total " + remainingSum
                            + "%. Weights must sum to 100%. Adjust weights before deleting.",
                    HttpStatus.BAD_REQUEST) {};
        }

        template.getCriteria().remove(criterion);
        return toResponse(templateRepository.save(template));
    }

    private void validateWeightSum(List<CreateScoringTemplateRequest.CriterionRequest> criteria) {
        for (CreateScoringTemplateRequest.CriterionRequest criterion : criteria) {
            if (criterion.getWeight() == null || criterion.getWeight() <= 0) {
                throw new BusinessException(
                        "Weight must be a positive integer greater than 0",
                        HttpStatus.BAD_REQUEST) {};
            }
            int minScore = resolveMinScore(criterion);
            int maxScore = resolveMaxScore(criterion);
            if (minScore >= maxScore) {
                throw new BusinessException(
                        "minScore must be less than maxScore for criterion: " + criterion.getName(),
                        HttpStatus.BAD_REQUEST) {};
            }
        }

        int sum = criteria.stream()
                .mapToInt(CreateScoringTemplateRequest.CriterionRequest::getWeight)
                .sum();
        if (sum != 100) {
            throw new BusinessException(
                    "Total weight of all criteria must equal 100%. Current total: " + sum + "%",
                    HttpStatus.BAD_REQUEST) {};
        }
    }

    private ScoringTemplate getTemplateEntity(UUID templateId) {
        return templateRepository.findWithCriteriaById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("ScoringTemplate", "id", templateId));
    }

    private boolean isDefaultTemplate(ScoringTemplate template) {
        return DEFAULT_TEMPLATE_NAME.equalsIgnoreCase(template.getName());
    }

    private int resolveMinScore(CreateScoringTemplateRequest.CriterionRequest c) {
        return c.getMinScore() != null ? c.getMinScore() : 1;
    }

    private int resolveMaxScore(CreateScoringTemplateRequest.CriterionRequest c) {
        return c.getMaxScore() != null ? c.getMaxScore() : 100;
    }

    private ScoringTemplateResponse toResponse(ScoringTemplate template) {
        List<ScoringTemplateResponse.CriterionResponse> criteriaResponses = template.getCriteria().stream()
                .map(c -> ScoringTemplateResponse.CriterionResponse.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .description(c.getDescription())
                        .weight(c.getWeight())
                        .sortOrder(c.getSortOrder())
                        .minScore(c.getMinScore())
                        .maxScore(c.getMaxScore())
                        .build())
                .toList();

        return ScoringTemplateResponse.builder()
                .id(template.getId())
                .name(template.getName())
                .description(template.getDescription())
                .isDefault(isDefaultTemplate(template))
                .criteria(criteriaResponses)
                .createdAt(template.getCreatedAt())
                .build();
    }
}
