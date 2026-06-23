"use client";

import { usePathname } from "next/navigation";

export function usePortalBase(): string {
  const pathname = usePathname();
  if (pathname.startsWith("/lecturer")) return "/lecturer";
  if (pathname.startsWith("/mentor")) return "/mentor";
  return "/judge";
}
