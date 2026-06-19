interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-[10px] border border-seal-error/20 bg-seal-error/10 px-4 py-3"
    >
      <svg
        className="h-5 w-5 flex-shrink-0"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="10" cy="10" r="9" fill="var(--color-seal-error)" />
        <rect x="9" y="5" width="2" height="6" rx="1" fill="white" />
        <rect x="9" y="13" width="2" height="2" rx="1" fill="white" />
      </svg>
      <p className="text-sm text-seal-error">
        {message}
      </p>
    </div>
  );
}
