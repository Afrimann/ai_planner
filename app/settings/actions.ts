"use server";

import { getAccessTokenFromCookies } from "@/lib/supabase-auth";
import { getCurrentAuthenticatedUser } from "@/lib/auth";
import {
  exchangePasswordForSession,
  persistAuthSessionCookies,
  updateUser,
} from "@/lib/supabase-auth";
import { redirect } from "next/navigation";

// reused helpers from auth actions
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

export interface UpdateProfileState {
  fieldErrors: Partial<Record<"fullName", string>>;
  formError?: string;
  successMessage?: string;
}

export async function updateProfileAction(
  _prev: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const fullName = readString(formData, "fullName");
  const fieldErrors: UpdateProfileState["fieldErrors"] = {};

  if (!fullName) {
    fieldErrors.fullName = "Full name is required.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  try {
    const token = await getAccessTokenFromCookies();
    if (!token) throw new Error("Unauthorized");

    await updateUser(token, { user_metadata: { full_name: fullName } });
  } catch (error) {
    return {
      fieldErrors: {},
      formError:
        error instanceof Error
          ? error.message
          : "Unable to update profile right now.",
    };
  }

  return { fieldErrors: {}, successMessage: "Profile updated." };
}

export interface ChangePasswordState {
  fieldErrors: Partial<
    Record<"currentPassword" | "newPassword" | "confirmPassword", string>
  >;
  formError?: string;
  successMessage?: string;
}

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const current = readString(formData, "currentPassword");
  const newPassword = readString(formData, "newPassword");
  const confirm = readString(formData, "confirmPassword");

  const fieldErrors: ChangePasswordState["fieldErrors"] = {};

  if (!current) {
    fieldErrors.currentPassword = "Current password is required.";
  }
  if (!newPassword) {
    fieldErrors.newPassword = "New password is required.";
  } else {
    const passError = validatePassword(newPassword);
    if (passError) {
      fieldErrors.newPassword = passError;
    }
  }
  if (!confirm) {
    fieldErrors.confirmPassword = "Confirm your new password.";
  } else if (newPassword !== confirm) {
    fieldErrors.confirmPassword = "Passwords do not match.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  // verify current password
  const user = await getCurrentAuthenticatedUser();
  if (!user || !user.email) {
    return { fieldErrors: {}, formError: "Unable to verify user." };
  }

  try {
    await exchangePasswordForSession(user.email, current);
  } catch {
    return {
      fieldErrors: { currentPassword: "Current password is incorrect." },
    };
  }

  try {
    const token = await getAccessTokenFromCookies();
    if (!token) throw new Error("Unauthorized");

    await updateUser(token, { password: newPassword });

    // refresh the session with the new password so cookies stay valid
    const session = await exchangePasswordForSession(user.email, newPassword);
    await persistAuthSessionCookies(session);
  } catch (error) {
    return {
      fieldErrors: {},
      formError:
        error instanceof Error
          ? error.message
          : "Unable to update password right now.",
    };
  }

  return { fieldErrors: {}, successMessage: "Password updated." };
}
