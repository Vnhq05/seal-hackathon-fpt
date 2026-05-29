package com.seal.seal_hackathon_fpt.features.competition.repository;

import com.seal.seal_hackathon_fpt.features.competition.entity.Competition;
import com.seal.seal_hackathon_fpt.features.competition.entity.Round;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CompetitionRepository extends JpaRepository<Competition, Long> {}

