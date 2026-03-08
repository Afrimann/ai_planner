"use client";
import { Fragment } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

import { LandingHeader } from "@/components/LandingHeader";
import { useCurrentUser } from "@/lib/use-current-user";

// styles shared with other Nexus pages
const GLOBAL_STYLES = `

  .nexus-btn {
    background: #000 !important;
    border: 1px solid #000 !important;
    border-radius: 6px !important;
    color: #fff !important;
    font-family: 'Poppins', sans-serif !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    letter-spacing: 0.01em !important;
    padding: 12px 24px !important;
    cursor: pointer !important;
    transition: all 0.2s [0.4, 0, 0.2, 1] !important;
  }
  .nexus-btn:hover:not(:disabled) {
    background: #333 !important;
    transform: translateY(-1px) !important;
  }

  .nexus-card {
    border-radius: 8px;
    padding: 24px;
    background: #fff;
    border: 1px solid #e5e7eb;
    transition: all 0.2s [0.4,0,0.2,1];
  }
  .nexus-card:hover {
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    transform: translateY(-2px);
  }
`;

export default function HomePage() {
  const features = [
    {
      title: "Content Planning",
      description:
        "Organize and schedule your posts across all platforms from one dashboard.",
    },
    {
      title: "AI Writing Assistant",
      description:
        "Generate engaging copy and captions tailored to your brand voice.",
    },
    {
      title: "Performance Analytics",
      description: "Track engagement, reach, and growth metrics in real-time.",
    },
    {
      title: "Team Collaboration",
      description:
        "Share access with your team and manage content approval workflows.",
    },
    {
      title: "Multi-Platform Publishing",
      description:
        "Post to Instagram, LinkedIn, Twitter, and more simultaneously.",
    },
    {
      title: "Smart Scheduling",
      description: "Optimize posting times based on audience engagement data.",
    },
  ];

  const testimonials = [
    { label: "Active Users", value: "2,500+", helper: "growing monthly" },
    {
      label: "Posts Scheduled",
      value: "50k+",
      helper: "this quarter",
    },
    { label: "Uptime", value: "99.9%", helper: "guaranteed" },
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
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="bg-white"
        style={{ padding: "120px 24px 80px", textAlign: "center" }}
      >
        <h1 className="font-display text-4xl md:text-6xl font-bold text-black mb-6">
          Plan, create, and publish content with AI
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
          Streamline your content workflow with intelligent scheduling,
          AI-powered writing assistance, and comprehensive analytics—all in one
          platform.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {user ? (
            <Link href="/dashboard" className="nexus-btn">
              Go to Dashboard
            </Link>
          ) : (
            <Link href="/auth/signup" className="nexus-btn">
              Start Free Trial
            </Link>
          )}
          <Link
            href="/pricing"
            className="nexus-btn bg-transparent border border-gray-300 text-black hover:bg-gray-50"
          >
            View Pricing
          </Link>
        </div>
      </motion.section>

      {/* Features */}
      <motion.section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center text-black mb-12">
            Everything you need to manage content
          </h2>
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="nexus-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
              >
                <p className="text-sm font-medium uppercase text-gray-500 mb-2">
                  {f.title}
                </p>
                <p className="text-black font-medium text-base leading-relaxed">
                  {f.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Social proof */}
      <motion.section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-display font-bold text-center text-black mb-12">
            Trusted by content creators worldwide
          </h2>
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((m, i) => (
              <motion.div
                key={m.label}
                className="nexus-card text-center"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }}
              >
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {m.label}
                </p>
                <p className="text-black font-display font-bold text-3xl mb-1">
                  {m.value}
                </p>
                <p className="text-gray-500 text-sm">{m.helper}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        className="py-20 bg-gray-50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="max-w-2xl mx-auto text-center px-4">
          <h2 className="text-3xl font-display font-bold text-black mb-4">
            Ready to streamline your content workflow?
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Join thousands of creators who use Nexus to plan, create, and
            publish better content.
          </p>
          {user ? (
            <Link href="/dashboard" className="nexus-btn">
              Go to Dashboard
            </Link>
          ) : (
            <Link href="/auth/signup" className="nexus-btn">
              Start Free Trial
            </Link>
          )}
        </div>
      </motion.section>
    </Fragment>
  );
}

