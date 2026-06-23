package com.sealhackathon.event.repository;

import com.sealhackathon.event.domain.Prize;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PrizeRepository extends JpaRepository<Prize, UUID> {

    List<Prize> findByHackathonEventId(UUID eventId);
}
