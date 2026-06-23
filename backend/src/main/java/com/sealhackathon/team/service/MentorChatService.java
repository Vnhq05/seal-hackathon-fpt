package com.sealhackathon.team.service;

import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.common.exception.ResourceNotFoundException;
import com.sealhackathon.team.domain.MentorChatMessage;
import com.sealhackathon.team.dto.request.ChatMessageRequest;
import com.sealhackathon.team.dto.response.ChatMessageResponse;
import com.sealhackathon.team.repository.MentorChatMessageRepository;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MentorChatService {

    private final MentorChatMessageRepository chatRepository;
    private final TeamPublicService teamPublicService;
    private final UserPublicService userPublicService;

    @Transactional
    public ChatMessageResponse sendMessage(UUID userId, UUID teamId, ChatMessageRequest request) {
        boolean isTeamMember = teamPublicService.isTeamMember(userId, teamId);
        boolean isMentor = teamPublicService.isMentorOfTeam(userId, teamId);

        if (!isTeamMember && !isMentor) {
            throw new BusinessException("Only team members and assigned mentor can chat", HttpStatus.FORBIDDEN) {};
        }

        MentorChatMessage message = MentorChatMessage.builder()
                .teamId(teamId)
                .senderUserId(userId)
                .message(request.getMessage())
                .sentAt(LocalDateTime.now())
                .build();

        message = chatRepository.save(message);
        return toResponse(message);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(UUID userId, UUID teamId) {
        boolean isTeamMember = teamPublicService.isTeamMember(userId, teamId);
        boolean isMentor = teamPublicService.isMentorOfTeam(userId, teamId);

        if (!isTeamMember && !isMentor) {
            throw new BusinessException("Only team members and assigned mentor can view chat", HttpStatus.FORBIDDEN) {};
        }

        return chatRepository.findByTeamIdOrderBySentAtAsc(teamId).stream()
                .map(this::toResponse)
                .toList();
    }

    private ChatMessageResponse toResponse(MentorChatMessage msg) {
        String senderName = userPublicService.findById(msg.getSenderUserId())
                .map(u -> u.getFullName())
                .orElse("Unknown");

        return ChatMessageResponse.builder()
                .id(msg.getId())
                .teamId(msg.getTeamId())
                .senderUserId(msg.getSenderUserId())
                .senderName(senderName)
                .message(msg.getMessage())
                .sentAt(msg.getSentAt())
                .build();
    }
}
