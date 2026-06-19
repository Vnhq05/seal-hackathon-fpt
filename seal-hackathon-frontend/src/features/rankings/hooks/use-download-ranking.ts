import { useMutation } from "@tanstack/react-query";
import { downloadRankingCsv } from "@/features/rankings/services/leaderboard.service";

export function useDownloadRanking() {
  return useMutation({
    mutationFn: (track?: string) => downloadRankingCsv(track),
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
