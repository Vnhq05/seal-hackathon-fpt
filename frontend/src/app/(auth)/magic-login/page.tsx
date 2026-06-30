import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandPanel } from "@/features/auth/components/brand-panel";
import { MagicLoginHandler } from "@/features/auth/components/magic-login-handler";

export const metadata: Metadata = {
  title: "Sign In — SEAL Hackathon",
  description: "Complete sign-in via your secure link.",
};

interface MagicLoginPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function MagicLoginPage({ searchParams }: MagicLoginPageProps) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <BrandPanel />

      <div className="flex w-full flex-col items-center justify-center overflow-y-auto bg-seal-bg px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm border-2 border-navy bg-white p-8 shadow-[6px_6px_0_0_#0c1228]">
          <Suspense>
            <MagicLoginHandler token={token} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
