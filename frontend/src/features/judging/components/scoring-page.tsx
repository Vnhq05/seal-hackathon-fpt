"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSubmissionScoring } from "@/features/judging/hooks/use-submission-scoring";
import { useSubmitScores } from "@/features/judging/hooks/use-submit-scores";
import { useSaveScoringDraft } from "@/features/judging/hooks/use-save-scoring-draft";
import { useScoreHistory } from "@/features/judging/hooks/use-score-history";
import { useRequestAdjustment } from "@/features/judging/hooks/use-request-adjustment";
import { ScoreHistoryCard } from "@/features/judging/components/score-history-card";
import {
  createScoringFormSchema,
  scoringFormSchema,
  type ScoringFormValues,
  needsCommentForScore,
  computeWeightedScore,
  computeMaxWeightedScore,
} from "@/features/judging/schemas/scoring.schema";
import { SEAL_SCORE_BUTTON_LABELS } from "@/features/judging/constants/scoring-scale";
import { usePortalBase } from "@/shared/hooks/use-portal-base";
import type { SubmissionForScoring } from "@/features/judging/types/judge.types";

function hasScore(score: number | null | undefined): score is number {
  return score != null;
}

function conflictMessage(reason: string | null): string {
  if (reason === "MENTOR_OF_TEAM") {
    return "You are a mentor for this team and cannot score this submission.";
  }
  return reason ?? "Conflict of interest — cannot score.";
}

function scoreValues(min: number, max: number): number[] {
  const values: number[] = [];
  for (let v = min; v <= max; v += 1) values.push(v);
  return values;
}

