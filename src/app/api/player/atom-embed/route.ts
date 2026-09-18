import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { resolveFullHDSource } from "@/lib/fullhd-resolver";
import { CURL_BIN } from "@/lib/curl";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let targetUrl = searchParams.get("url");
  const title = searchParams.get("title");
  const originalTitle = searchParams.get("originalTitle");

  // If no direct url provided, resolve by title
  if (!targetUrl && title) {
    const resolved = resolveFullHDSource(title, originalTitle);
    if (resolved) {
      targetUrl = resolved.rapidvidUrl;
    }
  }

  const tmdbId = searchParams.get("tmdbId");
  const lang = (searchParams.get("lang") || "tr_dub") as "tr_dub" | "tr_sub";

  if (!targetUrl) {
    if (tmdbId) {
      const fallbackUrl =
        lang === "tr_dub"
          ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&audio=tr`
          : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&sub=Turkish`;

      return new NextResponse(
        `<!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>${title || "Film"}</title>
          <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            html, body { width:100%; height:100%; background:#000; overflow:hidden; }
            iframe { width:100%; height:100%; border:none; display:block; }
            .badge-fallback {
              position: absolute;
              top: 10px;
              left: 12px;
              z-index: 50;
              background: rgba(11, 12, 21, 0.88);
              backdrop-filter: blur(8px);
              border: 1px solid rgba(245, 158, 11, 0.5);
              color: #fbbf24;
              font-size: 11px;
              font-weight: 700;
              padding: 4px 10px;
              border-radius: 8px;
              font-family: -apple-system, BlinkMacSystemFont, sans-serif;
              pointer-events: none;
              display: flex;
              align-items: center;
              gap: 6px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            }
            .dot { width: 6px; height: 6px; border-radius: 50%; background: #fbbf24; animation: pulse 1.5s infinite; }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
          </style>
        </head>
        <body>
          <div class="badge-fallback">
            <span class="dot"></span>
            <span>Otomatik Türkçe Yayın Sunucusu (${lang === "tr_dub" ? "Türkçe Dublaj" : "Türkçe Altyazı"})</span>
          </div>
          <iframe src="${fallbackUrl}" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe>
        </body>
        </html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    return new NextResponse(
      `<html><body style="background:#0b0c15;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;padding:20px;">
        <div>
          <h3>Atom Kaynağı Yüklenemedi</h3>
          <p style="color:#aaa;font-size:13px;">Bu film için Atom sunucusunda kayıt bulunamadı. Lütfen üstteki diğer sunuculardan birini seçin.</p>
        </div>
      </body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  try {
    const curlCmd = `${CURL_BIN} -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Referer: https://www.fullhdfilmizlesene.now/" "${targetUrl}"`;
    let html = execSync(curlCmd, { maxBuffer: 10 * 1024 * 1024, timeout: 15000 }).toString("utf8");

    const baseDomain = targetUrl.startsWith("https://rapidvid.org")
      ? "https://rapidvid.org/"
      : "https://rapidvid.net/";

    if (html.includes("<head>")) {
      html = html.replace("<head>", `<head><base href="${baseDomain}">`);
    } else {
      html = `<head><base href="${baseDomain}"></head>` + html;
    }

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    return new NextResponse("Error fetching embed: " + error.message, { status: 500 });
  }
}
