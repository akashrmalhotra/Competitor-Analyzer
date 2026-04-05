import { ReportHistory } from "@/components/ReportHistory";

export default function HistoryPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
          Previous reports
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Open any report to view the full breakdown. Newest first.
        </p>
      </div>
      <ReportHistory />
    </main>
  );
}
