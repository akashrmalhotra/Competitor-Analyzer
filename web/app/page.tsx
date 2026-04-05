import Link from "next/link";
import { AnalyzeForm } from "@/components/AnalyzeForm";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
      <div className="mb-10 space-y-3 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          Competitor Analyzer
        </h1>
        <p className="text-balance text-zinc-400">
          Type any startup — get positioning, pricing, growth, gaps, and opportunities in seconds.
        </p>
      </div>
      <AnalyzeForm />
      <p className="mt-8 text-center text-xs text-zinc-600">
        Powered by your stack: Next.js, Express, OpenAI, Puppeteer &amp; Cheerio.{" "}
        <Link href="/results/local" className="text-zinc-500 hover:text-zinc-400">
          Last session report
        </Link>
      </p>
    </main>
  );
}
