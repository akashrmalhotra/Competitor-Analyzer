"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavTabs() {
  const pathname = usePathname();
  const analyze =
    pathname === "/" || (pathname?.startsWith("/results") ?? false);
  const history = pathname === "/history";

  const tab =
    "rounded-lg px-3 py-1.5 text-sm font-medium transition sm:px-4";
  const active = "bg-zinc-800 text-white";
  const idle = "text-zinc-500 hover:text-zinc-300";

  return (
    <nav className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1">
      <Link href="/" className={`${tab} ${analyze ? active : idle}`}>
        Analyze
      </Link>
      <Link href="/history" className={`${tab} ${history ? active : idle}`}>
        Previous reports
      </Link>
    </nav>
  );
}
