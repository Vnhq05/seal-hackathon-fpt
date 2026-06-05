"use client";
import { useRequireRole } from "@/lib/role-guard";
import { PageHeader } from "@/components/app-shell";
import { useAuth, useAllUsers } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AccountApproval() {
  useRequireRole(["Coordinator", "Admin"]); // thay cho beforeLoad
  const users = useAllUsers();
  const { approveUser } = useAuth();
  const pending = users.filter((u) => u.status === "pending");
  return (
    <div>
      <PageHeader title="Account approval" subtitle={`${pending.length} participant(s) pending`} />
      <div className="rounded-xl border bg-card divide-y">
        {pending.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No pending users.</div>}
        {pending.map((u) => (
          <div key={u.id} className="p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="font-medium">{u.email}</div>
              <div className="text-xs text-muted-foreground">{u.studentId} {u.school && `· ${u.school}`}</div>
            </div>
            <Badge variant="outline">{u.status}</Badge>
            <button onClick={() => { approveUser(u.id); toast.success("Activated"); }} className="rounded-md btn-gradient text-primary-foreground px-3 py-1.5 text-xs">Approve</button>
          </div>
        ))}
      </div>
    </div>
  );
}
