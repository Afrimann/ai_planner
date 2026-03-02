"use client";

import { motion } from "framer-motion";

import {Button} from "@/components/ui/Button";

export function Hero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-xl border bg-card p-10 text-center"
    >
      <p className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
        App Router Enabled
      </p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Next.js, Tailwind, shadcn/ui, and Framer Motion are ready.
      </h1>
      <p className="text-muted-foreground">
        Start building your planner experience with a modern, typed stack.
      </p>
      <Button>Build something</Button>
    </motion.section>
  );
}
