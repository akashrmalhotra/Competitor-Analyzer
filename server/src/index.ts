import "dotenv/config";
import cors from "cors";
import type { IncomingMessage, ServerResponse } from "http";
import express from "express";
import { pinoHttp } from "pino-http";
import { analyzeRouter } from "./routes/analyze.js";
import { logger } from "./logger.js";
import { reportsRouter } from "./routes/reports.js";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()) ?? true,
  })
);

app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req: IncomingMessage) => {
        const path = req.url?.split("?")[0] ?? "";
        return path === "/health";
      },
    },
    customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error) => {
      if (res.statusCode >= 500 || err) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/analyze", analyzeRouter);
app.use("/reports", reportsRouter);

app.listen(port, () => {
  logger.info({ port }, "API listening");
});
