function InfoCircleIcon() {
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" fill="none" aria-hidden>
      <circle cx="10" cy="11" r="9" stroke="#0e1528" strokeWidth="1.5" />
      <circle cx="10" cy="7" r="0.75" fill="#0e1528" />
      <path
        d="M10 11v4"
        stroke="#0e1528"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface RegistrationInfoBoxProps {
  title: string;
  description: string;
}

export function RegistrationInfoBox({
  title,
  description,
}: RegistrationInfoBoxProps) {
  return (
    <div
      className="w-full"
      style={{
        backgroundColor: "rgba(0,0,0,0.05)",
        borderLeft: "2px solid #38bdf8",
        borderRadius: "0 4px 4px 0",
      }}
    >
      <div
        className="flex items-start gap-2"
        style={{ padding: "16px 16px 16px 18px" }}
      >
        <div className="flex-shrink-0" style={{ marginTop: 1 }}>
          <InfoCircleIcon />
        </div>
        <div className="flex flex-col gap-1">
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#0e1528",
              lineHeight: "25.2px",
            }}
          >
            {title}
          </span>
          <span style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px" }}>
            {description}
          </span>
        </div>
      </div>
    </div>
  );
}
