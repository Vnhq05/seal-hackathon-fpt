import { useMutation } from "@tanstack/react-query";
import { participantFeedbackApi } from "@/lib/api/participant-feedback.api";

function escapeCsvField(value: string | null | undefined): string {
  const str = value ?? "";
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function useDownloadFeedback() {
  return useMutation({
    mutationFn: async (eventId: string) => {
      const list = await participantFeedbackApi.list(eventId);
      const header = "submittedAt,userFullName,teamName,overallRating,comment";
      const rows = list.map((fb) =>
        [
          escapeCsvField(fb.submittedAt),
          escapeCsvField(fb.userFullName),
          escapeCsvField(fb.teamName),
          String(fb.overallRating),
          escapeCsvField(fb.comment),
        ].join(","),
      );
      return { blob: new Blob([[header, ...rows].join("\n")], { type: "text/csv" }), eventId };
    },
    onSuccess: ({ blob, eventId }) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `feedback-${eventId}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    },
  });
}
