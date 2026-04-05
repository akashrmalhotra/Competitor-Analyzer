import { NextRequest, NextResponse } from "next/server";

const backendUrl =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000";

export async function POST(request: NextRequest) {
  const search = request.nextUrl.search;
  const body = await request.text();
  try {
    const res = await fetch(`${backendUrl}/analyze${search}`, {
      method: "POST",
      headers: {
        "Content-Type": request.headers.get("Content-Type") ?? "application/json",
      },
      body,
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the API server. Is it running on port 4000?" },
      { status: 502 }
    );
  }
}
