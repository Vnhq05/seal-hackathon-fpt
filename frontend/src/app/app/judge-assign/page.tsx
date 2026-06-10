"use client";
import * as React from "react";
import { PageHeader } from "@/components/app-shell";
import { useRequireRole } from "@/lib/role-guard";
import { getCompetitionsApi, type Competition } from "@/lib/competition";
import {
  listAllJudgesApi,
  listAllMentorsApi,
  listCompetitionJudgesApi,
  addCompetitionJudgeApi,
  removeCompetitionJudgeApi,
  listCompetitionMentorsApi,
  addCompetitionMentorApi,
  removeCompetitionMentorApi,
  type Judge,
  type Mentor,
} from "@/lib/staff-api";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, X, Search, Gavel, GraduationCap, Users } from "lucide-react";
import { toast } from "sonner";

// Cuộc thi đang nhận nhân sự: chỉ Open / Active.
const VISIBLE_STATUS: Competition["status"][] = ["Open", "Active"];

/** Một dòng người để search/thêm (judge hoặc mentor). */
interface PickItem {
  id: number;
  name: string;
  sub?: string | null; // email / chuyên môn để phân biệt
}

/** Dialog tìm kiếm theo tên và chọn người để thêm vào cuộc thi. */
function AddStaffDialog({
  open,
  onOpenChange,
  title,
  pool,
  addedIds,
  onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  pool: PickItem[];
  addedIds: Set<number>;
  onPick: (id: number) => void;
}) {
  const [q, setQ] = React.useState("");
  React.useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const filtered = pool.filter((p) => {
    const hay = `${p.name} ${p.sub ?? ""}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Tìm theo tên hoặc email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="max-h-72 overflow-auto -mx-1 mt-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground px-2 py-6 text-center">Không tìm thấy.</p>
          ) : (
            <ul className="divide-y">
              {filtered.map((p) => {
                const added = addedIds.has(p.id);
                return (
                  <li key={p.id} className="flex items-center gap-2 px-2 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      {p.sub ? <div className="text-xs text-muted-foreground truncate">{p.sub}</div> : null}
                    </div>
                    <Button
                      size="sm"
                      variant={added ? "outline" : "default"}
                      disabled={added}
                      onClick={() => onPick(p.id)}
                    >
                      {added ? "Đã thêm" : "Thêm"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function JudgeAssign() {
  useRequireRole(["Admin"]);

  const [comps, setComps] = React.useState<Competition[]>([]);
  const [compId, setCompId] = React.useState<string>("");

  const [judges, setJudges] = React.useState<Judge[]>([]);
  const [mentors, setMentors] = React.useState<Mentor[]>([]);

  const [allJudges, setAllJudges] = React.useState<Judge[]>([]);
  const [allMentors, setAllMentors] = React.useState<Mentor[]>([]);

  const [judgeDialog, setJudgeDialog] = React.useState(false);
  const [mentorDialog, setMentorDialog] = React.useState(false);

  const compIdNum = compId ? Number(compId) : null;

  // Tải cuộc thi (Open/Active) + pool judge/mentor 1 lần.
  React.useEffect(() => {
    (async () => {
      try {
        const [allComps, aj, am] = await Promise.all([
          getCompetitionsApi(),
          listAllJudgesApi(),
          listAllMentorsApi(),
        ]);
        const visible = allComps.filter((c) => VISIBLE_STATUS.includes(c.status));
        setComps(visible);
        setAllJudges(aj);
        setAllMentors(am);
        if (visible[0]) setCompId(String(visible[0].id));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Không tải được dữ liệu.");
      }
    })();
  }, []);

  // Tải roster của cuộc thi đang chọn.
  const loadRoster = React.useCallback(async (id: number) => {
    try {
      const [js, ms] = await Promise.all([
        listCompetitionJudgesApi(id),
        listCompetitionMentorsApi(id),
      ]);
      setJudges(js);
      setMentors(ms);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được danh sách nhân sự.");
    }
  }, []);

  React.useEffect(() => {
    if (compIdNum != null) loadRoster(compIdNum);
    else {
      setJudges([]);
      setMentors([]);
    }
  }, [compIdNum, loadRoster]);

  const addedJudgeIds = React.useMemo(() => new Set(judges.map((j) => j.id)), [judges]);
  const addedMentorIds = React.useMemo(() => new Set(mentors.map((m) => m.id)), [mentors]);

  const handleAddJudge = async (judgeId: number) => {
    if (compIdNum == null) return;
    try {
      await addCompetitionJudgeApi(compIdNum, judgeId);
      await loadRoster(compIdNum);
      toast.success("Đã thêm judge.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Thêm judge thất bại.");
    }
  };

  const handleRemoveJudge = async (judgeId: number) => {
    if (compIdNum == null) return;
    try {
      await removeCompetitionJudgeApi(compIdNum, judgeId);
      setJudges((prev) => prev.filter((j) => j.id !== judgeId));
      toast.success("Đã gỡ judge.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gỡ judge thất bại.");
    }
  };

  const handleAddMentor = async (mentorId: number) => {
    if (compIdNum == null) return;
    try {
      await addCompetitionMentorApi(compIdNum, mentorId);
      await loadRoster(compIdNum);
      toast.success("Đã thêm mentor.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Thêm mentor thất bại.");
    }
  };

  const handleRemoveMentor = async (mentorId: number) => {
    if (compIdNum == null) return;
    try {
      await removeCompetitionMentorApi(compIdNum, mentorId);
      setMentors((prev) => prev.filter((m) => m.id !== mentorId));
      toast.success("Đã gỡ mentor.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gỡ mentor thất bại.");
    }
  };

  const judgePool: PickItem[] = allJudges.map((j) => ({
    id: j.id,
    name: j.fullName + (j.isGuest ? " (guest)" : ""),
    sub: j.email,
  }));
  const mentorPool: PickItem[] = allMentors.map((m) => ({
    id: m.id,
    name: m.fullName,
    sub: m.email ?? m.specialty,
  }));

  return (
    <div>
      <PageHeader
        title="Judge & Mentor assignment"
        subtitle="Chọn cuộc thi (đang Open/Active) rồi thêm judge và mentor cho cuộc thi đó."
      />

      <div className="flex gap-2 mb-6 flex-wrap items-center">
        <Select value={compId} onValueChange={setCompId}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Chọn cuộc thi…" />
          </SelectTrigger>
          <SelectContent>
            {comps.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">Không có cuộc thi Open/Active</div>
            ) : (
              comps.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name} · {c.status}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {compIdNum == null ? (
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          Hãy chọn một cuộc thi để xem và phân judge / mentor.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* JUDGES */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <Gavel className="h-4 w-4 text-primary" />
                <span className="font-medium">Judges</span>
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <Users className="h-3 w-3" /> {judges.length}
                </span>
              </div>
              <Button size="sm" onClick={() => setJudgeDialog(true)} className="btn-gradient text-primary-foreground">
                <Plus className="h-4 w-4 mr-1" /> Add judge
              </Button>
            </div>
            <ul className="divide-y">
              {judges.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-muted-foreground">Chưa có judge nào.</li>
              ) : (
                judges.map((j) => (
                  <li key={j.id} className="flex items-center gap-2 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {j.fullName}
                        {j.isGuest ? <Badge variant="outline" className="ml-2 text-[10px]">guest</Badge> : null}
                      </div>
                      {j.email ? <div className="text-xs text-muted-foreground truncate">{j.email}</div> : null}
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRemoveJudge(j.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* MENTORS */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span className="font-medium">Mentors</span>
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <Users className="h-3 w-3" /> {mentors.length}
                </span>
              </div>
              <Button size="sm" onClick={() => setMentorDialog(true)} className="btn-gradient text-primary-foreground">
                <Plus className="h-4 w-4 mr-1" /> Add mentor
              </Button>
            </div>
            <ul className="divide-y">
              {mentors.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-muted-foreground">Chưa có mentor nào.</li>
              ) : (
                mentors.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{m.fullName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {m.email ?? m.specialty ?? ""}
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRemoveMentor(m.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

      <AddStaffDialog
        open={judgeDialog}
        onOpenChange={setJudgeDialog}
        title="Thêm judge vào cuộc thi"
        pool={judgePool}
        addedIds={addedJudgeIds}
        onPick={handleAddJudge}
      />
      <AddStaffDialog
        open={mentorDialog}
        onOpenChange={setMentorDialog}
        title="Thêm mentor vào cuộc thi"
        pool={mentorPool}
        addedIds={addedMentorIds}
        onPick={handleAddMentor}
      />
    </div>
  );
}
