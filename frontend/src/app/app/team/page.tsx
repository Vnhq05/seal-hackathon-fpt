"use client";

import { useRequireRole } from "@/lib/role-guard";
import * as React from "react";
import { PageHeader } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import {
  useCompetitionStore,
  type CompetitionFull,
} from "@/lib/competition-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Trophy,
  Users,
  Plus,
  Calendar,
  MapPin,
  Github,
  FileText,
  Video,
  Upload,
  Pencil,
  Check,
  X,
  Lock,
  Award,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { statusBadgeClass } from "@/lib/utils";
import {
  getMyTeamsApi,
  addTeamMemberByEmailApi,
  updateTeamNameApi,
  type Team,
  type TeamMember,
  type MyTeamResponse,
} from "@/lib/team-api";
import {
  getRoundsApi,
  getRankingApi,
  type Round,
} from "@/lib/competition";
import {
  submitWorkApi,
  getTeamSubmissionsApi,
  type Submission,
} from "@/lib/submission-api";
import {
  getRoomByTeamApi,
  listMentorsApi,
  type Mentor,
} from "@/lib/mentor-api";

// Kết quả chung cuộc, suy ra từ ranking vòng cuối.
type PastOutcome = "Champion" | "Finalist" | "Eliminated";

// Dữ liệu "Past participation" tính từ backend thật cho 1 team đã đóng.
interface PastComputed {
  loading: boolean;
  finalRank: number | null;
  outcome: PastOutcome | null;
  roundScores: { round: string; score: string }[];
  mentorName: string;
}

// Điểm BigDecimal từ backend → chuỗi gọn.
function formatScore(v: number | string): string {
  const n = Number(v);
  return Number.isFinite(n) ? String(Number(n.toFixed(2))) : String(v);
}

function outcomeBadgeClass(outcome: PastOutcome | null): string {
  if (outcome === "Champion") return "btn-gradient text-primary-foreground border-transparent";
  if (outcome === "Finalist") return "bg-muted text-foreground border-transparent";
  return "bg-muted/60 text-muted-foreground border-transparent"; // Eliminated / unknown
}

