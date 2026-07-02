const preStyle: React.CSSProperties = {
  fontSize: 11,
  fontFamily: "ui-monospace, monospace",
  lineHeight: "16px",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  margin: 0,
};

const boxStyle: React.CSSProperties = {
  maxHeight: 128,
  overflow: "auto",
  backgroundColor: "#f8f9fc",
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 6,
  padding: "8px 10px",
};

export function formatAuditValue(value: string | null): string {
  if (!value) return "—";
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

export function hasAuditValues(oldValue: string | null, newValue: string | null): boolean {
  return Boolean(oldValue || newValue);
}

export function AuditValuePair({
  oldValue,
  newValue,
}: {
  oldValue: string | null;
  newValue: string | null;
}) {
  if (!hasAuditValues(oldValue, newValue)) {
    return <span style={{ color: "#8891a5" }}>—</span>;
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>Before</p>
        <div style={boxStyle}>
          <pre style={preStyle}>{formatAuditValue(oldValue)}</pre>
        </div>
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>After</p>
        <div style={boxStyle}>
          <pre style={preStyle}>{formatAuditValue(newValue)}</pre>
        </div>
      </div>
    </div>
  );
}
