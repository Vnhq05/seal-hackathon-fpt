"use client";

import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api/public.api";

export function Stats() {
  const { data } = useQuery({
    queryKey: ["public-stats"],
    queryFn: () => publicApi.getStats(),
    staleTime: 5 * 60 * 1000,
  });

  const stats = [
    { value: data?.activeEventCount ?? 0, label: "Active Events" },
    { value: data?.registeredUserCount ?? 0, label: "Registered Users" },
    { value: data?.teamCount ?? 0, label: "Teams" },
  ];

  return (
    <section className="relative overflow-hidden bg-seal-bg py-16 md:py-20">
      <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-seal-cyan/30 to-transparent" />
      <div className="absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-seal-mint/30 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-8 lg:gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-heading text-4xl font-bold text-seal-text sm:text-5xl lg:text-6xl">
                {stat.value}
              </p>
              <p className="mt-2 font-mono text-xs uppercase tracking-wider text-seal-text-secondary">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
