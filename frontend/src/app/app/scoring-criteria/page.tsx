"use client";
import { useRequireRole } from "@/lib/role-guard";
import * as React from "react";
import { PageHeader } from "@/components/app-shell";
import { useJudgingStore, addCriterion, removeCriterion } from "@/lib/judging-store";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export default function Criteria() {
  useRequireRole(["Coordinator", "Admin"]); // thay cho beforeLoad
  const { criteria, rounds } = useJudgingStore();
  const { user } = useAuth();
  const [roundId, setRoundId] = React.useState("r1");
  const [name, setName] = React.useState("");
  const [weight, setWeight] = React.useState(0.2);
  const filtered = criteria.filter((c) => c.roundId === roundId);

  return (
    <div>
      <PageHeader title="Scoring criteria" subtitle="Scale 0–10 · weights sum to 1.0" />
      <Select value={roundId} onValueChange={setRoundId}>
        <SelectTrigger className="w-48 mb-4"><SelectValue /></SelectTrigger>
        <SelectContent>{rounds.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
      </Select>
      <div className="rounded-xl border bg-card divide-y">
        {filtered.map((c) => (
          <div key={c.id} className="p-3 flex items-center gap-3">
            <div className="flex-1"><div className="font-medium text-sm">{c.criterionName}</div><div className="text-xs text-muted-foreground">{c.description}</div></div>
            <div className="text-xs">Weight {(c.weight * 100).toFixed(0)}%</div>
            <button onClick={() => { removeCriterion(c.id, { id: user!.id, name: user!.name }); toast.success("Removed"); }} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Input placeholder="New criterion name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input type="number" step="0.05" min={0} max={1} value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="w-24" />
        <button onClick={() => { if (name) { addCriterion({ roundId, criterionName: name, description: "", maxScore: 10, weight, isActive: true }, { id: user!.id, name: user!.name }); setName(""); toast.success("Added"); } }} className="rounded-md btn-gradient text-primary-foreground px-4 inline-flex items-center gap-1"><Plus className="h-4 w-4" />Add</button>
      </div>
    </div>
  );
}
