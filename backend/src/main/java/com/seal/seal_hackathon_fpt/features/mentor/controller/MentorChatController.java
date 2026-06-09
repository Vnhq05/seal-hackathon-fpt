package com.seal.seal_hackathon_fpt.features.mentor.controller;

import com.seal.seal_hackathon_fpt.features.mentor.entity.*;
import com.seal.seal_hackathon_fpt.features.mentor.service.MentorChatService;
import com.seal.seal_hackathon_fpt.features.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mentor-chat")
@RequiredArgsConstructor
public class MentorChatController {

    private final MentorChatService chatService;

    // 1. Team chủ động gửi lời mời tới Mentor đích danh (kèm lời nhắn tuỳ chọn).
    @PostMapping("/request/send")
    public ResponseEntity<MentorRequest> sendRequest(
            @RequestParam Long teamId,
            @RequestParam Long mentorId,
            @RequestParam(required = false) String message,
            @AuthenticationPrincipal User currentUser
    ) {
        String fromEmail = currentUser != null ? currentUser.getEmail() : null;
        return ResponseEntity.ok(chatService.sendRequestToMentor(teamId, mentorId, message, fromEmail));
    }

    // 2. Mentor lấy danh sách các lời mời của các Team đang đợi mình duyệt
    @GetMapping("/requests/pending")
    public ResponseEntity<List<MentorRequest>> getPendingRequests(@RequestParam Long mentorId) {
        return ResponseEntity.ok(chatService.getPendingRequestsForMentor(mentorId));
    }

    // 2b. Team xem các lời mời ĐÃ GỬI của mình + trạng thái (Sent invitations).
    @GetMapping("/requests/by-team/{teamId}")
    public ResponseEntity<List<MentorRequest>> getRequestsByTeam(@PathVariable Long teamId) {
        return ResponseEntity.ok(chatService.getRequestsByTeam(teamId));
    }

    // 3. Mentor đưa ra quyết định duyệt: truyền decision là ACCEPTED hoặc DENIED
    @PutMapping("/request/{requestId}/respond")
    public ResponseEntity<MentorRequest> respondRequest(
            @PathVariable Long requestId,
            @RequestParam String decision
    ) {
        return ResponseEntity.ok(chatService.handleRequest(requestId, decision));
    }

    // 4. Lấy thông tin phòng chat hiện tại của Team (Để lấy ra được RoomID đi chat)
    @GetMapping("/room/team/{teamId}")
    public ResponseEntity<MentorRoom> getRoomByTeam(@PathVariable Long teamId) {
        return ResponseEntity.ok(chatService.getActiveRoomByTeam(teamId));
    }

    // 5. Gửi tin nhắn vào Room
    @PostMapping("/room/{roomId}/send")
    public ResponseEntity<ChatMessage> sendMessage(
            @PathVariable Long roomId,
            @RequestParam Long senderId,
            @RequestParam String senderName,
            @RequestParam String content
    ) {
        return ResponseEntity.ok(chatService.sendMessage(roomId, senderId, senderName, content));
    }

    // 6. Polling lấy tin nhắn của Room
    @GetMapping("/room/{roomId}/messages")
    public ResponseEntity<List<ChatMessage>> getMessages(@PathVariable Long roomId) {
        return ResponseEntity.ok(chatService.getMessages(roomId));
    }

    @GetMapping("/rooms/active")
    public ResponseEntity<List<MentorRoom>> getActiveRooms(@RequestParam Long mentorId) {
        return ResponseEntity.ok(chatService.getActiveRoomsForMentor(mentorId));
    }
}
