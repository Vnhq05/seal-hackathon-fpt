"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventApi } from "@/lib/api/event.api";
import { enrollmentApi, type EnrollmentResponse } from "@/lib/api/enrollment.api";

export function EnrollmentApprovalPage() {
  const queryClient = useQueryClient();
  const [eventId, setEventId] = useState<string>("");
  const [feedback, setFeedback] = useState<{ type: "success" | "warning" | "error"; text: string } | null>(null);

  const { data: events = [] } = useQuery({
    queryKey: ["coordinator-events"],
    queryFn: () => eventApi.list({ page: 0, size: 50 }).then((p) => p.content),
  });

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ["coordinator-enrollments", eventId],
    queryFn: () => enrollmentApi.list(eventId, { status: "PENDING" }),
    enabled: Boolean(eventId),
  });

  const approveMutation = useMutation({
    mutationFn: (enrollmentId: string) => enrollmentApi.approve(eventId, enrollmentId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["coordinator-enrollments", eventId] });
      const isWarning = result.message.toLowerCase().includes("email delivery failed");
      setFeedback({ type: isWarning ? "warning" : "success", text: result.message });
    },
    onError: (err) => {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Approve failed" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (enrollmentId: string) => enrollmentApi.reject(eventId, enrollmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coordinator-enrollments", eventId] }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-seal-text">Enrollment Approval</h1>
        <p className="mt-1 text-sm text-seal-text-muted">
          Review and approve event enrollment requests from students.
        </p>
      </div>

      <div className="border-2 border-navy bg-white p-5 shadow-[4px_4px_0_0_#0c1228]">
        <label className="mb-2 block text-sm font-medium text-seal-text">Select event</label>
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="w-full max-w-md border-2 border-navy bg-white px-3 py-2 text-sm text-seal-text outline-none focus:border-royal"
        >
          <option value="">Choose an event...</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
      </div>

      {feedback && (
        <div
          className={`rounded border px-4 py-3 text-sm ${
            feedback.type === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : feedback.type === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {!eventId ? (
        <p className="text-sm text-seal-text-muted">Select an event to view pending enrollments.</p>
      ) : isLoading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-royal border-t-transparent" />
        </div>
      ) : enrollments.length === 0 ? (
        <p className="text-sm text-seal-text-muted">No pending enrollments for this event.</p>
      ) : (
        <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
          <table className="w-full text-left text-sm">
            <thead className="bg-seal-bg text-seal-text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Student ID</th>
                <th className="px-4 py-3 font-semibold">University</th>
                <th className="px-4 py-3 font-semibold">Requested</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((row: EnrollmentResponse) => (
                <tr key={row.id} className="border-t border-seal-border/30">
                  <td className="px-4 py-3 font-medium text-seal-text">{row.userFullName}</td>
                  <td className="px-4 py-3 text-seal-text-muted">{row.userEmail}</td>
                  <td className="px-4 py-3 text-seal-text-muted">{row.userStudentId ?? "—"}</td>
                  <td className="px-4 py-3 text-seal-text-muted">{row.userUniversityName ?? "—"}</td>
                  <td className="px-4 py-3 text-seal-text-muted">
                    {new Date(row.enrolledAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => approveMutation.mutate(row.id)}
                        disabled={approveMutation.isPending}
                        className="border-2 border-navy bg-seal-yellow px-3 py-1.5 text-xs text-navy font-mono font-bold shadow-[4px_4px_0_0_#0c1228] disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectMutation.mutate(row.id)}
                        disabled={rejectMutation.isPending}
                        className="border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
