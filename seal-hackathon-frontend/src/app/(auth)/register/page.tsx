import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Create Account — SEAL Hackathon",
  description: "Create your SEAL Hackathon account to join upcoming hackathons.",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-seal-bg px-4 py-12">
      <div className="w-full max-w-[480px] rounded-lg border border-seal-border bg-seal-surface p-10 shadow-md shadow-seal-dark/5">
        <RegisterForm />
      </div>
    </div>
  );
}
