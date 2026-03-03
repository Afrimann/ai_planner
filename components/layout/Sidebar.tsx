"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, FileText, Cpu, Settings, Tag } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", Icon: Home },
  { href: "/posts", label: "Posts", Icon: FileText },
  { href: "/ai", label: "AI Writer", Icon: Cpu },
  { href: "/pricing", label: "Pricing", Icon: Tag },
  { href: "/settings", label: "Settings", Icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

// ── Logo ───────────────────────────────────────────────────────────────────────
function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      style={{
        height: 64,
        display: "flex",
        alignItems: "center",
        padding: collapsed ? "0" : "0 20px",
        justifyContent: collapsed ? "center" : "flex-start",
        gap: 10,
        borderBottom: "1px solid rgba(124,92,252,0.12)",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {/* Logo mark */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: "linear-gradient(135deg, #7c5cfc 0%, #f471b5 100%)",
          boxShadow: "0 0 16px rgba(124,92,252,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.3s ease",
        }}
      >
        <svg width="17" height="17" viewBox="0 0 32 32" fill="none">
          <path
            d="M8 24V14a8 8 0 1 1 16 0v10"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="16" cy="26" r="2" fill="white" />
          <path
            d="M12 14h8M12 18h5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {!collapsed && (
        <motion.span
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -6 }}
          transition={{ duration: 0.2 }}
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 17,
            fontWeight: 800,
            color: "#eeeaf8",
            letterSpacing: "-0.03em",
            whiteSpace: "nowrap",
          }}
        >
          Nexus
        </motion.span>
      )}

      {/* Bottom glow line */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 0,
          left: "10%",
          right: "10%",
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(124,92,252,0.4), transparent)",
        }}
      />
    </div>
  );
}

// ── Nav links ──────────────────────────────────────────────────────────────────
function NavLinks({
  collapsed,
  pathname,
  onClose,
}: {
  collapsed: boolean;
  pathname: string;
  onClose?: () => void;
}) {
  return (
    <ul
      style={{
        marginTop: 12,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "0 8px",
        listStyle: "none",
        flex: 1,
        margin: "12px 0 0 0",
      }}
    >
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={() => {
                if (onClose) onClose();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: collapsed ? 0 : 11,
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 10,
                padding: collapsed ? "11px 0" : "10px 12px",
                fontSize: 13.5,
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                textDecoration: "none",
                transition:
                  "background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease",
                position: "relative",
                color: active ? "#eeeaf8" : "#6b6890",
                background: active ? "rgba(124,92,252,0.15)" : "transparent",
                boxShadow: active ? "inset 2px 0 0 #7c5cfc" : "none",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "rgba(124,92,252,0.07)";
                  e.currentTarget.style.color = "#c4b5fd";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#6b6890";
                }
              }}
            >
              <item.Icon
                style={{
                  width: 17,
                  height: 17,
                  flexShrink: 0,
                  color: active ? "#a78bfa" : "inherit",
                  transition: "color 0.15s ease",
                }}
              />

              {!collapsed && (
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                  }}
                >
                  {item.label}
                </span>
              )}

              {/* Active indicator dot */}
              {active && !collapsed && (
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#7c5cfc",
                    boxShadow: "0 0 6px rgba(124,92,252,1)",
                    flexShrink: 0,
                  }}
                />
              )}

              {/* Collapsed tooltip label */}
              {collapsed && (
                <span
                  style={{
                    position: "absolute",
                    left: "calc(100% + 12px)",
                    background: "#1a1830",
                    color: "#d4cfee",
                    fontSize: 12,
                    fontFamily: "'DM Sans', sans-serif",
                    padding: "5px 10px",
                    borderRadius: 7,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    opacity: 0,
                    border: "1px solid rgba(124,92,252,0.2)",
                    zIndex: 100,
                    transition: "opacity 0.15s ease",
                  }}
                  className="nexus-tooltip"
                >
                  {item.label}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// ── Footer card ────────────────────────────────────────────────────────────────
function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      style={{
        padding: "12px 8px",
        borderTop: "1px solid rgba(124,92,252,0.08)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          borderRadius: 10,
          padding: collapsed ? "8px" : "10px 12px",
          background: "rgba(124,92,252,0.06)",
          border: "1px solid rgba(124,92,252,0.12)",
          display: "flex",
          alignItems: "center",
          gap: collapsed ? 0 : 10,
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #7c5cfc, #f471b5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            color: "white",
            fontFamily: "'Syne', sans-serif",
            flexShrink: 0,
          }}
        >
          U
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 500,
                color: "#c4b5fd",
                fontFamily: "'DM Sans', sans-serif",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              My Workspace
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: "#4b4870",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Free plan
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared sidebar shell styles ────────────────────────────────────────────────
const sidebarShell: React.CSSProperties = {
  background: "#0a0a16",
  borderRight: "1px solid rgba(124,92,252,0.12)",
  display: "flex",
  flexDirection: "column",
  height: "100%",
  position: "relative",
  overflow: "hidden",
};

// Vertical right-edge glow
function EdgeGlow() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: 1,
        height: "100%",
        background:
          "linear-gradient(to bottom, transparent 0%, rgba(124,92,252,0.35) 40%, rgba(124,92,252,0.35) 60%, transparent 100%)",
        pointerEvents: "none",
      }}
    />
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

        /* Tooltip on hover for collapsed sidebar */
        a:hover .nexus-tooltip { opacity: 1 !important; }
      `,
        }}
      />

      {/* ── Mobile overlay ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 39,
                background: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
              }}
            />

            {/* Drawer */}
            <motion.aside
              key="mobile-sidebar"
              initial={{ x: -260, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -260, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              style={{
                ...sidebarShell,
                position: "fixed",
                top: 0,
                left: 0,
                bottom: 0,
                width: 230,
                zIndex: 40,
              }}
            >
              <EdgeGlow />
              <Logo collapsed={false} />
              <NavLinks
                collapsed={false}
                pathname={pathname}
                onClose={onClose}
              />
              <SidebarFooter collapsed={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside
        style={{
          ...sidebarShell,
          width: open ? 220 : 60,
          transition: "width 0.28s cubic-bezier(0.4,0,0.2,1)",
          flexShrink: 0,
          // hide on mobile, show on md+
          display: "none",
        }}
        // Tailwind class to show on md+
        className="md:!flex"
      >
        <EdgeGlow />
        <Logo collapsed={!open} />
        <NavLinks collapsed={!open} pathname={pathname} />
        <SidebarFooter collapsed={!open} />
      </aside>
    </>
  );
}
