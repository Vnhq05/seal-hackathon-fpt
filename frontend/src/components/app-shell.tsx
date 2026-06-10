"use client";
/* ----------------------------------------------------------------------------
 * app-shell.tsx — KHUNG chung mọi trang trong /app: sidebar (menu) + header
 * (tìm kiếm, chuông, avatar) + vùng nội dung. Sửa ở đây áp dụng cho mọi vai trò.
 * Logic: lấy user (chưa đăng nhập thì không vẽ) -> tính vai trò -> lọc menu NAV
 *        theo vai trò -> vẽ sidebar + header + nội dung.
 * -------------------------------------------------------------------------- */
import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, type Role } from "@/lib/auth";
import { useViewMode, useEffectiveRole } from "@/lib/view-mode";
import {
  Bot, LayoutDashboard, Trophy, Users, MessageCircle, Gavel, Settings2,
  ShieldCheck, BarChart3, Bell, LogOut, Search, ChevronRight, ClipboardList,
  Sliders, UserPlus, UserCheck, FileText, FilePlus, User as UserIcon, ChevronDown,
} from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { listMyNotifications, type BackendNotification } from "@/lib/notifications-api";
import { listUsers } from "@/lib/users-api";

interface NavItem { label: string; path: string; icon: React.ComponentType<{ className?: string }>; roles: Role[]; }
interface NavGroup { label: string; items: NavItem[]; }

const ALL_ROLES: Role[] = ["Participant", "Judge", "Mentor", "Lecturer", "Coordinator", "Admin"];

