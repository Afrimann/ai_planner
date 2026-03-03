"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { signUpAction, type SignUpActionState } from "@/app/auth/actions";
import { MailIcon, LockIcon, UserIcon } from "@/components/ui/AuthIcons";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PasswordToggle } from "@/components/ui/PasswordToggle";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type PasswordRule = {
  label: string;
  passed: boolean;
};

function getPasswordRules(password: string): PasswordRule[] {
  return [
    { label: "8+ characters", passed: password.length >= 8 },
    { label: "Uppercase letter", passed: /[A-Z]/.test(password) },
    { label: "Lowercase letter", passed: /[a-z]/.test(password) },
    { label: "Number", passed: /\d/.test(password) },
    { label: "Special character", passed: /[^A-Za-z0-9]/.test(password) },
  ];
}

function getStrengthMeta(password: string) {
  const rules = getPasswordRules(password);
  const score = rules.filter((rule) => rule.passed).length;

  if (!password) {
    return {
      score: 0,
      label: "Add a password",
      barClass: "bg-[#2d5e4d]",
      rules,
    };
  }
  if (score <= 2) {
    return { score, label: "Weak", barClass: "bg-red-400", rules };
  }
  if (score <= 3) {
    return { score, label: "Fair", barClass: "bg-yellow-400", rules };
  }
  if (score === 4) {
    return { score, label: "Strong", barClass: "bg-[#38b000]", rules };
  }

  return { score, label: "Excellent", barClass: "bg-[#66ff66]", rules };
}

export default function SignUpPage() {
  const initialState: SignUpActionState = { fieldErrors: {} };
  const [state, formAction, pending] = useActionState(
    signUpAction,
    initialState,
  );
  const safeState = state ?? initialState;
  const fieldErrors = safeState.fieldErrors ?? {};
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const strength = useMemo(() => getStrengthMeta(password), [password]);
  const confirmPasswordError =
    confirmPassword && password !== confirmPassword
      ? "Passwords do not match."
      : undefined;

  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#1f5a45_0%,#101c17_45%,#0a0f0d_100%)]" />
      <div className="pointer-events-none absolute -top-20 left-8 h-56 w-56 rounded-full bg-[#66ff66]/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#38b000]/12 blur-3xl" />

      <Card
        title="Create your account"
        description="Start planning, drafting, and scheduling content in one secure workspace."
        className="w-full max-w-lg"
      >
        <form action={formAction} className="space-y-4" noValidate>
          <Input
            name="fullName"
            type="text"
            label="Full name"
            placeholder="Ada Lovelace"
            autoComplete="name"
            required
            icon={<UserIcon aria-hidden="true" />}
            error={fieldErrors.fullName}
          />

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
            id="signup-password"
            name="password"
            type={passwordVisible ? "text" : "password"}
            label="Password"
            placeholder="Create a strong password"
            autoComplete="new-password"
            required
            icon={<LockIcon aria-hidden="true" />}
            error={fieldErrors.password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            endContent={
              <PasswordToggle
                visible={passwordVisible}
                onToggle={() => setPasswordVisible((previous) => !previous)}
                controlsId="signup-password"
              />
            }
          />

          <motion.div
            layout
            className="rounded-xl border border-[#2d5c4c] bg-[#10211c]/90 p-3"
          >
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-slate-300">Password strength</span>
              <span className="font-semibold text-[#9df7ae]">
                {strength.label}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#1e332c]">
              <motion.div
                className={cn("h-full rounded-full", strength.barClass)}
                initial={false}
                animate={{ width: `${(strength.score / 5) * 100}%` }}
                transition={{ duration: 0.25 }}
              />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
              {strength.rules.map((rule) => (
                <p
                  key={rule.label}
                  className={rule.passed ? "text-[#aef8bd]" : "text-slate-500"}
                >
                  {rule.label}
                </p>
              ))}
            </div>
          </motion.div>

          <Input
            id="signup-confirm-password"
            name="confirmPassword"
            type={confirmPasswordVisible ? "text" : "password"}
            label="Confirm password"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            required
            icon={<LockIcon aria-hidden="true" />}
            error={fieldErrors.confirmPassword ?? confirmPasswordError}
            onChange={(event) => setConfirmPassword(event.currentTarget.value)}
            endContent={
              <PasswordToggle
                visible={confirmPasswordVisible}
                onToggle={() =>
                  setConfirmPasswordVisible((previous) => !previous)
                }
                controlsId="signup-confirm-password"
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
            {pending ? "Creating account..." : "Create account"}
          </Button>

          <p className="text-center text-sm text-slate-300">
            Already have an account?{" "}
            <Link
              href="/auth/signin"
              className="font-semibold text-[#9df7ae] transition-colors hover:text-[#66ff66]"
            >
              Sign in
            </Link>
          </p>
        </form>
      </Card>
    </motion.main>
  );
}
