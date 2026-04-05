import OpenAI from "openai";
import type { AnalysisResult, ScrapedContent } from "../types.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const emptySections = (): AnalysisResult => ({
  overview: {},
  positioning: {},
  pricing: {},
  growth: {},
  product: {},
  weaknesses: [],
  opportunities: [],
  competitors: [],
  insight: "",
});

function buildUserPayload(companyName: string, scraped: ScrapedContent) {
  return JSON.stringify({
    companyName,
    scrapedContent: scraped,
  });
}

function systemPrompt(roast: boolean): string {
  const tone = roast
    ? "You are a brutally honest strategic analyst. Roast mode: call out strategic flaws, market risks, and competitive weaknesses with sharp specificity. Still output valid JSON only."
    : "You are a senior GTM and product strategist. Be specific and actionable. Output JSON only.";

  return `${tone}

Return a single JSON object with exactly these keys (use objects with short string fields where helpful, arrays of strings for lists):
- overview: { summary, stageGuess?, primaryAudience? }
- positioning: { valueProp, differentiation, category? }
- pricing: { model, tiers?, notes? }
- growth: { channels, motions?, partnerships? }
- product: { coreOfferings, notableFeatures? }
- weaknesses: string[] (3-8 items)
- opportunities: string[] (3-8 items)
- competitors: string[] (named companies or categories)
- insight: string (one sharp takeaway)

If scraped content is thin, infer cautiously and note uncertainty in insight. No markdown, no code fences.`;
}

function parseAnalysisJson(text: string): AnalysisResult {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  const parsed = JSON.parse(cleaned) as Partial<AnalysisResult>;
  const base = emptySections();
  return {
    overview: (parsed.overview as Record<string, unknown>) ?? base.overview,
    positioning: (parsed.positioning as Record<string, unknown>) ?? base.positioning,
    pricing: (parsed.pricing as Record<string, unknown>) ?? base.pricing,
    growth: (parsed.growth as Record<string, unknown>) ?? base.growth,
    product: (parsed.product as Record<string, unknown>) ?? base.product,
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.map(String) : base.weaknesses,
    opportunities: Array.isArray(parsed.opportunities)
      ? parsed.opportunities.map(String)
      : base.opportunities,
    competitors: Array.isArray(parsed.competitors)
      ? parsed.competitors.map(String)
      : base.competitors,
    insight: typeof parsed.insight === "string" ? parsed.insight : base.insight,
  };
}

export async function analyzeCompany(
  companyName: string,
  scrapedContent: ScrapedContent,
  options: { roast: boolean }
): Promise<AnalysisResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o";
  const userContent = buildUserPayload(companyName, scrapedContent);
  const maxRetries = 2;

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model,
        temperature: options.roast ? 0.85 : 0.35,
        max_tokens: 4_096,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt(options.roast) },
          { role: "user", content: userContent },
        ],
      });

      const text = completion.choices[0]?.message?.content;
      if (!text) throw new Error("Empty model response");
      return parseAnalysisJson(text);
    } catch (e) {
      lastError = e;
      if (attempt === maxRetries) break;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
