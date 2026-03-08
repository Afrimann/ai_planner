import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/auth";
import { rewriteCaption, shortenText } from "@/lib/ai/service";
import { resolveActiveWorkspaceIdForUser } from "@/lib/workspace-context";
import { insertAILog } from "@/supabase/client";

type AIAction = "rewrite_caption" | "shorten_text";

interface AIRequestBody {
  action?: AIAction;
  text?: string;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as AIRequestBody;

  if (!payload.action || !payload.text || typeof payload.text !== "string") {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  let userId: string;

  try {
    const user = await requireAuthenticatedUser(request);
    userId = user.id;
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const inputText = payload.text.trim();
  if (!inputText) {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }

  try {
    const workspaceId = await resolveActiveWorkspaceIdForUser(userId);
    const outputText =
      payload.action === "rewrite_caption"
        ? await rewriteCaption(inputText)
        : await shortenText(inputText);

    await insertAILog({
      user_id: userId,
      workspace_id: workspaceId,
      action: payload.action,
      input_text: inputText,
      output_text: outputText,
    });

    return NextResponse.json({ result: outputText }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown AI processing error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
