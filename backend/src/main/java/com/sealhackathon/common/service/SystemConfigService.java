package com.sealhackathon.common.service;

import com.sealhackathon.common.domain.SystemConfig;
import com.sealhackathon.common.dto.SystemConfigRequest;
import com.sealhackathon.common.dto.SystemConfigResponse;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SystemConfigService {

    private final SystemConfigRepository configRepository;

    @Transactional(readOnly = true)
    public int getMinTeamMembers() {
        return getConfig().getMinTeamMembers();
    }

    @Transactional(readOnly = true)
    public int getMaxTeamMembers() {
        return getConfig().getMaxTeamMembers();
    }

    @Transactional(readOnly = true)
    public SystemConfigResponse getConfig() {
        SystemConfig config = configRepository.findFirstBy()
                .orElseGet(this::createDefaultConfig);
        return toResponse(config);
    }

    @Transactional
    public SystemConfigResponse updateConfig(SystemConfigRequest request) {
        if (request.getMinTeamMembers() > request.getMaxTeamMembers()) {
            throw new BusinessException(
                    "Minimum team members cannot exceed maximum team members",
                    HttpStatus.BAD_REQUEST) {};
        }
        if (request.getMinTeams() != null && request.getMaxTeams() != null
                && request.getMinTeams() > request.getMaxTeams()) {
            throw new BusinessException(
                    "Minimum teams cannot exceed maximum teams",
                    HttpStatus.BAD_REQUEST) {};
        }

        SystemConfig config = configRepository.findFirstBy()
                .orElseGet(this::createDefaultConfig);

        config.setMinTeamMembers(request.getMinTeamMembers());
        config.setMaxTeamMembers(request.getMaxTeamMembers());
        config.setMinTeams(request.getMinTeams());
        config.setMaxTeams(request.getMaxTeams());
        if (request.getDefaultRules() != null) {
            config.setDefaultRules(request.getDefaultRules().isBlank() ? null : request.getDefaultRules());
        }

        return toResponse(configRepository.save(config));
    }

    private SystemConfig createDefaultConfig() {
        return configRepository.save(SystemConfig.builder().build());
    }

    private SystemConfigResponse toResponse(SystemConfig config) {
        return SystemConfigResponse.builder()
                .id(config.getId())
                .minTeamMembers(config.getMinTeamMembers())
                .maxTeamMembers(config.getMaxTeamMembers())
                .defaultRules(config.getDefaultRules())
                .minTeams(config.getMinTeams())
                .maxTeams(config.getMaxTeams())
                .build();
    }
}
