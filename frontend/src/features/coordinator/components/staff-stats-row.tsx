"use client";

import type { StaffDashboardSummary } from "@/features/coordinator/types/staff.types";

const svgProps = { fill: "none" as const, "aria-hidden": true as const };
const s15 = { stroke: "#8891a5", strokeWidth: 1.5 } as const;
const cap = { strokeLinecap: "round" as const };

function RegisteredIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><circle cx="9" cy="5" r="3.5" {...s15} /><path d="M2 17c0-3.866 3.134-7 7-7s7 3.134 7 7" {...s15} {...cap} /></svg>;
}
function PendingIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><circle cx="9" cy="5" r="3" {...s15} /><path d="M3 17c0-3.314 2.686-6 6-6" {...s15} {...cap} /><path d="M13 11l1.5 1.5L17 10" stroke="currentColor" strokeWidth="1.2" {...cap} strokeLinejoin="round" /></svg>;
}
function TeamsIcon() {
  return <svg width="20" height="16" viewBox="0 0 20 16" {...svgProps}><circle cx="7" cy="5" r="3" {...s15} /><path d="M1 15c0-3.314 2.686-6 6-6s6 2.686 6 6" {...s15} {...cap} /><circle cx="15" cy="5" r="2" {...s15} /><path d="M19 15c0-2.21-1.79-4-4-4" {...s15} {...cap} /></svg>;
}
function SubmissionsIcon() {
  return <svg width="18" height="20" viewBox="0 0 18 20" {...svgProps}><rect x="2" y="1" width="14" height="18" rx="2" {...s15} /><path d="M6 6h6M6 10h6M6 14h3" stroke="currentColor" strokeWidth="1.2" {...cap} /></svg>;
}
function JudgeIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><path d="M4 9l3 3 7-7" {...s15} {...cap} strokeLinejoin="round" /><rect x="1" y="1" width="16" height="16" rx="3" {...s15} /></svg>;
}
function DeadlineIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" {...svgProps}><circle cx="9" cy="9" r="7" {...s15} /><path d="M9 5v4l2.5 2.5" {...s15} {...cap} /></svg>;
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 12,
  padding: "20px 24px",
  flex: 1,
  minWidth: 0,
};

function StatItem({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: React.ReactNode }) {
  return (
    <div style={cardStyle}>
      <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 600, color: "#8891a5", letterSpacing: "0.5px", textTransform: "uppercase" }}>{label}</span>
      </div>
      <p style={{ fontSize: 28, fontWeight: 700, color: "#0e1528", lineHeight: "34px" }}>{value}</p>
      {sub && <div style={{ marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function StaffStatsRow({ summary }: { summary: StaffDashboardSummary }) {
  const submissionProgress = summary.totalSubmissionSlots > 0
    ? Math.round((summary.totalSubmissions / summary.totalSubmissionSlots) * 100)
    : 0;

  return (
    <div className="flex gap-4" style={{ marginBottom: 24 }}>
      <StatItem icon={<RegisteredIcon />} label="Registered" value={summary.registeredCount || summary.totalParticipants} />
      <StatItem
        icon={<PendingIcon />}
        label="Pending"
        value={summary.pendingApprovals}
        sub={summary.pendingApprovals > 0 ? <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>Needs review</span> : undefined}
      />
      <StatItem icon={<TeamsIcon />} label="Total Teams" value={summary.activeTeams} />
      <StatItem
        icon={<SubmissionsIcon />}
        label="Submissions"
        value={`${summary.totalSubmissions}/${summary.totalSubmissionSlots || summary.totalSubmissions}`}
        sub={
          <div className="rounded-full" style={{ height: 6, backgroundColor: "rgba(223,226,236,0.8)", marginTop: 6 }}>
            <div className="rounded-full" style={{ height: 6, backgroundColor: "#38bdf8", width: `${Math.min(submissionProgress, 100)}%` }} />
          </div>
        }
      />
      <StatItem icon={<JudgeIcon />} label="Active Judges" value={summary.activeJudges || 0} />
      <StatItem
        icon={<DeadlineIcon />}
        label="Next Deadline"
        value={summary.nextDeadlineDays !== null ? `${summary.nextDeadlineDays} Days` : "—"}
      />
    </div>
  );
}
