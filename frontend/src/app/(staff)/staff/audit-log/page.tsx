import type { Metadata } from "next";
import { AuditLogPage } from "@/features/staff/components/audit-log-page";

export const metadata: Metadata = {
  title: "Audit Log — SEAL Hackathon Staff",
  description: "Track all staff actions and changes.",
};

export default function AuditLogRoute() {
  return (
    <div style={{ padding: 32, maxWidth: 1440 }}>
      <AuditLogPage />
    </div>
  );
}
