import type { Logger } from "pino";
import type { Request } from "express";
import { logger } from "./logger.js";

export type RequestWithLog = Request & { log: Logger };

export function getReqLog(req: Request): Logger {
  const withLog = req as RequestWithLog;
  return withLog.log ?? logger;
}
