package com.sealhackathon.auth.repository;

import com.sealhackathon.auth.domain.EmailOtpToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailOtpTokenRepository extends JpaRepository<EmailOtpToken, UUID> {

    Optional<EmailOtpToken> findByUserIdAndCodeAndUsedFalse(UUID userId, String code);

    boolean existsByUserIdAndUsedTrue(UUID userId);

    Optional<EmailOtpToken> findTopByUserIdOrderByCreatedAtDesc(UUID userId);

    @Modifying
    @Query("UPDATE EmailOtpToken t SET t.used = true WHERE t.userId = :userId AND t.used = false")
    void invalidateAllByUserId(@Param("userId") UUID userId);
}
