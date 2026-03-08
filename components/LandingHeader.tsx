"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { useCurrentUser } from "@/lib/use-current-user";

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useCurrentUser();

  // when user is undefined we are still loading; don't show auth links yet
  const renderAuthLinks = (closeMenu?: () => void) => {
    if (user === undefined) return null;
    if (user) {
      return (
        <Link
          href="/dashboard"
          className="hover:text-white transition-colors"
          onClick={closeMenu}
        >
          Dashboard
        </Link>
      );
    }

    return (
      <>
        <Link
          href="/auth/signin"
          className="hover:text-black transition-colors"
          onClick={closeMenu}
        >
          Sign In
        </Link>
        <Link
          href="/auth/signup"
          className="ml-4 px-4 py-2 bg-black rounded-lg text-white font-medium text-sm hover:bg-gray-800 transition-colors"
          onClick={closeMenu}
        >
          Get Started
        </Link>
      </>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display text-xl font-bold text-black tracking-tight">
            Nexus
          </span>
          <span className="font-sans text-xs text-gray-500 uppercase">
            AI Planner
          </span>
        </div>

        <nav className="hidden md:flex items-center space-x-6 text-sm text-gray-700">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <Link
            href="/#features"
            className="hover:text-black transition-colors"
          >
            Features
          </Link>
          <Link href="/pricing" className="hover:text-black transition-colors">
            Pricing
          </Link>
          <Link href="/#about" className="hover:text-black transition-colors">
            About
          </Link>
          {renderAuthLinks()}
        </nav>

        <button
          className="md:hidden p-2 text-gray-700"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* mobile menu */}
      {mobileOpen && (
        <motion.nav
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="md:hidden bg-white border-t border-gray-200"
        >
          <div className="px-4 pt-2 pb-4 flex flex-col space-y-2 text-sm text-gray-700">
            <Link href="/" onClick={() => setMobileOpen(false)}>
              Home
            </Link>
            <Link href="/#features" onClick={() => setMobileOpen(false)}>
              Features
            </Link>
            <Link href="/pricing" onClick={() => setMobileOpen(false)}>
              Pricing
            </Link>
            <Link href="/#about" onClick={() => setMobileOpen(false)}>
              About
            </Link>
            {renderAuthLinks(() => setMobileOpen(false))}
          </div>
        </motion.nav>
      )}
    </header>
  );
}
