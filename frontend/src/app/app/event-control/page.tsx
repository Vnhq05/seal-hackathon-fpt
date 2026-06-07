"use client";

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
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useRequireRole } from "@/lib/role-guard";

export default function EventControl() {
    useRequireRole(["Coordinator", "Admin"]);

    const { user } = useAuth();
    const isAdmin = user?.role === "Admin";

    const [competitions, setCompetitions] = React.useState<Competition[]>([]);

    const loadCompetitions = async () => {
        try {
            const data = await getCompetitionsApi();
            setCompetitions(data);
        } catch (err) {
            toast.error((err as Error).message);
        }
    };

    React.useEffect(() => {
        loadCompetitions();
    }, []);

    const changeStatus = async (id: number, status: Competition["status"]) => {
        try {
            await updateCompetitionApi(id, { status });
            toast.success(`Status changed to ${status}`);
            await loadCompetitions();
        } catch (err) {
            toast.error((err as Error).message);
        }
    };

    const removeCompetition = async (id: number) => {
        try {
            await deleteCompetitionApi(id);
            toast.success("Deleted");
            await loadCompetitions();
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

            <div className="rounded-xl border bg-card divide-y">
                {competitions.map((c) => (
                    <div key={c.id} className="p-4 flex items-center gap-3">
                        <div className="flex-1">
                            <div className="font-medium">{c.name}</div>
                            <div className="text-xs text-muted-foreground">
                                {c.category || "—"} · {c.format} ·{" "}
                                {c.startDate ? c.startDate.slice(0, 10) : "—"}
                            </div>
                        </div>

                        <Badge className={statusBadgeClass(c.status)}>{c.status}</Badge>

                        <div className="flex gap-1">
                            {c.status === "Open" && (
                                <button
                                    onClick={() => changeStatus(c.id, "Active")}
                                    className="rounded-md border px-3 py-1 text-xs"
                                >
                                    Start
                                </button>
                            )}

                            {c.status === "Active" && (
                                <button
                                    onClick={() => changeStatus(c.id, "Scoring")}
                                    className="rounded-md border px-3 py-1 text-xs"
                                >
                                    → Scoring
                                </button>
                            )}

                            {c.status === "Scoring" && (
                                <button
                                    onClick={() => changeStatus(c.id, "Closed")}
                                    className="rounded-md btn-gradient text-primary-foreground px-3 py-1 text-xs"
                                >
                                    Publish results
                                </button>
                            )}

                            {isAdmin && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="p-1">
                                        <MoreVertical className="h-4 w-4" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem
                                            onClick={() => removeCompetition(c.id)}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
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