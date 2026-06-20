"use client";

import type { AdminDashboardStats } from "@/features/admin/types/admin.types";

const svgProps = { fill: "none" as const, "aria-hidden": true as const };
const s12 = { stroke: "#8891a5", strokeWidth: 1.2 } as const;
const cap = { strokeLinecap: "round" as const };

function EventIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><rect x="2" y="3" width="14" height="14" rx="2" {...s12} /><path d="M6 1v4M12 1v4M2 9h14" {...s12} {...cap} /></svg>;
}
function UsersIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><circle cx="6" cy="5" r="3" {...s12} /><path d="M1 16c0-3 2.5-5.5 5-5.5s5 2.5 5 5.5" {...s12} {...cap} /><circle cx="13" cy="6" r="2" {...s12} /><path d="M17 16c0-2-1.5-4-4-4" {...s12} {...cap} /></svg>;
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
    <div className="grid grid-cols-3 gap-5" style={{ marginBottom: 24 }}>
      <StatCard icon={<EventIcon />} label="Total Events" value={data?.totalEvents ?? 0} loading={loading} />
      <StatCard icon={<UsersIcon />} label="Pending Approvals" value={data?.pendingApprovals ?? 0} loading={loading} />
      <StatCard icon={<EventIcon />} label="Active Events" value={data?.activeEvents ?? 0} sub="Currently running" loading={loading} />
    </div>
  );
}
