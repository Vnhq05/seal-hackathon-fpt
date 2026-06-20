import Link from "next/link";

interface QuickLinkItem {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const QUICK_LINKS: QuickLinkItem[] = [
  {
    href: "/projects",
    label: "Browse Hackathons",
    description: "Find and register",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M9 2l1.8 3.6 4 .6-2.9 2.8.69 3.96L9 11.1l-3.59 1.86L6.1 9l-2.9-2.8 4-.6L9 2z"
          stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/teams",
    label: "My Teams",
    description: "Manage your teams",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="7" cy="6" r="2.5" stroke="#38bdf8" strokeWidth="1.5" />
        <path d="M2 16c0-2.761 2.239-5 5-5" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="13" cy="7" r="2" stroke="#38bdf8" strokeWidth="1.5" />
        <path d="M16 16c0-2.21-1.343-4-3-4" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/submissions",
    label: "Submissions",
    description: "View your projects",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M9 3v8M9 3L6 6M9 3l3 3" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 13v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/notifications",
    label: "Notifications",
    description: "Stay updated",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M9 2a5 5 0 015 5v3l1.5 2H2.5L4 10V7a5 5 0 015-5z" stroke="#38bdf8" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M7 14a2 2 0 004 0" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function QuickLinks() {
  return (
    <section>
      <h2
        className="mb-4"
        style={{ fontSize: "17px", fontWeight: 600, color: "#0e1528" }}
      >
        Quick Links
      </h2>

      <div className="flex flex-col" style={{ gap: "8px" }}>
        {QUICK_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg bg-seal-surface p-3 transition-colors hover:bg-indigo-50 focus:outline-none"
            style={{ border: "1px solid rgba(223,226,236,0.8)" }}
          >
            <div
              className="flex flex-shrink-0 items-center justify-center rounded-lg"
              style={{ width: 36, height: 36, backgroundColor: "#eef0f6" }}
            >
              {item.icon}
            </div>
            <div className="min-w-0">
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#0e1528" }}>
                {item.label}
              </p>
              <p style={{ fontSize: "11px", color: "rgba(101,217,243,0.2)" }}>{item.description}</p>
            </div>
            <svg
              className="ml-auto flex-shrink-0"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path d="M6 4l4 4-4 4" stroke="rgba(101,217,243,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ))}
      </div>
    </section>
  );
}
