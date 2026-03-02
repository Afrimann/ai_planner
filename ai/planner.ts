import type { AIPlanRequest, AIPlanResponse } from "@/types";

const groqApiUrl = "https://api.groq.com/openai/v1/chat/completions";
const defaultGroqModel = "llama-3.3-70b-versatile";

interface GroqErrorResponse {
  error?: {
    message?: string;
  };
}

interface GroqChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

function readPlan(response: GroqChatCompletionResponse): string | null {
  const content = response.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    return null;
  }

  const normalized = content.trim();
  return normalized || null;
}

export async function generateAIPlan(input: AIPlanRequest): Promise<AIPlanResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const model = process.env.GROQ_MODEL ?? defaultGroqModel;

  const response = await fetch(groqApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "Create concise daily execution plans. Return plain text with clear priorities and actionable steps.",
        },
        {
          role: "user",
          content: `Create a concise daily execution plan for: ${input.prompt}`,
        },
      ],
      temperature: 0.5,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => null)) as GroqErrorResponse | null;
    const errorMessage = body?.error?.message;

    if (errorMessage) {
      throw new Error(`Groq request failed: ${errorMessage}`);
    }

    throw new Error(`Groq request failed with status ${response.status}`);
  }

  const json = (await response.json()) as GroqChatCompletionResponse;
  const plan = readPlan(json);

  if (!plan) {
    throw new Error("Groq response did not contain message content.");
  }

  return { plan };
}