export default function TeamPage() {
  useRequireRole(["Participant"]);

  const { user } = useAuth();
  const { competitions, seasons, years } = useCompetitionStore();

  const [myTeams, setMyTeams] = React.useState<MyTeamResponse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedTeamId, setSelectedTeamId] = React.useState<number | null>(null);
  const [tab, setTab] = React.useState<"current" | "past">("current");

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyTeamsApi();
      setMyTeams(data.filter((mt) => mt.team));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load teams");
      setMyTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const compById = React.useCallback(
      (id?: number | null) => competitions.find((c) => String(c.id) === String(id)),
      [competitions],
  );

  // Cuộc thi đã đóng (status "Closed") → Past; còn lại → Current.
  const isClosed = React.useCallback(
      (mt: MyTeamResponse) => compById(mt.team?.competitionId)?.status === "Closed",
      [compById],
  );
  const currentTeams = myTeams.filter((mt) => !isClosed(mt));
  const pastTeams = myTeams.filter((mt) => isClosed(mt));

  // Mặc định chọn team Current đầu tiên; nếu team đang chọn biến mất thì chọn lại.
  React.useEffect(() => {
    if (currentTeams.length === 0) { setSelectedTeamId(null); return; }
    if (selectedTeamId == null || !currentTeams.some((mt) => mt.team?.id === selectedTeamId)) {
      setSelectedTeamId(currentTeams[0].team!.id);
    }
  }, [currentTeams, selectedTeamId]);

  const selected = currentTeams.find((mt) => mt.team?.id === selectedTeamId) ?? null;
  const selectedComp = selected?.team ? compById(selected.team.competitionId) : undefined;

  // Số cuộc thi đang tham gia = số competitionId KHÁC NHAU trong các team của user.
  const joinedCompCount = new Set(
      myTeams.map((mt) => String(mt.team?.competitionId)),
  ).size;

  const compLabel = (c?: CompetitionFull) => {
    if (!c) return "";
    const cSeason = seasons.find((s) => s.id === c.seasonId);
    const cYear = years.find((y) => y.id === c.yearId);
    return cSeason && cYear ? `${cSeason.label} ${cYear.label}` : "";
  };

  return (
      <div>
        <PageHeader
            title="My teams"
            subtitle={`Participant · ${user?.email ?? ""}`}
            action={
              <Badge variant="outline" className="text-[11px]">
                {joinedCompCount} competition{joinedCompCount === 1 ? "" : "s"}
              </Badge>
            }
        />

        {/* CHUYỂN TAB: Current | Past participation */}
        <div className="inline-flex items-center gap-1 rounded-lg border bg-card p-1 mb-5">
          {([
            { key: "current", label: "Current" },
            { key: "past", label: "Past participation" },
          ] as const).map((t) => (
              <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      tab === t.key
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {t.label}
              </button>
          ))}
        </div>

        {loading && (
            <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
              Loading your teams…
            </div>
        )}

        {/* ===================== TAB: CURRENT ===================== */}
        {!loading && tab === "current" && currentTeams.length === 0 && (
            <div className="rounded-xl border bg-card p-6">
              <div className="font-semibold">You haven't registered any team yet</div>
              <p className="text-sm text-muted-foreground mt-1">
                Register for one of the open competitions from the Dashboard to create your team.
              </p>
            </div>
        )}

        {!loading && tab === "current" && currentTeams.length > 0 && (
            <div className="grid lg:grid-cols-[300px_1fr] gap-4">
              {/* DANH SÁCH CÁC CUỘC THI ĐÃ ĐĂNG KÝ */}
              <div className="rounded-xl border bg-card overflow-hidden h-fit">
                <div className="px-4 py-3 border-b text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Competitions you joined
                </div>
                <div className="divide-y">
                  {currentTeams.map((mt) => {
                    const c = compById(mt.team!.competitionId);
                    const active = mt.team!.id === selectedTeamId;
                    return (
                        <button
                            key={mt.team!.id}
                            onClick={() => setSelectedTeamId(mt.team!.id)}
                            className={`w-full text-left px-4 py-3 ${active ? "bg-accent" : "hover:bg-accent/50"}`}
                        >
                          <div className="text-sm font-semibold truncate">{c?.name ?? `Competition #${mt.team!.competitionId}`}</div>
                          <div className="text-xs text-muted-foreground truncate mt-0.5">
                            Team: {mt.team!.name}
                          </div>
                          <div className="mt-1">
                            <Badge variant="outline" className="text-[10px]">{mt.team!.status ?? "INCOMPLETE"}</Badge>
                          </div>
                        </button>
                    );
                  })}
                </div>
              </div>

              {/* CHI TIẾT TEAM CỦA CUỘC THI ĐANG CHỌN */}
              <div className="space-y-4">
                {selected?.team && (
                    <TeamDetail
                        key={selected.team.id}
                        team={selected.team}
                        members={selected.members ?? []}
                        isLeader={Boolean(selected.isLeader ?? selected.leader)}
                        comp={selectedComp}
                        compLabel={compLabel(selectedComp)}
                        currentUserId={user?.id}
                        onChanged={load}
                    />
                )}
              </div>
            </div>
        )}

        {/* ===================== TAB: PAST PARTICIPATION ===================== */}
        {!loading && tab === "past" && (
            <PastParticipationTab
                pastTeams={pastTeams}
                compById={compById}
                compLabel={compLabel}
            />
        )}
      </div>
  );
}

/* ========================================================================
 * PAST PARTICIPATION — danh sách cuộc thi đã đóng + dialog chi tiết.
 * Dữ liệu THẬT: rank & điểm từng vòng tính từ /api/ranking; thành viên & mentor
 * lấy từ backend. Các trường backend chưa có (giải thưởng, uy tín mùa giải, NPS)
 * hiển thị "—" thay vì bịa số.
 * ===================================================================== */
function PastParticipationTab({
  pastTeams, compById, compLabel,
}: {
  pastTeams: MyTeamResponse[];
  compById: (id?: number | null) => CompetitionFull | undefined;
  compLabel: (c?: CompetitionFull) => string;
}) {
  // Danh sách mentor (để map mentorId → tên) — tải 1 lần, dùng chung cho mọi card.
  const [mentors, setMentors] = React.useState<Mentor[]>([]);
  React.useEffect(() => {
    listMentorsApi().then(setMentors).catch(() => setMentors([]));
  }, []);

  if (pastTeams.length === 0) {
    return (
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          No past competitions yet. Closed competitions you joined will appear here.
        </div>
    );
  }

  return (
      <div className="space-y-3">
        {pastTeams.map((mt) => (
            <PastParticipationCard
                key={mt.team!.id}
                mt={mt}
                comp={compById(mt.team!.competitionId)}
                compLabel={compLabel(compById(mt.team!.competitionId))}
                mentors={mentors}
            />
        ))}
      </div>
  );
}

