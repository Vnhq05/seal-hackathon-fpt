"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSubmissionScoring } from "@/features/judging/hooks/use-submission-scoring";
import { useSubmitScores } from "@/features/judging/hooks/use-submit-scores";
import { useSaveScoringDraft } from "@/features/judging/hooks/use-save-scoring-draft";
import {
  createScoringFormSchema,
  scoringFormSchema,
  type ScoringFormValues,
  needsCommentForScore,
  computeWeightedScore,
  computeMaxWeightedScore,
} from "@/features/judging/schemas/scoring.schema";
import { getScoreLabel } from "@/features/judging/constants/scoring-scale";
import { usePortalBase } from "@/shared/hooks/use-portal-base";
import type { SubmissionForScoring } from "@/features/judging/types/judge.types";

function hasScore(score: number | null | undefined): score is number {
  return score != null;
}

function conflictMessage(reason: string | null): string {
  if (reason === "MENTOR_OF_TEAM") {
    return "Bạn là mentor của team này nên không thể chấm điểm bài nộp.";
  }
  return reason ?? "Xung đột lợi ích — không thể chấm điểm.";
}

export function ScoringPage({ teamId, roundId }: { teamId: string; roundId: string }) {
  const router = useRouter();
  const portalBase = usePortalBase();
  const { data: submission, isLoading, error } = useSubmissionScoring(roundId, teamId);
  const submitMutation = useSubmitScores();
  const draftMutation = useSaveScoringDraft();

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
        ? "Bắt buộc khi điểm ở mức tối thiểu hoặc tối đa"
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

  const onSaveDraft = () => {
    if (!submission) return;
    const current = watchedScores ?? [];
    draftMutation.mutate({
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
    });
  };

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
        {(error as Error)?.message ?? "Không tải được dữ liệu chấm điểm"}
      </div>
    );
  }

  if (!submission.isAssigned) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <p className="text-sm text-red-600">Bạn không được phân công chấm team này.</p>
        <Link href={`${portalBase}/scoring`} className="mt-4 inline-block text-sm font-semibold text-royal hover:underline">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  if (submission.conflictOfInterest) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <p className="text-lg font-semibold text-red-700">Xung đột lợi ích</p>
        <p className="mt-2 text-sm text-seal-text-secondary">
          {conflictMessage(submission.conflictReason)}
        </p>
        <Link href={`${portalBase}/scoring`} className="mt-4 inline-block text-sm font-semibold text-royal hover:underline">
          ← Quay lại danh sách
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
    />
  );
}

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
}) {
  const disabled = readOnly || completed;

  return (
    <form onSubmit={onComplete} className="mx-auto max-w-4xl flex flex-col gap-6 p-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-seal-text">{submission.teamName}</h1>
          {completed && (
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              Đã hoàn tất
            </span>
          )}
          {readOnly && (
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
              Đã khóa
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
              <th className="px-4 py-3">Tiêu chí</th>
              <th className="px-4 py-3 w-24">Trọng số</th>
              <th className="px-4 py-3 w-28">Điểm</th>
              <th className="px-4 py-3">Nhận xét</th>
            </tr>
          </thead>
          <tbody>
            {submission.criteria.map((c, i) => {
              const score = watchedScores?.[i]?.score ?? null;
              const showComment =
                hasScore(score) && needsCommentForScore(score, c.minScore, c.maxScore);
              return (
                <tr key={c.id} className="border-t border-seal-border align-top">
                  <td className="px-4 py-3 font-medium text-seal-text">
                    {c.name}
                    {hasScore(score) && getScoreLabel(score) && (
                      <span className="ml-2 text-xs font-normal text-seal-text-muted">
                        ({getScoreLabel(score)})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-seal-text-secondary">{c.weight}%</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={c.minScore}
                      max={c.maxScore}
                      disabled={disabled}
                      value={hasScore(score) ? score : ""}
                      onChange={(e) => {
                        const v = e.target.value === "" ? null : Number(e.target.value);
                        onScoreChange(
                          i,
                          v == null
                            ? null
                            : Math.min(c.maxScore, Math.max(c.minScore, v)),
                        );
                      }}
                      className="w-20 rounded border border-seal-border px-2 py-1 text-center disabled:opacity-50"
                    />
                    <span className="ml-1 text-xs text-seal-text-muted">
                      ({c.minScore}–{c.maxScore})
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {(showComment || (watchedScores?.[i]?.feedback ?? "")) && (
                      <textarea
                        rows={2}
                        disabled={disabled}
                        value={watchedScores?.[i]?.feedback ?? ""}
                        onChange={(e) => onFeedbackChange(i, e.target.value)}
                        placeholder={showComment ? "Bắt buộc *" : "Nhận xét"}
                        className={`w-full rounded border px-2 py-1 text-xs disabled:opacity-50 ${
                          showComment && !watchedScores?.[i]?.feedback.trim()
                            ? "border-red-400"
                            : "border-seal-border"
                        }`}
                      />
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
          <div className="text-xs text-seal-text-muted">Tổng điểm có trọng số</div>
          <div className="text-2xl font-bold text-seal-text">
            {totalWeighted.toFixed(2)}
            <span className="text-sm font-normal text-seal-text-muted"> / {maxWeighted.toFixed(1)}</span>
          </div>
        </div>
        {!disabled && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={isSaving}
              className="border-2 border-navy bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {isSaving ? "Đang lưu..." : "Lưu nháp"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !allScored || commentErrors.some(Boolean)}
              className="border-2 border-navy bg-seal-yellow px-4 py-2 text-navy font-mono font-bold shadow-[4px_4px_0_0_#0c1228] disabled:opacity-50"
            >
              {isSubmitting ? "Đang gửi..." : "Complete"}
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
