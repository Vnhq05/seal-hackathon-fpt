import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password — SEAL Hackathon",
  description: "Reset your SEAL Hackathon account password.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-seal-bg px-4 py-12">
      <div className="w-full max-w-[460px] rounded-lg border border-seal-border bg-seal-surface p-8 shadow-md shadow-seal-dark/5">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
