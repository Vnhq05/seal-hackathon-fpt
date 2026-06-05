"use client";
// ĐỔI: <Link to> tanstack → next/link; lấy query (?team=&round=) bằng
// useSearchParams (next) thay cho validateSearch/Route.useSearch của tanstack.
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRequireRole } from "@/lib/role-guard";
import * as React from "react";
import { PageHeader } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { useJudgingStore, upsertScore, type Team, type Round } from "@/lib/judging-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Github, Video, FileText, ExternalLink, Users, ChevronDown } from "lucide-react";
import { getYouTubeId } from "@/lib/utils";

// Trang export mặc định: bọc trong <Suspense> vì useSearchParams (Next.js)
// yêu cầu phải có ranh giới Suspense khi build.
export default function EvaluatePage() {
  return (
    <React.Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <Evaluate />
    </React.Suspense>
  );
}

function Evaluate() {
  useRequireRole(["Judge", "Lecturer"]); // thay cho beforeLoad: requireRole(...)
  const { user } = useAuth();
  // Đọc query string: /app/evaluate?team=t1&round=r2  (mặc định round = "r1")
  const searchParams = useSearchParams();
  const team = searchParams.get("team") ?? "";
  const round = searchParams.get("round") ?? "r1";
  const { teams, rounds, criteria, scores } = useJudgingStore();
  const t = teams.find((x) => x.id === team);
  const r = rounds.find((x) => x.id === round);
  const roundCrit = criteria.filter((c) => c.roundId === round);
  const myScores = scores.filter((s) => s.judgeId === user?.id && s.teamId === team && s.roundId === round);

  const [vals, setVals] = React.useState<Record<string, { score: string; comment: string }>>(() => {
    const init: Record<string, { score: string; comment: string }> = {};
    roundCrit.forEach((c) => {
      const ms = myScores.find((s) => s.criteriaId === c.id);
      init[c.id] = { score: ms ? String(ms.score) : "", comment: ms?.comment ?? "" };
    });
    return init;
  });

  if (!t || !r) return <div className="text-sm text-muted-foreground">Team or round not found.</div>;
  if (t.mentorId === user?.id) {
    return <div className="rounded-md border border-warning/40 bg-warning/10 text-warning p-4 text-sm">Bạn là mentor của đội này — không thể chấm điểm (xung đột lợi ích).</div>;
  }

  const submit = () => {
    if (r.locked) { toast.error("Round is locked"); return; }
    for (const c of roundCrit) {
      const v = vals[c.id];
      const n = Number(v?.score);
      if (Number.isNaN(n) || n < 0 || n > c.maxScore) { toast.error(`Score for "${c.criterionName}" must be 0–${c.maxScore}`); return; }
    }
    for (const c of roundCrit) {
      const v = vals[c.id];
      upsertScore({
        judgeId: user!.id, judgeName: user!.name,
        teamId: team, roundId: round, criteriaId: c.id,
        score: Number(v.score), comment: v.comment,
      });
    }
    toast.success("Scores submitted — pending coordinator review.");
  };

  return (
    <div>
      <Link href="/app/judge-console" className="text-xs text-muted-foreground inline-flex items-center gap-1 mb-3 hover:text-foreground"><ArrowLeft className="h-3 w-3" />Back to console</Link>
      <PageHeader title={`Evaluate · ${t.name}`} subtitle={`${r.name} · scale 0–10`} />

      <div className="grid lg:grid-cols-[2fr_3fr] gap-4">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SubmissionViewer team={t} round={r} />
        </div>

        <div>
          <div className="rounded-xl border bg-card divide-y">
            {roundCrit.map((c) => (
              <div key={c.id} className="p-5 grid sm:grid-cols-[1fr_140px_2fr] gap-4 items-start">
                <div>
                  <div className="font-medium">{c.criterionName}</div>
                  <div className="text-xs text-muted-foreground">{c.description}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">Weight {(c.weight * 100).toFixed(0)}%</div>
                </div>
                <div>
                  <Label className="text-xs">Score (0–{c.maxScore})</Label>
                  <Input type="number" min={0} max={c.maxScore} step={0.1} value={vals[c.id]?.score ?? ""} onChange={(e) => setVals({ ...vals, [c.id]: { ...vals[c.id], score: e.target.value } })} className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-xs">Comment</Label>
                  <Textarea rows={2} value={vals[c.id]?.comment ?? ""} onChange={(e) => setVals({ ...vals, [c.id]: { ...vals[c.id], comment: e.target.value } })} className="mt-1.5" />
                </div>
              </div>
            ))}
          </div>
          <button onClick={submit} className="mt-4 rounded-md btn-gradient text-primary-foreground px-4 py-2 text-sm">Submit for review</button>
        </div>
      </div>
    </div>
  );
}

function SubmissionViewer({ team, round }: { team: Team; round: Round }) {
  const [open, setOpen] = React.useState(false);
  const ytId = team.video ? getYouTubeId(team.video) : null;
  const pdfIsUrl = team.pdf ? /^https?:\/\//i.test(team.pdf) : false;

  return (
    <div className="rounded-xl border bg-card">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-lg font-semibold truncate">{team.name}</div>
            <div className="text-xs text-muted-foreground truncate">{team.track} · {team.members.length} members · Round {round.name}</div>
          </div>
          <Badge variant="secondary">Submission</Badge>
        </div>
      </div>

      <div className="divide-y">
        <div className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Github className="h-3 w-3" />GitHub Repository</div>
          {team.github ? (
            <div className="flex items-center justify-between gap-2">
              <a href={team.github} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate flex-1">{team.github}</a>
              <a href={team.github} target="_blank" rel="noopener noreferrer" className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded border hover:bg-accent shrink-0" aria-label="Open in new tab">
                <ExternalLink className="h-3 w-3" />Open
              </a>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Team chưa nộp GitHub repository</p>
          )}
        </div>

        <div className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Video className="h-3 w-3" />Demo Video</div>
          {team.video ? (
            ytId ? (
              <div className="aspect-video w-full rounded-md border overflow-hidden bg-muted">
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title="Demo video"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : (
              <a href={team.video} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5" />{team.video}
              </a>
            )
          ) : (
            <p className="text-xs text-muted-foreground">Team chưa nộp video demo</p>
          )}
        </div>

        <div className="p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><FileText className="h-3 w-3" />Pitch Deck (PDF)</div>
          {team.pdf ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm truncate flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-muted-foreground" />{team.pdf}</span>
              {pdfIsUrl ? (
                <a href={team.pdf} target="_blank" rel="noopener noreferrer" className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded border hover:bg-accent shrink-0">
                  <ExternalLink className="h-3 w-3" />Open
                </a>
              ) : (
                <button onClick={() => toast.message("PDF demo — chưa có file thực")} className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded border hover:bg-accent shrink-0">
                  Download
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Team chưa nộp pitch deck</p>
          )}
        </div>

        <div className="p-4">
          <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between text-xs font-medium hover:text-primary">
            <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />Team members ({team.members.length})</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <ul className="mt-2 space-y-1">
              {team.members.map((m) => (
                <li key={m} className="text-xs text-muted-foreground font-mono">{m}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground italic">
          Vui lòng xem bài nộp trước khi cho điểm. Mọi điểm sẽ chuyển trạng thái PENDING_REVIEW chờ Coordinator duyệt.
        </p>
      </div>
    </div>
  );
}
