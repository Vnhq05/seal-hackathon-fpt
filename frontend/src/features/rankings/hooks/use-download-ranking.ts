import { useMutation } from "@tanstack/react-query";
import { rankingApi } from "@/lib/api";

// TODO: backend has no CSV export for rankings — returns JSON rankings as fallback
export function useDownloadRanking() {
  return useMutation({
    mutationFn: async (roundId: string) => {
      const rankings = await rankingApi.getRankings(roundId);
      const csv = [
        "rank,teamName,finalScore",
        ...rankings.map((r) => `${r.rank},${r.teamName ?? ""},${r.finalScore}`),
      ].join("\n");
      return new Blob([csv], { type: "text/csv" });
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "rankings.csv";
      link.click();
      window.URL.revokeObjectURL(url);
    },
  });
}
