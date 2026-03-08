import "server-only";

import { cookies } from "next/headers";

import { getWorkspaceForUser } from "@/lib/workspaces";

export const ACTIVE_WORKSPACE_COOKIE = "active_workspace_id";

const workspaceCookieMaxAgeSeconds = 60 * 60 * 24 * 30;

function normalizeWorkspaceId(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
}

export async function setActiveWorkspaceIdCookie(
  workspaceId: string | null,
): Promise<void> {
  const cookieStore = await cookies();
  const normalized = normalizeWorkspaceId(workspaceId);

  if (!normalized) {
    cookieStore.set(ACTIVE_WORKSPACE_COOKIE, "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return;
  }

  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, normalized, {
    path: "/",
    maxAge: workspaceCookieMaxAgeSeconds,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getActiveWorkspaceIdCookieRaw(): Promise<string | null> {
  const cookieStore = await cookies();
  return normalizeWorkspaceId(
    cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value ?? null,
  );
}

export async function resolveActiveWorkspaceIdForUser(
  userId: string,
): Promise<string | null> {
  const workspaceId = await getActiveWorkspaceIdCookieRaw();

  if (!workspaceId) {
    return null;
  }

  const workspace = await getWorkspaceForUser(userId, workspaceId);
  if (!workspace) {
    return null;
  }

  return workspace.id;
}
