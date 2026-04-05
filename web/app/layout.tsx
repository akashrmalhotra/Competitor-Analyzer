import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { NavTabs } from "@/components/NavTabs";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "Competitor Analyzer",
  description: "AI-powered competitor strategy breakdown in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <header className="sticky top-0 z-10 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link
              href="/"
              className="text-sm font-semibold tracking-tight text-white hover:text-zinc-200"
            >
              Competitor Analyzer
            </Link>
            <NavTabs />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
