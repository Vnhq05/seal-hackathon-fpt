interface InviteSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function InviteSearchInput({ value, onChange, disabled = false }: InviteSearchInputProps) {
  return (
    <div className="relative w-full">
      <div
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="7.5" cy="7.5" r="5.5" stroke="rgba(223,226,236,0.8)" strokeWidth="1.5" />
          <path
            d="M12 12l4 4"
            stroke="rgba(223,226,236,0.8)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <input
        type="text"
        placeholder="Search by name or email..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full"
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid rgba(64,145,108,0.25)",
          borderRadius: 6,
          padding: "11px 13px 11px 41px",
          fontSize: 14,
          color: "#0e1528",
          outline: "none",
          lineHeight: "normal",
        }}
      />
    </div>
  );
}
