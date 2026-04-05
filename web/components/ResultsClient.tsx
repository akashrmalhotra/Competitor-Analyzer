"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { deleteReport, fetchReport } from "@/lib/api";
import type { AnalyzeResponse } from "@/lib/types";
import { ReportView } from "./ReportView";
import { ShareBar } from "./ShareBar";

const STORAGE_KEY = "competitor-analyzer:last";

export function ResultsClient({ id }: { id: string }) {
  const router = useRouter();
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        if (id !== "local") {
          const remote = await fetchReport(id);
          if (!cancelled && remote) {
            setData({
              reportId: remote.id,
              companyName: remote.company_name,
              website: remote.website || null,
              mode: remote.mode,
              scrapedSummary: { title: "", headingsCount: 0, contentLength: 0 },
              result: remote.result,
            });
            setLoading(false);
            return;
          }
        }
        const raw =
          typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
        if (!raw) {
          if (!cancelled) {
            setErr("No report found. Run an analysis from the home page.");
            setLoading(false);
          }
          return;
        }
        const parsed = JSON.parse(raw) as AnalyzeResponse;
        if (!cancelled) {
          setData(parsed);
        }
      } catch {
        if (!cancelled) setErr("Could not load report.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4">
        <span className="inline-block size-10 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-400" />
        <p className="text-sm text-zinc-500">Loading report…</p>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-zinc-300">{err ?? "Missing data"}</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Back home
        </Link>
      </div>
    );
  }

  const shareId = data.reportId ?? (id !== "local" ? id : null);
  const canDeleteSaved = id !== "local" && Boolean(data.reportId);

  async function handleDeleteReport() {
    if (!data) return;
    const targetId = data.reportId ?? id;
    if (
      !confirm(
        `Delete this saved report for “${data.companyName}”? This cannot be undone.`
      )
    ) {
      return;
    }
    setDeleting(true);
    setErr(null);
    try {
      await deleteReport(targetId);
      router.push("/history");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not delete report");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="text-sm font-medium text-indigo-400 hover:text-indigo-300"
        >
          ← New analysis
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {canDeleteSaved && (
            <button
              type="button"
              disabled={deleting}
              onClick={() => void handleDeleteReport()}
              title="Delete report"
              aria-label="Delete this saved report"
              className="rounded-lg border border-zinc-700 p-2 text-zinc-400 transition hover:border-rose-800 hover:bg-rose-950/40 hover:text-rose-200 disabled:opacity-50"
            >
              {deleting ? (
                <span className="inline-block size-4 animate-spin rounded-full border-2 border-zinc-500 border-t-rose-300" />
              ) : (
                <TrashIcon className="size-4" />
              )}
            </button>
          )}
          <ShareBar reportId={shareId} />
        </div>
      </div>
      {err && id !== "local" && (
        <p className="no-print mb-4 rounded-lg border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">
          {err}
        </p>
      )}
      <ReportView
        companyName={data.companyName}
        website={data.website}
        mode={data.mode}
        result={data.result}
      />
    </div>
  );
}
