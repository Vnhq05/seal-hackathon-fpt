import type { Metadata } from "next";
import { SubmitProjectPage } from "@/features/submissions/components/submit-project-page";

export const metadata: Metadata = {
  title: "Submit Project — SEAL Hackathon",
  description: "Submit your project for the current hackathon round.",
};

interface SubmitPageProps {
  searchParams: Promise<{ roundId?: string }>;
}

export default async function SubmitRoute({ searchParams }: SubmitPageProps) {
  const { roundId } = await searchParams;

  if (!roundId) {
    return (
      <div
        className="flex min-h-[400px] items-center justify-center"
        style={{ padding: 32 }}
      >
        <p style={{ fontSize: 14, color: "#5c5e68" }}>
          Missing round ID. Please navigate from your hackathon page.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 1440 }}>
      <SubmitProjectPage roundId={roundId} />
    </div>
  );
}
