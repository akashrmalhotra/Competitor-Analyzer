"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { analyzeCompany } from "@/lib/api";
import type { AnalyzeResponse } from "@/lib/types";

const STORAGE_KEY = "competitor-analyzer:last";

export function AnalyzeForm() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [roast, setRoast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body: { companyName: string; website?: string } = {
        companyName: companyName.trim(),
      };
      const w = website.trim();
      if (w) body.website = w;
      const data: AnalyzeResponse = await analyzeCompany(body, roast);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      const dest = data.reportId ?? "local";
      router.push(`/results/${dest}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="company" className="block text-sm font-medium text-zinc-300">
          Company or product name
        </label>
        <input
          id="company"
          required
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="e.g. Acme AI"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="website" className="block text-sm font-medium text-zinc-300">
          Website <span className="text-zinc-500">(optional)</span>
        </label>
        <input
          id="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="acme.com"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
        <input
          type="checkbox"
          checked={roast}
          onChange={(e) => setRoast(e.target.checked)}
          className="size-4 rounded border-zinc-600 text-rose-500 focus:ring-rose-500"
        />
        <span className="text-sm text-zinc-200">
          <span className="font-semibold">Roast mode</span>
          <span className="text-zinc-500"> — brutally honest critique</span>
        </span>
      </label>
      {error && (
        <p className="rounded-lg border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <span className="inline-block size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Analyzing…
          </>
        ) : (
          "Analyze competitor"
        )}
      </button>
    </form>
  );
}
