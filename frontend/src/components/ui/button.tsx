/* ============================================================================
 * button.tsx — component nút bấm. ĐÂY LÀ MẪU CHUẨN của thư viện shadcn/ui;
 * gần như mọi file trong components/ui/ đều theo cùng kiểu này:
 *
 *   1) cva(...) định nghĩa các "biến thể" (variant: default/outline/ghost...,
 *      size: sm/lg/icon...) → mỗi biến thể là 1 bộ class Tailwind.
 *   2) Component nhận props variant/size, dùng cn() ghép class lại.
 *   3) React.forwardRef để component cha có thể tham chiếu tới thẻ DOM thật.
 *   4) export ra component + bộ biến thể để nơi khác dùng.
 *
 * Dùng: <Button variant="outline" size="sm">Lưu</Button>
 * Hiểu file này là hiểu được hầu hết các component UI còn lại.
 * ========================================================================== */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// cva = "class variance authority": tham số 1 là class GỐC (luôn áp dụng),
// tham số 2 liệt kê các biến thể. Đổi class ở đây = đổi giao diện mọi nút.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

// Props = mọi thuộc tính của thẻ <button> chuẩn + variant/size (từ cva)
// + asChild. asChild=true → render thành thẻ con (vd <a>) thay vì <button>,
// nhờ <Slot> của Radix (hữu ích khi muốn 1 link trông giống nút).
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    // cn() ghép class biến thể với className truyền thêm từ ngoài. ...props gồm
    // onClick, disabled, type... được chuyển thẳng xuống thẻ thật.
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
