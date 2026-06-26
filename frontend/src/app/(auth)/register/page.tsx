import type { Metadata } from "next";
import { BrandPanel } from "@/features/auth/components/brand-panel";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Create Account — SEAL Hackathon",
  description: "Create your SEAL Hackathon account to join upcoming hackathons.",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen w-full overflow-hidden">
      <BrandPanel />
      <div className="flex w-full flex-col items-center justify-center overflow-y-auto bg-seal-bg px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-[480px] rounded-xl border border-seal-border/50 bg-white p-8 shadow-sm sm:p-10">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
