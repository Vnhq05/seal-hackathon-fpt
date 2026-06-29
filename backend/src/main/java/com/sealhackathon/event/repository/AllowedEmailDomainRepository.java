package com.sealhackathon.event.repository;

import com.sealhackathon.event.domain.AllowedEmailDomain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AllowedEmailDomainRepository extends JpaRepository<AllowedEmailDomain, UUID> {

    List<AllowedEmailDomain> findByEventIdOrderByDomainAsc(UUID eventId);

    boolean existsByEventId(UUID eventId);

    void deleteByEventIdAndId(UUID eventId, UUID id);
}
