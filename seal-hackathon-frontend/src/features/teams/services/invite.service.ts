import { apiClient } from "@/lib/axios";
import type {
  InviteSearchParams,
  InviteSearchResponse,
  PendingInvitesResponse,
  SendInviteRequest,
  SendInviteResponse,
  CancelInviteRequest,
  CancelInviteResponse,
} from "@/features/teams/types/invite.types";

export async function searchInviteCandidates(
  params: InviteSearchParams,
): Promise<InviteSearchResponse> {
  const { data } = await apiClient.get<InviteSearchResponse>(
    `/teams/${params.teamId}/invite/search`,
    { params: { search: params.search } },
  );
  return data;
}

export async function fetchPendingInvites(
  teamId: string,
): Promise<PendingInvitesResponse> {
  const { data } = await apiClient.get<PendingInvitesResponse>(
    `/teams/${teamId}/invites`,
  );
  return data;
}

export async function sendInvite(
  payload: SendInviteRequest,
): Promise<SendInviteResponse> {
  const { data } = await apiClient.post<SendInviteResponse>(
    `/teams/${payload.teamId}/invites`,
    { userId: payload.userId },
  );
  return data;
}

export async function cancelInvite(
  payload: CancelInviteRequest,
): Promise<CancelInviteResponse> {
  const { data } = await apiClient.delete<CancelInviteResponse>(
    `/teams/${payload.teamId}/invites/${payload.inviteId}`,
  );
  return data;
}
