package com.sealhackathon.auth.repository;

import com.sealhackathon.auth.domain.EventMagicToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventMagicTokenRepository extends JpaRepository<EventMagicToken, UUID> {

    Optional<EventMagicToken> findByTokenAndUsedFalse(String token);

    @Modifying
    @Query("UPDATE EventMagicToken t SET t.used = true "
            + "WHERE t.userId = :userId AND t.eventId = :eventId AND t.used = false")
    void invalidateAllByUserIdAndEventId(@Param("userId") UUID userId, @Param("eventId") UUID eventId);
}
