import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import ClientLayoutWrapper from "./ClientLayoutWrapper";
import { SonnerToaster } from "@/components/ui/sonner-toaster";

// the wrapper must be a client component so we can use usePathname
// defined below to avoid module resolution issues

export const metadata: Metadata = {
  title: "AI Planner | Plan with us and never fall behind",
  description:
    "An application that helps you schedule your posts and reminds you exactly when to publish them.",
};

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-poppins",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} bg-background text-foreground antialiased`}
        style={{
          margin: 0,
          padding: 0,
        }}
      >
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
        <SonnerToaster />
      </body>
    </html>
  );
}
