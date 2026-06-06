"use client";
import * as React from "react";
import { PageHeader } from "@/components/app-shell";
import { useJudgingStore, computeRanking, logAudit } from "@/lib/judging-store";
import { useCompetitionStore, setRankingPublished } from "@/lib/competition-store";
import { useAuth } from "@/lib/auth";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Eye, EyeOff, RadioTower } from "lucide-react";
import { toast } from "sonner";
import { trackBadgeClass } from "@/lib/utils";

// Trang Ranking — mọi vai trò xem được (không cần useRequireRole).
export default function RankingPage() {
  const { user } = useAuth();
  const { competitions, seasons, tick: cTick } = useCompetitionStore();
  const { rounds, scores, criteria, tick } = useJudgingStore();
  const isAdmin = user?.role === "Admin";

  // Admin sees everything real-time. Others see only competitions that are
  // Closed OR have rankingPublished === true.
  const visibleComps = React.useMemo(() => {
    if (isAdmin) return competitions;
    return competitions.filter((c) => c.status === "Closed" || c.rankingPublished);
  }, [competitions, isAdmin, cTick]);

  const [compId, setCompId] = React.useState<string>("");
  React.useEffect(() => {
    if (!visibleComps.find((c) => c.id === compId)) {
      setCompId(visibleComps[0]?.id ?? "");
    }
  }, [visibleComps, compId]);
  const currentComp = visibleComps.find((c) => c.id === compId);

  const visibleRounds = rounds.filter((r) => !currentComp || r.competitionId === currentComp.id);
  const [roundId, setRoundId] = React.useState<string>("");
  React.useEffect(() => {
    if (!visibleRounds.find((r) => r.id === roundId)) {
      setRoundId(visibleRounds[0]?.id ?? "");
    }
  }, [visibleRounds, roundId]);

  const rows = roundId ? computeRanking(scores, criteria, roundId) : [];

  const togglePublish = () => {
    if (!currentComp || !user) return;
    const next = !currentComp.rankingPublished;
    setRankingPublished(currentComp.id, next);
    logAudit({
      userId: user.id,
      userName: user.name,
      action: next ? `Published ranking for ${currentComp.name}` : `Unpublished ranking for ${currentComp.name}`,
      entityType: "Ranking",
      entityId: currentComp.id,
      oldValue: String(!next),
      newValue: String(next),
    });
    toast.success(next ? "Ranking published to all roles." : "Ranking hidden from non-admin roles.");
  };

  const subtitle = isAdmin
    ? "Admin view — real-time across every competition. Audit-logged."
    : "Public rankings for completed/published seasons. Current season is hidden until the admin publishes it.";

  return (
    <div>
      <PageHeader title="Ranking" subtitle={subtitle} />

      {visibleComps.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          No rankings are available yet. Please wait for the organizer to publish results.
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-4 flex-wrap items-center">
            <Select value={compId} onValueChange={setCompId}>
              <SelectTrigger className="w-72"><SelectValue placeholder="Competition" /></SelectTrigger>
              <SelectContent>
                {visibleComps.map((c) => {
                  const season = seasons.find((s) => s.id === c.seasonId);
                  return (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {season ? `· ${season.label}` : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Select value={roundId} onValueChange={setRoundId}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Round" /></SelectTrigger>
              <SelectContent>{visibleRounds.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
            </Select>

            {currentComp && (
              <div className="flex items-center gap-2 ml-auto">
                {currentComp.status === "Closed" ? (
                  <Badge variant="secondary">Season ended</Badge>
                ) : currentComp.rankingPublished ? (
                  <Badge className="bg-success text-success-foreground">Published</Badge>
                ) : (
                  <Badge variant="outline" className="gap-1"><RadioTower className="h-3 w-3" /> Live (admin only)</Badge>
                )}
                {isAdmin && currentComp.status !== "Closed" && (
                  <Button size="sm" variant={currentComp.rankingPublished ? "outline" : "default"} onClick={togglePublish}>
                    {currentComp.rankingPublished ? <><EyeOff className="h-4 w-4 mr-1" /> Unpublish</> : <><Eye className="h-4 w-4 mr-1" /> Publish ranking</>}
                  </Button>
                )}
              </div>
            )}
          </div>

          {currentComp && rows.length > 0 && (
            <div className="mb-4 rounded-xl border bg-card overflow-hidden">
              <div className="p-4 border-b flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Awards summary</h3>
                <span className="text-xs text-muted-foreground">Prizes mapped to top-ranked teams for {currentComp.name}.</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-5 py-2">Prize</th>
                    <th className="text-left px-5 py-2">Value</th>
                    <th className="text-left px-5 py-2">Awarded to</th>
                    <th className="text-right px-5 py-2">Weighted score</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(() => {
                    let cursor = 0;
                    return currentComp.prizes.flatMap((p) =>
                      Array.from({ length: p.count }).map((_, i) => {
                        const row = rows[cursor];
                        cursor++;
                        return (
                          <tr key={`${p.id}-${i}`}>
                            <td className="px-5 py-2 font-medium">{p.rank}{p.count > 1 ? ` #${i + 1}` : ""}</td>
                            <td className="px-5 py-2 text-muted-foreground">{p.amount || "—"}</td>
                            <td className="px-5 py-2">{row ? row.teamName : <span className="text-muted-foreground italic">— no eligible team —</span>}</td>
                            <td className="px-5 py-2 text-right font-mono">{row ? row.weighted.toFixed(2) : "—"}</td>
                          </tr>
                        );
                      }),
                    );
                  })()}
                </tbody>
              </table>
            </div>
          )}

          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="text-left px-5 py-3">Rank</th><th className="text-left px-5 py-3">Team</th><th className="text-left px-5 py-3">Track</th><th className="text-right px-5 py-3">Weighted</th><th className="text-right px-5 py-3">Average</th><th className="text-right px-5 py-3">Judges</th></tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r, i) => (
                  <tr key={r.teamId} className="hover:bg-accent/30">
                    <td className="px-5 py-3"><div className={`h-7 w-7 rounded-md grid place-items-center text-xs font-semibold ${i < 3 ? "btn-gradient text-primary-foreground" : "bg-muted"}`}>{i === 0 ? <Trophy className="h-3.5 w-3.5" /> : i + 1}</div></td>
                    <td className="px-5 py-3 font-medium">{r.teamName}</td>
                    <td className="px-5 py-3"><span className={trackBadgeClass(r.track)}>{r.track}</span></td>
                    <td className="px-5 py-3 text-right font-mono">{r.weighted.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right font-mono text-muted-foreground">{r.average.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">{r.judgesCount}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">No approved scores for this round.</td></tr>}
              </tbody>
            </table>
            {isAdmin && currentComp && currentComp.status !== "Closed" && (
              <div className="px-5 py-2 text-xs text-muted-foreground bg-muted/20 border-t">
                Updating in real-time · tick #{tick}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
