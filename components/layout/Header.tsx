"use client";

import { useState } from "react";

interface HeaderProps {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export default function Header({ onMenuToggle, sidebarOpen }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between bg-white border-b border-gray-200 px-4">
      <button
        className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        onClick={onMenuToggle}
        aria-label="Open sidebar"
      >
        {sidebarOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-6 w-6"
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
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>

      <div className="flex-1 text-center md:text-left">
        <span className="text-lg font-semibold text-gray-900">AI Planner</span>
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          aria-label="User menu"
        >
          <div className="h-8 w-8 rounded-full bg-gray-300" />
          <span className="hidden sm:block text-gray-800">Me</span>
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white border border-gray-200 shadow-lg">
            <a
              href="/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Profile
            </a>
            <a
              href="/auth/signout"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Sign out
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
