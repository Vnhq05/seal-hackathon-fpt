"use client";

export function AdminRegistrationChart({ trend }: { trend?: { date: string; count: number }[] }) {
  if (!trend || trend.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg"
        style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", padding: 48, minHeight: 340, flex: 1 }}
      >
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <rect x="4" y="28" width="8" height="16" rx="2" fill="rgba(223,226,236,0.8)" />
          <rect x="16" y="16" width="8" height="28" rx="2" fill="rgba(223,226,236,0.8)" />
          <rect x="28" y="22" width="8" height="22" rx="2" fill="rgba(223,226,236,0.8)" />
          <rect x="40" y="8" width="4" height="36" rx="2" fill="rgba(223,226,236,0.8)" />
        </svg>
        <p style={{ fontSize: 16, fontWeight: 600, color: "#0e1528", marginTop: 16 }}>
          User Registration (30 Days)
        </p>
        <p style={{ fontSize: 14, color: "#8891a5", marginTop: 4 }}>
          Chart will render here when data is available.
        </p>
      </div>
    );
  }

  const maxCount = Math.max(...trend.map((t) => t.count), 1);
  const chartHeight = 220;

  return (
    <div
      className="rounded-lg"
      style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", padding: 24, flex: 1 }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0e1528" }}>
          User Registration (30 Days)
        </h3>
        <button
          type="button"
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#8891a5" }}
        >
          ...
        </button>
      </div>

      <div className="relative" style={{ height: chartHeight }}>
        <svg
          width="100%"
          height={chartHeight}
          viewBox={`0 0 ${trend.length * 20} ${chartHeight}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path
            d={buildAreaPath(trend, maxCount, chartHeight, trend.length * 20)}
            fill="url(#chartGrad)"
          />
          <path
            d={buildLinePath(trend, maxCount, chartHeight, trend.length * 20)}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  );
}

function buildLinePath(
  data: { count: number }[],
  max: number,
  height: number,
  width: number,
): string {
  const step = width / Math.max(data.length - 1, 1);
  return data
    .map((d, i) => {
      const x = i * step;
      const y = height - (d.count / max) * (height - 20) - 10;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
}

function buildAreaPath(
  data: { count: number }[],
  max: number,
  height: number,
  width: number,
): string {
  const line = buildLinePath(data, max, height, width);
  const step = width / Math.max(data.length - 1, 1);
  const lastX = (data.length - 1) * step;
  return `${line} L${lastX},${height} L0,${height} Z`;
}
