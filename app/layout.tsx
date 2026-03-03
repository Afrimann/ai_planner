import type { Metadata } from "next";
import { Suspense } from "react";
import { NavigationSplash } from "@/components/NavigationSplash";
import "./globals.css";
import ClientLayoutWrapper from "./ClientLayoutWrapper";

// the wrapper must be a client component so we can use usePathname
// defined below to avoid module resolution issues

export const metadata: Metadata = {
  title: "AI Planner | Plan with us and never fall behind",
  description:
    "An application that helps you schedule your posts and reminds you exactly when to publish them.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#07070f",
          color: "#eeeaf8",
          margin: 0,
          padding: 0,
        }}
      >
        <Suspense fallback={null}>
          <NavigationSplash />
        </Suspense>
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}


