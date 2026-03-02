import "server-only";

import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  AUTH_ACCESS_COOKIE,
  getAccessTokenFromCookies,
  getAuthenticatedUserFromToken,
} from "@/lib/supabase-auth";

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

function extractBearerToken(value: string | null): string {
  if (!value) {
    return "";
  }

  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

async function getUserFromTokenOrThrow(
  token: string,
): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUserFromToken(token);
  if (!user.id) {
    throw new Error("Unauthorized");
  }

  return { id: user.id, email: user.email };
}

export async function requireAuthenticatedUser(
  request: Request,
): Promise<AuthenticatedUser> {
  // when we store sessions we put the access token in an httpOnly
  // cookie, so server components won't see it via the normal
  // `authorization` header.  read the cookie first and fall back to
  // the header for clients that explicitly send it (e.g. API calls).
  let token = "";

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(AUTH_ACCESS_COOKIE)?.value;
  if (cookieToken) {
    token = cookieToken;
  } else {
    const requestToken = extractBearerToken(
      request.headers.get("authorization"),
    );
    if (requestToken) {
      token = requestToken;
    }
  }

  if (!token) {
    throw new Error("Unauthorized");
  }

  return getUserFromTokenOrThrow(token);
}

export async function getCurrentAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const hdr = await headers();
  const headerToken =
    extractBearerToken(hdr.get("authorization")) ||
    extractBearerToken(hdr.get("Authorization"));
  const cookieToken = await getAccessTokenFromCookies();
  const token = headerToken || cookieToken || "";

  if (!token) {
    return null;
  }

  try {
    return await getUserFromTokenOrThrow(token);
  } catch {
    return null;
  }
}

export async function requireAuthenticatedUserId(): Promise<string> {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    redirect("/auth/signin");
  }

  return user.id;
}
