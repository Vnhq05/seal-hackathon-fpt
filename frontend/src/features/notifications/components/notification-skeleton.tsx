function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-start gap-4 border-2 border-navy/20 bg-seal-surface-sunken p-6">
      <div className="h-10 w-10 flex-shrink-0 border-2 border-navy/10 bg-seal-surface-sunken" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="flex justify-between gap-4">
          <div className="h-4 rounded" style={{ width: "40%", backgroundColor: "rgba(223,226,236,0.8)" }} />
          <div className="h-3 rounded" style={{ width: "12%", backgroundColor: "rgba(223,226,236,0.8)" }} />
        </div>
        <div className="h-3 rounded" style={{ width: "75%", backgroundColor: "#f0f0f0" }} />
      </div>
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div role="status" aria-label="Loading notifications" className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
