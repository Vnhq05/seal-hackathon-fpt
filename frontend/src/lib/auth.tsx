"use client";
/* ----------------------------------------------------------------------------
 * auth.tsx — quản lý đăng nhập/đăng ký và "ai đang đăng nhập" (qua React Context).
 * Mọi component gọi useAuth() đều lấy được user hiện tại + các hàm login/logout/register.
 *
 * login : /api/auth/login lấy token -> /api/auth/me lấy hồ sơ -> lưu session.
 * register: /api/auth/register (tạo + trả token ngay) -> /api/auth/me -> lưu session.
 * Lưu localStorage: "seal_session" (user đang đăng nhập), "seal_users" (data demo cũ).
 * -------------------------------------------------------------------------- */
import * as React from "react";
import { apiGet, apiPost, setToken, clearToken } from "@/lib/api"; // "cầu nối" gọi xuống Backend (xem src/lib/api.ts)

// 6 vai trò trong hệ thống. "Lecturer" = vừa Mentor vừa Judge (xem view-mode.ts).
export type Role = "Participant" | "Judge" | "Mentor" | "Lecturer" | "Coordinator" | "Admin";
// Trạng thái tài khoản: chờ duyệt / đang hoạt động / bị khóa.
export type AccountStatus = "pending" | "active" | "suspended";

export interface User {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  school?: string;
  role: Role;
  status: AccountStatus;
  cccd?: string;
}

// StoredUser = User + mật khẩu. Bản "đầy đủ" lưu trong localStorage.
// Khi trả ra ngoài cho component dùng, ta cắt password đi (xem publicUser).
interface StoredUser extends User {
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  studentId: string;
  isFPT: boolean;
  school?: string;
}

const USERS_KEY = "seal_users";     // khóa localStorage: danh sách user (phần demo còn lại)
const SESSION_KEY = "seal_session"; // khóa localStorage: user đang đăng nhập

/* ----------------------------------------------------------------------------
 * HỢP ĐỒNG API ĐĂNG NHẬP (đã dò xác nhận với Backend Spring Boot thật):
 *   POST /api/auth/login  { email, password }  -> { accessToken, refreshToken }
 *   GET  /api/auth/me      (kèm Bearer token)   -> { id, name, email, role }
 * (Token được api.ts tự lưu/gắn — xem setToken/getToken trong src/lib/api.ts.)
 * -------------------------------------------------------------------------- */
interface TokenResponse { accessToken: string; refreshToken: string; }
interface MeResponse { id: number | string; name: string; email: string; role: Role; }

// SEED = dữ liệu "mồi" tạo sẵn để demo. Lần đầu mở app, danh sách này được ghi
// vào localStorage. Tất cả mật khẩu demo đều là "demo1234".
const SEED_USERS: StoredUser[] = [
  { id: "u1", name: "Alex Chen", email: "alex@seal.dev", studentId: "SE171234", role: "Participant", status: "active", password: "demo1234" },
  { id: "u2", name: "Dr. Maya Patel", email: "maya@seal.dev", role: "Mentor", status: "active", password: "demo1234" },
  { id: "u3", name: "Judge Linh", email: "linh@seal.dev", role: "Judge", status: "active", password: "demo1234" },
  { id: "u4", name: "Coord Minh", email: "minh@seal.dev", role: "Coordinator", status: "active", password: "demo1234" },
  { id: "u5", name: "Admin Root", email: "admin@seal.dev", role: "Admin", status: "active", password: "demo1234" },
  { id: "u6", name: "Pending Student", email: "pending@seal.dev", studentId: "SE189999", role: "Participant", status: "pending", password: "demo1234" },
  { id: "u7", name: "Mentor Quynh", email: "quynh@seal.dev", role: "Mentor", status: "active", password: "demo1234" },
  { id: "u8", name: "Lecturer Khoa", email: "lecturer@seal.dev", role: "Lecturer", status: "active", password: "demo1234" },
];

// Đọc danh sách user từ localStorage. Nếu chưa có thì ghi SEED vào và trả về SEED.
function loadUsers(): StoredUser[] {
  if (typeof window === "undefined") return SEED_USERS; // chạy ở server → chưa có localStorage
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
    return SEED_USERS;
  }
  try {
    const stored = JSON.parse(raw) as StoredUser[];
    // Merge in any seed users missing from older localStorage snapshots
    // (e.g. Lecturer u8 added after the user already had cached seed).
    const missing = SEED_USERS.filter((s) => !stored.some((u) => u.email === s.email));
    if (missing.length > 0) {
      const merged = [...stored, ...missing];
      localStorage.setItem(USERS_KEY, JSON.stringify(merged));
      return merged;
    }
    return stored;
  } catch { return SEED_USERS; }
}
// Ghi danh sách user xuống localStorage rồi bắn sự kiện báo "dữ liệu đổi" để
// hook useAllUsers (cuối file) tự cập nhật lại danh sách đang hiển thị.
function saveUsers(u: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(u));
  window.dispatchEvent(new CustomEvent("auth-store-changed"));
}
// Bỏ trường password trước khi đưa user ra ngoài (cú pháp "...rest" = lấy mọi
// trường CÒN LẠI trừ password).
function publicUser(u: StoredUser): User {
  const { password: _p, ...rest } = u;
  return rest;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  register: (input: RegisterInput) => Promise<void>;
  approveUser: (userId: string) => void;
  suspendUser: (userId: string) => void;
  reactivateUser: (userId: string) => void;
  createStaffAccount: (input: { name: string; email: string; role: Role; tempPassword: string }) => User;
  allUsers: () => User[];
  resetPassword: (email: string) => string;
}

