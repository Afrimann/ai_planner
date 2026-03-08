"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { motion } from "framer-motion";

import { signInAction, type SignInActionState } from "@/app/auth/actions";
import { LockIcon, MailIcon } from "@/components/ui/AuthIcons";
import { Input } from "@/components/ui/Input";
import { PasswordToggle } from "@/components/ui/PasswordToggle";
import { Button } from "@/components/ui/button";

const NEXUS_STYLES = `
  .nexus-form label,
  .nexus-form [data-slot="label"],
  .nexus-form [class*="label"],
  .nexus-form [class*="Label"] {
    color: hsl(var(--foreground)) !important;
    font-family: 'Poppins', sans-serif !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    letter-spacing: 0.01em !important;
  }

  .nexus-form p.text-black,
  .nexus-form p[id$="-error"],
  .nexus-form p[class*="text-black"],
  .nexus-form [aria-invalid="true"] ~ p,
  .nexus-form p[class~="text-xs"] {
    color: hsl(var(--foreground)) !important;
  }

  .nexus-form [class*="border-black"] {
    border-color: hsl(var(--foreground)) !important;
  }

  .nexus-form input,
  .nexus-form input[type="text"],
  .nexus-form input[type="email"],
  .nexus-form input[type="password"] {
    background-color: hsl(var(--background)) !important;
    color: hsl(var(--foreground)) !important;
    -webkit-text-fill-color: hsl(var(--foreground)) !important;
    border: 1px solid hsl(var(--border)) !important;
    border-radius: 6px !important;
    font-family: 'Poppins', sans-serif !important;
    font-size: 14px !important;
    transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
  }
  .nexus-form input:focus {
    border-color: hsl(var(--ring)) !important;
    box-shadow: 0 0 0 3px hsl(var(--ring) / 0.12) !important;
    outline: none !important;
  }
  .nexus-form input::placeholder {
    color: hsl(var(--muted-foreground)) !important;
    -webkit-text-fill-color: hsl(var(--muted-foreground)) !important;
    opacity: 1 !important;
  }
  .nexus-form input:-webkit-autofill,
  .nexus-form input:-webkit-autofill:hover,
  .nexus-form input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0px 1000px hsl(var(--background)) inset !important;
    -webkit-text-fill-color: hsl(var(--foreground)) !important;
    border-color: hsl(var(--border)) !important;
  }

  .nexus-form .group {
    background: hsl(var(--input)) !important;
    border-color: hsl(var(--border)) !important;
  }
  .nexus-form .group:focus-within {
    border-color: hsl(var(--ring)) !important;
    box-shadow: 0 0 0 3px hsl(var(--ring) / 0.1) !important;
  }
  .nexus-form .group > span svg,
  .nexus-form .group > span {
    color: hsl(var(--muted-foreground)) !important;
  }
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
            id="grid-signin"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="hsl(var(--foreground))"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-signin)" />
      </svg>
    </div>
  );
}

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
          background: "hsl(var(--background))",
          fontFamily: "'Poppins', sans-serif",
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
            background: "rgba(0,0,0,0.06)",
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
            background: "rgba(0,0,0,0.05)",
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
            maxWidth: 448,
            borderRadius: 20,
            padding: 1,
            background:
              "linear-gradient(135deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.18) 100%)",
          }}
        >
          <div
            style={{
              borderRadius: 19,
              padding: "40px 32px",
              background: "hsl(var(--card))",
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
                  "linear-gradient(90deg, transparent, rgba(0,0,0,0.5), transparent)",
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
                  background: "hsl(var(--foreground))",
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
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "hsl(var(--foreground))",
                    letterSpacing: "-0.03em",
                    margin: 0,
                  }}
                >
                  Welcome back
                </h1>
                <p
                  style={{
                    marginTop: 6,
                    fontSize: 13,
                    color: "hsl(var(--muted-foreground))",
                    fontWeight: 300,
                    lineHeight: 1.6,
                  }}
                >
                  Sign in to continue managing your AI Planner workspace.
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
                transition={{ delay: 0.3, duration: 0.35 }}
              >
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
                      onToggle={() => setPasswordVisible((p) => !p)}
                      controlsId="signin-password"
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
                    background: "hsl(var(--muted))",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                  }}
                >
                  {safeState.formError}
                </motion.p>
              ) : null}

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.35 }}
              >
                <Button
                  type="submit"
                  fullWidth
                  loading={pending}
                  className="btn-primary"
                >
                  {pending ? "Signing in..." : "Sign in"}
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  paddingTop: 4,
                }}
              >
                <Link
                  href="/auth/signup"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "hsl(var(--foreground))",
                    textDecoration: "none",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "hsl(var(--muted-foreground))")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "hsl(var(--foreground))")
                  }
                >
                  Create account
                </Link>
                <Link
                  href="/auth/forgot-password"
                  style={{
                    fontSize: 13,
                    color: "hsl(var(--muted-foreground))",
                    textDecoration: "none",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "hsl(var(--foreground))")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "hsl(var(--muted-foreground))")
                  }
                >
                  Forgot password?
                </Link>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </motion.main>
    </>
  );
}

