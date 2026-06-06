"use client";
import * as React from "react";
import { PageHeader } from "@/components/app-shell";
import {
  useJudgingStore, adjustTeamScore, computeRanking, SCORE_ANOMALY_THRESHOLD,
} from "@/lib/judging-store";
import { useAuth } from "@/lib/auth";
import { useRequireRole } from "@/lib/role-guard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function AuditLog() {
  useRequireRole(["Coordinator", "Admin"]); // thay cho beforeLoad
  const { user } = useAuth();
  const { audit, rounds, teams, scores, criteria } = useJudgingStore();
  const isAdmin = user?.role === "Admin";

  const [q, setQ] = React.useState("");
  const [type, setType] = React.useState("all");

  const filtered = audit.filter((a) =>
    (type === "all" || a.entityType === type) &&
    (q === "" ||
      a.action.toLowerCase().includes(q.toLowerCase()) ||
      a.userName.toLowerCase().includes(q.toLowerCase()) ||
      (a.teamName ?? "").toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div>
      <PageHeader title="Audit log" subtitle="Immutable trail of every mutation · score adjustments require a reason" />
      <div className={`grid gap-6 ${isAdmin ? "lg:grid-cols-[360px_1fr]" : "grid-cols-1"}`}>
        {isAdmin && (
          <AdjustPanel
            rounds={rounds}
            teams={teams}
            getCurrent={(teamId, roundId) => {
              const rows = computeRanking(scores, criteria, roundId);
              const row = rows.find((r) => r.teamId === teamId);
              return row ? row.weighted : 0;
            }}
            actor={{ id: user!.id, name: user!.name }}
          />
        )}

        <div>
          <div className="flex gap-2 mb-4">
            <Input placeholder="Search action, actor, team…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>{["all","Score","Criteria","Assignment","Ranking","Round","Competition","User"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">No audit entries.</div>
            )}
            {filtered.map((a) => {
              const isAdjust = a.action.startsWith("Adjusted");
              const hasReason = !!a.reason && a.reason.trim() !== "";
              return (
                <div key={a.id} className="rounded-xl border bg-card overflow-hidden">
                  {a.flagged && (
                    <div className="bg-warning/15 text-warning px-4 py-2 text-xs flex items-center gap-2 border-b border-warning/30">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>⚠ Large score gap — flagged for review{!hasReason && " · missing reason"}</span>
                    </div>
                  )}
                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{a.action}</span>
                      {a.teamName && <Badge variant="outline" className="text-[10px]">{a.teamName}</Badge>}
                      <Badge variant="secondary" className="text-[10px]">{a.entityType}</Badge>
                      {isAdjust && (hasReason ? (
                        <Badge className="text-[10px] bg-success text-success-foreground gap-1"><CheckCircle2 className="h-3 w-3" />has reason</Badge>
                      ) : (
                        <Badge className="text-[10px] bg-destructive text-destructive-foreground gap-1"><XCircle className="h-3 w-3" />missing reason</Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.userName} · {a.entityId} · {new Date(a.timestamp).toLocaleString()}
                    </div>
                    <div className="text-xs font-mono">
                      <span className="text-destructive">{a.oldValue ?? "∅"}</span>
                      <span className="text-muted-foreground"> → </span>
                      <span className="text-success">{a.newValue ?? "∅"}</span>
                    </div>
                    {hasReason && (
                      <div className="text-xs text-muted-foreground italic">"{a.reason}"</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdjustPanel({
  rounds, teams, getCurrent, actor,
}: {
  rounds: { id: string; name: string }[];
  teams: { id: string; name: string }[];
  getCurrent: (teamId: string, roundId: string) => number;
  actor: { id: string; name: string };
}) {
  const [roundId, setRoundId] = React.useState(rounds[0]?.id ?? "");
  const [teamId, setTeamId] = React.useState(teams[0]?.id ?? "");
  const [newScore, setNewScore] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [reasonTouched, setReasonTouched] = React.useState(false);

  const current = roundId && teamId ? getCurrent(teamId, roundId) : 0;
  const newNum = Number(newScore);
  const validNew = !Number.isNaN(newNum) && newScore !== "";
  const diff = validNew ? Math.abs(newNum - current) : 0;
  const willFlag = validNew && diff > SCORE_ANOMALY_THRESHOLD;
  const reasonMissing = reasonTouched && reason.trim() === "";

  const save = () => {
    setReasonTouched(true);
    if (reason.trim() === "") return;
    const team = teams.find((t) => t.id === teamId);
    const res = adjustTeamScore({
      teamId, teamName: team?.name ?? teamId, roundId,
      oldScore: current, newScore: newNum, reason, actor,
    });
    if (!res.ok) { toast.error(res.error); return; }
    if (res.flagged) toast.warning("Saved — flagged due to a large gap.");
    else toast.success("Adjustment saved.");
    setNewScore(""); setReason(""); setReasonTouched(false);
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 h-fit sticky top-20">
      <div>
        <div className="text-sm font-semibold">Manual score adjustment</div>
        <div className="text-xs text-muted-foreground">Admin · every change is written to the audit log.</div>
      </div>

      <div>
        <Label className="text-xs">Round</Label>
        <Select value={roundId} onValueChange={setRoundId}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{rounds.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs">Team</Label>
        <Select value={teamId} onValueChange={setTeamId}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Current</Label>
          <Input value={current.toFixed(2)} readOnly className="mt-1 font-mono bg-muted" />
        </div>
        <div>
          <Label className="text-xs">New (0–100)</Label>
          <Input type="number" min={0} max={100} step={0.1} value={newScore} onChange={(e) => setNewScore(e.target.value)} className="mt-1 font-mono" />
        </div>
      </div>

      <div>
        <Label className="text-xs">
          Reason <span className="text-destructive">*</span>
        </Label>
        <Textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setReasonTouched(true)}
          aria-invalid={reasonMissing}
          className={`mt-1 ${reasonMissing ? "border-destructive" : ""}`}
          placeholder="Required — why adjust this score?"
        />
        {reasonMissing && (
          <div className="text-xs text-destructive mt-1">Please enter a reason before saving.</div>
        )}
      </div>

      {willFlag && (
        <div className="rounded-md bg-warning/15 text-warning text-xs px-3 py-2 flex items-start gap-2 border border-warning/30">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Gap of {diff.toFixed(1)} pts &gt; {SCORE_ANOMALY_THRESHOLD} — will be flagged.</span>
        </div>
      )}

      <Button onClick={save} className="w-full" disabled={!validNew || !roundId || !teamId}>
        Save adjustment
      </Button>
    </div>
  );
}
