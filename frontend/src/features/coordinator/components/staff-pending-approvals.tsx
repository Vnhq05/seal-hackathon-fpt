"use client";

import Link from "next/link";
import { useRecentApprovals } from "@/features/coordinator/hooks/use-staff-dashboard";
import { useApproveRejectUser } from "@/features/coordinator/hooks/use-approve-reject-user";

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderTop: "1px solid rgba(198,198,205,0.2)" }}>
      <div className="flex items-center gap-3">
        <div className="animate-pulse rounded-full" style={{ width: 36, height: 36, backgroundColor: "rgba(223,226,236,0.8)" }} />
        <div>
          <div className="animate-pulse rounded" style={{ width: 120, height: 12, backgroundColor: "rgba(223,226,236,0.8)" }} />
          <div className="animate-pulse rounded" style={{ width: 180, height: 10, backgroundColor: "rgba(223,226,236,0.8)", marginTop: 4 }} />
        </div>
      </div>
    </div>
  );
}

export function StaffPendingApprovals() {
  const { data: approvals, isLoading } = useRecentApprovals();
  const { mutate: approveReject } = useApproveRejectUser();

  return (
    <div
      className="rounded-lg"
      style={{ backgroundColor: "#ffffff", border: "1px solid rgba(223,226,236,0.8)", padding: 24, flex: 1 }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0e1528" }}>Pending Approvals</h3>
        <Link
          href="/coordinator/user-approval"
          style={{ fontSize: 13, fontWeight: 600, color: "#38bdf8" }}
        >
          View all
        </Link>
      </div>

      <div className="flex flex-col">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
        ) : !approvals || approvals.length === 0 ? (
          <p style={{ fontSize: 14, color: "#8891a5", padding: "16px 0", textAlign: "center" }}>
            No pending approvals.
          </p>
        ) : (
          approvals.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between py-3"
              style={{ borderTop: "1px solid rgba(198,198,205,0.2)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex flex-shrink-0 items-center justify-center rounded-full"
                  style={{ width: 36, height: 36, backgroundColor: "rgba(223,226,236,0.8)" }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0e1528" }}>{user.initials}</span>
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#0e1528", lineHeight: "18px" }}>{user.name}</p>
                  <p style={{ fontSize: 12, color: "#8891a5", lineHeight: "16px" }}>
                    {user.role} · {user.detail}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => approveReject({ userId: user.id, action: "approve" })}
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 28, height: 28, backgroundColor: "#ecfdf5", border: "none", cursor: "pointer" }}
                  aria-label={`Approve ${user.name}`}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-5" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button
                  onClick={() => approveReject({ userId: user.id, action: "reject" })}
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 28, height: 28, backgroundColor: "#fef2f2", border: "none", cursor: "pointer" }}
                  aria-label={`Reject ${user.name}`}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 4l6 6M10 4l-6 6" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
