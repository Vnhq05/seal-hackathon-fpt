import Image from "next/image";
import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-seal-bg text-seal-text">
      <header className="flex items-center justify-between border-b border-seal-border px-8 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-removebg-preview.png" alt="SEAL Hackathon" width={32} height={32} className="rounded" />
          <span className="font-mono text-base font-bold text-navy">
            SEAL <span className="text-seal-cyan">Hackathon</span>
          </span>
        </Link>
        <Link
          href="/login"
          className="border border-seal-border px-4 py-2 text-sm font-medium text-seal-text transition-colors hover:bg-seal-surface-elevated border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]"
        >
          Sign in
        </Link>
      </header>
      <main className="mx-auto w-full max-w-[800px] flex-1 px-8 py-12">
        {children}
      </main>
    </div>
  );
}
