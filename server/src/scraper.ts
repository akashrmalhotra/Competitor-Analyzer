import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
import type { ScrapedContent } from "./types.js";

/** Static HTML fetch — must not hang forever if the host is slow. */
const FETCH_MS = 20_000;

/** Headless render: avoid networkidle2 (often never settles on analytics-heavy sites). */
const PUPPETE_GOTO_MS = 25_000;

const PRICING_KEYWORDS =
  /\$|€|£|\/mo|\/month|per seat|per user|pricing|plan|tier|free trial|enterprise/i;

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function extractFromHtml(html: string): ScrapedContent {
  const $ = cheerio.load(html);
  $("script, style, nav, footer, noscript").remove();

  const title = $("title").first().text().trim();
  const description =
    $('meta[name="description"]').attr("content")?.trim() ??
    $('meta[property="og:description"]').attr("content")?.trim() ??
    "";

  const headings: string[] = [];
  $("h1, h2, h3").each((_, el) => {
    const t = $(el).text().trim();
    if (t && t.length < 200) headings.push(t);
  });

  const paragraphs: string[] = [];
  $("p, li").each((_, el) => {
    const t = $(el).text().trim().replace(/\s+/g, " ");
    if (t.length > 40 && t.length < 800) paragraphs.push(t);
  });

  const pricingHints: string[] = [];
  const features: string[] = [];

  for (const p of paragraphs) {
    if (PRICING_KEYWORDS.test(p)) pricingHints.push(p);
  }

  $('[class*="feature"], section').each((_, el) => {
    const h = $(el).find("h2, h3").first().text().trim();
    if (h && h.length < 120) features.push(h);
  });

  const content = paragraphs.slice(0, 40).join("\n\n").slice(0, 24_000);

  return {
    title,
    description,
    content,
    headings: [...new Set(headings)].slice(0, 50),
    pricingHints: [...new Set(pricingHints)].slice(0, 20),
    features: [...new Set(features)].slice(0, 30),
  };
}

async function fetchWithCheerio(url: string): Promise<ScrapedContent | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_MS),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();
    return extractFromHtml(html);
  } catch {
    return null;
  }
}

async function fetchWithPuppeteer(url: string): Promise<ScrapedContent> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(PUPPETE_GOTO_MS);
    await page.setDefaultTimeout(PUPPETE_GOTO_MS);
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    // networkidle2 often never completes on modern SPAs (analytics, sockets).
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: PUPPETE_GOTO_MS,
    });
    await new Promise((r) => setTimeout(r, 800));
    const html = await page.content();
    return extractFromHtml(html);
  } finally {
    await browser.close();
  }
}

export async function scrapeWebsite(website: string): Promise<ScrapedContent> {
  const url = normalizeUrl(website);
  if (!url) {
    return emptyScrape();
  }

  let data = await fetchWithCheerio(url);
  const thin =
    !data || (data.content.length < 400 && data.headings.length < 2);

  if (thin) {
    try {
      data = await fetchWithPuppeteer(url);
    } catch {
      if (!data) return emptyScrape();
    }
  }

  return data ?? emptyScrape();
}

function emptyScrape(): ScrapedContent {
  return {
    title: "",
    description: "",
    content: "",
    headings: [],
    pricingHints: [],
    features: [],
  };
}
