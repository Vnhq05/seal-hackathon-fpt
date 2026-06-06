"use client";
import * as React from "react";
import { PageHeader } from "@/components/app-shell";
import { useJudgingStore, addAssignment, removeAssignment } from "@/lib/judging-store";
import { useCompetitionStore } from "@/lib/competition-store";
import { useAuth } from "@/lib/auth";
import { useRequireRole } from "@/lib/role-guard";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { trackBadgeClass } from "@/lib/utils";
import { Check, X, Wand2, Users } from "lucide-react";
import { toast } from "sonner";

export default function JudgeAssign() {
  useRequireRole(["Coordinator", "Admin"]); // thay cho beforeLoad
  const { judges, teams, assignments, rounds } = useJudgingStore();
  const { competitions } = useCompetitionStore();
  const { user } = useAuth();

  const activeComps = competitions.filter((c) => ["Open", "Active", "Scoring"].includes(c.status));
  const defaultComp = activeComps[0] ?? competitions[0];
  const [compId, setCompId] = React.useState(defaultComp?.id ?? "");
  const currentComp = competitions.find((c) => c.id === compId);
  const compRounds = rounds.filter((r) => !currentComp || r.competitionId === currentComp.id);
  const [roundId, setRoundId] = React.useState(compRounds[0]?.id ?? "r1");
  React.useEffect(() => {
    if (!compRounds.find((r) => r.id === roundId)) setRoundId(compRounds[0]?.id ?? "");
  }, [compRounds, roundId]);

  // Group teams by track.
  const tracks = React.useMemo(() => {
    const map = new Map<string, typeof teams>();
    teams.forEach((t) => {
      const arr = map.get(t.track) ?? [];
      arr.push(t);
      map.set(t.track, arr);
    });
    return Array.from(map.entries());
  }, [teams]);

  const toggle = (judgeId: string, judgeName: string, teamId: string) => {
    if (!currentComp) return;
    const existing = assignments.find((a) => a.judgeId === judgeId && a.teamId === teamId && a.roundId === roundId);
    if (existing) removeAssignment(existing.id, { id: user!.id, name: user!.name });
    else addAssignment({ judgeId, judgeName, competitionId: currentComp.id, seasonId: currentComp.seasonId, roundId, teamId }, { id: user!.id, name: user!.name });
  };

  const autoAssign = () => {
    if (!currentComp) return;
    let created = 0;
    // Round-robin assign each team to 2 judges (excluding the judge if they mentor this team).
    teams.forEach((t, idx) => {
      const eligible = judges.filter((j) => t.mentorId !== j.id);
      if (eligible.length === 0) return;
      for (let k = 0; k < Math.min(2, eligible.length); k++) {
        const j = eligible[(idx + k) % eligible.length];
        const exists = assignments.some((a) => a.judgeId === j.id && a.teamId === t.id && a.roundId === roundId);
        if (!exists) {
          addAssignment({ judgeId: j.id, judgeName: j.name, competitionId: currentComp.id, seasonId: currentComp.seasonId, roundId, teamId: t.id }, { id: user!.id, name: user!.name });
          created++;
        }
      }
    });
    toast.success(`Auto-assign complete · ${created} new assignment(s) created.`);
  };

  const clearAll = () => {
    assignments
      .filter((a) => a.competitionId === compId && a.roundId === roundId)
      .forEach((a) => removeAssignment(a.id, { id: user!.id, name: user!.name }));
    toast.success("Cleared assignments for this round.");
  };

  return (
    <div>
      <PageHeader title="Judge assignment" subtitle="Group teams by track · auto-assign skips conflict-of-interest (mentor = judge)." />
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <Select value={compId} onValueChange={setCompId}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>{competitions.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={roundId} onValueChange={setRoundId}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{compRounds.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
        </Select>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="outline" onClick={clearAll}>Clear round</Button>
          <Button size="sm" onClick={autoAssign} className="btn-gradient text-primary-foreground"><Wand2 className="h-4 w-4 mr-1" /> Auto-assign</Button>
        </div>
      </div>

      <div className="space-y-6">
        {tracks.map(([track, trackTeams]) => (
          <div key={track} className="rounded-xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <span className={trackBadgeClass(track)}>{track}</span>
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Users className="h-3 w-3" /> {trackTeams.length} team(s)</span>
              </div>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/20 text-xs">
                  <tr>
                    <th className="text-left px-3 py-2">Judge \ Team</th>
                    {trackTeams.map((t) => <th key={t.id} className="px-3 py-2 text-left">{t.name}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {judges.map((j) => (
                    <tr key={j.id}>
                      <td className="px-3 py-2 font-medium">{j.name}</td>
                      {trackTeams.map((t) => {
                        const on = assignments.some((a) => a.judgeId === j.id && a.teamId === t.id && a.roundId === roundId);
                        const conflict = t.mentorId === j.id;
                        return (
                          <td key={t.id} className="px-3 py-2">
                            <button
                              disabled={conflict}
                              title={conflict ? "Conflict of interest — judge mentors this team" : ""}
                              onClick={() => toggle(j.id, j.name, t.id)}
                              className={`h-7 w-7 rounded-md grid place-items-center disabled:opacity-30 disabled:cursor-not-allowed ${on ? "btn-gradient text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                            >
                              {on ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
