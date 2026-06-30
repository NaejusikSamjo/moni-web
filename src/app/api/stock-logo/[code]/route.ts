import { NextRequest, NextResponse } from "next/server";

const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>`;

const PLACEHOLDER_RESPONSE = new NextResponse(PLACEHOLDER_SVG, {
  headers: {
    "Content-Type": "image/svg+xml",
    "Cache-Control": "public, max-age=86400",
  },
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_STOCK_LOGO_BASE_URL;

  if (!baseUrl) return PLACEHOLDER_RESPONSE;

  try {
    const res = await fetch(`${baseUrl}${code}.svg`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return PLACEHOLDER_RESPONSE;

    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    });
  } catch {
    return PLACEHOLDER_RESPONSE;
  }
}
