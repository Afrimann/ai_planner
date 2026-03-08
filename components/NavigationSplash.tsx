"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const SHOW_DELAY_MS = 90;
const MIN_VISIBLE_MS = 240;
const MAX_VISIBLE_MS = 2200;

export function NavigationSplash() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAtRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);

  const clearTimers = () => {
    if (showTimer.current) {
      clearTimeout(showTimer.current);
      showTimer.current = null;
    }

    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const startTransitionIndicator = () => {
    if (visible || showTimer.current) {
      return;
    }

    showTimer.current = setTimeout(() => {
      showTimer.current = null;
      shownAtRef.current = Date.now();
      setVisible(true);

      hideTimer.current = setTimeout(() => {
        hideTimer.current = null;
        setVisible(false);
      }, MAX_VISIBLE_MS);
    }, SHOW_DELAY_MS);
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (showTimer.current) {
      clearTimeout(showTimer.current);
      showTimer.current = null;
    }

    if (!visible) {
      return;
    }

    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    const elapsed = shownAtRef.current ? Date.now() - shownAtRef.current : 1e9;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
    const timer = setTimeout(() => setVisible(false), remaining);
    return () => clearTimeout(timer);
  }, [pathname, visible]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (!anchor) {
        return;
      }

      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      if (anchor.hasAttribute("download")) {
        return;
      }

      const target = anchor.getAttribute("target");
      if (target && target !== "_self") {
        return;
      }

      let destination: URL;
      let current: URL;
      try {
        destination = new URL(anchor.href, window.location.href);
        current = new URL(window.location.href);
      } catch {
        return;
      }

      if (destination.origin !== current.origin) {
        return;
      }

      const samePage =
        destination.pathname === current.pathname &&
        destination.search === current.search;
      if (samePage) {
        return;
      }

      startTransitionIndicator();
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      clearTimers();
    };
  }, [pathname, visible]);

  useEffect(() => {
    return () => clearTimers();
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="route-transition-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeInOut" }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            pointerEvents: "none",
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.06 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              position: "absolute",
              inset: 0,
              background: "hsl(var(--background))",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              overflow: "hidden",
              background: "hsl(var(--foreground) / 0.16)",
            }}
          >
            <motion.div
              animate={{
                x: ["-38%", "110%"],
                width: ["34%", "50%", "36%"],
              }}
              transition={{
                duration: 0.92,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                height: "100%",
                background: "hsl(var(--foreground))",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
