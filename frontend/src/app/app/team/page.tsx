"use client";

import { useRequireRole } from "@/lib/role-guard";
import * as React from "react";
import { PageHeader } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import {
  useCompetitionStore,
  type CompetitionFull,
  type CompetitionRound,
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
} from "lucide-react";
import { toast } from "sonner";
import { statusBadgeClass } from "@/lib/utils";
import {
  getMyTeamsApi,
  createTeamApi,
  createTeamInviteApi,
  updateTeamNameApi,
  type Team,
  type TeamMember,
  type MyTeamResponse,
} from "@/lib/team-api";

interface SubmissionDraft {
  github: string;
  pdfName: string;
  videoUrl: string;
  notes: string;
  status: "Draft" | "Under Review" | "Submitted";
}

function loadDrafts(): Record<string, SubmissionDraft> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("seal_team_submissions") ?? "{}");
  } catch {
    return {};
  }
}

function saveDrafts(d: Record<string, SubmissionDraft>) {
  localStorage.setItem("seal_team_submissions", JSON.stringify(d));
}

export default function TeamPage() {
  useRequireRole(["Participant"]);

  const { user } = useAuth();
  const { competitions, seasons, years } = useCompetitionStore();

  const [myTeams, setMyTeams] = React.useState<MyTeamResponse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedTeamId, setSelectedTeamId] = React.useState<number | null>(null);

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

  // Mặc định chọn team đầu tiên; nếu team đang chọn biến mất thì chọn lại.
  React.useEffect(() => {
    if (myTeams.length === 0) { setSelectedTeamId(null); return; }
    if (selectedTeamId == null || !myTeams.some((mt) => mt.team?.id === selectedTeamId)) {
      setSelectedTeamId(myTeams[0].team!.id);
    }
  }, [myTeams, selectedTeamId]);

  const compById = React.useCallback(
      (id?: number | null) => competitions.find((c) => String(c.id) === String(id)),
      [competitions],
  );

  const selected = myTeams.find((mt) => mt.team?.id === selectedTeamId) ?? null;
  const selectedComp = selected?.team ? compById(selected.team.competitionId) : undefined;

  // Cuộc thi đang Open mà user CHƯA có team → có thể đăng ký thêm.
  const registeredCompIds = new Set(myTeams.map((mt) => String(mt.team?.competitionId)));
  const openToRegister = competitions.filter(
      (c) => c.status === "Open" && !registeredCompIds.has(String(c.id)),
  );

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
                {myTeams.length} competition{myTeams.length === 1 ? "" : "s"}
              </Badge>
            }
        />

        {loading && (
            <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
              Loading your teams…
            </div>
        )}

        {!loading && myTeams.length === 0 && (
            <div className="rounded-xl border bg-card p-6">
              <div className="font-semibold">You haven't registered any team yet</div>
              <p className="text-sm text-muted-foreground mt-1">
                Register for one of the open competitions below to create your team.
              </p>
            </div>
        )}

        {!loading && myTeams.length > 0 && (
            <div className="grid lg:grid-cols-[300px_1fr] gap-4">
              {/* DANH SÁCH CÁC CUỘC THI ĐÃ ĐĂNG KÝ */}
              <div className="rounded-xl border bg-card overflow-hidden h-fit">
                <div className="px-4 py-3 border-b text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Competitions you joined
                </div>
                <div className="divide-y">
                  {myTeams.map((mt) => {
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

        {/* ĐĂNG KÝ THÊM CUỘC THI */}
        {!loading && openToRegister.length > 0 && (
            <div className="mt-8">
              <h3 className="font-semibold mb-3">Register for another competition</h3>
              <div className="space-y-3">
                {openToRegister.map((c) => (
                    <RegisterCard key={c.id} comp={c} label={compLabel(c)} onCreated={load} />
                ))}
              </div>
            </div>
        )}
      </div>
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
  const [active, setActive] = React.useState<CompetitionRound | null>(null);

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

  const addMember = async () => {
    if (!isLeader) { toast.error("Only the team leader can invite members"); return; }
    const email = inviteEmail.trim().toLowerCase();
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) { toast.error("Email must be a valid Gmail address"); return; }
    try {
      await createTeamInviteApi(team.id, email);
      toast.success(`Invite sent to ${email} for "${team.name}"`);
      setInviteEmail("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send invite");
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
                  <span>User ID: {m.userId}</span>
                  {m.isLeader && (
                      <Badge>{Number(m.userId) === Number(currentUserId ?? -1) ? "Leader (you)" : "Leader"}</Badge>
                  )}
                </div>
            ))}
          </div>

          {/* Mời thành viên cho ĐÚNG team này */}
          {isLeader ? (
              <div className="mt-4">
                <Label>Invite member to this team ({team.name})</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="alice@gmail.com" />
                  <button onClick={addMember} className="rounded-md btn-gradient text-primary-foreground px-3 inline-flex items-center gap-1">
                    <Plus className="h-4 w-4" /> Invite
                  </button>
                </div>
              </div>
          ) : (
              <p className="text-xs text-muted-foreground mt-4">Only the team leader can invite members.</p>
          )}
        </div>

        {/* Rounds / nộp bài */}
        {comp && (
            <div className="rounded-xl border bg-card p-5">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Rounds</div>
              {(comp.rounds ?? []).length === 0 && (
                  <div className="text-sm text-muted-foreground">No rounds configured yet.</div>
              )}
              <div className="space-y-2">
                {(comp.rounds ?? []).map((r) => (
                    <div key={r.id} className="rounded-md border p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-sm">{r.name}</div>
                        <div className="text-xs text-muted-foreground">Due {r.start.replace("T", " ")}</div>
                      </div>
                      <Button size="sm" className="btn-gradient text-primary-foreground" disabled={!isLeader} onClick={() => setActive(r)}>
                        <Upload className="h-3.5 w-3.5" /> Submit
                      </Button>
                    </div>
                ))}
              </div>
            </div>
        )}

        {comp && (
            <SubmissionDialog
                open={!!active}
                onClose={() => setActive(null)}
                comp={comp}
                round={active}
                team={team}
            />
        )}
      </>
  );
}

function RegisterCard({ comp, label, onCreated }: { comp: CompetitionFull; label: string; onCreated: () => void }) {
  const [teamName, setTeamName] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const create = async () => {
    const name = teamName.trim();
    if (!name) { toast.error("Team name is required"); return; }
    try {
      setCreating(true);
      await createTeamApi({ competitionId: Number(comp.id), name });
      toast.success(`Team "${name}" created for ${comp.name}`);
      setTeamName("");
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create team");
    } finally {
      setCreating(false);
    }
  };

  return (
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg btn-gradient grid place-items-center text-primary-foreground shrink-0">
            <Trophy className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{comp.name}</div>
            <div className="text-xs text-muted-foreground">{label} · {comp.startDate ? comp.startDate.slice(0, 10) : "—"}</div>
          </div>
          <Badge className={statusBadgeClass(comp.status)}>{comp.status}</Badge>
        </div>
        <div className="flex gap-2 mt-3">
          <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Your team name" />
          <Button onClick={create} disabled={creating} className="btn-gradient text-primary-foreground shrink-0">
            {creating ? "Creating…" : "Create team"}
          </Button>
        </div>
      </div>
  );
}

function SubmissionDialog({
  open, onClose, comp, round, team,
}: {
  open: boolean;
  onClose: () => void;
  comp: CompetitionFull;
  round: CompetitionRound | null;
  team: Team;
}) {
  const key = comp && round ? `${comp.id}::${round.id}::${team.id}` : "";

  const [draft, setDraft] = React.useState<SubmissionDraft>({
    github: "", pdfName: "", videoUrl: "", notes: "", status: "Draft",
  });

  React.useEffect(() => {
    if (!open || !key) return;
    const all = loadDrafts();
    setDraft(all[key] ?? { github: "", pdfName: "", videoUrl: "", notes: "", status: "Draft" });
  }, [open, key]);

  if (!comp || !round) return null;

  const persist = (next: SubmissionDraft) => {
    const all = loadDrafts();
    all[key] = next;
    saveDrafts(all);
    setDraft(next);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) persist({ ...draft, pdfName: f.name });
  };

  const saveDraft = () => {
    persist({ ...draft, status: "Draft" });
    toast.success("Draft saved");
  };

  const submit = () => {
    if (!draft.github || !draft.pdfName || !draft.videoUrl) {
      toast.error("All three fields are required to submit.");
      return;
    }
    persist({ ...draft, status: "Under Review" });
    toast.success(`Submitted ${round.name} for ${comp.name}`);
    onClose();
  };

  return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{team.name}</DialogTitle>
            <DialogDescription>
              {comp.name} · {round.name} · Due {round.start.replace("T", " ")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs inline-flex items-center gap-1.5"><Github className="h-3.5 w-3.5" /> GitHub URL *</Label>
              <Input className="mt-1" placeholder="https://github.com/team/project" value={draft.github} onChange={(e) => persist({ ...draft, github: e.target.value })} />
            </div>

            <div>
              <Label className="text-xs inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Description PDF *</Label>
              <div className="mt-1 flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs cursor-pointer hover:bg-muted">
                  <Upload className="h-3.5 w-3.5" /> Choose file
                  <input type="file" accept="application/pdf" className="hidden" onChange={onPick} />
                </label>
                <span className="text-xs text-muted-foreground truncate">{draft.pdfName || "No file selected"}</span>
              </div>
            </div>

            <div>
              <Label className="text-xs inline-flex items-center gap-1.5"><Video className="h-3.5 w-3.5" /> Demo Video URL *</Label>
              <Input className="mt-1" placeholder="https://youtube.com/..." value={draft.videoUrl} onChange={(e) => persist({ ...draft, videoUrl: e.target.value })} />
            </div>

            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea className="mt-1" rows={2} value={draft.notes} onChange={(e) => persist({ ...draft, notes: e.target.value })} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={saveDraft}>Save Draft</Button>
            <Button className="btn-gradient text-primary-foreground" onClick={submit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
