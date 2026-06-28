import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password — SEAL Hackathon",
  description: "Reset your SEAL Hackathon account password.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-seal-bg px-4 py-12">
      <div className="w-full max-w-[460px] border-2 border-navy bg-white p-8 shadow-[6px_6px_0_0_#0c1228]">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
