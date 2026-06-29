package com.sealhackathon.auth.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.event.dto.response.AllowedEmailDomainResponse;
import com.sealhackathon.event.service.AllowedEmailDomainService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/registration")
@RequiredArgsConstructor
@Tag(name = "Public Registration", description = "Public helpers for participant self-registration")
public class PublicRegistrationController {

    private final AllowedEmailDomainService allowedEmailDomainService;

    @GetMapping("/allowed-email-domains")
    @Operation(summary = "List default allowed email domains for external student registration")
    public ResponseEntity<ApiResponse<List<AllowedEmailDomainResponse>>> listAllowedEmailDomains() {
        return ResponseEntity.ok(ApiResponse.success(allowedEmailDomainService.listDefaultRegistrationDomains()));
    }
}
