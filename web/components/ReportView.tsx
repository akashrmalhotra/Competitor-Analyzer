"use client";

import { useCallback, useRef } from "react";
import type { AnalysisResult } from "@/lib/types";

function SectionCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 shadow-xl backdrop-blur print-break ${className}`}
    >
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ObjBlock(obj: Record<string, unknown>) {
  const entries = Object.entries(obj).filter(
    ([, v]) => v !== undefined && v !== null && String(v).length > 0
  );
  if (entries.length === 0) {
    return <p className="text-sm text-zinc-500">No structured data.</p>;
  }
  return (
    <dl className="space-y-3">
      {entries.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs font-medium text-zinc-500">{k}</dt>
          <dd className="text-sm text-zinc-200">
            {typeof v === "object" ? JSON.stringify(v) : String(v)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ListBlock(items: string[], variant: "fire" | "rocket") {
  if (!items.length) {
    return <p className="text-sm text-zinc-500">None listed.</p>;
  }
  const icon = variant === "fire" ? "🔥" : "🚀";
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li
          key={i}
          className={`flex gap-2 rounded-lg border px-3 py-2 text-sm ${
            variant === "fire"
              ? "border-rose-900/50 bg-rose-950/20 text-rose-100"
              : "border-emerald-900/50 bg-emerald-950/20 text-emerald-100"
          }`}
        >
          <span aria-hidden>{icon}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ReportView({
  companyName,
  website,
  mode,
  result,
}: {
  companyName: string;
  website: string | null;
  mode: "roast" | "standard";
  result: AnalysisResult;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const copyAll = useCallback(async () => {
    const text = [
      `# ${companyName}`,
      website ? `Website: ${website}` : "",
      `Mode: ${mode}`,
      "",
      "## Insight",
      result.insight,
      "",
      "## Weaknesses",
      ...result.weaknesses.map((w) => `- ${w}`),
      "",
      "## Opportunities",
      ...result.opportunities.map((o) => `- ${o}`),
    ]
      .filter(Boolean)
      .join("\n");
    await navigator.clipboard.writeText(text);
  }, [companyName, website, mode, result]);

  const printPdf = useCallback(() => {
    window.print();
  }, []);

  return (
    <div ref={printRef} className="mx-auto max-w-3xl space-y-6 pb-24">
      <header className="print-break space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-indigo-400">
          Competitor Analyzer
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          {companyName}
        </h1>
        {website && (
          <a
            href={website.startsWith("http") ? website : `https://${website}`}
            className="text-sm text-indigo-300 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            {website}
          </a>
        )}
        {mode === "roast" && (
          <span className="inline-flex rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-200">
            Roast mode
          </span>
        )}
        {result.insight && (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm leading-relaxed text-zinc-300">
            {result.insight}
          </p>
        )}
      </header>

      <div className="no-print flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyAll()}
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-700"
        >
          Copy report
        </button>
        <button
          type="button"
          onClick={printPdf}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          PDF (print)
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Overview">{ObjBlock(result.overview)}</SectionCard>
        <SectionCard title="Positioning">{ObjBlock(result.positioning)}</SectionCard>
        <SectionCard title="Pricing">{ObjBlock(result.pricing)}</SectionCard>
        <SectionCard title="Growth">{ObjBlock(result.growth)}</SectionCard>
        <SectionCard title="Product" className="md:col-span-2">
          {ObjBlock(result.product)}
        </SectionCard>
      </div>

      <SectionCard title="Weaknesses & gaps">
        {ListBlock(result.weaknesses, "fire")}
      </SectionCard>

      <SectionCard title="Opportunities">{ListBlock(result.opportunities, "rocket")}</SectionCard>

      {result.competitors.length > 0 && (
        <SectionCard title="Competitors">
          <ul className="flex flex-wrap gap-2">
            {result.competitors.map((c, i) => (
              <li
                key={i}
                className="rounded-full border border-zinc-700 bg-zinc-800/50 px-3 py-1 text-sm text-zinc-200"
              >
                {c}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
