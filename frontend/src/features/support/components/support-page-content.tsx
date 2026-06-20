"use client";

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 12,
  padding: 24,
};

const svgProps = { fill: "none" as const, "aria-hidden": true as const };
const s12 = { stroke: "#8891a5", strokeWidth: 1.2 } as const;
const cap = { strokeLinecap: "round" as const };

function DocIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" {...svgProps}><rect x="3" y="2" width="14" height="16" rx="2" {...s12} /><path d="M7 6h6M7 10h6M7 14h4" {...s12} {...cap} /></svg>;
}
function ChatIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" {...svgProps}><path d="M3 14V6a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H8l-3 3v-3H5a2 2 0 01-2-2z" {...s12} /></svg>;
}
function EmailIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" {...svgProps}><rect x="2" y="4" width="16" height="12" rx="2" {...s12} /><path d="M2 6l8 5 8-5" {...s12} {...cap} /></svg>;
}
function FaqIcon() {
  return <svg width="20" height="20" viewBox="0 0 20 20" {...svgProps}><circle cx="10" cy="10" r="8" {...s12} /><path d="M7.5 7.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5M10 14h.01" {...s12} {...cap} /></svg>;
}

const HELP_ITEMS = [
  { icon: <DocIcon />, title: "Documentation", desc: "Browse guides and tutorials for the platform." },
  { icon: <FaqIcon />, title: "FAQ", desc: "Find answers to common questions." },
  { icon: <ChatIcon />, title: "Live Chat", desc: "Chat with our support team in real-time." },
  { icon: <EmailIcon />, title: "Email Support", desc: "Send us an email at support@hacksync.io" },
];

export function SupportPageContent({ portalName }: { portalName: string }) {
  return (
    <div style={{ padding: 32, maxWidth: 960 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          Help & Support
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Get help with the {portalName} Portal. Choose a support option below.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {HELP_ITEMS.map((item) => (
          <div key={item.title} className="flex gap-4" style={cardStyle}>
            <div
              className="flex flex-shrink-0 items-center justify-center rounded-lg"
              style={{ width: 40, height: 40, backgroundColor: "#ffffff" }}
            >
              {item.icon}
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 600, color: "#0e1528", marginBottom: 4 }}>{item.title}</p>
              <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "20px" }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...cardStyle, marginTop: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0e1528", marginBottom: 16 }}>Contact Us</h3>
        <div className="flex flex-col gap-3">
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", display: "block", marginBottom: 6 }}>Subject</label>
            <input
              type="text"
              placeholder="What do you need help with?"
              className="rounded-lg"
              style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid rgba(223,226,236,0.8)", outline: "none", color: "#0e1528" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", display: "block", marginBottom: 6 }}>Message</label>
            <textarea
              placeholder="Describe your issue..."
              rows={4}
              className="rounded-lg"
              style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid rgba(223,226,236,0.8)", outline: "none", color: "#0e1528", resize: "vertical" }}
            />
          </div>
          <button
            type="button"
            className="self-start rounded-lg"
            style={{ padding: "10px 24px", fontSize: 14, fontWeight: 600, backgroundColor: "#38bdf8", color: "#ffffff", border: "none", cursor: "pointer" }}
          >
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
}
