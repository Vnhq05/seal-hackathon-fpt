import * as React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-seal-cyan text-white hover:bg-seal-cyan-dark active:bg-seal-cyan-dark/90",
  secondary:
    "bg-seal-surface text-seal-text border border-seal-border hover:bg-seal-surface-elevated hover:border-seal-border-dark active:bg-seal-surface-sunken",
  ghost:
    "bg-transparent text-seal-text-secondary hover:bg-seal-surface-elevated hover:text-seal-text active:bg-seal-border-light",
  danger:
    "bg-seal-error text-white hover:bg-red-600 active:bg-red-700",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[13px] font-semibold gap-1.5 rounded-lg",
  md: "h-11 px-5 text-sm font-semibold gap-2 rounded-lg",
  lg: "h-12 px-6 text-sm font-semibold gap-2.5 rounded-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex w-full items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-seal-cyan/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
