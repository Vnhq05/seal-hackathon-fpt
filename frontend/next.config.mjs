/**
 * next.config.mjs — cấu hình Next.js.
 * Hiện chưa cần tùy chỉnh gì đặc biệt nên để rỗng. Sau này muốn bật ảnh từ
 * domain ngoài, rewrites, proxy API sang backend... thì thêm vào object này.
 * @type {import('next').NextConfig}
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
    allowedDevOrigins: ['192.168.1.5']
};

export default nextConfig;