import * as React from "react";
import { SEAL_INPUT, SEAL_INPUT_ERROR } from "./seal-pixel";

interface SealInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const SealInput = React.forwardRef<HTMLInputElement, SealInputProps>(
  ({ error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={`${SEAL_INPUT} ${error ? SEAL_INPUT_ERROR : ""} ${className}`}
          {...props}
        />
        {error ? (
          <p className="mt-1.5 font-mono text-xs font-medium text-seal-error">{error}</p>
        ) : null}
      </div>
    );
  },
);

SealInput.displayName = "SealInput";
