package com.sealhackathon.event.repository;

import com.sealhackathon.event.domain.ScoringTemplate;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ScoringTemplateRepository extends JpaRepository<ScoringTemplate, UUID> {

    @EntityGraph(attributePaths = "criteria")
    List<ScoringTemplate> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "criteria")
    Optional<ScoringTemplate> findWithCriteriaById(UUID id);

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, UUID id);
}
