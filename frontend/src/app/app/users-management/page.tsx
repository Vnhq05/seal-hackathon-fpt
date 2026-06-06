"use client";
/* ----------------------------------------------------------------------------
 * users-management — Admin xem danh sách user và khóa / mở lại tài khoản.
 * Dữ liệu lấy TỪ BACKEND THẬT (GET /api/users), thao tác đổi trạng thái gọi
 * PUT /api/users/{id}/status. Không còn dùng mock (useAllUsers) nữa.
 * -------------------------------------------------------------------------- */
import { PageHeader } from "@/components/app-shell";
import { useRequireRole } from "@/lib/role-guard";
import { listUsers, updateUserStatusApi, type BackendUser } from "@/lib/users-api";
import * as React from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function UsersManagement() {
  useRequireRole(["Admin"]);
  const [users, setUsers] = React.useState<BackendUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [role, setRole] = React.useState("all");
  const [status, setStatus] = React.useState("all");

  // Tải danh sách user từ backend.
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

  // Đổi trạng thái rồi tải lại danh sách.
  const changeStatus = async (id: number, next: "active" | "suspended") => {
    try {
      await updateUserStatusApi(id, next);
      toast.success(next === "active" ? "Reactivated" : "Suspended");
      void load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const filtered = users.filter(
    (u) => (role === "all" || u.role === role) && (status === "all" || u.status === status),
  );

  return (
    <div>
      <PageHeader title="Users management" subtitle="Admin · suspend or reactivate accounts" />
      <div className="flex gap-2 mb-4">
        <Select value={role} onValueChange={setRole}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{["all","Participant","Judge","Mentor","Lecturer","Coordinator","Admin"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{["all","active","pending","suspended"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
      </div>

      {loading && <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">Loading from backend…</div>}
      {error && <div className="rounded-xl border bg-card p-6 text-sm text-destructive">Couldn't reach backend: {error}<div className="text-xs text-muted-foreground mt-1">Make sure the backend is running at http://localhost:8080.</div></div>}

      {!loading && !error && (
        <div className="rounded-xl border bg-card divide-y">
          {filtered.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No users.</div>}
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
                <button onClick={() => void changeStatus(u.id, "suspended")} className="text-xs text-destructive">Suspend</button>
              ) : (
                <button onClick={() => void changeStatus(u.id, "active")} className="text-xs text-success">Reactivate</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
