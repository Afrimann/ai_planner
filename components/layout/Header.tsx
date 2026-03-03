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
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

        .nexus-header-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px; height: 36px;
          border-radius: 10px;
          border: 1px solid rgba(124,92,252,0.18);
          background: rgba(124,92,252,0.06);
          color: #8b85a8;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
          outline: none;
        }
        .nexus-header-btn:hover {
          background: rgba(124,92,252,0.14);
          color: #c4b5fd;
          border-color: rgba(124,92,252,0.35);
        }

        .nexus-user-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px 4px 4px;
          border-radius: 99px;
          border: 1px solid rgba(124,92,252,0.18);
          background: rgba(124,92,252,0.06);
          cursor: pointer;
          outline: none;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .nexus-user-btn:hover {
          background: rgba(124,92,252,0.12);
          border-color: rgba(124,92,252,0.35);
        }
        .nexus-user-btn:focus-visible {
          box-shadow: 0 0 0 3px rgba(124,92,252,0.3);
        }

        .nexus-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: 176px;
          background: #13131f;
          border: 1px solid rgba(124,92,252,0.2);
          border-radius: 12px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,92,252,0.08);
          overflow: hidden;
          z-index: 50;
          padding: 4px;
        }
        .nexus-dropdown a {
          display: block;
          padding: 9px 14px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          color: #a099c8;
          text-decoration: none;
          border-radius: 8px;
          transition: background 0.12s ease, color 0.12s ease;
        }
        .nexus-dropdown a:hover {
          background: rgba(124,92,252,0.1);
          color: #eeeaf8;
        }
        .nexus-dropdown-divider {
          height: 1px;
          background: rgba(124,92,252,0.1);
          margin: 3px 0;
        }
      `}} />

      <header style={{
        display: "flex",
        height: 64,
        alignItems: "center",
        justifyContent: "space-between",
        background: "#0a0a16",
        borderBottom: "1px solid rgba(124,92,252,0.1)",
        padding: "0 20px",
        flexShrink: 0,
        position: "relative",
        zIndex: 10,
      }}>

        {/* Bottom glow line */}
        <div aria-hidden="true" style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg, transparent, rgba(124,92,252,0.25), rgba(244,113,181,0.1), transparent)",
          pointerEvents: "none",
        }} />

        {/* ── Mobile menu toggle — LOGIC UNTOUCHED ── */}
        <button
          className="md:hidden"
          style={{ background: "none", border: "none", padding: 0 }}
          onClick={onMenuToggle}
          aria-label="Open sidebar"
        >
          <span className="nexus-header-btn" style={{ display: "flex" }}>
            {sidebarOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 18, height: 18 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 18, height: 18 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </span>
        </button>

        {/* ── Wordmark ── */}
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 16,
            fontWeight: 800,
            color: "#eeeaf8",
            letterSpacing: "-0.03em",
          }}>
            Nexus
          </span>
          <span style={{
            marginLeft: 8,
            fontSize: 11,
            fontWeight: 400,
            color: "#4b4870",
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}>
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
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg, #7c5cfc, #f471b5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "white",
              fontFamily: "'Syne', sans-serif",
              flexShrink: 0,
            }}>
              M
            </div>
            <span style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#c4b5fd",
              fontFamily: "'DM Sans', sans-serif",
              display: "none",
            }}
              className="sm:!inline"
            >
              Me
            </span>
            {/* Chevron */}
            <svg
              style={{
                width: 13, height: 13, color: "#6b6890",
                transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown — LOGIC UNTOUCHED */}
          {menuOpen && (
            <div className="nexus-dropdown">
              <a href="/profile">Profile</a>
              <div className="nexus-dropdown-divider" />
              <a href="/auth/signout" style={{ color: "#f87171" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
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