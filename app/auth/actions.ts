"use server";

import { redirect } from "next/navigation";

import {
  clearAuthSessionCookies,
  createUserWithAdmin,
  exchangePasswordForSession,
  persistAuthSessionCookies,
  sendPasswordResetEmail,
  updateUser,
} from "@/lib/supabase-auth";
import { getSupabaseEnv } from "@/supabase/client";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors<TField extends string> = Partial<Record<TField, string>>;

export interface SignUpActionState {
  fieldErrors: FieldErrors<
    "fullName" | "email" | "password" | "confirmPassword"
  >;
  formError?: string;
}

export interface SignInActionState {
  fieldErrors: FieldErrors<"email" | "password">;
  formError?: string;
}

export interface ForgotPasswordActionState {
  fieldErrors: FieldErrors<"email">;
  formError?: string;
  successMessage?: string;
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function validatePassword(password: string): string | undefined {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one uppercase letter.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must include at least one lowercase letter.";
  }
  if (!/\d/.test(password)) {
    return "Password must include at least one number.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include at least one special character.";
  }

  return undefined;
}

function normalizeAuthErrorMessage(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("email address has already been registered")) {
    return "An account with this email already exists.";
  }
  if (lower.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }
  if (lower.includes("password should be at least")) {
    return "Password does not meet Supabase policy requirements.";
  }

  return message;
}

export async function signUpAction(
  _prevState: SignUpActionState,
  formData: FormData,
): Promise<SignUpActionState> {
  const fullName = readString(formData, "fullName");
  const email = readString(formData, "email").toLowerCase();
  const password = readString(formData, "password");
  const confirmPassword = readString(formData, "confirmPassword");

  const fieldErrors: SignUpActionState["fieldErrors"] = {};

  if (!fullName) {
    fieldErrors.fullName = "Full name is required.";
  }
  if (!email) {
    fieldErrors.email = "Email is required.";
  } else if (!emailPattern.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }
  if (!password) {
    fieldErrors.password = "Password is required.";
  } else {
    const passwordError = validatePassword(password);
    if (passwordError) {
      fieldErrors.password = passwordError;
    }
  }
  if (!confirmPassword) {
    fieldErrors.confirmPassword = "Confirm your password.";
  } else if (password !== confirmPassword) {
    fieldErrors.confirmPassword = "Passwords do not match.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  try {
    // create user with default free plan in metadata
    await createUserWithAdmin(fullName, email, password);
    const session = await exchangePasswordForSession(email, password);
    await persistAuthSessionCookies(session);
  } catch (error) {
    const message =
      error instanceof Error
        ? normalizeAuthErrorMessage(error.message)
        : "Unable to create your account right now.";

    if (message.toLowerCase().includes("already exists")) {
      return {
        fieldErrors: {
          email: message,
        },
      };
    }

    return {
      fieldErrors: {},
      formError: message,
    };
  }

  redirect("/dashboard");
}

export async function signInAction(
  _prevState: SignInActionState,
  formData: FormData,
): Promise<SignInActionState> {
  const email = readString(formData, "email").toLowerCase();
  const password = readString(formData, "password");
  const fieldErrors: SignInActionState["fieldErrors"] = {};

  if (!email) {
    fieldErrors.email = "Email is required.";
  } else if (!emailPattern.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }
  if (!password) {
    fieldErrors.password = "Password is required.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  try {
    const session = await exchangePasswordForSession(email, password);
    // ensure metadata.plan exists (some older accounts may lack it)
    if (!session.user.user_metadata?.plan) {
      // rather than patching with the limited access token (which was
      // producing 405 errors), use the service-role admin endpoint to
      // set a default plan for the user.
      const { url, serviceRoleKey } = getSupabaseEnv();
      await fetch(`${url}/auth/v1/admin/users/${session.user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          user_metadata: {
            ...(session.user.user_metadata || {}),
            plan: "free",
          },
        }),
      });
    }
    await persistAuthSessionCookies(session);
  } catch (error) {
    const message =
      error instanceof Error
        ? normalizeAuthErrorMessage(error.message)
        : "Unable to sign in right now.";

    return {
      fieldErrors: {},
      formError: message,
    };
  }

  redirect("/dashboard");
}

export async function forgotPasswordAction(
  _prevState: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  const email = readString(formData, "email").toLowerCase();
  const fieldErrors: ForgotPasswordActionState["fieldErrors"] = {};

  if (!email) {
    fieldErrors.email = "Email is required.";
  } else if (!emailPattern.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  try {
    await sendPasswordResetEmail(email);
  } catch {
    return {
      fieldErrors: {},
      formError: "We could not send a reset email right now. Please try again.",
    };
  }

  return {
    fieldErrors: {},
    successMessage:
      "If an account exists for this email, a password reset link has been sent.",
  };
}

export async function signOutAction(): Promise<void> {
  await clearAuthSessionCookies();
  redirect("/auth/signin");
}
