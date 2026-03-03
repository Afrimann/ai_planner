"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "color"
> {
  loading?: boolean;
  fullWidth?: boolean;
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-[#38b000] to-[#2f9800] text-[#07110d] shadow-[0_8px_24px_-10px_rgba(56,176,0,0.8)] hover:from-[#66ff66] hover:to-[#38b000] focus-visible:ring-[#66ff66]/40",
  secondary:
    "border border-[#2c5f4f] bg-[#10221b] text-[#d8ffe4] hover:border-[#66ff66]/60 hover:bg-[#163126] focus-visible:ring-[#66ff66]/30",
  ghost:
    "text-[#8de7a2] hover:bg-[#133026] hover:text-[#c9ffd7] focus-visible:ring-[#66ff66]/25",
};

export function Button({
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
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        )}
        {children}
      </button>
    </motion.div>
  );
}
