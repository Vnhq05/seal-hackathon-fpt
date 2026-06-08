const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token") || localStorage.getItem("accessToken");
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers ?? {}),
        },
    });

    if (!res.ok) {
        const message = await res.text();
        throw new Error(message || `API error ${res.status}`);
    }

    if (res.status === 204) {
        return null as T;
    }

    return res.json();
}

export type TeamStatus = "INCOMPLETE" | "REGISTERED" | "INVALID";

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
    email?: string;
    fullName?: string;
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
    isLeader: boolean;
};

export async function getMyTeam(): Promise<MyTeamResponse> {
    return apiFetch<MyTeamResponse>("/api/teams/my-team");
}

export async function getTeamMembers(teamId: number): Promise<TeamMember[]> {
    return apiFetch<TeamMember[]>(`/api/teams/${teamId}/members`);
}

export async function createTeamMemberInviteApi(teamId: number, email: string) {
    return apiFetch<TeamInvite>(`/api/teams/${teamId}/invites`, {
        method: "POST",
        body: JSON.stringify({ email }),
    });
}

export async function getTeamInvitesApi(teamId: number) {
    return apiFetch<TeamInvite[]>(`/api/teams/${teamId}/invites`);
}