import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");
  const referer = searchParams.get("ref") || "https://sn.dplayer82.site/";

  if (!targetUrl) {
    return new NextResponse("URL parameter required", { status: 400 });
  }

  try {
    const rangeHeader = req.headers.get("range");
    const fetchHeaders: Record<string, string> = {
      "User-Agent": CHROME_UA,
      "Referer": referer,
    };

    if (rangeHeader) {
      fetchHeaders["Range"] = rangeHeader;
    }

    const upstreamRes = await fetch(targetUrl, {
      headers: fetchHeaders,
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return new NextResponse(`Upstream error: ${upstreamRes.status}`, { status: upstreamRes.status });
    }

    const contentLength = upstreamRes.headers.get("content-length");
    const contentRange = upstreamRes.headers.get("content-range");
    let contentType = upstreamRes.headers.get("content-type") || "video/mp2t";

    if (targetUrl.includes(".vtt") || targetUrl.endsWith(".vtt")) {
      contentType = "text/vtt; charset=utf-8";
    } else if (contentType.includes("image") || targetUrl.includes(".jpg") || targetUrl.includes(".png")) {
      contentType = "video/mp2t";
    }

    const responseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=86400, immutable",
    };

    if (contentLength) {
      responseHeaders["Content-Length"] = contentLength;
    }
    if (contentRange) {
      responseHeaders["Content-Range"] = contentRange;
    }

    return new Response(upstreamRes.body, {
      status: upstreamRes.status === 206 ? 206 : 200,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return new NextResponse("Stream proxy error: " + err.message, { status: 500 });
  }
}
