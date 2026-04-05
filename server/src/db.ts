import { randomUUID } from "crypto";
import mysql from "mysql2/promise";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { AnalysisResult } from "./types.js";

function parseResultColumn(raw: unknown): AnalysisResult {
  if (raw !== null && typeof raw === "object" && !Buffer.isBuffer(raw)) {
    return raw as AnalysisResult;
  }
  if (typeof raw === "string") {
    return JSON.parse(raw) as AnalysisResult;
  }
  if (Buffer.isBuffer(raw)) {
    return JSON.parse(raw.toString("utf8")) as AnalysisResult;
  }
  throw new Error("Invalid report result column");
}

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!pool) {
    pool = mysql.createPool(url);
  }
  return pool;
}

export async function saveReport(params: {
  companyName: string;
  website: string | null;
  mode: "standard" | "roast";
  result: AnalysisResult;
}): Promise<string | null> {
  const p = getPool();
  if (!p) return null;
  const id = randomUUID();
  await p.execute(
    `INSERT INTO reports (id, company_name, website, mode, result, created_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [
      id,
      params.companyName,
      params.website ?? "",
      params.mode,
      JSON.stringify(params.result),
    ]
  );
  return id;
}

export async function getReportById(id: string): Promise<{
  company_name: string;
  website: string;
  mode: "standard" | "roast";
  result: AnalysisResult;
  created_at: Date;
} | null> {
  const p = getPool();
  if (!p) return null;
  type Row = RowDataPacket & {
    company_name: string;
    website: string;
    mode: string;
    result: unknown;
    created_at: Date;
  };
  const [rows] = await p.execute<Row[]>(
    "SELECT company_name, website, mode, result, created_at FROM reports WHERE id = ?",
    [id]
  );
  const row = rows[0];
  if (!row) return null;
  const mode = row.mode === "roast" ? "roast" : "standard";
  return {
    company_name: row.company_name,
    website: row.website,
    mode,
    result: parseResultColumn(row.result),
    created_at: row.created_at,
  };
}

export type ReportListItem = {
  id: string;
  company_name: string;
  website: string;
  mode: "standard" | "roast";
  created_at: Date;
};

export async function listReports(limit: number): Promise<ReportListItem[]> {
  const p = getPool();
  if (!p) return [];
  const n = Number.isFinite(limit) ? Math.trunc(limit) : 50;
  const cap = Math.min(200, Math.max(1, n));
  type Row = RowDataPacket & {
    id: string;
    company_name: string;
    website: string;
    mode: string;
    created_at: Date;
  };
  // LIMIT cannot use prepared placeholders reliably on all MySQL builds (ER_WRONG_ARGUMENTS).
  const [rows] = await p.execute<Row[]>(
    `SELECT id, company_name, website, mode, created_at
     FROM reports
     ORDER BY created_at DESC
     LIMIT ${cap}`
  );
  return rows.map((row) => ({
    id: row.id,
    company_name: row.company_name,
    website: row.website,
    mode: row.mode === "roast" ? "roast" : "standard",
    created_at: row.created_at,
  }));
}

export async function deleteReportById(id: string): Promise<boolean> {
  const p = getPool();
  if (!p) return false;
  const [result] = await p.execute<ResultSetHeader>(
    "DELETE FROM reports WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}
