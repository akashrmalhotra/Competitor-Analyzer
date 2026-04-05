import { Router } from "express";
import { deleteReportById, getReportById, listReports } from "../db.js";
import { getReqLog } from "../requestLog.js";

export const reportsRouter = Router();

reportsRouter.get("/", async (req, res) => {
  const log = getReqLog(req);
  try {
    const raw = req.query.limit;
    const limit =
      typeof raw === "string" ? Number.parseInt(raw, 10) : Number.NaN;
    const cap = Number.isFinite(limit) ? limit : 50;
    const reports = await listReports(cap);
    log.debug({ count: reports.length, limit: cap }, "reports: list");
    res.json({
      reports,
      databaseConfigured: Boolean(process.env.DATABASE_URL),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list reports";
    log.error({ err: e }, "reports: list failed");
    res.status(500).json({ error: message, reports: [], databaseConfigured: false });
  }
});

reportsRouter.get("/:id", async (req, res) => {
  const log = getReqLog(req);
  const row = await getReportById(req.params.id);
  if (!row) {
    log.warn({ id: req.params.id }, "reports: not found");
    res.status(404).json({ error: "Report not found" });
    return;
  }
  log.debug({ id: req.params.id, company: row.company_name }, "reports: get");
  res.json({
    id: req.params.id,
    company_name: row.company_name,
    website: row.website,
    mode: row.mode,
    result: row.result,
    created_at: row.created_at,
  });
});

reportsRouter.delete("/:id", async (req, res) => {
  const log = getReqLog(req);
  if (!process.env.DATABASE_URL) {
    res.status(503).json({ error: "Database not configured" });
    return;
  }
  try {
    const deleted = await deleteReportById(req.params.id);
    if (!deleted) {
      log.warn({ id: req.params.id }, "reports: delete not found");
      res.status(404).json({ error: "Report not found" });
      return;
    }
    log.info({ id: req.params.id }, "reports: deleted");
    res.status(204).send();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete failed";
    log.error({ err: e, id: req.params.id }, "reports: delete failed");
    res.status(500).json({ error: message });
  }
});
