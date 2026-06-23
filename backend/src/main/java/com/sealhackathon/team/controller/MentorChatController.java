package com.sealhackathon.team.controller;

import com.sealhackathon.common.response.ApiResponse;
import com.sealhackathon.team.dto.request.ChatMessageRequest;
import com.sealhackathon.team.dto.response.ChatMessageResponse;
import com.sealhackathon.team.service.MentorChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/events/{eventId}/teams/{teamId}/chat")
@RequiredArgsConstructor
@Tag(name = "Mentor Chat", description = "Chat between team and mentor")
@SecurityRequirement(name = "bearerAuth")
public class MentorChatController {

    private final MentorChatService chatService;

    @PostMapping
    @Operation(summary = "Send a chat message")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @PathVariable UUID eventId,
            @PathVariable UUID teamId,
            @Valid @RequestBody ChatMessageRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        ChatMessageResponse response = chatService.sendMessage(userId, teamId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Message sent", response));
    }

    @GetMapping
    @Operation(summary = "Get chat history")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getMessages(
            @PathVariable UUID eventId,
            @PathVariable UUID teamId,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(chatService.getMessages(userId, teamId)));
    }
}
