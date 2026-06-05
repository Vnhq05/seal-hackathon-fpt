"use client";
import { PageHeader } from "@/components/app-shell";
import { useAuth, useAllUsers } from "@/lib/auth";
import { useRequireRole } from "@/lib/role-guard";
import { logAudit } from "@/lib/judging-store";
import * as React from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function UsersManagement() {
  useRequireRole(["Admin"]); // thay cho beforeLoad: requireRole(["Admin"])
  const users = useAllUsers();
  const { user, suspendUser, reactivateUser } = useAuth();
  const [role, setRole] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const filtered = users.filter((u) => (role === "all" || u.role === role) && (status === "all" || u.status === status));
  return (
    <div>
      <PageHeader title="Users management" subtitle="Admin · suspend or reactivate accounts" />
      <div className="flex gap-2 mb-4">
        <Select value={role} onValueChange={setRole}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{["all","Participant","Judge","Mentor","Coordinator","Admin"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{["all","active","pending","suspended"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className="rounded-xl border bg-card divide-y">
        {filtered.map((u) => (
          <div key={u.id} className="p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full btn-gradient grid place-items-center text-xs text-primary-foreground">{u.name.slice(0,1)}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{u.name}</div>
              <div className="text-xs text-muted-foreground truncate">{u.email}</div>
            </div>
            <Badge variant="outline">{u.role}</Badge>
            <Badge variant={u.status === "active" ? "default" : u.status === "pending" ? "secondary" : "destructive"}>{u.status}</Badge>
            {u.status === "active" ? (
              <button
                onClick={() => {
                  suspendUser(u.id);
                  logAudit({ userId: user!.id, userName: user!.name, action: `Suspended user ${u.email}`, entityType: "User", entityId: u.id, oldValue: "active", newValue: "suspended" });
                  toast.success("Suspended");
                }}
                className="text-xs text-destructive"
              >Suspend</button>
            ) : (
              <button
                onClick={() => {
                  reactivateUser(u.id);
                  logAudit({ userId: user!.id, userName: user!.name, action: `Reactivated user ${u.email}`, entityType: "User", entityId: u.id, oldValue: u.status, newValue: "active" });
                  toast.success("Reactivated");
                }}
                className="text-xs text-success"
              >Reactivate</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
