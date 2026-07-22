"use client";

import type { CertificateTemplateData } from "@/features/profile/types/certificate.types";

export interface AchievementCertificateTemplateProps {
  data: CertificateTemplateData;
  className?: string;
}

/**
 * Reusable SEAL certificate template.
 * Only pass different `data` — do not edit layout for each recipient.
 *
 * ┌ University logo                 SEAL logo (white) ┐
 * │         CERTIFICATE OF ACHIEVEMENT                │
 * │              CERTIFICATE                          │
 * │           {eventName}                             │
 * │           Presented to                            │
 * │              {teamName}                           │
 * │              {prizeLabel}                         │
 * │           {projectContent}                        │
 * │ Certificate ID: {certificateId}                   │
 * └───────────────────────────────────────────────────┘
 */
export function AchievementCertificateTemplate({
  data,
  className,
}: AchievementCertificateTemplateProps) {
  const issuedOn = new Date(data.achievedAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const universityLogo =
    data.universityLogoUrl || "/certificates/fpt-education-logo.png";
  const sealLogo = data.hackathonLogoUrl || "/logo-removebg-preview.png";

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1.414 / 1",
        background:
          "linear-gradient(165deg, #ffffff 0%, #f7fbff 55%, #eef5ff 100%)",
        border: "1px solid #9ec5e8",
        boxShadow: "0 12px 40px rgba(12, 18, 40, 0.16)",
        overflow: "hidden",
        color: "#0e1528",
      }}
      role="img"
      aria-label={`Certificate of Achievement — ${data.prizeLabel} — ${data.teamName}`}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 14,
          border: "1.5px solid #7eb6e0",
          pointerEvents: "none",
        }}
      />

      <CornerAccent position="top-right" />
      <CornerAccent position="bottom-left" />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "clamp(22px, 4.5%, 36px) clamp(24px, 5%, 44px)",
        }}
      >
        {/* Logos row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={universityLogo}
            alt="FPT Education — FPT University"
            style={{
              height: 64,
              width: "auto",
              maxWidth: 260,
              objectFit: "contain",
              objectPosition: "left top",
            }}
          />

          {/* White SEAL logo — sits on the dark blue corner accent */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sealLogo}
            alt="SEAL Hackathon"
            style={{
              height: 56,
              width: "auto",
              objectFit: "contain",
              filter: "brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,0.25))",
            }}
          />
        </div>

        {/* Titles */}
        <div style={{ marginTop: "clamp(18px, 4%, 32px)", textAlign: "center" }}>
          <h2
            style={{
              margin: 0,
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: "clamp(22px, 3.4vw, 34px)",
              fontWeight: 700,
              color: "#1a2b56",
              letterSpacing: "0.04em",
            }}
          >
            CERTIFICATE OF ACHIEVEMENT
          </h2>
          <p
            style={{
              margin: "6px 0 0",
              fontFamily: "system-ui, Segoe UI, sans-serif",
              fontSize: "clamp(13px, 1.7vw, 16px)",
              fontWeight: 600,
              color: "#3b82c4",
              letterSpacing: "0.18em",
            }}
          >
            CERTIFICATE
          </p>
          <div
            aria-hidden="true"
            style={{
              width: 72,
              height: 2,
              margin: "14px auto 0",
              background: "linear-gradient(90deg, transparent, #7eb6e0, transparent)",
            }}
          />
        </div>

        <p
          style={{
            margin: "clamp(14px, 2.8%, 22px) 0 0",
            textAlign: "center",
            fontFamily: "system-ui, Segoe UI, sans-serif",
            fontSize: "clamp(14px, 2vw, 18px)",
            fontWeight: 800,
            color: "#0e1528",
            letterSpacing: "0.08em",
          }}
        >
          {data.eventName}
        </p>

        <p
          style={{
            margin: "clamp(16px, 3%, 26px) 0 0",
            textAlign: "center",
            fontFamily: "system-ui, Segoe UI, sans-serif",
            fontSize: "clamp(12px, 1.5vw, 14px)",
            color: "#475569",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Presented to
        </p>

        <p
          style={{
            margin: "10px 0 0",
            textAlign: "center",
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: "clamp(20px, 3vw, 30px)",
            fontWeight: 700,
            color: "#1a2b56",
            lineHeight: 1.25,
          }}
        >
          {data.teamName}
        </p>
        {data.recipientName && (
          <p
            style={{
              margin: "4px 0 0",
              textAlign: "center",
              fontSize: "clamp(11px, 1.3vw, 13px)",
              color: "#64748b",
            }}
          >
            Member: {data.recipientName}
          </p>
        )}

        <p
          style={{
            margin: "clamp(14px, 2.8%, 22px) 0 0",
            textAlign: "center",
            fontFamily: "system-ui, Segoe UI, sans-serif",
            fontSize: "clamp(18px, 2.6vw, 26px)",
            fontWeight: 800,
            color: "#F37021",
            letterSpacing: "0.06em",
          }}
        >
          {data.prizeLabel}
        </p>

        <p
          style={{
            margin: "12px auto 0",
            maxWidth: "78%",
            textAlign: "center",
            fontFamily: "system-ui, Segoe UI, sans-serif",
            fontSize: "clamp(12px, 1.5vw, 14.5px)",
            color: "#334155",
            lineHeight: 1.55,
          }}
        >
          {data.projectContent}
        </p>

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 12,
            paddingTop: 12,
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "clamp(10px, 1.2vw, 12px)",
              color: "#64748b",
              letterSpacing: "0.02em",
            }}
          >
            Certificate ID: {data.certificateId}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "clamp(10px, 1.2vw, 12px)",
              color: "#64748b",
            }}
          >
            {issuedOn}
          </p>
        </div>
      </div>
    </div>
  );
}

function CornerAccent({ position }: { position: "top-right" | "bottom-left" }) {
  const isTop = position === "top-right";
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: isTop ? 0 : "auto",
        right: isTop ? 0 : "auto",
        bottom: isTop ? "auto" : 0,
        left: isTop ? "auto" : 0,
        width: "34%",
        height: "28%",
        background: isTop
          ? "linear-gradient(215deg, #1a2b56 0%, #3b82c4 42%, #7dd3fc 78%, transparent 79%)"
          : "linear-gradient(35deg, #1a2b56 0%, #3b82c4 42%, #7dd3fc 78%, transparent 79%)",
        clipPath: isTop
          ? "polygon(20% 0, 100% 0, 100% 100%, 55% 100%)"
          : "polygon(0 0, 45% 0, 80% 100%, 0 100%)",
        opacity: 0.92,
        pointerEvents: "none",
      }}
    />
  );
}
