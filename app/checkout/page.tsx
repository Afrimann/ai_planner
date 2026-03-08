"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { LandingHeader } from "@/components/LandingHeader";
import { useCurrentUser } from "@/lib/use-current-user";

const GLOBAL_STYLES = `

  .nexus-btn {
    @apply btn-primary !important;
    letter-spacing: 0.03em !important;
    padding: 12px 24px !important;
    cursor: pointer !important;
    transition: transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease !important;
  }
  .nexus-btn:hover:not(:disabled) { transform: translateY(-1px) !important; }
`;

export default function CheckoutPage() {
  const user = useCurrentUser();
  const router = useRouter();
  const [plan, setPlan] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // grab query param on mount (avoid useSearchParams hook to prevent
  // prerendering conflicts)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("plan");
    if (p) {
      setPlan(p);
    }
  }, []);

  useEffect(() => {
    // redirect unauthenticated visitors
    if (user === null) {
      router.push("/auth/signin");
    }
  }, [user, router]);

  if (!plan) {
    return (
      <div className="p-8 text-center text-red-400">No plan selected.</div>
    );
  }

  // simple price lookup for display
  const planInfo: Record<string, { name: string; price: string }> = {
    free: { name: "Free", price: "$0/mo" },
    pro: { name: "Pro", price: "$29/mo" },
    premium: { name: "Premium", price: "$99/mo" },
  };

  const info = planInfo[plan] || { name: plan, price: "" };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/plan/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Failed to update plan");
      }
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />
      <LandingHeader />

      <motion.section
        className="py-20 bg-[#07070f]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-Poppins font-bold text-white">Checkout</h1>
          <p className="mt-4 text-zinc-300">
            {info.name} plan ({info.price})
          </p>
        </div>
      </motion.section>

      <section className="py-20 bg-[#0a0a16]">
        <div className="max-w-lg mx-auto px-4">
          {error && (
            <div className="mb-4 text-red-400 text-center">{error}</div>
          )}

          <div className="space-y-6">
            <p className="text-zinc-200">
              {plan === "free"
                ? "No payment is required for the free plan. Click the button below to activate it."
                : "This is a prototype checkout. Click the button below to simulate a successful payment and upgrade your account."}
            </p>

            <button
              disabled={loading}
              onClick={handleSubmit}
              className="w-full nexus-btn text-center"
            >
              {loading
                ? "Processing..."
                : plan === "free"
                  ? "Activate Free Plan"
                  : "Complete Payment"}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

