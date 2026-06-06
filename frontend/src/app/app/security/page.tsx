"use client";
import { PageHeader } from "@/components/app-shell";
import { useJudgingStore } from "@/lib/judging-store";
import { useAllUsers } from "@/lib/auth";
import { useRequireRole } from "@/lib/role-guard";
import { ShieldCheck, Activity, Users, AlertTriangle } from "lucide-react";

export default function Security() {
  useRequireRole(["Admin"]); // thay cho beforeLoad: requireRole(["Admin"])
  const { audit } = useJudgingStore();
  const users = useAllUsers();
  const active = users.filter((u) => u.status === "active").length;
  const flaggedCount = audit.filter((a) => a.flagged).length;
  return (
    <div>
      <PageHeader title="Security & audit" subtitle="Admin overview" />
      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Active accounts", value: String(active) },
          { icon: ShieldCheck, label: "Suspended", value: String(users.filter(u => u.status === "suspended").length) },
          { icon: Activity, label: "Audit events", value: String(audit.length) },
          { icon: AlertTriangle, label: "Flagged entries", value: String(flaggedCount) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card card-gradient p-5">
            <div className="flex items-center justify-between"><span className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</span><s.icon className="h-4 w-4 text-primary" /></div>
            <div className="mt-2 text-3xl font-semibold">{s.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-xl border bg-card p-5">
        <h3 className="font-semibold mb-3">Recent audit events</h3>
        <div className="space-y-1 text-sm">
          {audit.slice(0, 8).map((a) => (
            <div key={a.id} className="flex items-center justify-between border-b last:border-0 py-2">
              <div><div className="text-sm">{a.action}</div><div className="text-xs text-muted-foreground">{a.userName} · {a.entityType}</div></div>
              <div className="text-xs text-muted-foreground">{new Date(a.timestamp).toLocaleString()}</div>
            </div>
          ))}
          {audit.length === 0 && <div className="text-muted-foreground text-sm">No audit events yet.</div>}
        </div>
      </div>
    </div>
  );
}
