import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthenticatedUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAuthenticatedUser();
    return NextResponse.json({ user });
  } catch (err) {
    // if something goes wrong, just return null
    return NextResponse.json({ user: null });
  }
}
