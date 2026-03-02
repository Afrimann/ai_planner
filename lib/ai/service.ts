import "server-only";

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

function readGroqMessage(response: GroqChatCompletionResponse): string | null {
  const content = response.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    return null;
  }

  const normalized = content.trim();
  return normalized || null;
}

async function generateText(
  instruction: string,
  userInput: string,
): Promise<string> {
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
          content: instruction,
        },
        {
          role: "user",
          content: userInput,
        },
      ],
      temperature: 0.6,
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
  const content = readGroqMessage(json);

  if (!content) {
    throw new Error("Groq response did not contain message content.");
  }

  return content;
}

export async function rewriteCaption(caption: string): Promise<string> {
  return generateText(
    "Rewrite the caption to sound clear, engaging, and natural. Keep it close in meaning. Return only the rewritten caption.",
    caption,
  );
}

export async function shortenText(text: string): Promise<string> {
  return generateText(
    "Shorten the user text while preserving core meaning and tone. Return only the shortened text.",
    text,
  );
}
