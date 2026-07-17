package com.sealhackathon.team.repository;

import com.sealhackathon.team.domain.TeamMember;
import com.sealhackathon.team.domain.enums.TeamStatus;
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

    Optional<TeamMember> findByUserIdAndEventId(UUID userId, UUID eventId);

    boolean existsByUserIdAndEventId(UUID userId, UUID eventId);

    /** Membership on a non-disbanded team — disbanded teams must not block re-joining. */
    @Query("SELECT COUNT(tm) > 0 FROM TeamMember tm JOIN tm.team t "
            + "WHERE tm.userId = :userId AND tm.eventId = :eventId "
            + "AND t.status <> com.sealhackathon.team.domain.enums.TeamStatus.DISBANDED")
    boolean existsActiveByUserIdAndEventId(@Param("userId") UUID userId, @Param("eventId") UUID eventId);

    @Query("SELECT tm.team.id FROM TeamMember tm WHERE tm.userId = :userId AND tm.eventId = :eventId")
    Optional<UUID> findTeamIdByUserIdAndEventId(@Param("userId") UUID userId, @Param("eventId") UUID eventId);

    @Query("SELECT tm.team.id FROM TeamMember tm JOIN tm.team t "
            + "WHERE tm.userId = :userId AND tm.eventId = :eventId "
            + "AND t.status <> com.sealhackathon.team.domain.enums.TeamStatus.DISBANDED")
    Optional<UUID> findActiveTeamIdByUserIdAndEventId(@Param("userId") UUID userId, @Param("eventId") UUID eventId);

    @Query("SELECT tm FROM TeamMember tm JOIN tm.team t "
            + "WHERE tm.eventId = :eventId AND t.status = :status")
    List<TeamMember> findByEventIdAndTeamStatus(
            @Param("eventId") UUID eventId, @Param("status") TeamStatus status);

    @Query("SELECT tm FROM TeamMember tm JOIN FETCH tm.team t WHERE tm.userId = :userId ORDER BY t.createdAt DESC")
    List<TeamMember> findByUserId(@Param("userId") UUID userId);
}
