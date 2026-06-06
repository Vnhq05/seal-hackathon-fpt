"use client";
/* ----------------------------------------------------------------------------
 * create-account — Admin tạo tài khoản nhân sự (Mentor/Judge/Lecturer/Coordinator).
 * Gọi BACKEND THẬT (POST /api/users). Mật khẩu tạm sinh ở client, gửi lên để
 * backend mã hóa & lưu. Không còn dùng mock (createStaffAccount) nữa.
 * -------------------------------------------------------------------------- */
import { useRequireRole } from "@/lib/role-guard";
import * as React from "react";
import { PageHeader } from "@/components/app-shell";
import { createStaffApi, type CreateStaffInput } from "@/lib/users-api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy } from "lucide-react";

export default function CreateAccount() {
  useRequireRole(["Admin"]);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<CreateStaffInput["role"]>("Judge");
  const [temp, setTemp] = React.useState(() => Math.random().toString(36).slice(2, 10));
  const [saving, setSaving] = React.useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await createStaffApi({ name, email, role, password: temp });
      toast.success(`Created ${role} account — share the temporary password: ${temp}`);
      setName(""); setEmail(""); setTemp(Math.random().toString(36).slice(2, 10));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Create staff account" subtitle="Admin-only · Mentor / Judge / Lecturer / Coordinator" />
      <div className="rounded-xl border bg-card p-6 max-w-lg space-y-4">
        <div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" /></div>
        <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" /></div>
        <div><Label>Role</Label>
          <Select value={role} onValueChange={(v: any) => setRole(v)}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Mentor">Mentor</SelectItem>
              <SelectItem value="Judge">Judge</SelectItem>
              <SelectItem value="Lecturer">Lecturer (Mentor + Judge)</SelectItem>
              <SelectItem value="Coordinator">Coordinator</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Temporary password</Label>
          <div className="flex gap-2 mt-1.5">
            <Input value={temp} readOnly className="font-mono" />
            <button onClick={() => { navigator.clipboard?.writeText(temp); toast.success("Copied"); }} className="rounded-md border px-3"><Copy className="h-4 w-4" /></button>
            <button onClick={() => setTemp(Math.random().toString(36).slice(2, 10))} className="rounded-md border px-3 text-xs">Regen</button>
          </div>
        </div>
        <button disabled={saving} onClick={() => void submit()} className="w-full rounded-md btn-gradient text-primary-foreground py-2 text-sm disabled:opacity-60">{saving ? "Creating…" : "Create account"}</button>
      </div>
    </div>
  );
}
