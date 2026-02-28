import { cookies, headers } from "next/headers";

import type { Database } from "@/supabase/database.types";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
type PostUpdate = Database["public"]["Tables"]["posts"]["Update"];

interface SupabaseAuthUser {
  id: string;
}

interface SupabaseErrorResponse {
  error?: {
    message?: string;
  };
  message?: string;
}

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return { url, serviceRoleKey };
}

function parseErrorMessage(body: SupabaseErrorResponse | null, status: number): string {
  return body?.error?.message ?? body?.message ?? `Supabase request failed (${status}).`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { url, serviceRoleKey } = getSupabaseEnv();

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "return=representation",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as SupabaseErrorResponse | null;
    throw new Error(parseErrorMessage(body, response.status));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function getAccessTokenFromRequest(): string | null {
  const authHeader = headers().get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  const cookieStore = cookies();
  const tokenCookieNames = [
    "sb-access-token",
    "supabase-access-token",
    "access_token",
  ];

  for (const cookieName of tokenCookieNames) {
    const token = cookieStore.get(cookieName)?.value;
    if (token) {
      return token;
    }
  }

  return null;
}

export async function requireAuthenticatedUserId(): Promise<string> {
  const { url } = getSupabaseEnv();
  const accessToken = getAccessTokenFromRequest();

  if (!accessToken) {
    throw new Error("Unauthorized: missing access token.");
  }

  const response = await fetch(`${url}/auth/v1/user`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unauthorized: invalid access token.");
  }

  const user = (await response.json().catch(() => null)) as SupabaseAuthUser | null;
  if (!user?.id) {
    throw new Error("Unauthorized: user not found.");
  }

  return user.id;
}

export async function selectPostsByUserId(userId: string): Promise<PostRow[]> {
  const query = [
    "posts?select=id,user_id,platform,title,caption,image_url,status,scheduled_date,scheduled_time,created_at,updated_at",
    `user_id=eq.${userId}`,
    "order=created_at.desc",
  ].join("&");

  return request<PostRow[]>(query, { method: "GET" });
}

export async function selectPostByIdForUser(id: string, userId: string): Promise<PostRow | null> {
  const query = [
    "posts?select=id,user_id,platform,title,caption,image_url,status,scheduled_date,scheduled_time,created_at,updated_at",
    `id=eq.${id}`,
    `user_id=eq.${userId}`,
    "limit=1",
  ].join("&");

  const rows = await request<PostRow[]>(query, { method: "GET" });
  return rows[0] ?? null;
}

export async function insertPost(post: PostInsert): Promise<void> {
  await request<PostRow[]>("posts", {
    method: "POST",
    body: JSON.stringify(post),
  });
}

export async function updatePostByIdForUser(id: string, userId: string, update: PostUpdate): Promise<void> {
  const query = `posts?id=eq.${id}&user_id=eq.${userId}`;
  await request<PostRow[]>(query, {
    method: "PATCH",
    body: JSON.stringify(update),
  });
}

export async function deletePostByIdForUser(id: string, userId: string): Promise<void> {
  const query = `posts?id=eq.${id}&user_id=eq.${userId}`;
  await request<void>(query, {
    method: "DELETE",
  });
}
