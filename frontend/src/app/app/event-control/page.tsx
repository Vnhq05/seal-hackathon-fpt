"use client";
/* ----------------------------------------------------------------------------
 * event-control — Organizer dashboard: điều khiển vòng đời cuộc thi.
 * Dữ liệu lấy TỪ BACKEND THẬT (GET /api/competitions). Đổi trạng thái (Open →
 * Active → Scoring → Closed) gọi PUT /api/competitions/{id}; xoá gọi DELETE.
 * Không còn dùng mock (competition-store) nữa.
 * -------------------------------------------------------------------------- */
import * as React from "react";
import { PageHeader } from "@/components/app-shell";
import {
    getCompetitionsApi,
    updateCompetitionApi,
    deleteCompetitionApi,
    type Competition,
} from "@/lib/competition";
import { Badge } from "@/components/ui/badge";
import { statusBadgeClass } from "@/lib/utils";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useRequireRole } from "@/lib/role-guard";

export default function EventControl() {
    useRequireRole(["Coordinator", "Admin"]);

    const { user } = useAuth();
    const isAdmin = user?.role === "Admin";

    const [competitions, setCompetitions] = React.useState<Competition[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const load = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setCompetitions(await getCompetitionsApi());
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, []);
    React.useEffect(() => { void load(); }, [load]);

    const changeStatus = async (id: number, status: Competition["status"]) => {
        try {
            await updateCompetitionApi(id, { status });
            toast.success(`Status changed to ${status}`);
            await load();
        } catch (err) {
            toast.error((err as Error).message);
        }
    };

    const removeCompetition = async (id: number) => {
        try {
            await deleteCompetitionApi(id);
            toast.success("Deleted");
            await load();
        } catch (err) {
            toast.error((err as Error).message);
        }
    };

    return (
        <div>
            <PageHeader
                title="Organizer dashboard"
                subtitle="Competition-level controls · Open → Active → Scoring → Closed · publish results · delete. Round-level lock/unlock lives under Rounds."
            />

            {loading && <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">Loading from backend…</div>}
            {error && <div className="rounded-xl border bg-card p-6 text-sm text-destructive">Couldn&apos;t reach backend: {error}<div className="text-xs text-muted-foreground mt-1">Make sure the backend is running at http://localhost:8080.</div></div>}

            {!loading && !error && (
                <div className="rounded-xl border bg-card divide-y">
                    {competitions.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No competitions yet. Create one in the wizard.</div>}
                    {competitions.map((c) => (
                        <div key={c.id} className="p-4 flex items-center gap-3">
                            <div className="flex-1">
                                <div className="font-medium">{c.name}</div>
                                <div className="text-xs text-muted-foreground">
                                    {c.category || "—"} · {c.format} · {c.startDate ? c.startDate.slice(0, 10) : "—"}
                                </div>
                            </div>

                            <Badge className={statusBadgeClass(c.status)}>{c.status}</Badge>

                            <div className="flex gap-1">
                                {c.status === "Open" && (
                                    <button onClick={() => void changeStatus(c.id, "Active")} className="rounded-md border px-3 py-1 text-xs">Start</button>
                                )}
                                {c.status === "Active" && (
                                    <button onClick={() => void changeStatus(c.id, "Scoring")} className="rounded-md border px-3 py-1 text-xs">→ Scoring</button>
                                )}
                                {c.status === "Scoring" && (
                                    <button onClick={() => void changeStatus(c.id, "Closed")} className="rounded-md btn-gradient text-primary-foreground px-3 py-1 text-xs">Publish results</button>
                                )}
                                {isAdmin && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="p-1"><MoreVertical className="h-4 w-4" /></DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => void removeCompetition(c.id)} className="text-destructive">
                                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
