import type { Metadata } from "next";
import { JudgeAssignmentPage } from "@/features/admin/components/judge-assignment-page";
import { MentorAssignmentPage } from "@/features/admin/components/mentor-assignment-page";

export const metadata: Metadata = { title: "Assign Judges & Mentors — SEAL Hackathon" };

export default async function EventAssignmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div style={{ padding: 32, maxWidth: 1440 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Assign Judges & Mentors</h1>
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Judges</h2>
        <JudgeAssignmentPage defaultEventId={id} />
      </section>
      <section>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Mentors</h2>
        <MentorAssignmentPage defaultEventId={id} />
      </section>
    </div>
  );
}
