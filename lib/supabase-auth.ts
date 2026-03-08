import "server-only";

import { cookies } from "next/headers";

export const AUTH_ACCESS_COOKIE = "ai_planner_access_token";
export const AUTH_REFRESH_COOKIE = "ai_planner_refresh_token";

interface SupabaseAuthErrorResponse {
  message?: string;
  msg?: string;
  error?: string;
  error_description?: string;
}

interface SupabaseAuthUserResponse {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

interface SupabaseAdminUsersResponse {
  users?: SupabaseAuthUserResponse[];
}

export interface SupabaseSessionResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: SupabaseAuthUserResponse;
}

function getSupabaseAuthEnv(options?: { requireServiceRole?: boolean }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  if (options?.requireServiceRole && !serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  if (!url.includes("supabase.co")) {
    console.warn(
      "getSupabaseAuthEnv: URL does not look like a Supabase endpoint",
      url,
    );
  }

  return { url, anonKey, serviceRoleKey };
}

function parseSupabaseAuthError(
  body: SupabaseAuthErrorResponse | null,
  status: number,
): string {
  const message =
    body?.msg ?? body?.error_description ?? body?.message ?? body?.error ?? "";

  if (message) {
    return message;
  }

  return `Supabase auth request failed (${status}).`;
}

async function parseErrorMessage(response: Response): Promise<string> {
  const body = (await response
    .json()
    .catch(() => null)) as SupabaseAuthErrorResponse | null;

  return parseSupabaseAuthError(body, response.status);
}

async function authFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, cache: "no-store" });
  } catch {
    throw new Error(
      "Unable to reach Supabase Auth. Check NEXT_PUBLIC_SUPABASE_URL, keys, and your network connection.",
    );
  }
}

export async function exchangePasswordForSession(
  email: string,
  password: string,
): Promise<SupabaseSessionResponse> {
  const { url, anonKey } = getSupabaseAuthEnv();

  const response = await authFetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as SupabaseSessionResponse;
}

export async function exchangeRefreshTokenForSession(
  refreshToken: string,
): Promise<SupabaseSessionResponse> {
  const { url, anonKey } = getSupabaseAuthEnv();

  const response = await authFetch(
    `${url}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as SupabaseSessionResponse;
}

export async function createUserWithAdmin(
  fullName: string,
  email: string,
  password: string,
): Promise<void> {
  const { url, serviceRoleKey } = getSupabaseAuthEnv({
    requireServiceRole: true,
  });

  // by default assign new users the free plan so we can easily
  // inspect their subscription status later
  const response = await authFetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey!,
      Authorization: `Bearer ${serviceRoleKey!}`,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, plan: "free" },
    }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
}

export async function findAuthUserByEmail(
  email: string,
): Promise<{ id: string; email?: string } | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const { url, serviceRoleKey } = getSupabaseAuthEnv({
    requireServiceRole: true,
  });

  const response = await authFetch(
    `${url}/auth/v1/admin/users?email=${encodeURIComponent(normalizedEmail)}&per_page=1&page=1`,
    {
      method: "GET",
      headers: {
        apikey: serviceRoleKey!,
        Authorization: `Bearer ${serviceRoleKey!}`,
      },
    },
  );

  let users: SupabaseAuthUserResponse[] = [];

  if (response.ok) {
    const body = (await response.json().catch(() => null)) as
      | SupabaseAdminUsersResponse
      | null;
    users = body?.users ?? [];
  } else {
    // Some Supabase versions don't support filtering by `email` in this endpoint.
    // Fall back to listing a page of users and filtering in-process.
    const fallbackResponse = await authFetch(
      `${url}/auth/v1/admin/users?per_page=200&page=1`,
      {
        method: "GET",
        headers: {
          apikey: serviceRoleKey!,
          Authorization: `Bearer ${serviceRoleKey!}`,
        },
      },
    );

    if (!fallbackResponse.ok) {
      throw new Error(await parseErrorMessage(fallbackResponse));
    }

    const fallbackBody = (await fallbackResponse.json().catch(() => null)) as
      | SupabaseAdminUsersResponse
      | null;
    users = fallbackBody?.users ?? [];
  }

  const user = users.find(
    (item) => item.email?.toLowerCase() === normalizedEmail,
  );
  if (!user?.id) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}

export async function sendPasswordResetEmail(email: string): Promise<void> {
  const { url, anonKey } = getSupabaseAuthEnv();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const response = await authFetch(`${url}/auth/v1/recover`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      email,
      options: {
        redirectTo: `${appUrl}/auth/signin`,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
}

export async function getAuthenticatedUserFromToken(
  accessToken: string,
): Promise<SupabaseAuthUserResponse> {
  const { url, anonKey } = getSupabaseAuthEnv();

  const response = await authFetch(`${url}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as SupabaseAuthUserResponse;
}

export async function persistAuthSessionCookies(
  session: SupabaseSessionResponse,
): Promise<void> {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set(AUTH_ACCESS_COOKIE, session.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(session.expires_in, 60),
  });

  cookieStore.set(AUTH_REFRESH_COOKIE, session.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAuthSessionCookies(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(AUTH_ACCESS_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  cookieStore.set(AUTH_REFRESH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getAccessTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_ACCESS_COOKIE)?.value ?? null;
}

export async function getRefreshTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_REFRESH_COOKIE)?.value ?? null;
}

// update authenticated user's profile or password. the caller must supply a
// valid access token (typically obtained via cookie).  the update object may
// include `password` and/or `user_metadata` as documented by the Supabase
// REST API.
export async function updateUser(
  accessToken: string,
  updates: {
    password?: string;
    user_metadata?: Record<string, unknown>;
  },
): Promise<SupabaseAuthUserResponse> {
  const { url, anonKey } = getSupabaseAuthEnv();

  const response = await authFetch(`${url}/auth/v1/user`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as SupabaseAuthUserResponse;
}
