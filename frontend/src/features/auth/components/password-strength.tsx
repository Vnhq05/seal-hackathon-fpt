interface StrengthResult {
  filledSegments: number;
  label: string;
  color: string;
}

function getPasswordStrength(password: string): StrengthResult {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { filledSegments: 1, label: "Weak", color: "var(--color-seal-error)" };
  if (score === 2) return { filledSegments: 2, label: "Fair", color: "var(--color-seal-amber)" };
  if (score === 3) return { filledSegments: 3, label: "Good", color: "var(--color-seal-success)" };
  return { filledSegments: 4, label: "Strong", color: "var(--color-seal-success)" };
}

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const { filledSegments, label, color } = getPasswordStrength(password);

  return (
    <div className="mt-2 flex flex-col gap-1">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-200"
            style={{
              backgroundColor: i < filledSegments ? color : "var(--color-seal-border)",
            }}
          />
        ))}
      </div>
      <p className="text-right text-xs text-seal-text-muted">
        {label}
      </p>
    </div>
  );
}
