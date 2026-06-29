package com.sealhackathon.ranking.repository;

import com.sealhackathon.ranking.domain.ParticipationCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ParticipationCertificateRepository extends JpaRepository<ParticipationCertificate, UUID> {

    List<ParticipationCertificate> findByEventIdOrderByIssuedAtAsc(UUID eventId);

    Optional<ParticipationCertificate> findByEventIdAndUserId(UUID eventId, UUID userId);

    long countByEventId(UUID eventId);

    void deleteByEventId(UUID eventId);
}
