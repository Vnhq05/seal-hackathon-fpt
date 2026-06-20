interface DashboardStatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: string;
}

export function DashboardStatCard({
  label,
  value,
  icon,
  iconBg,
  trend,
}: DashboardStatCardProps) {
  return (
    <div
      className="flex flex-col rounded-lg bg-seal-surface"
      style={{ border: "1px solid rgba(223,226,236,0.8)", padding: "20px 24px", gap: "16px" }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ width: 44, height: 44, backgroundColor: iconBg }}
        >
          {icon}
        </div>
        {trend && (
          <span style={{ fontSize: "12px", color: "#8891a5" }}>{trend}</span>
        )}
      </div>

      <div>
        <p
          style={{ fontSize: "28px", fontWeight: 700, color: "#0e1528", lineHeight: "36px" }}
        >
          {value}
        </p>
        <p className="mt-0.5" style={{ fontSize: "13px", color: "#8891a5" }}>
          {label}
        </p>
      </div>
    </div>
  );
}
