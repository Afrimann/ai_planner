"use client";

import Link from "next/link";
import { useActionState } from "react";
import { motion } from "framer-motion";

import {
  forgotPasswordAction,
  type ForgotPasswordActionState,
} from "@/app/auth/actions";
import { MailIcon } from "@/components/ui/AuthIcons";
import {Button} from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const initialState: ForgotPasswordActionState = { fieldErrors: {} };
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    initialState,
  );
  const safeState = state ?? initialState;
  const fieldErrors = safeState.fieldErrors ?? {};

  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#1f5a45_0%,#101c17_45%,#090e0c_100%)]" />
      <div className="pointer-events-none absolute -top-16 right-8 h-48 w-48 rounded-full bg-[#66ff66]/10 blur-3xl" />

      <Card
        title="Reset your password"
        description="Enter your email and we will send a secure password reset link."
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

          {safeState.formError ? (
            <p
              role="alert"
              className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
            >
              {safeState.formError}
            </p>
          ) : null}

          {safeState.successMessage ? (
            <p
              role="status"
              className="rounded-xl border border-[#66ff66]/30 bg-[#38b000]/10 px-3 py-2 text-sm text-[#c9ffd5]"
            >
              {safeState.successMessage}
            </p>
          ) : null}

          <Button type="submit" fullWidth loading={pending}>
            {pending ? "Sending reset link..." : "Send reset link"}
          </Button>

          <p className="text-center text-sm text-slate-300">
            Remembered your password?{" "}
            <Link
              href="/auth/signin"
              className="font-semibold text-[#9df7ae] transition-colors hover:text-[#66ff66]"
            >
              Back to sign in
            </Link>
          </p>
        </form>
      </Card>
    </motion.main>
  );
}
