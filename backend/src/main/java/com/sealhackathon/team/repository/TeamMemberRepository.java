package com.sealhackathon.team.repository;

import com.sealhackathon.team.domain.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, UUID> {

    List<TeamMember> findByTeamId(UUID teamId);

    int countByTeamId(UUID teamId);

    long countByUserId(UUID userId);

    boolean existsByTeamIdAndUserId(UUID teamId, UUID userId);

    Optional<TeamMember> findByTeamIdAndUserId(UUID teamId, UUID userId);

    @Query("SELECT tm FROM TeamMember tm WHERE tm.userId = :userId AND tm.team.eventId = :eventId")
    Optional<TeamMember> findByUserIdAndEventId(@Param("userId") UUID userId, @Param("eventId") UUID eventId);

    @Query("SELECT COUNT(tm) > 0 FROM TeamMember tm WHERE tm.userId = :userId AND tm.team.eventId = :eventId")
    boolean existsByUserIdAndEventId(@Param("userId") UUID userId, @Param("eventId") UUID eventId);

    @Query("SELECT tm.team.id FROM TeamMember tm WHERE tm.userId = :userId AND tm.team.eventId = :eventId")
    Optional<UUID> findTeamIdByUserIdAndEventId(@Param("userId") UUID userId, @Param("eventId") UUID eventId);
}
