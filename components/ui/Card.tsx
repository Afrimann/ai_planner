"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
}

export function Card({
  title,
  description,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <section
        className={cn(
          "rounded-lg border border-border bg-card p-6 shadow-subtle",
          className,
        )}
        {...props}
      >
        <div className="pointer-events-none absolute -top-16 right-0 h-36 w-36 rounded-full bg-zinc-100 blur-2xl" />
        {(title || description) && (
          <header className="relative z-10 mb-6 space-y-1">
            {title ? (
              <h1 className="text-2xl font-semibold tracking-tight text-black">
                {title}
              </h1>
            ) : null}
            {description ? (
              <p className="text-sm text-zinc-600">{description}</p>
            ) : null}
          </header>
        )}
        <div className="relative z-10">{children}</div>
      </section>
    </motion.div>
  );
}