export function ScoringPage({ teamId, roundId }: { teamId: string; roundId: string }) {
  const router = useRouter();
  const portalBase = usePortalBase();
  const { data: submission, isLoading, error } = useSubmissionScoring(roundId, teamId);
  const submitMutation = useSubmitScores();
  const draftMutation = useSaveScoringDraft();
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const readOnly = submission?.isLocked ?? false;
  const completed = submission?.isCompleted ?? false;

  const defaultScores = useMemo(() => {
    if (!submission) return [];
    return submission.criteria.map((c) => {
      const existing = submission.existingScores?.find((s) => s.criterionId === c.id);
      return {
        criterionId: c.id,
        score: existing?.score ?? null,
        feedback: existing?.feedback ?? "",
      };
    });
  }, [submission]);

  const formSchema = useMemo(
    () =>
      submission?.criteria.length
        ? createScoringFormSchema(submission.criteria)
        : scoringFormSchema,
    [submission],
  );

  const { handleSubmit, setValue, reset, control } = useForm<ScoringFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { scores: defaultScores },
  });

  useEffect(() => {
    if (defaultScores.length > 0) reset({ scores: defaultScores });
  }, [defaultScores, reset]);

  const watchedScores = useWatch({ control, name: "scores" });

  const allScored = useMemo(() => {
    if (!submission) return false;
    return (watchedScores ?? []).every((s) => {
      if (!hasScore(s.score)) return false;
      const criterion = submission.criteria.find((c) => c.id === s.criterionId);
      if (!criterion) return false;
      return s.score >= criterion.minScore && s.score <= criterion.maxScore;
    });
  }, [watchedScores, submission]);

  const commentErrors = useMemo(() => {
    if (!submission) return [];
    return (watchedScores ?? []).map((s) => {
      const criterion = submission.criteria.find((c) => c.id === s.criterionId);
      if (!criterion || !hasScore(s.score)) return null;
      return needsCommentForScore(s.score, criterion.minScore, criterion.maxScore)
        && !s.feedback.trim()
        ? "Required when score is at minimum or maximum"
        : null;
    });
  }, [watchedScores, submission]);

  const totalWeighted = useMemo(() => {
    if (!submission) return 0;
    return (watchedScores ?? []).reduce((sum, s) => {
      if (!hasScore(s.score)) return sum;
      const criterion = submission.criteria.find((c) => c.id === s.criterionId);
      if (!criterion) return sum;
      return sum + computeWeightedScore(s.score, criterion.weight);
    }, 0);
  }, [watchedScores, submission]);

  const maxWeighted = useMemo(
    () => (submission ? computeMaxWeightedScore(submission.criteria) : 5),
    [submission],
  );

  const buildPayload = (values: ScoringFormValues, complete: boolean) => ({
    roundId,
    existingScoreId: submission?.judgeScoreId ?? undefined,
    body: {
      submissionId: submission!.id,
      complete,
      scores: values.scores
        .filter((s): s is typeof s & { score: number } => hasScore(s.score))
        .map((s) => ({
          criteriaId: s.criterionId,
          score: s.score,
          comment: s.feedback.trim() || undefined,
        })),
    },
  });

  const onComplete = handleSubmit((values) => {
    if (commentErrors.some(Boolean)) return;
    submitMutation.mutate(buildPayload(values, true), {
      onSuccess: () => router.push(`${portalBase}/scoring`),
    });
  });

  const onSaveDraft = useCallback(() => {
    if (!submission || readOnly || completed) return;
    const current = watchedScores ?? [];
    const hasAnyScore = current.some((s) => hasScore(s.score));
    if (!hasAnyScore) return;

    draftMutation.mutate(
      {
        roundId,
        existingScoreId: submission.judgeScoreId ?? undefined,
        body: {
          submissionId: submission.id,
          complete: false,
          scores: current
            .filter((s): s is typeof s & { score: number } => hasScore(s.score))
            .map((s) => ({
              criteriaId: s.criterionId,
              score: s.score,
              comment: s.feedback.trim() || undefined,
            })),
        },
      },
      { onSuccess: () => setLastSavedAt(new Date()) },
    );
  }, [submission, readOnly, completed, watchedScores, draftMutation, roundId]);

  useEffect(() => {
    if (readOnly || completed) return;
    const hasAnyScore = (watchedScores ?? []).some((s) => hasScore(s.score));
    if (!hasAnyScore) return;

    const id = setInterval(() => onSaveDraft(), 30_000);
    return () => clearInterval(id);
  }, [readOnly, completed, watchedScores, onSaveDraft]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-seal-cyan border-t-transparent" />
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="p-8 text-center text-sm text-red-600">
        {(error as Error)?.message ?? "Unable to load scoring data"}
      </div>
    );
  }

  if (!submission.isAssigned) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <p className="text-sm text-red-600">You are not assigned to score this team.</p>
        <Link href={`${portalBase}/scoring`} className="mt-4 inline-block text-sm font-semibold text-royal hover:underline">
          ← Back to list
        </Link>
      </div>
    );
  }

  if (submission.conflictOfInterest) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <p className="text-lg font-semibold text-red-700">Conflict of interest</p>
        <p className="mt-2 text-sm text-seal-text-secondary">
          {conflictMessage(submission.conflictReason)}
        </p>
        <Link href={`${portalBase}/scoring`} className="mt-4 inline-block text-sm font-semibold text-royal hover:underline">
          ← Back to list
        </Link>
      </div>
    );
  }

  return (
    <ScoringPageContent
      submission={submission}
      watchedScores={watchedScores}
      totalWeighted={totalWeighted}
      maxWeighted={maxWeighted}
      commentErrors={commentErrors}
      allScored={allScored}
      readOnly={readOnly}
      completed={completed}
      onComplete={onComplete}
      onSaveDraft={onSaveDraft}
      onScoreChange={(i, v) => setValue(`scores.${i}.score`, v, { shouldValidate: true })}
      onFeedbackChange={(i, v) => setValue(`scores.${i}.feedback`, v)}
      isSubmitting={submitMutation.isPending}
      isSaving={draftMutation.isPending}
      lastSavedAt={lastSavedAt}
    />
  );
}

import { SCORE_REVIEW_ADJUSTMENT_CONFLICT_MESSAGE } from "@/lib/api/score-review.api";

