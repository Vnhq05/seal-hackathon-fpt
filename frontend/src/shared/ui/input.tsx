import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={`block h-11 w-full rounded-lg border bg-seal-surface px-4 text-sm text-seal-text transition-colors duration-200 placeholder:text-seal-text-muted focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            error
              ? "border-seal-error/50 focus:border-seal-error focus:ring-seal-error/20"
              : "border-seal-border hover:border-seal-border-dark focus:border-seal-cyan focus:ring-seal-cyan/20"
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs font-medium text-seal-error">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
