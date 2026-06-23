"use client";

import { useEnroll, useMyEnrollment, useWithdrawEnrollment } from "@/features/events/hooks/use-enrollment";

const statusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "#fef3c7", text: "#92400e" },
  APPROVED: { bg: "#d1fae5", text: "#065f46" },
  REJECTED: { bg: "#fee2e2", text: "#991b1b" },
  WITHDRAWN: { bg: "#f3f4f6", text: "#6b7280" },
};

export function EventEnrollmentPage({ eventId }: { eventId: string }) {
  const { data: enrollment, isLoading, isError } = useMyEnrollment(eventId);
  const { mutate: enroll, isPending: enrolling } = useEnroll(eventId);
  const { mutate: withdraw, isPending: withdrawing } = useWithdrawEnrollment(eventId);

  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <div className="animate-pulse rounded" style={{ height: 20, width: 200, backgroundColor: "rgba(223,226,236,0.8)" }} />
      </div>
    );
  }

  if (isError || !enrollment) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", borderRadius: 12, padding: 32, textAlign: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#0e1528", marginBottom: 8 }}>
            Ready to participate?
          </p>
          <p style={{ fontSize: 14, color: "#8891a5", marginBottom: 16 }}>
            Click below to enroll in this hackathon event. You can only participate in one event at a time.
          </p>
          <button
            onClick={() => enroll()}
            disabled={enrolling}
            style={{ backgroundColor: "#38bdf8", padding: "10px 32px", color: "#ffffff", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", borderRadius: 8, opacity: enrolling ? 0.7 : 1 }}
          >
            {enrolling ? "Enrolling..." : "Enroll Now"}
          </button>
        </div>
      </div>
    );
  }

  const colors = statusColors[enrollment.status] ?? statusColors.PENDING;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)", borderRadius: 12, padding: 32 }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#0e1528" }}>Enrollment Status</span>
          <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 6, backgroundColor: colors.bg, color: colors.text }}>
            {enrollment.status}
          </span>
        </div>

        {enrollment.status === "PENDING" && (
          <p style={{ fontSize: 14, color: "#8891a5" }}>
            Your enrollment is pending approval from the organizers. You will be notified once it is reviewed.
          </p>
        )}

        {enrollment.status === "APPROVED" && (
          <p style={{ fontSize: 14, color: "#065f46" }}>
            You are approved! You can now create or join a team.
          </p>
        )}

        {enrollment.status === "REJECTED" && (
          <p style={{ fontSize: 14, color: "#991b1b" }}>
            Your enrollment was not approved. Contact the organizers for more information.
          </p>
        )}

        {(enrollment.status === "PENDING" || enrollment.status === "APPROVED") && (
          <button
            onClick={() => withdraw()}
            disabled={withdrawing}
            style={{ marginTop: 16, backgroundColor: "#ffffff", padding: "8px 20px", color: "#991b1b", fontSize: 13, fontWeight: 600, border: "1px solid #fecaca", cursor: "pointer", borderRadius: 8 }}
          >
            {withdrawing ? "Withdrawing..." : "Withdraw Enrollment"}
          </button>
        )}
      </div>
    </div>
  );
}
