"use client";
import { Fragment } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { LandingHeader } from "@/components/LandingHeader";
import { useCurrentUser } from "@/lib/use-current-user";

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
    transition: all 0.2s [0.4,0,0.2,1] !important;
  }
  .nexus-btn:hover:not(:disabled) {
    background: #333 !important;
    transform: translateY(-1px) !important;
  }

  .nexus-metric-card {
    border-radius: 8px;
    padding: 24px;
    background: hsl(var(--card));
    border: 1px solid hsl(var(--border));
    transition: all 0.2s [0.4,0,0.2,1];
  }
  .nexus-metric-card:hover {
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    transform: translateY(-2px);
  }
`;

export default function PricingPage() {
  const user = useCurrentUser();
  const router = useRouter();

  const userPlan =
    user && typeof user.metadata?.plan === "string"
      ? user.metadata.plan
      : undefined;

  const plans = [
    {
      name: "Free",
      price: "$0/mo",
      features: ["Basic features", "Limited usage", "Community support"],
      tier: "free",
    },
    {
      name: "Pro",
      price: "$29/mo",
      features: [
        "Everything in Free",
        "Advanced features",
        "Priority support",
        "Increased limits",
      ],
      tier: "pro",
    },
    {
      name: "Premium",
      price: "$99/mo",
      features: [
        "Everything in Pro",
        "Enterprise-grade features",
        "Unlimited usage",
        "Dedicated support",
        "Custom integrations",
      ],
      tier: "premium",
    },
  ];

  return (
    <Fragment>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />
      <LandingHeader />

      <motion.section
        className="py-20 bg-[#07070f]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-Poppins font-bold text-white">Pricing</h1>
          <p className="mt-4 text-zinc-300">
            Choose the plan that fits your needs.
          </p>
        </div>
      </motion.section>

      <section className="py-20 bg-[#0a0a16]">
        <div className="max-w-7xl mx-auto px-4 grid gap-8 grid-cols-1 md:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              className={`nexus-metric-card ${plan.tier === "pro" ? "ring-4 ring-[#7c5cfc]/50" : ""}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{ position: "relative" }}
            >
              {userPlan === plan.tier && (
                <span className="absolute top-4 right-4 text-xs bg-[#7c5cfc]/90 text-white px-2 py-1 rounded">
                  Current
                </span>
              )}
              <div className="nexus-metric-inner flex flex-col">
                {plan.tier === "pro" && (
                  <span className="self-end px-2 py-1 text-xs bg-[#7c5cfc] text-white rounded">
                    Recommended
                  </span>
                )}
                <h3 className="mt-4 text-xl font-Poppins font-semibold text-white">
                  {plan.name}
                </h3>
                <p className="mt-2 text-white text-3xl font-extrabold">
                  {plan.price}
                </p>
                <ul className="mt-4 space-y-2 text-zinc-300 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-[#7c5cfc]">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => {
                    if (user === undefined) {
                      return;
                    }
                    if (user) {
                      router.push(`/checkout?plan=${plan.tier}`);
                    } else {
                      router.push("/auth/signin");
                    }
                  }}
                  className="mt-6 nexus-btn text-center w-full"
                  disabled={userPlan === plan.tier}
                >
                  {user === undefined
                    ? "..."
                    : user
                      ? userPlan === plan.tier
                        ? "Current plan"
                        : plan.tier === "free"
                          ? "Get started"
                          : "Choose plan"
                      : plan.tier === "free"
                        ? "Sign up"
                        : "Sign in"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </Fragment>
  );
}

