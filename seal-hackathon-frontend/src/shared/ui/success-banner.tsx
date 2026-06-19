interface SuccessBannerProps {
  message: string;
}

export function SuccessBanner({ message }: SuccessBannerProps) {
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-[10px] border border-seal-success/20 bg-seal-success/10 px-4 py-3"
    >
      <svg
        className="h-5 w-5 flex-shrink-0"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="10" cy="10" r="9" fill="var(--color-seal-success)" />
        <path
          d="M6 10l3 3 5-5"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="text-sm text-seal-success">
        {message}
      </p>
    </div>
  );
}