function PastParticipationCard({
  mt, comp, compLabel, mentors,
}: {
  mt: MyTeamResponse;
  comp?: CompetitionFull;
  compLabel: string;
  mentors: Mentor[];
}) {
  const team = mt.team!;
  const members = mt.members ?? [];
  const [open, setOpen] = React.useState(false);
  const [data, setData] = React.useState<PastComputed>({
    loading: true, finalRank: null, outcome: null, roundScores: [], mentorName: "—",
  });

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rounds = await getRoundsApi(Number(team.competitionId)); // đã sort theo sequence
        const rankings = await Promise.all(
            rounds.map((r) => getRankingApi(r.id).catch(() => [])),
        );

        // Điểm của team theo từng vòng.
        const roundScores = rounds.map((r, i) => {
          const row = rankings[i].find((x) => Number(x.teamId) === Number(team.id));
          return { round: r.name, score: row ? formatScore(row.finalScore) : "—" };
        });

        // Rank & kết quả: dựa trên vòng cuối; nếu không có mặt ở vòng cuối → Eliminated.
        let finalRank: number | null = null;
        let outcome: PastOutcome | null = null;
        if (rankings.length > 0) {
          const lastRanking = rankings[rankings.length - 1];
          const idxFinal = lastRanking.findIndex((x) => Number(x.teamId) === Number(team.id));
          if (idxFinal >= 0) {
            finalRank = idxFinal + 1;
            outcome = idxFinal === 0 ? "Champion" : "Finalist";
          } else {
            // Tìm vòng gần nhất mà team có mặt để vẫn hiện được rank.
            for (let i = rankings.length - 2; i >= 0; i--) {
              const idx = rankings[i].findIndex((x) => Number(x.teamId) === Number(team.id));
              if (idx >= 0) { finalRank = idx + 1; break; }
            }
            outcome = "Eliminated";
          }
        }

        // Mentor thật: phòng chat của team → mentorId → tên mentor.
        let mentorName = "—";
        const room = await getRoomByTeamApi(Number(team.id));
        if (room) {
          mentorName = mentors.find((m) => Number(m.id) === Number(room.mentorId))?.fullName ?? "—";
        }

        if (alive) setData({ loading: false, finalRank, outcome, roundScores, mentorName });
      } catch {
        if (alive) setData((d) => ({ ...d, loading: false }));
      }
    })();
    return () => { alive = false; };
  }, [team.id, team.competitionId, mentors]);

  const rankText = data.finalRank ? `Rank #${data.finalRank}` : (data.loading ? "…" : "Unranked");

  return (
      <>
        <button
            onClick={() => setOpen(true)}
            className="w-full text-left rounded-xl border bg-card p-4 flex items-center gap-4 hover:bg-accent/40 transition-colors"
        >
          <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0 bg-muted">
            <Trophy className={`h-5 w-5 ${data.outcome === "Champion" ? "text-yellow-500" : "text-muted-foreground"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{comp?.name ?? `Competition #${team.competitionId}`}</div>
            <div className="text-xs text-muted-foreground truncate mt-0.5">
              {team.name} · {rankText}{compLabel ? ` · ${compLabel}` : ""}
            </div>
          </div>
          {data.outcome && (
              <Badge className={`shrink-0 ${outcomeBadgeClass(data.outcome)}`}>{data.outcome}</Badge>
          )}
        </button>

        <PastDetailDialog
            open={open}
            onClose={() => setOpen(false)}
            comp={comp}
            compLabel={compLabel}
            team={team}
            members={members}
            data={data}
        />
      </>
  );
}

