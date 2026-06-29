"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  submitProjectSchema,
  type SubmitProjectFormValues,
} from "@/features/submissions/schemas/submit-project.schema";
import { useSubmitProject } from "@/features/submissions/hooks/use-submit-project";
import { useGitHubRepo } from "@/features/submissions/hooks/use-github-repo";
import { GitHubRepoPreview } from "@/features/submissions/components/github-repo-preview";
import { validatePdfFile } from "@/features/submissions/utils/round.utils";

/* ── Icons ─────────────────────────────────────────────────── */

function RocketIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.17-.09-2.91a2.18 2.18 0 00-2.91-.09zM12 15l-3-3M22 2l-7.5 7.5"
        stroke="#38bdf8"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.41 14.59L2 22M14.5 9.5l5.5-5.5M22 2l-1 7.5-6.5 6.5-7-7L14 2.5 22 2z"
        stroke="#38bdf8"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Styles ────────────────────────────────────────────────── */

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "#0e1528",
  letterSpacing: "0.24px",
  lineHeight: "12px",
  marginBottom: 6,
  display: "block",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid rgba(223,226,236,0.8)",
  borderRadius: 4,
  padding: "11.5px 9px",
  fontSize: 14,
  color: "#0e1528",
  lineHeight: "20px",
  outline: "none",
  backgroundColor: "#ffffff",
  boxSizing: "border-box",
};

const errorStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#dc2626",
  marginTop: 4,
};

/* ── Component ─────────────────────────────────────────────── */

interface SubmitProjectFormProps {
  roundId: string;
  roundName?: string;
}

export function SubmitProjectForm({ roundId, roundName }: SubmitProjectFormProps) {
  const router = useRouter();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SubmitProjectFormValues>({
    resolver: zodResolver(submitProjectSchema),
    defaultValues: {
      repositoryUrl: "",
      demoUrl: "",
    },
  });

  const {
    submit,
    isSubmitting,
    isSubmitError,
    submitError,
  } = useSubmitProject();

  const repositoryUrl = useWatch({ control, name: "repositoryUrl" });
  const { data: repoInfo, isLoading: isLoadingRepo } =
    useGitHubRepo(repositoryUrl);

  const isBusy = isSubmitting;

  const onSubmit = (values: SubmitProjectFormValues) => {
    if (!pdfFile) return;
    const err = validatePdfFile(pdfFile);
    if (err) {
      setPdfError(err);
      return;
    }
    setPdfError(null);
    submit({
      roundId,
      request: {
        sourceCodeUrl: values.repositoryUrl,
        demoUrl: values.demoUrl,
      },
      pdfFile,
    });
  };

  const activeError = isSubmitError ? submitError : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <RocketIcon />
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "#0e1528",
              lineHeight: "32px",
              margin: 0,
            }}
          >
            Submit Project
          </h1>
        </div>
        <p
          style={{
            fontSize: 14,
            color: "#8891a5",
            lineHeight: "20px",
            margin: 0,
          }}
        >
          {roundName ?? `Round ${roundId}`}
        </p>
      </div>

      {/* Repository URL */}
      <div>
        <label style={labelStyle}>
          Repository URL <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <input
          type="url"
          placeholder="https://github.com/username/repo"
          {...register("repositoryUrl")}
          style={{
            ...inputStyle,
            borderColor: errors.repositoryUrl ? "#dc2626" : "rgba(223,226,236,0.8)",
          }}
        />
        {errors.repositoryUrl && (
          <p style={errorStyle}>{errors.repositoryUrl.message}</p>
        )}
        {isLoadingRepo && (
          <p style={{ fontSize: 12, color: "#8891a5", marginTop: 8 }}>
            Loading repository info...
          </p>
        )}
        {repoInfo && (
          <div style={{ marginTop: 8 }}>
            <GitHubRepoPreview repo={repoInfo} />
          </div>
        )}
      </div>

      {/* Demo URL */}
      <div>
        <label style={labelStyle}>
          Demo URL <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <input
          type="url"
          placeholder="https://your-demo.vercel.app"
          {...register("demoUrl")}
          style={{
            ...inputStyle,
            borderColor: errors.demoUrl ? "#dc2626" : "rgba(223,226,236,0.8)",
          }}
        />
        {errors.demoUrl && (
          <p style={errorStyle}>{errors.demoUrl.message}</p>
        )}
      </div>

      {/* PDF Upload */}
      <div>
        <label style={labelStyle}>
          PDF Document <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setPdfError(null);
            if (!file) {
              setPdfFile(null);
              return;
            }
            const err = validatePdfFile(file);
            if (err) {
              setPdfError(err);
              setPdfFile(null);
              return;
            }
            setPdfFile(file);
          }}
          style={{
            ...inputStyle,
            padding: "9px",
          }}
        />
        {pdfError && <p style={errorStyle}>{pdfError}</p>}
        {pdfFile && (
          <p style={{ fontSize: 12, color: "#8891a5", marginTop: 4 }}>
            Selected: {pdfFile.name}
          </p>
        )}
      </div>

      {/* Error */}
      {activeError && (
        <p style={{ fontSize: 14, color: "#dc2626", textAlign: "center" }}>
          {activeError instanceof Error
            ? activeError.message
            : "Something went wrong. Please try again."}
        </p>
      )}

      {/* Actions */}
      <div
        className="flex items-center justify-end gap-3"
        style={{ borderTop: "1px solid rgba(223,226,236,0.8)", paddingTop: 20 }}
      >
        <button
          type="button"
          disabled={isBusy}
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            fontSize: 14,
            fontWeight: 500,
            color: "#8891a5",
            cursor: "pointer",
            padding: "10px 16px",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isBusy}
          style={{
            backgroundColor: "#38bdf8",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            color: "#ffffff",
            cursor: "pointer",
            padding: "10px 20px",
          }}
        >
          {isSubmitting ? "Submitting..." : "Submit project"}
        </button>
      </div>
    </form>
  );
}
