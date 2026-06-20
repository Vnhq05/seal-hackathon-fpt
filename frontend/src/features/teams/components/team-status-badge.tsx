interface TeamStatusBadgeProps {
  status: "open" | "full";
}

const BADGE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  open: { bg: "rgba(16,185,129,0.1)", border: "#10b981", text: "#10b981" },
  full: { bg: "rgba(244,63,94,0.1)", border: "#f43f5e", text: "#f43f5e" },
};

export function TeamStatusBadge({ status }: TeamStatusBadgeProps) {
  const style = BADGE_STYLES[status];
  return (
    <span
      className="flex-shrink-0 rounded-full"
      style={{
        backgroundColor: style.bg,
        borderLeft: `2px solid ${style.border}`,
        color: style.text,
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        padding: "4px 8px 4px 10px",
        lineHeight: "15px",
      }}
    >
      {status}
    </span>
  );
}
