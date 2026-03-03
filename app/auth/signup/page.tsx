"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { signUpAction, type SignUpActionState } from "@/app/auth/actions";
import { MailIcon, LockIcon, UserIcon } from "@/components/ui/AuthIcons";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PasswordToggle } from "@/components/ui/PasswordToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PasswordRule = { label: string; passed: boolean };

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
  const score = rules.filter((r) => r.passed).length;
  if (!password)
    return {
      score: 0,
      label: "Add a password",
      barClass: "bg-[#1e1b3a]",
      rules,
    };
  if (score <= 2)
    return { score, label: "Weak", barClass: "bg-rose-500", rules };
  if (score <= 3)
    return { score, label: "Fair", barClass: "bg-amber-400", rules };
  if (score === 4)
    return { score, label: "Strong", barClass: "bg-violet-400", rules };
  return { score, label: "Excellent", barClass: "bg-[#7c5cfc]", rules };
}

const NEXUS_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .nexus-form label,
  .nexus-form [data-slot="label"],
  .nexus-form [class*="label"],
  .nexus-form [class*="Label"] {
    color: #d4cfee !important;
    font-family: 'DM Sans', sans-serif !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    letter-spacing: 0.02em !important;
  }

  .nexus-form p.text-black,
  .nexus-form p[id$="-error"],
  .nexus-form p[class*="text-black"],
  .nexus-form [aria-invalid="true"] ~ p,
  .nexus-form p[class~="text-xs"] {
    color: #f87171 !important;
  }

  .nexus-form [class*="border-black"] {
    border-color: rgba(248,113,113,0.6) !important;
  }

  .nexus-form input,
  .nexus-form input[type="text"],
  .nexus-form input[type="email"],
  .nexus-form input[type="password"] {
    background-color: #05050d !important;
    color: #eeeaf8 !important;
    -webkit-text-fill-color: #eeeaf8 !important;
    border: 1px solid rgba(124,92,252,0.25) !important;
    border-radius: 12px !important;
    font-family: 'DM Sans', sans-serif !important;
    font-size: 14px !important;
    transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
  }
  .nexus-form input:focus {
    border-color: rgba(124,92,252,0.65) !important;
    box-shadow: 0 0 0 3px rgba(124,92,252,0.13) !important;
    outline: none !important;
  }
  .nexus-form input::placeholder {
    color: #3e3a5e !important;
    -webkit-text-fill-color: #3e3a5e !important;
    opacity: 1 !important;
  }
  .nexus-form input:-webkit-autofill,
  .nexus-form input:-webkit-autofill:hover,
  .nexus-form input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0px 1000px #05050d inset !important;
    -webkit-text-fill-color: #eeeaf8 !important;
    border-color: rgba(124,92,252,0.25) !important;
  }

  .nexus-form .group {
    background: #05050d !important;
    border-color: rgba(124,92,252,0.25) !important;
  }
  .nexus-form .group:focus-within {
    border-color: rgba(124,92,252,0.65) !important;
    box-shadow: 0 0 0 3px rgba(124,92,252,0.13) !important;
  }
  .nexus-form .group span svg,
  .nexus-form .group span {
    color: #6b6890 !important;
  }

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
    width: 100% !important;
    cursor: pointer !important;
    transition: transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease !important;
    box-shadow: 0 4px 24px rgba(124,92,252,0.35) !important;
  }
  .nexus-btn:hover:not(:disabled) {
    transform: translateY(-1px) !important;
    box-shadow: 0 8px 36px rgba(124,92,252,0.52) !important;
  }
  .nexus-btn:active { transform: translateY(0) !important; }
  .nexus-btn:disabled { opacity: 0.5 !important; cursor: not-allowed !important; }
