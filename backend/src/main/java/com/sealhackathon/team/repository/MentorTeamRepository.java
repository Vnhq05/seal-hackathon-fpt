package com.sealhackathon.team.repository;

import com.sealhackathon.team.domain.MentorTeam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MentorTeamRepository extends JpaRepository<MentorTeam, UUID> {

    boolean existsByMentorUserIdAndTeamId(UUID mentorUserId, UUID teamId);

    boolean existsByTeamId(UUID teamId);

    Optional<MentorTeam> findByTeamId(UUID teamId);

    List<MentorTeam> findByMentorUserId(UUID mentorUserId);

    long countByMentorUserId(UUID mentorUserId);

    @Query("SELECT mt FROM MentorTeam mt WHERE mt.mentorUserId = :mentorId AND mt.team.eventId = :eventId")
    List<MentorTeam> findByMentorUserIdAndEventId(@Param("mentorId") UUID mentorId, @Param("eventId") UUID eventId);

    @Query("SELECT COUNT(mt) > 0 FROM MentorTeam mt WHERE mt.mentorUserId = :mentorId AND mt.team.id = :teamId")
    boolean isMentorOfTeam(@Param("mentorId") UUID mentorId, @Param("teamId") UUID teamId);
}
