"use client";
import { useRouter } from "next/navigation"; // useNavigate → useRouter
import { useRequireRole } from "@/lib/role-guard";
import * as React from "react";
import { PageHeader } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import {
  useCompetitionStore, addYear, addSeason, useGlobalRules, createCompetition,
  type CompetitionFull, type PrizeTier, type ScoringCriterionDef, type CompetitionRound,
} from "@/lib/competition-store";
import { buildCreateCompetitionPayload, createCompetitionApi } from "@/lib/competition";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ChevronRight, ChevronLeft, Check, Trophy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const STEPS = ["Year & Season", "Basic Info", "Timeline & Rounds", "Rules & Teams", "Prizes & Guests", "Scoring", "Review & Publish"];

interface State extends Omit<CompetitionFull, "id" | "createdAt" | "createdBy"> {}

function uid() { return Math.random().toString(36).slice(2, 8); }

export default function Wizard() {
  useRequireRole(["Coordinator", "Admin"]); // thay cho beforeLoad
  const { user } = useAuth();
  const router = useRouter();
  const { years, seasons } = useCompetitionStore();
  const [step, setStep] = React.useState(0);


  const [s, setS] = React.useState<State>({
    yearId: "y2026", seasonId: "s2026-summer",
    name: "", description: "",
    category: "", location: "",
    format: "Offline", startDate: "", durationDays: 2,
    registrationOpen: "", registrationClose: "",
    rounds: [{ id: uid(), name: "Qualifiers", start: "", question: "", guidelines: "" }],
    minTeams: 8, minMembersText: "3", maxMembersText: "5",
    honoredGuests: [],
    prizes: [
      { id: uid(), rank: "1st place", amount: "", count: 1 },
      { id: uid(), rank: "2nd place", amount: "", count: 1 },
      { id: uid(), rank: "3rd place", amount: "", count: 1 },
      { id: uid(), rank: "Encouragement Prize", amount: "", count: 3 },
    ],
    rules: [],
    scoring: [
      { id: uid(), name: "Innovation", weightPct: 25 },
      { id: uid(), name: "Technical Implementation", weightPct: 30 },
      { id: uid(), name: "UI/UX", weightPct: 15 },
      { id: uid(), name: "Business Potential", weightPct: 15 },
      { id: uid(), name: "Presentation", weightPct: 15 },
    ],
    scoreScale: 10,
    status: "Draft",
  });

  const update = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));

  const validateTimeline = (): string | null => {
    if (!s.startDate) return "Start date is required.";
    if (!s.registrationOpen || !s.registrationClose) return "Registration window is required.";
    const regOpen = new Date(s.registrationOpen).getTime();
    const regClose = new Date(s.registrationClose).getTime();
    const start = new Date(s.startDate).getTime();
    const end = start + s.durationDays * 86400000;
    if (regOpen >= regClose) return "Registration open must be before registration close.";
    if (regClose > start) return "Registration must close before the competition starts.";
    for (const r of s.rounds) {
      if (!r.start) continue;
      const rs = new Date(r.start).getTime();
      if (rs < start || rs > end) return `Round "${r.name || "(unnamed)"}" must start within the competition window.`;
    }
    return null;
  };

  const [saving, setSaving] = React.useState(false);

  const publish = async (status: "Draft" | "Open") => {
    if (!user) return;
    if (status === "Open") {
      const err = validateTimeline();
      if (err) { toast.error(err); return; }
      const total = s.scoring.reduce((a, c) => a + c.weightPct, 0);
      if (total !== 100) { toast.error(`Scoring weights must total 100% (currently ${total}%). Use "Rebalance" in step 6.`); return; }
    }
    setSaving(true);
    try {
      // 1) Ghi các trường lõi (name/description/status/format/startDate) xuống
      //    BACKEND THẬT (Spring Boot + SQL Server) — POST /api/competitions.
      const payload = buildCreateCompetitionPayload({
        seasonId: 1,
        name: s.name,
        description: s.description,
        status,
        format: s.format,
        startDate: s.startDate,
      });
      const saved = await createCompetitionApi(payload);

      // 2) Backend chưa có cột cho rounds/prizes/scoring/guests... nên giữ đầy đủ
      //    dữ liệu ở local store để các trang khác vẫn chạy, gắn backendId để biết
      //    cuộc thi đã được lưu trên server.
      createCompetition({ ...s, status, createdBy: user.id, backendId: saved.id });
      toast.success(`Saved to backend (id #${saved.id}) — ${status === "Open" ? "published" : "draft"}.`);

      router.push("/app/event-control");
    } catch (e) {
      toast.error(`Backend error: ${(e as Error).message}. Make sure the backend is running at http://localhost:8080.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Create competition" subtitle="7-step wizard · BR-aware validation" />

      <div className="mb-6 flex items-center gap-2 overflow-x-auto">
        {STEPS.map((label, i) => (
          <button key={label} onClick={() => setStep(i)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              i === step ? "btn-gradient text-primary-foreground" : i < step ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
            {i + 1}. {label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-6">
        {step === 0 && <YearSeasonStep s={s} update={update} years={years} seasons={seasons} />}
        {step === 1 && <BasicStep s={s} update={update} />}
        {step === 2 && <TimelineStep s={s} update={update} />}
        {step === 3 && <RulesStep s={s} update={update} />}
        {step === 4 && <PrizesStep s={s} update={update} />}
        {step === 5 && <ScoringStep s={s} update={update} />}
        {step === 6 && <ReviewStep s={s} saving={saving} onDraft={() => publish("Draft")} onPublish={() => publish("Open")} />}
      </div>

      <div className="mt-4 flex justify-between">
        <button disabled={step === 0} onClick={() => setStep(step - 1)} className="rounded-md border px-4 py-2 text-sm inline-flex items-center gap-1 disabled:opacity-40">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        {step < STEPS.length - 1 && (
          <button onClick={() => setStep(step + 1)} className="rounded-md btn-gradient text-primary-foreground px-4 py-2 text-sm inline-flex items-center gap-1">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function YearSeasonStep({ s, update, years, seasons }: any) {
  const [newYear, setNewYear] = React.useState("");
  const [newSeason, setNewSeason] = React.useState("");
  const filtered = seasons.filter((x: any) => x.yearId === s.yearId);
  return (
    <div className="space-y-4">
      <div><Label>Year</Label>
        <div className="flex gap-2 mt-1.5">
          <Select value={s.yearId} onValueChange={(v) => update("yearId", v)}>
            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map((y: any) => <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="New year e.g. 2027" value={newYear} onChange={(e) => setNewYear(e.target.value)} className="w-40" />
          <button onClick={() => { if (newYear) { const y = addYear(newYear); update("yearId", y.id); setNewYear(""); } }} className="rounded-md border px-3"><Plus className="h-4 w-4" /></button>
        </div>
      </div>
      <div><Label>Season</Label>
        <div className="flex gap-2 mt-1.5">
          <Select value={s.seasonId} onValueChange={(v) => update("seasonId", v)}>
            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>{filtered.map((x: any) => <SelectItem key={x.id} value={x.id}>{x.label}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="New season e.g. Fall" value={newSeason} onChange={(e) => setNewSeason(e.target.value)} className="w-40" />
          <button onClick={() => { if (newSeason) { const x = addSeason(s.yearId, newSeason); update("seasonId", x.id); setNewSeason(""); } }} className="rounded-md border px-3"><Plus className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

function BasicStep({ s, update }: any) {
  return (
    <div className="space-y-4">
      <div><Label>Name</Label><Input value={s.name} onChange={(e) => update("name", e.target.value)} className="mt-1.5" /></div>
      <div><Label>Description</Label><Textarea value={s.description} onChange={(e) => update("description", e.target.value)} className="mt-1.5" rows={3} /></div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><Label>Location</Label><Input value={s.location} onChange={(e) => update("location", e.target.value)} className="mt-1.5" placeholder="FPT University Hòa Lạc" /></div>
        <div><Label>Format</Label><Input value="Offline" disabled className="mt-1.5" /></div>
      </div>
    </div>
  );
}

function TimelineStep({ s, update }: any) {
  const startMs = s.startDate ? new Date(s.startDate).getTime() : null;
  const endDate = startMs ? new Date(startMs + s.durationDays * 86400000).toISOString().slice(0, 16) : "";
  const regOpenOk = s.registrationOpen && s.registrationClose && new Date(s.registrationOpen) < new Date(s.registrationClose);
  const regBeforeStart = s.registrationClose && s.startDate && new Date(s.registrationClose) <= new Date(s.startDate);
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <div><Label>Start date</Label><Input type="datetime-local" value={s.startDate} onChange={(e) => update("startDate", e.target.value)} className="mt-1.5" /></div>
        <div><Label>Duration</Label>
          <Select value={String(s.durationDays)} onValueChange={(v) => update("durationDays", Number(v))}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="1">1 day</SelectItem><SelectItem value="2">2 days</SelectItem><SelectItem value="3">3 days</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>Registration opens</Label>
          <Input type="datetime-local" max={s.startDate || undefined} value={s.registrationOpen} onChange={(e) => update("registrationOpen", e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label>Registration closes</Label>
          <Input type="datetime-local" min={s.registrationOpen || undefined} max={s.startDate || undefined} value={s.registrationClose} onChange={(e) => update("registrationClose", e.target.value)} className="mt-1.5" />
        </div>
      </div>
      {s.registrationOpen && s.registrationClose && (!regOpenOk || !regBeforeStart) && (
        <p className="text-xs text-warning">Registration window must be before the competition start date.</p>
      )}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Rounds {startMs && <span className="text-xs text-muted-foreground ml-2">(must start between {s.startDate} and {endDate})</span>}</Label>
          <button onClick={() => update("rounds", [...s.rounds, { id: uid(), name: "", start: "", question: "", guidelines: "" } as CompetitionRound])} className="text-xs inline-flex items-center gap-1 text-primary"><Plus className="h-3 w-3" />Add round</button>
        </div>
        <div className="space-y-2">
          {s.rounds.map((r: CompetitionRound) => {
            const outOfRange = r.start && startMs && (new Date(r.start).getTime() < startMs || new Date(r.start).getTime() > startMs + s.durationDays * 86400000);
            return (
              <div key={r.id} className="rounded-md border p-3 space-y-2">
                <div className="flex gap-2 items-start">
                  <Input placeholder="Round name" value={r.name} onChange={(e) => update("rounds", s.rounds.map((x: any) => x.id === r.id ? { ...x, name: e.target.value } : x))} />
                  <Input type="datetime-local" min={s.startDate || undefined} max={endDate || undefined} value={r.start} onChange={(e) => update("rounds", s.rounds.map((x: any) => x.id === r.id ? { ...x, start: e.target.value } : x))} className="w-56" />
                  <button onClick={() => update("rounds", s.rounds.filter((x: any) => x.id !== r.id))} className="text-destructive p-2"><X className="h-4 w-4" /></button>
                </div>
                {outOfRange && <p className="text-xs text-warning">Round start is outside the competition window.</p>}
                <Textarea placeholder="Question / theme" rows={2} value={r.question} onChange={(e) => update("rounds", s.rounds.map((x: any) => x.id === r.id ? { ...x, question: e.target.value } : x))} />
                <Textarea placeholder="Guidelines" rows={2} value={r.guidelines} onChange={(e) => update("rounds", s.rounds.map((x: any) => x.id === r.id ? { ...x, guidelines: e.target.value } : x))} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


function RulesStep({ s, update }: any) {
  const { user } = useAuth();
  const meta = useGlobalRules();
  const activeRules = meta.rules.filter((r) => r.active).sort((a, b) => a.order - b.order);
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <div><Label>Minimum teams</Label><Input type="number" value={s.minTeams} onChange={(e) => update("minTeams", Number(e.target.value))} className="mt-1.5" /></div>
        <div><Label>Min members (text)</Label><Input value={s.minMembersText} onChange={(e) => update("minMembersText", e.target.value)} className="mt-1.5" /></div>
        <div><Label>Max members (text)</Label><Input value={s.maxMembersText} onChange={(e) => update("maxMembersText", e.target.value)} className="mt-1.5" /></div>
      </div>
      <div className="rounded-md border bg-muted/30 p-4">
        <div className="flex items-center justify-between mb-1">
          <Label>Competition rules</Label>
          {user?.role === "Admin" && (
            <Link href="/app/system-settings" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
              Edit rules in System Settings <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-2">System-wide standard — managed by Admin in System Settings.</p>
        <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
          {activeRules.map((r) => <li key={r.id}>{r.text}</li>)}
        </ol>
      </div>
    </div>
  );
}

function PrizesStep({ s, update }: any) {
  const [guest, setGuest] = React.useState("");
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2"><Label>Prizes</Label>
          <button onClick={() => update("prizes", [...s.prizes, { id: uid(), rank: "", amount: "", count: 1 } as PrizeTier])} className="text-xs inline-flex items-center gap-1 text-primary"><Plus className="h-3 w-3" />Add tier</button>
        </div>
        <div className="space-y-2">
          {s.prizes.map((p: PrizeTier) => (
            <div key={p.id} className="grid grid-cols-12 gap-2">
              <Input className="col-span-5" placeholder="Rank" value={p.rank} onChange={(e) => update("prizes", s.prizes.map((x: any) => x.id === p.id ? { ...x, rank: e.target.value } : x))} />
              <Input className="col-span-5" placeholder="Amount" value={p.amount} onChange={(e) => update("prizes", s.prizes.map((x: any) => x.id === p.id ? { ...x, amount: e.target.value } : x))} />
              <Input className="col-span-1" type="number" min={1} value={p.count} onChange={(e) => update("prizes", s.prizes.map((x: any) => x.id === p.id ? { ...x, count: Number(e.target.value) } : x))} />
              <button className="col-span-1 text-destructive" onClick={() => update("prizes", s.prizes.filter((x: any) => x.id !== p.id))}><X className="h-4 w-4 mx-auto" /></button>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label>Honored guests</Label>
        <div className="flex gap-2 mt-1.5">
          <Input value={guest} onChange={(e) => setGuest(e.target.value)} placeholder="Full name + title" />
          <button onClick={() => { if (guest) { update("honoredGuests", [...s.honoredGuests, guest]); setGuest(""); } }} className="rounded-md border px-3"><Plus className="h-4 w-4" /></button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {s.honoredGuests.map((g: string, i: number) => (
            <Badge key={i} variant="secondary" className="gap-1">{g}<button onClick={() => update("honoredGuests", s.honoredGuests.filter((_: any, ix: number) => ix !== i))}><X className="h-3 w-3" /></button></Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

const SCORING_TEMPLATES: Record<string, { name: string; weightPct: number }[]> = {
  "Hackathon (default)": [
    { name: "Innovation", weightPct: 25 },
    { name: "Technical Implementation", weightPct: 30 },
    { name: "UI/UX", weightPct: 15 },
    { name: "Business Potential", weightPct: 15 },
    { name: "Presentation", weightPct: 15 },
  ],
  "Pitch competition": [
    { name: "Problem & Solution", weightPct: 30 },
    { name: "Market Potential", weightPct: 30 },
    { name: "Team & Execution", weightPct: 20 },
    { name: "Presentation", weightPct: 20 },
  ],
  "Capture the Flag": [
    { name: "Challenges Solved", weightPct: 60 },
    { name: "Speed", weightPct: 20 },
    { name: "Write-up Quality", weightPct: 20 },
  ],
  "Case study": [
    { name: "Analysis Depth", weightPct: 35 },
    { name: "Recommendation Quality", weightPct: 35 },
    { name: "Presentation", weightPct: 30 },
  ],
};

function ScoringStep({ s, update }: any) {
  const total = s.scoring.reduce((sum: number, c: ScoringCriterionDef) => sum + c.weightPct, 0);
  const rebalance = () => {
    const n = s.scoring.length;
    if (n === 0) return;
    const base = Math.floor(100 / n);
    const remainder = 100 - base * n;
    update("scoring", s.scoring.map((c: ScoringCriterionDef, i: number) => ({ ...c, weightPct: base + (i < remainder ? 1 : 0) })));
  };
  const applyTemplate = (name: string) => {
    const tpl = SCORING_TEMPLATES[name];
    if (!tpl) return;
    update("scoring", tpl.map((t) => ({ id: uid(), name: t.name, weightPct: t.weightPct })));
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <Label>Scoring template</Label>
          <Select onValueChange={applyTemplate}>
            <SelectTrigger className="w-64 mt-1.5"><SelectValue placeholder="Choose a template…" /></SelectTrigger>
            <SelectContent>{Object.keys(SCORING_TEMPLATES).map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="text-xs flex items-center gap-3">
          Total: <span className={total === 100 ? "text-success" : "text-warning"}>{total}%</span>
          <button type="button" onClick={rebalance} className="rounded-md border px-2 py-1 hover:bg-accent">Rebalance to 100%</button>
        </div>
      </div>
      <div className="space-y-2">
        {s.scoring.map((c: ScoringCriterionDef) => (
          <div key={c.id} className="grid grid-cols-12 gap-2">
            <Input className="col-span-8" placeholder="Criterion name" value={c.name} onChange={(e) => update("scoring", s.scoring.map((x: any) => x.id === c.id ? { ...x, name: e.target.value } : x))} />
            <div className="col-span-3 flex items-center gap-2"><Input type="number" min={0} max={100} value={c.weightPct} onChange={(e) => update("scoring", s.scoring.map((x: any) => x.id === c.id ? { ...x, weightPct: Number(e.target.value) } : x))} /><span className="text-sm">%</span></div>
            <button className="col-span-1 text-destructive" onClick={() => update("scoring", s.scoring.filter((x: any) => x.id !== c.id))}><X className="h-4 w-4 mx-auto" /></button>
          </div>
        ))}
        <button onClick={() => update("scoring", [...s.scoring, { id: uid(), name: "", weightPct: 0 }])} className="text-xs inline-flex items-center gap-1 text-primary"><Plus className="h-3 w-3" />Add criterion</button>
      </div>
      <div><Label>Score scale</Label>
        <Select value={String(s.scoreScale)} onValueChange={(v) => update("scoreScale", Number(v))}>
          <SelectTrigger className="mt-1.5 w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="10">0–10</SelectItem><SelectItem value="100">0–100</SelectItem></SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ReviewStep({ s, saving, onDraft, onPublish }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3"><Trophy className="h-5 w-5 text-primary" /><h3 className="text-lg font-semibold">{s.name || "Untitled competition"}</h3></div>
      <p className="text-sm text-muted-foreground">{s.description}</p>
      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <Field label="Location" value={s.location || "—"} />
        <Field label="Format" value={s.format} />
        <Field label="Start" value={s.startDate || "—"} />
        <Field label="Duration" value={`${s.durationDays} day(s)`} />
        <Field label="Team size" value={`${s.minMembersText}–${s.maxMembersText}`} />
        <Field label="Min teams" value={String(s.minTeams)} />
        <Field label="Rounds" value={String(s.rounds.length)} />
        <Field label="Prizes" value={String(s.prizes.length)} />
      </div>
      <div className="flex gap-2 pt-2 border-t">
        <button disabled={saving} onClick={onDraft} className="rounded-md border px-4 py-2 text-sm disabled:opacity-50">Save as draft</button>
        <button disabled={saving} onClick={onPublish} className="rounded-md btn-gradient text-primary-foreground px-4 py-2 text-sm inline-flex items-center gap-1 disabled:opacity-50"><Check className="h-4 w-4" />{saving ? "Saving…" : "Publish (Open)"}</button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border p-2.5"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div><div className="text-sm mt-0.5">{value}</div></div>;
}
