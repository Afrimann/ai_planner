"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { motion } from "framer-motion";

import { signInAction, type SignInActionState } from "@/app/auth/actions";
import { LockIcon, MailIcon } from "@/components/ui/AuthIcons";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PasswordToggle } from "@/components/ui/PasswordToggle";
import { Button } from "@/components/ui/Button";

export default function SignInPage() {
  const initialState: SignInActionState = { fieldErrors: {} };
  const [state, formAction, pending] = useActionState(
    signInAction,
    initialState,
  );
  const safeState = state ?? initialState;
  const fieldErrors = safeState.fieldErrors ?? {};
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12"
    >
      {/* <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,#1f5a45_0%,#101c17_50%,#0a0f0d_100%)]" />
      <div className="pointer-events-none absolute left-10 top-4 h-52 w-52 rounded-full bg-[#fff]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-10 h-72 w-72 rounded-full bg-[#38b000]/12 blur-3xl" /> */}

      <Card
        title="Welcome back"
        description="Sign in to continue managing your AI Planner workspace."
        className="w-full max-w-md"
      >
        <form action={formAction} className="space-y-4" noValidate>
          <Input
            name="email"
            type="email"
            label="Email"
            placeholder="you@company.com"
            autoComplete="email"
            required
            icon={<MailIcon aria-hidden="true" />}
            error={fieldErrors.email}
          />

          <Input
            id="signin-password"
            name="password"
            type={passwordVisible ? "text" : "password"}
            label="Password"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            icon={<LockIcon aria-hidden="true" />}
            error={fieldErrors.password}
            endContent={
              <PasswordToggle
                visible={passwordVisible}
                onToggle={() => setPasswordVisible((previous) => !previous)}
                controlsId="signin-password"
              />
            }
          />

          {safeState.formError ? (
            <p
              role="alert"
              className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
            >
              {safeState.formError}
            </p>
          ) : null}

          <Button type="submit" fullWidth loading={pending}>
            {pending ? "Signing in..." : "Sign in"}
          </Button>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <Link
              href="/auth/signup"
              className="font-semibold text-[#fff] transition-colors hover:text-[grey]"
            >
              Create account
            </Link>
            <Link
              href="/auth/forgot-password"
              className="text-slate-300 transition-colors hover:text-[grey]"
            >
              Forgot password?
            </Link>
          </div>
        </form>
      </Card>
    </motion.main>
  );
}
