"use client";
/* ----------------------------------------------------------------------------
 * app/login/page.tsx — TRANG ĐĂNG NHẬP "/login".
 * Logic submit: chặn reload -> login(email,password) -> ok thì sang /app/dashboard,
 *               lỗi thì toast; loading để khoá nút khi đang xử lý.
 * "use client" vì có ô nhập (state) + gọi API trong trình duyệt.
 * -------------------------------------------------------------------------- */
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Bot, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function LoginPage() {
  const { login, resetPassword } = useAuth();
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [resetOpen, setResetOpen] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState("");
  const [resetCode, setResetCode] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      router.push("/app/dashboard");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center hero-bg px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card/80 backdrop-blur p-8 shadow-2xl shadow-primary/10">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-xl btn-gradient grid place-items-center shadow-lg shadow-primary/30 mb-3">
            <Bot className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Sign in to SEAL</h1>
          <p className="text-xs text-muted-foreground mt-1">The fair-hackathon operating system</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" />
            </div>
          </div>
          <div>
            <Label htmlFor="pw">Password</Label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="pw" type="password" required autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            className="text-xs text-primary hover:underline"
          >Forgot password?</button>

          <button disabled={loading} className="w-full rounded-md btn-gradient text-primary-foreground py-2.5 text-sm font-medium disabled:opacity-60">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-5 text-xs text-center text-muted-foreground">
          No account? <Link href="/register" className="text-primary hover:underline">Register</Link>
        </div>
      </div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>We'll send a one-time reset code to your email (mocked).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="you@example.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
            {resetCode && <div className="rounded-md bg-success/10 text-success p-3 text-sm">Reset code: <code className="font-mono">{resetCode}</code></div>}
          </div>
          <DialogFooter>
            <button onClick={() => { const c = resetPassword(resetEmail); setResetCode(c); toast.success("Reset code generated"); }} className="rounded-md btn-gradient text-primary-foreground px-4 py-2 text-sm">Send code</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