`;

function GridOverlay() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        opacity: 0.025,
      }}
      aria-hidden="true"
    >
      <svg width="100%" height="100%">
        <defs>
          <pattern
            id="grid-signup"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="#a78bfa"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-signup)" />
      </svg>
    </div>
  );
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
    <>
      <style dangerouslySetInnerHTML={{ __html: NEXUS_STYLES }} />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          padding: "48px 16px",
          background: "#07070f",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <GridOverlay />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: -128,
            left: -128,
            width: 500,
            height: 500,
            borderRadius: "50%",
            filter: "blur(120px)",
            background: "rgba(124,92,252,0.10)",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: -96,
            right: -96,
            width: 400,
            height: 400,
            borderRadius: "50%",
            filter: "blur(100px)",
            background: "rgba(244,113,181,0.07)",
            pointerEvents: "none",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 512,
            borderRadius: 20,
            padding: 1,
            background:
              "linear-gradient(135deg, rgba(124,92,252,0.45) 0%, rgba(244,113,181,0.2) 50%, rgba(124,92,252,0.1) 100%)",
          }}
        >
          <div
            style={{
              borderRadius: 19,
              padding: "40px 32px",
              background: "#0f0f1e",
              position: "relative",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                height: 1,
                width: "66%",
                background:
                  "linear-gradient(90deg, transparent, rgba(124,92,252,0.6), transparent)",
              }}
            />

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              style={{
                marginBottom: 32,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background:
                    "linear-gradient(135deg, #7c5cfc 0%, #f471b5 100%)",
                  boxShadow: "0 0 28px rgba(124,92,252,0.45)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                  <path
                    d="M8 24V14a8 8 0 1 1 16 0v10"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="16" cy="26" r="2" fill="white" />
                  <path
                    d="M12 14h8M12 18h5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div style={{ textAlign: "center" }}>
                <h1
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#eeeaf8",
                    letterSpacing: "-0.03em",
                    margin: 0,
                  }}
                >
                  Create your account
                </h1>
                <p
                  style={{
                    marginTop: 6,
                    fontSize: 13,
                    color: "#a099c8",
                    fontWeight: 300,
                    lineHeight: 1.6,
                  }}
                >
                  Start planning, drafting, and scheduling content in one secure
                  workspace.
                </p>
              </div>
            </motion.div>

            {/* ── FORM — ALL LOGIC UNTOUCHED ── */}
            <form
              action={formAction}
              className="nexus-form"
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
              noValidate
            >
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, duration: 0.35 }}
              >
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
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.35 }}
              >
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
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.35 }}
              >
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
                      onToggle={() => setPasswordVisible((p) => !p)}
                      controlsId="signup-password"
                    />
                  }
                />
              </motion.div>

              {/* Password Strength Meter */}
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{
                  borderRadius: 14,
                  padding: 16,
                  background: "rgba(124,92,252,0.06)",
                  border: "1px solid rgba(124,92,252,0.18)",
                }}
              >
                <div
                  style={{
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: "#c4bfe0",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Password strength
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#a78bfa",
                      fontFamily: "'Syne', sans-serif",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {strength.label}
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    overflow: "hidden",
                    borderRadius: 99,
                    background: "rgba(255,255,255,0.06)",
                  }}
                >
                  <motion.div
                    className={cn("h-full rounded-full", strength.barClass)}
                    initial={false}
                    animate={{ width: `${(strength.score / 5) * 100}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    style={{
                      boxShadow:
                        strength.score >= 4
                          ? "0 0 8px rgba(124,92,252,0.6)"
                          : "none",
                    }}
                  />
                </div>
                <div
                  style={{
                    marginTop: 12,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "4px 8px",
                  }}
                >
                  {strength.rules.map((rule) => (
                    <div
                      key={rule.label}
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          flexShrink: 0,
                          background: rule.passed
                            ? "#7c5cfc"
                            : "rgba(255,255,255,0.08)",
                          boxShadow: rule.passed
                            ? "0 0 5px rgba(124,92,252,0.9)"
                            : "none",
                          transition: "all 0.2s ease",
                        }}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          color: rule.passed ? "#c4b5fd" : "#4b4870",
                        }}
                      >
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45, duration: 0.35 }}
              >
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
                  onChange={(event) =>
                    setConfirmPassword(event.currentTarget.value)
                  }
                  endContent={
                    <PasswordToggle
                      visible={confirmPasswordVisible}
                      onToggle={() => setConfirmPasswordVisible((p) => !p)}
                      controlsId="signup-confirm-password"
                    />
                  }
                />
              </motion.div>

              {safeState.formError ? (
                <motion.p
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  role="alert"
                  style={{
                    borderRadius: 12,
                    padding: "10px 14px",
                    fontSize: 13,
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#fca5a5",
                  }}
                >
                  {safeState.formError}
                </motion.p>
              ) : null}

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.35 }}
              >
                <Button
                  type="submit"
                  fullWidth
                  loading={pending}
                  className="nexus-btn"
                >
                  {pending ? "Creating account..." : "Create account"}
                </Button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                style={{ textAlign: "center", fontSize: 13, color: "#c4bfe0" }}
              >
                Already have an account?{" "}
                <Link
                  href="/auth/signin"
                  style={{
                    fontWeight: 600,
                    color: "#a78bfa",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#c4b5fd")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#a78bfa")
                  }
                >
                  Sign in
                </Link>
              </motion.p>
            </form>
          </div>
        </motion.div>
      </motion.main>
    </>
  );
}
