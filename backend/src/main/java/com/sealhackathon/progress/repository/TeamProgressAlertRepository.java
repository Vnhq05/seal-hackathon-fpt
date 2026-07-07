package com.sealhackathon.progress.repository;

import com.sealhackathon.progress.domain.TeamProgressAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamProgressAlertRepository extends JpaRepository<TeamProgressAlert, UUID> {

    Optional<TeamProgressAlert> findByTeamIdAndRoundId(UUID teamId, UUID roundId);

    List<TeamProgressAlert> findByRoundId(UUID roundId);
}
