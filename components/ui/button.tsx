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
    "bg-black text-white border border-black hover:bg-gray-800 focus-visible:ring-black/20",
  secondary:
    "border border-gray-300 bg-white text-black hover:bg-gray-50 focus-visible:ring-gray-300/50",
  ghost:
    "text-gray-700 hover:bg-gray-100 hover:text-black focus-visible:ring-gray-300/25",
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
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15, ease: "easeInOut" }}
      className={fullWidth ? "w-full" : "w-auto"}
    >
      <button
        type={type}
        disabled={disabled || loading}
        className={cn(
          "inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium",
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
