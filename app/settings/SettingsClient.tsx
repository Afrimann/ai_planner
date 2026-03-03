"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useActionState } from "react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import { PasswordToggle } from "@/components/ui/PasswordToggle";
import {
  updateProfileAction,
  type UpdateProfileState,
  changePasswordAction,
  type ChangePasswordState,
} from "./actions";

export default function SettingsClient({
  user,
}: {
  user: import("@/lib/auth").AuthenticatedUser;
}) {
  const router = useRouter();

  const [profileState, profileAction, profilePending] = useActionState<
    UpdateProfileState,
    FormData
  >(updateProfileAction, {
    fieldErrors: {},
  });

  const [passwordState, passwordAction, passwordPending] = useActionState<
    ChangePasswordState,
    FormData
  >(changePasswordAction, {
    fieldErrors: {},
  });

  useEffect(() => {
    if (profileState?.successMessage) {
      router.refresh();
    }
  }, [profileState, router]);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        /* ===== Metric Card System ===== */

        .nexus-metric-card {
          position: relative;
          border-radius: 16px;
          padding: 1px;
          background: linear-gradient(
            135deg,
            rgba(124,92,252,0.35) 0%,
            rgba(244,113,181,0.12) 50%,
            rgba(124,92,252,0.08) 100%
          );
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .nexus-metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(124,92,252,0.18);
        }

        .nexus-metric-inner {
          border-radius: 15px;
          padding: 24px;
          background: #0f0f1e;
          position: relative;
          overflow: hidden;
        }

        .nexus-metric-inner::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          height: 1px;
          width: 60%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(124,92,252,0.5),
            transparent
          );
        }

        .nexus-metric-glow {
          position: absolute;
          bottom: -20px;
          right: -20px;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(124,92,252,0.08);
          filter: blur(20px);
          pointer-events: none;
        }

        /* ===== Force All Labels To Nexus Color ===== */

        .nexus-metric-inner label,
        .nexus-metric-inner [data-slot="label"],
        .nexus-metric-inner .label,
        .nexus-metric-inner [class*="label"],
        .nexus-metric-inner [class*="Label"] {
          color: #d4cfee !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          letter-spacing: 0.02em !important;
        }

        /* ===== Input Styling ===== */

        .nexus-input-wrapper input {
          background-color: #0f0f1e !important;
          color: #eeeaf8 !important;
          border: 1px solid rgba(124,92,252,0.25) !important;
          border-radius: 12px !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 14px !important;
          transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
        }

        .nexus-input-wrapper input:focus {
          border-color: rgba(124,92,252,0.65) !important;
          box-shadow: 0 0 0 3px rgba(124,92,252,0.13) !important;
          outline: none !important;
        }

        /* ===== Button Styling ===== */

        .nexus-btn {
          background: linear-gradient(135deg, #7c5cfc 0%, #6d4fe0 100%);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.03em;
          padding: 12px 24px;
          width: 100%;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease;
          box-shadow: 0 6px 28px rgba(124,92,252,0.35);
        }

        .nexus-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 42px rgba(124,92,252,0.5);
        }

        .nexus-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{
          padding: "36px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 32,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* ===== Header ===== */}

        <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#7c5cfc",
            }}
          >
            Account
          </p>

          <h1
            style={{
              margin: 0,
              fontFamily: "'Syne', sans-serif",
              fontSize: 28,
              fontWeight: 800,
              color: "#eeeaf8",
              letterSpacing: "-0.03em",
            }}
          >
            Settings
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "#7a7499",
              fontWeight: 300,
            }}
          >
            Manage your account details and security.
          </p>

          <div
            style={{
              marginTop: 8,
              height: 1,
              background:
                "linear-gradient(90deg, rgba(124,92,252,0.3), rgba(244,113,181,0.1), transparent)",
            }}
          />
        </header>

        {/* ===== Plan Card ===== */}
        <div className="nexus-metric-card">
          <div className="nexus-metric-inner flex items-center justify-between">
            <p>
              Current plan:{" "}
              <strong>
                {typeof user.metadata?.plan === "string"
                  ? user.metadata.plan
                  : "free"}
              </strong>
            </p>
            <Link href="/pricing" className="nexus-btn text-sm">
              Change plan
            </Link>
          </div>
        </div>

        {/* ===== Profile Card ===== */}

        <div className="nexus-metric-card">
          <div className="nexus-metric-inner">
            <div className="nexus-metric-glow" />

            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: "#eeeaf8",
                marginBottom: 20,
              }}
            >
              Profile
            </h2>

            <form
              action={profileAction}
              className="space-y-4 nexus-input-wrapper"
            >
              <Input
                id="fullName"
                name="fullName"
                label="Full name"
                defaultValue={user.fullName || ""}
                required
              />

              {profileState?.fieldErrors.fullName && (
                <p className="text-red-500 text-sm">
                  {profileState.fieldErrors.fullName}
                </p>
              )}

              <div>
                <label style={{ marginBottom: 4, display: "block" }}>
                  Email
                </label>
                <p style={{ color: "#eeeaf8" }}>{user.email}</p>
              </div>

              {profileState?.successMessage && (
                <p className="text-green-500 text-sm">
                  {profileState.successMessage}
                </p>
              )}

              <Button
                type="submit"
                className="nexus-btn"
                disabled={profilePending}
              >
                {profilePending ? "Saving..." : "Save profile"}
              </Button>
            </form>
          </div>
        </div>

        {/* ===== Password Card ===== */}

        <div className="nexus-metric-card">
          <div className="nexus-metric-inner">
            <div className="nexus-metric-glow" />

            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: "#eeeaf8",
                marginBottom: 20,
              }}
            >
              Change Password
            </h2>

            <form
              action={passwordAction}
              className="space-y-4 nexus-input-wrapper"
            >
              <div className="relative">
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  label="Current password"
                  type={showCurrentPassword ? "text" : "password"}
                  required
                />
                <PasswordToggle
                  visible={showCurrentPassword}
                  onToggle={() => setShowCurrentPassword((v) => !v)}
                  controlsId="currentPassword"
                />
              </div>

              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  label="New password"
                  type={showNewPassword ? "text" : "password"}
                  required
                />
                <PasswordToggle
                  visible={showNewPassword}
                  onToggle={() => setShowNewPassword((v) => !v)}
                  controlsId="newPassword"
                />
              </div>

              <Input
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm new password"
                type={showNewPassword ? "text" : "password"}
                required
              />

              {passwordState?.successMessage && (
                <p className="text-green-500 text-sm">
                  {passwordState.successMessage}
                </p>
              )}

              <Button
                type="submit"
                className="nexus-btn"
                disabled={passwordPending}
              >
                {passwordPending ? "Updating..." : "Change password"}
              </Button>
            </form>
          </div>
        </div>
      </motion.main>
    </>
  );
}
