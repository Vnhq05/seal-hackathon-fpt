package com.sealhackathon.event.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.event.domain.ScoringTemplate;
import com.sealhackathon.event.domain.ScoringTemplateCriterion;
import com.sealhackathon.event.dto.request.CreateScoringTemplateRequest;
import com.sealhackathon.event.dto.response.ScoringTemplateResponse;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.event.repository.ScoringTemplateRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ScoringTemplateServiceTest {

    @Mock private ScoringTemplateRepository templateRepository;
    @Mock private HackathonEventRepository eventRepository;

    @InjectMocks private ScoringTemplateService scoringTemplateService;

    @Test
    void createTemplate_shouldReturnTemplateWithCriteria() {
        CreateScoringTemplateRequest request = CreateScoringTemplateRequest.builder()
                .name("Demo Template")
                .description("For testing")
                .criteria(List.of(
                        criterionRequest("Innovation", 60, 0),
                        criterionRequest("Presentation", 40, 1)))
                .build();

        when(templateRepository.existsByName("Demo Template")).thenReturn(false);
        when(templateRepository.save(any(ScoringTemplate.class))).thenAnswer(invocation -> {
            ScoringTemplate template = invocation.getArgument(0);
            template.setId(UUID.randomUUID());
            template.setCreatedAt(LocalDateTime.now());
            template.getCriteria().forEach(c -> c.setId(UUID.randomUUID()));
            return template;
        });

        ScoringTemplateResponse response = scoringTemplateService.createTemplate(request);

        assertThat(response.getName()).isEqualTo("Demo Template");
        assertThat(response.getCriteria()).hasSize(2);
        assertThat(response.getCriteria())
                .extracting(ScoringTemplateResponse.CriterionResponse::getWeight)
                .containsExactly(60, 40);
        verify(templateRepository).save(any(ScoringTemplate.class));
    }

    @Test
    void createTemplate_shouldThrow_whenWeightsDoNotSumTo100() {
        CreateScoringTemplateRequest request = CreateScoringTemplateRequest.builder()
                .name("Invalid Weights")
                .criteria(List.of(
                        criterionRequest("A", 50, 0),
                        criterionRequest("B", 40, 1)))
                .build();

        assertThatThrownBy(() -> scoringTemplateService.createTemplate(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("90%");
    }

    @Test
    void listTemplates_shouldReturnTemplatesWithCriteria() {
        UUID templateId = UUID.randomUUID();
        ScoringTemplate template = ScoringTemplate.builder()
                .name("Listed Template")
                .description("desc")
                .build();
        template.setId(templateId);
        template.setCreatedAt(LocalDateTime.now());
        template.getCriteria().add(ScoringTemplateCriterion.builder()
                .scoringTemplate(template)
                .name("Technical")
                .weight(100)
                .sortOrder(0)
                .build());
        template.getCriteria().forEach(c -> c.setId(UUID.randomUUID()));

        when(templateRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(template));

        List<ScoringTemplateResponse> responses = scoringTemplateService.listTemplates();

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getId()).isEqualTo(templateId);
        assertThat(responses.get(0).getCriteria()).hasSize(1);
        assertThat(responses.get(0).getCriteria().get(0).getWeight()).isEqualTo(100);
    }

    private CreateScoringTemplateRequest.CriterionRequest criterionRequest(
            String name, int weight, int sortOrder) {
        return CreateScoringTemplateRequest.CriterionRequest.builder()
                .name(name)
                .weight(weight)
                .sortOrder(sortOrder)
                .build();
    }
}
