"use client";

import { useMemo, useState } from "react";
import {
  useMyParticipantFeedback,
  useSubmitParticipantFeedback,
} from "@/features/feedback/hooks/use-participant-feedback";
import { useMyTeamsAllEvents } from "@/features/teams/hooks/use-my-teams-all-events";

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

function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          className={`text-2xl transition ${disabled ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
          aria-label={`${star} sao`}
        >
          {star <= value ? "★" : "☆"}
        </button>
      ))}
    </div>
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
  const teamLoading = membershipsLoading;

  const { data: existing, isLoading: feedbackLoading } = useMyParticipantFeedback(eventId);
  const { mutate: submit, isPending } = useSubmitParticipantFeedback(eventId);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!sealEvent) return false;
    if (sealEvent.status !== "COMPLETED") return false;
    if (!team || team.status !== "CONFIRMED") return false;
    return true;
  }, [sealEvent, team]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (rating < 1) {
      setError("Vui lòng chọn điểm đánh giá từ 1 đến 5 sao.");
      return;
    }
    submit(
      { overallRating: rating, comment: comment.trim() || undefined },
      {
        onError: (err: Error) => setError(err.message || "Không thể gửi feedback."),
      },
    );
  };

  const loading = teamLoading || feedbackLoading;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Đánh giá sau sự kiện</h1>
        {sealEvent && <p className="text-sm text-seal-text-secondary">{sealEvent.name}</p>}
      </div>

      {loading && <p className="text-sm text-seal-text-muted">Đang tải...</p>}

      {!loading && !sealEvent && (
        <p className="rounded-lg border border-navy/20 bg-white p-6 text-sm text-seal-text-secondary">
          Chưa có sự kiện nào.
        </p>
      )}

      {!loading && sealEvent && sealEvent.status !== "COMPLETED" && (
        <p className="rounded-lg border border-navy/20 bg-white p-6 text-sm text-seal-text-secondary">
          Feedback chỉ mở sau khi sự kiện kết thúc (trạng thái COMPLETED).
        </p>
      )}

      {!loading && sealEvent && sealEvent.status === "COMPLETED" && !team && (
        <p className="rounded-lg border border-navy/20 bg-white p-6 text-sm text-seal-text-secondary">
          Bạn cần thuộc một đội đã xác nhận (CONFIRMED) để gửi feedback.
        </p>
      )}

      {!loading && sealEvent && sealEvent.status === "COMPLETED" && team && team.status !== "CONFIRMED" && (
        <p className="rounded-lg border border-navy/20 bg-white p-6 text-sm text-seal-text-secondary">
          Đội của bạn chưa ở trạng thái CONFIRMED. Chỉ thành viên đội đã xác nhận mới được gửi feedback.
        </p>
      )}

      {!loading && existing && (
        <div className="space-y-4 border-2 border-royal bg-white p-6 shadow-[3px_3px_0_0_#0c1228]">
          <p className="font-mono text-xs font-bold uppercase text-royal">Đã gửi feedback</p>
          <div>
            <p className="text-sm text-seal-text-muted">Điểm đánh giá</p>
            <StarRating value={existing.overallRating} onChange={() => {}} disabled />
          </div>
          {existing.comment && (
            <div>
              <p className="text-sm text-seal-text-muted">Nhận xét</p>
              <p className="text-sm text-navy">{existing.comment}</p>
            </div>
          )}
          <p className="text-xs text-seal-text-muted">
            Gửi lúc {new Date(existing.submittedAt).toLocaleString("vi-VN")}
          </p>
        </div>
      )}

      {!loading && canSubmit && !existing && (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 border-2 border-navy bg-white p-6 shadow-[3px_3px_0_0_#0c1228]"
        >
          <div>
            <label style={labelStyle}>Điểm tổng thể (1–5 sao) *</label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div>
            <label style={labelStyle}>Nhận xét (tuỳ chọn)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn về sự kiện..."
              rows={5}
              maxLength={2000}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="w-full border-2 border-navy bg-royal px-4 py-3 text-sm font-semibold text-white shadow-[3px_3px_0_0_#0c1228] transition hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_0_#0c1228] disabled:opacity-60"
          >
            {isPending ? "Đang gửi..." : "Gửi feedback"}
          </button>
        </form>
      )}
    </div>
  );
}
