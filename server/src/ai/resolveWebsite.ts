import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function resolveWebsiteFromCompanyName(
  companyName: string
): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL_RESOLVE ?? "gpt-4o-mini",
    max_tokens: 120,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          'Given a company or product name, return JSON only: {"website":"https://..."} with the official marketing homepage URL, or {"website":null} if unknown. No markdown.',
      },
      { role: "user", content: companyName },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { website?: string | null };
    const w = parsed.website;
    if (typeof w !== "string" || !w.trim()) return null;
    return w.trim();
  } catch {
    return null;
  }
}
