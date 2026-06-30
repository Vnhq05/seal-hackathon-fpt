"use client";

import { useMemo, useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMyParticipantFeedback,
  useSubmitParticipantFeedback,
} from "@/features/feedback/hooks/use-participant-feedback";
import {
  participantFeedbackSchema,
  type ParticipantFeedbackFormValues,
} from "@/features/feedback/schemas/participant-feedback.schema";
import { useMyTeamsAllEvents } from "@/features/teams/hooks/use-my-teams-all-events";
import type { ParticipantFeedbackResponse } from "@/lib/api/participant-feedback.api";

const RATING_LABELS: Record<number, string> = {
  1: "Very Poor",
  2: "Poor",
  3: "Fair",
  4: "Good",
  5: "Excellent",
};

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#0e1528",
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 8,
  padding: "11px 16px",
  fontSize: 14,
  width: "100%",
  outline: "none",
};

const errorStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#dc2626",
  marginTop: 4,
};

function LoadingSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function FeedbackInfoCard({ message }: { message: string }) {
  return (
    <div className="rounded-lg border-2 border-navy bg-white p-6 text-sm text-seal-text-secondary shadow-[3px_3px_0_0_#0c1228]">
      {message}
    </div>
  );
}

function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange?: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange?.(star)}
          className={`text-2xl transition ${disabled ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
          aria-label={`${star} stars`}
        >
          {star <= value ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}

function ReadOnlyFeedbackView({ feedback }: { feedback: ParticipantFeedbackResponse }) {
  return (
    <div className="space-y-4 border-2 border-navy bg-white p-6 shadow-[3px_3px_0_0_#0c1228]">
      <div className="rounded-md bg-royal px-4 py-3 text-sm font-semibold text-white">
        Thank you for your feedback
      </div>
      <div>
        <p className="text-sm text-seal-text-muted">Overall rating</p>
        <div className="mt-1 flex items-center gap-3">
          <StarRating value={feedback.overallRating} disabled />
          <span className="text-sm font-semibold text-navy">
            {feedback.overallRating}/5
          </span>
          <span className="text-sm text-seal-text-secondary">
            {RATING_LABELS[feedback.overallRating]}
          </span>
        </div>
      </div>
      {feedback.comment && (
        <div>
          <p className="text-sm text-seal-text-muted">Comment</p>
          <p className="mt-1 text-sm text-navy">{feedback.comment}</p>
        </div>
      )}
      <p className="text-xs text-seal-text-muted">
        Submitted at {new Date(feedback.submittedAt).toLocaleString()}
      </p>
    </div>
  );
}

function FeedbackSubmissionForm({
  eventId,
  eventName,
}: {
  eventId: string;
  eventName: string;
}) {
  const { mutate: submit, isPending } = useSubmitParticipantFeedback(eventId);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ParticipantFeedbackFormValues>({
    resolver: zodResolver(participantFeedbackSchema),
    defaultValues: { overallRating: 0, comment: "" },
  });

  const rating = useWatch({ control, name: "overallRating" });
  const comment = useWatch({ control, name: "comment" }) ?? "";

  const onSubmit = (data: ParticipantFeedbackFormValues) => {
    setSubmitError(null);
    submit(
      {
        overallRating: data.overallRating,
        comment: data.comment?.trim() || undefined,
      },
      {
        onError: (err: Error) => setSubmitError(err.message || "Unable to submit feedback."),
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 border-2 border-navy bg-white p-6 shadow-[3px_3px_0_0_#0c1228]"
    >
      <div>
        <label style={labelStyle}>Overall rating (1–5 stars) *</label>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <Controller
            name="overallRating"
            control={control}
            render={({ field }) => (
              <StarRating value={field.value} onChange={field.onChange} />
            )}
          />
          {rating >= 1 && (
            <span className="text-sm font-medium text-seal-text-secondary">
              {RATING_LABELS[rating]}
            </span>
          )}
        </div>
        {errors.overallRating && (
          <p style={errorStyle}>{errors.overallRating.message}</p>
        )}
      </div>

      <div>
        <label style={labelStyle}>Comment (optional)</label>
        <textarea
          {...register("comment")}
          placeholder={`Share your experience about ${eventName}...`}
          rows={5}
          maxLength={2000}
          style={{ ...inputStyle, resize: "vertical" }}
        />
        <div className="mt-1 flex items-center justify-between">
          {errors.comment ? (
            <p style={errorStyle}>{errors.comment.message}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-seal-text-muted">{comment.length}/2000</span>
        </div>
      </div>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 border-2 border-navy bg-royal px-4 py-3 text-sm font-semibold text-white shadow-[3px_3px_0_0_#0c1228] transition hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_0_#0c1228] disabled:opacity-60"
      >
        {isPending && <LoadingSpinner />}
        {isPending ? "Submitting..." : "Submit feedback"}
      </button>
    </form>
  );
}

export function ParticipantFeedbackPage() {
  const { data: memberships, isLoading: membershipsLoading } = useMyTeamsAllEvents();

  const activeMembership = useMemo(() => {
    if (!memberships?.length) return null;
    const sealCompleted = memberships.find(
      (m) => m.event.competitionFormat === "SEAL_RAG_2026" && m.event.status === "COMPLETED",
    );
    if (sealCompleted) return sealCompleted;
    const completed = memberships.find((m) => m.event.status === "COMPLETED");
    if (completed) return completed;
    return (
      memberships.find((m) => m.event.competitionFormat === "SEAL_RAG_2026") ?? memberships[0]
    );
  }, [memberships]);

  const sealEvent = activeMembership?.event ?? null;
  const team = activeMembership?.team ?? null;
  const eventId = sealEvent?.id ?? "";

  const { data: existing, isLoading: feedbackLoading } = useMyParticipantFeedback(eventId);

  const loading = membershipsLoading || (!!eventId && feedbackLoading);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      );
    }

    if (!sealEvent) {
      return <FeedbackInfoCard message="No event found" />;
    }

    if (sealEvent.status !== "COMPLETED") {
      return <FeedbackInfoCard message="Feedback opens when the event ends" />;
    }

    if (!team || team.status !== "CONFIRMED") {
      return <FeedbackInfoCard message="You must be on a confirmed team" />;
    }

    if (existing) {
      return <ReadOnlyFeedbackView feedback={existing} />;
    }

    return <FeedbackSubmissionForm eventId={eventId} eventName={sealEvent.name} />;
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Post-Event Feedback</h1>
        {sealEvent && <p className="text-sm text-seal-text-secondary">{sealEvent.name}</p>}
      </div>
      {renderContent()}
    </div>
  );
}