function PastDetailDialog({
  open, onClose, comp, compLabel, team, members, data,
}: {
  open: boolean;
  onClose: () => void;
  comp?: CompetitionFull;
  compLabel: string;
  team: Team;
  members: TeamMember[];
  data: PastComputed;
}) {
  return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl inline-flex items-center gap-2">
              <Trophy className={`h-5 w-5 ${data.outcome === "Champion" ? "text-yellow-500" : "text-muted-foreground"}`} />
              {comp?.name ?? `Competition #${team.competitionId}`}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              {team.name}
              {data.finalRank ? ` · Rank #${data.finalRank}` : ""}
              {data.outcome && (
                  <Badge className={outcomeBadgeClass(data.outcome)}>{data.outcome}</Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-1">
            {/* GIẢI THƯỞNG ĐẠT ĐƯỢC — backend chưa có dữ liệu giải thưởng → "—" */}
            <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/5 p-4 flex items-center gap-4">
              <div className="h-11 w-11 rounded-lg grid place-items-center bg-yellow-500/15 text-yellow-500 shrink-0">
                <Award className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Giải thưởng đạt được</div>
                <div className="text-lg font-semibold">—</div>
                <div className="text-sm text-yellow-500">—</div>
              </div>
            </div>

            {/* MEMBERS + MENTOR */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-lg border bg-card p-4">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Members</div>
                {members.length === 0 ? (
                    <div className="text-sm text-muted-foreground">—</div>
                ) : (
                    <ul className="space-y-1">
                      {members.map((m) => (
                          <li key={m.id} className="text-sm truncate">
                            {m.email ?? `User ID: ${m.userId}`}{m.isLeader ? " · Leader" : ""}
                          </li>
                      ))}
                    </ul>
                )}
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Mentor</div>
                <div className="text-sm">{data.mentorName}</div>
              </div>
            </div>

            {/* ĐIỂM TỪNG VÒNG — thật từ /api/ranking */}
            <div className="rounded-lg border bg-card p-4">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">Điểm từng vòng</div>
              {data.loading ? (
                  <div className="text-sm text-muted-foreground">Loading…</div>
              ) : data.roundScores.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No rounds scored yet.</div>
              ) : (
                  <div className="divide-y">
                    {data.roundScores.map((r, i) => (
                        <div key={i} className="flex items-center justify-between py-2 text-sm">
                          <span>{r.round}</span>
                          <span className="font-medium tabular-nums">{r.score}</span>
                        </div>
                    ))}
                  </div>
              )}
            </div>

            {/* ĐỘ UY TÍN MÙA GIẢI + NPS — backend chưa có → "—" giữ layout */}
            <div className="rounded-lg border bg-card p-4">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3 inline-flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5" /> Độ uy tín mùa giải
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {["Tổ chức", "Mentorship", "Chấm điểm", "Giải thưởng"].map((label) => (
                    <div key={label} className="rounded-md border p-3">
                      <div className="text-[11px] text-muted-foreground">{label}</div>
                      <div className="text-base font-semibold">—</div>
                    </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground mt-3">NPS — · — đánh giá</div>
            </div>

            {compLabel && (
                <div className="text-xs text-muted-foreground">{compLabel}</div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}

function TeamDetail({
  team, members, isLeader, comp, compLabel, currentUserId, onChanged,
}: {
  team: Team;
  members: TeamMember[];
  isLeader: boolean;
  comp?: CompetitionFull;
  compLabel: string;
  currentUserId?: string;
  onChanged: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(team.name);
  const [savingName, setSavingName] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [active, setActive] = React.useState<Round | null>(null);

  // Rounds + bài đã nộp — lấy TỪ BACKEND THẬT theo cuộc thi/team.
  const [rounds, setRounds] = React.useState<Round[]>([]);
  const [roundsLoading, setRoundsLoading] = React.useState(true);
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);

  const reloadSubmissions = React.useCallback(() => {
    getTeamSubmissionsApi(team.id).then(setSubmissions).catch(() => setSubmissions([]));
  }, [team.id]);

  React.useEffect(() => {
    let alive = true;
    setRoundsLoading(true);
    getRoundsApi(Number(team.competitionId))
        .then((rs) => { if (alive) setRounds(rs); })
        .catch(() => { if (alive) setRounds([]); })
        .finally(() => { if (alive) setRoundsLoading(false); });
    reloadSubmissions();
    return () => { alive = false; };
  }, [team.competitionId, reloadSubmissions]);

  const submissionByRound = React.useCallback(
      (roundId: number) => submissions.find((s) => Number(s.roundId) === Number(roundId)),
      [submissions],
  );

  React.useEffect(() => { setName(team.name); setEditing(false); }, [team.id, team.name]);

  // Đổi tên chỉ được phép TRƯỚC khi cuộc thi bắt đầu.
  const started = comp?.startDate ? new Date() >= new Date(comp.startDate) : false;
  const canRename = isLeader && !started;

  const saveName = async () => {
    const next = name.trim();
    if (!next) { toast.error("Team name is required"); return; }
    if (next === team.name) { setEditing(false); return; }
    try {
      setSavingName(true);
      await updateTeamNameApi(team.id, next);
      toast.success("Team name updated");
      setEditing(false);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to rename team");
    } finally {
      setSavingName(false);
    }
  };

  const [addingMember, setAddingMember] = React.useState(false);
  const addMember = async () => {
    if (!isLeader) { toast.error("Only the team leader can add members"); return; }
    const email = inviteEmail.trim().toLowerCase();
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) { toast.error("Email must be a valid Gmail address"); return; }
    try {
      setAddingMember(true);
      // Thêm thẳng vào team — không cần người được mời accept.
      await addTeamMemberByEmailApi(team.id, email);
      toast.success(`${email} added to "${team.name}"`);
      setInviteEmail("");
      onChanged(); // tải lại để member mới hiện ngay
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add member");
    } finally {
      setAddingMember(false);
    }
  };

  return (
      <>
        <div className="rounded-xl border bg-card p-5">
          {/* Header: tên team + nút sửa */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg btn-gradient grid place-items-center text-primary-foreground shrink-0">
              <Users className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              {editing ? (
                  <div className="flex items-center gap-2">
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8" autoFocus />
                    <button onClick={saveName} disabled={savingName} className="text-success p-1" title="Save"><Check className="h-4 w-4" /></button>
                    <button onClick={() => { setName(team.name); setEditing(false); }} className="text-muted-foreground p-1" title="Cancel"><X className="h-4 w-4" /></button>
                  </div>
              ) : (
                  <div className="flex items-center gap-2">
                    <div className="font-semibold truncate">{team.name}</div>
                    {canRename && (
                        <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground" title="Rename team">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                    )}
                    {isLeader && started && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground" title="Competition started — name locked">
                          <Lock className="h-3 w-3" /> name locked
                        </span>
                    )}
                  </div>
              )}
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                Status: <Badge variant="outline">{team.status ?? "INCOMPLETE"}</Badge>
              </div>
            </div>

            <Badge variant="outline" className="ml-auto shrink-0">{members.length} members</Badge>
          </div>

          {/* Thông tin cuộc thi */}
          {comp && (
              <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mb-4">
                <span className="inline-flex items-center gap-1"><Trophy className="h-3 w-3" /> {comp.name}</span>
                {compLabel && <span>{compLabel}</span>}
                <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {comp.startDate ? comp.startDate.replace("T", " ") : "—"}</span>
                {comp.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {comp.location}</span>}
                <Badge className={statusBadgeClass(comp.status)}>{comp.status}</Badge>
              </div>
          )}

          {/* Thành viên */}
          <div className="space-y-1">
            {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm rounded-md px-3 py-2 bg-muted/40">
                  <span className="truncate">{m.email ?? `User ID: ${m.userId}`}</span>
                  {m.isLeader && (
                      <Badge>{Number(m.userId) === Number(currentUserId ?? -1) ? "Leader (you)" : "Leader"}</Badge>
                  )}
                </div>
            ))}
          </div>

          {/* Mời thành viên cho ĐÚNG team này */}
          {isLeader ? (
              <div className="mt-4">
                <Label>Add member to this team ({team.name})</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !addingMember && void addMember()}
                      placeholder="alice@gmail.com"
                  />
                  <button
                      onClick={() => void addMember()}
                      disabled={addingMember}
                      className="rounded-md btn-gradient text-primary-foreground px-3 inline-flex items-center gap-1 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" /> {addingMember ? "Adding…" : "Add"}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  They join immediately — no invite to accept. If the email has no account yet, a pending account is created for them.
                </p>
              </div>
          ) : (
              <p className="text-xs text-muted-foreground mt-4">Only the team leader can add members.</p>
          )}
        </div>

        {/* Rounds / nộp bài — dữ liệu thật từ backend */}
        <div className="rounded-xl border bg-card p-5">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Rounds</div>
          {roundsLoading ? (
              <div className="text-sm text-muted-foreground">Loading rounds…</div>
          ) : rounds.length === 0 ? (
              <div className="text-sm text-muted-foreground">No rounds configured yet.</div>
          ) : (
              <div className="space-y-2">
                {rounds.map((r) => {
                  const sub = submissionByRound(r.id);
                  const due = r.deadline ?? r.startAt;
                  return (
                      <div key={r.id} className="rounded-md border p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-sm">{r.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {due ? `Due ${due.replace("T", " ").slice(0, 16)}` : "No deadline set"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {sub?.status && (
                              <Badge variant="outline" className="text-[10px]">{sub.status}</Badge>
                          )}
                          <Button
                              size="sm"
                              className="btn-gradient text-primary-foreground"
                              disabled={!isLeader || Boolean(r.isLocked)}
                              onClick={() => setActive(r)}
                          >
                            {r.isLocked ? <><Lock className="h-3.5 w-3.5" /> Locked</> : <><Upload className="h-3.5 w-3.5" /> {sub ? "Edit" : "Submit"}</>}
                          </Button>
                        </div>
                      </div>
                  );
                })}
              </div>
          )}
          {!isLeader && rounds.length > 0 && (
              <p className="text-xs text-muted-foreground mt-3">Only the team leader can submit work.</p>
          )}
        </div>

        {comp && (
            <SubmissionDialog
                open={!!active}
                onClose={() => setActive(null)}
                comp={comp}
                round={active}
                team={team}
                existing={active ? submissionByRound(active.id) : undefined}
                onSubmitted={reloadSubmissions}
            />
        )}
      </>
  );
}

function SubmissionDialog({
  open, onClose, comp, round, team, existing, onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  comp: CompetitionFull;
  round: Round | null;
  team: Team;
  existing?: Submission;
  onSubmitted: () => void;
}) {
  const [github, setGithub] = React.useState("");
  const [pdf, setPdf] = React.useState("");
  const [video, setVideo] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  // Mỗi lần mở dialog cho 1 round → nạp bài đã nộp (nếu có) để chỉnh sửa.
  React.useEffect(() => {
    if (!open) return;
    setGithub(existing?.githubUrl ?? "");
    setPdf(existing?.pdfUrl ?? "");
    setVideo(existing?.videoUrl ?? "");
    setNotes(existing?.notes ?? "");
  }, [open, existing]);

  if (!comp || !round) return null;

  const due = round.deadline ?? round.startAt;

  const submit = async () => {
    if (!github.trim() || !pdf.trim() || !video.trim()) {
      toast.error("GitHub, PDF and Video URLs are all required to submit.");
      return;
    }
    try {
      setSaving(true);
      await submitWorkApi({
        teamId: team.id,
        roundId: round.id,
        githubUrl: github.trim(),
        videoUrl: video.trim(),
        pdfUrl: pdf.trim(),
        notes: notes.trim() || undefined,
      });
      toast.success(`Submitted ${round.name} for ${comp.name}`);
      onSubmitted();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSaving(false);
    }
  };

  return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{team.name}</DialogTitle>
            <DialogDescription>
              {comp.name} · {round.name}{due ? ` · Due ${due.replace("T", " ").slice(0, 16)}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs inline-flex items-center gap-1.5"><Github className="h-3.5 w-3.5" /> GitHub URL *</Label>
              <Input className="mt-1" placeholder="https://github.com/team/project" value={github} onChange={(e) => setGithub(e.target.value)} />
            </div>

            <div>
              <Label className="text-xs inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Description PDF URL *</Label>
              <Input className="mt-1" placeholder="https://drive.google.com/..." value={pdf} onChange={(e) => setPdf(e.target.value)} />
            </div>

            <div>
              <Label className="text-xs inline-flex items-center gap-1.5"><Video className="h-3.5 w-3.5" /> Demo Video URL *</Label>
              <Input className="mt-1" placeholder="https://youtube.com/..." value={video} onChange={(e) => setVideo(e.target.value)} />
            </div>

            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea className="mt-1" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button className="btn-gradient text-primary-foreground" onClick={submit} disabled={saving}>
              {saving ? "Submitting…" : existing ? "Update submission" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
