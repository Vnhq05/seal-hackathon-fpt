import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support — SEAL Hackathon Lecturer",
};

function MailIcon() {
  return (
    <svg width="20" height="16" viewBox="0 0 20 16" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1 3l9 6 9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LecturerSupportRoute() {
  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="text-2xl font-bold text-seal-text">Support</h1>
      <p className="mt-2 text-sm text-seal-text-secondary">
        Need help? Reach out through the channels below.
      </p>

      <div className="mt-8 grid gap-4">
        <div className="flex items-start gap-4 rounded-lg border border-seal-border bg-seal-surface p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-500">
            <MailIcon />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-seal-text">Email Support</h3>
            <p className="mt-1 text-xs text-seal-text-muted">support@seal-hackathon.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
