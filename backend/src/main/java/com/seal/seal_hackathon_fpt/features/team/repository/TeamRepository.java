package com.seal.seal_hackathon_fpt.features.team.repository;

import com.seal.seal_hackathon_fpt.features.team.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamRepository extends JpaRepository<Team, Long> {}