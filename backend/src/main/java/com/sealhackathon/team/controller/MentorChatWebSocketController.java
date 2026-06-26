package com.sealhackathon.team.controller;

import com.sealhackathon.auth.security.UserPrincipal;
import com.sealhackathon.team.dto.request.ChatMessageRequest;
import com.sealhackathon.team.dto.response.ChatMessageResponse;
import com.sealhackathon.team.service.MentorChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;

import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class MentorChatWebSocketController {

    private final MentorChatService chatService;

    @MessageMapping("/mentor-chat/{teamId}/send")
    public ChatMessageResponse sendMessage(
            @DestinationVariable UUID teamId,
            @Payload ChatMessageRequest request) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal userPrincipal)) {
            throw new IllegalStateException("Unauthenticated WebSocket connection");
        }
        UUID userId = userPrincipal.userId();
        return chatService.sendMessage(userId, teamId, request);
    }
}
