"use client";
// (Link của tanstack đã bỏ vì file này không dùng tới.)
import { useRequireRole } from "@/lib/role-guard";
import * as React from "react";
import { PageHeader } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { useGlobalRules, setGlobalRules, type GlobalRule } from "@/lib/competition-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ArrowUp, ArrowDown, AlertTriangle, GripVertical } from "lucide-react";
import { toast } from "sonner";

export default function SystemSettings() {
  useRequireRole(["Admin"]); // thay cho beforeLoad: requireRole(["Admin"])
  const { user } = useAuth();
  const meta = useGlobalRules();
  const [draft, setDraft] = React.useState<GlobalRule[]>(meta.rules);
  const snapshotRef = React.useRef<string>(JSON.stringify(meta.rules));

  React.useEffect(() => {
    setDraft(meta.rules);
    snapshotRef.current = JSON.stringify(meta.rules);
  }, [meta.version]);

  const dirty = JSON.stringify(draft) !== snapshotRef.current;
  const hasEmpty = draft.some((r) => !r.text.trim());

  const update = (id: string, patch: Partial<GlobalRule>) =>
    setDraft((d) => d.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id: string) => setDraft((d) => d.filter((r) => r.id !== id));
  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= draft.length) return;
    const copy = [...draft];
    [copy[idx], copy[j]] = [copy[j], copy[idx]];
    setDraft(copy);
  };
  const add = () =>
    setDraft((d) => [
      ...d,
      { id: `gr_${Date.now().toString(36)}`, text: "", order: d.length + 1, active: true },
    ]);

  const onSave = () => {
    if (!user) return;
    if (hasEmpty) {
      toast.error("Cannot save: some rules are empty.");
      return;
    }
    const next = setGlobalRules(draft, { id: user.id, name: user.name });
    toast.success(`Rules updated — version v${next.version}`);
  };
  const onDiscard = () => setDraft(meta.rules);

  return (
    <div className="max-w-4xl">
      <PageHeader title="System Settings" subtitle="Global rules — applied to every competition" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Competition Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded-md p-3">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Changes here affect <b>ALL</b> competitions (including ongoing ones). Each save writes an audit log entry.
            </span>
          </div>

          <div className="text-xs text-muted-foreground">
            Version <b>v{meta.version}</b> · Last edited by <b>{meta.lastEditedByName}</b> at{" "}
            {new Date(meta.lastEditedAt).toLocaleString()}
          </div>

          {draft.length === 0 ? (
            <div className="text-sm text-muted-foreground border border-dashed rounded-md p-6 text-center">
              No rules yet. Click <b>Add rule</b> to add one.
            </div>
          ) : (
            <div className="space-y-2">
              {draft.map((r, idx) => (
                <div key={r.id} className="flex gap-2 items-start border rounded-md p-3 bg-card">
                  <div className="flex flex-col gap-1 pt-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(idx, 1)}
                      disabled={idx === draft.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Textarea
                    value={r.text}
                    onChange={(e) => update(r.id, { text: e.target.value })}
                    placeholder="Rule text…"
                    className="flex-1 min-h-[60px]"
                  />
                  <div className="flex flex-col items-center gap-2 pt-1">
                    <Switch checked={r.active} onCheckedChange={(v) => update(r.id, { active: v })} />
                    <button
                      type="button"
                      onClick={() => remove(r.id)}
                      className="text-destructive hover:opacity-80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button variant="outline" size="sm" onClick={add}>
            <Plus className="h-4 w-4 mr-1" /> Add rule
          </Button>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={onDiscard} disabled={!dirty}>
              Discard changes
            </Button>
            <Button className="btn-gradient text-primary-foreground" onClick={onSave} disabled={!dirty || hasEmpty}>
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
