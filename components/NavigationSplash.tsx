"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function NavigationSplash() {
  const pathname = usePathname();
  // const navigation = useNavigation(); // not available in this Next.js version
  const isFirstRender = useRef(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAtRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Skip the very first mount — don't show splash on initial page load
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // hide splash when the pathname actually updates; give it at least 200ms
    // of onscreen time so content behind has a chance to paint and scrollbars
    // won't flash.
    const hide = () => setVisible(false);
    const elapsed = shownAtRef.current ? Date.now() - shownAtRef.current : 1e9;
    if (elapsed >= 200) {
      hide();
      return;
    }
    const timer = setTimeout(hide, 200 - elapsed);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Only internal same-origin links, not new tabs, not modified clicks
      const isInternal =
        href.startsWith("/") &&
        !href.startsWith("//") &&
        !anchor.getAttribute("target") &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey;

      if (!isInternal) return;

      // Don't show if navigating to the same page
      if (href === pathname || href === window.location.pathname) return;

      // Show splash immediately on click
      if (hideTimer.current) clearTimeout(hideTimer.current);
      shownAtRef.current = Date.now();
      setVisible(true);

      // Safety fallback — if pathname never changes (e.g. same route),
      // hide after 3s so the user is never permanently blocked
      hideTimer.current = setTimeout(() => setVisible(false), 3000);
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [pathname]);

  // prevent the underlying page from scrolling while the splash is visible
  // and compensate for the scrollbar width so the layout doesn't jump.
  useEffect(() => {
    if (visible) {
      const prevOverflow = document.body.style.overflow;
      const prevPadding = document.body.style.paddingRight;
      const scrollBarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = "hidden";
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.paddingRight = prevPadding;
      };
    }
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="nexus-splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#07070f",
          }}
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&family=DM+Sans:wght@300&display=swap');
          `,
            }}
          />

          {/* Ambient glow */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 400,
                height: 400,
                borderRadius: "50%",
                filter: "blur(110px)",
                background: "rgba(124,92,252,0.22)",
              }}
            />
          </div>

          {/* Pulsing logo */}
          <motion.div
            animate={{ scale: [1, 1.06, 1], opacity: [0.88, 1, 0.88] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                background: "linear-gradient(135deg, #7c5cfc 0%, #f471b5 100%)",
                boxShadow:
                  "0 0 48px rgba(124,92,252,0.55), 0 0 100px rgba(124,92,252,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
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

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#eeeaf8",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}
              >
                Nexus
              </span>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: 300,
                  color: "#8b85a8",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase" as const,
                }}
              >
                AI Content Planner
              </span>
            </div>
          </motion.div>

          {/* Dots */}
          <div
            style={{
              position: "absolute",
              bottom: 48,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                animate={{ opacity: [0.15, 1, 0.15], scale: [0.8, 1.3, 0.8] }}
                transition={{
                  duration: 1.1,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "rgba(124,92,252,0.8)",
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
