"use client";
/* ----------------------------------------------------------------------------
 * event-control — Organizer dashboard: điều khiển vòng đời cuộc thi.
 * Dữ liệu lấy TỪ BACKEND THẬT (GET /api/competitions). Đổi trạng thái (Open →
 * Active → Scoring → Closed) gọi PUT /api/competitions/{id}; sửa nội dung cuộc
 * thi cũng qua PUT; xoá gọi DELETE.
 * Coordinator VÀ Admin đều được sửa & xoá.
 * -------------------------------------------------------------------------- */
import * as React from "react";
import { PageHeader } from "@/components/app-shell";
import {
    getCompetitionsApi,
    updateCompetitionApi,
    deleteCompetitionApi,
    buildUpdateCompetitionPayload,
    getRoundsApi,
    createRoundApi,
    deleteRoundApi,
    normalizeDateTime,
    type Competition,
    type Round,
} from "@/lib/competition";
import { CAMPUSES } from "@/lib/campuses";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { statusBadgeClass } from "@/lib/utils";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, Pencil, ListOrdered, Plus } from "lucide-react";
import { useRequireRole } from "@/lib/role-guard";

const STATUSES: Competition["status"][] = ["Draft", "Open", "Active", "Scoring", "Closed", "Cancelled"];
const FORMATS: Competition["format"][] = ["Offline", "Online", "Hybrid"];

