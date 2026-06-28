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
        <div className="w-full max-w-[480px] border-2 border-navy bg-white p-8 shadow-[6px_6px_0_0_#0c1228] sm:p-10">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
