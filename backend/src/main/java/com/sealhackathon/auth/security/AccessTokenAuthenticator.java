package com.sealhackathon.auth.security;

import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

/**
 * Validates JWT signature then re-checks the live user row so delete / ban / role
 * change / session invalidation take effect without waiting for access-token expiry.
 */
@Component
@RequiredArgsConstructor
public class AccessTokenAuthenticator {

    private final JwtProvider jwtProvider;
    private final UserPublicService userPublicService;

    public Optional<AuthenticatedSession> authenticate(String token) {
        if (token == null || !jwtProvider.validateToken(token)) {
            return Optional.empty();
        }

        UUID userId = jwtProvider.getUserIdFromToken(token);
        Date issuedAt = jwtProvider.getIssuedAtFromToken(token);

        Optional<UserSnapshot> userOpt = userPublicService.findById(userId);
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }

        UserSnapshot user = userOpt.get();
        if (user.getStatus() != AccountStatus.ACTIVE) {
            return Optional.empty();
        }

        if (user.getSessionsInvalidatedAt() != null && issuedAt != null) {
            Instant iat = issuedAt.toInstant();
            Instant invalidatedAt = user.getSessionsInvalidatedAt().toInstant(ZoneOffset.UTC);
            // Reject tokens issued at or before the invalidation watermark.
            if (!iat.isAfter(invalidatedAt)) {
                return Optional.empty();
            }
        }

        return Optional.of(new AuthenticatedSession(
                user.getId(),
                user.getEmail(),
                user.getUserType()
        ));
    }

    public record AuthenticatedSession(UUID userId, String email, UserType role) {}
}
