package com.sealhackathon.auth.service;

import com.sealhackathon.auth.domain.EventMagicToken;
import com.sealhackathon.auth.repository.EventMagicTokenRepository;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.util.TokenHasher;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DB-backed single-use magic link tokens scoped per user and event.
 * Plaintext returned once; only SHA-256 hash is persisted.
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

        String plaintext = UUID.randomUUID().toString();
        EventMagicToken magicToken = EventMagicToken.builder()
                .userId(userId)
                .eventId(eventId)
                .token(TokenHasher.hash(plaintext))
                .expiresAt(LocalDateTime.now().plusMinutes(expirationMinutes))
                .build();
        eventMagicTokenRepository.save(magicToken);
        return plaintext;
    }

    @Transactional
    public EventMagicToken validateAndConsume(String plaintext) {
        EventMagicToken magicToken = eventMagicTokenRepository
                .findByTokenAndUsedFalse(TokenHasher.hash(plaintext))
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
