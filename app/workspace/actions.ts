"use server";

import { redirect } from "next/navigation";

import { requireAuthenticatedUserId } from "@/lib/auth";
import { setActiveWorkspaceIdCookie } from "@/lib/workspace-context";
import { getWorkspaceForUser } from "@/lib/workspaces";

function readWorkspaceId(formData: FormData): string {
  const value = formData.get("workspaceId");
  return typeof value === "string" ? value.trim() : "";
}

export async function activatePersonalModeAction(): Promise<void> {
  await requireAuthenticatedUserId();
  await setActiveWorkspaceIdCookie(null);
  redirect("/dashboard");
}

export async function activateWorkspaceModeAction(formData: FormData): Promise<void> {
  const userId = await requireAuthenticatedUserId();
  const workspaceId = readWorkspaceId(formData);

  if (!workspaceId) {
    throw new Error("Workspace is required.");
  }

  const workspace = await getWorkspaceForUser(userId, workspaceId);
  if (!workspace) {
    throw new Error("Workspace access denied.");
  }

  await setActiveWorkspaceIdCookie(workspace.id);
  redirect(`/dashboard?workspace=${workspace.id}`);
}
