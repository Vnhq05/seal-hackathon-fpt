import Image from "next/image";
import type { SubmissionVideo as SubmissionVideoType } from "@/features/submissions/types/submission-detail.types";

interface SubmissionVideoProps {
  video: SubmissionVideoType;
}

export function SubmissionVideo({ video }: SubmissionVideoProps) {
  if (!video.videoUrl && !video.thumbnailUrl) return null;

  return (
    <div
      style={{
        backgroundColor: "#eef0f6",
        border: "1px solid rgba(223,226,236,0.8)",
        borderRadius: 8,
        padding: 25,
      }}
    >
      <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
        <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
          <rect x="1" y="1" width="18" height="14" rx="2" stroke="#0e1528" strokeWidth="1.5" />
          <path d="M8 5v6l5-3-5-3z" fill="#0e1528" />
        </svg>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0e1528", lineHeight: "25.2px" }}>
          Demo Walkthrough
        </h2>
      </div>

      <div
        className="relative overflow-hidden rounded-lg"
        style={{
          aspectRatio: "16/9",
          backgroundColor: "#dcfce7",
          border: "1px solid rgba(223,226,236,0.8)",
        }}
      >
        {video.thumbnailUrl && (
          <Image
            src={video.thumbnailUrl}
            alt="Demo walkthrough thumbnail"
            fill
            unoptimized
            className="object-cover opacity-80"
          />
        )}

        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
        >
          {video.videoUrl ? (
            <a
              href={video.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-full"
              style={{
                width: 64,
                height: 64,
                backgroundColor: "rgba(255,255,255,0.9)",
                boxShadow: "0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -4px rgba(0,0,0,0.1)",
                paddingLeft: 4,
              }}
              aria-label="Play demo video"
            >
              <svg width="20" height="24" viewBox="0 0 15 19" fill="none">
                <path d="M1 1v17l13-8.5L1 1z" fill="#0e1528" />
              </svg>
            </a>
          ) : (
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 64,
                height: 64,
                backgroundColor: "rgba(255,255,255,0.9)",
                boxShadow: "0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -4px rgba(0,0,0,0.1)",
                paddingLeft: 4,
              }}
            >
              <svg width="20" height="24" viewBox="0 0 15 19" fill="none">
                <path d="M1 1v17l13-8.5L1 1z" fill="#0e1528" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
