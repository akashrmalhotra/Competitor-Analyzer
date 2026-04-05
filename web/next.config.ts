import type { NextConfig } from "next";

/**
 * Avoid `outputFileTracingRoot` pointing at the monorepo parent — it can break
 * webpack chunk loading in dev (`Cannot find module './331.js'`).
 * If you see a multi-lockfile warning, run `npm run clean` or delete `web/.next`.
 */
const nextConfig: NextConfig = {};

export default nextConfig;
