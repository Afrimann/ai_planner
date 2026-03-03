"use client";

import React from "react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MainContent from "@/components/layout/MainContent";
import { ScheduledPostNotifier } from "@/components/posts/ScheduledPostNotifier";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isAuthRoute = pathname.startsWith("/auth");

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isAuthRoute) {
    return (
      <div
        style={{ minHeight: "100vh", background: "#07070f", color: "#eeeaf8" }}
      >
        <MainContent>{children}</MainContent>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#07070f",
        color: "#eeeaf8",
        overflow: "hidden",
      }}
    >
      <ScheduledPostNotifier />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
        }}
      >
        <Header
          onMenuToggle={() => setSidebarOpen((o) => !o)}
          sidebarOpen={sidebarOpen}
        />
        <MainContent>{children}</MainContent>
      </div>
    </div>
  );
}
