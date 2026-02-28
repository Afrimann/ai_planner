import { NextResponse } from "next/server";

import { generateAIPlan } from "@/ai/planner";
import type { AIPlanRequest } from "@/types";

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<AIPlanRequest>;

  if (!payload.prompt || typeof payload.prompt !== "string") {
    return NextResponse.json({ error: "Invalid prompt." }, { status: 400 });
  }

  try {
    const response = await generateAIPlan({ prompt: payload.prompt.trim() });
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown AI processing error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
