"use client";

import { useState, type InputHTMLAttributes } from "react";

type RequiredDigitsInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange"
> & {
  value: string;
  onValueChange: (digits: string) => void;
  /** Shown under the field when value is empty (required fields). */
  emptyMessage?: string;
};

/**
 * Plain text digit field: empty while typing, optional required-empty warning after interaction.
 * Parse/clamp on submit — do not force a default on every keystroke.
 */
export function RequiredDigitsInput({
  value,
  onValueChange,
  emptyMessage = "This field is required",
  className,
  style,
  onBlur,
  ...rest
}: RequiredDigitsInputProps) {
  const [touched, setTouched] = useState(false);
  const showEmptyWarning = touched && value.trim() === "";

  return (
    <div className="flex flex-col gap-1">
      <input
        {...rest}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        className={className}
        aria-invalid={showEmptyWarning}
        style={
          showEmptyWarning
            ? {
                ...style,
                // Use full border shorthand to avoid conflict with callers' `border: ...`
                border: "1px solid #f59e0b",
                outline: "1px solid #f59e0b",
              }
            : style
        }
        onChange={(e) => {
          setTouched(true);
          onValueChange(e.target.value.replace(/\D/g, ""));
        }}
        onBlur={(e) => {
          setTouched(true);
          onBlur?.(e);
        }}
      />
      {showEmptyWarning ? (
        <span style={{ fontSize: 11, fontWeight: 600, color: "#92400e" }}>{emptyMessage}</span>
      ) : null}
    </div>
  );
}

export function parseRequiredPositiveInt(value: string): number | null {
  if (value.trim() === "") return null;
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < 1) return null;
  return n;
}
