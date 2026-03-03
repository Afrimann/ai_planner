"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AppShell } from "@/components/app-shell";

export default function ClientLayoutWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  // for landing and pricing we render children directly; everything else
  // gets the authenticated app shell.
  if (pathname === "/" || pathname.startsWith("/pricing") || pathname.startsWith("/checkout")) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
