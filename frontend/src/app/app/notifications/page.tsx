"use client";
/* ----------------------------------------------------------------------------
 * notifications — mọi vai trò xem thông báo của mình.
 * Dữ liệu lấy TỪ BACKEND THẬT (GET /api/notifications/me). Không còn dùng mock
 * (SEED_NOTIFICATIONS trong judging-store) nữa.
 * -------------------------------------------------------------------------- */
import * as React from "react";
import { PageHeader } from "@/components/app-shell";
import { listMyNotifications, type BackendNotification } from "@/lib/notifications-api";
import { Bell } from "lucide-react";

export default function Notifications() {
  const [notifications, setNotifications] = React.useState<BackendNotification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setNotifications(await listMyNotifications());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  return (
    <div>
      <PageHeader title="Notifications" />

      {loading && <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">Loading from backend…</div>}
      {error && <div className="rounded-xl border bg-card p-6 text-sm text-destructive">Couldn&apos;t reach backend: {error}<div className="text-xs text-muted-foreground mt-1">Make sure the backend is running at http://localhost:8080.</div></div>}

      {!loading && !error && (
        <div className="rounded-xl border bg-card divide-y">
          {notifications.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No notifications.</div>}
          {notifications.map((n) => (
            <div key={n.id} className="p-4 flex items-start gap-3">
              <div className={`h-8 w-8 rounded-md grid place-items-center ${n.type === "warning" ? "bg-warning/15 text-warning" : n.type === "success" ? "bg-success/15 text-success" : "bg-info/15 text-info"}`}><Bell className="h-4 w-4" /></div>
              <div className="flex-1">
                <div className="font-medium text-sm">{n.title}</div>
                <div className="text-xs text-muted-foreground">{n.body}</div>
              </div>
              <div className="text-xs text-muted-foreground">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
