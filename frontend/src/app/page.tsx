/* ----------------------------------------------------------------------------
 * page.tsx (src/app/) — TRANG CHỦ "/" (trang giới thiệu, hiển thị tĩnh).
 * Là Server Component (không "use client") nên khai báo được metadata.
 * Bố cục: header -> hero -> FEATURES -> PHASES -> ROLES -> footer.
 * Sửa nội dung 3 mục giữa thì sửa ở 3 mảng FEATURES/PHASES/ROLES ngay dưới đây.
 * -------------------------------------------------------------------------- */
import type { Metadata } from "next";
import Link from "next/link";
import {
  Trophy, Users, Gavel, BarChart3, ShieldCheck, Sparkles, ArrowRight,
  Settings2, ClipboardList, Upload, Award, CheckCircle2, Bell,
} from "lucide-react";

export const metadata: Metadata = {
  title: "SEAL — The operating system for fair hackathons",
  description:
    "Production-grade hackathon management for FPT University. 51 business rules, 6 roles, 5 phases, end-to-end auditability.",
};

const FEATURES = [
  { icon: Trophy, title: "Event Configuration", body: "Coordinators set seasons, rounds, criteria, and judge assignments with BR-aware validation." },
  { icon: Users, title: "Team & Mentor Flow", body: "Participants form teams of 3–5, invite mentors by email, and chat in-app once the mentor accepts." },
  { icon: BarChart3, title: "Weighted Ranking", body: "Scoring weights (Technical, Innovation, Presentation, Feasibility) are pre-configured per event and applied automatically." },
  { icon: ShieldCheck, title: "RBAC & Audit", body: "Role-based access for 5 personas with immutable audit logs for every scoring action." },
  { icon: Sparkles, title: "MentorHub", body: "Booking, monitoring, and async chat between mentors and teams throughout the event." },
  { icon: Bell, title: "Announcement & Notifications", body: "Broadcast announcements, round reminders, mentor updates, and scoring notifications instantly to all stakeholders." },
];
const PHASES = [
  { icon: Settings2, label: "Config" },
  { icon: ClipboardList, label: "Registration" },
  { icon: Upload, label: "Submission" },
  { icon: Gavel, label: "Scoring" },
  { icon: Award, label: "Results" },
];
const ROLES = [
  { name: "Participant", desc: "Form teams, submit, track results." },
  { name: "Mentor", desc: "Advise teams via chat, monitor progress." },
  { name: "Judge", desc: "Evaluate submissions and submit weighted scores." },
  { name: "Lecturer", desc: "Combined Mentor + Judge: advise teams and evaluate submissions." },
  { name: "Coordinator", desc: "Configure events, moderate, approve users." },
  { name: "Admin", desc: "Manage accounts, security, audit." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/70 border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg btn-gradient grid place-items-center text-primary-foreground font-bold text-sm">S</div>
            <span className="font-semibold tracking-tight">SEAL</span>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/login" className="px-3 py-1.5 text-sm rounded-md hover:bg-accent">Login</Link>
            <Link href="/register" className="px-3 py-1.5 text-sm rounded-md btn-gradient text-primary-foreground font-medium">Register</Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden hero-bg">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32 text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.1]">
            The operating system for <span className="text-gradient">fair hackathons</span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            SEAL Hackathon Management System is a modern web-based platform developed to streamline the organization and management of hackathon competitions. The system supports multi-role management, team registration, mentor assignment, project submission, judge calibration, weighted scoring, automated ranking, audit logging, and result publication in a secure and transparent workflow.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link href="/register" className="rounded-md btn-gradient text-primary-foreground px-5 py-2.5 text-sm font-medium inline-flex items-center gap-2">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="rounded-md border px-5 py-2.5 text-sm font-medium hover:bg-accent">
              I have an account
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-semibold tracking-tight text-center">Built for every stakeholder</h2>
        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-xl border bg-card card-gradient p-6 hover:border-primary/40 transition-colors">
                <div className="h-10 w-10 rounded-lg btn-gradient grid place-items-center text-primary-foreground mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-semibold tracking-tight text-center">A 5-phase event lifecycle</h2>
        <div className="mt-10 grid grid-cols-2 md:grid-cols-5 gap-3">
          {PHASES.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={p.label} className="relative rounded-xl border bg-card p-5 text-center">
                <div className="mx-auto h-10 w-10 rounded-lg btn-gradient grid place-items-center text-primary-foreground mb-3">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Phase {i + 1}</div>
                <div className="font-medium text-sm mt-1">{p.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-semibold tracking-tight text-center">6 roles, one system of record</h2>
        <div className="mt-10 grid md:grid-cols-3 lg:grid-cols-6 gap-3">
          {ROLES.map((r) => (
            <div key={r.name} className="rounded-xl border bg-card p-5">
              <CheckCircle2 className="h-4 w-4 text-primary mb-2" />
              <div className="font-medium text-sm">{r.name}</div>
              <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t mt-10">
        <div className="max-w-7xl mx-auto px-6 py-8 text-xs text-muted-foreground text-center">
          © 2026 SEAL Hackathon · FPT University · SU26SWP03 · SWR303 · BR Catalog v2.0
        </div>
      </footer>
    </div>
  );
}
