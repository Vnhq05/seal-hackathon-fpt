package com.sealhackathon.auth.security;

import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Base64;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtProviderTest {

    private JwtProvider jwtProvider;
    private static final String SECRET = Base64.getEncoder()
            .encodeToString("this-is-a-test-secret-key-for-jwt-provider-unit-tests-2026".getBytes());
    private static final long EXPIRATION_MS = 900_000;

    @BeforeEach
    void setUp() {
        jwtProvider = new JwtProvider(SECRET, EXPIRATION_MS);
    }

    @Test
    void generateAccessToken_shouldContainCorrectClaims() {
        UUID userId = UUID.randomUUID();
        String email = "test@example.com";
        String role = "FPT_STUDENT";

        String token = jwtProvider.generateAccessToken(userId, email, role);

        assertThat(token).isNotBlank();
        assertThat(jwtProvider.getUserIdFromToken(token)).isEqualTo(userId);
        assertThat(jwtProvider.getEmailFromToken(token)).isEqualTo(email);
        assertThat(jwtProvider.getRoleFromToken(token)).isEqualTo(role);
    }

    @Test
    void validateToken_shouldReturnTrueForValidToken() {
        String token = jwtProvider.generateAccessToken(UUID.randomUUID(), "a@b.com", "JUDGE");
        assertThat(jwtProvider.validateToken(token)).isTrue();
    }

    @Test
    void validateToken_shouldReturnFalseForInvalidToken() {
        assertThat(jwtProvider.validateToken("invalid.token.here")).isFalse();
    }

    @Test
    void validateToken_shouldReturnFalseForNullToken() {
        assertThat(jwtProvider.validateToken(null)).isFalse();
    }

    @Test
    void getAccessTokenExpirationMs_shouldReturn900000() {
        assertThat(jwtProvider.getAccessTokenExpirationMs()).isEqualTo(EXPIRATION_MS);
    }
}
