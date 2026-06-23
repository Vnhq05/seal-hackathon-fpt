package com.sealhackathon.event.repository;

import com.sealhackathon.event.domain.ScoringTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ScoringTemplateRepository extends JpaRepository<ScoringTemplate, UUID> {

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, UUID id);
}
