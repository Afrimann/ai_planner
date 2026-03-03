"use client";
import { Fragment } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

import { LandingHeader } from "@/components/LandingHeader";
import { useCurrentUser } from "@/lib/use-current-user";

// styles shared with other Nexus pages
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .nexus-btn {
    background: linear-gradient(135deg, #7c5cfc 0%, #6d4fe0 100%) !important;
    border: none !important;
    border-radius: 12px !important;
    color: #fff !important;
    font-family: 'Syne', sans-serif !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    letter-spacing: 0.03em !important;
    padding: 12px 24px !important;
    cursor: pointer !important;
    transition: transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease !important;
  }
  .nexus-btn:hover:not(:disabled) { transform: translateY(-1px) !important; }

  .nexus-metric-card {
    position: relative;
    border-radius: 16px;
    padding: 1px;
    background: linear-gradient(135deg, rgba(124,92,252,0.35) 0%, rgba(244,113,181,0.12) 50%, rgba(124,92,252,0.08) 100%);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .nexus-metric-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(124,92,252,0.18); }
  .nexus-metric-inner { border-radius: 15px; padding: 24px; background: #0f0f1e; height: 100%; position: relative; overflow: hidden; }
  .nexus-metric-inner::before { content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%); height: 1px; width: 60%; background: linear-gradient(90deg, transparent, rgba(124,92,252,0.5), transparent); }
`;

export default function HomePage() {
  const features = [
    {
      title: "Smart Scheduling",
      description: "Automatically plan posts with AI.",
    },
    {
      title: "Analytics Dashboard",
      description: "Track performance in real time.",
    },
    { title: "Team Collaboration", description: "Work together seamlessly." },
    { title: "Custom Templates", description: "Reuse designs instantly." },
    { title: "Multi-platform", description: "Post everywhere at once." },
    { title: "Reminders & Alerts", description: "Never miss a publish date." },
  ];

  const testimonials = [
    { label: "100k+ posts planned", value: "100k", helper: "since launch" },
    {
      label: "5k+ daily active users",
      value: "5k",
      helper: "across platforms",
    },
    { label: "99.9% uptime", value: "99.9%", helper: "reliable service" },
  ];

  const user = useCurrentUser();

  return (
    <Fragment>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />
      <LandingHeader />

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden bg-[#07070f]"
        style={{ padding: "120px 24px 80px", textAlign: "center" }}
      >
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[160px] bg-gradient-to-r from-[#7c5cfc]/40 to-[#f471b5]/40" />
        </div>
        <h1 className="font-syne text-5xl md:text-6xl font-extrabold text-white">
          Plan smarter, publish faster.
        </h1>
        <p className="mt-4 text-lg text-zinc-300 max-w-2xl mx-auto">
          Nexus AI Planner helps you schedule, draft and track content using the
          power of AI — all in one place.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          {user ? (
            <Link href="/dashboard" className="nexus-btn">
              Dashboard
            </Link>
          ) : (
            <Link href="/auth/signup" className="nexus-btn">
              Get Started
            </Link>
          )}
          <Link
            href="/pricing"
            className="nexus-btn bg-transparent border border-zinc-600 text-zinc-200 hover:text-white"
          >
            View Pricing
          </Link>
        </div>
      </motion.section>

      {/* Features */}
      <motion.section id="features" className="py-20 bg-[#0a0a16]">
        <h2 className="text-3xl font-syne font-bold text-center text-white">
          Features
        </h2>
        <div className="mt-12 grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-4 max-w-7xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="nexus-metric-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="nexus-metric-inner">
                <p className="text-xs font-medium uppercase text-zinc-400">
                  {f.title}
                </p>
                <p className="mt-2 text-white font-semibold text-lg">
                  {f.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Social proof */}
      <motion.section className="py-20 bg-[#07070f]">
        <h2 className="text-3xl font-syne font-bold text-center text-white">
          Trusted by thousands
        </h2>
        <div className="mt-12 grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-4 max-w-7xl mx-auto">
          {testimonials.map((m, i) => (
            <motion.div
              key={m.label}
              className="nexus-metric-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="nexus-metric-inner">
                <p className="text-xs font-medium uppercase text-zinc-400">
                  {m.label}
                </p>
                <p className="mt-1 text-white font-syne font-extrabold text-4xl">
                  {m.value}
                </p>
                <p className="text-zinc-500 text-sm mt-1">{m.helper}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        className="py-20 bg-[#0a0a16]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-syne font-bold text-white">
            Ready to build your content calendar?
          </h2>
          {user ? (
            <Link href="/dashboard" className="mt-8 inline-block nexus-btn">
              Go to Dashboard
            </Link>
          ) : (
            <Link href="/auth/signup" className="mt-8 inline-block nexus-btn">
              Get Started for Free
            </Link>
          )}
        </div>
      </motion.section>
    </Fragment>
  );
}
