import type { AnalyzeResponse } from "./types";

const base = () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function analyzeUrl(roast: boolean) {
  const q = roast ? "?mode=roast" : "";
  return typeof window !== "undefined" ? `/api/analyze${q}` : `${base()}/analyze${q}`;
}

export async function analyzeCompany(
  body: { companyName: string; website?: string },
  roast: boolean
): Promise<AnalyzeResponse> {
  const res = await fetch(analyzeUrl(roast), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<AnalyzeResponse>;
}

function reportUrl(id: string) {
  return typeof window !== "undefined"
    ? `/api/reports/${encodeURIComponent(id)}`
    : `${base()}/reports/${encodeURIComponent(id)}`;
}

export async function deleteReport(id: string): Promise<void> {
  const res = await fetch(reportUrl(id), { method: "DELETE", cache: "no-store" });
  if (res.status === 204) return;
  const err = (await res.json().catch(() => ({}))) as { error?: string };
  throw new Error(err.error ?? res.statusText ?? "Failed to delete report");
}

export async function fetchReport(id: string) {
  const res = await fetch(reportUrl(id), { cache: "no-store" });
  if (!res.ok) return null;
  return res.json() as Promise<{
    id: string;
    company_name: string;
    website: string;
    mode: "standard" | "roast";
    result: AnalyzeResponse["result"];
    created_at: string;
  }>;
}

export type ReportListItem = {
  id: string;
  company_name: string;
  website: string;
  mode: "standard" | "roast";
  created_at: string;
};

export async function fetchReportsList(limit = 50): Promise<{
  reports: ReportListItem[];
  databaseConfigured: boolean;
}> {
  // Same-origin /api/reports avoids browser "Failed to fetch" from CORS or mixed content.
  const url =
    typeof window !== "undefined"
      ? `/api/reports?limit=${limit}`
      : `${base()}/reports?limit=${limit}`;
  const res = await fetch(url, { cache: "no-store" });
  const json = (await res.json().catch(() => ({}))) as {
    reports?: unknown;
    databaseConfigured?: unknown;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(json.error ?? res.statusText ?? "Failed to load reports");
  }
  return {
    reports: Array.isArray(json.reports) ? (json.reports as ReportListItem[]) : [],
    databaseConfigured: Boolean(json.databaseConfigured),
  };
}
