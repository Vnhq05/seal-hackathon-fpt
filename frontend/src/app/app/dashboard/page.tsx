"use client";

import Link from "next/link";
import * as React from "react";
import { PageHeader } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { useCompetitionStore, useGlobalRules } from "@/lib/competition-store";
import { useJudgingStore } from "@/lib/judging-store";
import { listMyNotifications, type BackendNotification } from "@/lib/notifications-api";
import { createTeamApi, addTeamMemberByEmailApi, getMyTeamApi, getTeamsApi } from "@/lib/team-api";
import { listMentorsApi, getActiveRoomsApi, type MentorRoom } from "@/lib/mentor-api";
import { useEffectiveRole } from "@/lib/view-mode";
import {
  Trophy,
  Users,
  Upload,
  BarChart3,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Gavel,
  HeartHandshake,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { trackBadgeClass } from "@/lib/utils";
import type {
  CompetitionFull,
  SeasonMetrics,
  Season,
} from "@/lib/competition-store";

function Stat({
                icon: Icon,
                label,
                value,
                tint,
              }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tint?: string;
}) {
  return (
      <div className="rounded-xl border bg-card card-gradient p-5">
        <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
          <Icon className={`h-4 w-4 ${tint ?? "text-primary"}`} />
        </div>
        <div className="mt-2 text-3xl font-semibold">{value}</div>
      </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { competitions, seasons, pastResults, seasonMetrics } =
      useCompetitionStore();
  const { teams, assignments } = useJudgingStore();

  const [notifications, setNotifications] = React.useState<
      BackendNotification[]
  >([]);

  React.useEffect(() => {
    listMyNotifications()
        .then(setNotifications)
        .catch(() => setNotifications([]));
  }, []);

  // Các cuộc thi mà participant đã đăng ký team — để ẩn nút "Register" và hiện "Registered".
  const [registeredIds, setRegisteredIds] = React.useState<Set<string>>(new Set());

  const refreshMyTeam = React.useCallback(() => {
    if (user?.role !== "Participant") return;
    getMyTeamApi()
        .then((d) => {
          if (d.team) setRegisteredIds(new Set([String(d.team.competitionId)]));
        })
        .catch(() => {/* chưa có team thì bỏ qua */});
  }, [user?.role]);

  React.useEffect(() => { refreshMyTeam(); }, [refreshMyTeam]);

  const isCoord = user?.role === "Coordinator" || user?.role === "Admin";
  const effectiveRole = useEffectiveRole(user?.role);
  const showMyTeams = effectiveRole === "Judge" || effectiveRole === "Mentor";

  const activeCount = competitions.filter(
      (c) => c.status === "Open" || c.status === "Active" || c.status === "Scoring"
  ).length;

  // Ưu tiên hiển thị: Open → Active → (Scoring) → Closed → các trạng thái còn lại.
  const sortedCompetitions = React.useMemo(() => {
    const order: Record<string, number> = {
      Open: 0, Active: 1, Scoring: 2, Closed: 3, Draft: 4, Cancelled: 5,
    };
    return [...competitions].sort(
        (a, b) => (order[a.status] ?? 99) - (order[b.status] ?? 99)
    );
  }, [competitions]);

  const firstName = user?.name.split(" ")[0] ?? "";

  return (
      <div>
        <PageHeader
            title={`Welcome, ${firstName}`}
            subtitle={`Signed in as ${user?.role} · ${user?.email}`}
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat icon={Trophy} label="Active competitions" value={String(activeCount)} />
          <Stat icon={Users} label="Teams registered" value="127" tint="text-chart-2" />
          <Stat icon={Upload} label="Submissions today" value="34" tint="text-chart-3" />
          <Stat icon={BarChart3} label="Avg score" value="78.2" tint="text-chart-5" />
        </div>

        {showMyTeams && user && effectiveRole === "Mentor" && (
            <MentorTeamsWidget userId={user.id} />
        )}

        {showMyTeams && user && effectiveRole === "Judge" && (
            <MyTeamsWidget
                mode="Judge"
                userId={user.id}
                teams={teams}
                assignments={assignments}
            />
        )}

        <div className="mt-6 grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl border bg-card">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-semibold">Competitions</h3>
              <Badge variant="outline">{competitions.length}</Badge>
            </div>

            <div className="divide-y">
              {sortedCompetitions.map((c) => (
                  <CompetitionRow
                      key={c.id}
                      c={c}
                      canRegister={user?.role === "Participant"}
                      registered={registeredIds.has(String(c.id))}
                      onRegistered={refreshMyTeam}
                  />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <SeasonComparisonCard
                competitions={competitions}
                seasons={seasons}
                metrics={seasonMetrics}
            />

            <div className="rounded-xl border bg-card">
              <div className="p-5 border-b">
                <h3 className="font-semibold">Recent notifications</h3>
              </div>

              <div className="p-3 space-y-1">
                {notifications.slice(0, 3).map((n) => (
                    <div
                        key={n.id}
                        className="px-2 py-2 rounded-md hover:bg-accent/50"
                    >
                      <div className="flex items-center gap-2">
                    <span
                        className={`h-1.5 w-1.5 rounded-full ${
                            n.type === "warning"
                                ? "bg-warning"
                                : n.type === "success"
                                    ? "bg-success"
                                    : "bg-info"
                        }`}
                    />

                        <div className="text-sm font-medium">{n.title}</div>
                      </div>

                      <div className="text-[11px] text-muted-foreground mt-0.5 ml-3.5">
                        {n.body}
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {isCoord && (
            <div className="mt-6 rounded-xl border bg-card">
              <div className="p-5 border-b">
                <h3 className="font-semibold">Season comparison</h3>
                <p className="text-xs text-muted-foreground">
                  Coordinator/Admin view
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-5 py-3">Season</th>
                    <th className="text-left px-5 py-3">Competitions</th>
                    <th className="text-left px-5 py-3">Teams</th>
                    <th className="text-left px-5 py-3">Prizes</th>
                    <th className="text-left px-5 py-3">Honored guests</th>
                    <th className="text-left px-5 py-3">Satisfaction</th>
                  </tr>
                  </thead>

                  <tbody className="divide-y">
                  {seasons.map((s) => {
                    const comps = competitions.filter((c) => c.seasonId === s.id);
                    const teamsCount =
                        pastResults.filter((p) => p.seasonId === s.id).length || 12;
                    const prizes = comps.reduce(
                        (sum, c) =>
                            sum + c.prizes.reduce((a, b) => a + b.count, 0),
                        0
                    );
                    const guests = comps.reduce(
                        (a, c) => a + c.honoredGuests.length,
                        0
                    );
                    const sat = Math.min(5, (((s.id.length * 7) % 15) / 10) + 3.5);

                    return (
                        <tr key={s.id} className="hover:bg-accent/30">
                          <td className="px-5 py-3 font-medium">
                            {s.label} · {s.yearId.replace("y", "")}
                          </td>
                          <td className="px-5 py-3">{comps.length}</td>
                          <td className="px-5 py-3">{teamsCount}</td>
                          <td className="px-5 py-3">{prizes}</td>
                          <td className="px-5 py-3">{guests}</td>
                          <td className="px-5 py-3">
                            <span className="text-warning">★</span> {sat.toFixed(1)}
                          </td>
                        </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            </div>
        )}
      </div>
  );
}

function CompetitionRow({
                          c,
                          canRegister,
                          registered = false,
                          onRegistered,
                        }: {
  c: CompetitionFull;
  canRegister: boolean;
  registered?: boolean;
  onRegistered?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [regOpen, setRegOpen] = React.useState(false);

  const globalRules = useGlobalRules();

  const activeRules = React.useMemo(
      () =>
          globalRules.rules
              .filter((r) => r.active)
              .sort((a, b) => a.order - b.order),
      [globalRules]
  );

  return (
      <>
        <button
            onClick={() => setOpen(true)}
            className="w-full text-left px-5 py-4 hover:bg-accent/40 flex items-center gap-4"
        >
          <div className="h-10 w-10 rounded-lg btn-gradient grid place-items-center text-primary-foreground">
            <Trophy className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{c.name}</div>

            <div className="text-xs text-muted-foreground flex flex-wrap gap-3 mt-0.5">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {c.location || "—"}
            </span>

              <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
                {c.startDate ? c.startDate.slice(0, 10) : "—"}
            </span>

              <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
                {c.durationDays}d
            </span>
            </div>
          </div>

          {canRegister && registered && (
              <Badge className="bg-success text-success-foreground">Registered</Badge>
          )}

          <Badge variant={c.status === "Open" ? "default" : "secondary"}>
            {c.status}
          </Badge>
        </button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{c.name}</DialogTitle>
              <DialogDescription>{c.description}</DialogDescription>
            </DialogHeader>

            <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Format" value={c.format} />
                <Field label="Location" value={c.location || "—"} />
                <Field
                    label="Start"
                    value={c.startDate ? c.startDate.replace("T", " ") : "—"}
                />
                <Field label="Duration" value={`${c.durationDays} day(s)`} />
                <Field
                    label="Team size"
                    value={`${c.minMembersText}–${c.maxMembersText}`}
                />
                <Field label="Min teams" value={String(c.minTeams)} />
                <Field
                    label="Registration open"
                    value={c.registrationOpen ? c.registrationOpen.slice(0, 10) : "—"}
                />
                <Field
                    label="Registration close"
                    value={
                      c.registrationClose ? c.registrationClose.slice(0, 10) : "—"
                    }
                />
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Description
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {c.description || "—"}
                </p>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Rounds
                </div>

                <div className="space-y-2">
                  {c.rounds.length === 0 && (
                      <p className="text-sm text-muted-foreground">—</p>
                  )}

                  {c.rounds.map((r) => (
                      <div key={r.id} className="rounded-md border p-3 text-sm">
                        <div className="font-medium">
                          {r.name}{" "}
                          <span className="text-xs text-muted-foreground">
                        · {r.start.replace("T", " ")}
                      </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {r.question}
                        </div>
                      </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Prizes
                </div>

                {c.prizes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">—</p>
                ) : (
                    <div className="space-y-1.5">
                      {c.prizes.map((p) => (
                          <div
                              key={p.id}
                              className="flex items-center justify-between rounded-md border p-2.5 text-sm"
                          >
                      <span className="font-medium">
                        {p.rank}{" "}
                        <span className="text-xs text-muted-foreground">
                          × {p.count}
                        </span>
                      </span>
                            <span className="text-muted-foreground">{p.amount}</span>
                          </div>
                      ))}
                    </div>
                )}
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Honored guests
                </div>

                {c.honoredGuests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">—</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                      {c.honoredGuests.map((g, i) => (
                          <Badge key={i} variant="secondary">
                            {g}
                          </Badge>
                      ))}
                    </div>
                )}
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Rules
                </div>
                <div className="text-[11px] text-muted-foreground mb-2">
                  Global rules — applied to every competition
                </div>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  {activeRules.map((r) => (
                      <li key={r.id}>{r.text}</li>
                  ))}
                </ul>
              </div>
            </div>

            <DialogFooter>
              {canRegister && registered ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-success/15 text-success px-4 py-2 text-sm">
                    <Check className="h-4 w-4" /> Already registered for this competition
                  </span>
              ) : (
                  canRegister && c.status === "Open" && (
                      <button
                          onClick={() => {
                            setOpen(false);
                            setRegOpen(true);
                          }}
                          className="rounded-md btn-gradient text-primary-foreground px-4 py-2 text-sm"
                      >
                        Register
                      </button>
                  )
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <RegisterDialog c={c} open={regOpen} onOpenChange={setRegOpen} onRegistered={onRegistered} />
      </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
      <div className="rounded-md border p-2.5">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="text-sm mt-0.5">{value}</div>
      </div>
  );
}

function RegisterDialog({
                          c,
                          open,
                          onOpenChange,
                          onRegistered,
                        }: {
  c: CompetitionFull;
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onRegistered?: () => void;
}) {
  const { user } = useAuth();

  const [teamName, setTeamName] = React.useState("");
  const [memberEmails, setMemberEmails] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [intro, setIntro] = React.useState("");
  const [submittingTeam, setSubmittingTeam] = React.useState(false);
  const [submittingSolo, setSubmittingSolo] = React.useState(false);

  const submitTeam = async () => {
    const name = teamName.trim();

    const emails = memberEmails
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

    const min = parseInt(c.minMembersText) || 3;
    const max = parseInt(c.maxMembersText) || 5;
    const total = emails.length + 1;

    if (!name) {
      toast.error("Team name is required");
      return;
    }

    if (total < min || total > max) {
      toast.error(`Team size must be ${min}–${max} (you have ${total}).`);
      return;
    }

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

    for (const email of emails) {
      if (!gmailRegex.test(email)) {
        toast.error(`Invalid Gmail: ${email}`);
        return;
      }
    }

    const uniqueEmails = new Set(emails);

    if (uniqueEmails.size !== emails.length) {
      toast.error("Duplicate member email");
      return;
    }

    if (user?.email && emails.includes(user.email.toLowerCase())) {
      toast.error("Member emails must not include leader email");
      return;
    }

    try {
      setSubmittingTeam(true);

      const payload = {
        competitionId: Number(c.id),
        name,
      };

      console.log("DASHBOARD CREATE TEAM PAYLOAD:", payload);

      const createdTeam = await createTeamApi(payload);

      console.log("DASHBOARD CREATED TEAM:", createdTeam);

      // Add thẳng các thành viên vào team (không cần accept). Email chưa có tài khoản
      // sẽ được tạo tài khoản tạm. Người nào add lỗi thì gom lại báo, không chặn cả team.
      const failed: string[] = [];
      for (const email of emails) {
        try {
          await addTeamMemberByEmailApi(createdTeam.id, email);
        } catch (err) {
          console.error("Failed to add member", email, err);
          failed.push(email);
        }
      }

      if (failed.length) {
        toast.error(`Team "${name}" registered, but couldn't add: ${failed.join(", ")}`);
      } else {
        toast.success(`Team "${name}" registered for ${c.name}.`);
      }

      onRegistered?.(); // cập nhật trạng thái "đã đăng ký" trên dashboard
      onOpenChange(false);
      setTeamName("");
      setMemberEmails("");
    } catch (error) {
      console.error("DASHBOARD REGISTER TEAM ERROR:", error);

      toast.error(
          error instanceof Error ? error.message : "Failed to register team"
      );
    } finally {
      setSubmittingTeam(false);
    }
  };

  const submitSolo = async () => {
    if (!/^\+?\d[\d\s-]{6,}$/.test(phone)) {
      toast.error("Invalid phone number");
      return;
    }

    if (intro.length < 20) {
      toast.error("Self-intro must be ≥ 20 characters");
      return;
    }

    try {
      setSubmittingSolo(true);

      toast.success(
          "Solo registration received. We'll auto-match you into a team before the competition starts; if not possible, you may not be eligible."
      );

      onOpenChange(false);
      setPhone("");
      setIntro("");
    } finally {
      setSubmittingSolo(false);
    }
  };

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Register for {c.name}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="team">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="team">Team mode</TabsTrigger>
              <TabsTrigger value="solo">Solo mode</TabsTrigger>
            </TabsList>

            <TabsContent value="team" className="space-y-3 mt-4">
              <div>
                <Label>Team name</Label>
                <Input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="mt-1.5"
                />
              </div>

              <div>
                <Label>Leader (you)</Label>
                <Input value={user?.email ?? ""} disabled className="mt-1.5" />
              </div>

              <div>
                <Label>Member emails</Label>
                <Textarea
                    value={memberEmails}
                    onChange={(e) => setMemberEmails(e.target.value)}
                    placeholder="alice@gmail.com, bob@gmail.com"
                    className="mt-1.5"
                />

                <p className="text-[11px] text-muted-foreground mt-1">
                  Comma-separated · Required size {c.minMembersText}–
                  {c.maxMembersText} including you
                </p>
              </div>

              <button
                  onClick={submitTeam}
                  disabled={submittingTeam}
                  className="w-full rounded-md btn-gradient text-primary-foreground py-2 text-sm disabled:opacity-60"
              >
                {submittingTeam ? "Submitting..." : "Submit team registration"}
              </button>
            </TabsContent>

            <TabsContent value="solo" className="space-y-3 mt-4">
              <div>
                <Label>Email</Label>
                <Input value={user?.email ?? ""} disabled className="mt-1.5" />
              </div>

              <div>
                <Label>Phone</Label>
                <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+84 123 456 789"
                    className="mt-1.5"
                />
              </div>

              <div>
                <Label>Self-intro (≥ 20 chars)</Label>
                <Textarea
                    value={intro}
                    onChange={(e) => setIntro(e.target.value)}
                    className="mt-1.5"
                    rows={4}
                />
              </div>

              <p className="text-[11px] text-muted-foreground">
                We'll auto-match you into a team before the competition starts; if
                not possible, you may not be eligible.
              </p>

              <button
                  onClick={submitSolo}
                  disabled={submittingSolo}
                  className="w-full rounded-md btn-gradient text-primary-foreground py-2 text-sm disabled:opacity-60"
              >
                {submittingSolo ? "Submitting..." : "Submit solo application"}
              </button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
  );
}

function seasonLabel(seasonId: string, seasons: Season[]): string {
  const s = seasons.find((x) => x.id === seasonId);
  if (!s) return seasonId;

  const yr = s.yearId.replace("y", "");

  return `${s.label} ${yr}`;
}

function SeasonComparisonCard({
                                competitions,
                                seasons,
                                metrics,
                              }: {
  competitions: CompetitionFull[];
  seasons: Season[];
  metrics: SeasonMetrics[];
}) {
  const closedComps = React.useMemo(
      () =>
          competitions
              .filter((c) => c.status === "Closed")
              .sort(
                  (a, b) =>
                      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
              ),
      [competitions]
  );

  const withMetrics = React.useMemo(
      () =>
          closedComps
              .map((c) => ({
                comp: c,
                metrics: metrics.find((m) => m.seasonId === c.seasonId),
              }))
              .filter(
                  (x): x is { comp: CompetitionFull; metrics: SeasonMetrics } =>
                      Boolean(x.metrics)
              )
              .slice(0, 2),
      [closedComps, metrics]
  );

  if (withMetrics.length < 2) {
    return (
        <div className="rounded-xl border bg-card">
          <div className="p-5 border-b">
            <h3 className="font-semibold">Success Assessment</h3>
          </div>
          <div className="p-5 text-sm text-muted-foreground">
            At least 2 closed seasons with metrics are required for comparison.
          </div>
        </div>
    );
  }

  const [newer, older] = withMetrics;
  const newerLabel = seasonLabel(newer.comp.seasonId, seasons);
  const olderLabel = seasonLabel(older.comp.seasonId, seasons);
  const totalResp = newer.metrics.responseCount + older.metrics.responseCount;

  const newerAvg =
      (newer.metrics.starsOrganization +
          newer.metrics.starsMentorship +
          newer.metrics.starsJudging +
          newer.metrics.starsPrizes) /
      4;

  const olderAvg =
      (older.metrics.starsOrganization +
          older.metrics.starsMentorship +
          older.metrics.starsJudging +
          older.metrics.starsPrizes) /
      4;

  const avgDelta = newerAvg - olderAvg;

  const npsColor =
      newer.metrics.npsScore > 50
          ? "bg-success/15 text-success"
          : newer.metrics.npsScore >= 0
              ? "bg-warning/15 text-warning"
              : "bg-destructive/15 text-destructive";

  const axes = [
    { key: "starsOrganization", label: "Organization" },
    { key: "starsMentorship", label: "Mentorship" },
    { key: "starsJudging", label: "Judging" },
    { key: "starsPrizes", label: "Prizes" },
  ] as const;

  const data = axes.map((a) => ({
    label: a.label,
    [olderLabel]: older.metrics[a.key],
    [newerLabel]: newer.metrics[a.key],
  }));

  const deltas = axes.map((a) => ({
    label: a.label,
    delta: newer.metrics[a.key] - older.metrics[a.key],
  }));

  const top = deltas.reduce(
      (m, d) => (Math.abs(d.delta) > Math.abs(m.delta) ? d : m),
      deltas[0]
  );

  const insight =
      top.delta >= 0
          ? `${top.label} improved the most (+${top.delta.toFixed(1)}★)`
          : `${top.label} dropped ${Math.abs(top.delta).toFixed(1)}★ — needs attention`;

  const currentOpen = competitions.find(
      (c) => c.status === "Open" || c.status === "Active" || c.status === "Scoring"
  );

  const currentLabel = currentOpen
      ? seasonLabel(currentOpen.seasonId, seasons)
      : null;

  return (
      <div className="rounded-xl border bg-card">
        <div className="p-5 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Success Assessment</h3>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>

          <p className="text-xs text-muted-foreground mt-0.5">
            {newerLabel} vs {olderLabel} · {totalResp} responses
          </p>

          {currentLabel && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Current season ({currentLabel}) has no rating yet
              </p>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Avg Stars
              </div>
              <div className="text-xl font-semibold mt-0.5">
                {newerAvg.toFixed(1)}★
              </div>
              <div
                  className={`text-[11px] mt-0.5 ${
                      avgDelta >= 0 ? "text-success" : "text-destructive"
                  }`}
              >
                {avgDelta >= 0 ? "▲" : "▼"} {avgDelta >= 0 ? "+" : ""}
                {avgDelta.toFixed(1)}★ vs previous season
              </div>
            </div>

            <div className="rounded-md border p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                NPS
              </div>

              <div className="flex items-baseline gap-2">
                <div className="text-xl font-semibold mt-0.5">
                  {newer.metrics.npsScore}
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${npsColor}`}>
                {newer.metrics.npsScore > 50
                    ? "Good"
                    : newer.metrics.npsScore >= 0
                        ? "OK"
                        : "Low"}
              </span>
              </div>

              <div className="text-[11px] text-muted-foreground mt-0.5">
                {newer.metrics.responseCount} responses
              </div>
            </div>
          </div>

          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                  data={data}
                  layout="vertical"
                  margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  barCategoryGap={6}
              >
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={80} />
                <Tooltip
                    cursor={{ fill: "hsl(var(--accent) / 0.3)" }}
                    contentStyle={{
                      fontSize: 11,
                      borderRadius: 6,
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--background))",
                    }}
                    formatter={(v: number, name: string) => [
                      `${Number(v).toFixed(1)}★`,
                      name,
                    ]}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
                <Bar
                    dataKey={olderLabel}
                    fill="var(--chart-2)"
                    fillOpacity={0.5}
                    radius={[0, 3, 3, 0]}
                />
                <Bar
                    dataKey={newerLabel}
                    fill="var(--chart-1)"
                    radius={[0, 3, 3, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs text-muted-foreground">{insight}</p>
        </div>
      </div>
  );
}

function MyTeamsWidget({
                         mode,
                         userId,
                         teams,
                         assignments,
                       }: {
  mode: "Judge" | "Mentor";
  userId: string;
  teams: ReturnType<typeof useJudgingStore>["teams"];
  assignments: ReturnType<typeof useJudgingStore>["assignments"];
}) {
  const myTeams = React.useMemo(() => {
    if (mode === "Mentor") {
      return teams.filter((t) => t.mentorId === userId);
    }

    const ids = new Set(
        assignments.filter((a) => a.judgeId === userId).map((a) => a.teamId)
    );

    return teams.filter((t) => ids.has(t.id) && t.mentorId !== userId);
  }, [mode, userId, teams, assignments]);

  const Icon = mode === "Judge" ? Gavel : HeartHandshake;
  const linkTo = mode === "Judge" ? "/app/judge-console" : "/app/mentor-chat";
  const title = mode === "Judge" ? "Teams to score" : "Teams I mentor";

  return (
      <div className="mt-6 rounded-xl border bg-card card-gradient overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">{title}</h3>
            <Badge variant="outline">{myTeams.length}</Badge>
          </div>

          <Link href={linkTo} className="text-xs text-primary hover:underline">
            Open {mode === "Judge" ? "console" : "chat"} →
          </Link>
        </div>

        {myTeams.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No teams yet.
            </div>
        ) : (
            <div className="divide-y">
              {myTeams.map((t) => (
                  <div key={t.id} className="p-4 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span className={trackBadgeClass(t.track)}>{t.track}</span>
                        <span>· {t.members.length} members</span>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
        )}
      </div>
  );
}

// Teams I mentor — DỮ LIỆU THẬT: lấy các phòng chat (room) mentor đang dẫn dắt.
function MentorTeamsWidget({ userId }: { userId: string }) {
  const [rooms, setRooms] = React.useState<MentorRoom[]>([]);
  const [teamNames, setTeamNames] = React.useState<Record<number, string>>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const mentors = await listMentorsApi();
        const mine = mentors.find((m) => Number(m.userId) === Number(userId));
        if (!mine) { if (ok) setRooms([]); return; }
        const [rs, ts] = await Promise.all([getActiveRoomsApi(mine.id), getTeamsApi()]);
        if (!ok) return;
        const map: Record<number, string> = {};
        ts.forEach((t) => { map[t.id] = t.name; });
        setTeamNames(map);
        setRooms(rs);
      } catch {
        if (ok) setRooms([]);
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => { ok = false; };
  }, [userId]);

  return (
      <div className="mt-6 rounded-xl border bg-card card-gradient overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Teams I mentor</h3>
            <Badge variant="outline">{rooms.length}</Badge>
          </div>
          <Link href="/app/mentor-chat" className="text-xs text-primary hover:underline">
            Open chat →
          </Link>
        </div>

        {loading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>
        ) : rooms.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No teams yet.</div>
        ) : (
            <div className="divide-y">
              {rooms.map((r) => (
                  <div key={r.id} className="p-4 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{teamNames[r.teamId] ?? `Team #${r.teamId}`}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Room #{r.id}</div>
                    </div>
                  </div>
              ))}
            </div>
        )}
      </div>
  );
}