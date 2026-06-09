import { apiGet, apiPost, apiPut } from "@/lib/api";

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
    email?: string;
    name?: string;
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

export type CreateTeamRequest = {
    competitionId: number;
    name: string;
};

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

/**
 * GET /api/teams
 * Lấy danh sách team.
 */
export async function getTeamsApi(): Promise<Team[]> {
    return apiGet<Team[]>("/api/teams");
}

/**
 * GET /api/teams/{teamId}/members
 * Lấy danh sách member của team.
 */
export async function getTeamMembersApi(teamId: number): Promise<TeamMember[]> {
    return apiGet<TeamMember[]>(`/api/teams/${teamId}/members`);
}

/**
 * GET /api/teams/my-team
 * Lấy team của user đang đăng nhập.
 * Backend tự lấy userId từ JWT, không truyền userId từ FE nữa.
 */
export async function getMyTeamApi(): Promise<MyTeamResponse> {
    return apiGet<MyTeamResponse>("/api/teams/my-team");
}

/**
 * GET /api/teams/my-teams
 * Lấy TẤT CẢ team của user đang đăng nhập (mỗi cuộc thi 1 team).
 */
export async function getMyTeamsApi(): Promise<MyTeamResponse[]> {
    return apiGet<MyTeamResponse[]>("/api/teams/my-teams");
}

/**
 * POST /api/teams
 * Tạo team mới.
 * Backend tự lấy creator/currentUser từ JWT.
 */
export async function createTeamApi(
    data: CreateTeamRequest
): Promise<Team> {
    return apiPost<Team>("/api/teams", data);
}

/**
 * PUT /api/teams/{teamId}
 * Leader đổi tên team (chỉ trước khi cuộc thi bắt đầu — backend chặn).
 */
export async function updateTeamNameApi(
    teamId: number,
    name: string
): Promise<Team> {
    return apiPut<Team>(`/api/teams/${teamId}`, { name });
}

/**
 * POST /api/teams/{teamId}/invites
 * Leader gửi lời mời member bằng email.
 */
export async function createTeamInviteApi(
    teamId: number,
    email: string
): Promise<TeamInvite> {
    return apiPost<TeamInvite>(`/api/teams/${teamId}/invites`, { email });
}

/**
 * POST /api/teams/{teamId}/members/by-email
 * Leader thêm thành viên TRỰC TIẾP bằng email — vào team luôn, không cần accept.
 */
export async function addTeamMemberByEmailApi(
    teamId: number,
    email: string
): Promise<TeamMember> {
    return apiPost<TeamMember>(`/api/teams/${teamId}/members/by-email`, { email });
}

/**
 * GET /api/teams/invites/token/{token}
 * Lấy thông tin invite bằng token.
 * Phần này chỉ dùng nếu bạn còn giữ trang /invite/[token].
 */
export async function getInviteInfoApi(
    token: string
): Promise<InviteCompetitionInfoResponse> {
    return apiGet<InviteCompetitionInfoResponse>(
        `/api/teams/invites/token/${token}`
    );
}