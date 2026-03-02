"use client";

import React from "react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MainContent from "@/components/layout/MainContent";

// The AppShell is the application's root layout wrapper.  It provides a
// responsive sidebar that collapses on desktop and slides in as an
// overlay on mobile, a top header with a menu toggle and user menu, and
// an animated content area driven by Framer Motion.
//
// Pages do not need to know about any of this; they simply render as
// children of AppShell in `app/layout.tsx`.

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // always compute this value but don't early-return before hooks
  const isAuthRoute = pathname.startsWith("/auth");

  useEffect(() => {
    // close mobile overlay when navigating
    setSidebarOpen(false);
  }, [pathname]);

  if (isAuthRoute) {
    // still render children inside MainContent so that page-level
    // transitions are preserved, but omit sidebar/header entirely.
    return (
      <div className="min-h-screen bg-white text-gray-900">
        <MainContent>{children}</MainContent>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white text-gray-900">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1">
        <Header
          onMenuToggle={() => setSidebarOpen((o) => !o)}
          sidebarOpen={sidebarOpen}
        />
        <MainContent>{children}</MainContent>
      </div>
    </div>
  );
}
