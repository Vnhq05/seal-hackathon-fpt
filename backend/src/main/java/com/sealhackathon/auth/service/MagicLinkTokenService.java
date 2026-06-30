package com.sealhackathon.auth.service;

import com.sealhackathon.auth.domain.EventMagicToken;
import com.sealhackathon.auth.repository.EventMagicTokenRepository;
import com.sealhackathon.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DB-backed single-use magic link tokens scoped per user and event.
 * Follows the same lifecycle pattern as {@link TokenService} password-reset tokens.
 */
@Service
@RequiredArgsConstructor
public class MagicLinkTokenService {

    private final EventMagicTokenRepository eventMagicTokenRepository;

    @Value("${app.magic-link.expiration-minutes:30}")
    private int expirationMinutes;

    @Transactional
    public String createToken(UUID userId, UUID eventId) {
        eventMagicTokenRepository.invalidateAllByUserIdAndEventId(userId, eventId);

        String token = UUID.randomUUID().toString();
        EventMagicToken magicToken = EventMagicToken.builder()
                .userId(userId)
                .eventId(eventId)
                .token(token)
                .expiresAt(LocalDateTime.now().plusMinutes(expirationMinutes))
                .build();
        eventMagicTokenRepository.save(magicToken);
        return token;
    }

    @Transactional
    public EventMagicToken validateAndConsume(String token) {
        EventMagicToken magicToken = eventMagicTokenRepository.findByTokenAndUsedFalse(token)
                .orElseThrow(() -> new BusinessException(
                        "Invalid or already-used link.", HttpStatus.BAD_REQUEST) {});

        if (magicToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            magicToken.setUsed(true);
            eventMagicTokenRepository.save(magicToken);
            throw new BusinessException(
                    "This link has expired. Please register again.", HttpStatus.GONE) {};
        }

        magicToken.setUsed(true);
        eventMagicTokenRepository.save(magicToken);
        return magicToken;
    }
}
