"use client";

import { useEffect, useState } from "react";
import { useAdminUserAchievements, useAdminUserDetails, useAdminUsers, useApproveOrReject, useCreateInternalAccount, useDeactivateUser, useDeleteUser, useReactivateUser } from "@/features/admin/hooks/use-admin-users";
import { AchievementCertificateDialog } from "@/features/profile/components/achievement-certificate-dialog";
import {
  buildCertificateData,
  formatAchievementPrize,
} from "@/features/profile/utils/build-certificate-data";
import type { CertificateTemplateData } from "@/features/profile/types/certificate.types";
import type { UserListItem, CreateInternalAccountRequest } from "@/lib/api";
import type { UserType, AccountStatus } from "@/lib/api";
import { resolveFileUrl } from "@/lib/files";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/lib/password-policy";

const headerCell: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: "#8891a5",
  letterSpacing: "0.24px", lineHeight: "12px", padding: "12px 16px", textAlign: "left",
};
const bodyCell: React.CSSProperties = {
  fontSize: 14, color: "#0e1528", lineHeight: "20px", padding: "14px 16px",
};
const inputStyle: React.CSSProperties = {
  border: "1px solid rgba(223,226,236,0.8)", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none",
};

const USER_TYPE_COLORS: Record<UserType, React.CSSProperties> = {
  SYSTEM_ADMIN: { backgroundColor: "#fef3c7", color: "#92400e" },
  FPT_STUDENT: { backgroundColor: "#eff6ff", color: "#1e40af" },
  EXTERNAL_STUDENT: { backgroundColor: "#f5f3ff", color: "#5b21b6" },
  LECTURER: { backgroundColor: "#fdf4ff", color: "#86198f" },
  EVENT_COORDINATOR: { backgroundColor: "#fce7f3", color: "#9d174d" },
};

const STATUS_COLORS: Record<AccountStatus, React.CSSProperties> = {
  ACTIVE: { backgroundColor: "#f0fdf4", color: "#166534" },
  PENDING: { backgroundColor: "#fef3c7", color: "#92400e" },
  REJECTED: { backgroundColor: "#fef2f2", color: "#991b1b" },
  LOCKED: { backgroundColor: "#f1f5f9", color: "#475569" },
};

const USER_TYPE_LABELS: Record<UserType, string> = {
  SYSTEM_ADMIN: "Admin",
  FPT_STUDENT: "FPT Student",
  EXTERNAL_STUDENT: "External Student",
  LECTURER: "Lecturer",
  EVENT_COORDINATOR: "Coordinator",
};

const RANKING_LABELS = {
  FIRST: "1st",
  SECOND: "2nd",
  THIRD: "3rd",
  CONSOLATION: "Consolation",
} as const;

type InternalRole = CreateInternalAccountRequest["userType"];

const CREATE_ROLE_OPTIONS: { label: string; value: InternalRole }[] = [
  { label: "Coordinator", value: "EVENT_COORDINATOR" },
  { label: "Lecturer", value: "LECTURER" },
  { label: "Admin", value: "SYSTEM_ADMIN" },
];

// Must mirror app.protected-emails on the backend — the server rejects the delete either way,
// this only hides the button.
const PROTECTED_EMAILS = new Set(["admin@seal.com"]);

