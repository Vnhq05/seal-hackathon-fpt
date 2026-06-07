"use client";
import { useRequireRole } from "@/lib/role-guard";
import * as React from "react";
import { PageHeader } from "@/components/app-shell";
import { useJudgingStore, computeRanking } from "@/lib/judging-store";
import { useCompetitionStore } from "@/lib/competition-store";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MessageSquare } from "lucide-react";

export default function ScoreViewer() {
  useRequireRole(["Coordinator", "Admin"]); // thay cho beforeLoad
  const { competitions, seasons } = useCompetitionStore();
  const { rounds, teams, scores, criteria, judges } = useJudgingStore();

  // Seasons that actually have a competition
  const seasonOpts = seasons.filter((s) => competitions.some((c) => c.seasonId === s.id));
  const [seasonId, setSeasonId] = React.useState<string>(seasonOpts[0]?.id ?? "");
  const seasonComps = competitions.filter((c) => c.seasonId === seasonId);
  const seasonRounds = rounds.filter((r) => seasonComps.some((c) => c.id === r.competitionId));

  // Teams scoped to that season's rounds (have at least one score) — fall back to all teams.
  const teamsInSeason = React.useMemo(() => {
    const ids = new Set(scores.filter((s) => seasonRounds.some((r) => r.id === s.roundId)).map((s) => s.teamId));
    const subset = teams.filter((t) => ids.has(t.id));
    return subset.length ? subset : teams;
  }, [scores, seasonRounds, teams]);
  const [teamId, setTeamId] = React.useState<string>(teamsInSeason[0]?.id ?? "");
  React.useEffect(() => {
    if (!teamsInSeason.find((t) => t.id === teamId)) setTeamId(teamsInSeason[0]?.id ?? "");
  }, [teamsInSeason, teamId]);

  const team = teams.find((t) => t.id === teamId);

  return (
    <div>
      <PageHeader
        title="Score viewer"
        subtitle="View scores per round · warns when a team scores below average"
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={seasonId} onValueChange={setSeasonId}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Season" /></SelectTrigger>
          <SelectContent>
            {seasonOpts.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.label} · {s.yearId.replace("y", "")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={teamId} onValueChange={setTeamId}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Team" /></SelectTrigger>
          <SelectContent>
            {teamsInSeason.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name} · {t.track}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!team ? (
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          No team selected.
        </div>
      ) : (
        <div className="space-y-4">
          {seasonRounds.map((r) => {
            const ranking = computeRanking(scores, criteria, r.id);
            const teamRow = ranking.find((row) => row.teamId === team.id);
            const allAvg = ranking.length ? ranking.reduce((s, x) => s + x.weighted, 0) / ranking.length : 0;
            const low = teamRow && teamRow.weighted > 0 && teamRow.weighted < allAvg;
            const roundCrit = criteria.filter((c) => c.roundId === r.id);
            const teamScores = scores.filter((s) => s.teamId === team.id && s.roundId === r.id);
            const comments = teamScores.filter((s) => s.comment && s.comment.trim().length > 0);

            return (
              <div key={r.id} className={`rounded-xl border bg-card ${low ? "border-warning/60 ring-1 ring-warning/40 bg-warning/5" : ""}`}>
                <div className="px-5 py-4 border-b flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-xs text-muted-foreground">Round avg: <span className="font-mono">{allAvg.toFixed(2)}</span> · Team weighted: <span className="font-mono">{teamRow?.weighted.toFixed(2) ?? "—"}</span></div>
                  </div>
                  {low && (
                    <Badge className="bg-warning/15 text-warning border-warning/40 gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Below round average
                    </Badge>
                  )}
                </div>

                {teamScores.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground text-center">No scores submitted for this round.</div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="text-left px-5 py-2">Criterion</th>
                            <th className="text-left px-5 py-2">Judge</th>
                            <th className="text-right px-5 py-2">Score</th>
                            <th className="text-right px-5 py-2">Weight</th>
                            <th className="text-left px-5 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {teamScores.map((s) => {
                            const c = roundCrit.find((x) => x.id === s.criteriaId);
                            const j = judges.find((x) => x.id === s.judgeId);
                            return (
                              <tr key={s.id}>
                                <td className="px-5 py-2">{c?.criterionName ?? s.criteriaId}</td>
                                <td className="px-5 py-2 text-muted-foreground">{j?.name ?? s.judgeId}</td>
                                <td className="px-5 py-2 text-right font-mono">{s.score.toFixed(1)}</td>
                                <td className="px-5 py-2 text-right text-muted-foreground">{c ? `${(c.weight * 100).toFixed(0)}%` : "—"}</td>
                                <td className="px-5 py-2"><Badge variant="outline" className="text-[10px]">{s.status}</Badge></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {low && comments.length > 0 && (
                      <div className="p-4 border-t bg-warning/5 space-y-2">
                        <div className="text-xs font-semibold text-warning uppercase tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5" /> Judge comments (low score)
                        </div>
                        {comments.map((s) => {
                          const j = judges.find((x) => x.id === s.judgeId);
                          const c = roundCrit.find((x) => x.id === s.criteriaId);
                          return (
                            <div key={s.id} className="rounded-md border bg-card p-3 text-xs">
                              <div className="text-muted-foreground mb-1">
                                <span className="font-medium text-foreground">{j?.name ?? s.judgeId}</span> · {c?.criterionName ?? ""}
                              </div>
                              <div className="italic">"{s.comment}"</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
