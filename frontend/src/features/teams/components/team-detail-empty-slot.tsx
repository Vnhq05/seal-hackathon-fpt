interface TeamDetailEmptySlotProps {
  onClick: () => void;
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function TeamDetailEmptySlot({ onClick }: TeamDetailEmptySlotProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center rounded-lg"
      style={{
        border: "2px dashed rgba(223,226,236,0.8)",
        background: "transparent",
        minHeight: 160,
        padding: "40px 16px",
        cursor: "pointer",
      }}
    >
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: 48,
          height: 48,
          backgroundColor: "rgba(223,226,236,0.8)",
          border: "1px solid rgba(223,226,236,0.8)",
          marginBottom: 8,
        }}
      >
        <PlusIcon />
      </div>
      <span style={{ fontSize: 12, color: "#8891a5", letterSpacing: "0.24px", lineHeight: "12px" }}>
        Invite Member
      </span>
    </button>
  );
}
