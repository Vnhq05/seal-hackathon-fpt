"use client";
import * as React from "react";
import { PageHeader } from "@/components/app-shell";
import { useCompetitionStore, updateCompetition, deleteCompetition } from "@/lib/competition-store";
import { listCompetitions, deleteCompetitionApi, type BackendCompetition } from "@/lib/competitions-api";
import { Badge } from "@/components/ui/badge";
import { statusBadgeClass } from "@/lib/utils";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, RefreshCw, Database } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useRequireRole } from "@/lib/role-guard";

export default function EventControl() {
  useRequireRole(["Coordinator", "Admin"]); // thay cho beforeLoad
  const { competitions } = useCompetitionStore();
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  return (
    <div>
      <PageHeader title="Organizer dashboard" subtitle="Competition-level controls · Open → Active → Scoring → Closed · publish results · delete. Round-level lock/unlock lives under Rounds." />

      <BackendCompetitionsPanel />

      <div className="rounded-xl border bg-card divide-y">
        {competitions.map((c) => (
          <div key={c.id} className="p-4 flex items-center gap-3">
            <div className="flex-1">
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.category} · {c.format} · {c.startDate.slice(0,10)}</div>
            </div>
            <Badge className={statusBadgeClass(c.status)}>{c.status}</Badge>
            <div className="flex gap-1">
              {c.status === "Open" && <button onClick={() => { updateCompetition(c.id, { status: "Active" }); toast.success("Now Active"); }} className="rounded-md border px-3 py-1 text-xs">Start</button>}
              {c.status === "Active" && <button onClick={() => { updateCompetition(c.id, { status: "Scoring" }); toast.success("Scoring phase"); }} className="rounded-md border px-3 py-1 text-xs">→ Scoring</button>}
              {c.status === "Scoring" && <button onClick={() => { updateCompetition(c.id, { status: "Closed" }); toast.success("Closed & published"); }} className="rounded-md btn-gradient text-primary-foreground px-3 py-1 text-xs">Publish results</button>}
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-1"><MoreVertical className="h-4 w-4" /></DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => { deleteCompetition(c.id); toast.success("Deleted"); }} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" />Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * BackendCompetitionsPanel — danh sách cuộc thi ĐỌC TỪ BACKEND THẬT.
 * Chứng minh vòng lặp CRUD đầy đủ: trang Create ghi (POST) → panel này đọc (GET)
 * → nút xoá gọi (DELETE). Khác hẳn list bên dưới (vẫn dùng dữ liệu giả local).
 * -------------------------------------------------------------------------- */
function BackendCompetitionsPanel() {
  const [rows, setRows] = React.useState<BackendCompetition[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listCompetitions());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const remove = async (id: number) => {
    try {
      await deleteCompetitionApi(id);
      toast.success(`Deleted competition #${id} on backend.`);
      void load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="mb-6 rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b p-4">
        <Database className="h-4 w-4 text-primary" />
        <span className="font-medium">Competitions from Backend (REAL data)</span>
        <Badge variant="secondary" className="ml-1">GET /api/competitions</Badge>
        <button onClick={() => void load()} className="ml-auto rounded-md border px-2 py-1 text-xs inline-flex items-center gap-1 hover:bg-accent">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Reload
        </button>
      </div>
      {loading && <div className="p-4 text-sm text-muted-foreground">Loading from backend…</div>}
      {error && (
        <div className="p-4 text-sm text-destructive">
          Couldn't reach backend: {error}
          <div className="text-xs text-muted-foreground mt-1">Make sure the backend is running at http://localhost:8080 (and you're logged in).</div>
        </div>
      )}
      {!loading && !error && rows.length === 0 && (
        <div className="p-4 text-sm text-muted-foreground">Backend has no competitions yet. Create one to see it appear here.</div>
      )}
      {!loading && !error && rows.length > 0 && (
        <div className="divide-y">
          {rows.map((c) => (
            <div key={c.id} className="p-4 flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-10">#{c.id}</span>
              <div className="flex-1">
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.startDate ? c.startDate.slice(0, 10) : "—"}</div>
              </div>
              {c.status && <Badge className={statusBadgeClass(c.status)}>{c.status}</Badge>}
              <button onClick={() => void remove(c.id)} className="rounded-md border px-2 py-1 text-xs text-destructive inline-flex items-center gap-1 hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
