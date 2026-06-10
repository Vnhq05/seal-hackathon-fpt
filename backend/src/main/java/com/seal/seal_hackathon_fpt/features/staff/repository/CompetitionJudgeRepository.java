package com.seal.seal_hackathon_fpt.features.staff.repository;

import com.seal.seal_hackathon_fpt.features.staff.entity.CompetitionJudge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompetitionJudgeRepository extends JpaRepository<CompetitionJudge, Long> {

    List<CompetitionJudge> findByCompetitionId(Long competitionId);

    boolean existsByCompetitionIdAndJudgeId(Long competitionId, Long judgeId);

    void deleteByCompetitionIdAndJudgeId(Long competitionId, Long judgeId);
}
