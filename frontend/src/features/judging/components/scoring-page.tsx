"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSubmissionScoring } from "@/features/judging/hooks/use-submission-scoring";
import { useSubmitScores } from "@/features/judging/hooks/use-submit-scores";
import { useSaveScoringDraft } from "@/features/judging/hooks/use-save-scoring-draft";
import { scoringFormSchema, type ScoringFormValues } from "@/features/judging/schemas/scoring.schema";
import { ScoringCriterionCard } from "@/features/judging/components/scoring-criterion-card";
import type { SubmissionForScoring } from "@/features/judging/types/judge.types";

const footerStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderTop: "1px solid rgba(223,226,236,0.8)",
  padding: 16,
  position: "sticky",
  bottom: 0,
  zIndex: 10,
};

function SkeletonBlock({ height }: { height: number }) {
  return (
    <div className="animate-pulse rounded-lg" style={{ height, backgroundColor: "rgba(223,226,236,0.8)" }} />
  );
}

/* ── Countdown ── */

function useCountdown(deadline: string) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    const calc = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Time expired");
        return;
      }
      const hrs = Math.floor(diff / 3_600_000);
      const mins = Math.floor((diff % 3_600_000) / 60_000);
      setRemaining(`${hrs}h ${mins}m remaining`);
    };
    calc();
    const id = setInterval(calc, 60_000);
    return () => clearInterval(id);
  }, [deadline]);
  return remaining;
}

/* ── Submission Links ── */

