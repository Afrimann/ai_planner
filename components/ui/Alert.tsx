"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "error";

const variantStyles: Record<AlertVariant, string> = {
  info: "border-zinc-300 bg-zinc-50 text-black",
  success: "border-zinc-300 bg-white text-black",
  warning: "border-zinc-400 bg-zinc-100 text-black",
  error: "border-zinc-500 bg-zinc-200 text-black",
};

interface AlertProps {
  title: string;
  description?: string;
  variant?: AlertVariant;
  className?: string;
}

export function Alert({
  title,
  description,
  variant = "info",
  className,
}: AlertProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      role="status"
      className={cn(
        "rounded-xl border px-4 py-3",
        variantStyles[variant],
        className,
      )}
    >
      <p className="text-sm font-semibold">{title}</p>
      {description ? <p className="mt-1 text-xs opacity-90">{description}</p> : null}
    </motion.div>
  );
}
