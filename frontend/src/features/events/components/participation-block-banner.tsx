interface ParticipationBlockBannerProps {
  reason: string | null | undefined;
  className?: string;
}

export function ParticipationBlockBanner({ reason, className }: ParticipationBlockBannerProps) {
  if (!reason) return null;

  return (
    <div
      className={className}
      style={{ fontSize: 14, color: "#b45309" }}
      role="status"
    >
      {reason}
    </div>
  );
}
