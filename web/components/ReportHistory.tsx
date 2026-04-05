"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { deleteReport, fetchReportsList, type ReportListItem } from "@/lib/api";

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ReportHistory() {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [databaseConfigured, setDatabaseConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchReportsList();
        if (!cancelled) {
          setReports(data.reports);
          setDatabaseConfigured(data.databaseConfigured);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load reports");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3">
        <span className="inline-block size-8 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-400" />
        <p className="text-sm text-zinc-500">Loading reports…</p>
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg border border-rose-900/50 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
        {error}
      </p>
    );
  }

  if (!databaseConfigured) {
    return (
      <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 px-6 py-8 text-center">
        <p className="text-zinc-200">
          Database is not configured. Set{" "}
          <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-amber-200">
            DATABASE_URL
          </code>{" "}
          in <code className="text-xs text-zinc-400">server/.env</code> so reports are saved and
          listed here.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-indigo-400 hover:text-indigo-300"
        >
          ← Back to analyze
        </Link>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 px-6 py-12 text-center">
        <p className="text-zinc-400">No saved reports yet.</p>
        <p className="mt-2 text-sm text-zinc-600">
          Run an analysis from the Analyze tab — reports appear here automatically.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          New analysis
        </Link>
      </div>
    );
  }

  async function handleDelete(r: ReportListItem) {
    if (
      !confirm(
        `Delete the saved report for “${r.company_name}”? This cannot be undone.`
      )
    ) {
      return;
    }
    setDeletingId(r.id);
    setError(null);
    try {
      await deleteReport(r.id);
      setReports((prev) => prev.filter((x) => x.id !== r.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete report");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ul className="space-y-3">
      {reports.map((r) => (
        <li
          key={r.id}
          className="flex gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 transition hover:border-zinc-700 sm:gap-3"
        >
          <Link
            href={`/results/${r.id}`}
            className="min-w-0 flex-1 p-5 transition hover:bg-zinc-900/50"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <h2 className="truncate text-lg font-semibold text-white">{r.company_name}</h2>
                {r.website ? (
                  <p className="truncate text-sm text-zinc-500">{r.website}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                {r.mode === "roast" && (
                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-medium text-rose-200">
                    Roast
                  </span>
                )}
                <time className="text-xs text-zinc-500" dateTime={r.created_at}>
                  {formatDate(r.created_at)}
                </time>
              </div>
            </div>
          </Link>
          <div className="flex shrink-0 items-center pr-2 sm:pr-4">
            <button
              type="button"
              disabled={deletingId === r.id}
              onClick={() => void handleDelete(r)}
              title="Delete report"
              aria-label={`Delete report for ${r.company_name}`}
              className="rounded-lg border border-zinc-700 p-2 text-zinc-400 transition hover:border-rose-800 hover:bg-rose-950/40 hover:text-rose-200 disabled:opacity-50"
            >
              {deletingId === r.id ? (
                <span className="inline-block size-4 animate-pulse rounded bg-zinc-600" />
              ) : (
                <TrashIcon className="size-4" />
              )}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
