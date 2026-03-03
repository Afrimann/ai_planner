import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthenticatedUser } from "@/lib/auth";
import { getSupabaseEnv } from "@/supabase/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const plan = body?.plan;
    if (typeof plan !== "string") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const user = await getCurrentAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // update the user's metadata with the new plan
    const newMetadata = {
      ...(user.metadata || {}),
      plan,
    };

    // perform update via service-role admin endpoint instead of relying on
    // client access token; the previous implementation was generating a
    // 405 response in production for some users.
    const { url, serviceRoleKey } = getSupabaseEnv();
    console.log("plan upgrade: calling admin patch", {
      url,
      userId: user.id,
      plan,
      serviceRoleKeyPresent: Boolean(serviceRoleKey),
    });
    const adminRes = await fetch(`${url}/auth/v1/admin/users/${user.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ user_metadata: newMetadata }),
    });

    if (!adminRes.ok) {
      const text = await adminRes.text().catch(() => "<no body>");
      console.error("admin update response", {
        status: adminRes.status,
        statusText: adminRes.statusText,
        body: text,
      });
      const errBody = await adminRes.json().catch(() => null);
      const msg = errBody?.error?.message || errBody?.message || "unknown";
      throw new Error(`admin update failed (${adminRes.status}): ${msg}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("plan upgrade error", err);
    return NextResponse.json(
      { error: err?.message || "Unknown" },
      { status: 500 },
    );
  }
}
