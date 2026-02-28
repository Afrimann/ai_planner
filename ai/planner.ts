import type { AIPlanRequest, AIPlanResponse } from "@/types";

const openAiUrl = "https://api.openai.com/v1/responses";

export async function generateAIPlan(input: AIPlanRequest): Promise<AIPlanResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch(openAiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: `Create a concise daily execution plan for: ${input.prompt}`,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`AI request failed with status ${response.status}`);
  }

  const json = (await response.json()) as {
    output_text?: string;
  };

  if (!json.output_text) {
    throw new Error("AI response did not contain output_text.");
  }

  return { plan: json.output_text };
}