// Tạo "hộp" Context rỗng. Provider bên dưới sẽ đổ giá trị vào hộp này.
const Ctx = React.createContext<AuthCtx | null>(null);

// AuthProvider bọc quanh toàn app (xem src/app/providers.tsx) để mọi trang
// dùng được useAuth(). `children` = phần app nằm bên trong.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true); // true khi đang đọc session lúc mới mở app

  // Chạy 1 lần khi app khởi động: đọc session đã lưu để giữ trạng thái đăng nhập.
  React.useEffect(() => {
    loadUsers();
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch {}
    }
    setLoading(false);
  }, []);

  const persistSession = (u: User | null) => {
    if (u) localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    else {
      localStorage.removeItem(SESSION_KEY);
      clearToken(); // đăng xuất → bỏ luôn token
    }
    setUser(u);
  };

  const value: AuthCtx = {
    user,
    loading,
    // Logic: /login lấy token -> /me lấy hồ sơ -> lưu session.
    login: async (email, password) => {
      const res = await apiPost<TokenResponse | string>("/api/auth/login", { email, password });
      // Sai mật khẩu: Back-end trả chữ "Bad credentials" (không phải JSON) -> báo lỗi.
      if (typeof res === "string" || !res?.accessToken) {
        throw new Error("Incorrect email or password.");
      }
      setToken(res.accessToken);
      const me = await apiGet<MeResponse>("/api/auth/me");
      // Back-end chưa trả "status"; đăng nhập được nghĩa là hợp lệ -> active.
      const u: User = { id: String(me.id), name: me.name, email: me.email, role: me.role, status: "active" };
      persistSession(u);
      return u;
    },
    logout: () => persistSession(null),
    // Logic MỚI: Participant đăng ký -> backend tạo tài khoản status "pending"
    // (KHÔNG cấp token). Tài khoản phải được Admin/Coordinator duyệt mới đăng
    // nhập được -> ở đây KHÔNG tự đăng nhập, chỉ gọi API tạo rồi để trang
    // register chuyển về /login kèm thông báo "chờ duyệt".
    register: async (input) => {
      await apiPost("/api/auth/register", {
        email: input.email,
        username: input.email,             // Back-end định danh bằng email -> username = email.
        password: input.password,
        name: input.email.split("@")[0],   // Form không có "Full name" -> tạm lấy phần trước @.
        studentId: input.studentId,
        school: input.isFPT ? "FPT University" : input.school,
      });
    },
    approveUser: (userId) => {
      const users = loadUsers();
      saveUsers(users.map((u) => (u.id === userId ? { ...u, status: "active" } : u)));
    },
    suspendUser: (userId) => {
      const users = loadUsers();
      saveUsers(users.map((u) => (u.id === userId ? { ...u, status: "suspended" } : u)));
    },
    reactivateUser: (userId) => {
      const users = loadUsers();
      saveUsers(users.map((u) => (u.id === userId ? { ...u, status: "active" } : u)));
    },
    createStaffAccount: ({ name, email, role, tempPassword }) => {
      const users = loadUsers();
      if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) throw new Error("Email already exists.");
      const u: StoredUser = { id: `u${Date.now()}`, name, email, role, status: "active", password: tempPassword };
      saveUsers([...users, u]);
      return publicUser(u);
    },
    allUsers: () => loadUsers().map(publicUser),
    resetPassword: (_email) => {
      // DEMO ONLY: returns a random code without storing it or sending an email.
      // Replace with a real flow (store code + expiry, send via email provider) when wiring auth.
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      return code;
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// useAuth() — hook để mọi component lấy user + các hàm login/logout...
// Báo lỗi nếu lỡ dùng ngoài AuthProvider (quên bọc Provider).
export function useAuth() {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}

// useAllUsers() — trả về danh sách TẤT CẢ user và tự cập nhật khi danh sách đổi
// (vd Admin duyệt/khoá tài khoản). Dùng ở trang Users Management, Account Approval...
export function useAllUsers() {
  const { allUsers } = useAuth();
  const [users, setUsers] = React.useState<User[]>([]);
  React.useEffect(() => {
    setUsers(allUsers());
    const h = () => setUsers(allUsers());
    window.addEventListener("auth-store-changed", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("auth-store-changed", h);
      window.removeEventListener("storage", h);
    };
  }, [allUsers]);
  return users;
}
