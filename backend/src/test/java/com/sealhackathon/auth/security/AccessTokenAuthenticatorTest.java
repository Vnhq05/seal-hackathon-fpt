package com.sealhackathon.auth.security;

import com.sealhackathon.common.enums.AccountStatus;
import com.sealhackathon.common.enums.UserType;
import com.sealhackathon.user.dto.snapshot.UserSnapshot;
import com.sealhackathon.user.service.UserPublicService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccessTokenAuthenticatorTest {

    @Mock private JwtProvider jwtProvider;
    @Mock private UserPublicService userPublicService;

    private AccessTokenAuthenticator authenticator;

    private final UUID userId = UUID.randomUUID();
    private final String token = "valid.jwt.token";
    private final Date issuedAt = Date.from(LocalDateTime.of(2026, 7, 1, 10, 0)
            .toInstant(ZoneOffset.UTC));

    @BeforeEach
    void setUp() {
        authenticator = new AccessTokenAuthenticator(jwtProvider, userPublicService);
    }

    @Test
    void authenticate_returnsSessionWithDbRole_whenActive() {
        stubValidToken();
        when(userPublicService.findById(userId)).thenReturn(Optional.of(activeUser(UserType.FPT_STUDENT)));

        Optional<AccessTokenAuthenticator.AuthenticatedSession> result = authenticator.authenticate(token);

        assertThat(result).isPresent();
        assertThat(result.get().userId()).isEqualTo(userId);
        assertThat(result.get().email()).isEqualTo("student@fpt.edu.vn");
        assertThat(result.get().role()).isEqualTo(UserType.FPT_STUDENT);
    }

    @Test
    void authenticate_usesRoleFromDbNotTokenClaim_whenDemoted() {
        stubValidToken();
        // Token may still claim SYSTEM_ADMIN; DB says FPT_STUDENT.
        when(userPublicService.findById(userId)).thenReturn(Optional.of(activeUser(UserType.FPT_STUDENT)));

        Optional<AccessTokenAuthenticator.AuthenticatedSession> result = authenticator.authenticate(token);

        assertThat(result).isPresent();
        assertThat(result.get().role()).isEqualTo(UserType.FPT_STUDENT);
    }

    @Test
    void authenticate_rejects_whenUserMissing() {
        stubValidToken();
        when(userPublicService.findById(userId)).thenReturn(Optional.empty());

        assertThat(authenticator.authenticate(token)).isEmpty();
    }

    @Test
    void authenticate_rejects_whenStatusNotActive() {
        stubValidToken();
        when(userPublicService.findById(userId)).thenReturn(Optional.of(UserSnapshot.builder()
                .id(userId)
                .email("student@fpt.edu.vn")
                .userType(UserType.FPT_STUDENT)
                .status(AccountStatus.LOCKED)
                .build()));

        assertThat(authenticator.authenticate(token)).isEmpty();
    }

    @Test
    void authenticate_rejects_whenStatusDeleted() {
        stubValidToken();
        when(userPublicService.findById(userId)).thenReturn(Optional.of(UserSnapshot.builder()
                .id(userId)
                .email("student@fpt.edu.vn")
                .userType(UserType.FPT_STUDENT)
                .status(AccountStatus.DELETED)
                .build()));

        assertThat(authenticator.authenticate(token)).isEmpty();
    }

    @Test
    void authenticate_rejects_whenIatBeforeSessionsInvalidatedAt() {
        stubValidToken();
        LocalDateTime invalidatedAt = LocalDateTime.of(2026, 7, 1, 12, 0);
        when(userPublicService.findById(userId)).thenReturn(Optional.of(UserSnapshot.builder()
                .id(userId)
                .email("student@fpt.edu.vn")
                .userType(UserType.FPT_STUDENT)
                .status(AccountStatus.ACTIVE)
                .sessionsInvalidatedAt(invalidatedAt)
                .build()));

        assertThat(authenticator.authenticate(token)).isEmpty();
    }

    @Test
    void authenticate_rejects_whenIatEqualsSessionsInvalidatedAt() {
        stubValidToken();
        LocalDateTime invalidatedAt = LocalDateTime.of(2026, 7, 1, 10, 0);
        when(userPublicService.findById(userId)).thenReturn(Optional.of(UserSnapshot.builder()
                .id(userId)
                .email("student@fpt.edu.vn")
                .userType(UserType.FPT_STUDENT)
                .status(AccountStatus.ACTIVE)
                .sessionsInvalidatedAt(invalidatedAt)
                .build()));

        assertThat(authenticator.authenticate(token)).isEmpty();
    }

    @Test
    void authenticate_accepts_whenIatAfterSessionsInvalidatedAt() {
        stubValidToken();
        LocalDateTime invalidatedAt = LocalDateTime.of(2026, 6, 1, 0, 0);
        when(userPublicService.findById(userId)).thenReturn(Optional.of(UserSnapshot.builder()
                .id(userId)
                .email("student@fpt.edu.vn")
                .userType(UserType.FPT_STUDENT)
                .status(AccountStatus.ACTIVE)
                .sessionsInvalidatedAt(invalidatedAt)
                .build()));

        assertThat(authenticator.authenticate(token)).isPresent();
    }

    @Test
    void authenticate_rejects_whenTokenInvalid() {
        when(jwtProvider.validateToken(token)).thenReturn(false);

        assertThat(authenticator.authenticate(token)).isEmpty();
    }

    @Test
    void authenticate_rejects_whenTokenNull() {
        assertThat(authenticator.authenticate(null)).isEmpty();
    }

    private void stubValidToken() {
        when(jwtProvider.validateToken(token)).thenReturn(true);
        when(jwtProvider.getUserIdFromToken(token)).thenReturn(userId);
        when(jwtProvider.getIssuedAtFromToken(token)).thenReturn(issuedAt);
    }

    private UserSnapshot activeUser(UserType type) {
        return UserSnapshot.builder()
                .id(userId)
                .email("student@fpt.edu.vn")
                .userType(type)
                .status(AccountStatus.ACTIVE)
                .build();
    }
}
