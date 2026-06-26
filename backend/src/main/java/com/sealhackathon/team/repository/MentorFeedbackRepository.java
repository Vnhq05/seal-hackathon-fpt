package com.sealhackathon.team.repository;

import com.sealhackathon.team.domain.MentorFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MentorFeedbackRepository extends JpaRepository<MentorFeedback, UUID> {
}
