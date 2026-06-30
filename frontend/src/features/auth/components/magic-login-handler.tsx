"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useMagicLogin } from "@/features/auth/hooks/use-magic-login";

interface MagicLoginHandlerProps {
  token: string;
}

export function MagicLoginHandler({ token }: MagicLoginHandlerProps) {
  const { magicLogin, isPending, isError, error, isSuccess } = useMagicLogin();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    magicLogin(token);
  }, [magicLogin, token]);

  if (isSuccess || isPending) {
    return (
      <div className="text-center">
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0e1528", marginBottom: 12 }}>
          Signing you in…
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5" }}>
          Please wait while we verify your link.
        </p>
      </div>
    );
  }

  if (isError) {
    const message = error instanceof Error ? error.message : "This link is invalid or has expired.";
    return (
      <div className="text-center">
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#991b1b", marginBottom: 12 }}>
          Sign-in link failed
        </h1>
        <p style={{ fontSize: 14, color: "#4a5468", marginBottom: 24, lineHeight: 1.6 }}>
          {message}
        </p>
        <Link
          href="/login"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 600,
            color: "#ffffff",
            backgroundColor: "#5b5bd6",
            borderRadius: 6,
            textDecoration: "none",
          }}
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  return null;
}
