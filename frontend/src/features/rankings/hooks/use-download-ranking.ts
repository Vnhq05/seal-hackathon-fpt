import { useMutation } from "@tanstack/react-query";
import { rankingApi } from "@/lib/api";

export function useDownloadRanking() {
  return useMutation({
    mutationFn: async (roundId: string) => {
      const rankings = await rankingApi.getRankings(roundId);
      const csv = [
        "rank,teamName,finalScore",
        ...rankings.map((r) => `${r.rank},${r.teamName ?? ""},${r.finalScore}`),
      ].join("\n");
      return {
        blob: new Blob([csv], { type: "text/csv" }),
        roundId,
      };
    },
    onSuccess: ({ blob, roundId }) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rankings-${roundId}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    },
  });
}
