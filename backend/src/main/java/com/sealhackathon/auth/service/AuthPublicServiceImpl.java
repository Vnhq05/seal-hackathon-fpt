package com.sealhackathon.auth.service;

import com.sealhackathon.auth.security.UserPrincipal;
import com.sealhackathon.common.enums.UserType;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthPublicServiceImpl implements AuthPublicService {

    private final TokenService tokenService;

    @Override
    public UUID getCurrentUserId() {
        return requirePrincipal().userId();
    }

    @Override
    public String getCurrentUserEmail() {
        return requirePrincipal().email();
    }

    @Override
    public UserType getCurrentUserRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .map(UserType::valueOf)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No role found"));
    }

    @Override
    @Transactional
    public void invalidateAllSessions(UUID userId) {
        tokenService.revokeAllUserTokens(userId);
    }

    private UserPrincipal requirePrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            throw new IllegalStateException("Authenticated user not found");
        }
        return principal;
    }
}
