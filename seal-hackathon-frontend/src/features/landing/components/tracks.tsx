import { TRACKS, type Track } from "@/lib/landing-data";

const TRACK_ICONS: Record<string, React.ReactNode> = {
  "Artificial Intelligence": (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <circle cx="15" cy="10" r="1.5" fill="currentColor" />
      <path d="M9 15c0 0 1.5 2 3 2s3-2 3-2" strokeLinecap="round" />
      <line x1="12" y1="2" x2="12" y2="4" />
    </svg>
  ),
  "Web & Cloud": (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
  "Mobile Experience": (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="12" y1="18" x2="12" y2="18.01" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "Sustainability": (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M12 22c4-4 8-7 8-12a8 8 0 00-16 0c0 5 4 8 8 12z" />
      <path d="M12 12V8M12 8l-2 2M12 8l2 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "Cybersecurity": (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "Open Innovation": (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinejoin="round" />
    </svg>
  ),
};

const ACCENT_STYLES: Record<string, { text: string; border: string; bg: string; shadow: string }> = {
  cyan: { text: "text-seal-cyan", border: "border-seal-cyan/20", bg: "bg-seal-cyan/5", shadow: "hover:shadow-seal-cyan/10" },
  blue: { text: "text-seal-blue", border: "border-seal-blue/20", bg: "bg-seal-blue/5", shadow: "hover:shadow-seal-blue/10" },
  pink: { text: "text-seal-pink", border: "border-seal-pink/20", bg: "bg-seal-pink/5", shadow: "hover:shadow-seal-pink/10" },
  mint: { text: "text-seal-mint", border: "border-seal-mint/20", bg: "bg-seal-mint/5", shadow: "hover:shadow-seal-mint/10" },
  purple: { text: "text-seal-purple", border: "border-seal-purple/20", bg: "bg-seal-purple/5", shadow: "hover:shadow-seal-purple/10" },
  yellow: { text: "text-seal-yellow", border: "border-seal-yellow/20", bg: "bg-seal-yellow/5", shadow: "hover:shadow-seal-yellow/10" },
};

function TrackCard({ track }: { track: Track }) {
  const style = ACCENT_STYLES[track.accent] ?? ACCENT_STYLES.cyan;

  return (
    <div
      className={`group relative overflow-hidden rounded-lg border ${style.border} ${style.bg} p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${style.shadow} ${track.span === "col-span-2" ? "md:col-span-2" : ""}`}
    >
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg border ${style.border} bg-seal-bg/50 ${style.text} transition-colors group-hover:bg-seal-bg`}>
        {TRACK_ICONS[track.name]}
      </div>
      <h3 className={`font-heading text-lg font-bold ${style.text}`}>{track.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-seal-text-secondary">
        {track.description}
      </p>
      {/* Glow on hover */}
      <div
        className="pointer-events-none absolute -right-8 -bottom-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-200 group-hover:opacity-30"
        style={{
          backgroundColor:
            track.accent === "cyan" ? "#38bdf8" :
            track.accent === "blue" ? "#818cf8" :
            track.accent === "pink" ? "#f3d44d" :
            track.accent === "mint" ? "#2dd4bf" :
            track.accent === "purple" ? "#a99bf4" :
            "#f3d44d",
        }}
        aria-hidden="true"
      />
    </div>
  );
}

export function Tracks() {
  return (
    <section id="tracks" className="bg-seal-bg py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-seal-text sm:text-4xl">
            CHOOSE YOUR TRACK
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-seal-text-secondary">
            Pick a domain that matches your skills and passion.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {TRACKS.map((track) => (
            <TrackCard key={track.name} track={track} />
          ))}
        </div>
      </div>
    </section>
  );
}
