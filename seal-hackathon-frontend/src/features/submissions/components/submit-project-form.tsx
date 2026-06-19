"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  submitProjectSchema,
  type SubmitProjectFormValues,
} from "@/features/submissions/schemas/submit-project.schema";
import { useSubmitProject } from "@/features/submissions/hooks/use-submit-project";
import { useGitHubRepo } from "@/features/submissions/hooks/use-github-repo";
import { GitHubRepoPreview } from "@/features/submissions/components/github-repo-preview";
import type { RoundInfo } from "@/features/submissions/types/submit-project.types";

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

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6.5" stroke="#b45309" strokeWidth="1.2" />
      <path
        d="M8 4.5V8l2.5 1.5"
        stroke="#b45309"
        strokeWidth="1.2"
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

const bannerStyle: React.CSSProperties = {
  backgroundColor: "rgba(245,158,11,0.1)",
  border: "1px solid rgba(245,158,11,0.3)",
  borderRadius: 6,
  padding: "10px 14px",
};

const bannerTextStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "#b45309",
  lineHeight: "18px",
};

/* ── Component ─────────────────────────────────────────────── */

interface SubmitProjectFormProps {
  roundInfo: RoundInfo;
}

export function SubmitProjectForm({ roundInfo }: SubmitProjectFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SubmitProjectFormValues>({
    resolver: zodResolver(submitProjectSchema),
    defaultValues: {
      repositoryUrl: "",
      demoUrl: "",
      documentationUrl: "",
      slideUrl: "",
    },
  });

  const {
    submit,
    saveDraft,
    isSubmitting,
    isSavingDraft,
    isSubmitError,
    isDraftError,
    submitError,
    draftError,
  } = useSubmitProject();

  const repositoryUrl = watch("repositoryUrl");
  const { data: repoInfo, isLoading: isLoadingRepo } =
    useGitHubRepo(repositoryUrl);

  const isBusy = isSubmitting || isSavingDraft;

  const onSubmit = (values: SubmitProjectFormValues) => {
    submit({
      repositoryUrl: values.repositoryUrl,
      demoUrl: values.demoUrl,
      documentationUrl: values.documentationUrl,
      slideUrl: values.slideUrl,
      isDraft: false,
    });
  };

  const onSaveDraft = () => {
    const values = watch();
    saveDraft({
      repositoryUrl: values.repositoryUrl,
      demoUrl: values.demoUrl,
      documentationUrl: values.documentationUrl,
      slideUrl: values.slideUrl,
      isDraft: true,
    });
  };

  const activeError = isSubmitError
    ? submitError
    : isDraftError
      ? draftError
      : null;

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
          {roundInfo.name} &mdash; {roundInfo.subtitle}
        </p>
      </div>

      {/* Urgency banner */}
      <div style={bannerStyle} className="flex items-center gap-2">
        <ClockIcon />
        <span style={bannerTextStyle}>
          Closing soon &mdash; {roundInfo.timeRemaining} remaining
        </span>
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
        <label style={labelStyle}>Demo URL</label>
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

      {/* Documentation URL */}
      <div>
        <label style={labelStyle}>Documentation URL</label>
        <input
          type="url"
          placeholder="https://docs.google.com/document/d/..."
          {...register("documentationUrl")}
          style={{
            ...inputStyle,
            borderColor: errors.documentationUrl ? "#dc2626" : "rgba(223,226,236,0.8)",
          }}
        />
        {errors.documentationUrl && (
          <p style={errorStyle}>{errors.documentationUrl.message}</p>
        )}
      </div>

      {/* Slide Presentation URL */}
      <div>
        <label style={labelStyle}>Slide Presentation URL</label>
        <input
          type="url"
          placeholder="https://docs.google.com/presentation/d/..."
          {...register("slideUrl")}
          style={{
            ...inputStyle,
            borderColor: errors.slideUrl ? "#dc2626" : "rgba(223,226,236,0.8)",
          }}
        />
        {errors.slideUrl && (
          <p style={errorStyle}>{errors.slideUrl.message}</p>
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
          type="button"
          disabled={isBusy}
          onClick={onSaveDraft}
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid rgba(223,226,236,0.8)",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            color: "#0e1528",
            cursor: "pointer",
            padding: "10px 20px",
          }}
        >
          {isSavingDraft ? "Saving..." : "Save as draft"}
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
