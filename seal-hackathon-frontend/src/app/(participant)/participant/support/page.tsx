import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support — SEAL Hackathon",
  description: "Get help and support for SEAL Hackathon.",
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 12,
  padding: 24,
};

const channels = [
  {
    title: "Email Support",
    description: "Send us an email and we'll get back to you within 24 hours.",
    contact: "support@hacksync.dev",
    icon: (
      <svg width="20" height="16" viewBox="0 0 20 16" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="18" height="14" rx="2" stroke="#45464d" strokeWidth="1.5" />
        <path d="M1 3l9 6 9-6" stroke="#45464d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Documentation",
    description: "Browse our guides, FAQs, and tutorials to find answers quickly.",
    contact: "docs.hacksync.dev",
    icon: (
      <svg width="18" height="20" viewBox="0 0 18 20" fill="none" aria-hidden="true">
        <path d="M11 1H3a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V7l-6-6z" stroke="#45464d" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M11 1v6h6M5 13h8M5 9h4" stroke="#45464d" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Community",
    description: "Join our Discord community to connect with other participants.",
    contact: "discord.gg/hacksync",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="9" stroke="#45464d" strokeWidth="1.5" />
        <path d="M6 13s1.5 2 4 2 4-2 4-2M7 8h.01M13 8h.01" stroke="#45464d" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function SupportPage() {
  return (
    <div style={{ padding: 32, maxWidth: 1440 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          Support
        </h1>
        <p style={{ fontSize: 14, color: "#5c5e68", lineHeight: "21px", marginTop: 4 }}>
          Need help? Choose a channel below to get in touch.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {channels.map((ch) => (
          <div key={ch.title} style={cardStyle} className="flex flex-col gap-4">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{ width: 40, height: 40, backgroundColor: "#eef0f6", border: "1px solid #e4e2e4" }}
            >
              {ch.icon}
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1b1b1d", lineHeight: "25.2px" }}>
                {ch.title}
              </h3>
              <p style={{ fontSize: 14, color: "#5c5e68", lineHeight: "20px", marginTop: 4 }}>
                {ch.description}
              </p>
            </div>
            <p style={{ fontSize: 12, fontWeight: 500, color: "#45464d", letterSpacing: "0.24px" }}>
              {ch.contact}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
