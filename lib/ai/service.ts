import "server-only";

const openAiUrl = "https://api.openai.com/v1/responses";

async function generateText(instruction: string, userInput: string): Promise<string> {
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
      input: [
        {
          role: "system",
          content: instruction,
        },
        {
          role: "user",
          content: userInput,
        },
      ],
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

  return json.output_text.trim();
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
