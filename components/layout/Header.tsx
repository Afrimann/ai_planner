"use client";

import { useState } from "react";

interface HeaderProps {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export default function Header({ onMenuToggle, sidebarOpen }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .nexus-header-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px; height: 36px;
          border-radius: 6px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--muted) / 0.5);
          color: hsl(var(--muted-foreground));
          cursor: pointer;
          transition: all 0.2s [0.4,0,0.2,1];
          outline: none;
        }
        .nexus-header-btn:hover {
          background: hsl(var(--muted));
          color: hsl(var(--foreground));
          border-color: hsl(var(--border));
        }

        .nexus-user-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px 4px 4px;
          border-radius: 99px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--muted) / 0.5);
          cursor: pointer;
          outline: none;
          transition: all 0.2s [0.4,0,0.2,1];
        }
        .nexus-user-btn:hover {
          background: hsl(var(--muted));
          border-color: hsl(var(--border));
        }
        .nexus-user-btn:focus-visible {
          box-shadow: 0 0 0 3px hsl(var(--ring));
        }

        .nexus-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: 176px;
          background: hsl(var(--popover));
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          overflow: hidden;
          z-index: 50;
          padding: 4px;
        }
        .nexus-dropdown a {
          display: block;
          padding: 9px 14px;
          font-size: 13px;
          font-family: 'Poppins', sans-serif;
          color: hsl(var(--popover-foreground));
          text-decoration: none;
          border-radius: 6px;
          transition: all 0.2s [0.4,0,0.2,1];
        }
        .nexus-dropdown a:hover {
          background: hsl(var(--muted));
          color: hsl(var(--foreground));
        }
        .nexus-dropdown-divider {
          height: 1px;
          background: hsl(var(--border));
          margin: 3px 0;
        }
      `,
        }}
      />

      <header className="flex h-16 items-center justify-between bg-card border-b border-border px-5 flex-shrink-0 relative">
        {/* ── Mobile menu toggle — LOGIC UNTOUCHED ── */}
        <button
          className="md:hidden"
          style={{ background: "none", border: "none", padding: 0 }}
          onClick={onMenuToggle}
          aria-label="Open sidebar"
        >
          <span className="nexus-header-btn" style={{ display: "flex" }}>
            {sidebarOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                style={{ width: 18, height: 18 }}
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
                style={{ width: 18, height: 18 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </span>
        </button>

        {/* ── Wordmark ── */}
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <span
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 16,
              fontWeight: 800,
              color: "#eeeaf8",
              letterSpacing: "-0.03em",
            }}
          >
            Nexus
          </span>
          <span
            style={{
              marginLeft: 8,
              fontSize: 11,
              fontWeight: 400,
              color: "#4b4870",
              fontFamily: "'Poppins', sans-serif",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            AI Planner
          </span>
        </div>

        {/* ── User menu — LOGIC UNTOUCHED ── */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="nexus-user-btn"
            aria-label="User menu"
          >
            {/* Avatar */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "hsl(var(--foreground))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "hsl(var(--background))",
                fontFamily: "'Poppins', sans-serif",
                flexShrink: 0,
              }}
            >
              M
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "hsl(var(--foreground))",
                fontFamily: "'Poppins', sans-serif",
                display: "none",
              }}
              className="sm:!inline"
            >
              Me
            </span>
            {/* Chevron */}
            <svg
              style={{
                width: 13,
                height: 13,
                color: "#6b6890",
                transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown — LOGIC UNTOUCHED */}
          {menuOpen && (
            <div className="nexus-dropdown">
              <a href="/profile">Profile</a>
              <div className="nexus-dropdown-divider" />
              <a
                href="/auth/signout"
                style={{ color: "#f87171" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(239,68,68,0.08)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                Sign out
              </a>
            </div>
          )}
        </div>
      </header>
    </>
  );
}

