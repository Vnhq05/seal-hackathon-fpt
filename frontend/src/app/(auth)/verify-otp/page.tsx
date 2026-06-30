import type { Metadata } from "next";
import { BrandPanel } from "@/features/auth/components/brand-panel";
import VerifyOtpPageClient from "./verify-otp-client";

export const metadata: Metadata = {
  title: "Verify Email — SEAL Hackathon",
  description: "Enter the verification code sent to your email to complete registration.",
};

export default function VerifyOtpPage() {
  return (
    <div className="flex min-h-screen w-full overflow-hidden">
      <BrandPanel />
      <div className="flex w-full flex-col items-center justify-center overflow-y-auto bg-seal-bg px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-[480px] border-2 border-navy bg-white p-8 shadow-[6px_6px_0_0_#0c1228] sm:p-10">
          <VerifyOtpPageClient />
        </div>
      </div>
    </div>
  );
}
