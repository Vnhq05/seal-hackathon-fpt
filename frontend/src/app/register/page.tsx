"use client";
/* ----------------------------------------------------------------------------
 * app/register/page.tsx — TRANG ĐĂNG KÝ "/register".
 * Logic submit: chặn reload -> kiểm tra dữ liệu nhập -> register(...) -> ok thì
 *               sang /app/dashboard (Back-end cho dùng ngay), lỗi thì toast.
 * Lưu ý: Student ID / FPT / School thu cho đúng thiết kế nhưng CHƯA gửi sang
 *        Back-end (Back-end mới nhận email/password/name).
 * -------------------------------------------------------------------------- */
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Bot } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [studentId, setStudentId] = React.useState("");
  const [isFPT, setIsFPT] = React.useState(true);
  const [school, setSchool] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { toast.error("Enter a valid email"); return; }
    if (password.length < 6) { toast.error("Password must be ≥ 6 chars"); return; }
    if (!studentId) { toast.error("Student ID is required"); return; }
    if (!isFPT && !school) { toast.error("Specify your school"); return; }
    setLoading(true);
    try {
      await register({ email, password, studentId, isFPT, school: isFPT ? undefined : school });
      toast.success("Account created — welcome to SEAL!");
      router.push("/app/dashboard");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center hero-bg px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border bg-card/80 backdrop-blur p-8 shadow-2xl shadow-primary/10">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-xl btn-gradient grid place-items-center shadow-lg shadow-primary/30 mb-3">
            <Bot className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Create your account</h1>
          <p className="text-xs text-muted-foreground mt-1">Sign up to get started with SEAL.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="em">Email</Label>
            <Input id="em" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" placeholder="you@example.com" />
          </div>
          <div>
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" placeholder="At least 6 characters" />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="text-sm font-medium">I&apos;m an FPT University student</div>
              <div className="text-xs text-muted-foreground">Toggle off for non-FPT participants</div>
            </div>
            <Switch checked={isFPT} onCheckedChange={setIsFPT} />
          </div>
          <div>
            <Label htmlFor="sid">Student ID</Label>
            <Input id="sid" required value={studentId} onChange={(e) => setStudentId(e.target.value)} className="mt-1.5" placeholder={isFPT ? "SE171234" : "Your university student ID"} />
          </div>
          {!isFPT && (
            <div>
              <Label htmlFor="sc">School / University</Label>
              <Input id="sc" required value={school} onChange={(e) => setSchool(e.target.value)} className="mt-1.5" placeholder="Your university name" />
            </div>
          )}
          <button disabled={loading} className="w-full rounded-md btn-gradient text-primary-foreground py-2.5 text-sm font-medium disabled:opacity-60">
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <div className="mt-5 text-xs text-center text-muted-foreground">
          Have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
