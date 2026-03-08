"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  helperText?: string;
  endContent?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      icon,
      helperText,
      endContent,
      id,
      name,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const resolvedId = id ?? name ?? generatedId;
    const errorId = `${resolvedId}-error`;
    const helperId = `${resolvedId}-helper`;

    const describedBy = error ? errorId : helperText ? helperId : undefined;

    return (
      <div className="w-full space-y-1.5">
        <label
          htmlFor={resolvedId}
          className="text-sm font-medium text-foreground"
        >
          {label}
        </label>
        <motion.div
          initial={false}
          whileHover={{ y: -0.5 }}
          whileFocus={{ y: -0.5 }}
          transition={{ duration: 0.15, ease: "easeInOut" }}
          className={cn(
            "group relative flex items-center overflow-hidden rounded-md border bg-background transition-colors",
            "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20",
            error ? "border-destructive" : "border-border",
            className,
          )}
        >
          {icon ? (
            <span className="pointer-events-none absolute left-3 text-muted-foreground">
              {icon}
            </span>
          ) : null}
          <input
            ref={ref}
            id={resolvedId}
            name={name}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              "h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground",
              icon ? "pl-10" : "pl-4",
              endContent ? "pr-14" : "pr-4",
            )}
            {...props}
          />
          {endContent ? (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {endContent}
            </div>
          ) : null}
        </motion.div>
        {error ? (
          <motion.p
            id={errorId}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-destructive"
          >
            {error}
          </motion.p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-zinc-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
