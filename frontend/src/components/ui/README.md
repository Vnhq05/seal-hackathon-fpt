# Thư mục `components/ui/` — thư viện giao diện (shadcn/ui)

Đây là các "viên gạch" giao diện dùng lại khắp app: nút, thẻ, ô nhập, hộp thoại...
Chúng đến từ **shadcn/ui** — không phải thư viện cài qua npm, mà là **code mẫu
được copy thẳng vào dự án** để mình tự do sửa. Vì vậy bạn ĐƯỢC PHÉP sửa chúng.

## Mỗi file theo 1 trong 2 kiểu

1. **Tự dựng bằng thẻ HTML + class** (đơn giản): `button.tsx`, `badge.tsx`,
   `input.tsx`, `card.tsx`, `label.tsx`, `textarea.tsx`, `table.tsx`, `skeleton.tsx`...
   → Xem `button.tsx` (đã comment kỹ) để hiểu pattern `cva` + `cn` + `forwardRef`.

2. **Bọc quanh Radix UI** (có tương tác phức tạp): `dialog.tsx`, `select.tsx`,
   `dropdown-menu.tsx`, `popover.tsx`, `tabs.tsx`, `tooltip.tsx`, `accordion.tsx`,
   `switch.tsx`, `checkbox.tsx`, `radio-group.tsx`, `slider.tsx`, `sheet.tsx`...
   → Radix lo logic (mở/đóng, bàn phím, focus); file ở đây chỉ thêm class cho đẹp.
   → Các file này có `"use client"` ở đầu vì chúng có tương tác (bắt buộc với Next.js).

## Điểm chung của mọi file

- Đều dùng `cn()` (từ `@/lib/utils`) để ghép class Tailwind.
- Đều cho truyền thêm `className` từ ngoài để tùy biến từng chỗ.
- Màu sắc (primary, card, border, success...) lấy từ biến CSS trong `src/app/globals.css`.

## Muốn hiểu sâu 1 component nào đó?

Đọc 2 file đã được comment đầy đủ làm mẫu: **`button.tsx`** (kiểu 1) và
**`dialog.tsx`** (kiểu 2). Nắm 2 file này là đọc hiểu được phần còn lại.
Cần mình comment chi tiết thêm file nào, cứ nói tên file. 🙂
