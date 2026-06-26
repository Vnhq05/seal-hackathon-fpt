package com.sealhackathon.team.service;

import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.team.domain.MentorFeedback;
import com.sealhackathon.team.dto.request.MentorFeedbackRequest;
import com.sealhackathon.team.dto.response.MentorFeedbackResponse;
import com.sealhackathon.team.repository.MentorFeedbackRepository;
import com.sealhackathon.team.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MentorFeedbackService {

    private final MentorFeedbackRepository feedbackRepository;
    private final MentorTeamService mentorTeamService;
    private final TeamRepository teamRepository;

    @Transactional
    public MentorFeedbackResponse submitFeedback(UUID mentorUserId, MentorFeedbackRequest request) {
        teamRepository.findById(request.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team", "id", request.getTeamId()));

        mentorTeamService.requireMentorAssignedToTeam(mentorUserId, request.getTeamId());

        MentorFeedback feedback = MentorFeedback.builder()
                .teamId(request.getTeamId())
                .mentorUserId(mentorUserId)
                .subject(request.getSubject().trim())
                .content(request.getContent().trim())
                .submittedAt(LocalDateTime.now())
                .build();

        feedback = feedbackRepository.save(feedback);
        return toResponse(feedback);
    }

    private MentorFeedbackResponse toResponse(MentorFeedback feedback) {
        return MentorFeedbackResponse.builder()
                .id(feedback.getId())
                .teamId(feedback.getTeamId())
                .mentorUserId(feedback.getMentorUserId())
                .subject(feedback.getSubject())
                .content(feedback.getContent())
                .submittedAt(feedback.getSubmittedAt())
                .build();
    }
}
