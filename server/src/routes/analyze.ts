import { Router } from "express";
import { z } from "zod";
import { analyzeCompany } from "../ai/analyzeCompany.js";
import { resolveWebsiteFromCompanyName } from "../ai/resolveWebsite.js";
import { saveReport } from "../db.js";
import { getReqLog } from "../requestLog.js";
import { scrapeWebsite } from "../scraper.js";

const bodySchema = z.object({
  companyName: z.string().min(1).max(200),
  website: z.string().max(2048).optional(),
});

export const analyzeRouter = Router();

analyzeRouter.post("/", async (req, res) => {
  const log = getReqLog(req);
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    log.warn({ body: req.body }, "analyze: invalid body");
    res.status(400).json({ error: "Invalid body", details: parsed.error.flatten() });
    return;
  }

  const roast = req.query.mode === "roast";
  const { companyName, website: websiteInput } = parsed.data;
  const t0 = Date.now();

  log.info(
    { companyName, mode: roast ? "roast" : "standard", hasWebsiteInput: Boolean(websiteInput?.trim()) },
    "analyze: started"
  );

  let website = websiteInput?.trim() || null;
  let resolveMs = 0;
  if (!website) {
    const tr = Date.now();
    website = await resolveWebsiteFromCompanyName(companyName);
    resolveMs = Date.now() - tr;
    if (website) log.debug({ website, resolveMs }, "analyze: resolved website");
    else log.debug({ resolveMs }, "analyze: no website resolved");
  }

  let scrapeMs = 0;
  let scraped: Awaited<ReturnType<typeof scrapeWebsite>> = {
    title: "",
    description: "",
    content: "",
    headings: [],
    pricingHints: [],
    features: [],
  };

  if (website) {
    log.info({ website }, "analyze: scraping page");
    const ts = Date.now();
    try {
      scraped = await scrapeWebsite(website);
      scrapeMs = Date.now() - ts;
    } catch (e) {
      scrapeMs = Date.now() - ts;
      log.warn({ err: e, website, scrapeMs }, "analyze: scrape threw; using minimal context");
      scraped = {
        title: companyName,
        description: "Scrape failed; analysis uses company name only.",
        content: `Company: ${companyName}. Website: ${website}`,
        headings: [],
        pricingHints: [],
        features: [],
      };
    }
    log.info(
      {
        scrapeMs,
        contentLength: scraped.content.length,
        headingsCount: scraped.headings.length,
      },
      "analyze: scrape finished"
    );
  }

  if (!scraped.content && !website) {
    scraped = {
      title: companyName,
      description: "No website resolved; analysis from name only.",
      content: `Company name: ${companyName}`,
      headings: [],
      pricingHints: [],
      features: [],
    };
  }

  try {
    log.info({ companyName }, "analyze: calling OpenAI");
    const ta = Date.now();
    const result = await analyzeCompany(companyName, scraped, { roast });
    const aiMs = Date.now() - ta;

    const reportId = await saveReport({
      companyName,
      website,
      mode: roast ? "roast" : "standard",
      result,
    });

    const totalMs = Date.now() - t0;
    log.info(
      {
        companyName,
        mode: roast ? "roast" : "standard",
        reportId,
        totalMs,
        resolveMs,
        scrapeMs,
        aiMs,
        saved: Boolean(reportId),
      },
      "analyze: completed"
    );

    res.json({
      reportId,
      companyName,
      website,
      mode: roast ? "roast" : "standard",
      scrapedSummary: {
        title: scraped.title,
        headingsCount: scraped.headings.length,
        contentLength: scraped.content.length,
      },
      result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    log.error(
      { err, companyName, totalMs: Date.now() - t0 },
      "analyze: failed"
    );
    res.status(502).json({ error: message });
  }
});
