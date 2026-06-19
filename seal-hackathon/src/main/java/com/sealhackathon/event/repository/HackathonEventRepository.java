package com.sealhackathon.event.repository;

import com.sealhackathon.event.domain.HackathonEvent;
import com.sealhackathon.event.domain.enums.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface HackathonEventRepository extends JpaRepository<HackathonEvent, UUID> {

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, UUID id);

    Page<HackathonEvent> findByStatus(EventStatus status, Pageable pageable);
}
