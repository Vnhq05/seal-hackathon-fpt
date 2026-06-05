/**
 * postcss.config.mjs — Tailwind CSS v4 chạy qua plugin PostCSS này.
 * Next.js tự đọc file này khi build CSS. Không cần sửa gì thêm.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
