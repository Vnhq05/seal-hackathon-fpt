"use client";
import { useRequireRole } from "@/lib/role-guard";
import * as React from "react";
import { PageHeader } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy } from "lucide-react";

export default function CreateAccount() {
  useRequireRole(["Admin"]); // thay cho beforeLoad: requireRole(["Admin"])
  const { createStaffAccount } = useAuth();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<"Mentor" | "Judge" | "Lecturer" | "Coordinator">("Judge");
  const [temp, setTemp] = React.useState(() => Math.random().toString(36).slice(2, 10));

  const submit = () => {
    try {
      createStaffAccount({ name, email, role, tempPassword: temp });
      toast.success(`${role} account created — share temp password: ${temp}`);
      setName(""); setEmail(""); setTemp(Math.random().toString(36).slice(2, 10));
    } catch (e) { toast.error((e as Error).message); }
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
        <button onClick={submit} className="w-full rounded-md btn-gradient text-primary-foreground py-2 text-sm">Create account</button>
      </div>
    </div>
  );
}