function isProtectedAccount(email: string): boolean {
  return PROTECTED_EMAILS.has(email.toLowerCase());
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function CreateAccountModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [userType, setUserType] = useState<InternalRole>("EVENT_COORDINATOR");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);

  const { mutate, isPending, error } = useCreateInternalAccount();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Full name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!isValidEmail(email)) errs.email = "Email must be a valid email address";
    if (!password) errs.password = "Password is required";
    else if (password.length < PASSWORD_MIN_LENGTH) errs.password = "Password must be at least 8 characters";
    else if (password.length > PASSWORD_MAX_LENGTH) errs.password = "Password must not exceed 72 characters";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    setSuccess(null);
    if (!validate()) return;
    mutate(
      { email: email.trim(), password, fullName: fullName.trim(), userType },
      {
        onSuccess: (user) => {
          setSuccess(`Account created for ${user.email}`);
          setTimeout(onClose, 1200);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md border-2 border-navy bg-white p-6 shadow-[4px_4px_0_0_#0c1228]"
        style={{ backgroundColor: "#ffffff", border: "1px solid rgba(198,198,205,0.5)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0e1528" }}>Create Account</h2>
        <p style={{ fontSize: 13, color: "#8891a5", marginTop: 4 }}>
          Create an internal account (Coordinator, Lecturer, or Admin).
        </p>

        {success && (
          <div style={{ marginTop: 12, backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#166534" }}>
            {success}
          </div>
        )}
        {error && (
          <div style={{ marginTop: 12, backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#991b1b" }}>
            {error.message}
          </div>
        )}

        <div className="flex flex-col gap-3" style={{ marginTop: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#0e1528", display: "block", marginBottom: 4 }}>Full Name *</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ ...inputStyle, width: "100%", borderColor: fieldErrors.fullName ? "#ef4444" : undefined }} placeholder="Nguyen Van A" />
            {fieldErrors.fullName && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{fieldErrors.fullName}</p>}
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#0e1528", display: "block", marginBottom: 4 }}>Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...inputStyle, width: "100%", borderColor: fieldErrors.email ? "#ef4444" : undefined }} placeholder="user@example.com" />
            {fieldErrors.email && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{fieldErrors.email}</p>}
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#0e1528", display: "block", marginBottom: 4 }}>Password *</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, width: "100%", borderColor: fieldErrors.password ? "#ef4444" : undefined }} placeholder="Min. 8 characters" />
            {fieldErrors.password && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{fieldErrors.password}</p>}
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#0e1528", display: "block", marginBottom: 4 }}>Role *</label>
            <select value={userType} onChange={(e) => setUserType(e.target.value as InternalRole)} style={{ ...inputStyle, width: "100%" }}>
              {CREATE_ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
          <button onClick={onClose} style={{ ...inputStyle, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !!success}
            style={{ backgroundColor: "#38bdf8", color: "#fff", padding: "8px 16px", borderRadius: 8, border: "none", cursor: isPending ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600, opacity: isPending ? 0.7 : 1 }}
          >
            {isPending ? "Creating..." : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserDetailsModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { data: user, isLoading, isError, error } = useAdminUserDetails(userId);
  const {
    data: achievements = [],
    isLoading: isLoadingAchievements,
    isError: isAchievementsError,
  } = useAdminUserAchievements(userId);
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const [certificate, setCertificate] = useState<CertificateTemplateData | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (certificate) {
        setCertificate(null);
        return;
      }
      setShowAvatarPreview((isPreviewOpen) => {
        if (!isPreviewOpen) onClose();
        return false;
      });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, certificate]);

  const details = user ? [
    { label: "Email", value: user.email },
    { label: "Phone", value: user.phone || "—" },
    { label: "Student ID", value: user.studentId || "—" },
    { label: "School", value: user.universityName || "—" },
    { label: "Student standing", value: user.studentStanding?.replaceAll("_", " ") || "—" },
    { label: "Semester", value: user.semester?.toString() || "—" },
    { label: "Account type", value: user.temporaryAccount ? "Temporary" : "Official" },
    { label: "Joined", value: new Date(user.createdAt).toLocaleDateString() },
  ] : [];
  const avatarSrc = resolveFileUrl(user?.avatarUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-details-title"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-[4px_4px_0_0_#0c1228]"
        style={{ border: "1px solid rgba(198,198,205,0.5)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close user details"
          onClick={onClose}
          style={{ position: "absolute", top: 16, right: 18, border: 0, background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 24, lineHeight: 1 }}
        >
          ×
        </button>

        {isLoading && (
          <div className="space-y-4" aria-label="Loading user details">
            <div className="h-12 w-12 animate-pulse rounded-full bg-slate-200" />
            <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
            <div className="h-40 animate-pulse rounded bg-slate-100" />
          </div>
        )}

        {isError && (
          <div>
            <h2 id="user-details-title" style={{ fontSize: 18, fontWeight: 700, color: "#0e1528" }}>User Details</h2>
            <p style={{ marginTop: 16, color: "#991b1b", fontSize: 14 }}>
              {error?.message || "Failed to load user details."}
            </p>
          </div>
        )}

        {user && (
          <>
            <div className="flex items-center gap-3" style={{ paddingRight: 32 }}>
              {avatarSrc ? (
                <button
                  type="button"
                  onClick={() => setShowAvatarPreview(true)}
                  className="h-14 w-14 shrink-0 overflow-hidden rounded-full"
                  style={{
                    backgroundImage: `url("${avatarSrc}")`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                    border: "2px solid #e0f2fe",
                    padding: 0,
                    cursor: "zoom-in",
                  }}
                  aria-label={`View ${user.fullName}'s avatar in full size`}
                  title="Click to enlarge"
                />
              ) : (
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: "#e0f2fe", color: "#0369a1", fontSize: 18, fontWeight: 700 }}
                >
                  {user.fullName.trim().charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 id="user-details-title" style={{ fontSize: 20, fontWeight: 700, color: "#0e1528" }}>{user.fullName}</h2>
                <div className="mt-1 flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full px-2 py-1" style={{ fontSize: 12, fontWeight: 600, ...USER_TYPE_COLORS[user.userType] }}>
                    {USER_TYPE_LABELS[user.userType] ?? user.userType}
                  </span>
                  <span className="inline-flex rounded-full px-2 py-1" style={{ fontSize: 12, fontWeight: 600, ...STATUS_COLORS[user.status] }}>
                    {user.status}
                  </span>
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2" style={{ marginTop: 24, borderTop: "1px solid #e2e8f0", paddingTop: 20 }}>
              {details.map((detail) => (
                <div key={detail.label}>
                  <dt style={{ fontSize: 12, fontWeight: 600, color: "#8891a5" }}>{detail.label}</dt>
                  <dd style={{ marginTop: 3, fontSize: 14, color: "#0e1528", overflowWrap: "anywhere" }}>{detail.value}</dd>
                </div>
              ))}
            </dl>

            <section style={{ marginTop: 24, borderTop: "1px solid #e2e8f0", paddingTop: 20 }}>
              <div className="flex items-center justify-between">
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0e1528" }}>Achievements</h3>
                {!isLoadingAchievements && (
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    {achievements.length} {achievements.length === 1 ? "achievement" : "achievements"}
                  </span>
                )}
              </div>

              {isLoadingAchievements && (
                <div className="mt-3 space-y-2">
                  {[0, 1].map((item) => (
                    <div key={item} className="h-20 animate-pulse rounded bg-slate-100" />
                  ))}
                </div>
              )}

              {isAchievementsError && (
                <p style={{ marginTop: 12, color: "#991b1b", fontSize: 13 }}>
                  Failed to load achievements.
                </p>
              )}

              {!isLoadingAchievements && !isAchievementsError && achievements.length === 0 && (
                <div style={{ marginTop: 12, padding: "20px 16px", backgroundColor: "#f8fafc", border: "1px dashed #cbd5e1", textAlign: "center" }}>
                  <p style={{ fontSize: 13, color: "#64748b" }}>No achievements recorded yet.</p>
                </div>
              )}

              {!isLoadingAchievements && achievements.length > 0 && (
                <div className="mt-3 space-y-2">
                  {achievements.map((achievement) => {
                    const isAward = achievement.type === "TEAM_AWARD";
                    const prize = formatAchievementPrize(achievement);
                    return (
                      <article
                        key={`${achievement.type}-${achievement.id}`}
                        className="flex gap-3"
                        style={{
                          padding: 14,
                          border: `1px solid ${isAward ? "#fde68a" : "#bae6fd"}`,
                          backgroundColor: isAward ? "#fffbeb" : "#f0f9ff",
                        }}
                      >
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: isAward ? "#fef3c7" : "#e0f2fe", color: isAward ? "#92400e" : "#0369a1", fontSize: 18 }}
                          aria-hidden="true"
                        >
                          {isAward ? "★" : "✓"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0e1528" }}>
                              {achievement.eventName || "Hackathon"}
                            </h4>
                            <time style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>
                              {new Date(achievement.achievedAt).toLocaleDateString()}
                            </time>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                            <p style={{ fontSize: 12, color: "#64748b" }}>
                              <span style={{ fontWeight: 600, color: "#475569" }}>Prize: </span>
                              <span style={{ color: isAward ? "#b45309" : "#0369a1", fontWeight: 700 }}>
                                {prize.label}
                              </span>
                              {prize.detail ? (
                                <span style={{ color: "#64748b" }}> — {prize.detail}</span>
                              ) : null}
                            </p>
                            <p style={{ fontSize: 12, color: "#64748b" }}>
                              <span style={{ fontWeight: 600, color: "#475569" }}>Team: </span>
                              {achievement.teamName || "—"}
                            </p>
                            {achievement.prizeRank && (
                              <p style={{ fontSize: 12, color: "#64748b" }}>
                                <span style={{ fontWeight: 600, color: "#475569" }}>Ranking: </span>
                                {RANKING_LABELS[achievement.prizeRank]}
                              </p>
                            )}
                          </div>
                          <div className="mt-3">
                            <button
                              type="button"
                              onClick={() =>
                                setCertificate(
                                  buildCertificateData(achievement, {
                                    fullName: user.fullName,
                                  }),
                                )
                              }
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                height: 32,
                                padding: "0 12px",
                                border: "1px solid #1a2b56",
                                background: "#fff",
                                color: "#1a2b56",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              <span aria-hidden="true">📜</span>
                              Certificate
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <AchievementCertificateDialog
        open={certificate != null}
        data={certificate}
        onClose={() => setCertificate(null)}
      />

      {showAvatarPreview && avatarSrc && user && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${user.fullName}'s avatar (enlarged)`}
          onClick={(event) => {
            event.stopPropagation();
            setShowAvatarPreview(false);
          }}
        >
          <div className="absolute inset-0 bg-black/70" />
          <button
            type="button"
            aria-label="Close avatar preview"
            onClick={(event) => {
              event.stopPropagation();
              setShowAvatarPreview(false);
            }}
            style={{ position: "absolute", top: 20, right: 24, zIndex: 1, border: 0, background: "transparent", color: "#ffffff", cursor: "pointer", fontSize: 32, lineHeight: 1 }}
          >
            ×
          </button>
          <div
            className="relative max-h-[85vh] max-w-[85vw] rounded-full"
            style={{
              width: "min(70vh, 70vw, 480px)",
              aspectRatio: "1 / 1",
              backgroundImage: `url("${avatarSrc}")`,
              backgroundPosition: "center",
              backgroundSize: "cover",
              border: "4px solid rgba(255,255,255,0.85)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
              cursor: "zoom-out",
            }}
            role="img"
            aria-label={`${user.fullName}'s avatar`}
          />
        </div>
      )}
    </div>
  );
}

function UserRow({ u, onView, onApprove, onReject, onDeactivate, onReactivate, onDelete, actionError }: {
  u: UserListItem;
  onView: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (user: UserListItem) => void;
  onDeactivate: (user: UserListItem) => void;
  onReactivate: (user: UserListItem) => void;
  onDelete: (user: UserListItem) => void;
  actionError: string | null;
}) {
  const protectedAccount = isProtectedAccount(u.email);
  const canManage = !protectedAccount && u.userType !== "SYSTEM_ADMIN";

  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={bodyCell}>
        <button
          type="button"
          onClick={() => onView(u.id)}
          style={{ border: 0, background: "transparent", padding: 0, color: "#0e1528", cursor: "pointer", fontSize: 14, fontWeight: 600, textAlign: "left", textDecoration: "underline", textDecorationColor: "#bae6fd", textUnderlineOffset: 3 }}
        >
          {u.fullName}
        </button>
      </td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{u.email}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{u.studentId ?? "—"}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{u.schoolName ?? "—"}</td>
      <td style={bodyCell}>
        <span className="inline-flex rounded-full px-2 py-1" style={{ fontSize: 12, fontWeight: 600, ...USER_TYPE_COLORS[u.userType] }}>
          {USER_TYPE_LABELS[u.userType] ?? u.userType}
        </span>
      </td>
      <td style={bodyCell}>
        <span className="inline-flex rounded-full px-2 py-1" style={{ fontSize: 12, fontWeight: 600, ...STATUS_COLORS[u.status] }}>
          {u.status}
        </span>
      </td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
      <td style={bodyCell}>
        {u.status === "PENDING" && (
          <div className="flex gap-2">
            <button onClick={() => onApprove(u.id)} style={{ fontSize: 12, fontWeight: 600, color: "#166534", background: "none", border: "none", cursor: "pointer" }}>
              Approve
            </button>
            <button onClick={() => onReject(u)} style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", background: "none", border: "none", cursor: "pointer" }}>
              Reject
            </button>
          </div>
        )}
        {canManage && u.status === "ACTIVE" && (
          <button
            onClick={() => onDeactivate(u)}
            style={{ fontSize: 12, fontWeight: 600, color: "#92400e", background: "none", border: "none", cursor: "pointer" }}
          >
            Deactivate
          </button>
        )}
        {canManage && u.status === "LOCKED" && (
          <button
            onClick={() => onReactivate(u)}
            style={{ fontSize: 12, fontWeight: 600, color: "#166534", background: "none", border: "none", cursor: "pointer" }}
          >
            Reactivate
          </button>
        )}
        {canManage && u.status !== "PENDING" && (
          <button
            onClick={() => onDelete(u)}
            style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", background: "none", border: "none", cursor: "pointer", marginLeft: u.status === "ACTIVE" || u.status === "LOCKED" ? 8 : 0 }}
          >
            Delete
          </button>
        )}
        {actionError && (
          <p style={{ fontSize: 11, color: "#991b1b", marginTop: 4, maxWidth: 220 }}>{actionError}</p>
        )}
      </td>
    </tr>
  );
}

export function UserManagementPage() {
  const [search, setSearch] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<UserType | "">("");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "">("");
  const [page, setPage] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionErrorUserId, setActionErrorUserId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useAdminUsers({
    search: search || undefined,
    userType: userTypeFilter || undefined,
    status: statusFilter || undefined,
    page,
    size: 20,
  });

  const users = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const { mutate: approveOrReject } = useApproveOrReject();
  const { mutate: deactivateUser } = useDeactivateUser();
  const { mutate: reactivateUser } = useReactivateUser();
  const { mutate: deleteUser } = useDeleteUser();

  const handleApprove = (userId: string) => {
    approveOrReject({ userId, action: "APPROVE" });
  };

  const handleReject = (user: UserListItem) => {
    const reason = window.prompt(`Enter reason for rejecting account ${user.fullName}:`, "");
    if (reason === null) return;

    setActionError(null);
    setActionErrorUserId(null);
    approveOrReject(
      { userId: user.id, action: "REJECT", reason: reason.trim() || "Rejected by administrator" },
      {
        onError: (err) => {
          setActionErrorUserId(user.id);
          setActionError(err instanceof Error ? err.message : "Failed to reject user");
        },
      },
    );
  };

  const handleDeactivate = (user: UserListItem) => {
    if (!window.confirm(`Deactivate ${user.fullName} (${user.email})? They will no longer appear in lecturer lists.`)) {
      return;
    }
    setActionError(null);
    setActionErrorUserId(null);
    deactivateUser(user.id, {
      onError: (err) => {
        setActionErrorUserId(user.id);
        setActionError(err instanceof Error ? err.message : "Failed to deactivate user");
      },
    });
  };

  const handleReactivate = (user: UserListItem) => {
    if (!window.confirm(`Reactivate ${user.fullName} (${user.email})?`)) {
      return;
    }
    setActionError(null);
    setActionErrorUserId(null);
    reactivateUser(user.id, {
      onError: (err) => {
        setActionErrorUserId(user.id);
        setActionError(err instanceof Error ? err.message : "Failed to reactivate user");
      },
    });
  };

  const handleDelete = (user: UserListItem) => {
    if (!window.confirm(`Permanently delete ${user.fullName} (${user.email})? This cannot be undone.`)) {
      return;
    }
    setActionError(null);
    setActionErrorUserId(null);
    deleteUser(user.id, {
      onError: (err) => {
        setActionErrorUserId(user.id);
        setActionError(err instanceof Error ? err.message : "Failed to delete user");
      },
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          User Management
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Manage users, roles, and permissions.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3" style={{ marginBottom: 16 }}>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            style={{ ...inputStyle, width: 280 }}
            placeholder="Search by name or email..."
          />
          <select
            value={userTypeFilter}
            onChange={(e) => { setUserTypeFilter(e.target.value as UserType | ""); setPage(0); }}
            style={inputStyle}
          >
            <option value="">All Roles</option>
            <option value="SYSTEM_ADMIN">Admin</option>
            <option value="FPT_STUDENT">FPT Student</option>
            <option value="EXTERNAL_STUDENT">External Student</option>
            <option value="LECTURER">Lecturer</option>
            <option value="EVENT_COORDINATOR">Coordinator</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as AccountStatus | ""); setPage(0); }}
            style={inputStyle}
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
            <option value="LOCKED">Locked</option>
          </select>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{ backgroundColor: "#38bdf8", color: "#fff", padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}
        >
          Create Account
        </button>
      </div>

      <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#eef0f6" }}>
              <th style={headerCell}>Name</th>
              <th style={headerCell}>Email</th>
              <th style={{ ...headerCell, width: 110 }}>Student ID</th>
              <th style={{ ...headerCell, width: 140 }}>School</th>
              <th style={{ ...headerCell, width: 130 }}>Role</th>
              <th style={{ ...headerCell, width: 110 }}>Status</th>
              <th style={{ ...headerCell, width: 110 }}>Joined</th>
              <th style={{ ...headerCell, width: 140 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} style={{ padding: "14px 16px" }}><div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} /></td>
                  ))}</tr>
                ))
              : users.map((u) => (
                  <UserRow
                    key={u.id}
                    u={u}
                    onView={setSelectedUserId}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onDeactivate={handleDeactivate}
                    onReactivate={handleReactivate}
                    onDelete={handleDelete}
                    actionError={actionErrorUserId === u.id ? actionError : null}
                  />
                ))
            }
            {!isLoading && isError && (
              <tr>
                <td colSpan={8} style={{ ...bodyCell, textAlign: "center", color: "#991b1b", padding: "48px 16px" }}>
                  {error?.message || "Failed to load users. Please check your login session."}
                </td>
              </tr>
            )}
            {!isLoading && !isError && users.length === 0 && (
              <tr>
                <td colSpan={8} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2" style={{ marginTop: 16 }}>
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            style={{ ...inputStyle, cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.5 : 1 }}
          >
            Previous
          </button>
          <span style={{ fontSize: 14, color: "#8891a5" }}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            style={{ ...inputStyle, cursor: page >= totalPages - 1 ? "default" : "pointer", opacity: page >= totalPages - 1 ? 0.5 : 1 }}
          >
            Next
          </button>
        </div>
      )}
      {showCreateModal && <CreateAccountModal onClose={() => setShowCreateModal(false)} />}
      {selectedUserId && <UserDetailsModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />}
    </div>
  );
}
