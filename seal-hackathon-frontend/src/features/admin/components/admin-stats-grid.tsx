"use client";

import type { AdminDashboardStats } from "@/features/admin/types/admin.types";

const svgProps = { fill: "none" as const, "aria-hidden": true as const };
const s12 = { stroke: "#8891a5", strokeWidth: 1.2 } as const;
const cap = { strokeLinecap: "round" as const };

function EventIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><rect x="2" y="3" width="14" height="14" rx="2" {...s12} /><path d="M6 1v4M12 1v4M2 9h14" {...s12} {...cap} /></svg>;
}
function BoltIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><path d="M10 1L4 10h5l-1 7 6-9H9l1-7z" stroke="#22c55e" strokeWidth="1.2" strokeLinejoin="round" /></svg>;
}
function UsersIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><circle cx="6" cy="5" r="3" {...s12} /><path d="M1 16c0-3 2.5-5.5 5-5.5s5 2.5 5 5.5" {...s12} {...cap} /><circle cx="13" cy="6" r="2" {...s12} /><path d="M17 16c0-2-1.5-4-4-4" {...s12} {...cap} /></svg>;
}
function TeamsIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><circle cx="6" cy="5" r="3" {...s12} /><circle cx="13" cy="5" r="2.5" {...s12} /><path d="M1 16c0-3 2.5-5.5 5-5.5 1.5 0 3 .6 4 1.5M13 10.5c2 0 3.5 1.5 3.5 3.5" {...s12} {...cap} /></svg>;
}
function SubmissionIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><rect x="2" y="1" width="14" height="16" rx="2" {...s12} /><path d="M6 5h6M6 9h6M6 13h3" {...s12} {...cap} /></svg>;
}

function TrendIndicator({ value }: { value: number }) {
  if (value === 0) return null;
  const up = value > 0;
  return (
    <span style={{ fontSize: 12, fontWeight: 600, color: up ? "#047857" : "#dc2626", marginTop: 4, display: "inline-block" }}>
      {up ? "↑" : "↓"} {Math.abs(value)}%
    </span>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  loading: boolean;
}

function StatCard({ icon, label, value, sub, trend, loading }: StatCardProps) {
  if (loading) {
    return <div className="animate-pulse rounded-lg" style={{ height: 130, backgroundColor: "rgba(223,226,236,0.8)", border: "1px solid rgba(198,198,205,0.3)" }} />;
  }
  return (
    <div
      className="flex flex-col rounded-lg"
      style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", padding: "20px 24px" }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", letterSpacing: "0.3px" }}>{label}</span>
        {icon}
      </div>
      <span style={{ fontSize: 28, fontWeight: 700, color: "#0e1528", lineHeight: "34px" }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: "#8891a5", marginTop: 2 }}>{sub}</span>}
      {trend !== undefined && <TrendIndicator value={trend} />}
    </div>
  );
}

export function AdminStatsGrid({ data, loading }: { data: AdminDashboardStats | undefined; loading: boolean }) {
  return (
    <div className="grid grid-cols-5 gap-5" style={{ marginBottom: 24 }}>
      <StatCard icon={<EventIcon />} label="Total Events" value={data?.totalHackathons ?? 0} trend={data?.totalEventsTrend} loading={loading} />
      <StatCard icon={<BoltIcon />} label="Active Events" value={data?.activeEvents ?? 0} sub="Currently running" loading={loading} />
      <StatCard icon={<UsersIcon />} label="Total Users" value={formatLargeNumber(data?.activeUsers ?? 0)} trend={data?.activeUsersTrend} loading={loading} />
      <StatCard icon={<TeamsIcon />} label="Total Teams" value={formatLargeNumber(data?.totalTeams ?? 0)} trend={data?.totalTeamsTrend} loading={loading} />
      <StatCard icon={<SubmissionIcon />} label="Total Submissions" value={formatLargeNumber(data?.totalSubmissions ?? 0)} trend={data?.totalSubmissionsTrend} loading={loading} />
    </div>
  );
}

function formatLargeNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
