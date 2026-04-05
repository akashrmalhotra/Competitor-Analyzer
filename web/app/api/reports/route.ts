import { NextRequest, NextResponse } from "next/server";

const backendUrl =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.search;
  try {
    const res = await fetch(`${backendUrl}/reports${search}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the API server.", reports: [], databaseConfigured: false },
      { status: 502 }
    );
  }
}
