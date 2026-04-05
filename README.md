# Competitor Analyzer

AI-powered competitor research: enter a company name (and optional website) and get a structured report—positioning, pricing, growth, product summary, weaknesses, opportunities, and optional **roast mode** for a sharper critique.

## Features

- **Analyze** — Scrape public site content (Cheerio + Puppeteer fallback), then summarize with OpenAI (JSON output).
- **Roast mode** — Same flow with a more brutal system prompt.
- **Saved reports** — Persist to MySQL, list under **Previous reports**, open by URL, delete with trash icon.
- **Share** — Copy link when a report is stored; local-only runs still work via session storage.
- **Export** — Copy full report text; print / save as PDF from the browser.

## Stack

| Layer | Technology |
|--------|------------|
| Frontend | Next.js 15 (App Router), Tailwind CSS |
| API | Express (TypeScript), proxied from Next via `app/api/*` in dev |
| Database | MySQL (optional; reports + users schema) |
| AI | OpenAI Chat Completions (configurable model) |
| Scraping | `fetch` + Cheerio; Puppeteer when HTML is thin |

## Repository layout

```
competitor/
├── web/           # Next.js app (port 3000)
├── server/        # Express API (port 4000)
├── db/            # SQL schema and migrations
├── .env.example   # Copy into server/.env and web/.env.local
└── package.json   # Root scripts (run web + API together)
```

## Prerequisites

- **Node.js** 20+ recommended  
- **OpenAI API key** (required for analysis)  
- **MySQL** (optional; without `DATABASE_URL`, analyses still work but are not persisted or shareable by id)  
- **Chromium** (installed with Puppeteer on first `npm install` in `server/`)

## Quick start

### 1. Install dependencies

From the repository root:

```bash
npm install
npm run install:all
```

Or install in each package:

```bash
cd server && npm install
cd ../web && npm install
```

### 2. Environment variables

Copy `.env.example` and create:

- **`server/.env`** — `OPENAI_API_KEY`, optional `DATABASE_URL`, `PORT`, `CORS_ORIGIN`, `LOG_LEVEL`, model overrides.
- **`web/.env.local`** — `NEXT_PUBLIC_API_URL=http://localhost:4000` (browser → API). For Next’s server-side proxies, you can also set `API_URL` to the same base URL if needed.

Never commit real `.env` files or API keys.

### 3. Database (optional)

Create a database and run:

```bash
mysql -u root -p < db/schema.sql
```

Point `DATABASE_URL` at it, for example:

`mysql://user:password@127.0.0.1:3306/competitor_analyzer`

If you added the `mode` column later, see `db/migrations/001_add_mode_to_reports.sql`.

### 4. Run in development

**Option A — both processes (from repo root):**

```bash
npm install          # installs concurrently at root
npm run dev
```

**Option B — two terminals:**

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd web && npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The API should be on [http://localhost:4000](http://localhost:4000).

### 5. Production build

```bash
npm run build
cd server && npm start
cd web && npm start
```

Use process managers or a host that runs both services; set production env vars and `NODE_ENV=production`.

## API (Express)

| Method | Path | Description |
|--------|------|----------------|
| `GET` | `/health` | Liveness check |
| `POST` | `/analyze` | Body: `{ "companyName": string, "website"?: string }`. Query: `?mode=roast` |
| `GET` | `/reports` | List saved reports (`?limit=50`) |
| `GET` | `/reports/:id` | Full report JSON |
| `DELETE` | `/reports/:id` | Remove a saved report |

The Next app exposes same-origin routes under **`/api/analyze`**, **`/api/reports`**, and **`/api/reports/[id]`** so the browser does not need CORS to the API origin.

## Troubleshooting

- **`Cannot find module './331.js'` (Next.js)** — Stale build cache. From `web/`:  
  `npm run clean` then `npm run dev` (or delete `web/.next` manually).
- **Multiple `package-lock.json` files** — Next may warn about the workspace root; keeping installs under `web/` and `server/` is fine.
- **Scrape hangs** — Heavy sites use Puppeteer with `domcontentloaded` and timeouts; very locked-down sites may return thin content.

## License

Add a `LICENSE` file if you want a specific license for your open repo (e.g. MIT).

## Security note for public repos

- Rotate any key that was ever committed.  
- Use `.gitignore` for `.env`, `server/.env`, `web/.env.local`, and `.next` / `dist`.
