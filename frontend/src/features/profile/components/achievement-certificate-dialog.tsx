"use client";

import { useEffect } from "react";
import { AchievementCertificateTemplate } from "@/features/profile/components/achievement-certificate-template";
import type { CertificateTemplateData } from "@/features/profile/types/certificate.types";

interface AchievementCertificateDialogProps {
  open: boolean;
  onClose: () => void;
  data: CertificateTemplateData | null;
}

export function AchievementCertificateDialog({
  open,
  onClose,
  data,
}: AchievementCertificateDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !data) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Certificate of Achievement"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close certificate"
          style={{
            position: "absolute",
            top: -12,
            right: -12,
            zIndex: 2,
            width: 36,
            height: 36,
            borderRadius: 999,
            border: "1px solid #cbd5e1",
            background: "#fff",
            color: "#0e1528",
            fontSize: 18,
            lineHeight: 1,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          }}
        >
          ×
        </button>
        <AchievementCertificateTemplate data={data} />
      </div>
    </div>
  );
}
