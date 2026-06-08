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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  ChevronRight,
  ChevronDown,
  Calendar,
  MapPin,
  Github,
  FileText,
  Video,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { statusBadgeClass, trackBadgeClass } from "@/lib/utils";
import {
  getMyTeamApi,
  createTeamInviteApi,
  type Team,
  type TeamMember,
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

  const [myTeam, setMyTeam] = React.useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = React.useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = React.useState(true);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [isLeader, setIsLeader] = React.useState(false);

  const openCompetitions = competitions.filter(
      (c) => c.status === "Open" || c.status === "Active" || c.status === "Scoring"
  );

  const currentComp = openCompetitions[0];

  const currentSeason = currentComp
      ? seasons.find((s) => s.id === currentComp.seasonId)
      : undefined;

  const currentYear = currentComp
      ? years.find((y) => y.id === currentComp.yearId)
      : undefined;

  const currentLabel =
      currentSeason && currentYear
          ? `${currentSeason.label} ${currentYear.label}`
          : null;

  const [expandedId, setExpandedId] = React.useState<string | null>(
      openCompetitions[0]?.id ?? null
  );

  const [active, setActive] = React.useState<{
    comp: CompetitionFull;
    round: CompetitionRound;
  } | null>(null);

  React.useEffect(() => {
    async function loadTeam() {
      try {
        setLoadingTeam(true);

        const data = await getMyTeamApi();

        console.log("MY TEAM DATA:", data);

        setMyTeam(data.team);
        setTeamMembers(data.members ?? []);
        setIsLeader(Boolean(data.isLeader ?? data.leader));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load team");

        setMyTeam(null);
        setTeamMembers([]);
        setIsLeader(false);
      } finally {
        setLoadingTeam(false);
      }
    }

    loadTeam();
  }, []);
  const addMember = async () => {
    if (!myTeam) {
      toast.error("You are not in a team");
      return;
    }

    if (!isLeader) {
      toast.error("Only the team leader can invite members");
      return;
    }

    const email = inviteEmail.trim();

    if (!email.includes("@")) {
      toast.error("Invalid email");
      return;
    }

    try {
      await createTeamInviteApi(myTeam.id, email);
      toast.success(`Invite sent to ${email}`);
      setInviteEmail("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send invite");
    }
  };

  return (
      <div>
        <PageHeader
            title="My team"
            subtitle={`Participant · ${user?.email ?? ""}${
                currentLabel ? ` · Participating in: ${currentLabel}` : ""
            }`}
            action={
              <Badge variant="outline" className="text-[11px]">
                {myTeam ? "1 team / season" : "No team"}
              </Badge>
            }
        />

        <Tabs defaultValue="current">
          <TabsList>
            <TabsTrigger value="current">Current</TabsTrigger>
            <TabsTrigger value="history">Past participation</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-4 space-y-4">
            {loadingTeam && (
                <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
                  Loading team...
                </div>
            )}

            {!loadingTeam && !myTeam && (
                <div className="rounded-xl border bg-card p-6">
                  <div className="font-semibold">You are not in a team yet</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create or join a team to participate in this competition.
                  </p>
                </div>
            )}

            {!loadingTeam && myTeam && (
                <div className="rounded-xl border bg-card p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-lg btn-gradient grid place-items-center text-primary-foreground">
                      <Users className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="font-semibold">{myTeam.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                        Status:
                        <Badge variant="outline">{myTeam.status ?? "INCOMPLETE"}</Badge>
                      </div>
                    </div>

                    <Badge variant="outline" className="ml-auto">
                      {teamMembers.length} members
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    {teamMembers.map((m) => (
                        <div
                            key={m.id}
                            className="flex items-center justify-between text-sm rounded-md px-3 py-2 bg-muted/40"
                        >
                          <span>User ID: {m.userId}</span>

                          {m.isLeader && (
                              <Badge>
                                {Number(m.userId) === Number(user?.id ?? 1)
                                    ? "Leader (you)"
                                    : "Leader"}
                              </Badge>
                          )}
                        </div>
                    ))}
                  </div>

                  {isLeader && (
                      <div className="mt-4">
                        <Label>Invite member by email</Label>

                        <div className="flex gap-2 mt-1.5">
                          <Input
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder="alice@gmail.com"
                          />

                          <button
                              onClick={addMember}
                              className="rounded-md btn-gradient text-primary-foreground px-3 inline-flex items-center gap-1"
                          >
                            <Plus className="h-4 w-4" />
                            Invite
                          </button>
                        </div>
                      </div>
                  )}

                  {!isLeader && (
                      <p className="text-xs text-muted-foreground mt-4">
                        Only the team leader can invite members.
                      </p>
                  )}
                </div>
            )}

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
                          <span>
                            {cSeason?.label ?? "—"} {cYear?.label ?? ""}
                          </span>

                              <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                                {c.startDate?.replace("T", " ")}
                          </span>

                              {c.location && (
                                  <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                                    {c.location}
                            </span>
                              )}

                              {c.category && (
                                  <span className={trackBadgeClass(c.category)}>
                              {c.category}
                            </span>
                              )}
                            </div>
                          </div>

                          <Badge className={statusBadgeClass(c.status)}>{c.status}</Badge>
                          <Badge variant="outline">{c.rounds.length} rounds</Badge>

                          {expanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>

                        {expanded && (
                            <div className="border-t bg-muted/10 p-4 space-y-2">
                              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                Rounds
                              </div>

                              {c.rounds.map((r) => (
                                  <div
                                      key={r.id}
                                      className="rounded-md border bg-card p-3 flex items-center justify-between gap-3"
                                  >
                                    <div className="min-w-0">
                                      <div className="font-medium text-sm">{r.name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        Due {r.start.replace("T", " ")}
                                      </div>
                                    </div>

                                    <Button
                                        size="sm"
                                        className="btn-gradient text-primary-foreground"
                                        disabled={!myTeam || !isLeader}
                                        onClick={() => setActive({ comp: c, round: r })}
                                    >
                                      <Upload className="h-3.5 w-3.5" />
                                      Submit
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
            <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
              Past participation will be connected later.
            </div>
          </TabsContent>
        </Tabs>

        {myTeam && (
            <SubmissionDialog
                open={!!active}
                onClose={() => setActive(null)}
                comp={active?.comp ?? null}
                round={active?.round ?? null}
                team={myTeam}
            />
        )}
      </div>
  );
}

function SubmissionDialog({
                            open,
                            onClose,
                            comp,
                            round,
                            team,
                          }: {
  open: boolean;
  onClose: () => void;
  comp: CompetitionFull | null;
  round: CompetitionRound | null;
  team: Team;
}) {
  const key = comp && round ? `${comp.id}::${round.id}::${team.id}` : "";

  const [draft, setDraft] = React.useState<SubmissionDraft>({
    github: "",
    pdfName: "",
    videoUrl: "",
    notes: "",
    status: "Draft",
  });

  React.useEffect(() => {
    if (!open || !key) return;

    const all = loadDrafts();

    setDraft(
        all[key] ?? {
          github: "",
          pdfName: "",
          videoUrl: "",
          notes: "",
          status: "Draft",
        }
    );
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

    if (f) {
      persist({ ...draft, pdfName: f.name });
    }
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
              <Label className="text-xs inline-flex items-center gap-1.5">
                <Github className="h-3.5 w-3.5" />
                GitHub URL *
              </Label>

              <Input
                  className="mt-1"
                  placeholder="https://github.com/team/project"
                  value={draft.github}
                  onChange={(e) => persist({ ...draft, github: e.target.value })}
              />
            </div>

            <div>
              <Label className="text-xs inline-flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Description PDF *
              </Label>

              <div className="mt-1 flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs cursor-pointer hover:bg-muted">
                  <Upload className="h-3.5 w-3.5" />
                  Choose file

                  <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={onPick}
                  />
                </label>

                <span className="text-xs text-muted-foreground truncate">
                {draft.pdfName || "No file selected"}
              </span>
              </div>
            </div>

            <div>
              <Label className="text-xs inline-flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5" />
                Demo Video URL *
              </Label>

              <Input
                  className="mt-1"
                  placeholder="https://youtube.com/..."
                  value={draft.videoUrl}
                  onChange={(e) => persist({ ...draft, videoUrl: e.target.value })}
              />
            </div>

            <div>
              <Label className="text-xs">Notes</Label>

              <Textarea
                  className="mt-1"
                  rows={2}
                  value={draft.notes}
                  onChange={(e) => persist({ ...draft, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={saveDraft}>
              Save Draft
            </Button>

            <Button className="btn-gradient text-primary-foreground" onClick={submit}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}