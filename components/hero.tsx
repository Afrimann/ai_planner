"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-xl border border-gray-200 bg-white p-10 text-center shadow-subtle"
    >
      <p className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
        AI-Powered Content Planning
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
        Build better content workflows
      </h1>
      <p className="text-gray-600 leading-relaxed">
        Create, schedule, and analyze your content strategy with intelligent AI
        assistance.
      </p>
      <Button className="btn-primary">Get Started</Button>
    </motion.section>
  );
}