function SubmissionLinks({ submission }: { submission: SubmissionForScoring }) {
  if (submission.links.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2" style={{ marginBottom: 16 }}>
      {submission.links.map((link) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md"
          style={{
            backgroundColor: "#ffffff",
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 500,
            color: "#38bdf8",
            textDecoration: "none",
          }}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

/* ── Footer Mini Table ── */

function FooterBreakdown({
  criteria,
  scores,
}: {
  criteria: SubmissionForScoring["criteria"];
  scores: { criterionId: string; score: number }[];
}) {
  return (
    <div className="flex gap-3">
      {criteria.map((c) => {
        const entry = scores.find((s) => s.criterionId === c.id);
        const val = entry ? (entry.score * c.weight) / 100 : 0;
        const shortName =
          c.name.length > 6 ? c.name.slice(0, 5) + "." : c.name;
        return (
          <div key={c.id} style={{ textAlign: "center" }}>
            <p style={{ fontSize: 10, color: "#8891a5", marginBottom: 2 }}>{shortName}</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0e1528" }}>
              {val.toFixed(1)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Page ── */

export function ScoringPage({ roundId, submissionId }: { roundId: string; submissionId: string }) {
  const router = useRouter();
  const { data: submission, isLoading } = useSubmissionScoring(roundId, submissionId);
  const submitMutation = useSubmitScores();
  const draftMutation = useSaveScoringDraft();

  const defaultScores = useMemo(() => {
    if (!submission) return [];
    return submission.criteria.map((c) => {
      const existing = submission.existingScores?.find((s) => s.criterionId === c.id);
      return {
        criterionId: c.id,
        score: existing?.score ?? 0,
        feedback: existing?.feedback ?? "",
      };
    });
  }, [submission]);

  const { handleSubmit, setValue, watch, reset } = useForm<ScoringFormValues>({
    resolver: zodResolver(scoringFormSchema),
    defaultValues: { scores: defaultScores },
  });

  useEffect(() => {
    if (defaultScores.length > 0) {
      reset({ scores: defaultScores });
    }
  }, [defaultScores, reset]);

  const watchedScores = watch("scores");

  const totalWeighted = useMemo(() => {
    if (!submission) return 0;
    return (watchedScores ?? []).reduce((sum, s) => {
      const criterion = submission.criteria.find((c) => c.id === s.criterionId);
      if (!criterion) return sum;
      return sum + (s.score * criterion.weight) / 100;
    }, 0);
  }, [watchedScores, submission]);

  const handleScoreChange = useCallback(
    (index: number, value: number) => {
      setValue(`scores.${index}.score`, value, { shouldValidate: true });
    },
    [setValue],
  );

  const handleFeedbackChange = useCallback(
    (index: number, value: string) => {
      setValue(`scores.${index}.feedback`, value);
    },
    [setValue],
  );

  const onSubmit = handleSubmit((values) => {
    submitMutation.mutate(
      {
        roundId,
        body: {
          submissionId,
          scores: values.scores.map((s) => ({
            criteriaId: s.criterionId,
            score: s.score,
            comment: s.feedback || undefined,
          })),
        },
      },
      {
        onSuccess: () => {
          router.push(`/judge/rounds/${roundId}`);
        },
      },
    );
  });

  const onSaveDraft = () => {
    const current = watchedScores ?? [];
    draftMutation.mutate({
      roundId,
      body: {
        submissionId,
        scores: current.map((s) => ({
          criteriaId: s.criterionId,
          score: s.score,
          comment: s.feedback || undefined,
        })),
      },
    });
  };

  if (isLoading || !submission) {
    return (
      <div className="flex flex-col gap-4" style={{ padding: 32 }}>
        <SkeletonBlock height={48} />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} height={200} />
        ))}
        <SkeletonBlock height={64} />
      </div>
    );
  }

  return (
    <ScoringPageContent
      submission={submission}
      watchedScores={watchedScores}
      totalWeighted={totalWeighted}
      onSubmit={onSubmit}
      onSaveDraft={onSaveDraft}
      onScoreChange={handleScoreChange}
      onFeedbackChange={handleFeedbackChange}
      isSubmitting={submitMutation.isPending}
      isSaving={draftMutation.isPending}
    />
  );
}

/* ── Inner content (kept under 200 lines in separate render) ── */

function ScoringPageContent({
  submission,
  watchedScores,
  totalWeighted,
  onSubmit,
  onSaveDraft,
  onScoreChange,
  onFeedbackChange,
  isSubmitting,
  isSaving,
}: {
  submission: SubmissionForScoring;
  watchedScores: ScoringFormValues["scores"];
  totalWeighted: number;
  onSubmit: () => void;
  onSaveDraft: () => void;
  onScoreChange: (index: number, value: number) => void;
  onFeedbackChange: (index: number, value: string) => void;
  isSubmitting: boolean;
  isSaving: boolean;
}) {
  const remaining = useCountdown(submission.deadline);

  return (
    <form onSubmit={onSubmit} className="flex flex-col" style={{ minHeight: "100%" }}>
      <div className="flex-1" style={{ padding: 32 }}>
        {/* Header */}
        <div className="flex items-center gap-3" style={{ marginBottom: 4 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.24px" }}>
            {submission.teamName}
          </h1>
          <span
            className="rounded-md"
            style={{
              backgroundColor: "#eef2ff",
              color: "#38bdf8",
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Scoring
          </span>
          {submission.isDraft && (
            <span
              className="rounded-md"
              style={{
                backgroundColor: "#fef3c7",
                color: "#92400e",
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Draft
            </span>
          )}
        </div>
        <p style={{ fontSize: 14, color: "#2dd4bf", marginBottom: 4 }}>
          {submission.roundName} &middot; {submission.hackathonName}
        </p>
        <p style={{ fontSize: 13, color: "#ef4444", fontWeight: 600, marginBottom: 16 }}>
          {remaining}
        </p>

        <p style={{ fontSize: 14, color: "#0e1528", lineHeight: "21px", marginBottom: 16 }}>
          Evaluate the team&apos;s submission based on predefined criteria below.
        </p>

        <SubmissionLinks submission={submission} />

        {/* Criterion Cards */}
        <div className="flex flex-col gap-4">
          {submission.criteria.map((c, i) => (
            <ScoringCriterionCard
              key={c.id}
              criterion={c}
              score={watchedScores?.[i]?.score ?? 0}
              feedback={watchedScores?.[i]?.feedback ?? ""}
              onScoreChange={(val) => onScoreChange(i, val)}
              onFeedbackChange={(val) => onFeedbackChange(i, val)}
            />
          ))}
        </div>
      </div>

      {/* Sticky Footer */}
      <div style={footerStyle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p style={{ fontSize: 12, color: "#2dd4bf", marginBottom: 2 }}>Total Weighted Score</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#0e1528" }}>
                {totalWeighted.toFixed(2)}
                <span style={{ fontSize: 14, fontWeight: 400, color: "#8891a5" }}>/100</span>
              </p>
            </div>
            <FooterBreakdown criteria={submission.criteria} scores={watchedScores ?? []} />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={isSaving}
              className="rounded-lg"
              style={{
                padding: "10px 24px",
                fontSize: 13,
                fontWeight: 600,
                border: "1px solid rgba(223,226,236,0.8)",
                backgroundColor: "#ffffff",
                color: "#0e1528",
                cursor: "pointer",
                opacity: isSaving ? 0.6 : 1,
              }}
            >
              {isSaving ? "Saving..." : "Save draft"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg"
              style={{
                padding: "10px 24px",
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                backgroundColor: "#38bdf8",
                color: "#0e1528",
                cursor: "pointer",
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit scores"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
