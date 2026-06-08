import { apiGet, apiPost } from "@/lib/api";

export type TeamStatus =
    | "INCOMPLETE"
    | "REGISTERED"
    | "INVALID";

export type Team = {
    id: number;
    competitionId: number;
    name: string;
    track?: string;
    status?: TeamStatus;
};

export type TeamMember = {
    id: number;
    teamId: number;
    userId: number;
    isLeader: boolean;
    joinedAt?: string;
};

export type TeamInvite = {
    id: number;
    teamId: number;
    email?: string;
    toEmail?: string;
    token?: string;
    status?: string;
    createdAt?: string;
};

export type MyTeamResponse = {
    team: Team | null;
    members: TeamMember[];
    isLeader?: boolean;
    leader?: boolean;
};

export async function getTeamsApi(): Promise<Team[]> {
    return apiGet<Team[]>("/api/teams");
}

export async function getTeamMembersApi(teamId: number): Promise<TeamMember[]> {
    return apiGet<TeamMember[]>(`/api/teams/${teamId}/members`);
}

export async function getMyTeamApi(): Promise<MyTeamResponse> {
    return apiGet<MyTeamResponse>("/api/teams/my-team");
}



export async function createTeamInviteApi(
    teamId: number,
    email: string
): Promise<TeamInvite> {
    return apiPost<TeamInvite>(`/api/teams/${teamId}/invites`, { email });
}


export type InviteCompetitionInfoResponse = {
    team: Team;
    competition: {
        id: number;
        name: string;
        description?: string;
        format?: string;
        status?: string;
        startDate?: string;
        registrationDeadline?: string;
    };
    inviteEmail: string;
    inviteStatus: string;
};

export async function getInviteInfoApi(
    token: string
): Promise<InviteCompetitionInfoResponse> {
    return apiGet<InviteCompetitionInfoResponse>(
        `/api/teams/invites/token/${token}`
    );
}