const NAV: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", path: "/app/dashboard", icon: LayoutDashboard, roles: ALL_ROLES },
    ],
  },
  {
    label: "Participant",
    items: [
      { label: "Team", path: "/app/team", icon: Users, roles: ["Participant"] },
    ],
  },
  {
    label: "Mentor",
    items: [
      { label: "Mentor Chat", path: "/app/mentor-chat", icon: MessageCircle, roles: ["Participant", "Mentor", "Lecturer"] },
    ],
  },
  {
    label: "Judging",
    items: [
      { label: "Judge Console", path: "/app/judge-console", icon: Gavel, roles: ["Judge", "Lecturer"] },
    ],
  },
  {
    label: "Results",
    items: [
      { label: "Ranking", path: "/app/ranking", icon: BarChart3, roles: ALL_ROLES },
      { label: "Notifications", path: "/app/notifications", icon: Bell, roles: ALL_ROLES },
    ],
  },
  {
    label: "Coordinator",
    items: [
      { label: "Organizer Dashboard", path: "/app/event-control", icon: Trophy, roles: ["Coordinator", "Admin"] },
      { label: "Create Competition", path: "/app/create-competition", icon: FilePlus, roles: ["Coordinator", "Admin"] },
      { label: "Scoring Criteria", path: "/app/scoring-criteria", icon: Sliders, roles: ["Coordinator", "Admin"] },
      { label: "Judge & Mentor", path: "/app/judge-assign", icon: UserCheck, roles: ["Admin"] },
      { label: "Score Viewer", path: "/app/moderation", icon: ClipboardList, roles: ["Coordinator", "Admin"] },
      { label: "Account Approval", path: "/app/account-approval", icon: UserPlus, roles: ["Coordinator", "Admin"] },
      { label: "Audit Log", path: "/app/audit-log", icon: FileText, roles: ["Coordinator", "Admin"] },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Users Management", path: "/app/users-management", icon: Users, roles: ["Admin"] },
      { label: "Create Staff Account", path: "/app/create-account", icon: UserPlus, roles: ["Admin"] },
      { label: "System Settings", path: "/app/system-settings", icon: Settings2, roles: ["Admin"] },
      { label: "Security", path: "/app/security", icon: ShieldCheck, roles: ["Admin"] },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // đường dẫn hiện tại, vd "/app/dashboard"
  const [viewMode, setViewMode] = useViewMode();
  const effectiveRole = useEffectiveRole(user?.role);
  // Thông báo cho chuông — lấy từ BACKEND THẬT (GET /api/notifications/me).
  const [notifications, setNotifications] = React.useState<BackendNotification[]>([]);
  React.useEffect(() => {
    listMyNotifications().then(setNotifications).catch(() => setNotifications([]));
  }, []);

  // Số tài khoản đang chờ duyệt → badge đỏ trên mục "Account Approval" (chỉ Coordinator/Admin).
  const [pendingApprovals, setPendingApprovals] = React.useState(0);
  const canApprove = effectiveRole === "Coordinator" || effectiveRole === "Admin";
  React.useEffect(() => {
    if (!canApprove) { setPendingApprovals(0); return; }
    let active = true;
    const refresh = () =>
      listUsers()
        .then((us) => { if (active) setPendingApprovals(us.filter((u) => u.status === "pending").length); })
        .catch(() => { if (active) setPendingApprovals(0); });
    void refresh();
    // Cập nhật lại mỗi 30s và mỗi khi quay lại tab để badge luôn khớp số pending thực tế.
    const timer = setInterval(refresh, 30_000);
    const onFocus = () => void refresh();
    const onChanged = () => void refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("accounts:changed", onChanged);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("accounts:changed", onChanged);
    };
  }, [canApprove, pathname]);

  if (!user) return null;
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const isLecturer = user.role === "Lecturer";

  const handleSignOut = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <aside className="hidden md:flex w-64 sticky top-0 h-screen border-r border-sidebar-border bg-sidebar flex-col">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-sidebar-border">
          <div className="h-9 w-9 rounded-lg btn-gradient grid place-items-center shadow-lg shadow-primary/30">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">SEAL</div>
            <div className="text-[11px] text-muted-foreground">Hackathon System</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {NAV.map((group) => {
            const visible = group.items.filter((i) => effectiveRole && i.roles.includes(effectiveRole));
            if (!visible.length) return null;
            return (
              <div key={group.label}>
                <div className="px-2 mb-2 text-[10px] uppercase tracking-wider text-muted-foreground/80">{group.label}</div>
                <div className="space-y-0.5">
                  {visible.map((item) => {
                    const active = pathname === item.path;
                    const Icon = item.icon;
                    const badge = item.path === "/app/account-approval" ? pendingApprovals : 0;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={cn(
                          "group flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1 truncate">{item.label}</span>
                        {badge > 0 && (
                          <span className="shrink-0 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none shadow-sm">
                            {badge > 99 ? "99+" : badge}
                          </span>
                        )}
                        {active && <ChevronRight className="h-3.5 w-3.5" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
        <button
          onClick={handleSignOut}
          className="m-3 flex items-center gap-2 px-2.5 py-2 rounded-md text-sm text-sidebar-foreground/80 hover:bg-destructive/15 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 backdrop-blur-md bg-background/70 border-b">
          <div className="flex items-center gap-3 px-4 md:px-8 py-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search teams, judges, submissions…" className="pl-9 bg-card border-border" />
            </div>
            {/* spacer co giãn: đẩy cụm chuông + avatar sát mép PHẢI header (áp dụng mọi role) */}
            <div className="flex-1" />
            {isLecturer && (
              <Select value={viewMode} onValueChange={(v) => setViewMode(v as "Mentor" | "Judge")}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mentor">Mentor view</SelectItem>
                  <SelectItem value="Judge">Judge view</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative p-2 rounded-md hover:bg-accent" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <div className="font-semibold text-sm">Notifications</div>
                  <span className="text-[11px] text-muted-foreground">{notifications.length}</span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">No notifications yet</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="p-3 flex items-start gap-3">
                        <div className={cn(
                          "h-7 w-7 rounded-md grid place-items-center shrink-0",
                          n.type === "warning" ? "bg-warning/15 text-warning" : n.type === "success" ? "bg-success/15 text-success" : "bg-info/15 text-info",
                        )}>
                          <Bell className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs">{n.title}</div>
                          <div className="text-[11px] text-muted-foreground">{n.body}</div>
                          <div className="text-[10px] text-muted-foreground/70 mt-0.5">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Link href="/app/notifications" className="block px-4 py-2.5 text-center text-xs text-primary hover:underline border-t">
                  View all notifications
                </Link>
              </PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 pl-2 border-l hover:opacity-90" aria-label="Account menu">
                  <div className="h-8 w-8 rounded-full btn-gradient grid place-items-center text-xs font-semibold text-primary-foreground">
                    {initials}
                  </div>
                  <div className="leading-tight hidden sm:block text-left">
                    <div className="text-xs font-medium">{user.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {user.role}{isLecturer ? ` · ${viewMode} mode` : ""}
                    </div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => router.push("/app/profile")}>
                  <UserIcon className="h-3.5 w-3.5 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 grid-bg px-4 md:px-8 py-6">{children}</main>
        <Toaster richColors position="top-right" />
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
