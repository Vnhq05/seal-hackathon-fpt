"use client";
import { PageHeader } from "@/components/app-shell";
import { useCompetitionStore, updateCompetition, deleteCompetition } from "@/lib/competition-store";
import { Badge } from "@/components/ui/badge";
import { statusBadgeClass } from "@/lib/utils";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2 } from "lucide-react";
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
