"use client";
// ĐỔI: useNavigate → useRouter (next/navigation).
// navigate({ to, search:{...} }) → router.push("/duong-dan?key=value")
import { useRouter } from "next/navigation";
import { useRequireRole } from "@/lib/role-guard";
import * as React from "react";
import { PageHeader } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { useJudgingStore, teamStatus, type ScoringStatus } from "@/lib/judging-store";
import { useCompetitionStore } from "@/lib/competition-store";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trackBadgeClass } from "@/lib/utils";
import { Circle, Clock, CheckCircle2, Lock } from "lucide-react";

const STATUS_META: Record<ScoringStatus, { icon: any; cls: string; label: string }> = {
  PENDING:        { icon: Circle,       cls: "badge-scoring-pending border-transparent",     label: "Pending" },
  IN_PROGRESS:    { icon: Clock,        cls: "badge-scoring-in-progress border-transparent", label: "In progress" },
  PENDING_REVIEW: { icon: Clock,        cls: "badge-scoring-in-progress border-transparent", label: "Pending review" },
  APPROVED:       { icon: CheckCircle2, cls: "badge-scoring-approved border-transparent",    label: "Approved" },
  LOCKED:         { icon: Lock,         cls: "badge-scoring-locked border-transparent",      label: "Locked" },
};

export default function JudgeConsole() {
  useRequireRole(["Judge", "Lecturer"]); // thay cho beforeLoad: requireRole(...)
  const { user } = useAuth();
  const router = useRouter();
  const { competitions, seasons } = useCompetitionStore();
  const { rounds, teams, assignments, scores, criteria } = useJudgingStore();

  const activeComps = competitions.filter((c) => ["Open", "Active", "Scoring"].includes(c.status));
  const defaultComp = activeComps[0] ?? competitions[0];
  const [compId, setCompId] = React.useState(defaultComp?.id ?? "");
  React.useEffect(() => {
    if (!competitions.find((c) => c.id === compId) && defaultComp) setCompId(defaultComp.id);
  }, [competitions, compId, defaultComp]);
  const currentComp = competitions.find((c) => c.id === compId);
  const seasonId = currentComp?.seasonId ?? "";

  const compRounds = rounds.filter((r) => !currentComp || r.competitionId === currentComp.id);
  const [roundId, setRoundId] = React.useState(compRounds[0]?.id ?? "r1");
  React.useEffect(() => {
    if (!compRounds.find((r) => r.id === roundId)) setRoundId(compRounds[0]?.id ?? "");
  }, [compRounds, roundId]);

  const myAssignments = assignments.filter((a) => a.judgeId === user?.id && a.competitionId === compId && a.seasonId === seasonId && a.roundId === roundId);
  // Exclude teams I mentor — conflict of interest.
  const myTeams = myAssignments
    .map((a) => teams.find((t) => t.id === a.teamId))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))
    .filter((t) => t.mentorId !== user?.id);
  const round = rounds.find((r) => r.id === roundId);
  const roundCriteria = criteria.filter((c) => c.roundId === roundId);

  return (
    <div>
      <PageHeader title="Judge console" subtitle="Score the teams assigned to you. Submissions go to coordinator review." />
      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={compId} onValueChange={setCompId}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>{competitions.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        {currentComp && (
          <div className="rounded-md border bg-muted px-3 py-2 text-xs text-muted-foreground self-center">
            Season: {seasons.find((s) => s.id === seasonId)?.label ?? "—"}
          </div>
        )}
        <Select value={roundId} onValueChange={setRoundId}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{compRounds.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}{r.locked ? " · locked" : ""}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {myTeams.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">No teams assigned to you for this round.</div>
      ) : (
        <div className="rounded-xl border bg-card divide-y">
          {myTeams.map((t) => {
            const status = teamStatus(scores, roundCriteria.length, user!.id, t.id, roundId, !!round?.locked);
            const M = STATUS_META[status];
            const myScores = scores.filter((s) => s.judgeId === user!.id && s.teamId === t.id && s.roundId === roundId);
            return (
              <div key={t.id} className="p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2"><span className={trackBadgeClass(t.track)}>{t.track}</span><span>· {t.members.length} members</span></div>
                </div>
                <Badge className={`gap-1 ${M.cls}`}><M.icon className="h-3 w-3" />{M.label}</Badge>
                <div className="text-xs text-muted-foreground tabular-nums w-16 text-right">{myScores.length}/{roundCriteria.length}</div>
                <button disabled={status === "LOCKED"} onClick={() => router.push(`/app/evaluate?team=${t.id}&round=${roundId}`)} className="rounded-md btn-gradient text-primary-foreground px-3 py-1.5 text-xs disabled:opacity-50">Score</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
