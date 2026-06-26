package com.sealhackathon.team.service;

import com.sealhackathon.audit.service.AuditService;
import com.sealhackathon.common.exception.BusinessException;
import com.sealhackathon.team.domain.MentorChatMessage;
import com.sealhackathon.team.dto.request.ChatMessageRequest;
import com.sealhackathon.team.dto.response.ChatMessageResponse;
import com.sealhackathon.team.repository.MentorChatMessageRepository;
import com.sealhackathon.user.service.UserPublicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
    private final AuditService auditService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ChatMessageResponse sendMessage(UUID userId, UUID teamId, ChatMessageRequest request) {
        validateChatAccess(userId, teamId);

        MentorChatMessage message = MentorChatMessage.builder()
                .teamId(teamId)
                .senderUserId(userId)
                .message(request.getMessage().trim())
                .sentAt(LocalDateTime.now())
                .build();

        message = chatRepository.save(message);
        ChatMessageResponse response = toResponse(message);

        String auditPayload = String.format(
                "{\"userId\":\"%s\",\"message\":%s,\"timestamp\":\"%s\"}",
                userId,
                jsonEscape(message.getMessage()),
                message.getSentAt());
        auditService.log(userId, "MENTOR_CHAT_MESSAGE", teamId, "MentorChatMessage",
                null, auditPayload, null);

        messagingTemplate.convertAndSend("/topic/mentor-chat/" + teamId, response);

        return response;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(UUID userId, UUID teamId) {
        validateChatAccess(userId, teamId);
        return chatRepository.findByTeamIdOrderBySentAtAsc(teamId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean hasAccessToTeamChat(UUID userId, UUID teamId) {
        return teamPublicService.isTeamMember(userId, teamId)
                || teamPublicService.isMentorOfTeam(userId, teamId);
    }

    private void validateChatAccess(UUID userId, UUID teamId) {
        if (!hasAccessToTeamChat(userId, teamId)) {
            throw new BusinessException("Only team members and assigned mentor can chat", HttpStatus.FORBIDDEN) {};
        }
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

    private static String jsonEscape(String value) {
        if (value == null) return "\"\"";
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n") + "\"";
    }
}
