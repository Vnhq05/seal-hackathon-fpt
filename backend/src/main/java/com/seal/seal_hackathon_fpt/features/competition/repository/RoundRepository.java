package com.seal.seal_hackathon_fpt.features.competition.repository;

import com.seal.seal_hackathon_fpt.features.competition.entity.Round;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoundRepository extends JpaRepository<Round, Long> {
    List<Round> findByCompetitionId(Long competitionId);
}
