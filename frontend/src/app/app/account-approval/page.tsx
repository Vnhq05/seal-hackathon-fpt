"use client";
/* ----------------------------------------------------------------------------
 * account-approval — Coordinator/Admin duyệt các tài khoản đang "pending".
 * Dữ liệu lấy TỪ BACKEND THẬT (GET /api/users, lọc status=pending); duyệt gọi
 * PUT /api/users/{id}/status {status:"active"}. Không còn dùng mock nữa.
 * -------------------------------------------------------------------------- */
import { useRequireRole } from "@/lib/role-guard";
import { PageHeader } from "@/components/app-shell";
import { listUsers, updateUserStatusApi, type BackendUser } from "@/lib/users-api";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AccountApproval() {
  useRequireRole(["Coordinator", "Admin"]);
  const [users, setUsers] = React.useState<BackendUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await listUsers());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  const approve = async (id: number) => {
    try {
      await updateUserStatusApi(id, "active");
      toast.success("Activated");
      void load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const pending = users.filter((u) => u.status === "pending");

  return (
    <div>
      <PageHeader title="Account approval" subtitle={`${pending.length} participant(s) pending`} />

      {loading && <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">Loading from backend…</div>}
      {error && <div className="rounded-xl border bg-card p-6 text-sm text-destructive">Couldn't reach backend: {error}</div>}

      {!loading && !error && (
        <div className="rounded-xl border bg-card divide-y">
          {pending.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No pending users.</div>}
          {pending.map((u) => (
            <div key={u.id} className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-muted-foreground">{u.email}{u.studentId ? ` · ${u.studentId}` : ""}{u.school ? ` · ${u.school}` : ""}</div>
              </div>
              <Badge variant="outline">{u.status}</Badge>
              <button onClick={() => void approve(u.id)} className="rounded-md btn-gradient text-primary-foreground px-3 py-1.5 text-xs">Approve</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
