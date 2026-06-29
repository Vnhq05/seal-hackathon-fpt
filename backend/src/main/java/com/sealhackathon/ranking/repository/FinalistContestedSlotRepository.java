package com.sealhackathon.ranking.repository;

import com.sealhackathon.ranking.domain.FinalistContestedSlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FinalistContestedSlotRepository extends JpaRepository<FinalistContestedSlot, UUID> {

    List<FinalistContestedSlot> findByEventIdAndResolvedFalseOrderBySlotIndexAsc(UUID eventId);

    void deleteByEventId(UUID eventId);
}
