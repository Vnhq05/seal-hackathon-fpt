/* ----------------------------------------------------------------------------
 * api.ts — nơi DUY NHẤT để gọi Back-end (Spring Boot).
 * Logic: lấy URL từ .env.local -> gắn header (JSON, skip-ngrok, token nếu có)
 *        -> gửi -> đọc JSON (hoặc chữ thường) -> lỗi thì throw, ok thì trả dữ liệu.
 * Dùng: apiGet/apiPost/apiPut/apiDelete | Token: setToken/clearToken.
 * -------------------------------------------------------------------------- */

// Địa chỉ Back-end (từ .env.local; thiếu thì mặc định về máy này).
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// Token (JWT) = "vé" đăng nhập, lưu trong localStorage.
const TOKEN_KEY = "seal_token";
export const getToken = (): string | null =>
  typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Hàm lõi: gửi 1 request, trả về dữ liệu đã đọc sẵn.
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  // Đọc nguyên văn rồi mới thử parse JSON (Back-end đôi khi trả chữ thường, vd "Bad credentials").
  const raw = await res.text();
  let data: unknown = raw;
  try { data = raw ? JSON.parse(raw) : undefined; } catch { /* giữ nguyên chữ */ }

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : raw || `Lỗi ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

// 4 thao tác cơ bản: GET lấy / POST tạo / PUT sửa / DELETE xoá.
export const apiGet = <T>(path: string) => request<T>(path);
export const apiPost = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) });
export const apiPut = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "PUT", body: JSON.stringify(body) });
export const apiDelete = <T>(path: string) =>
  request<T>(path, { method: "DELETE" });
