"use client";
import { useRequireRole } from "@/lib/role-guard";
import * as React from "react";
import { PageHeader } from "@/components/app-shell";
import { useAuth, useAllUsers } from "@/lib/auth";
import { useCompetitionStore, type CompetitionFull, type CompetitionRound, type PastResult } from "@/lib/competition-store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Trophy, Users, Plus, ChevronRight, ChevronDown, Calendar, MapPin, Github, FileText, Video, Upload, Copy, Star, Award, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { statusBadgeClass, trackBadgeClass } from "@/lib/utils";
import { getTeams, useJudgingStore, computeRanking } from "@/lib/judging-store";
import { createTeamMemberInvite, getTeamMemberInvites } from "@/lib/competition-store";

interface SubmissionDraft {
  github: string;
  pdfName: string;
  videoUrl: string;
  notes: string;
  status: "Draft" | "Under Review" | "Submitted";
}

function loadDrafts(): Record<string, SubmissionDraft> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem("seal_team_submissions") ?? "{}"); }
  catch { return {}; }
}
function saveDrafts(d: Record<string, SubmissionDraft>) {
  localStorage.setItem("seal_team_submissions", JSON.stringify(d));
}

export default function TeamPage() {
  useRequireRole(["Participant"]); // thay cho beforeLoad: requireRole(["Participant"])
  const { user } = useAuth();
  const { competitions, pastResults, seasons, years, seasonMetrics } = useCompetitionStore();
  const teams = getTeams();
  const myTeam = teams[0];

  const openCompetitions = competitions.filter((c) => c.status === "Open" || c.status === "Active" || c.status === "Scoring");
  const currentComp = openCompetitions[0];
  const currentSeason = currentComp ? seasons.find((s) => s.id === currentComp.seasonId) : undefined;
  const currentYear = currentComp ? years.find((y) => y.id === currentComp.yearId) : undefined;
  const currentLabel = currentSeason && currentYear ? `${currentSeason.label} ${currentYear.label}` : null;
  const [expandedId, setExpandedId] = React.useState<string | null>(openCompetitions[0]?.id ?? null);
  const [active, setActive] = React.useState<{ comp: CompetitionFull; round: CompetitionRound } | null>(null);
  const [members, setMembers] = React.useState("");
  const [sentInvites, setSentInvites] = React.useState(() =>
    typeof window === "undefined" ? [] : getTeamMemberInvites().filter((i) => i.teamId === myTeam.id),
  );

  const inviteLink = (token: string) =>
    typeof window === "undefined" ? `/invite/${token}` : `${window.location.origin}/invite/${token}`;

  const addMember = async () => {
    const email = members.trim();
    if (!email.includes("@")) { toast.error("Invalid email"); return; }
    try {
      const invite = createTeamMemberInvite({
        teamId: myTeam.id,
        teamName: myTeam.name,
        track: myTeam.track,
        toEmail: email,
        fromEmail: user?.email ?? "",
      });
      const link = inviteLink(invite.token);
      try { await navigator.clipboard.writeText(link); } catch {}
      toast.success(`Invite link sent to ${email}`, { description: "Link copied to clipboard" });
      setSentInvites(getTeamMemberInvites().filter((i) => i.teamId === myTeam.id));
      setMembers("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send invite");
    }
  };

  const copyLink = async (token: string) => {
    try {
      await navigator.clipboard.writeText(inviteLink(token));
      toast.success("Link copied");
    } catch { toast.error("Copy failed"); }
  };

  return (
    <div>
      <PageHeader
        title="My team"
        subtitle={`Participant · ${user?.email}${currentLabel ? ` · Participating in: ${currentLabel}` : ""}`}
        action={<Badge variant="outline" className="text-[11px]">1 team / season</Badge>}
      />

      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current">Current</TabsTrigger>
          <TabsTrigger value="history">Past participation</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-4 space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg btn-gradient grid place-items-center text-primary-foreground"><Users className="h-5 w-5" /></div>
              <div><div className="font-semibold">{myTeam.name}</div><div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">Track: <span className={trackBadgeClass(myTeam.track)}>{myTeam.track}</span></div></div>
              <Badge variant="outline" className="ml-auto">{myTeam.members.length} members</Badge>
            </div>
            <div className="space-y-1">
              {myTeam.members.map((m) => (
                <div key={m} className="flex items-center justify-between text-sm rounded-md px-3 py-2 bg-muted/40">
                  <span>{m}</span>
                  {m === user?.email && <Badge>Leader (you)</Badge>}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Label>Invite member by email</Label>
              <div className="flex gap-2 mt-1.5">
                <Input value={members} onChange={(e) => setMembers(e.target.value)} placeholder="alice@gmail.com" />
                <button onClick={addMember} className="rounded-md btn-gradient text-primary-foreground px-3 inline-flex items-center gap-1"><Plus className="h-4 w-4" />Invite</button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">A shareable link is generated and copied to your clipboard — invitees can view their team and competitions without an account.</p>
              {sentInvites.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sent invites</div>
                  {sentInvites.map((inv) => (
                    <div key={inv.token} className="flex items-center gap-2 text-xs rounded-md px-3 py-2 bg-muted/40">
                      <span className="font-medium truncate">{inv.toEmail}</span>
                      <code className="ml-auto truncate text-muted-foreground max-w-[280px]">{inviteLink(inv.token)}</code>
                      <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => copyLink(inv.token)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Open competitions</h3>
            {openCompetitions.length === 0 && (
              <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
                No open competitions at the moment.
              </div>
            )}
            <div className="space-y-3">
              {openCompetitions.map((c) => {
                const expanded = expandedId === c.id;
                const cSeason = seasons.find((s) => s.id === c.seasonId);
                const cYear = years.find((y) => y.id === c.yearId);
                return (
                  <div key={c.id} className="rounded-xl border bg-card overflow-hidden">
                    <button
                      onClick={() => setExpandedId(expanded ? null : c.id)}
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-lg btn-gradient grid place-items-center text-primary-foreground">
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{c.name}</div>
                        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                          <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" />{cSeason?.label ?? "—"} {cYear?.label ?? ""}</span>
                          <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{c.startDate.replace("T", " ")}</span>
                          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</span>
                          {c.category && <span className={trackBadgeClass(c.category)}>{c.category}</span>}
                        </div>
                      </div>
                      <Badge className={statusBadgeClass(c.status)}>{c.status}</Badge>
                      <Badge variant="outline">{c.rounds.length} rounds</Badge>
                      {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>

                    {expanded && (
                      <div className="border-t bg-muted/10 p-4 space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Rounds</div>
                        {c.rounds.map((r) => (
                          <div key={r.id} className="rounded-md border bg-card p-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium text-sm">{r.name}</div>
                              <div className="text-xs text-muted-foreground">Due {r.start.replace("T", " ")}</div>
                            </div>
                            <Button size="sm" className="btn-gradient text-primary-foreground" onClick={() => setActive({ comp: c, round: r })}>
                              <Upload className="h-3.5 w-3.5" />Submit
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-2">
          {pastResults.map((p) => (
            <PastResultRow key={`${p.competitionId}-${p.teamId}`} p={p} />
          ))}
        </TabsContent>
      </Tabs>

      <SubmissionDialog
        open={!!active}
        onClose={() => setActive(null)}
        comp={active?.comp ?? null}
        round={active?.round ?? null}
        team={myTeam}
        leaderEmail={user?.email ?? ""}
      />
    </div>
  );
}

function SubmissionDialog({
  open, onClose, comp, round, team, leaderEmail,
}: {
  open: boolean;
  onClose: () => void;
  comp: CompetitionFull | null;
  round: CompetitionRound | null;
  team: ReturnType<typeof getTeams>[number];
  leaderEmail: string;
}) {
  const key = comp && round ? `${comp.id}::${round.id}::${team.id}` : "";
  const [draft, setDraft] = React.useState<SubmissionDraft>({ github: "", pdfName: "", videoUrl: "", notes: "", status: "Draft" });

  React.useEffect(() => {
    if (!open || !key) return;
    const all = loadDrafts();
    setDraft(all[key] ?? { github: team.github ?? "", pdfName: team.pdf ?? "", videoUrl: team.video ?? "", notes: "", status: "Draft" });
  }, [open, key, team]);

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
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-xl">{team.name}</DialogTitle>
              <DialogDescription>
                {comp.name} · <span className="text-foreground/80">{round.name}</span> · Due {round.start.replace("T", " ")}
              </DialogDescription>
            </div>
            <Badge variant={draft.status === "Under Review" ? "default" : "secondary"} className="shrink-0">
              {draft.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-5 mt-2">
          <div className="rounded-lg border p-4 bg-muted/20">
            <div className="text-sm font-semibold mb-2 inline-flex items-center gap-2"><Users className="h-4 w-4" />Team Info</div>
            <div className="text-xs space-y-1.5">
              <div><span className="text-muted-foreground">Leader:</span> <span className="font-medium">{leaderEmail}</span></div>
              <div className="flex items-center gap-2"><span className="text-muted-foreground">Track:</span> <span className={trackBadgeClass(team.track)}>{team.track}</span></div>
              <div className="text-muted-foreground mt-2">Members ({team.members.length})</div>
              <ul className="space-y-1">
                {team.members.map((m) => (
                  <li key={m} className="rounded-md px-2 py-1 bg-background/60 text-foreground/90">{m}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold">Submission</div>
            <p className="text-xs text-muted-foreground -mt-2">All three fields are required to submit.</p>

            <div>
              <Label className="text-xs inline-flex items-center gap-1.5"><Github className="h-3.5 w-3.5" />GitHub URL <span className="text-destructive">*</span></Label>
              <Input className="mt-1" placeholder="https://github.com/team/project"
                value={draft.github} onChange={(e) => persist({ ...draft, github: e.target.value })} />
            </div>

            <div>
              <Label className="text-xs inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Description PDF <span className="text-destructive">*</span></Label>
              <div className="mt-1 flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs cursor-pointer hover:bg-muted">
                  <Upload className="h-3.5 w-3.5" />Choose file
                  <input type="file" accept="application/pdf" className="hidden" onChange={onPick} />
                </label>
                <span className="text-xs text-muted-foreground truncate">{draft.pdfName || "No file selected"}</span>
              </div>
            </div>

            <div>
              <Label className="text-xs inline-flex items-center gap-1.5"><Video className="h-3.5 w-3.5" />Demo Video URL <span className="text-destructive">*</span></Label>
              <Input className="mt-1" placeholder="https://youtube.com/..."
                value={draft.videoUrl} onChange={(e) => persist({ ...draft, videoUrl: e.target.value })} />
            </div>

            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea className="mt-1" rows={2} placeholder="Anything reviewers should know..."
                value={draft.notes} onChange={(e) => persist({ ...draft, notes: e.target.value })} />
            </div>
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

function PastResultRow({ p }: { p: PastResult }) {
  const [open, setOpen] = React.useState(false);
  const { competitions, seasons, years, seasonMetrics } = useCompetitionStore();
  const { scores, criteria } = useJudgingStore();
  const allUsers = useAllUsers();
  const teams = getTeams();

  const comp = competitions.find((c) => c.id === p.competitionId);
  const team = teams.find((t) => t.id === p.teamId);
  const mentor = team?.mentorId ? allUsers.find((u) => u.id === team.mentorId) : undefined;
  const season = comp ? seasons.find((s) => s.id === comp.seasonId) : undefined;
  const year = comp ? years.find((y) => y.id === comp.yearId) : undefined;
  const metrics = seasonMetrics.find((m) => m.seasonId === p.seasonId);
  const prize = comp?.prizes[p.finalRank - 1];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left rounded-md border bg-card p-4 flex items-center justify-between hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Trophy className={`h-5 w-5 ${p.status === "Champion" ? "text-warning" : "text-muted-foreground"}`} />
          <div>
            <div className="font-medium text-sm">{p.competitionName}</div>
            <div className="text-xs text-muted-foreground">{p.teamName} · Rank #{p.finalRank}{season ? ` · ${season.label} ${year?.label ?? ""}` : ""}</div>
          </div>
        </div>
        <Badge variant={p.status === "Champion" ? "default" : "secondary"}>{p.status}</Badge>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-warning" />{p.competitionName}</DialogTitle>
            <DialogDescription>
              {p.teamName} · Rank #{p.finalRank} · <Badge variant="secondary" className="ml-1">{p.status}</Badge>
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-4">
            {prize && (
              <div className="rounded-md border bg-warning/5 border-warning/40 p-3 flex items-center gap-3">
                <Award className="h-8 w-8 text-warning shrink-0" />
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Prize won</div>
                  <div className="font-semibold">{prize.rank}</div>
                  <div className="text-sm text-warning">{prize.amount}</div>
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-md border p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Members</div>
                {team ? (
                  <ul className="text-sm space-y-1">
                    {team.members.map((m) => <li key={m} className="text-foreground/90">{m}</li>)}
                  </ul>
                ) : <div className="text-xs text-muted-foreground">—</div>}
              </div>
              <div className="rounded-md border p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Mentor</div>
                <div className="text-sm">{mentor?.name ?? "—"}</div>
                {mentor && <div className="text-xs text-muted-foreground">{mentor.email}</div>}
              </div>
            </div>

            {comp && (
              <div className="rounded-md border p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Score per round</div>
                <table className="w-full text-sm">
                  <tbody className="divide-y">
                    {comp.rounds.map((r) => {
                      const ranking = computeRanking(scores, criteria, `${comp.id}-${r.id}`);
                      const row = ranking.find((x) => x.teamId === p.teamId)
                        ?? computeRanking(scores, criteria, r.id).find((x) => x.teamId === p.teamId);
                      return (
                        <tr key={r.id}>
                          <td className="py-1.5 text-muted-foreground">{r.name}</td>
                          <td className="py-1.5 text-right font-mono">{row ? row.weighted.toFixed(2) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {metrics && (
              <div className="rounded-md border p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Star className="h-3 w-3" /> Season reputation
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <Metric label="Organization" value={`${metrics.starsOrganization.toFixed(1)}★`} />
                  <Metric label="Mentorship" value={`${metrics.starsMentorship.toFixed(1)}★`} />
                  <Metric label="Judging" value={`${metrics.starsJudging.toFixed(1)}★`} />
                  <Metric label="Prizes" value={`${metrics.starsPrizes.toFixed(1)}★`} />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  NPS <span className="font-semibold text-foreground">{metrics.npsScore}</span> · {metrics.responseCount} reviews
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
