package com.sealhackathon.ranking.repository;

import com.sealhackathon.ranking.domain.TeamAward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TeamAwardRepository extends JpaRepository<TeamAward, UUID> {

    List<TeamAward> findByEventIdOrderByAwardedAtAsc(UUID eventId);

    void deleteByEventId(UUID eventId);
}