export default function EventControl() {
    useRequireRole(["Coordinator", "Admin"]);

    const [competitions, setCompetitions] = React.useState<Competition[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [editing, setEditing] = React.useState<Competition | null>(null);
    const [managingRounds, setManagingRounds] = React.useState<Competition | null>(null);

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
        if (!window.confirm("Delete this competition? This cannot be undone.")) return;
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
                subtitle="Coordinator/Admin · edit, advance status (Open → Active → Scoring → Closed), publish results, delete."
            />

            {loading && <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">Loading from backend…</div>}
            {error && <div className="rounded-xl border bg-card p-6 text-sm text-destructive">Couldn&apos;t reach backend: {error}<div className="text-xs text-muted-foreground mt-1">Make sure the backend is running at http://localhost:8080.</div></div>}

            {!loading && !error && (
                <div className="rounded-xl border bg-card divide-y">
                    {competitions.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No competitions yet. Create one in the wizard.</div>}
                    {competitions.map((c) => (
                        <div key={c.id} className="p-4 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{c.name}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                    {c.location || "—"} · {c.format} · {c.startDate ? c.startDate.slice(0, 10) : "—"}
                                </div>
                            </div>

                            <Badge className={statusBadgeClass(c.status)}>{c.status}</Badge>

                            <div className="flex gap-1 items-center">
                                {c.status === "Open" && (
                                    <button onClick={() => void changeStatus(c.id, "Active")} className="rounded-md border px-3 py-1 text-xs">Start</button>
                                )}
                                {c.status === "Active" && (
                                    <button onClick={() => void changeStatus(c.id, "Scoring")} className="rounded-md border px-3 py-1 text-xs">→ Scoring</button>
                                )}
                                {c.status === "Scoring" && (
                                    <button onClick={() => void changeStatus(c.id, "Closed")} className="rounded-md btn-gradient text-primary-foreground px-3 py-1 text-xs">Publish results</button>
                                )}
                                <button onClick={() => setManagingRounds(c)} className="rounded-md border px-3 py-1 text-xs inline-flex items-center gap-1">
                                    <ListOrdered className="h-3.5 w-3.5" /> Rounds
                                </button>
                                <button onClick={() => setEditing(c)} className="rounded-md border px-3 py-1 text-xs inline-flex items-center gap-1">
                                    <Pencil className="h-3.5 w-3.5" /> Edit
                                </button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="p-1"><MoreVertical className="h-4 w-4" /></DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => setManagingRounds(c)}>
                                            <ListOrdered className="h-3.5 w-3.5 mr-2" /> Manage rounds
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setEditing(c)}>
                                            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => void removeCompetition(c.id)} className="text-destructive">
                                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <EditDialog
                competition={editing}
                onClose={() => setEditing(null)}
                onSaved={async () => { setEditing(null); await load(); }}
            />

            <RoundsDialog
                competition={managingRounds}
                onClose={() => setManagingRounds(null)}
            />
        </div>
    );
}

function RoundsDialog({
    competition, onClose,
}: {
    competition: Competition | null;
    onClose: () => void;
}) {
    const [rounds, setRounds] = React.useState<Round[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [name, setName] = React.useState("");
    const [deadline, setDeadline] = React.useState("");
    const [saving, setSaving] = React.useState(false);

    const load = React.useCallback(async () => {
        if (!competition) return;
        setLoading(true);
        try {
            setRounds(await getRoundsApi(competition.id));
        } catch {
            setRounds([]);
        } finally {
            setLoading(false);
        }
    }, [competition]);

    React.useEffect(() => { void load(); }, [load]);

    const add = async () => {
        if (!competition) return;
        if (!name.trim()) { toast.error("Round name is required."); return; }
        setSaving(true);
        try {
            const at = normalizeDateTime(deadline) ?? null;
            await createRoundApi(competition.id, {
                name: name.trim(),
                startAt: at,
                deadline: at,
            });
            toast.success(`Round "${name.trim()}" added`);
            setName("");
            setDeadline("");
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to add round");
        } finally {
            setSaving(false);
        }
    };

    const remove = async (roundId: number) => {
        if (!competition) return;
        if (!window.confirm("Delete this round? Submissions/scores linked to it may be affected.")) return;
        try {
            await deleteRoundApi(competition.id, roundId);
            toast.success("Round deleted");
            await load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to delete round");
        }
    };

    return (
        <Dialog open={!!competition} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Rounds · {competition?.name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    {loading ? (
                        <div className="text-sm text-muted-foreground">Loading rounds…</div>
                    ) : rounds.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No rounds yet. Add the first one below.</div>
                    ) : (
                        <div className="rounded-lg border divide-y">
                            {rounds.map((r, i) => {
                                const due = r.deadline ?? r.startAt;
                                return (
                                    <div key={r.id} className="flex items-center gap-3 p-3">
                                        <span className="text-xs text-muted-foreground w-5 text-center">{r.sequence ?? i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{r.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {due ? `Due ${due.replace("T", " ").slice(0, 16)}` : "No deadline set"}
                                            </div>
                                        </div>
                                        <button onClick={() => void remove(r.id)} className="text-destructive p-1.5 hover:bg-destructive/10 rounded-md" title="Delete round">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                        <Label className="text-xs">Add a round</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Round name (e.g. Qualifiers)" />
                        <div className="flex gap-2">
                            <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="flex-1" />
                            <Button onClick={() => void add()} disabled={saving} className="btn-gradient text-primary-foreground shrink-0">
                                <Plus className="h-4 w-4 mr-1" /> {saving ? "Adding…" : "Add"}
                            </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground">The date is shown to teams as the round&apos;s deadline.</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function EditDialog({
    competition, onClose, onSaved,
}: {
    competition: Competition | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [name, setName] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [location, setLocation] = React.useState("");
    const [format, setFormat] = React.useState<Competition["format"]>("Offline");
    const [status, setStatus] = React.useState<Competition["status"]>("Draft");
    const [startDate, setStartDate] = React.useState("");
    const [regDeadline, setRegDeadline] = React.useState("");
    const [saving, setSaving] = React.useState(false);

    // Nạp dữ liệu cuộc thi vào form mỗi khi mở dialog với 1 cuộc thi khác.
    React.useEffect(() => {
        if (!competition) return;
        setName(competition.name ?? "");
        setDescription(competition.description ?? "");
        setLocation(competition.location ?? "");
        setFormat(competition.format ?? "Offline");
        setStatus(competition.status ?? "Draft");
        setStartDate(competition.startDate ? competition.startDate.slice(0, 16) : "");
        setRegDeadline(competition.registrationDeadline ? competition.registrationDeadline.slice(0, 16) : "");
    }, [competition]);

    const save = async () => {
        if (!competition) return;
        if (!name.trim()) { toast.error("Name is required."); return; }
        // Hạn đăng ký phải trước ngày bắt đầu.
        if (startDate && regDeadline && new Date(regDeadline) > new Date(startDate)) {
            toast.error("Registration must close before the competition starts.");
            return;
        }
        setSaving(true);
        try {
            await updateCompetitionApi(
                competition.id,
                buildUpdateCompetitionPayload({
                    name,
                    description,
                    location,
                    format,
                    status,
                    startDate: startDate || null,
                    registrationDeadline: regDeadline || null,
                }),
            );
            toast.success("Competition updated");
            onSaved();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to update");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={!!competition} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit competition</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" /></div>
                    <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1.5" /></div>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                            <Label>Campus / Location</Label>
                            <Select value={location || undefined} onValueChange={setLocation}>
                                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select a campus…" /></SelectTrigger>
                                <SelectContent>{CAMPUSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Format</Label>
                            <Select value={format} onValueChange={(v) => setFormat(v as Competition["format"])}>
                                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                                <SelectContent>{FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <div><Label>Start date</Label><Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1.5" /></div>
                        <div><Label>Registration closes</Label><Input type="datetime-local" max={startDate || undefined} value={regDeadline} onChange={(e) => setRegDeadline(e.target.value)} className="mt-1.5" /></div>
                    </div>
                    <div>
                        <Label>Status</Label>
                        <Select value={status} onValueChange={(v) => setStatus(v as Competition["status"])}>
                            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                            <SelectContent>{STATUSES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button className="btn-gradient text-primary-foreground" onClick={save} disabled={saving}>
                        {saving ? "Saving…" : "Save changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
