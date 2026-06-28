"use client";

import { useState } from "react";
import { useStaffAssignments, useAssignStaff, useRemoveStaff } from "@/features/admin/hooks/use-admin-assignments";
import type { StaffAssignment, StaffPermission } from "@/features/admin/types/admin-assignment.types";

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

const ALL_PERMISSIONS: StaffPermission[] = [
  "MANAGE_USERS", "MANAGE_HACKATHONS", "MANAGE_JUDGES", "VIEW_ANALYTICS", "EXPORT_DATA",
];

function StaffRow({ s }: { s: StaffAssignment }) {
  const { mutate: remove } = useRemoveStaff();
  return (
    <tr style={{ borderTop: "1px solid rgba(198,198,205,0.3)" }}>
      <td style={{ ...bodyCell, fontWeight: 600 }}>{s.staffName}</td>
      <td style={{ ...bodyCell, color: "#8891a5" }}>{s.staffEmail}</td>
      <td style={bodyCell}>{s.role}</td>
      <td style={bodyCell}>
        <div className="flex flex-wrap gap-1">
          {s.permissions.map((p) => (
            <span key={p} className="rounded-full px-2 py-0.5" style={{ fontSize: 11, fontWeight: 500, backgroundColor: "#ffffff", color: "#0e1528" }}>
              {p.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      </td>
      <td style={bodyCell}>
        <button
          onClick={() => remove(s.staffId)}
          style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", background: "none", border: "none", cursor: "pointer" }}
        >
          Remove
        </button>
      </td>
    </tr>
  );
}

export function StaffAssignmentPage() {
  const { data: rawData, isLoading } = useStaffAssignments();
  const { mutate: assign, isPending } = useAssignStaff();
  const [staffId, setStaffId] = useState("");
  const [role, setRole] = useState("");
  const [permissions, setPermissions] = useState<StaffPermission[]>([]);
  // useStaffAssignments returns never[] (stub), cast safely
  const staff = (rawData ?? []) as StaffAssignment[];

  const togglePerm = (p: StaffPermission) => {
    setPermissions((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };

  const handleAssign = () => {
    if (staffId && role) {
      assign({ staffId, role, permissions }, { onSuccess: () => { setStaffId(""); setRole(""); setPermissions([]); } });
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0e1528", letterSpacing: "-0.64px", lineHeight: "38.4px" }}>
          Staff Assignment
        </h1>
        <p style={{ fontSize: 14, color: "#8891a5", lineHeight: "21px", marginTop: 4 }}>
          Assign staff roles and permissions.
        </p>
      </div>

      <div className="flex flex-col gap-4 p-5 mb-6 border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <div className="flex items-end gap-3">
          <div className="flex flex-col">
            <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>Staff ID</label>
            <input value={staffId} onChange={(e) => setStaffId(e.target.value)} style={inputStyle} placeholder="Staff ID" />
          </div>
          <div className="flex flex-col">
            <label style={{ fontSize: 12, fontWeight: 600, color: "#8891a5", marginBottom: 4 }}>Role</label>
            <input value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle} placeholder="e.g. Coordinator" />
          </div>
          <button
            onClick={handleAssign}
            disabled={isPending || !staffId || !role}
            className="border-2 border-navy bg-seal-yellow px-6 py-2.5 text-sm text-navy font-mono font-bold cursor-pointer"
          >
            Assign
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_PERMISSIONS.map((p) => (
            <label key={p} className="flex items-center gap-1 cursor-pointer" style={{ fontSize: 13 }}>
              <input type="checkbox" checked={permissions.includes(p)} onChange={() => togglePerm(p)} />
              {p.replace(/_/g, " ")}
            </label>
          ))}
        </div>
      </div>

      <div className="overflow-hidden border-2 border-navy bg-white shadow-[4px_4px_0_0_#0c1228]">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#eef0f6" }}>
              <th style={headerCell}>Staff Name</th>
              <th style={headerCell}>Email</th>
              <th style={{ ...headerCell, width: 120 }}>Role</th>
              <th style={headerCell}>Permissions</th>
              <th style={{ ...headerCell, width: 90 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} style={{ padding: "14px 16px" }}><div className="animate-pulse rounded" style={{ height: 14, backgroundColor: "rgba(223,226,236,0.8)", width: "60%" }} /></td>
                  ))}</tr>
                ))
              : staff.map((s) => <StaffRow key={s.id} s={s} />)
            }
            {!isLoading && staff.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...bodyCell, textAlign: "center", color: "#8891a5", padding: "48px 16px" }}>
                  No staff assignments.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
