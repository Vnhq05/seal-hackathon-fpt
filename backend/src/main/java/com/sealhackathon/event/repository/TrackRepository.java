package com.sealhackathon.event.repository;

import com.sealhackathon.event.domain.Track;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TrackRepository extends JpaRepository<Track, UUID> {

    List<Track> findByHackathonEventId(UUID eventId);

    boolean existsByHackathonEventIdAndName(UUID eventId, String name);

    boolean existsByHackathonEventIdAndNameAndIdNot(UUID eventId, String name, UUID trackId);

    long countByHackathonEventId(UUID eventId);
}
