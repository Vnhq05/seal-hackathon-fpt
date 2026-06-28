function FloatingPixel({
  label,
  color,
  className,
  delay,
}: {
  label: string;
  color: string;
  className: string;
  delay?: string;
}) {
  return (
    <div
      className={`absolute flex items-center gap-1.5 border-2 border-navy bg-white px-2 py-1 shadow-[3px_3px_0_0_#0c1228] seal-float ${className}`}
      style={{ animationDelay: delay }}
      aria-hidden="true"
    >
      <span className={`h-3 w-3 ${color}`} />
      <span className="font-mono text-[10px] font-bold text-navy">{label}</span>
    </div>
  );
}

export function PixelScene() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md" aria-hidden="true">
      <FloatingPixel label="VECTOR DB" color="bg-seal-yellow" className="left-0 top-4" delay="0s" />
      <FloatingPixel label="LANGCHAIN" color="bg-royal" className="right-0 top-12" delay="1s" />
      <FloatingPixel label="AI AGENT" color="bg-seal-error" className="bottom-32 left-2" delay="2s" />
      <FloatingPixel label="RAG SYSTEM" color="bg-seal-success" className="right-4 bottom-24" delay="0.5s" />
      <FloatingPixel label="EMBEDDING" color="bg-seal-blue" className="left-1/4 top-1/2" delay="1.5s" />

      <div className="absolute inset-8 border-2 border-navy bg-white shadow-[8px_8px_0_0_#0c1228]">
        <div className="flex h-8 items-center gap-1.5 border-b-2 border-navy bg-seal-surface-sunken px-3">
          <span className="h-2.5 w-2.5 bg-seal-error" />
          <span className="h-2.5 w-2.5 bg-seal-yellow" />
          <span className="h-2.5 w-2.5 bg-seal-success" />
          <span className="ml-2 font-mono text-[9px] font-bold text-navy/60">HACKATHON.exe</span>
        </div>

        <div className="relative h-[calc(100%-2rem)] p-4">
          <div className="grid h-full grid-cols-6 grid-rows-6 gap-1">
            {Array.from({ length: 36 }).map((_, i) => {
              const row = Math.floor(i / 6);
              const col = i % 6;
              const isPlatform =
                row >= 4 ||
                (row === 3 && col >= 1 && col <= 4) ||
                (row === 2 && col >= 2 && col <= 3);
              const isBlock =
                (row === 1 && col === 4) ||
                (row === 0 && col === 5) ||
                (row === 2 && col === 5);

              let bg = "bg-seal-surface-sunken/50";
              if (isPlatform) bg = "bg-royal/80";
              if (isBlock) bg = "bg-seal-yellow";

              return <div key={i} className={`${bg} border border-navy/10`} />;
            })}
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <div className="relative">
              <div className="h-10 w-8 border-2 border-navy bg-royal shadow-[2px_2px_0_0_#0c1228]" />
              <div className="absolute -top-3 left-1/2 h-3 w-6 -translate-x-1/2 border-2 border-navy bg-navy-light" />
              <div className="absolute -top-5 left-1/2 h-2 w-2 -translate-x-1/2 bg-seal-yellow" />
            </div>
          </div>

          <div className="absolute top-8 right-6">
            <div className="h-8 w-10 border-2 border-navy bg-seal-mint shadow-[2px_2px_0_0_#0c1228]" />
            <div className="mt-1 h-1 w-10 bg-navy/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
