"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-black",
        className,
      )}
    >
      {children}
    </span>
  );
}
