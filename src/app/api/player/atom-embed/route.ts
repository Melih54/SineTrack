import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { resolveFullHDSource, extractRapidvidDirectM3u8 } from "@/lib/fullhd-resolver";
import { resolveDizibalSource } from "@/lib/dizibal-resolver";
import { renderArtplayerHtml } from "@/lib/artplayer-template";
import { CURL_BIN, getBaseUrl } from "@/lib/curl";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let targetUrl = searchParams.get("url");
  const title = searchParams.get("title");
  const originalTitle = searchParams.get("originalTitle");
  const tmdbId = searchParams.get("tmdbId") ? Number(searchParams.get("tmdbId")) : undefined;
  const lang = (searchParams.get("lang") || "tr_dub") as "tr_dub" | "tr_sub" | "original";

  const baseUrl = getBaseUrl(req);
  let directM3u8: string | undefined;

  // 1. If no direct url provided, resolve by title / originalTitle
  if (!targetUrl && title) {
    const resolved = resolveFullHDSource(title, originalTitle);
    if (resolved) {
      targetUrl = resolved.rapidvidUrl;
      directM3u8 = resolved.directM3u8Url;
    }
  }

  // 2. If targetUrl is given but directM3u8 is not yet extracted
  if (targetUrl && !directM3u8 && targetUrl.includes("rapidvid")) {
    const extracted = extractRapidvidDirectM3u8(targetUrl);
    if (extracted) {
      directM3u8 = extracted;
    }
  }

  // 3. If direct multi-quality master M3U8 is available, render modern Artplayer with full 4K UHD!
  if (directM3u8) {
    const masterStreamUrl = `/api/player/dizi-m3u8?streamUrl=${encodeURIComponent(directM3u8)}&ref=${encodeURIComponent("https://rapidvid.net/")}&lang=${lang}`;

    // Fetch subtitles if available (from Dizibal or HDF)
    let subtitles: Array<{ label: string; lang: string; file: string }> = [];
    if (title) {
      try {
        const dizibal = await resolveDizibalSource({
          title,
          originalTitle,
          tmdbId,
          mediaType: "movie",
        });
        if (dizibal && dizibal.subtitles && dizibal.subtitles.length > 0) {
          subtitles = dizibal.subtitles;
        }
      } catch (e) {}
    }

    const playerHtml = renderArtplayerHtml({
      title: title || "Atom Video",
      originalTitle: originalTitle || null,
      mediaType: "movie",
      tmdbId,
      lang,
      masterStreamUrl,
      subtitles,
      referer: "https://rapidvid.net/",
      provider: "Atom",
      badge: "⚡ Atom 4K UHD",
      themeColor: "#e50914",
    });

    return new NextResponse(playerHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=1800",
      },
    });
  }

  // 4. Fallback: If no direct stream was extracted but targetUrl exists, proxy Rapidvid HTML
  if (targetUrl) {
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

      const injectScript = `<script>
        try {
          window.parent.postMessage({ type: "STREAM_READY", source: "atom-embed" }, "*");
          var v = document.querySelector("video");
          if (v) {
            v.addEventListener("playing", function() {
              window.parent.postMessage({ type: "STREAM_PLAYING", source: "atom-embed" }, "*");
            });
            v.addEventListener("error", function() {
              window.parent.postMessage({ type: "STREAM_ERROR", source: "atom-embed", reason: "VIDEO_ERROR" }, "*");
            });
          }
        } catch(e) {}
      </script>`;

      if (html.includes("</body>")) {
        html = html.replace("</body>", `${injectScript}</body>`);
      } else {
        html += injectScript;
      }

      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch (error: any) {}
  }

  // 5. If everything failed, fallback to DiziBal or return error page
  if (title) {
    return NextResponse.redirect(new URL(`/api/player/dizibal-embed?${searchParams.toString()}`, baseUrl));
  }

  return new NextResponse(
    `<html><body style="background:#0b0c15;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;padding:20px;">
      <div>
        <h3>Atom Kaynağı Yüklenemedi</h3>
        <p style="color:#aaa;font-size:13px;">Bu film için Atom sunucusunda kayıt bulunamadı. Lütfen diğer sunuculardan birini seçin.</p>
      </div>
      <script>
        try {
          window.parent.postMessage({ type: "STREAM_ERROR", source: "atom-embed", reason: "NOT_FOUND" }, "*");
        } catch(e) {}
      </script>
    </body></html>`,
    { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
