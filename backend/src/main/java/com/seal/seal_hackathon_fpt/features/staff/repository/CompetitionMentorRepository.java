package com.seal.seal_hackathon_fpt.features.staff.repository;

import com.seal.seal_hackathon_fpt.features.staff.entity.CompetitionMentor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompetitionMentorRepository extends JpaRepository<CompetitionMentor, Long> {

    List<CompetitionMentor> findByCompetitionId(Long competitionId);

    boolean existsByCompetitionIdAndMentorId(Long competitionId, Long mentorId);

    void deleteByCompetitionIdAndMentorId(Long competitionId, Long mentorId);
}
