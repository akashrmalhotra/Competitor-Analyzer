"use client";

import { useCallback, useState } from "react";

export function ShareBar({ reportId }: { reportId: string | null }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = useCallback(() => {
    if (typeof window === "undefined" || !reportId) return "";
    return `${window.location.origin}/results/${reportId}`;
  }, [reportId]);

  const copyLink = useCallback(async () => {
    const url = shareUrl();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  if (!reportId) {
    return (
      <p className="text-xs text-zinc-500">
        Share link unavailable — enable MySQL and <code className="text-zinc-400">DATABASE_URL</code>{" "}
        to persist reports.
      </p>
    );
  }

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <input
        readOnly
        value={shareUrl()}
        className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950/50 px-3 py-2 text-xs text-zinc-400"
      />
      <button
        type="button"
        onClick={() => void copyLink()}
        className="rounded-lg bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-zinc-700"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
