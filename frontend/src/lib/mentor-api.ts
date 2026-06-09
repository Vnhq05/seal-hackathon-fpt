"use client";
/* ============================================================================
 * mentor-api.ts — gọi BACKEND THẬT cho phần Mentor & Mentor-Chat.
 * ----------------------------------------------------------------------------
 * Endpoints (xem MentorController.java + MentorChatController.java):
 *   GET  /api/mentors                                  → danh sách mentor (để mời)
 *   POST /api/mentor-chat/request/send?teamId&mentorId → team mời 1 mentor
 *   GET  /api/mentor-chat/requests/pending?mentorId    → lời mời đang chờ mentor duyệt
 *   PUT  /api/mentor-chat/request/{id}/respond?decision=ACCEPTED|DENIED
 *   GET  /api/mentor-chat/room/team/{teamId}           → phòng chat của team (nếu đã có mentor)
 *   POST /api/mentor-chat/room/{roomId}/send?senderId&senderName&content
 *   GET  /api/mentor-chat/room/{roomId}/messages       → tin nhắn (polling)
 *   GET  /api/mentor-chat/rooms/active?mentorId         → các phòng mentor đang dẫn
 * ========================================================================== */
import { apiGet, apiPost, apiPut } from "@/lib/api";

export interface Mentor {
  id: number;        // id của bản ghi mentor (DÙNG làm mentorId khi mời/duyệt)
  userId: number;    // id user đăng nhập tương ứng
  fullName: string;
  specialty?: string | null;
  organization?: string | null;
}

export interface MentorRequest {
  id: number;
  teamId: number;
  mentorId: number;
  status: "PENDING" | "ACCEPTED" | "DENIED";
  createdAt?: string;
  updatedAt?: string;
}

export interface MentorRoom {
  id: number;
  teamId: number;
  mentorId: number;
  createdAt?: string;
}

export interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  senderName: string;
  messageContent: string;
  createdAt?: string;
}

// --- Mentor list ---
export const listMentorsApi = () => apiGet<Mentor[]>("/api/mentors");

// --- Mời / duyệt ---
export const sendMentorRequestApi = (teamId: number, mentorId: number) =>
  apiPost<MentorRequest>(`/api/mentor-chat/request/send?teamId=${teamId}&mentorId=${mentorId}`);

export const getPendingRequestsApi = (mentorId: number) =>
  apiGet<MentorRequest[]>(`/api/mentor-chat/requests/pending?mentorId=${mentorId}`);

export const respondMentorRequestApi = (requestId: number, decision: "ACCEPTED" | "DENIED") =>
  apiPut<MentorRequest>(`/api/mentor-chat/request/${requestId}/respond?decision=${decision}`);

// --- Phòng chat ---
// Backend ném lỗi nếu team chưa có phòng → bọc lại để trả null cho dễ dùng ở UI.
export async function getRoomByTeamApi(teamId: number): Promise<MentorRoom | null> {
  try {
    return await apiGet<MentorRoom>(`/api/mentor-chat/room/team/${teamId}`);
  } catch {
    return null;
  }
}

export const getActiveRoomsApi = (mentorId: number) =>
  apiGet<MentorRoom[]>(`/api/mentor-chat/rooms/active?mentorId=${mentorId}`);

export const sendChatMessageApi = (
  roomId: number,
  senderId: number,
  senderName: string,
  content: string,
) =>
  apiPost<ChatMessage>(
    `/api/mentor-chat/room/${roomId}/send?senderId=${senderId}` +
      `&senderName=${encodeURIComponent(senderName)}&content=${encodeURIComponent(content)}`,
  );

export const getMessagesApi = (roomId: number) =>
  apiGet<ChatMessage[]>(`/api/mentor-chat/room/${roomId}/messages`);
