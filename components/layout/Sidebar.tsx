"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, FileText, Cpu, Settings, Tag, Building2 } from "lucide-react";
import { useCurrentUser } from "@/lib/use-current-user";

interface NavItem {
  href: string;
  label: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", Icon: Home },
  { href: "/workspace", label: "Workspace", Icon: Building2 },
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
        borderBottom: "1px solid hsl(var(--border))",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {/* Logo mark */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          background: "hsl(var(--foreground))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.2s [0.4,0,0.2,1]",
        }}
      >
        <svg width="17" height="17" viewBox="0 0 32 32" fill="none">
          <path
            d="M8 24V14a8 8 0 1 1 16 0v10"
            stroke="hsl(var(--background))"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="16" cy="26" r="2" fill="hsl(var(--background))" />
          <path
            d="M12 14h8M12 18h5"
            stroke="hsl(var(--background))"
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
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 17,
            fontWeight: 700,
            color: "hsl(var(--foreground))",
            letterSpacing: "-0.03em",
            whiteSpace: "nowrap",
          }}
        >
          Nexus
        </motion.span>
      )}
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
                borderRadius: 6,
                padding: collapsed ? "11px 0" : "10px 12px",
                fontSize: 13.5,
                fontWeight: 500,
                fontFamily: "Poppins, sans-serif",
                textDecoration: "none",
                transition: "all 0.2s [0.4,0,0.2,1]",
                position: "relative",
                color: active
                  ? "hsl(var(--foreground))"
                  : "hsl(var(--muted-foreground))",
                background: active ? "hsl(var(--accent))" : "transparent",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "hsl(var(--muted) / 0.5)";
                  e.currentTarget.style.color = "hsl(var(--foreground))";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "hsl(var(--muted-foreground))";
                }
              }}
            >
              <item.Icon
                style={{
                  width: 17,
                  height: 17,
                  flexShrink: 0,
                  color: active
                    ? "hsl(var(--foreground))"
                    : "hsl(var(--muted-foreground))",
                  transition: "color 0.2s [0.4,0,0.2,1]",
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

              {/* Active indicator */}
              {active && !collapsed && (
                <span
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "hsl(var(--foreground))",
                    flexShrink: 0,
                  }}
                />
              )}

              {/* Collapsed tooltip */}
              {collapsed && (
                <span
                  style={{
                    position: "absolute",
                    left: "calc(100% + 12px)",
                    background: "hsl(var(--popover))",
                    color: "hsl(var(--popover-foreground))",
                    fontSize: 12,
                    fontFamily: "Poppins, sans-serif",
                    padding: "5px 10px",
                    borderRadius: 6,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    opacity: 0,
                    border: "1px solid hsl(var(--border))",
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
function SidebarFooter({
  collapsed,
  plan,
}: {
  collapsed: boolean;
  plan?: string;
}) {
  return (
    <div
      style={{
        padding: "12px 8px",
        borderTop: "1px solid hsl(var(--border))",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          borderRadius: 6,
          padding: collapsed ? "8px" : "10px 12px",
          background: "hsl(var(--muted) / 0.3)",
          border: "1px solid hsl(var(--border))",
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
            background: "hsl(var(--foreground))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 600,
            color: "hsl(var(--background))",
            fontFamily: "Poppins, sans-serif",
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
                color: "hsl(var(--foreground))",
                fontFamily: "Poppins, sans-serif",
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
                color: "hsl(var(--muted-foreground))",
                fontFamily: "Poppins, sans-serif",
              }}
            >
              {plan}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared sidebar shell styles ────────────────────────────────────────────────
const sidebarShell: React.CSSProperties = {
  background: "hsl(var(--card))",
  borderRight: "1px solid hsl(var(--border))",
  display: "flex",
  flexDirection: "column",
  height: "100%",
  position: "relative",
  overflow: "hidden",
};

// ── Main export ────────────────────────────────────────────────────────────────
export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const user = useCurrentUser();
  const userPlan = user?.metadata?.plan;
  const planDisplay = typeof userPlan === "string" ? userPlan : "Free Plan";
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `

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
              <Logo collapsed={false} />
              <NavLinks
                collapsed={false}
                pathname={pathname}
                onClose={onClose}
              />
              <SidebarFooter collapsed={false} plan={planDisplay} />
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
        <Logo collapsed={!open} />
        <NavLinks collapsed={!open} pathname={pathname} />
        <SidebarFooter collapsed={!open} plan={planDisplay} />
      </aside>
    </>
  );
}

