import { api } from "./api-client";

// ═══ Types ═══

export interface ChatMessageResponse {
  id: string;
  teamId: string;
  senderUserId: string;
  senderName: string;
  message: string;
  sentAt: string;
}

export interface ChatMessageRequest {
  message: string;
}

// ═══ API calls ═══

export const mentorChatApi = {
  getMessages(eventId: string, teamId: string): Promise<ChatMessageResponse[]> {
    return api.get<ChatMessageResponse[]>(`/events/${eventId}/teams/${teamId}/chat`);
  },

  sendMessage(eventId: string, teamId: string, body: ChatMessageRequest): Promise<ChatMessageResponse> {
    return api.post<ChatMessageResponse>(`/events/${eventId}/teams/${teamId}/chat`, body);
  },
};
