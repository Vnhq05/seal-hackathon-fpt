import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password — SEAL Hackathon",
  description: "Set a new password for your SEAL Hackathon account.",
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/forgot-password");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-seal-bg px-4 py-12">
      <div className="w-full max-w-[460px] rounded-lg border border-seal-border bg-seal-surface p-8 shadow-md shadow-seal-dark/5">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
