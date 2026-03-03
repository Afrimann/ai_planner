"use client";

import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface PasswordToggleProps {
  visible: boolean;
  onToggle: () => void;
  controlsId: string;
  className?: string;
}

export function PasswordToggle({
  visible,
  onToggle,
  controlsId,
  className,
}: PasswordToggleProps) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-label={visible ? "Hide password" : "Show password"}
      aria-controls={controlsId}
      aria-pressed={visible}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "inline-flex mt-2 h-8 min-w-14 items-center justify-center rounded-lg border border-zinc-600 bg-zinc-900 px-2 text-xs font-medium text-white transition-colors hover:border-zinc-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35",
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={visible ? "hide" : "show"}
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 3 }}
          transition={{ duration: 0.12 }}
        >
          {visible ? "Hide" : "Show"}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
