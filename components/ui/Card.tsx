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
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <section
        className={cn(
          "relative overflow-hidden rounded-2xl border border-zinc-300 bg-white p-6 shadow-[0_18px_36px_-24px_rgba(0,0,0,0.28)]",
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
