"use client";

import { usePathname } from "next/navigation";

export type StaffPortalBase = "/admin" | "/coordinator";

export function useStaffPortalBase(): StaffPortalBase {
  const pathname = usePathname();
  if (pathname.startsWith("/coordinator")) return "/coordinator";
  return "/admin";
}
