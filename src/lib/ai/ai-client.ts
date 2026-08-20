import { z } from "zod";

const AI_API_KEY = process.env.AI_API_KEY;
const AI_BASE_URL = process.env.AI_BASE_URL || "https://api.openai.com/v1";
const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";

export async function callAIWithSchema<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodSchema<T>,
  fallbackData: T
): Promise<T> {
  if (!AI_API_KEY) {
    return fallbackData;
  }

  try {
    const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `${systemPrompt}\n\nYou MUST respond in pure JSON conforming to the schema.` },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      console.warn("AI API request failed:", res.status, res.statusText);
      return fallbackData;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return fallbackData;

    const parsedJson = JSON.parse(content);
    const validated = schema.safeParse(parsedJson);

    if (validated.success) {
      return validated.data;
    } else {
      console.warn("AI Schema validation warning:", validated.error);
      return fallbackData;
    }
  } catch (error) {
    console.warn("AI Runner Error:", error);
    return fallbackData;
  }
}
