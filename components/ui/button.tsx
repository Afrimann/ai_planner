"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  loading?: boolean;
  fullWidth?: boolean;
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-black text-white shadow-[0_8px_24px_-10px_rgba(0,0,0,0.45)] hover:bg-zinc-800 focus-visible:ring-black/35",
  secondary:
    "border border-zinc-300 bg-white text-black hover:border-zinc-500 hover:bg-zinc-100 focus-visible:ring-black/20",
  ghost:
    "text-black hover:bg-zinc-100 hover:text-black focus-visible:ring-black/20",
};

export default function Button({
  className,
  children,
  loading = false,
  fullWidth = false,
  variant = "primary",
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <motion.div
      whileHover={{ y: -1.5, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.15 }}
      className={fullWidth ? "w-full" : "w-auto"}
    >
      <button
        type={type}
        disabled={disabled || loading}
        className={cn(
          "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold",
          "transition-all duration-200 outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-65",
          fullWidth ? "w-full" : "w-auto",
          variantStyles[variant],
          className,
        )}
        {...props}
      >
        {loading ? (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        ) : null}
        <span>{children}</span>
      </button>
    </motion.div>
  );
}
