import { Suspense } from "react";
import type { Metadata } from "next";
import { BrandPanel } from "@/features/auth/components/brand-panel";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Sign In — SEAL Hackathon",
  description: "Sign in to your SEAL Hackathon account.",
};

export default function LoginPage() {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <BrandPanel />

      <div className="flex w-full flex-col items-center justify-center overflow-y-auto bg-seal-bg px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm rounded-xl border border-seal-border/50 bg-white p-8 shadow-sm">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