function ScoringPageContent({
  submission,
  watchedScores,
  totalWeighted,
  maxWeighted,
  commentErrors,
  allScored,
  readOnly,
  completed,
  onComplete,
  onSaveDraft,
  onScoreChange,
  onFeedbackChange,
  isSubmitting,
  isSaving,
  lastSavedAt,
}: {
  submission: SubmissionForScoring;
  watchedScores: ScoringFormValues["scores"];
  totalWeighted: number;
  maxWeighted: number;
  commentErrors: (string | null)[];
  allScored: boolean;
  readOnly: boolean;
  completed: boolean;
  onComplete: () => void;
  onSaveDraft: () => void;
  onScoreChange: (index: number, value: number | null) => void;
  onFeedbackChange: (index: number, value: string) => void;
  isSubmitting: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
}) {
  const disabled = readOnly || completed;
  const { data: historyData } = useScoreHistory();
  const roundHistory = (historyData?.data ?? []).filter(
    (e) => e.roundId === submission.roundId,
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const [adjustmentFormOpen, setAdjustmentFormOpen] = useState(false);
  const [adjustmentNote, setAdjustmentNote] = useState("");
  const [adjustmentBanner, setAdjustmentBanner] = useState<{
    type: "success" | "conflict" | "error";
    message: string;
  } | null>(null);
  const { mutate: requestAdjustment, isPending: isRequestingAdjustment } =
    useRequestAdjustment(submission.eventId);

  const handleSubmitAdjustment = () => {
    const note = adjustmentNote.trim();
    if (!submission.eventId || note.length < 10) return;

    setAdjustmentBanner(null);
    requestAdjustment(
      { submissionId: submission.id, note },
      {
        onSuccess: () => {
          setAdjustmentFormOpen(false);
          setAdjustmentNote("");
          setAdjustmentBanner({
            type: "success",
            message:
              "Adjustment request submitted. The coordinator will review the deviation.",
          });
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : "Request failed.";
          if (message === SCORE_REVIEW_ADJUSTMENT_CONFLICT_MESSAGE) {
            setAdjustmentBanner({ type: "conflict", message });
          } else {
            setAdjustmentBanner({ type: "error", message });
          }
        },
      },
    );
  };

  return (
    <form onSubmit={onComplete} className="mx-auto max-w-4xl flex flex-col gap-6 p-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-seal-text">{submission.teamName}</h1>
          {completed && (
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              Completed
            </span>
          )}
          {readOnly && (
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
              Locked
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-seal-text-secondary">
          {submission.trackName && <span>{submission.trackName} · </span>}
          {submission.roundName}
          {submission.hackathonName && ` · ${submission.hackathonName}`}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(submission.sourceCodeUrl ?? submission.githubUrl) && (
          <a
            href={submission.sourceCodeUrl ?? submission.githubUrl ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="border-2 border-navy bg-white p-3 text-sm font-medium text-royal shadow-[4px_4px_0_0_#0c1228] hover:bg-seal-surface-sunken"
          >
            Source Code →
          </a>
        )}
        {submission.slideUrl && (
          <a
            href={submission.slideUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border-2 border-navy bg-white p-3 text-sm font-medium text-royal shadow-[4px_4px_0_0_#0c1228] hover:bg-seal-surface-sunken"
          >
            Slide Deck →
          </a>
        )}
        {submission.demoUrl && (
          <a
            href={submission.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border-2 border-navy bg-white p-3 text-sm font-medium text-royal shadow-[4px_4px_0_0_#0c1228] hover:bg-seal-surface-sunken"
          >
            Demo Video →
          </a>
        )}
      </div>

      {submission.pdfUrl && (
        <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-4">
          <div className="mb-2 text-xs font-medium text-seal-text-muted">
            PDF: {submission.pdfFileName ?? "Submission"}
          </div>
          <iframe
            src={submission.pdfUrl}
            title="Submission PDF"
            className="h-[480px] w-full rounded border border-seal-border"
          />
        </div>
      )}

      <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <table className="w-full text-left text-sm">
          <thead className="bg-seal-surface-elevated text-xs font-semibold uppercase text-seal-text-muted">
            <tr>
              <th className="px-4 py-3">Criterion</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Comment</th>
            </tr>
          </thead>
          <tbody>
            {submission.criteria.map((c, i) => {
              const score = watchedScores?.[i]?.score ?? null;
              const feedback = watchedScores?.[i]?.feedback ?? "";
              const commentRequired =
                hasScore(score) && needsCommentForScore(score, c.minScore, c.maxScore);
              const hideComment = disabled && !feedback.trim();

              return (
                <tr key={c.id} className="border-t border-seal-border align-top">
                  <td className="px-4 py-3 font-medium text-seal-text">
                    {c.name} — {c.weight}%
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {scoreValues(c.minScore, c.maxScore).map((value) => {
                        const isActive = score === value;
                        const label = SEAL_SCORE_BUTTON_LABELS[value] ?? String(value);
                        return (
                          <button
                            key={value}
                            type="button"
                            disabled={disabled}
                            onClick={() => onScoreChange(i, value)}
                            className={`rounded border px-2 py-1 text-xs font-medium transition-colors ${
                              isActive
                                ? "border-seal-cyan bg-seal-cyan/10 text-seal-text"
                                : "border-seal-border text-seal-text-secondary hover:border-seal-cyan/50"
                            } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                          >
                            {value} {label}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {!hideComment && (
                      <div>
                        {commentRequired && !feedback.trim() && (
                          <label className="mb-1 block text-xs font-medium text-red-600">
                            Required *
                          </label>
                        )}
                        <textarea
                          rows={2}
                          disabled={disabled}
                          value={feedback}
                          onChange={(e) => onFeedbackChange(i, e.target.value)}
                          placeholder="Comment"
                          className={`w-full rounded border px-2 py-1 text-xs disabled:opacity-50 ${
                            commentRequired && !feedback.trim()
                              ? "border-red-400 ring-2 ring-red-400"
                              : "border-seal-border"
                          }`}
                        />
                      </div>
                    )}
                    {commentErrors[i] && (
                      <p className="mt-1 text-xs text-red-600">{commentErrors[i]}</p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-4">
        <div>
          <div className="text-xs text-seal-text-muted">Weighted total score</div>
          <div className="text-2xl font-bold text-seal-text">
            {totalWeighted.toFixed(2)}
            <span className="text-sm font-normal text-seal-text-muted"> / {maxWeighted.toFixed(1)}</span>
          </div>
        </div>
        {!disabled && (
          <div className="flex items-center gap-3">
            {lastSavedAt && (
              <span className="text-xs text-seal-text-muted">
                Last saved {lastSavedAt.toLocaleTimeString()}
              </span>
            )}
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={isSaving}
              className="border-2 border-navy bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save draft"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !allScored || commentErrors.some(Boolean)}
              className="border-2 border-navy bg-seal-yellow px-4 py-2 text-navy font-mono font-bold shadow-[4px_4px_0_0_#0c1228] disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Complete"}
            </button>
          </div>
        )}
      </div>

      {completed && (
        <div className="flex flex-col gap-3 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228] p-4">
          {adjustmentBanner && (
            <div
              className={`rounded px-3 py-2 text-sm ${
                adjustmentBanner.type === "success"
                  ? "bg-emerald-50 text-emerald-800"
                  : adjustmentBanner.type === "conflict"
                    ? "bg-amber-50 text-amber-800"
                    : "bg-red-50 text-red-700"
              }`}
            >
              {adjustmentBanner.message}
            </div>
          )}

          {!adjustmentFormOpen ? (
            <button
              type="button"
              onClick={() => {
                setAdjustmentBanner(null);
                setAdjustmentFormOpen(true);
              }}
              className="self-start border-2 border-navy bg-white px-4 py-2 text-sm font-semibold text-seal-text hover:bg-seal-surface-sunken"
            >
              Request Adjustment
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-seal-text">
                Reason for adjustment request
              </label>
              <textarea
                rows={4}
                value={adjustmentNote}
                onChange={(e) => setAdjustmentNote(e.target.value)}
                placeholder="Describe why the coordinator should re-examine these scores (min 10 characters)"
                className="w-full rounded border border-seal-border px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={
                    isRequestingAdjustment ||
                    !submission.eventId ||
                    adjustmentNote.trim().length < 10
                  }
                  onClick={handleSubmitAdjustment}
                  className="border-2 border-navy bg-amber-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isRequestingAdjustment ? "Submitting..." : "Submit Request"}
                </button>
                <button
                  type="button"
                  disabled={isRequestingAdjustment}
                  onClick={() => {
                    setAdjustmentFormOpen(false);
                    setAdjustmentNote("");
                  }}
                  className="border-2 border-navy bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <button
          type="button"
          onClick={() => setHistoryOpen((open) => !open)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-seal-text hover:bg-seal-surface-sunken"
        >
          <span>Judge&apos;s score history for this event</span>
          <span className="text-seal-text-muted">{historyOpen ? "▲" : "▼"}</span>
        </button>
        {historyOpen && (
          <div className="border-t border-seal-border px-4 py-4">
            {roundHistory.length === 0 ? (
              <p className="text-sm text-seal-text-muted">No completed scores in this round yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {roundHistory.map((entry) => (
                  <ScoreHistoryCard key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
