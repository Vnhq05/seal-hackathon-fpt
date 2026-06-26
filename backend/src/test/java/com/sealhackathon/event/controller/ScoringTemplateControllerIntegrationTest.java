package com.sealhackathon.event.controller;

import com.sealhackathon.BaseIntegrationTest;
import com.sealhackathon.event.repository.ScoringTemplateRepository;
import com.sealhackathon.user.domain.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ScoringTemplateControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private ScoringTemplateRepository scoringTemplateRepository;

    @Override
    protected void cleanDatabase() {
        scoringTemplateRepository.deleteAll();
        super.cleanDatabase();
    }

    @Test
    void createAndList_shouldReturnTemplateWithCriteria() throws Exception {
        User admin = createAdmin();

        mockMvc.perform(post("/api/admin/scoring-templates")
                        .header("Authorization", "Bearer " + tokenFor(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Integration Template","description":"Test",
                                 "criteria":[
                                   {"name":"Innovation","weight":40,"sortOrder":0},
                                   {"name":"Technical","weight":35,"sortOrder":1},
                                   {"name":"Presentation","weight":25,"sortOrder":2}
                                 ]}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name", is("Integration Template")))
                .andExpect(jsonPath("$.data.criteria", hasSize(3)))
                .andExpect(jsonPath("$.data.criteria[0].weight", is(40)));

        mockMvc.perform(get("/api/admin/scoring-templates")
                        .header("Authorization", "Bearer " + tokenFor(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].name", is("Integration Template")))
                .andExpect(jsonPath("$.data[0].criteria", hasSize(3)));
    }

    @Test
    void create_shouldReturn400_whenWeightsDoNotSumTo100() throws Exception {
        User admin = createAdmin();

        mockMvc.perform(post("/api/admin/scoring-templates")
                        .header("Authorization", "Bearer " + tokenFor(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Bad Weights",
                                 "criteria":[
                                   {"name":"A","weight":50,"sortOrder":0},
                                   {"name":"B","weight":40,"sortOrder":1}
                                 ]}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("90%")));
    }

    @Test
    void list_shouldReturn403_forNonAdmin() throws Exception {
        User coordinator = createCoordinator();

        mockMvc.perform(get("/api/admin/scoring-templates")
                        .header("Authorization", "Bearer " + tokenFor(coordinator)))
                .andExpect(status().isForbidden());
    }
}
