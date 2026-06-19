"use client";

export function AdminSystemBanner({ operational }: { operational: boolean }) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg"
      style={{
        backgroundColor: operational ? "#ecfdf5" : "#fef2f2",
        padding: "10px 20px",
        marginBottom: 24,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="8" stroke={operational ? "#047857" : "#dc2626"} strokeWidth="1.5" />
        <path
          d={operational ? "M5.5 9l2.5 2.5L12.5 7" : "M6 6l6 6M12 6l-6 6"}
          stroke={operational ? "#047857" : "#dc2626"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span style={{ fontSize: 13, fontWeight: 600, color: operational ? "#047857" : "#dc2626" }}>
        {operational ? "All systems operational" : "System issues detected"}
      </span>
    </div>
  );
}
