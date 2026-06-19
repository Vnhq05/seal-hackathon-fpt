interface TeamMemberCountProps {
  current: number;
  max: number;
}

export function TeamMemberCount({ current, max }: TeamMemberCountProps) {
  return (
    <span className="flex items-center gap-1">
      <svg width="15" height="11" viewBox="0 0 15 11" fill="none" aria-hidden="true">
        <circle cx="5.5" cy="3.5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
        <path
          d="M1 10c0-2.5 2-4.5 4.5-4.5S10 7.5 10 10"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle cx="11" cy="4" r="1.8" stroke="currentColor" strokeWidth="1.2" />
        <path
          d="M14 10c0-1.8-1.2-3.2-3-3.2"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#8891a5",
          letterSpacing: "0.24px",
          lineHeight: "12px",
        }}
      >
        {current}/{max} Members
      </span>
    </span>
  );
}
