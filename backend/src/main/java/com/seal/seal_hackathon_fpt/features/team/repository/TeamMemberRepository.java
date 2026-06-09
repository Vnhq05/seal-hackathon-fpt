package com.seal.seal_hackathon_fpt.features.team.repository;

import com.seal.seal_hackathon_fpt.features.team.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {

    boolean existsByTeamIdAndUserId(Long teamId, Long userId);

    boolean existsByTeamIdAndIsLeaderTrue(Long teamId);

    Optional<TeamMember> findByTeamIdAndUserId(Long teamId, Long userId);

    long countByTeamId(Long teamId);

    List<TeamMember> findByTeamId(Long teamId);

    Optional<TeamMember> findFirstByUserId(Long userId);

    // Tất cả các bản ghi thành viên của 1 user → suy ra mọi team (mọi cuộc thi) mà user tham gia.
    List<TeamMember> findByUserId(Long userId);
}