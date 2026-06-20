package com.sealhackathon.event.controller;

import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.event.domain.enums.EventStatus;
import com.sealhackathon.event.dto.response.PlatformStatsResponse;
import com.sealhackathon.event.repository.HackathonEventRepository;
import com.sealhackathon.user.service.UserPublicService;
import com.sealhackathon.team.service.TeamPublicService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/stats")
@RequiredArgsConstructor
@Tag(name = "Public", description = "Public endpoints — no authentication required")
public class PublicStatsController {

    private final HackathonEventRepository eventRepository;
    private final UserPublicService userPublicService;
    private final TeamPublicService teamPublicService;

    @GetMapping
    @Operation(summary = "Get platform statistics (public)")
    public ResponseEntity<ApiResponse<PlatformStatsResponse>> getStats() {
        long activeEvents = eventRepository.findByStatus(
                EventStatus.ACTIVE, org.springframework.data.domain.Pageable.ofSize(1)).getTotalElements();
        long users = userPublicService.countActiveUsers();
        long teams = teamPublicService.countTeams();

        PlatformStatsResponse stats = PlatformStatsResponse.builder()
                .activeEventCount(activeEvents)
                .registeredUserCount(users)
                .teamCount(teams)
                .build();

        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
