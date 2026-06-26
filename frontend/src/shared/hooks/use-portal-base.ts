"use client";

import { usePathname } from "next/navigation";

export function usePortalBase(): string {
  const pathname = usePathname();
  if (pathname.startsWith("/lecturer")) return "/lecturer";
  return "/lecturer";
}
